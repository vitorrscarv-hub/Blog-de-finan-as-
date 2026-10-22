// Leitura de feeds RSS de jornais e órgãos, sem dependência. Regras puras, para o radar e os testes.

// Respeita a codificação declarada no XML (a Folha ainda publica em ISO-8859-1).
export function decodificar(buffer) {
  const cabeca = buffer.subarray(0, 200).toString('latin1');
  const cod = /encoding=["']([^"']+)["']/i.exec(cabeca)?.[1]?.toLowerCase() ?? 'utf-8';
  return new TextDecoder(/8859-1|latin1|windows-1252/.test(cod) ? 'latin1' : 'utf-8').decode(buffer);
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
const limpar = (s) =>
  (s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e) =>
      e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTIDADES[e] ?? m)
    )
    .replace(/\s+/g, ' ')
    .trim();
const campo = (bloco, nome) => limpar(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`).exec(bloco)?.[1]);

// -> [{ titulo, link, data (ms) }], do mais novo para o mais antigo.
export function lerRss(xml) {
  return [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)]
    .map((m) => ({ titulo: campo(m[1], 'title'), link: campo(m[1], 'link'), data: Date.parse(campo(m[1], 'pubDate')) }))
    .filter((i) => i.titulo && i.link && Number.isFinite(i.data))
    .sort((a, b) => b.data - a.data);
}
