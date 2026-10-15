import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SortMenuProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (sort: T) => void;
}

// Menu "Ordenar": as opções vão para a API, que devolve a lista já na ordem escolhida.
export function SortMenu<T extends string>({
  value,
  options,
  onChange,
}: SortMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-input font-normal">
          <ArrowUpDown aria-hidden />
          Ordenar: {lowerFirst(options[value])}
          <ChevronDown aria-hidden className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as T)}
        >
          {(Object.keys(options) as T[]).map((sort) => (
            <DropdownMenuRadioItem key={sort} value={sort}>
              {options[sort]}
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
