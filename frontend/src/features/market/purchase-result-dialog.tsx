import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ResultDialog } from '@/components/result-dialog';
import { ResultList, ResultRow } from '@/components/result-list';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { BoughtPlayer } from './buy-player-dialog';
import { ContractStatusBadge } from './contract-status-badge';

interface PurchaseResultDialogProps {
  result: BoughtPlayer | undefined;
  onClose: () => void;
}

// Resultado da compra com os valores devolvidos pela API. O custo total é a saída do caixa.
export function PurchaseResultDialog({
  result,
  onClose,
}: PurchaseResultDialogProps) {
  const navigate = useNavigate();
  if (!result) {
    return null;
  }
  const { purchase, club } = result;

  return (
    <ResultDialog
      open
      title="Compra concluída"
      description={`${purchase.player_name} agora é do ${club.name}.`}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              void navigate(`/clubes/${purchase.club_id}`);
            }}
          >
            Ver clube
            <ArrowRight aria-hidden />
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </>
      }
    >
      <ResultList>
        <ResultRow
          label="Valor"
          help="Valor de mercado no momento da compra"
          value={formatMoney(purchase.value)}
        />
        <ResultRow
          label="Taxa"
          help={
            purchase.fee > 0
              ? '5% do valor, porque passa de 30,00'
              : 'Sem taxa: o valor não passa de 30,00'
          }
          value={formatMoney(purchase.fee)}
        />
        <ResultRow
          label="Custo total"
          help="Valor + taxa"
          value={formatMoney(-purchase.cash_change)}
          highlight
        />
        <ResultRow
          label="Fim da fidelidade"
          value={formatDateTime(purchase.contract.loyalty_until)}
        />
        <ResultRow
          label="Contrato"
          value={<ContractStatusBadge status={purchase.contract.status} />}
        />
        <ResultRow
          label={`Novo caixa do ${club.name}`}
          value={formatMoney(purchase.club_cash)}
          highlight
        />
      </ResultList>
    </ResultDialog>
  );
}
