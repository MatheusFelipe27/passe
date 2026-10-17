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
  MINUTE,
  PlayerFields,
  PURCHASE_TIME,
} from '../../../test/integration/market-fixtures';
import { formatBrasiliaDateTime } from '../../common/time/brasilia-time';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionRunner } from '../../prisma/transaction-runner';
import { ClubsRepository } from '../clubs/clubs.repository';
import { saveLineupSchema } from '../lineups/dto/save-lineup.schema';
import { LineupsRepository } from '../lineups/lineups.repository';
import { LineupsService } from '../lineups/lineups.service';
import { buyPlayerSchema } from '../market/dto/buy-player.schema';
import { MarketRepository } from '../market/market.repository';
import { MarketService } from '../market/market.service';
import { PlayersRepository } from '../players/players.repository';
import { PlayersService } from '../players/players.service';
import { listMatchesQuerySchema } from './dto/list-matches.query';
import { playMatchSchema } from './dto/play-match.schema';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';

type Starter = Omit<PlayerFields, 'baseValue' | 'clubId'>;

// O exemplo completo da RN20, os dois clubes no 2-1-1.
const AGUIAS_STARTERS: Starter[] = [
  { name: 'Rui Prado', position: 'GOL', defending: 77 },
  { name: 'Téo Brandão', position: 'ZAG', defending: 84 },
  {
    name: 'Davi Lins',
    position: 'LAT',
    dribbling: 74,
    defending: 66,
    condition: 'MAL_CONDICIONADO',
  },
  { name: 'Lauro Neves', position: 'MEI', passing: 82 },
  { name: 'Otto Rangel', position: 'ATA', shooting: 75 },
];

const DELTA_STARTERS: Starter[] = [
  { name: 'Ivo Teles', position: 'GOL', defending: 72 },
  { name: 'Hugo Vaz', position: 'ZAG', defending: 84 },
  { name: 'Lino Matos', position: 'LAT', dribbling: 79, defending: 63 },
  { name: 'Nei Soares', position: 'MEI', passing: 70 },
  { name: 'Ugo Falcão', position: 'ATA', shooting: 81 },
];

describe('partidas no banco', () => {
  let prisma: PrismaService;
  let clock: FixedClock;
  let matches: MatchesService;
  let lineups: LineupsService;
  let market: MarketService;
  let players: PlayersService;

  function addClub(name: string, acronym: string) {
    return insertClub(prisma, name, acronym);
  }

  // Compra os titulares, para que tenham contrato e possam ser vendidos, e escala o clube.
  async function addLineup(clubId: number, starters: Starter[]) {
    const ids: number[] = [];
    for (const starter of starters) {
      const player = await insertPlayer(prisma, {
        baseValue: '10.00',
        ...starter,
      });
      await market.buy(
        player.id,
        buyPlayerSchema.parse({
          club_id: clubId,
          loyalty_until: loyaltyText(after(DAY)),
        }),
      );
      ids.push(player.id);
    }
    await lineups.save(
      clubId,
      saveLineupSchema.parse({ formation: '2-1-1', player_ids: ids }),
    );
    return ids;
  }

  function play(homeClubId: number, awayClubId: number) {
    return matches.play(
      playMatchSchema.parse({
        home_club_id: homeClubId,
        away_club_id: awayClubId,
      }),
    );
  }

  function list(clubId?: number) {
    return matches.list(
      listMatchesQuerySchema.parse(
        clubId === undefined ? {} : { club_id: String(clubId) },
      ),
    );
  }

  function insertMatch(
    homeClubId: number,
    homeGoals: number,
    awayGoals: number,
    awayClubId: number,
    playedAt = PURCHASE_TIME,
  ) {
    return prisma.match.create({
      data: {
        homeClubId,
        awayClubId,
        homeGoals,
        awayGoals,
        homeFormation: '2-1-1',
        awayFormation: '2-1-1',
        playedAt,
      },
    });
  }

  async function storedRows() {
    return {
      matches: await prisma.match.count(),
      duels: await prisma.matchDuel.count(),
    };
  }

  beforeAll(async () => {
    prisma = createTestPrisma();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock = new FixedClock();
    const clubsRepository = new ClubsRepository(prisma);
    const playersRepository = new PlayersRepository(prisma);
    const lineupsRepository = new LineupsRepository(prisma);
    const transactions = new TransactionRunner(prisma);
    matches = new MatchesService(
      new MatchesRepository(prisma),
      clubsRepository,
      lineupsRepository,
      transactions,
      clock,
    );
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
      clock,
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

  describe('POST /matches com o exemplo da RN20', () => {
    let aguiasId: number;
    let deltaId: number;
    let aguias: number[];
    let delta: number[];

    beforeEach(async () => {
      aguiasId = (await addClub('Águias FC', 'AGU')).id;
      deltaId = (await addClub('Delta FC', 'DEL')).id;
      aguias = await addLineup(aguiasId, AGUIAS_STARTERS);
      delta = await addLineup(deltaId, DELTA_STARTERS);
      clock.current = new Date('2026-11-12T18:00:00.000Z');
    });

    it('responde como no exemplo 2.4.2: Águias FC 1 × 2 Delta FC', async () => {
      const match = await play(aguiasId, deltaId);

      expect(match).toMatchObject({
        id: 1,
        played_at: '2026-11-12T15:00:00-03:00',
        home: {
          club_id: aguiasId,
          club_name: 'Águias FC',
          formation: '2-1-1',
          goals: 1,
        },
        away: {
          club_id: deltaId,
          club_name: 'Delta FC',
          formation: '2-1-1',
          goals: 2,
        },
        result: 'VISITANTE',
      });
      expect(match.duels.slice(0, 2)).toEqual([
        {
          order: 1,
          attacking_club_id: aguiasId,
          attacker: {
            player_id: aguias[4],
            player_name: 'Otto Rangel',
            position: 'ATA',
            condition: 'APTO',
            attribute: 'shooting',
            value: 75,
          },
          defender: {
            player_id: delta[0],
            player_name: 'Ivo Teles',
            position: 'GOL',
            condition: 'APTO',
            attribute: 'defending',
            value: 72,
          },
          goal: true,
        },
        {
          order: 2,
          attacking_club_id: aguiasId,
          attacker: {
            player_id: aguias[3],
            player_name: 'Lauro Neves',
            position: 'MEI',
            condition: 'APTO',
            attribute: 'passing',
            value: 82,
          },
          defender: {
            player_id: delta[1],
            player_name: 'Hugo Vaz',
            position: 'ZAG',
            condition: 'APTO',
            attribute: 'defending',
            value: 84,
          },
          goal: false,
        },
      ]);
      expect(
        match.duels.map((duel) => [
          duel.order,
          duel.attacker.player_name,
          duel.attacker.condition,
          duel.attacker.value,
          duel.defender.player_name,
          duel.defender.condition,
          duel.defender.value,
          duel.goal,
        ]),
      ).toEqual([
        [1, 'Otto Rangel', 'APTO', 75, 'Ivo Teles', 'APTO', 72, true],
        [2, 'Lauro Neves', 'APTO', 82, 'Hugo Vaz', 'APTO', 84, false],
        [
          3,
          'Davi Lins',
          'MAL_CONDICIONADO',
          63,
          'Lino Matos',
          'APTO',
          63,
          false,
        ],
        [4, 'Ugo Falcão', 'APTO', 81, 'Rui Prado', 'APTO', 77, true],
        [5, 'Nei Soares', 'APTO', 70, 'Téo Brandão', 'APTO', 84, false],
        [
          6,
          'Lino Matos',
          'APTO',
          79,
          'Davi Lins',
          'MAL_CONDICIONADO',
          56,
          true,
        ],
      ]);
    });

    it('grava a partida, as formações e os 6 duelos com os dados do momento', async () => {
      const match = await play(aguiasId, deltaId);

      const stored = await prisma.match.findUniqueOrThrow({
        where: { id: match.id },
        include: { duels: { orderBy: { order: 'asc' } } },
      });
      expect(stored).toMatchObject({
        homeClubId: aguiasId,
        awayClubId: deltaId,
        homeGoals: 1,
        awayGoals: 2,
        homeFormation: '2-1-1',
        awayFormation: '2-1-1',
        playedAt: clock.current,
      });
      expect(stored.duels).toHaveLength(6);
      expect(stored.duels[2]).toMatchObject({
        order: 3,
        attackingClubId: aguiasId,
        attackerId: aguias[2],
        defenderId: delta[2],
        attackerName: 'Davi Lins',
        defenderName: 'Lino Matos',
        attackerPosition: 'LAT',
        defenderPosition: 'LAT',
        attackerCondition: 'MAL_CONDICIONADO',
        defenderCondition: 'APTO',
        attackAttribute: 'dribbling',
        defenseAttribute: 'defending',
        attackValue: 63,
        defenseValue: 63,
        goal: false,
      });
    });

    it('GET /matches/{id} devolve a partida como o POST', async () => {
      const match = await play(aguiasId, deltaId);

      expect(await matches.findById(match.id)).toEqual(match);
    });

    it('nada é recalculado depois: editar, mudar a condição ou vender não muda a partida', async () => {
      const match = await play(aguiasId, deltaId);

      await prisma.player.update({
        where: { id: aguias[4] },
        data: { name: 'Otto Novo', shooting: 10 },
      });
      await players.changeCondition(aguias[2], 'APTO');
      await market.sell(delta[0]);

      expect(await matches.findById(match.id)).toEqual(match);
    });

    it('não muda o caixa, a escalação nem os jogadores', async () => {
      const before = {
        clubs: await prisma.club.findMany({ orderBy: { id: 'asc' } }),
        lineups: await prisma.lineupEntry.findMany({
          orderBy: { playerId: 'asc' },
        }),
        players: await prisma.player.findMany({ orderBy: { id: 'asc' } }),
      };

      await play(aguiasId, deltaId);

      expect({
        clubs: await prisma.club.findMany({ orderBy: { id: 'asc' } }),
        lineups: await prisma.lineupEntry.findMany({
          orderBy: { playerId: 'asc' },
        }),
        players: await prisma.player.findMany({ orderBy: { id: 'asc' } }),
      }).toEqual(before);
    });

    it('o mesmo confronto pode se repetir, e com o mando invertido', async () => {
      const first = await play(aguiasId, deltaId);
      const second = await play(aguiasId, deltaId);
      const reversed = await play(deltaId, aguiasId);

      expect([first.id, second.id, reversed.id]).toEqual([1, 2, 3]);
      expect(second.result).toBe('VISITANTE');
      expect(reversed).toMatchObject({
        home: { club_id: deltaId, goals: 2 },
        away: { club_id: aguiasId, goals: 1 },
        result: 'MANDANTE',
      });
      expect(reversed.duels.map((duel) => duel.attacking_club_id)).toEqual([
        deltaId,
        deltaId,
        deltaId,
        aguiasId,
        aguiasId,
        aguiasId,
      ]);
    });

    it('mandante inexistente → 404, sem gravar nada', async () => {
      await expect(play(999, deltaId)).rejects.toThrow(
        new NotFoundException('Clube não encontrado.'),
      );
      expect(await storedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('visitante inexistente → 404, sem gravar nada', async () => {
      await expect(play(aguiasId, 999)).rejects.toThrow(
        new NotFoundException('Clube não encontrado.'),
      );
      expect(await storedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('o 404 vem antes do 409: visitante inexistente com o mandante incompleto', async () => {
      await market.sell(aguias[4]);

      await expect(play(aguiasId, 999)).rejects.toThrow(NotFoundException);
    });

    it('titular vendido: escalação incompleta → 409, sem gravar nada', async () => {
      await market.sell(delta[4]);

      await expect(play(aguiasId, deltaId)).rejects.toThrow(
        new ConflictException(
          'O Delta FC não tem a escalação completa, com os 5 titulares.',
        ),
      );
      expect(await storedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('titular DOENTE: escalação incompleta → 409', async () => {
      await players.changeCondition(aguias[0], 'DOENTE');

      await expect(play(aguiasId, deltaId)).rejects.toThrow(
        new ConflictException(
          'O Águias FC não tem a escalação completa, com os 5 titulares.',
        ),
      );
    });

    it('os dois incompletos: o mandante é conferido primeiro', async () => {
      await market.sell(aguias[1]);
      await market.sell(delta[1]);

      await expect(play(deltaId, aguiasId)).rejects.toThrow(
        new ConflictException(
          'O Delta FC não tem a escalação completa, com os 5 titulares.',
        ),
      );
    });

    it('clube que nunca escalou → 409', async () => {
      const gama = await addClub('Gama SC', 'GAM');

      await expect(play(aguiasId, gama.id)).rejects.toThrow(
        new ConflictException(
          'O Gama SC não tem a escalação completa, com os 5 titulares.',
        ),
      );
    });

    it('escalado de novo, o clube volta a jogar', async () => {
      await market.sell(delta[4]);
      const striker = await insertPlayer(prisma, {
        baseValue: '10.00',
        name: 'Ugo Filho',
        position: 'ATA',
        clubId: deltaId,
      });
      await lineups.save(
        deltaId,
        saveLineupSchema.parse({
          formation: '2-1-1',
          player_ids: [...delta.slice(0, 4), striker.id],
        }),
      );

      await expect(play(aguiasId, deltaId)).resolves.toMatchObject({ id: 1 });
    });
  });

  describe('GET /matches', () => {
    it('sem partidas: lista vazia', async () => {
      expect(await list()).toEqual([]);
    });

    it('da mais recente para a mais antiga; no mesmo instante, o maior id primeiro', async () => {
      const a = await addClub('Águias FC', 'AGU');
      const d = await addClub('Delta FC', 'DEL');
      const oldest = await insertMatch(a.id, 1, 0, d.id, PURCHASE_TIME);
      const sameA = await insertMatch(d.id, 2, 2, a.id, after(MINUTE));
      const sameB = await insertMatch(a.id, 0, 3, d.id, after(MINUTE));

      const listed = await list();

      expect(listed.map((match) => match.id)).toEqual([
        sameB.id,
        sameA.id,
        oldest.id,
      ]);
      expect(listed.map((match) => match.result)).toEqual([
        'VISITANTE',
        'EMPATE',
        'MANDANTE',
      ]);
      expect(listed[2]).toEqual({
        id: oldest.id,
        played_at: formatBrasiliaDateTime(PURCHASE_TIME),
        home: {
          club_id: a.id,
          club_name: 'Águias FC',
          formation: '2-1-1',
          goals: 1,
        },
        away: {
          club_id: d.id,
          club_name: 'Delta FC',
          formation: '2-1-1',
          goals: 0,
        },
        result: 'MANDANTE',
      });
      expect(listed[0]).not.toHaveProperty('duels');
    });

    it('club_id filtra as partidas em que o clube foi mandante ou visitante', async () => {
      const a = await addClub('Águias FC', 'AGU');
      const d = await addClub('Delta FC', 'DEL');
      const g = await addClub('Gama SC', 'GAM');
      const asHome = await insertMatch(a.id, 1, 0, d.id);
      const asAway = await insertMatch(g.id, 1, 0, a.id, after(MINUTE));
      await insertMatch(d.id, 1, 1, g.id, after(2 * MINUTE));

      expect((await list(a.id)).map((match) => match.id)).toEqual([
        asAway.id,
        asHome.id,
      ]);
    });

    it('clube sem partidas: lista vazia', async () => {
      const a = await addClub('Águias FC', 'AGU');
      const d = await addClub('Delta FC', 'DEL');
      const g = await addClub('Gama SC', 'GAM');
      await insertMatch(a.id, 1, 0, d.id);

      expect(await list(g.id)).toEqual([]);
    });

    it('club_id inexistente → 404', async () => {
      await expect(list(999)).rejects.toThrow(
        new NotFoundException('Clube não encontrado.'),
      );
    });
  });

  describe('GET /matches/{id}', () => {
    it('partida inexistente → 404', async () => {
      await expect(matches.findById(1)).rejects.toThrow(
        new NotFoundException('Partida não encontrada.'),
      );
    });
  });

  describe('GET /standings', () => {
    it('sem clubes: lista vazia', async () => {
      expect(await matches.standings()).toEqual([]);
    });

    it('todos os clubes, zerados, antes da primeira partida', async () => {
      await addClub('Delta FC', 'DEL');
      await addClub('Águias FC', 'AGU');

      expect(await matches.standings()).toEqual([
        {
          position: 1,
          club_id: 2,
          club_name: 'Águias FC',
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        },
        expect.objectContaining({
          position: 2,
          club_name: 'Delta FC',
          points: 0,
        }),
      ]);
    });

    it('reproduz o exemplo 2.4.3, depois da partida jogada', async () => {
      const aguiasId = (await addClub('Águias FC', 'AGU')).id;
      const deltaId = (await addClub('Delta FC', 'DEL')).id;
      const gamaId = (await addClub('Gama SC', 'GAM')).id;
      await addLineup(aguiasId, AGUIAS_STARTERS);
      await addLineup(deltaId, DELTA_STARTERS);
      await play(aguiasId, deltaId);

      expect(await matches.standings()).toEqual([
        {
          position: 1,
          club_id: deltaId,
          club_name: 'Delta FC',
          played: 1,
          wins: 1,
          draws: 0,
          losses: 0,
          goals_for: 2,
          goals_against: 1,
          goal_difference: 1,
          points: 3,
        },
        {
          position: 2,
          club_id: gamaId,
          club_name: 'Gama SC',
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        },
        {
          position: 3,
          club_id: aguiasId,
          club_name: 'Águias FC',
          played: 1,
          wins: 0,
          draws: 0,
          losses: 1,
          goals_for: 1,
          goals_against: 2,
          goal_difference: -1,
          points: 0,
        },
      ]);
    });

    it('reproduz o exemplo da RN21, com 6 clubes e 4 partidas', async () => {
      const id: Record<string, number> = {};
      for (const [name, acronym] of [
        ['Águias FC', 'AGU'],
        ['Delta FC', 'DEL'],
        ['Gama SC', 'GAM'],
        ['Épsilon EC', 'EPS'],
        ['Tubarões EC', 'TUB'],
        ['Mangue FC', 'MAN'],
      ]) {
        id[name] = (await addClub(name, acronym)).id;
      }
      await insertMatch(id['Águias FC'], 1, 2, id['Delta FC']);
      await insertMatch(id['Gama SC'], 2, 1, id['Épsilon EC']);
      await insertMatch(id['Épsilon EC'], 3, 2, id['Águias FC']);
      await insertMatch(id['Delta FC'], 0, 1, id['Gama SC']);

      const standings = await matches.standings();

      expect(
        standings.map((row) => [
          row.position,
          row.club_name,
          row.points,
          row.goal_difference,
          row.goals_for,
        ]),
      ).toEqual([
        [1, 'Gama SC', 6, 2, 3],
        [2, 'Épsilon EC', 3, 0, 4],
        [3, 'Delta FC', 3, 0, 2],
        [4, 'Mangue FC', 0, 0, 0],
        [5, 'Tubarões EC', 0, 0, 0],
        [6, 'Águias FC', 0, -2, 3],
      ]);
    });
  });
});
