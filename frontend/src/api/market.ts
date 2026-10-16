import { request } from './http-client';

export type TransactionType = 'COMPRA' | 'VENDA';

export type ContractStatus = 'ATIVO' | 'RESCINDIDO' | 'ENCERRADO';

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface Purchase extends Transaction {
  contract: {
    purchase_value: number;
    loyalty_until: string;
    status: ContractStatus;
  };
  club_cash: number;
}

export interface Sale extends Transaction {
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: ContractStatus;
  club_cash: number;
}

export interface PurchaseOrder {
  club_id: number;
  loyalty_until: string;
}

export function buyPlayer(
  playerId: number,
  order: PurchaseOrder,
): Promise<Purchase> {
  return request<Purchase>(`/players/${playerId}/buy`, {
    method: 'POST',
    body: order,
  });
}

// A venda não tem corpo: é feita pelo clube atual do jogador.
export function sellPlayer(playerId: number): Promise<Sale> {
  return request<Sale>(`/players/${playerId}/sell`, { method: 'POST' });
}
