import { z } from 'zod';
import {
  isWithinLoyaltyWindow,
  loyaltyInstant,
  MAX_LOYALTY_DAYS,
} from './loyalty-input';

export const LOYALTY_WINDOW_MESSAGE = `Escolha um fim depois de agora e até ${MAX_LOYALTY_DAYS.toLocaleString('pt-BR')} dias.`;

// Validação antes de enviar: clube, data e hora obrigatórios e a janela da fidelidade. Caixa,
// elenco cheio e recompra ficam com a API, que recusa com o message.
export function buyFormSchema(now: number) {
  return z
    .object({
      clubId: z.string().min(1, 'Escolha o clube comprador.'),
      date: z.string().min(1, 'Informe a data.'),
      time: z.string().min(1, 'Informe a hora.'),
    })
    .superRefine((values, context) => {
      if (!values.date || !values.time) {
        return;
      }
      const instant = loyaltyInstant(values.date, values.time);
      if (Number.isNaN(instant)) {
        context.addIssue({
          code: 'custom',
          path: ['date'],
          message: 'Informe uma data e hora válidas.',
        });
        return;
      }
      if (!isWithinLoyaltyWindow(instant, now)) {
        context.addIssue({
          code: 'custom',
          path: ['date'],
          message: LOYALTY_WINDOW_MESSAGE,
        });
      }
    });
}

export type BuyFormValues = z.input<ReturnType<typeof buyFormSchema>>;
