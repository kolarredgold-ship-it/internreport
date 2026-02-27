
-- Admin needs to delete questions
CREATE POLICY "Admins can delete questions" ON public.question_bank FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
