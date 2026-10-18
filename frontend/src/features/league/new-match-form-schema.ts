import { z } from 'zod';

// Validação antes de enviar: os dois clubes escolhidos e diferentes. Clube sem escalação completa
// fica com a API, que recusa com o message (409).
export const newMatchFormSchema = z
  .object({
    homeClubId: z.string().min(1, 'Escolha o mandante.'),
    awayClubId: z.string().min(1, 'Escolha o visitante.'),
  })
  .refine((values) => values.homeClubId !== values.awayClubId, {
    path: ['awayClubId'],
    message: 'Escolha um clube diferente do mandante.',
  });

export type NewMatchFormValues = z.input<typeof newMatchFormSchema>;
