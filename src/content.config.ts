import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const fonte = z.object({
  titulo: z.string().min(1, 'Toda fonte precisa de título'),
  url: z.url('A url da fonte precisa ser um endereço completo (https://...)'),
});

// Campos comuns: os mesmos que a redação semanal entrega para cada texto.
// Datas sem horário ("2026-10-12") são lidas como meia-noite UTC e exibidas em UTC,
// então o dia mostrado é sempre o mesmo do cabeçalho.
const base = z.object({
  title: z.string().min(1, 'O título é obrigatório'),
  description: z
    .string()
    .min(1, 'A description é obrigatória')
    .max(155, 'A meta description deve ter até 155 caracteres'),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  keywords: z.array(z.string()).max(5, 'Use no máximo 5 palavras-chave').default([]),
  teaser: z.string().optional(),
  fontes: z.array(fonte).default([]),
  // true esconde o texto do build de produção, mas ele continua visível no npm run dev
  draft: z.boolean().default(false),
  // false libera o texto inteiro sem pedir cadastro
  gate: z.boolean().default(true),
});

export const TEMAS = [
  'Previdência',
  'Renda fixa',
  'Proteção e reserva',
  'Fundos',
  'Investimento no exterior',
  'Fundamentos',
] as const;

// Editoria das notícias. Também vira endereço: /noticias/brasil/ e /noticias/internacional/.
export const EDITORIAS = ['Brasil', 'Internacional'] as const;
export type Editoria = (typeof EDITORIAS)[number];

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: base.extend({ editoria: z.enum(EDITORIAS).default('Brasil') }),
});

const guias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guias' }),
  schema: base.extend({ tema: z.enum(TEMAS) }),
});

export const collections = { noticias, guias };
