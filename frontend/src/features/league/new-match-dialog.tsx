import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Info, RefreshCw, Shield, Swords } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { RefusalAlert } from '@/components/dialog-notes';
import { FormField, type FieldControlProps } from '@/components/form-field';
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
import { useClubs } from '@/hooks/use-clubs';
import { usePlayMatch } from '@/hooks/use-league';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { readApiFieldError } from '@/lib/api-field-error';
import { notifySuccess } from '@/lib/notify';
import {
  toActionFailure,
  type ActionFailure,
} from '@/features/market/action-failure';
import {
  newMatchFormSchema,
  type NewMatchFormValues,
} from './new-match-form-schema';

const EMPTY_FORM: NewMatchFormValues = { homeClubId: '', awayClubId: '' };

// Campos da API que a recusa pode apontar, e o campo do formulário que mostra o erro.
const API_FIELDS: Record<string, keyof NewMatchFormValues> = {
  home_club_id: 'homeClubId',
  away_club_id: 'awayClubId',
};

// RN20: escolhe o mandante e o visitante e joga; o resultado abre na página da partida.
export function NewMatchDialog({ onClose }: { onClose: () => void }) {
  const clubs = useClubs();
  const playMatch = usePlayMatch();
  const submitOnce = useSubmitOnce();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<ActionFailure>();
  const form = useForm<NewMatchFormValues>({
    resolver: zodResolver(newMatchFormSchema),
    defaultValues: EMPTY_FORM,
  });
  const { errors } = form.formState;
  const isSending = playMatch.isPending;

  function close() {
    if (!isSending) {
      onClose();
    }
  }

  const submit = form.handleSubmit((values) =>
    submitOnce(async () => {
      setFailure(undefined);
      try {
        const match = await playMatch.mutateAsync({
          home_club_id: Number(values.homeClubId),
          away_club_id: Number(values.awayClubId),
        });
        notifySuccess(
          'Partida jogada',
          `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}. Placar e duelos devolvidos pela API.`,
        );
        onClose();
        void navigate(`/partidas/${match.id}`);
      } catch (error) {
        const fieldError = readApiFieldError(error);
        const field = fieldError && API_FIELDS[fieldError.field];
        if (fieldError && field) {
          form.setError(field, { message: fieldError.message });
        }
        setFailure(toActionFailure(error));
      }
    }),
  );

  function clubSelect(
    control: FieldControlProps,
    name: keyof NewMatchFormValues,
    placeholder: string,
  ) {
    return (
      <div className="relative">
        <Shield
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <select
          {...control}
          {...form.register(name)}
          disabled={isSending}
          className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-input bg-transparent pr-9 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        >
          <option value="">
            {clubs.data?.length === 0 ? 'Nenhum clube cadastrado' : placeholder}
          </option>
          {clubs.data?.map((club) => (
            <option key={club.id} value={club.id}>
              {`${club.name} (${club.acronym})`}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Nova partida</DialogTitle>
          <DialogDescription>
            Escolha o mandante e o visitante. O placar sai dos atributos dos
            titulares, sem sorteio.
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
                message="A partida não foi confirmada. Verifique a conexão e tente de novo."
              />
            )}
            {failure?.kind === 'refused' && (
              <RefusalAlert
                title="Não foi possível jogar a partida"
                message={failure.message}
              />
            )}
            <FormField
              id="match-home"
              label="Mandante"
              help="Faz os 3 primeiros ataques."
              error={errors.homeClubId?.message}
            >
              {(control) =>
                clubSelect(control, 'homeClubId', 'Escolha o mandante')
              }
            </FormField>
            <FormField
              id="match-away"
              label="Visitante"
              help="Precisa ser um clube diferente do mandante."
              error={errors.awayClubId?.message}
            >
              {(control) =>
                clubSelect(control, 'awayClubId', 'Escolha o visitante')
              }
            </FormField>
            <div className="flex flex-col gap-2 rounded-lg border bg-muted-subtle px-4 py-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Info aria-hidden className="size-4" />
                Como sai o placar
              </span>
              <p>
                Cada time faz 3 ataques. Pela ordem do elenco, os jogadores de
                linha vão do 1º (o mais recuado) ao 4º (o mais avançado): o 4º
                enfrenta o goleiro, o 3º enfrenta o 1º e o 2º enfrenta o 2º do
                adversário. O atacante usa finalização (ATA), passe (MEI) ou
                drible (ZAG e LAT), e quem defende usa defesa. É gol só quando o
                ataque é maior; mal condicionado joga com 15% a menos.
              </p>
              <p>
                Os dois clubes precisam ter os 5 titulares escalados. A partida
                não mexe no caixa.
              </p>
            </div>
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
              {failure?.kind === 'network' ? (
                <RefreshCw aria-hidden />
              ) : (
                <Swords aria-hidden />
              )}
              {isSending
                ? 'Jogando…'
                : failure?.kind === 'network'
                  ? 'Tentar de novo'
                  : 'Jogar partida'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
