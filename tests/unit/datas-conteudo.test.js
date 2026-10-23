import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lerDatas, lastmodDe } from '../../scripts/lib/datas-conteudo.mjs';

const raiz = mkdtempSync(join(tmpdir(), 'conteudo-'));
mkdirSync(join(raiz, 'noticias'));
mkdirSync(join(raiz, 'guias'));
writeFileSync(join(raiz, 'noticias', '2026-10-20-a.md'), '---\ntitle: "A"\ndate: 2026-10-20\n---\ntexto');
writeFileSync(join(raiz, 'noticias', '2026-10-22-b.md'), '---\ntitle: "B"\ndate: 2026-10-21\nupdated: 2026-10-22\n---\ntexto');
writeFileSync(join(raiz, 'noticias', '2026-10-23-c.md'), '---\ntitle: "C"\ndate: 2026-10-23\ndraft: true\n---\ntexto');
writeFileSync(join(raiz, 'guias', 'g.md'), '---\ntitle: "G"\ndate: 2026-09-01\n---\ntexto');
const datas = lerDatas(raiz);

test('lastmod de cada matéria: updated quando houver, senão date; rascunho fica de fora', () => {
  assert.equal(datas.get('/noticias/2026-10-20-a/'), '2026-10-20');
  assert.equal(datas.get('/noticias/2026-10-22-b/'), '2026-10-22');
  assert.equal(datas.has('/noticias/2026-10-23-c/'), false);
  assert.equal(datas.get('/guias/g/'), '2026-09-01');
});

test('listas usam a matéria mais recente que mostram', () => {
  assert.equal(lastmodDe('/', datas), '2026-10-22');
  assert.equal(lastmodDe('/noticias/', datas), '2026-10-22');
  assert.equal(lastmodDe('/noticias/brasil/', datas), '2026-10-22');
  assert.equal(lastmodDe('/guias/', datas), '2026-09-01');
  assert.equal(lastmodDe('/privacidade/', datas), undefined);
});
