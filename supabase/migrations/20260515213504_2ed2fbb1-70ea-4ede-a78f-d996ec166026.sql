
CREATE POLICY "Deny public writes to preachers"
  ON public.preachers
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny public writes to sermons"
  ON public.sermons
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
