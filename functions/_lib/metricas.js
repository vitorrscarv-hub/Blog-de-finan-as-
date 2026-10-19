// Consultas do painel de audiência. Recebe um vínculo D1 (ou qualquer objeto com prepare/bind/all)
// e devolve os números já agregados. Dias em horário de Brasília (UTC-3, sem horário de verão).

const FUSO_MS = -3 * 3600_000;
const DIA_MS = 86_400_000;
// Matérias: /noticias/<slug>/ (menos as páginas de editoria) e /guias/<slug>/.
const MATERIA = `((caminho LIKE '/noticias/_%/' AND caminho NOT IN ('/noticias/brasil/','/noticias/mercado/','/noticias/internacional/')) OR caminho LIKE '/guias/_%/')`;
const DIA_SQL = `strftime('%Y-%m-%d', (ts - ${-FUSO_MS}) / 1000, 'unixepoch')`;
// Leu "até o fim" quando passou de 75% do corpo do texto.
const CONCLUIU = 75;

export const PERIODOS = [7, 30, 90];

const diaDe = (ms) => new Date(ms + FUSO_MS).toISOString().slice(0, 10);

export function limitesDoPeriodo(dias, agora = Date.now()) {
  const inicioDeHoje = Math.floor((agora + FUSO_MS) / DIA_MS) * DIA_MS - FUSO_MS;
  const de = inicioDeHoje - (dias - 1) * DIA_MS;
  return { de, ate: inicioDeHoje + DIA_MS };
}

async function todas(db, sql, ...params) {
  return (await db.prepare(sql).bind(...params).all()).results ?? [];
}
const primeira = async (db, sql, ...params) => (await todas(db, sql, ...params))[0] ?? {};
const arred = (n, casas = 1) => (n == null ? null : Math.round(n * 10 ** casas) / 10 ** casas);

export async function resumir(db, dias, agora = Date.now()) {
  const { de, ate } = limitesDoPeriodo(dias, agora);
  const janela = `ts >= ? AND ts < ?`;

  const t = await primeira(
    db,
    `SELECT COUNT(*) AS visitas, COUNT(DISTINCT visitante) AS visitantes, COUNT(DISTINCT sessao) AS sessoes
     FROM visitas WHERE ${janela}`,
    de,
    ate
  );

  const leitura = await primeira(
    db,
    `SELECT COUNT(*) AS leituras,
            AVG(CASE WHEN segundos > 0 THEN segundos END) AS segundos_medios,
            AVG(rolagem) AS rolagem_media,
            SUM(CASE WHEN rolagem >= ${CONCLUIU} THEN 1 ELSE 0 END) AS concluiram
     FROM visitas WHERE ${janela} AND ${MATERIA}`,
    de,
    ate
  );

  const porDiaBruto = await todas(
    db,
    `SELECT ${DIA_SQL} AS dia, COUNT(*) AS visitas, COUNT(DISTINCT visitante) AS visitantes
     FROM visitas WHERE ${janela} GROUP BY dia`,
    de,
    ate
  );
  const mapaDia = new Map(porDiaBruto.map((r) => [r.dia, r]));
  const porDia = [];
  for (let i = 0; i < dias; i++) {
    const dia = diaDe(de + i * DIA_MS);
    const r = mapaDia.get(dia);
    porDia.push({ dia, visitas: r?.visitas ?? 0, visitantes: r?.visitantes ?? 0 });
  }

  const materias = await todas(
    db,
    `SELECT caminho, COUNT(*) AS visitas, COUNT(DISTINCT visitante) AS leitores,
            AVG(CASE WHEN segundos > 0 THEN segundos END) AS segundos_medios,
            AVG(rolagem) AS rolagem_media,
            SUM(CASE WHEN rolagem >= ${CONCLUIU} THEN 1 ELSE 0 END) AS concluiram
     FROM visitas WHERE ${janela} AND ${MATERIA}
     GROUP BY caminho ORDER BY visitas DESC, leitores DESC, caminho LIMIT 20`,
    de,
    ate
  );

  const origens = await todas(
    db,
    `SELECT COALESCE(origem, 'Acesso direto ou sem origem') AS origem, COUNT(*) AS visitas
     FROM visitas WHERE ${janela} GROUP BY 1 ORDER BY visitas DESC, origem LIMIT 10`,
    de,
    ate
  );
  const dispositivos = await todas(
    db,
    `SELECT dispositivo, COUNT(*) AS visitas FROM visitas WHERE ${janela} GROUP BY dispositivo ORDER BY visitas DESC`,
    de,
    ate
  );
  const paises = await todas(
    db,
    `SELECT COALESCE(pais, 'Sem informação') AS pais, COUNT(*) AS visitas
     FROM visitas WHERE ${janela} GROUP BY 1 ORDER BY visitas DESC, pais LIMIT 8`,
    de,
    ate
  );
  const entradas = await todas(
    db,
    `SELECT caminho, COUNT(*) AS sessoes FROM (
       SELECT sessao, caminho, ROW_NUMBER() OVER (PARTITION BY sessao ORDER BY ts) AS n
       FROM visitas WHERE ${janela}
     ) WHERE n = 1 GROUP BY caminho ORDER BY sessoes DESC, caminho LIMIT 8`,
    de,
    ate
  );

  // Retorno: quantos dias diferentes cada visitante apareceu no período, e se já tinha aparecido antes dele.
  const visitantes = await todas(
    db,
    `SELECT visitante, COUNT(*) AS visitas, COUNT(DISTINCT ${DIA_SQL}) AS dias,
            MIN(ts) AS primeira, MAX(ts) AS ultima,
            EXISTS (SELECT 1 FROM visitas v2 WHERE v2.visitante = visitas.visitante AND v2.ts < ?) AS antes
     FROM visitas WHERE ${janela} GROUP BY visitante`,
    de,
    de,
    ate
  );
  const recorrente = (v) => v.dias > 1 || v.antes === 1;
  const voltaram = visitantes.filter(recorrente).length;
  const faixa = (v) => (v.dias >= 5 ? '5 ou mais' : v.dias >= 3 ? '3 a 4' : String(v.dias));
  const ordemFaixas = ['1', '2', '3 a 4', '5 ou mais'];
  const distribuicao = ordemFaixas.map((f) => ({ faixa: f, visitantes: visitantes.filter((v) => faixa(v) === f).length }));
  const recorrentes = visitantes
    .filter(recorrente)
    .sort((a, b) => b.dias - a.dias || b.visitas - a.visitas || b.ultima - a.ultima)
    .slice(0, 15);
  for (const v of recorrentes) {
    v.materias = (
      await todas(
        db,
        `SELECT DISTINCT caminho FROM visitas WHERE visitante = ? AND ${janela} AND ${MATERIA} ORDER BY ts DESC LIMIT 6`,
        v.visitante,
        de,
        ate
      )
    ).map((r) => r.caminho);
  }

  return {
    periodo: { dias, de: diaDe(de), ate: diaDe(ate - 1) },
    totais: {
      visitas: t.visitas ?? 0,
      visitantes: t.visitantes ?? 0,
      sessoes: t.sessoes ?? 0,
      voltaram,
      taxaRetorno: visitantes.length ? arred((100 * voltaram) / visitantes.length) : 0,
      leituras: leitura.leituras ?? 0,
      segundosMedios: arred(leitura.segundos_medios, 0),
      rolagemMedia: arred(leitura.rolagem_media, 0),
      concluiram: leitura.concluiram ?? 0,
      taxaConclusao: leitura.leituras ? arred((100 * (leitura.concluiram ?? 0)) / leitura.leituras) : 0,
    },
    porDia,
    materias: materias.map((m) => ({
      caminho: m.caminho,
      visitas: m.visitas,
      leitores: m.leitores,
      segundosMedios: arred(m.segundos_medios, 0),
      rolagemMedia: arred(m.rolagem_media, 0),
      taxaConclusao: m.visitas ? arred((100 * m.concluiram) / m.visitas) : 0,
    })),
    origens,
    dispositivos,
    paises,
    entradas,
    retorno: {
      distribuicao,
      recorrentes: recorrentes.map((v) => ({
        visitante: v.visitante.slice(0, 8),
        visitas: v.visitas,
        dias: v.dias,
        primeira: new Date(v.primeira + FUSO_MS).toISOString().slice(0, 16).replace('T', ' '),
        ultima: new Date(v.ultima + FUSO_MS).toISOString().slice(0, 16).replace('T', ' '),
        jaTinhaVisitado: v.antes === 1,
        materias: v.materias,
      })),
    },
  };
}
