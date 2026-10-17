import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ALL = '';

export interface FilterOption {
  value: string;
  label: string;
}

interface OptionFilterProps {
  icon: LucideIcon;
  label: string;
  allLabel: string;
  options: FilterOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  // Sem escolha, o botão mostra "Rótulo: todos" em vez de só o rótulo (como no filtro do histórico).
  showAllLabel?: boolean;
}

// Filtro de um valor só, num menu: o botão mostra a escolha atual.
export function OptionFilter({
  icon: Icon,
  label,
  allLabel,
  options,
  value,
  onChange,
  disabled = false,
  showAllLabel = false,
}: OptionFilterProps) {
  const selected = options.find((option) => option.value === value);
  const isMuted = !selected && !showAllLabel;
  const buttonText = selected
    ? `${label}: ${selected.label}`
    : showAllLabel
      ? `${label}: ${allLabel.toLowerCase()}`
      : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className={cn(
            'border-input font-normal',
            isMuted && 'text-muted-foreground',
          )}
        >
          <Icon aria-hidden />
          {buttonText}
          <ChevronDown aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value ?? ALL}
          onValueChange={(next) => onChange(next === ALL ? undefined : next)}
        >
          <DropdownMenuRadioItem value={ALL}>{allLabel}</DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
