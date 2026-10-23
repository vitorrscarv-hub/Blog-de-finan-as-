// Data da última mudança de cada página de conteúdo (updated, ou date), lida no cabeçalho dos arquivos .md.
// Usada pelo sitemap (lastmod), para o Google saber o que mudou sem reler o site inteiro. Rascunhos ficam de fora.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const campo = (cab, nome) => new RegExp(`^${nome}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm').exec(cab)?.[1];

export function lerDatas(raiz = 'src/content') {
  const datas = new Map();
  for (const [pasta, rota] of [['noticias', '/noticias/'], ['guias', '/guias/']]) {
    let arquivos = [];
    try {
      arquivos = readdirSync(join(raiz, pasta)).filter((f) => f.endsWith('.md'));
    } catch {
      continue;
    }
    for (const f of arquivos) {
      const cab = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(raiz, pasta, f), 'utf8'))?.[1] ?? '';
      if (/^draft:\s*true/m.test(cab)) continue;
      const data = campo(cab, 'updated') ?? campo(cab, 'date');
      if (data) datas.set(`${rota}${f.replace(/\.md$/, '')}/`, data);
    }
  }
  return datas;
}

// Página de lista (home, /noticias/, editorias, /guias/): a data mais recente entre as matérias que ela mostra.
export function lastmodDe(caminho, datas) {
  if (datas.has(caminho)) return datas.get(caminho);
  const dentro = [...datas].filter(([p]) => caminho === '/' || p.startsWith(caminho.startsWith('/noticias/') ? '/noticias/' : caminho));
  return dentro.length ? dentro.map(([, d]) => d).sort().at(-1) : undefined;
}
