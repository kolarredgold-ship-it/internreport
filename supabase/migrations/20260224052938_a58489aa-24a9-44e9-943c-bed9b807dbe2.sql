-- Add product_id column to payments table
ALTER TABLE public.payments ADD COLUMN product_id uuid REFERENCES public.digital_products(id);

-- Create index for faster lookups
CREATE INDEX idx_payments_product_id ON public.payments(product_id);
