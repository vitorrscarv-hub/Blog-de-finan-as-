// Símbolo do Grafous: capitais de grandes economias nas posições geográficas reais
// (projeção equirretangular, com a longitude comprimida para o símbolo não ficar comprido demais),
// ligadas por arcos como rotas. Brasília tem destaque: é o ponto de vista do leitor.
// Usado pela logo do site (Logo.astro) e por scripts/gerar-marca.mjs (favicon e imagem de compartilhamento).

type Capital = { nome: string; lat: number; lon: number; destaque?: boolean };

export const CAPITAIS: Capital[] = [
  { nome: 'Washington', lat: 38.91, lon: -77.04 },
  { nome: 'Brasília', lat: -15.79, lon: -47.88, destaque: true },
  { nome: 'Londres', lat: 51.51, lon: -0.13 },
  { nome: 'Pretória', lat: -25.75, lon: 28.19 },
  { nome: 'Nova Délhi', lat: 28.61, lon: 77.21 },
  { nome: 'Pequim', lat: 39.9, lon: 116.41 },
  { nome: 'Tóquio', lat: 35.69, lon: 139.69 },
  { nome: 'Canberra', lat: -35.28, lon: 149.13 },
];

// Pares de capitais ligadas (pelo nome): um anel pelo norte, outro pelo sul e pontes entre eles.
export const LIGACOES: [string, string][] = [
  ['Washington', 'Londres'],
  ['Londres', 'Nova Délhi'],
  ['Nova Délhi', 'Pequim'],
  ['Pequim', 'Tóquio'],
  ['Brasília', 'Pretória'],
  ['Pretória', 'Canberra'],
  ['Washington', 'Brasília'],
  ['Brasília', 'Londres'],
  ['Pretória', 'Nova Délhi'],
  ['Tóquio', 'Canberra'],
];

const ESCALA_X = 0.62; // comprime a longitude
const MARGEM = 8;

const ponto = (c: Capital) => ({ x: c.lon * ESCALA_X, y: -c.lat });

export function geometria() {
  const pts = CAPITAIS.map((c) => ({ ...c, ...ponto(c) }));
  const minX = Math.min(...pts.map((p) => p.x)) - MARGEM;
  const maxX = Math.max(...pts.map((p) => p.x)) + MARGEM;
  const minY = Math.min(...pts.map((p) => p.y)) - MARGEM;
  const maxY = Math.max(...pts.map((p) => p.y)) + MARGEM;
  const por = new Map(pts.map((p) => [p.nome, p]));
  // Cada ligação vira um arco suave que sobe, como as rotas de voo nos mapas.
  const arcos = LIGACOES.map(([a, b]) => {
    const p = por.get(a)!;
    const q = por.get(b)!;
    const mx = (p.x + q.x) / 2;
    const my = (p.y + q.y) / 2 - Math.hypot(q.x - p.x, q.y - p.y) * 0.1;
    return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  });
  return {
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}`,
    proporcao: (maxX - minX) / (maxY - minY),
    pontos: pts,
    arcos,
  };
}

// SVG completo do símbolo, para os arquivos gerados fora do Astro.
// `peso` engrossa traços e nós para tamanhos pequenos (favicon).
export function simboloSvg({ cor = '#d4b46a', fundo, largura, peso = 1 }: { cor?: string; fundo?: string; largura?: number; peso?: number } = {}) {
  const g = geometria();
  const [x, y, w, h] = g.viewBox.split(' ').map(Number);
  const tamanho = largura ? ` width="${largura}" height="${(largura / g.proporcao).toFixed(0)}"` : '';
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.viewBox}"${tamanho}>`,
    fundo ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fundo}"/>` : '',
    // Linha do Equador, tracejada e discreta; some nos tamanhos pequenos (peso > 1).
    peso > 1 ? '' : `<line x1="${x + 2}" y1="0" x2="${x + w - 2}" y2="0" stroke="${cor}" stroke-width="0.6" stroke-dasharray="1.5 2.5" opacity="0.45"/>`,
    `<g fill="none" stroke="${cor}" stroke-width="${(1.3 * peso).toFixed(2)}" stroke-linecap="round">${g.arcos.map((d) => `<path d="${d}"/>`).join('')}</g>`,
    `<g fill="${cor}">${g.pontos
      .map((p) =>
        p.destaque
          ? `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(4 * peso).toFixed(2)}"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(4 * peso + 3.2).toFixed(2)}" fill="none" stroke="${cor}" stroke-width="${(1.1 * peso).toFixed(2)}"/>`
          : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(3.2 * peso).toFixed(2)}"/>`
      )
      .join('')}</g>`,
    '</svg>',
  ].join('');
}
