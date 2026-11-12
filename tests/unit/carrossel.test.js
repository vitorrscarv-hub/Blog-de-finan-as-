import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarDestaques } from '../../src/scripts/carrossel.ts';

const n = (id, dia, editoria = 'Brasil') => ({ id, data: { date: new Date(`2026-11-${dia}T00:00:00Z`), editoria } });
const noticias = [n('a', 12), n('b', 11), n('c', 11), n('d', 10), n('e', 10), n('f', 9), n('tec', 11, 'Tecnologia'), n('tec-velha', 1, 'Tecnologia')];
const agora = new Date('2026-11-12T12:00:00Z');
const janela = { ativo: true, editoria: 'Tecnologia', posicao: 3, dias: 7 };
const ids = (l) => l.map((x) => x.id);

test('sem janela, segue a lista até o máximo', () => {
  const c = { ativo: true, maximo: 3, materias: ['a', 'b', 'c', 'd'] };
  assert.deepEqual(ids(montarDestaques(noticias, c, {}, agora)), ['a', 'b', 'c']);
});

test('janela reserva a posição para a tecnologia mais recente', () => {
  const c = { ativo: true, maximo: 5, materias: ['a', 'b', 'c', 'd', 'e', 'f'], janela };
  assert.deepEqual(ids(montarDestaques(noticias, c, {}, agora)), ['a', 'b', 'tec', 'c', 'd']);
});

test('tecnologia que já está na lista não aparece duas vezes', () => {
  const c = { ativo: true, maximo: 5, materias: ['tec', 'a', 'b', 'c', 'd'], janela };
  assert.deepEqual(ids(montarDestaques(noticias, c, {}, agora)), ['a', 'b', 'tec', 'c', 'd']);
});

test('sem tecnologia recente, a janela some', () => {
  const semRecente = noticias.filter((x) => x.id !== 'tec');
  const c = { ativo: true, maximo: 3, materias: ['a', 'b', 'c', 'd'], janela };
  assert.deepEqual(ids(montarDestaques(semRecente, c, {}, agora)), ['a', 'b', 'c']);
});

test('lista curta: a janela entra no fim; fixada fica de fora', () => {
  const c = { ativo: true, maximo: 5, materias: ['a'], janela };
  assert.deepEqual(ids(montarDestaques(noticias, c, {}, agora)), ['a', 'tec']);
  assert.deepEqual(ids(montarDestaques(noticias, c, { tec: 1 }, agora)), ['a']);
});
