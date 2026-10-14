import { useState, type FormEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { describeRange, type RangeValue } from './describe-range';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RangeFilterProps {
  icon: LucideIcon;
  label: string;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  // Converte o texto digitado para o formato da API, ou devolve a mensagem de erro.
  parse: (text: string) => { value: string } | { error: string };
  format: (value: string) => string;
  placeholder: { min: string; max: string };
}

// Filtro de faixa (mínimo e máximo, os dois opcionais), num popover.
export function RangeFilter({
  icon: Icon,
  label,
  value,
  onChange,
  parse,
  format,
  placeholder,
}: RangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ min: '', max: '' });
  const [error, setError] = useState<string>();

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft({
        min: value.min ? format(value.min) : '',
        max: value.max ? format(value.max) : '',
      });
      setError(undefined);
    }
    setOpen(next);
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    const min = draft.min.trim() ? parse(draft.min.trim()) : undefined;
    const max = draft.max.trim() ? parse(draft.max.trim()) : undefined;
    const invalid = [min, max].find((result) => result && 'error' in result);
    if (invalid && 'error' in invalid) {
      setError(invalid.error);
      return;
    }
    const range = {
      min: min && 'value' in min ? min.value : undefined,
      max: max && 'value' in max ? max.value : undefined,
    };
    if (range.min && range.max && Number(range.min) > Number(range.max)) {
      setError('O mínimo não pode ser maior que o máximo.');
      return;
    }
    onChange(range);
    setOpen(false);
  }

  function clear() {
    onChange({});
    setOpen(false);
  }

  const summary = describeRange(value, format);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'border-input font-normal',
            !summary && 'text-muted-foreground',
          )}
        >
          <Icon aria-hidden />
          {summary ? `${label}: ${summary}` : label}
          <ChevronDown aria-hidden className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={apply} className="flex flex-col gap-3" noValidate>
          <span className="text-sm font-medium">{label}</span>
          <div className="flex gap-3">
            <RangeInput
              id={`${label}-min`}
              label="Mínimo"
              value={draft.min}
              placeholder={placeholder.min}
              invalid={Boolean(error)}
              onChange={(min) => setDraft({ ...draft, min })}
            />
            <RangeInput
              id={`${label}-max`}
              label="Máximo"
              value={draft.max}
              placeholder={placeholder.max}
              invalid={Boolean(error)}
              onChange={(max) => setDraft({ ...draft, max })}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Limpar
            </Button>
            <Button type="submit" size="sm">
              Aplicar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function RangeInput({
  id,
  label,
  value,
  placeholder,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
