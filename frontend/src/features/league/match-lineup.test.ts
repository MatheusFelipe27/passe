import { describe, expect, it } from 'vitest';
import {
  attackerSlot,
  defenderSlot,
  slotLabel,
  startersOf,
  type LineSlot,
} from './match-lineup';
import { RN20_MATCH } from '@/test/match-example';

describe('vagas dos duelos', () => {
  it.each<[number, LineSlot, LineSlot]>([
    [1, 4, 0],
    [2, 3, 1],
    [3, 2, 2],
    [4, 4, 0],
    [5, 3, 1],
    [6, 2, 2],
  ])(
    'duelo %i: o %iº ataca e a vaga %i defende',
    (order, attacker, defender) => {
      const duel = RN20_MATCH.duels[order - 1];

      expect(attackerSlot(duel)).toBe(attacker);
      expect(defenderSlot(duel)).toBe(defender);
    },
  );

  it.each<[LineSlot, string]>([
    [0, 'Goleiro'],
    [1, '1º de linha'],
    [2, '2º de linha'],
    [3, '3º de linha'],
    [4, '4º de linha'],
  ])('vaga %i é "%s"', (slot, label) => {
    expect(slotLabel(slot)).toBe(label);
  });
});

describe('startersOf', () => {
  function summary(clubId: number) {
    return startersOf(RN20_MATCH, clubId).map((starter) => [
      starter.slot,
      starter.player.player_name,
      starter.attack
        ? `${starter.attack.attribute} ${starter.attack.value}`
        : null,
      starter.defense
        ? `${starter.defense.attribute} ${starter.defense.value}`
        : null,
      starter.scored,
    ]);
  }

  it('monta os 5 titulares do mandante, do goleiro ao 4º, com os valores dos duelos', () => {
    expect(summary(1)).toEqual([
      [0, 'Rui Prado', null, 'defending 77', false],
      [1, 'Téo Brandão', null, 'defending 84', false],
      [2, 'Davi Lins', 'dribbling 63', 'defending 56', false],
      [3, 'Lauro Neves', 'passing 82', null, false],
      [4, 'Otto Rangel', 'shooting 75', null, true],
    ]);
  });

  it('monta os do visitante, e o 2º aparece uma vez só, atacando e defendendo', () => {
    expect(summary(2)).toEqual([
      [0, 'Ivo Teles', null, 'defending 72', false],
      [1, 'Hugo Vaz', null, 'defending 84', false],
      [2, 'Lino Matos', 'dribbling 79', 'defending 63', true],
      [3, 'Nei Soares', 'passing 70', null, false],
      [4, 'Ugo Falcão', 'shooting 81', null, true],
    ]);
  });

  it('mantém a condição do momento da partida', () => {
    const davi = startersOf(RN20_MATCH, 1).find(
      (starter) => starter.player.player_id === 31,
    );

    expect(davi?.player.condition).toBe('MAL_CONDICIONADO');
  });

  it('não depende da ordem em que os duelos chegam', () => {
    const shuffled = { ...RN20_MATCH, duels: [...RN20_MATCH.duels].reverse() };

    expect(startersOf(shuffled, 2).map((starter) => starter.slot)).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect(startersOf(shuffled, 2)[2].scored).toBe(true);
  });
});
