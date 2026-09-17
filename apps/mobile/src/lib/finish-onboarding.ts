import { supabase } from '@/lib/supabase';

// Shared by character-assembly.tsx (session already exists) and by
// signup.tsx/login.tsx (right after auth succeeds): calls the
// assemble-character Edge Function (needs a JWT, hence this can only
// run once a session exists) and writes the name the user picked back
// on M-02b, since the function itself doesn't know about it.
export async function assembleCharacter({
  bodyTag,
  styleTag,
  name,
  userId,
}: {
  bodyTag: string;
  styleTag: string;
  name?: string;
  userId: string;
}): Promise<{ imageUrl?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('assemble-character', {
    body: { bodyTag, styleTag },
  });

  if (error || !data?.character) {
    console.error(error);
    return { error: 'Не удалось собрать персонажа. Попробуйте ещё раз.' };
  }

  if (name) {
    const { error: nameError } = await supabase.from('characters').update({ name }).eq('user_id', userId);
    if (nameError) {
      console.error(nameError);
    }
  }

  return { imageUrl: data.character.image_url };
}
