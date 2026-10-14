import { ArrowUpDown, ChevronDown } from 'lucide-react';
import type { PlayerSort } from '@/api/players';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SORT_NAMES } from './player-labels';

interface SortMenuProps {
  value: PlayerSort;
  onChange: (sort: PlayerSort) => void;
}

export function SortMenu({ value, onChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-input font-normal">
          <ArrowUpDown aria-hidden />
          Ordenar: {lowerFirst(SORT_NAMES[value])}
          <ChevronDown aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as PlayerSort)}
        >
          {(Object.keys(SORT_NAMES) as PlayerSort[]).map((sort) => (
            <DropdownMenuRadioItem key={sort} value={sort}>
              {SORT_NAMES[sort]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
