-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Members can view chama members" ON public.chama_members;

-- Create a security definer function to check chama membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_chama_member(_user_id uuid, _chama_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chama_members
    WHERE user_id = _user_id
      AND chama_id = _chama_id
      AND status = 'active'
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Members can view chama members"
ON public.chama_members
FOR SELECT
USING (
  public.is_chama_member(auth.uid(), chama_id)
);