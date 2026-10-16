import { useState } from 'react';
import { HandCoins, Info, Loader2, RefreshCw } from 'lucide-react';
import type { RosterPlayer } from '@/api/clubs';
import type { Sale } from '@/api/market';
import { InfoNote, RefusalAlert } from '@/components/dialog-notes';
import { ResultList, ResultRow } from '@/components/result-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSellPlayer } from '@/hooks/use-market';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { formatDateTime, formatInteger, formatMoney } from '@/lib/format';
import { PenaltyBadge } from '@/features/clubs/club-cells';
import { PlayerSummary } from '@/features/players/player-summary';
import { toActionFailure, type ActionFailure } from './action-failure';

interface SellPlayerDialogProps {
  player: RosterPlayer | undefined;
  clubName: string;
  onClose: () => void;
  onSold: (sale: Sale) => void;
}

export function SellPlayerDialog({
  player,
  clubName,
  onClose,
  onSold,
}: SellPlayerDialogProps) {
  if (!player) {
    return null;
  }
  return (
    <SellPlayerConfirmation
      key={player.id}
      player={player}
      clubName={clubName}
      onClose={onClose}
      onSold={onSold}
    />
  );
}

// Confirmação da venda com o contrato como a API mostrou na página do clube.
function SellPlayerConfirmation({
  player,
  clubName,
  onClose,
  onSold,
}: SellPlayerDialogProps & { player: RosterPlayer }) {
  const sellPlayer = useSellPlayer();
  const submitOnce = useSubmitOnce();
  const [failure, setFailure] = useState<ActionFailure>();
  const isSending = sellPlayer.isPending;
  const { contract } = player;

  function close() {
    if (!isSending) {
      onClose();
    }
  }

  function confirm() {
    void submitOnce(async () => {
      setFailure(undefined);
      try {
        onSold(await sellPlayer.mutateAsync(player.id));
      } catch (error) {
        setFailure(toActionFailure(error));
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Vender {player.name}?</DialogTitle>
          <DialogDescription>
            O jogador sai do elenco do {clubName} e volta a ficar livre.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {failure?.kind === 'network' && (
            <RefusalAlert
              title="Sem conexão"
              message="A venda não foi confirmada. Verifique a conexão e tente de novo."
            />
          )}
          {failure?.kind === 'refused' && (
            <RefusalAlert
              title="A venda foi recusada"
              message={failure.message}
            />
          )}
          <PlayerSummary
            player={player}
            badge={
              <span className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  Valor de mercado
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatMoney(player.market_value)}
                </span>
              </span>
            }
          />
          {contract && (
            <ResultList>
              <ResultRow
                label="Valor de compra"
                value={formatMoney(contract.purchase_value)}
              />
              <ResultRow
                label="Fim da fidelidade"
                value={formatDateTime(contract.loyalty_until)}
              />
              <ResultRow
                label="Dias restantes"
                value={formatInteger(contract.remaining_days)}
              />
              <ResultRow
                label="% de multa se vender agora"
                value={<PenaltyBadge rate={contract.penalty_rate} />}
              />
            </ResultList>
          )}
          <InfoNote>
            A venda é pelo valor de mercado do momento. Multa (teto de 10,00),
            lucro, comissão e crédito são calculados ao confirmar.
          </InfoNote>
          {isSending && (
            <InfoNote icon={Info}>
              Enviando a venda. Os botões ficam desabilitados até a resposta.
            </InfoNote>
          )}
        </DialogBody>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" disabled={isSending} onClick={close}>
            Cancelar
          </Button>
          <Button disabled={isSending} onClick={confirm}>
            {isSending ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                Vendendo…
              </>
            ) : failure?.kind === 'network' ? (
              <>
                <RefreshCw aria-hidden />
                Tentar de novo
              </>
            ) : (
              <>
                <HandCoins aria-hidden />
                Confirmar venda
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
