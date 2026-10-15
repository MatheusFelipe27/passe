import { cn } from 'cn';
import type { Position } from '@/api/players';
import { POSITION_NAMES, POSITIONS } from './player-labels';

interface PositionPickerProps {
  id: string;
  value: Position | undefined;
  onChange: (position: Position) => void;
  isDisabled?: (position: Position) => boolean;
  invalid?: boolean;
  describedBy?: string;
}

// Escolha da posição em cartões (GOL, ZAG, LAT, MEI, ATA), como um grupo de opções.
export function PositionPicker({
  id,
  value,
  onChange,
  isDisabled = () => false,
  invalid = false,
  describedBy,
}: PositionPickerProps) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="Posição"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className="grid grid-cols-5 gap-2"
    >
      {POSITIONS.map((position) => {
        const checked = position === value;
        const disabled = isDisabled(position);
        return (
          <button
            key={position}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(position)}
            className={cn(
              'flex flex-col items-center rounded-lg border px-2 py-2 transition-colors disabled:opacity-50',
              checked
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border bg-background hover:bg-accent',
              invalid && !checked && 'border-destructive',
            )}
          >
            <span className="text-sm font-semibold">{position}</span>
            <span
              className={cn(
                'text-xs',
                checked ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {POSITION_NAMES[position]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
