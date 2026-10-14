import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInteger, pluralize } from '@/lib/format';

const VISIBLE_PAGES = 5;

interface PaginationBarProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  itemLabel: { singular: string; plural: string };
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  page,
  limit,
  totalItems,
  totalPages,
  itemLabel,
  onPageChange,
}: PaginationBarProps) {
  const first = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, totalItems);
  const label = pluralize(totalItems, itemLabel.singular, itemLabel.plural);
  const pages = visiblePages(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {first > last
          ? `Nenhum ${itemLabel.singular} nesta página, de ${formatInteger(totalItems)} ${label}`
          : `Mostrando ${formatInteger(first)}–${formatInteger(last)} de ${formatInteger(totalItems)} ${label}`}
      </span>
      <nav aria-label="Paginação" className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
          Anterior
        </Button>
        {pages.map((number) => (
          <Button
            key={number}
            variant={number === page ? 'outline' : 'ghost'}
            size="icon-sm"
            aria-label={`Página ${number}`}
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onPageChange(number)}
          >
            {number}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
          <ChevronRight aria-hidden />
        </Button>
      </nav>
    </div>
  );
}

// Janela de até 5 páginas em volta da atual, para a barra não crescer com a lista.
function visiblePages(page: number, totalPages: number): number[] {
  const start = Math.max(
    1,
    Math.min(
      page - Math.floor(VISIBLE_PAGES / 2),
      totalPages - VISIBLE_PAGES + 1,
    ),
  );
  const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, index) => start + index,
  );
}
