// Leitura das fontes oficiais pelos scripts (sem IA): Banco Central e IBGE.
// Só leitura (GET), com curl como os outros scripts (respeita o proxy do ambiente e aceita colchetes na URL).
// As regras de leitura são as mesmas da função da Cloudflare (functions/_lib/indicadores.js).
import { execFileSync } from 'node:child_process';

export { URL_SELIC, URL_IPCA, lerSelic, lerIpca12m, itensIndicadores } from '../../functions/_lib/indicadores.js';

export const baixarJson = (url) =>
  JSON.parse(
    execFileSync('curl', ['-g', '-sS', '-L', '--fail', '--retry', '3', '--retry-all-errors', '--max-time', '60', '-H', 'User-Agent: Mozilla/5.0', url], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
  );

// Hoje no fuso de Brasília, como AAAA-MM-DD.
export const hojeBrasilia = (agora = new Date()) => new Date(agora.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
