// Monta os destaques do carrossel da capa. As matérias vêm da lista de SITE.capa.carrossel.materias, na ordem dela,
// sem as fixadas na coluna. Com a janela de tecnologia ligada, a notícia de Tecnologia mais recente (até `dias` dias)
// ocupa sempre a posição reservada, mesmo que não esteja na lista; sem notícia recente, a janela some e a lista
// preenche o carrossel normalmente.

type Noticia = { id: string; data: { date: Date; editoria: string } };
type Janela = { ativo: boolean; editoria: string; posicao: number; dias: number };
type Carrossel = { ativo: boolean; maximo: number; materias: string[]; janela?: Janela };

export function montarDestaques<N extends Noticia>(
  noticias: N[],
  carrossel: Carrossel,
  fixadas: Record<string, number>,
  agora: Date = new Date()
): N[] {
  if (!carrossel.ativo) return [];
  const livre = (n: N) => !(n.id in fixadas);
  const lista = carrossel.materias.flatMap((id) => noticias.find((n) => n.id === id && livre(n)) ?? []);
  const j = carrossel.janela;
  if (!j?.ativo) return lista.slice(0, carrossel.maximo);
  const corte = agora.getTime() - j.dias * 86400_000;
  const janela = noticias
    .filter((n) => livre(n) && n.data.editoria === j.editoria && n.data.date.getTime() >= corte)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())[0];
  if (!janela) return lista.slice(0, carrossel.maximo);
  const outros = lista.filter((n) => n !== janela).slice(0, carrossel.maximo - 1);
  outros.splice(Math.min(Math.max(j.posicao - 1, 0), outros.length), 0, janela);
  return outros;
}
