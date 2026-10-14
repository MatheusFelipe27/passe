import { Prisma } from '../../generated/prisma/client';

// RN05 em SQL, só para filtrar e ordenar a listagem (RN07) no banco, sobre a tabela com o alias "j".
// A regra de referência é calculateMarketValue; o teste de equivalência confere que os dois dão o mesmo valor.
export const marketValueSql = Prisma.sql`
  GREATEST(
    ROUND(
      j.valor_base * (100 + GREATEST(
        (CASE WHEN j.idade <= 21 THEN 10 WHEN j.idade >= 32 THEN -10 ELSE 0 END)
        - (CASE
            WHEN j.condicao = 'APTO' THEN 0
            ELSE (CASE j.condicao WHEN 'MAL_CONDICIONADO' THEN 15 ELSE 30 END)
              * (CASE WHEN j.agilidade >= 80 THEN 0.5 ELSE 1 END)
              + (CASE WHEN j.agilidade <= 30 THEN 10 ELSE 0 END)
          END),
        -40
      )) / 100,
      2
    ),
    1.00
  )`;
