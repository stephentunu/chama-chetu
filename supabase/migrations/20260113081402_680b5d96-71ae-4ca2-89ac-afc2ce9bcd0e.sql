-- Allow admins to view all chamas
CREATE POLICY "Admins can view all chamas"
ON public.chamas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow admins to insert chamas (they may be creating on behalf of others)
CREATE POLICY "Admins can create chamas"
ON public.chamas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow admins to insert chama members (to add members to chamas)
CREATE POLICY "Admins can add chama members"
ON public.chama_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow authenticated users to view active chamas for joining
CREATE POLICY "Authenticated users can view active chamas"
ON public.chamas
FOR SELECT
USING (status = 'active');