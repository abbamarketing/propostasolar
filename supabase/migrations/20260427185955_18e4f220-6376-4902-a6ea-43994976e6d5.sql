DROP POLICY IF EXISTS "Company users can manage modules" ON public.products_modules;
DROP POLICY IF EXISTS "Company users can manage inverters" ON public.products_inverters;
DROP POLICY IF EXISTS "Company users can manage structure costs" ON public.structure_costs;
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities_irradiance;
DROP POLICY IF EXISTS "Admins can manage tariffs" ON public.tariffs;

CREATE POLICY "Company users can view modules" ON public.products_modules FOR SELECT TO authenticated USING (company_id = private.auth_company_id());
CREATE POLICY "Admins and managers can insert modules" ON public.products_modules FOR INSERT TO authenticated WITH CHECK (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));
CREATE POLICY "Admins and managers can update modules" ON public.products_modules FOR UPDATE TO authenticated USING (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor'))) WITH CHECK (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));
CREATE POLICY "Admins and managers can delete modules" ON public.products_modules FOR DELETE TO authenticated USING (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));

CREATE POLICY "Company users can view inverters" ON public.products_inverters FOR SELECT TO authenticated USING (company_id = private.auth_company_id());
CREATE POLICY "Admins and managers can insert inverters" ON public.products_inverters FOR INSERT TO authenticated WITH CHECK (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));
CREATE POLICY "Admins and managers can update inverters" ON public.products_inverters FOR UPDATE TO authenticated USING (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor'))) WITH CHECK (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));
CREATE POLICY "Admins and managers can delete inverters" ON public.products_inverters FOR DELETE TO authenticated USING (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));

CREATE POLICY "Company users can view structure costs" ON public.structure_costs FOR SELECT TO authenticated USING (company_id = private.auth_company_id());
CREATE POLICY "Admins and managers can insert structure costs" ON public.structure_costs FOR INSERT TO authenticated WITH CHECK (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));
CREATE POLICY "Admins and managers can update structure costs" ON public.structure_costs FOR UPDATE TO authenticated USING (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor'))) WITH CHECK (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));
CREATE POLICY "Admins and managers can delete structure costs" ON public.structure_costs FOR DELETE TO authenticated USING (company_id = private.auth_company_id() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')));

CREATE POLICY "Admins and managers can manage cities" ON public.cities_irradiance FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')) WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Admins and managers can manage tariffs" ON public.tariffs FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor')) WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'gestor'));
