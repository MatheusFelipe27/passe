import { z } from 'zod';
import { MAX_ID } from '../../../common/pipes/parse-resource-id.pipe';
import { parseBrasiliaDateTime } from '../../../common/time/brasilia-time';
import { integerBetween } from '../../../common/validation/schemas';

// RN01: o fim da fidelidade chega como AAAA-MM-DDTHH:MM-03:00, com data e hora que existam.
const loyaltyUntilSchema = z.string().transform((text, context) => {
  const instant = parseBrasiliaDateTime(text);
  if (!instant) {
    context.addIssue({
      code: 'custom',
      message:
        'deve ser uma data e hora existentes no formato AAAA-MM-DDTHH:MM-03:00',
    });
    return z.NEVER;
  }
  return instant;
});

export const buyPlayerSchema = z
  .object({
    club_id: integerBetween(1, MAX_ID),
    loyalty_until: loyaltyUntilSchema,
  })
  .transform((body) => ({
    clubId: body.club_id,
    loyaltyUntil: body.loyalty_until,
  }));

export type BuyPlayerInput = z.output<typeof buyPlayerSchema>;
