import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  clearDatabase,
  createTestPrisma,
} from '../../../test/integration/test-database';
import {
  addClub as insertClub,
  addPlayer as insertPlayer,
  after,
  DAY,
  FixedClock,
  loyaltyText,
  PlayerFields,
} from '../../../test/integration/market-fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { buyPlayerSchema } from '../market/dto/buy-player.schema';
import { MarketRepository } from '../market/market.repository';
import { MarketService } from '../market/market.service';
import { PlayersRepository } from '../players/players.repository';
import { PlayersService } from '../players/players.service';
import { saveLineupSchema } from './dto/save-lineup.schema';
import { LineupsRepository } from './lineups.repository';
import { LineupsService } from './lineups.service';

// Na ordem do elenco: GOL, ZAG, LAT, MEI e ATA, com nomes que já seguem a ordem alfabética.
const LINEUP_2_1_1: [string, string][] = [
  ['Rui Prado', 'GOL'],
  ['Téo Brandão', 'ZAG'],
  ['Davi Lins', 'LAT'],
  ['Lauro Neves', 'MEI'],
  ['Otto Rangel', 'ATA'],
];

describe('escalação no banco', () => {
  let prisma: PrismaService;
  let lineups: LineupsService;
  let market: MarketService;
  let players: PlayersService;

  function addClub(name: string, acronym: string) {
    return insertClub(prisma, name, acronym);
  }

  function addPlayer(fields: Omit<PlayerFields, 'baseValue'>) {
    return insertPlayer(prisma, { baseValue: '10.00', ...fields });
  }

  async function addSquad(clubId: number, squad = LINEUP_2_1_1) {
    const created = [];
    for (const [name, position] of squad) {
      created.push(await addPlayer({ name, position, clubId }));
    }
    return created.map((player) => player.id);
  }

  function save(clubId: number, formation: string, playerIds: number[]) {
    return lineups.save(
      clubId,
      saveLineupSchema.parse({ formation, player_ids: playerIds }),
    );
  }

  async function starterIds(clubId: number): Promise<number[]> {
    const rows = await prisma.lineupEntry.findMany({
      where: { clubId },
      orderBy: { playerId: 'asc' },
    });
    return rows.map((row) => row.playerId);
  }

  async function formationOf(clubId: number) {
    const club = await prisma.club.findUniqueOrThrow({ where: { id: clubId } });
    return club.formation;
  }

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    const clubsRepository = new ClubsRepository(prisma);
    const playersRepository = new PlayersRepository(prisma);
    const lineupsRepository = new LineupsRepository(prisma);
    const transactions = new TransactionRunner(prisma);
    lineups = new LineupsService(
      lineupsRepository,
      clubsRepository,
      transactions,
    );
    market = new MarketService(
      new MarketRepository(prisma),
      clubsRepository,
      playersRepository,
      lineupsRepository,
      transactions,
      new FixedClock(),
    );
    players = new PlayersService(
      playersRepository,
      lineupsRepository,
      clubsRepository,
      transactions,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /clubs/{id}/lineup', () => {
    it('clube que nunca escalou: formação nula, sem titulares e incompleta', async () => {
      const club = await addClub('Águias FC', 'AGU');

      expect(await lineups.find(club.id)).toEqual({
        club_id: club.id,
        formation: null,
        complete: false,
        players: [],
      });
    });

    it('clube inexistente → 404', async () => {
      await expect(lineups.find(999)).rejects.toThrow(
        new NotFoundException('Clube não encontrado.'),
      );
    });

    it('devolve os titulares na ordem do elenco, com os campos do jogador', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const ids = await addSquad(club.id);
      await save(club.id, '2-1-1', [...ids].reverse());

      const lineup = await lineups.find(club.id);

      expect(lineup.complete).toBe(true);
      expect(lineup.formation).toBe('2-1-1');
      expect(lineup.players.map((player) => player.id)).toEqual(ids);
      expect(lineup.players[0]).toEqual(await players.findById(ids[0]));
      expect(lineup.players[0]).toMatchObject({
        name: 'Rui Prado',
        position: 'GOL',
        club_id: club.id,
      });
    });
  });

  describe('PUT /clubs/{id}/lineup', () => {
    it('grava os 5 titulares e a formação, sem mudar o caixa', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const ids = await addSquad(club.id);

      const lineup = await save(club.id, '2-1-1', [
        ids[4],
        ids[2],
        ids[0],
        ids[3],
        ids[1],
      ]);

      expect(lineup).toMatchObject({
        club_id: club.id,
        formation: '2-1-1',
        complete: true,
      });
      expect(lineup.players.map((player) => player.name)).toEqual(
        LINEUP_2_1_1.map(([name]) => name),
      );
      expect(await starterIds(club.id)).toEqual(ids);
      expect(await formationOf(club.id)).toBe('2-1-1');
      const stored = await prisma.club.findUniqueOrThrow({
        where: { id: club.id },
      });
      expect(stored.cash.toFixed(2)).toBe('300.00');
    });

    it('aceita titular MAL_CONDICIONADO', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const ids = await addSquad(club.id);
      await prisma.player.update({
        where: { id: ids[2] },
        data: { condition: 'MAL_CONDICIONADO' },
      });

      const lineup = await save(club.id, '2-1-1', ids);

      expect(lineup.players[2].condition).toBe('MAL_CONDICIONADO');
      expect(lineup.complete).toBe(true);
    });

    it('substitui a escalação inteira, inclusive a formação', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const first = await addSquad(club.id);
      const [secondDefender, striker] = await addSquad(club.id, [
        ['Ari Lopes', 'LAT'],
        ['Zico Reis', 'ATA'],
      ]);
      await save(club.id, '2-1-1', first);

      const lineup = await save(club.id, '2-2', [
        first[0],
        first[1],
        secondDefender,
        first[4],
        striker,
      ]);

      expect(lineup.formation).toBe('2-2');
      expect(await starterIds(club.id)).toEqual(
        [first[0], first[1], first[4], secondDefender, striker].sort(
          (a, b) => a - b,
        ),
      );
      expect(await formationOf(club.id)).toBe('2-2');
    });

    it('escalar de novo os mesmos titulares é aceito', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const ids = await addSquad(club.id);
      await save(club.id, '2-1-1', ids);

      await save(club.id, '2-1-1', ids);

      expect(await starterIds(club.id)).toEqual(ids);
    });

    it('cada clube tem a sua escalação', async () => {
      const aguias = await addClub('Águias FC', 'AGU');
      const delta = await addClub('Delta FC', 'DEL');
      const aguiasIds = await addSquad(aguias.id);
      const deltaIds = await addSquad(delta.id, [
        ['Ivo Teles', 'GOL'],
        ['Hugo Vaz', 'ZAG'],
        ['Lino Matos', 'LAT'],
        ['Nei Soares', 'MEI'],
        ['Ugo Falcão', 'ATA'],
      ]);

      await save(aguias.id, '2-1-1', aguiasIds);
      await save(delta.id, '2-1-1', deltaIds);

      expect(await starterIds(aguias.id)).toEqual(aguiasIds);
      expect(await starterIds(delta.id)).toEqual(deltaIds);
    });

    describe('recusas, sem gravar nada', () => {
      let clubId: number;
      let ids: number[];

      beforeEach(async () => {
        clubId = (await addClub('Águias FC', 'AGU')).id;
        ids = await addSquad(clubId);
        await save(clubId, '2-1-1', ids);
      });

      async function expectUnchanged() {
        expect(await starterIds(clubId)).toEqual(ids);
        expect(await formationOf(clubId)).toBe('2-1-1');
      }

      it('clube inexistente → 404, antes de conferir os jogadores', async () => {
        await expect(
          save(999, '2-1-1', [990, 991, 992, 993, 994]),
        ).rejects.toThrow(new NotFoundException('Clube não encontrado.'));
      });

      it('jogador inexistente → 404', async () => {
        await expect(
          save(clubId, '2-1-1', [...ids.slice(0, 4), 9999]),
        ).rejects.toThrow(new NotFoundException('Jogador não encontrado.'));
        await expectUnchanged();
      });

      it('jogador excluído → 404', async () => {
        const removed = await addPlayer({
          name: 'Zeca Antigo',
          position: 'ATA',
        });
        await players.remove(removed.id);

        await expect(
          save(clubId, '2-1-1', [...ids.slice(0, 4), removed.id]),
        ).rejects.toThrow(new NotFoundException('Jogador não encontrado.'));
        await expectUnchanged();
      });

      it('jogador livre → 409', async () => {
        const free = await addPlayer({ name: 'Livre Leve', position: 'ATA' });

        await expect(
          save(clubId, '2-1-1', [...ids.slice(0, 4), free.id]),
        ).rejects.toThrow(
          new ConflictException('Livre Leve não é do elenco do Águias FC.'),
        );
        await expectUnchanged();
      });

      it('jogador de outro clube → 409', async () => {
        const other = await addClub('Delta FC', 'DEL');
        const [outsider] = await addSquad(other.id, [['Ugo Falcão', 'ATA']]);

        await expect(
          save(clubId, '2-1-1', [...ids.slice(0, 4), outsider]),
        ).rejects.toThrow(
          new ConflictException('Ugo Falcão não é do elenco do Águias FC.'),
        );
        await expectUnchanged();
      });

      it('jogador DOENTE → 409', async () => {
        const [sick] = await addSquad(clubId, [['Zé Doente', 'ATA']]);
        await prisma.player.update({
          where: { id: sick },
          data: { condition: 'DOENTE' },
        });

        await expect(
          save(clubId, '2-1-1', [...ids.slice(0, 4), sick]),
        ).rejects.toThrow(
          new ConflictException(
            'Zé Doente está DOENTE e não pode ser escalado.',
          ),
        );
        await expectUnchanged();
      });

      it('posições que não fecham a formação → 409', async () => {
        await expect(save(clubId, '3-1', ids)).rejects.toThrow(
          new ConflictException(
            'As posições não fecham a formação 3-1: ela pede 1 GOL, 3 entre ZAG e LAT e 1 ATA.',
          ),
        );
        await expectUnchanged();
      });

      it('sem goleiro → 409', async () => {
        const [defender] = await addSquad(clubId, [['Beto Zaga', 'ZAG']]);

        await expect(
          save(clubId, '3-1', [defender, ...ids.slice(1)]),
        ).rejects.toThrow(ConflictException);
        await expectUnchanged();
      });
    });
  });

  describe('o titular sai da escalação (RN19, item 5)', () => {
    let clubId: number;
    let ids: number[];

    beforeEach(async () => {
      clubId = (await addClub('Águias FC', 'AGU')).id;
      const created = [];
      for (const [name, position] of LINEUP_2_1_1) {
        created.push(await addPlayer({ name, position }));
      }
      ids = created.map((player) => player.id);
      for (const id of ids) {
        await market.buy(
          id,
          buyPlayerSchema.parse({
            club_id: clubId,
            loyalty_until: loyaltyText(after(DAY)),
          }),
        );
      }
      await save(clubId, '2-1-1', ids);
    });

    it('vendido: a escalação fica incompleta, com a mesma formação', async () => {
      await market.sell(ids[4]);

      const lineup = await lineups.find(clubId);

      expect(lineup).toMatchObject({ formation: '2-1-1', complete: false });
      expect(lineup.players.map((player) => player.id)).toEqual(
        ids.slice(0, 4),
      );
    });

    it('passa a DOENTE: sai e não volta sozinho quando melhora', async () => {
      await players.changeCondition(ids[0], 'DOENTE');
      await players.changeCondition(ids[0], 'MAL_CONDICIONADO');

      const lineup = await lineups.find(clubId);

      expect(lineup.complete).toBe(false);
      expect(lineup.players.map((player) => player.id)).toEqual(ids.slice(1));
    });

    it('volta a ficar completa quando o clube escala de novo', async () => {
      await market.sell(ids[4]);
      const [striker] = await addSquad(clubId, [['Zico Reis', 'ATA']]);

      const lineup = await save(clubId, '2-1-1', [...ids.slice(0, 4), striker]);

      expect(lineup.complete).toBe(true);
    });

    it('o vendido pode ser escalado pelo clube que o comprar', async () => {
      await market.sell(ids[4]);
      const delta = await addClub('Delta FC', 'DEL');
      await market.buy(
        ids[4],
        buyPlayerSchema.parse({
          club_id: delta.id,
          loyalty_until: loyaltyText(after(DAY)),
        }),
      );
      const deltaIds = await addSquad(
        delta.id,
        LINEUP_2_1_1.slice(0, 4).map(
          ([name, position]) => [`${name} Filho`, position] as [string, string],
        ),
      );

      const lineup = await save(delta.id, '2-1-1', [...deltaIds, ids[4]]);

      expect(lineup.complete).toBe(true);
    });
  });

  describe('operações ao mesmo tempo', () => {
    it('duas escalações do mesmo clube: vale uma delas inteira', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const ids = await addSquad(club.id);
      const [otherStriker] = await addSquad(club.id, [['Zico Reis', 'ATA']]);
      const second = [...ids.slice(0, 4), otherStriker];

      await Promise.all([
        save(club.id, '2-1-1', ids),
        save(club.id, '2-1-1', second),
      ]);

      const stored = await starterIds(club.id);
      expect([ids, second.sort((a, b) => a - b)]).toContainEqual(stored);
    });

    it('escalação e venda do mesmo titular: o vendido nunca fica escalado', async () => {
      const club = await addClub('Águias FC', 'AGU');
      const ids = [];
      for (const [name, position] of LINEUP_2_1_1) {
        const player = await addPlayer({ name, position });
        await market.buy(
          player.id,
          buyPlayerSchema.parse({
            club_id: club.id,
            loyalty_until: loyaltyText(after(DAY)),
          }),
        );
        ids.push(player.id);
      }

      const [saved, sold] = await Promise.allSettled([
        save(club.id, '2-1-1', ids),
        market.sell(ids[4]),
      ]);

      expect(sold.status).toBe('fulfilled');
      expect(await starterIds(club.id)).not.toContain(ids[4]);
      expect(await starterIds(club.id)).toHaveLength(
        saved.status === 'fulfilled' ? 4 : 0,
      );
    });
  });
});
