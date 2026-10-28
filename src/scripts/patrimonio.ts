// Seleção da seção "Seu patrimônio" (SITE.patrimonio): matérias e depois guias, na ordem da configuração.
import type { CollectionEntry } from 'astro:content';
import { SITE } from '../site.config';
import { slugEditoria } from './formatos';

export interface ItemPatrimonio {
  href: string;
  title: string;
  description: string;
  date: Date;
  etiqueta: string;
  etiquetaHref?: string;
}

export function selecaoPatrimonio(noticias: CollectionEntry<'noticias'>[], guias: CollectionEntry<'guias'>[]): ItemPatrimonio[] {
  const materias = SITE.patrimonio.materias.flatMap((id) => noticias.find((n) => n.id === id) ?? []).map((n) => ({
    href: `/noticias/${n.id}/`,
    title: n.data.title,
    description: n.data.description,
    date: n.data.date,
    etiqueta: n.data.editoria,
    etiquetaHref: `/noticias/${slugEditoria(n.data.editoria)}/`,
  }));
  const textos = SITE.patrimonio.guias.flatMap((id) => guias.find((g) => g.id === id) ?? []).map((g) => ({
    href: `/guias/${g.id}/`,
    title: g.data.title,
    description: g.data.description,
    date: g.data.date,
    etiqueta: `Guia · ${g.data.tema}`,
  }));
  return [...materias, ...textos];
}
