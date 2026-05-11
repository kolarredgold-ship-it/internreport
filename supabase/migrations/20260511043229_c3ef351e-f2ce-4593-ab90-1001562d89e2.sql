
DROP POLICY IF EXISTS "Admins or purchasers can view product" ON public.digital_products;

CREATE POLICY "Admins or purchasers can view product"
ON public.digital_products FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.product_id = digital_products.id
      AND p.user_id = auth.uid()
      AND p.status = 'verified'
  )
);
