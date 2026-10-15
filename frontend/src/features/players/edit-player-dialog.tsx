import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, UserRound } from 'lucide-react';
import { Controller, useForm, type Path } from 'react-hook-form';
import type { z } from 'zod';
import type { Player } from '@/api/players';
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
import { useUpdatePlayer } from '@/hooks/use-players';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { readApiFieldError } from '@/lib/api-field-error';
import { formatMoney } from '@/lib/format';
import { notifyError, notifySuccess } from '@/lib/notify';
import {
  editPlayerFormSchema,
  type EditPlayerFormValues,
} from './player-form-schema';
import { PositionPicker } from './position-picker';

type EditPlayerOutput = z.output<typeof editPlayerFormSchema>;

const FORM_FIELDS = Object.keys(editPlayerFormSchema.shape);

interface EditPlayerDialogProps {
  player: Player | undefined;
  onClose: () => void;
}

export function EditPlayerDialog({ player, onClose }: EditPlayerDialogProps) {
  if (!player) {
    return null;
  }
  return <EditPlayerForm key={player.id} player={player} onClose={onClose} />;
}

function EditPlayerForm({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const updatePlayer = useUpdatePlayer();
  const submitOnce = useSubmitOnce();
  const form = useForm<EditPlayerFormValues, unknown, EditPlayerOutput>({
    resolver: zodResolver(editPlayerFormSchema),
    defaultValues: {
      name: player.name,
      position: player.position,
      age: String(player.age),
      agility: String(player.agility),
    },
  });
  const { errors } = form.formState;
  const hasClub = player.club_id !== null;

  const submit = form.handleSubmit((values) => {
    // A tela pode impedir a idade menor que a atual, que a API recusaria (409).
    if (values.age < player.age) {
      form.setError('age', {
        message: `A idade não pode ser menor que a atual (${player.age}).`,
      });
      return;
    }
    return submitOnce(async () => {
      try {
        const updated = await updatePlayer.mutateAsync({
          id: player.id,
          edit: values,
        });
        notifySuccess('Jogador atualizado', `${updated.name} foi salvo.`);
        onClose();
      } catch (error) {
        const fieldError = readApiFieldError(error);
        if (fieldError && FORM_FIELDS.includes(fieldError.field)) {
          form.setError(fieldError.field as Path<EditPlayerFormValues>, {
            message: fieldError.message,
          });
        }
        notifyError('Não foi possível salvar o jogador', error);
      }
    });
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar jogador</DialogTitle>
          <DialogDescription>
            Edite nome, posição, idade e agilidade. Os demais dados não mudam.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <DialogBody className="flex flex-col gap-5">
            <FormField
              id="edit-player-name"
              label="Nome"
              help="De 3 a 100 caracteres, com pelo menos duas palavras e sem números."
              error={errors.name?.message}
            >
              {(control) => (
                <div className="relative">
                  <UserRound
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    {...control}
                    {...form.register('name')}
                    className="pl-9"
                  />
                </div>
              )}
            </FormField>
            <FormField
              id="edit-player-position"
              label="Posição"
              help={
                hasClub
                  ? 'Jogador com clube não muda de posição: as outras posições ficam desabilitadas.'
                  : undefined
              }
              error={errors.position?.message}
            >
              {(control) => (
                <Controller
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <PositionPicker
                      id={control.id}
                      value={field.value}
                      onChange={field.onChange}
                      isDisabled={(position) =>
                        hasClub && position !== player.position
                      }
                      invalid={control['aria-invalid']}
                      describedBy={control['aria-describedby']}
                    />
                  )}
                />
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="edit-player-age"
                label="Idade"
                help={`De 16 a 45, sem diminuir (atual: ${player.age}).`}
                error={errors.age?.message}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register('age')}
                    inputMode="numeric"
                  />
                )}
              </FormField>
              <FormField
                id="edit-player-agility"
                label="Agilidade"
                help="De 1 a 100 (até 85 com 35 anos ou mais)."
                error={errors.agility?.message}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register('agility')}
                    inputMode="numeric"
                  />
                )}
              </FormField>
            </div>
            <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
              <Lock aria-hidden className="size-4 shrink-0" />
              Não mudam depois do cadastro: valor base (
              {formatMoney(player.base_value)}), indicadores e potencial.
            </p>
          </DialogBody>
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updatePlayer.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
