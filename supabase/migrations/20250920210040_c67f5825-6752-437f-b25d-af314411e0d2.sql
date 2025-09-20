-- Drop the overly permissive policy
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create a more secure policy that only allows viewing profiles of users you're interacting with
CREATE POLICY "Users can view profiles of chat participants" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    AND (chats.buyer_id = profiles.user_id OR chats.seller_id = profiles.user_id)
  ) OR
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.seller_id = profiles.user_id
    AND auth.uid() IS NOT NULL
  )
);