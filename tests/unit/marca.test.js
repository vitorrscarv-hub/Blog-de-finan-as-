import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPITAIS, LIGACOES, geometria, simboloSvg } from '../../src/scripts/marca.ts';

test('toda ligação do símbolo aponta para uma capital da lista', () => {
  const nomes = new Set(CAPITAIS.map((c) => c.nome));
  for (const [a, b] of LIGACOES) {
    assert.ok(nomes.has(a), a);
    assert.ok(nomes.has(b), b);
  }
});

test('capitais com coordenadas válidas e Brasília em destaque', () => {
  for (const c of CAPITAIS) {
    assert.ok(c.lat >= -90 && c.lat <= 90, c.nome);
    assert.ok(c.lon >= -180 && c.lon <= 180, c.nome);
  }
  assert.deepEqual(CAPITAIS.filter((c) => c.destaque).map((c) => c.nome), ['Brasília']);
});

test('o símbolo gera um SVG com um arco por ligação e um nó por capital', () => {
  const g = geometria();
  assert.equal(g.arcos.length, LIGACOES.length);
  const svg = simboloSvg({ largura: 100 });
  assert.match(svg, /^<svg /);
  assert.equal((svg.match(/<path /g) ?? []).length, LIGACOES.length);
  // Brasília tem dois círculos (nó e anel).
  assert.equal((svg.match(/<circle /g) ?? []).length, CAPITAIS.length + 1);
});
