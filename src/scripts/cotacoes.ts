// Uma só chamada à função /api/cotacoes por vez, compartilhada pela tarja e pela faixa de indicadores.
// Resultado guardado por 30 segundos; falha devolve null (cada componente mantém o que já mostra).
import { SITE } from '../site.config';

export interface Indicador { nome: string; valor: string; data: string }
export interface RespostaFuncao {
  itens: { simbolo: string; nome: string; preco: number; variacao: number | null }[];
  ptax: { valor: number; variacao: number | null; data: string | null } | null;
  indicadores?: Indicador[];
}

let ultima: { quando: number; promessa: Promise<RespostaFuncao | null> } | null = null;

export function buscarFuncao(): Promise<RespostaFuncao | null> {
  if (ultima && Date.now() - ultima.quando < 30_000) return ultima.promessa;
  const promessa = fetch(SITE.tarja.endpoint, { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? (r.json() as Promise<RespostaFuncao>) : null))
    .catch(() => null);
  ultima = { quando: Date.now(), promessa };
  return promessa;
}
