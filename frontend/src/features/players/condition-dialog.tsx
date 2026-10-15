import { useState } from 'react';
import { Lock } from 'lucide-react';
import { cn } from 'cn';
import type { Condition, Player } from '@/api/players';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useChangeCondition } from '@/hooks/use-players';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { formatMoney } from '@/lib/format';
import { notifyError, notifySuccess } from '@/lib/notify';
import { ConditionBadge } from './player-cells';
import { CONDITION_NAMES, CONDITIONS } from './player-labels';
import { PlayerSummary } from './player-summary';

const CONDITION_HELP: Record<Condition, string> = {
  APTO: 'Sem desconto por condição.',
  MAL_CONDICIONADO:
    'Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.',
  DOENTE: 'Desconto de 30%, com o mesmo ajuste de agilidade.',
};

interface ConditionDialogProps {
  player: Player | undefined;
  onClose: () => void;
}

export function ConditionDialog({ player, onClose }: ConditionDialogProps) {
  if (!player) {
    return null;
  }
  return <ConditionForm key={player.id} player={player} onClose={onClose} />;
}

function ConditionForm({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const [condition, setCondition] = useState<Condition>(player.condition);
  const changeCondition = useChangeCondition();
  const submitOnce = useSubmitOnce();

  // A tela pode impedir de DOENTE direto para APTO, que a API recusaria (409).
  const isBlocked = (option: Condition) =>
    player.condition === 'DOENTE' && option === 'APTO';

  function save() {
    void submitOnce(async () => {
      try {
        const updated = await changeCondition.mutateAsync({
          id: player.id,
          condition,
        });
        notifySuccess(
          'Condição alterada',
          `${updated.name} agora está ${CONDITION_NAMES[updated.condition].toLowerCase()}. Valor de mercado: ${formatMoney(updated.market_value)}.`,
        );
        onClose();
      } catch (error) {
        notifyError('Não foi possível alterar a condição', error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alterar condição física</DialogTitle>
          <DialogDescription>
            A condição muda o desconto do valor de mercado, recalculado ao
            salvar.
          </DialogDescription>
        </DialogHeader>
        <PlayerSummary
          player={player}
          badge={<ConditionBadge condition={player.condition} />}
        />
        <RadioGroup
          aria-label="Nova condição"
          value={condition}
          onValueChange={(next) => setCondition(next as Condition)}
          className="gap-3"
        >
          {CONDITIONS.map((option) => (
            <label
              key={option}
              htmlFor={`condition-${option}`}
              className={cn(
                'flex gap-3 rounded-xl border p-4',
                option === condition && 'border-primary bg-primary-soft',
                isBlocked(option) ? 'opacity-60' : 'cursor-pointer',
              )}
            >
              <RadioGroupItem
                id={`condition-${option}`}
                value={option}
                disabled={isBlocked(option)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  {CONDITION_NAMES[option]}
                  {option === player.condition && (
                    <Badge variant="secondary">Atual</Badge>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {CONDITION_HELP[option]}
                </span>
                {isBlocked(option) && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock aria-hidden className="size-3" />
                    De Doente não passa direto para Apto.
                  </span>
                )}
              </span>
            </label>
          ))}
        </RadioGroup>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={changeCondition.isPending} onClick={save}>
            Salvar condição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
