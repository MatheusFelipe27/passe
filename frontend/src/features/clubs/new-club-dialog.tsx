import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Shield, Wallet } from 'lucide-react';
import { useForm, type Path } from 'react-hook-form';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCreateClub } from '@/hooks/use-clubs';
import { useSubmitOnce } from '@/hooks/use-submit-once';
import { readApiFieldError } from '@/lib/api-field-error';
import { formatMoney } from '@/lib/format';
import { notifySuccess } from '@/lib/notify';
import { INITIAL_CASH } from './club-labels';
import { newClubFormSchema, type NewClubFormValues } from './club-form-schema';

type NewClubOutput = z.output<typeof newClubFormSchema>;

const FORM_FIELDS = Object.keys(newClubFormSchema.shape);

const EMPTY_FORM: NewClubFormValues = { name: '', acronym: '' };

const UNKNOWN_ERROR = 'Tente de novo em instantes.';

interface NewClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClubDialog({ open, onOpenChange }: NewClubDialogProps) {
  const navigate = useNavigate();
  const createClub = useCreateClub();
  const submitOnce = useSubmitOnce();
  const [refusal, setRefusal] = useState<string>();
  const form = useForm<NewClubFormValues, unknown, NewClubOutput>({
    resolver: zodResolver(newClubFormSchema),
    defaultValues: EMPTY_FORM,
  });
  const { errors } = form.formState;
  const acronym = form.register('acronym');

  function close(next: boolean) {
    if (!next) {
      form.reset(EMPTY_FORM);
      setRefusal(undefined);
    }
    onOpenChange(next);
  }

  // Recusas da API (nome ou sigla repetidos, limite de 20 clubes, sigla fora do nome) aparecem
  // na faixa com o message; quando ela aponta um campo, o campo também fica destacado.
  const submit = form.handleSubmit((values) =>
    submitOnce(async () => {
      setRefusal(undefined);
      try {
        const club = await createClub.mutateAsync(values);
        close(false);
        notifySuccess(
          'Clube criado',
          `${club.name} (${club.acronym}) começa com ${formatMoney(club.cash)} em caixa.`,
        );
        void navigate(`/clubes/${club.id}`);
      } catch (error) {
        const fieldError = readApiFieldError(error);
        if (fieldError && FORM_FIELDS.includes(fieldError.field)) {
          form.setError(fieldError.field as Path<NewClubFormValues>, {
            message: fieldError.message,
          });
          setRefusal(fieldError.message);
          return;
        }
        setRefusal(error instanceof Error ? error.message : UNKNOWN_ERROR);
      }
    }),
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Novo clube</DialogTitle>
          <DialogDescription>
            Informe o nome e a sigla do clube.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          {refusal && (
            <Alert
              variant="destructive"
              className="border-destructive-soft-border bg-destructive-soft px-4 py-3"
            >
              <CircleAlert aria-hidden />
              <AlertTitle>Não foi possível criar o clube</AlertTitle>
              <AlertDescription>{refusal}</AlertDescription>
            </Alert>
          )}
          <FormField
            id="new-club-name"
            label="Nome"
            help="De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube."
            error={errors.name?.message}
          >
            {(control) => (
              <div className="relative">
                <Shield
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  {...control}
                  {...form.register('name')}
                  placeholder="Ex.: Leões da Serra"
                  className="pl-9"
                />
              </div>
            )}
          </FormField>
          <FormField
            id="new-club-acronym"
            label="Sigla"
            help="3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome."
            error={errors.acronym?.message}
          >
            {(control) => (
              <Input
                {...control}
                {...acronym}
                onChange={(event) => {
                  event.target.value = event.target.value.toUpperCase();
                  return acronym.onChange(event);
                }}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Ex.: LDS"
              />
            )}
          </FormField>
          <p className="flex items-center gap-2.5 rounded-lg border bg-muted-subtle px-3 py-2.5 text-sm text-muted-foreground">
            <Wallet aria-hidden className="size-4 shrink-0" />O clube começa com{' '}
            {formatMoney(INITIAL_CASH)} em caixa e sem jogadores.
          </p>
          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createClub.isPending}>
              Criar clube
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
