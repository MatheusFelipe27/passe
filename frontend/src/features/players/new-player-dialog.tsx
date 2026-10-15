import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Lock, UserRound } from 'lucide-react';
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
  type Path,
} from 'react-hook-form';
import type { z } from 'zod';
import type { Player, PlayerAttributes } from '@/api/players';
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
import { useCreatePlayer } from '@/hooks/use-players';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { readApiFieldError } from '@/lib/api-field-error';
import { notifyError } from '@/lib/notify';
import { AttributePreviewCard } from './attribute-bars';
import { ATTRIBUTE_NAMES } from './player-labels';
import {
  newPlayerFormSchema,
  type NewPlayerFormValues,
} from './player-form-schema';
import { PositionPicker } from './position-picker';

type NewPlayerOutput = z.output<typeof newPlayerFormSchema>;

const ATTRIBUTE_FIELDS = Object.keys(
  ATTRIBUTE_NAMES,
) as (keyof PlayerAttributes)[];

const FORM_FIELDS = Object.keys(newPlayerFormSchema.shape);

const EMPTY_FORM: DefaultValues<NewPlayerFormValues> = {
  name: '',
  age: '',
  agility: '',
  pace: '',
  shooting: '',
  passing: '',
  dribbling: '',
  defending: '',
  physical: '',
  potential: '',
};

interface NewPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (player: Player) => void;
}

export function NewPlayerDialog({
  open,
  onOpenChange,
  onCreated,
}: NewPlayerDialogProps) {
  const createPlayer = useCreatePlayer();
  const submitOnce = useSubmitOnce();
  const form = useForm<NewPlayerFormValues, unknown, NewPlayerOutput>({
    resolver: zodResolver(newPlayerFormSchema),
    defaultValues: EMPTY_FORM,
  });
  const { errors } = form.formState;
  const hasErrors = Object.keys(errors).length > 0;
  const preview = readPreview(useWatch({ control: form.control }));

  function close(next: boolean) {
    if (!next) {
      form.reset(EMPTY_FORM);
    }
    onOpenChange(next);
  }

  const submit = form.handleSubmit((values) =>
    submitOnce(async () => {
      try {
        const player = await createPlayer.mutateAsync(values);
        form.reset(EMPTY_FORM);
        onCreated(player);
      } catch (error) {
        const fieldError = readApiFieldError(error);
        if (fieldError && FORM_FIELDS.includes(fieldError.field)) {
          form.setError(fieldError.field as Path<NewPlayerFormValues>, {
            message: fieldError.message,
          });
        }
        notifyError('Não foi possível cadastrar o jogador', error);
      }
    }),
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle>Novo jogador</DialogTitle>
          <DialogDescription>
            {hasErrors
              ? 'Corrija os campos destacados para salvar.'
              : 'Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <DialogBody className="flex flex-col gap-5">
            <FormField
              id="new-player-name"
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
                    placeholder="Ex.: Davi Melo"
                    className="pl-9"
                  />
                </div>
              )}
            </FormField>
            <FormField
              id="new-player-position"
              label="Posição"
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
                      invalid={control['aria-invalid']}
                      describedBy={control['aria-describedby']}
                    />
                  )}
                />
              )}
            </FormField>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                id="new-player-age"
                label="Idade"
                help="De 16 a 45 anos."
                error={errors.age?.message}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register('age')}
                    inputMode="numeric"
                    placeholder="Ex.: 23"
                  />
                )}
              </FormField>
              <FormField
                id="new-player-agility"
                label="Agilidade"
                help="De 1 a 100 (até 85 com 35 anos ou mais)."
                error={errors.agility?.message}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register('agility')}
                    inputMode="numeric"
                    placeholder="Ex.: 70"
                  />
                )}
              </FormField>
              <LockedValue
                label="Valor base (moedas)"
                help="Calculado no cadastro."
              />
            </div>
            <div className="flex flex-col gap-1 border-t pt-5">
              <h3 className="text-base font-semibold">Indicadores técnicos</h3>
              <p className="text-sm text-muted-foreground">
                Seis atributos e o potencial, de 1 a 99. Não mudam depois do
                cadastro; a soma dos seis atributos não pode passar de 480.
              </p>
            </div>
            <div className="grid grid-cols-[1fr_280px] gap-4">
              <div className="grid grid-cols-4 content-start gap-x-3 gap-y-4">
                {ATTRIBUTE_FIELDS.map((attribute) => (
                  <FormField
                    key={attribute}
                    id={`new-player-${attribute}`}
                    label={ATTRIBUTE_NAMES[attribute]}
                    error={errors[attribute]?.message}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        {...form.register(attribute)}
                        inputMode="numeric"
                      />
                    )}
                  </FormField>
                ))}
                <FormField
                  id="new-player-potential"
                  label="Potencial"
                  help="≥ maior atributo; igual a ele com 33+ anos"
                  error={errors.potential?.message}
                >
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register('potential')}
                      inputMode="numeric"
                    />
                  )}
                </FormField>
                <LockedValue label="Overall" help="Calculado automaticamente" />
              </div>
              <AttributePreviewCard
                attributes={preview?.attributes}
                potential={preview?.potential}
                hasErrors={hasErrors}
              />
            </div>
          </DialogBody>
          <DialogFooter className="items-center border-t pt-4 sm:justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info aria-hidden className="size-4" />O jogador começa livre e
              Apto.
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => close(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createPlayer.isPending}>
                Salvar jogador
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LockedValue({ label, help }: { label: string; help: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm leading-none font-medium text-muted-foreground">
        {label}
      </span>
      <span className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed bg-muted px-2.5 text-sm whitespace-nowrap text-muted-foreground">
        <Lock aria-hidden className="size-4" />
        Após salvar
      </span>
      <span className="text-xs text-muted-foreground">{help}</span>
    </div>
  );
}

// A prévia só aparece com os seis atributos e o potencial preenchidos com números de 1 a 99.
function readPreview(
  values: Partial<NewPlayerFormValues>,
): { attributes: PlayerAttributes; potential: number } | undefined {
  const toValue = (text: string | undefined) => {
    const value = Number(text);
    return /^\d+$/.test(text?.trim() ?? '') && value >= 1 && value <= 99
      ? value
      : undefined;
  };
  const potential = toValue(values.potential);
  const attributes = Object.fromEntries(
    ATTRIBUTE_FIELDS.map((attribute) => [
      attribute,
      toValue(values[attribute]),
    ]),
  ) as Record<keyof PlayerAttributes, number | undefined>;
  if (
    potential === undefined ||
    Object.values(attributes).some((value) => value === undefined)
  ) {
    return undefined;
  }
  return { attributes: attributes as PlayerAttributes, potential };
}
