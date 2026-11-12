import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerRss } from '../../scripts/lib/rss.mjs';

test('lê RSS e Atom, do mais novo para o mais antigo', () => {
  const rss = '<rss><channel><item><title>Velha &amp; boa</title><link>https://a.com/1</link><pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>';
  const atom = '<feed><entry><title type="html">Nova</title><link rel="alternate" type="text/html" href="https://b.com/2"/><published>2026-11-12T10:00:00Z</published></entry></feed>';
  const itens = lerRss(rss + atom);
  assert.deepEqual(itens.map((i) => i.titulo), ['Nova', 'Velha & boa']);
  assert.equal(itens[0].link, 'https://b.com/2');
});
