import { cn } from 'cn';
import type { Sale } from '@/api/market';
import { ResultDialog } from '@/components/result-dialog';
import { ResultList, ResultRow } from '@/components/result-list';
import { Button } from '@/components/ui/button';
import { formatInteger, formatMoney, formatSignedMoney } from '@/lib/format';
import { ContractStatusBadge } from './contract-status-badge';

interface SaleResultDialogProps {
  sale: Sale | undefined;
  clubName: string;
  onClose: () => void;
}

// Resultado da venda com os valores devolvidos pela API; os textos só dizem se houve multa e lucro.
export function SaleResultDialog({
  sale,
  clubName,
  onClose,
}: SaleResultDialogProps) {
  if (!sale) {
    return null;
  }
  const hasPenalty = sale.penalty > 0;
  const profit = sale.profit ?? 0;

  return (
    <ResultDialog
      open
      title="Venda concluída"
      description={
        hasPenalty
          ? `${sale.player_name} voltou a ficar livre.`
          : `${sale.player_name} voltou a ficar livre. A fidelidade já tinha terminado, então não houve multa.`
      }
      onClose={onClose}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      <ResultList>
        <ResultRow
          label="Valor de compra"
          value={formatMoney(sale.purchase_value)}
        />
        <ResultRow
          label="Valor de venda"
          help="Valor de mercado no momento da venda"
          value={formatMoney(sale.value)}
        />
        <ResultRow
          label="Dias restantes"
          value={formatInteger(sale.remaining_days)}
        />
        <ResultRow
          label="Multa"
          help={
            hasPenalty
              ? `${sale.penalty_rate}% do valor de venda, com teto de 10,00`
              : 'Fidelidade cumprida: sem multa'
          }
          value={formatMoney(sale.penalty)}
        />
        <ResultRow
          label="Lucro"
          value={formatSignedMoney(profit)}
          valueClassName={cn(
            profit > 0 && 'text-success',
            profit < 0 && 'text-destructive',
          )}
        />
        <ResultRow
          label="Comissão"
          help={
            profit > 0
              ? '10% do lucro até 10,00 + 20% do que passar'
              : 'Sem lucro: sem comissão'
          }
          value={formatMoney(sale.fee)}
        />
        <ResultRow
          label="Crédito no caixa"
          help="Valor de venda − multa − comissão"
          value={formatSignedMoney(sale.cash_change)}
          highlight
        />
        <ResultRow
          label="Contrato"
          value={<ContractStatusBadge status={sale.contract_status} />}
        />
        <ResultRow
          label={`Novo caixa do ${clubName}`}
          value={formatMoney(sale.club_cash)}
          highlight
        />
      </ResultList>
    </ResultDialog>
  );
}
