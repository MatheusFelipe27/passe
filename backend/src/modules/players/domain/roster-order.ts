import { compareSortKeys, toSortKey } from '../../../common/text/text';
import { POSITIONS, Position } from './player.types';

interface RosterMember {
  id: number;
  name: string;
  position: Position;
}

// RN11: ordem do elenco, usada também na escalação e na partida (RN19 e RN20):
// GOL, ZAG, LAT, MEI e ATA, depois o nome (ordem alfabética das Premissas) e depois o id.
export function compareRosterOrder(a: RosterMember, b: RosterMember): number {
  return (
    POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position) ||
    compareSortKeys(toSortKey(a.name), toSortKey(b.name)) ||
    a.id - b.id
  );
}
