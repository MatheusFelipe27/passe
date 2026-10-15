import { compareSortKeys, toSortKey } from '../../../common/text/text';
import type { ClubSortKey } from '../dto/list-clubs.query';

interface SortableClub {
  id: number;
  name: string;
  net_worth: number;
}

// RN11: ordena pelo nome ou pelo patrimônio; o empate é desfeito pelo nome e depois pelo id.
export function sortClubs<T extends SortableClub>(
  clubs: T[],
  sort: ClubSortKey,
): T[] {
  const byNetWorth = (a: T, b: T) =>
    sort === 'net_worth_asc'
      ? a.net_worth - b.net_worth
      : sort === 'net_worth_desc'
        ? b.net_worth - a.net_worth
        : 0;
  return [...clubs].sort(
    (a, b) =>
      byNetWorth(a, b) ||
      compareSortKeys(toSortKey(a.name), toSortKey(b.name)) ||
      a.id - b.id,
  );
}
