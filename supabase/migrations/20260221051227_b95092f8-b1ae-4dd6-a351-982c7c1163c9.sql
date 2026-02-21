
-- Add offer_price, actual_price, and download_count to digital_products
ALTER TABLE public.digital_products 
  ADD COLUMN IF NOT EXISTS offer_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;

-- Update existing products: set actual_price from current price, offer_price = 299
UPDATE public.digital_products SET actual_price = 14999, offer_price = 299;
