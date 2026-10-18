import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const fonte = z.object({ titulo: z.string(), url: z.string().url() });

// Campos comuns: os mesmos que a redação semanal entrega para cada texto.
const base = z.object({
  title: z.string(),
  description: z.string().max(155, 'A meta description deve ter até 155 caracteres'),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  keywords: z.array(z.string()).max(5).default([]),
  teaser: z.string().optional(),
  fontes: z.array(fonte).default([]),
  draft: z.boolean().default(false),
  // false libera o texto inteiro sem pedir cadastro
  gate: z.boolean().default(true),
});

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: base,
});

const guias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guias' }),
  schema: base.extend({
    tema: z.enum([
      'Previdência',
      'Renda fixa',
      'Proteção e reserva',
      'Fundos',
      'Investimento no exterior',
      'Fundamentos',
    ]),
  }),
});

export const collections = { noticias, guias };
