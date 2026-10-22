import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const DIR = new URL('../../.claude/skills/pauta-diaria/edicoes/', import.meta.url);
const { edicoes } = JSON.parse(readFileSync(new URL('edicoes.json', DIR), 'utf8'));

const SECOES = [
  '## Situação',
  '## Leitor e idioma',
  '## Pauta da semana',
  '## Fontes primárias',
  '## Regulação de conteúdo financeiro',
  '## Dados pessoais e cadastro',
  '## Aviso legal (rascunho para revisão jurídica local)',
  '## Domínios para liberar na rede',
  '## Antes de ativar (pendências específicas)',
];

test('códigos e caminhos únicos, com o Brasil na raiz', () => {
  const codigos = edicoes.map((e) => e.codigo);
  assert.equal(new Set(codigos).size, codigos.length);
  const caminhos = edicoes.map((e) => e.caminho);
  assert.equal(new Set(caminhos).size, caminhos.length);
  assert.equal(edicoes.find((e) => e.codigo === 'br')?.caminho, '/');
});

test('horário da pauta no fuso da própria edição: Brasil diário (10h30 e 18h45, segunda a sábado), demais às terças', () => {
  const br = edicoes.find((e) => e.codigo === 'br');
  assert.deepEqual(br.turnos, { manha: 'CRON_TZ=America/Sao_Paulo 30 10 * * 1-6', noite: 'CRON_TZ=America/Sao_Paulo 45 18 * * 1-6' });
  for (const e of edicoes.filter((x) => x.codigo !== 'br')) {
    assert.match(e.cron, new RegExp(`^CRON_TZ=${e.fuso} \\d{1,2} \\d{1,2} \\* \\* 2$`), e.codigo);
  }
});

test('cada edição fora do Brasil tem o modelo completo', () => {
  for (const e of edicoes.filter((x) => x.codigo !== 'br')) {
    const arquivo = new URL(e.manual, DIR);
    assert.ok(existsSync(arquivo), `${e.codigo}: falta ${e.manual}`);
    const texto = readFileSync(arquivo, 'utf8');
    assert.ok(texto.startsWith(`# Edição ${e.pais}`), `${e.codigo}: título`);
    for (const s of SECOES) assert.ok(texto.includes(s), `${e.codigo}: falta a seção "${s}"`);
    const dominios = texto.split('## Domínios para liberar na rede')[1].split('\n## ')[0];
    assert.match(dominios, /`[a-z0-9.-]+\.[a-z]{2,}`/, `${e.codigo}: lista de domínios vazia`);
    assert.doesNotMatch(texto, /[—–]/, `${e.codigo}: travessão`);
  }
});

test('só o Brasil está ativo até alguém ativar outra edição de propósito', () => {
  // Ao ativar uma edição (COMO-ATIVAR.md, passo 5), atualize esta lista no mesmo pull request.
  const ATIVAS = ['br'];
  assert.deepEqual(edicoes.filter((e) => e.ativa).map((e) => e.codigo), ATIVAS);
});
