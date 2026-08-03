export interface Company { id:string; name:string; slug:string; color:string; }
export interface Client { id:string; name:string; phone?:string; email?:string; cpf_cnpj?:string; city?:string; state?:string; notes?:string; company_id?:string; created_at:string; updated_at:string; order_count?:number; total_spent?:number; }
export interface Product { id:string; order_id:string; name:string; reference?:string; color?:string; size?:string; quantity:number; unit_value:number; total_value:number; notes?:string; }
export interface ChecklistItem { id:string; order_id:string; step:string; completed:boolean; completed_at?:string; user_id?:string; user_name?:string; }
export interface Payment { id:string; order_id:string; amount:number; method:string; paid_at:string; notes?:string; }
export interface HistoryEntry { id:string; order_id?:string; client_id?:string; user_id?:string; user_name?:string; action:string; description:string; created_at:string; }
export interface Order { id:string; number:string; client_id:string; client_name?:string; company_id:string; company_name?:string; company_color?:string; entry_date:string; expected_date:string; delivery_date?:string; status:'producao'|'entregue'|'atrasado'; payment_status:'pendente'|'pago'|'parcial'; payment_method?:string; total_value:number; received_value:number; notes?:string; created_at:string; updated_at:string; products?:Product[]; checklist?:ChecklistItem[]; payments?:Payment[]; history?:HistoryEntry[]; current_step?:string; }
export interface DashboardStats { total_clients:number; active_orders:number; in_production:number; delivered:number; delayed:number; month_revenue:number; pending_value:number; average_ticket:number; total_billed:number; week_deliveries:number; }
export type OrderStatus='producao'|'entregue'|'atrasado';
export type PaymentStatus='pendente'|'pago'|'parcial';
export const CHECKLIST_STEPS=['Tecido','Corte','Costura','Silk','Bordado','DTG','Limpeza','Entrega'] as const;
export const STATUS_LABELS:Record<string,string>={producao:'Produção',entregue:'Entregue',atrasado:'Atrasado'};
export const STATUS_COLORS:Record<string,string>={producao:'#EAB308',entregue:'#22C55E',atrasado:'#EF4444'};
export const PAYMENT_STATUS_LABELS:Record<string,string>={pendente:'Pendente',pago:'Pago',parcial:'Parcial'};
export const PAYMENT_METHOD_LABELS:Record<string,string>={pix:'PIX',transferencia:'Transferência',dinheiro:'Dinheiro',cartao:'Cartão',boleto:'Boleto'};
