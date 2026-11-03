// Leitura da API pública da B3 (sistemaswebb3-listados.b3.com.br) pelos scripts (sem IA). Só leitura (GET), com curl.
// A B3 recusa (403) consultas que se apresentam como navegador: o curl vai com o user agent padrão dele.
// Em caso de falha momentânea, tenta de novo com intervalo, para não martelar o servidor.
import { execFileSync } from 'node:child_process';

export const BASE_B3 = 'https://sistemaswebb3-listados.b3.com.br';

export const urlDe = (rota, params) => `${BASE_B3}/${rota}/${Buffer.from(JSON.stringify(params)).toString('base64')}`;

const espera = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export function consulta(rota, params, tentativas = 4) {
  const url = urlDe(rota, params);
  for (let i = 1; ; i++) {
    espera(300);
    try {
      const texto = execFileSync('curl', ['-g', '-sS', '-L', '--fail', '--max-time', '30', '-H', 'Accept: application/json', url], {
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      }).toString('utf8');
      const json = JSON.parse(texto);
      // Algumas rotas devolvem o JSON como texto dentro de um texto.
      return typeof json === 'string' ? JSON.parse(json) : json;
    } catch (e) {
      if (i >= tentativas) throw e;
      espera(3000 * i);
    }
  }
}

// "21/12/2026" -> "2026-12-21"; qualquer outra coisa -> null.
export const dia = (s) => (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(s ?? '') ? `${s.slice(6)}-${s.slice(3, 5)}-${s.slice(0, 2)}` : null);

// "0,47156696000" -> 0.47156696
export const numero = (s) => Number(String(s ?? '').replace(/\./g, '').replace(',', '.'));

// Códigos de negociação de uma carteira teórica (IBOV, IFIX...).
export const carteira = (indice) =>
  consulta('indexProxy/indexCall/GetPortfolioDay', { language: 'pt-br', pageNumber: 1, pageSize: 200, index: indice, segment: '1' }).results.map((r) => r.cod);

// Executa em lotes pequenos, para não martelar o servidor. Erro de um item vira { aviso }.
export async function emLotes(itens, n, fn) {
  const saida = [];
  for (let i = 0; i < itens.length; i += n) {
    saida.push(
      ...(await Promise.all(
        itens.slice(i, i + n).map(async (x) => {
          try {
            return await fn(x);
          } catch (e) {
            return { aviso: `${x}: ${String(e.message).split('\n')[0]}` };
          }
        })
      ))
    );
  }
  return saida;
}

// Código ISIN de ação ou unit -> código de negociação. BRPETRACNOR9 -> PETR3; ACNPR -> 4; ACNPA -> 5; ACNPB -> 6; CDAM (unit) -> 11.
export function tickerDoIsin(isin) {
  const m = /^BR([A-Z0-9]{4})(ACNOR|ACNPR|ACNPA|ACNPB|CDAM)/.exec(isin ?? '');
  if (!m) return null;
  return m[1] + { ACNOR: '3', ACNPR: '4', ACNPA: '5', ACNPB: '6', CDAM: '11' }[m[2]];
}
