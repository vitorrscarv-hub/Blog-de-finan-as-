const fmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const dataBR = (d: Date) => fmt.format(d);

export const porData = <T extends { data: { date: Date } }>(a: T, b: T) =>
  b.data.date.getTime() - a.data.date.getTime();

export const publicado = <T extends { data: { draft: boolean } }>(e: T) =>
  import.meta.env.DEV || !e.data.draft;

export const minutosDeLeitura = (texto = '') =>
  Math.max(1, Math.round(texto.split(/\s+/).filter(Boolean).length / 200));

// "Internacional" -> "internacional"; usado nos endereços das editorias.
export const slugEditoria = (editoria: string) => editoria.toLowerCase();
