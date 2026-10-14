import { z } from 'zod';
import { hasControlCharacter, normalizeSpaces } from '../text/text';

// V2: número JSON inteiro; "15" e 50.5 são recusados, 50.0 vale 50.
export function integerBetween(min: number, max: number) {
  return z.number().int().min(min).max(max);
}

// V4: recusa caracteres de controle e normaliza os espaços antes de validar o texto.
export function normalizedText() {
  return z
    .string()
    .refine((text) => !hasControlCharacter(text), {
      message: 'não pode ter caracteres de controle',
    })
    .transform(normalizeSpaces);
}
