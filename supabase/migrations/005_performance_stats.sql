-- SQL functions for high-performance dashboard statistics

-- 1. Get product stats (total count, total value, low stock, out of stock)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_products BIGINT,
    total_value NUMERIC,
    low_stock BIGINT,
    out_of_stock BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_products,
        COALESCE(SUM(current_quantity * price), 0)::NUMERIC as total_value,
        COUNT(*) FILTER (WHERE current_quantity > 0 AND current_quantity <= min_quantity)::BIGINT as low_stock,
        COUNT(*) FILTER (WHERE current_quantity <= 0)::BIGINT as out_of_stock
    FROM products;
END;
$$;

-- 2. Get invoice stats (counts and totals for sales and purchases)
CREATE OR REPLACE FUNCTION get_invoice_stats()
RETURNS TABLE (
    sale_count BIGINT,
    purchase_count BIGINT,
    total_sales NUMERIC,
    total_purchases NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE invoice_type = 'sale')::BIGINT as sale_count,
        COUNT(*) FILTER (WHERE invoice_type = 'purchase')::BIGINT as purchase_count,
        COALESCE(SUM(total_amount) FILTER (WHERE invoice_type = 'sale'), 0)::NUMERIC as total_sales,
        COALESCE(SUM(total_amount) FILTER (WHERE invoice_type = 'purchase'), 0)::NUMERIC as total_purchases
    FROM invoices;
END;
$$;
