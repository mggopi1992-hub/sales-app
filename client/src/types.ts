export type Role = 'admin' | 'employee';
export interface User { id: number; name: string; email: string; role: Role }
export type Period = 'daily' | 'weekly' | 'monthly';
// Postgres NUMERIC/BIGINT arrive as strings -> wrap with Number() when calculating
export interface SummaryRow { period: string; orders: string; units: string; revenue: string; delivered_revenue: string }
export interface EmployeeRow { user_id: number; employee: string; orders: string; units: string; revenue: string }
export interface SaleRow {
  id: string; user_id: number; employee: string; cust_id: string; cust_name: string; order_id: string;
  item_name: string; order_date: string; quantity: number; price: string; total: string; is_delivered: boolean;
}
export interface Upload { id: number; file_name: string; sales_date: string; row_count: number; uploaded_at: string }
export interface AppUser extends User { is_verified: boolean; is_active: boolean; created_at: string }
