import { request, requestFile, type DownloadedFile } from './http-client';

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

export interface TransactionSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface TransactionHistory {
  data: Transaction[];
  summary: TransactionSummary;
}

// Query params do histórico e do CSV, com os nomes do contrato da API.
export interface TransactionFilters {
  type?: string;
  player_id?: number;
}

export function getTransactions(
  clubId: string,
  filters: TransactionFilters,
): Promise<TransactionHistory> {
  return request<TransactionHistory>(
    `/clubs/${encodeURIComponent(clubId)}/transactions`,
    { query: { ...filters } },
  );
}

// RN18: o CSV vem pronto da API, com os mesmos filtros do histórico.
export function exportTransactions(
  clubId: string,
  filters: TransactionFilters,
): Promise<DownloadedFile> {
  return requestFile(
    `/clubs/${encodeURIComponent(clubId)}/transactions/export`,
    { query: { ...filters } },
  );
}
