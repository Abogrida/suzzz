export type Product = {
    id: number;
    name: string;
    category: string;
    unit: string;
    initial_quantity: number;
    current_quantity: number;
    min_quantity: number;
    price: number;
    sale_price: number;
    barcode: string;
    description: string;
    created_at: string;
    updated_at: string;
};

export type Category = {
    id: number;
    name: string;
    description: string;
    created_at: string;
    product_count?: number;
};

export type Customer = {
    id: number;
    name: string;
    phone: string;
    address: string;
    customer_type: 'customer' | 'supplier';
    notes: string;
    created_at: string;
    updated_at: string;
};

export type InvoiceItem = {
    id?: number;
    invoice_id?: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
};

export type Invoice = {
    id: number;
    invoice_number: string;
    invoice_type: 'sale' | 'purchase';
    customer_id: number | null;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    payment_status: 'paid' | 'partial' | 'unpaid';
    payment_method: 'cash' | 'bank' | 'check';
    notes: string;
    created_at: string;
    updated_at: string;
    items?: InvoiceItem[];
};

export type StockMovement = {
    id: number;
    product_id: number;
    movement_type: string;
    quantity: number;
    notes: string;
    created_at: string;
    product_name?: string;
};

export type Statistics = {
    total_products: number;
    total_value: number;
    low_stock: number;
    out_of_stock: number;
};

export type InvoiceStatistics = {
    sale_count: number;
    purchase_count: number;
    total_sales: number;
    total_purchases: number;
    profit: number;
};

export type FinancialSummary = {
    total_sales: number;
    total_purchases: number;
    total_profit: number;
    total_paid: number;
    total_remaining: number;
    inventory_value: number;
    sales_count: number;
    purchases_count: number;
    avg_sale: number;
    avg_purchase: number;
};

export type MonthlyFinancial = {
    month: string;
    sales: number;
    purchases: number;
    profit: number;
    sales_count: number;
    purchases_count: number;
};

export type ApiResponse<T = unknown> = {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
};
