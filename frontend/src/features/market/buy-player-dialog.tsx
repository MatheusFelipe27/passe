import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import type { Club } from '@/api/clubs';
import type { Purchase } from '@/api/market';
import type { Player } from '@/api/players';
import { InfoNote, RefusalAlert } from '@/components/dialog-notes';
import { FormField } from '@/components/form-field';
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
import { Input } from '@/components/ui/input';
import { useClubs } from '@/hooks/use-clubs';
import { useBuyPlayer } from '@/hooks/use-market';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { readApiFieldError } from '@/lib/api-field-error';
import { formatMoney } from '@/lib/format';
import { PlayerSummary } from '@/features/players/player-summary';
import { toActionFailure, type ActionFailure } from './action-failure';
import { buyFormSchema, type BuyFormValues } from './buy-form-schema';
import { toLoyaltyUntil } from './loyalty-input';

const EMPTY_FORM: BuyFormValues = { clubId: '', date: '', time: '' };

// Campos da API que a recusa pode apontar, e o campo do formulário que mostra o erro.
const API_FIELDS: Record<string, keyof BuyFormValues> = {
  club_id: 'clubId',
  loyalty_until: 'date',
};

// A janela da fidelidade depende de "agora": o schema é montado a cada validação.
const resolver: Resolver<BuyFormValues> = (values, context, options) =>
  zodResolver(buyFormSchema(Date.now()))(values, context, options);

export interface BoughtPlayer {
  purchase: Purchase;
  club: Club;
}

interface BuyPlayerDialogProps {
  player: Player | undefined;
  onClose: () => void;
  onBought: (result: BoughtPlayer) => void;
}

export function BuyPlayerDialog({
  player,
  onClose,
  onBought,
}: BuyPlayerDialogProps) {
  if (!player) {
    return null;
  }
  return (
    <BuyPlayerForm
      key={player.id}
      player={player}
      onClose={onClose}
      onBought={onBought}
    />
  );
}

function BuyPlayerForm({
  player,
  onClose,
  onBought,
}: BuyPlayerDialogProps & { player: Player }) {
  const clubs = useClubs();
  const buyPlayer = useBuyPlayer();
  const submitOnce = useSubmitOnce();
  const [failure, setFailure] = useState<ActionFailure>();
  const form = useForm<BuyFormValues>({ resolver, defaultValues: EMPTY_FORM });
  const { errors } = form.formState;
  const isSending = buyPlayer.isPending;
  const selectedClubId = useWatch({ control: form.control, name: 'clubId' });
  const selectedClub = clubs.data?.find(
    (club) => String(club.id) === selectedClubId,
  );

  function close() {
    if (!isSending) {
      onClose();
    }
  }

  const submit = form.handleSubmit((values) =>
    submitOnce(async () => {
      setFailure(undefined);
      const club = clubs.data?.find(
        (item) => String(item.id) === values.clubId,
      );
      try {
        const purchase = await buyPlayer.mutateAsync({
          playerId: player.id,
          order: {
            club_id: Number(values.clubId),
            loyalty_until: toLoyaltyUntil(values.date, values.time),
          },
        });
        if (club) {
          onBought({ purchase, club });
        }
      } catch (error) {
        const fieldError = readApiFieldError(error);
        const field = fieldError && API_FIELDS[fieldError.field];
        if (fieldError && field) {
          form.setError(field, { message: fieldError.message });
          setFailure({ kind: 'refused', message: fieldError.message });
          return;
        }
        setFailure(toActionFailure(error));
      }
    }),
  );

  const loyaltyError = errors.date?.message ?? errors.time?.message;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Comprar jogador</DialogTitle>
          <DialogDescription>
            Escolha o clube comprador e até quando vai a fidelidade do contrato.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <DialogBody className="flex flex-col gap-5">
            {failure?.kind === 'network' && (
              <RefusalAlert
                title="Sem conexão"
                message="A compra não foi confirmada. Verifique a conexão e tente de novo."
              />
            )}
            {failure?.kind === 'refused' && (
              <RefusalAlert title="Compra recusada" message={failure.message} />
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
            <FormField
              id="buy-club"
              label="Clube comprador"
              help={
                selectedClub
                  ? `Caixa atual: ${formatMoney(selectedClub.cash)}. O custo total (valor + taxa) pode ir até 50% do caixa.`
                  : 'O custo total (valor + taxa) pode ir até 50% do caixa do clube.'
              }
              error={errors.clubId?.message}
            >
              {(control) => (
                <div className="relative">
                  <Shield
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <select
                    {...control}
                    {...form.register('clubId')}
                    disabled={isSending}
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent pr-9 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                  >
                    <option value="">
                      {clubs.data?.length === 0
                        ? 'Nenhum clube cadastrado'
                        : 'Escolha o clube'}
                    </option>
                    {clubs.data?.map((club) => (
                      <option key={club.id} value={club.id}>
                        {`${club.name} (${club.acronym}) · caixa ${formatMoney(club.cash)}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              )}
            </FormField>
            <FormField
              id="buy-loyalty-date"
              label="Fim da fidelidade"
              help="Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso (-03:00)."
              error={loyaltyError}
            >
              {(control) => (
                <div className="grid grid-cols-[1fr_160px] gap-3">
                  <div className="relative">
                    <CalendarDays
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      {...control}
                      {...form.register('date')}
                      type="date"
                      disabled={isSending}
                      aria-invalid={Boolean(errors.date)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <Clock
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      {...form.register('time')}
                      type="time"
                      aria-label="Hora do fim da fidelidade"
                      aria-describedby={control['aria-describedby']}
                      aria-invalid={Boolean(errors.time)}
                      disabled={isSending}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </FormField>
            <InfoNote>
              A taxa é de 5% do valor de mercado, só quando ele passa de 30,00.
              Taxa, custo e novo caixa são calculados ao confirmar.
            </InfoNote>
            {isSending && (
              <InfoNote icon={Info}>
                Enviando a compra. Os botões ficam desabilitados até a resposta.
              </InfoNote>
            )}
          </DialogBody>
          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSending}
              onClick={close}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 aria-hidden className="animate-spin" />
                  Comprando…
                </>
              ) : failure?.kind === 'network' ? (
                <>
                  <RefreshCw aria-hidden />
                  Tentar de novo
                </>
              ) : (
                <>
                  <ShoppingCart aria-hidden />
                  Confirmar compra
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
