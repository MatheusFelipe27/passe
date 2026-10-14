import { toSortKey } from '../../common/text/text';
import { Prisma } from '../../generated/prisma/client';
import { ListPlayersQuery, PlayerSortKey } from './dto/list-players.query';
import { marketValueSql } from './market-value.sql';

const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g;

// Ordem alfabética das Premissas: minúsculas, sem acentos e comparação pela ordem Unicode.
const BY_NAME = Prisma.sql`j.nome_ordenacao COLLATE "C"`;

// RN07: GOL, ZAG, LAT, MEI, ATA, de trás para frente.
const BY_POSITION = Prisma.sql`CASE j.posicao WHEN 'GOL' THEN 1 WHEN 'ZAG' THEN 2 WHEN 'LAT' THEN 3 WHEN 'MEI' THEN 4 ELSE 5 END`;

const ORDER_BY: Record<PlayerSortKey, Prisma.Sql> = {
  name: Prisma.sql`${BY_NAME} ASC`,
  value_asc: Prisma.sql`${marketValueSql} ASC`,
  value_desc: Prisma.sql`${marketValueSql} DESC`,
  age_asc: Prisma.sql`j.idade ASC`,
  age_desc: Prisma.sql`j.idade DESC`,
  position: Prisma.sql`${BY_POSITION} ASC`,
};

export function buildPlayersFilter(query: ListPlayersQuery): Prisma.Sql {
  const filters = [Prisma.sql`j.excluido_em IS NULL`];
  if (query.search !== undefined) {
    filters.push(
      Prisma.sql`j.nome_ordenacao LIKE ${toContainsPattern(query.search)} ESCAPE '\\'`,
    );
  }
  if (query.position !== undefined) {
    filters.push(Prisma.sql`j.posicao = ${query.position}`);
  }
  if (query.condition !== undefined) {
    filters.push(Prisma.sql`j.condicao = ${query.condition}`);
  }
  if (query.free !== undefined) {
    filters.push(
      query.free
        ? Prisma.sql`j.clube_id IS NULL`
        : Prisma.sql`j.clube_id IS NOT NULL`,
    );
  }
  if (query.clubId !== undefined) {
    filters.push(Prisma.sql`j.clube_id = ${query.clubId}`);
  }
  if (query.age !== undefined) {
    filters.push(
      Prisma.sql`j.idade BETWEEN ${query.age.min} AND ${query.age.max}`,
    );
  }
  if (query.marketValue !== undefined) {
    filters.push(
      Prisma.sql`${marketValueSql} BETWEEN ${query.marketValue.min.toFixed(2)}::numeric AND ${query.marketValue.max.toFixed(2)}::numeric`,
    );
  }
  return Prisma.join(filters, ' AND ');
}

// RN07: o empate de qualquer ordenação é desfeito pelo nome e depois pelo id.
export function buildPlayersOrder(sort: PlayerSortKey[]): Prisma.Sql {
  const tieBreakers = [Prisma.sql`${BY_NAME} ASC`, Prisma.sql`j.id ASC`];
  return Prisma.join([...sort.map((key) => ORDER_BY[key]), ...tieBreakers]);
}

function toContainsPattern(search: string): string {
  const escaped = toSortKey(search).replace(LIKE_SPECIAL_CHARACTERS, '\\$&');
  return `%${escaped}%`;
}
