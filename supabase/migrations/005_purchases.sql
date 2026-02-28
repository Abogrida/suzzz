CREATE TABLE IF NOT EXISTS public.hr_employee_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id INTEGER REFERENCES public.hr_employees(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.hr_employee_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL for service-role on hr_employee_purchases"
    ON public.hr_employee_purchases
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Adding an index for faster lookups
CREATE INDEX IF NOT EXISTS hr_employee_purchases_employee_id_idx ON public.hr_employee_purchases (employee_id);
CREATE INDEX IF NOT EXISTS hr_employee_purchases_date_idx ON public.hr_employee_purchases (purchase_date);
