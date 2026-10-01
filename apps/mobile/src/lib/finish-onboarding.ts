import { supabase } from '@/lib/supabase';

// The name typed on M-02b goes to both places that show it: the hero
// (characters.name) and the person (users.display_name — what the web
// catalog and public page read).
async function saveName(name: string, userId: string) {
  const [character, user] = await Promise.all([
    supabase.from('characters').update({ name }).eq('user_id', userId),
    supabase.from('users').update({ display_name: name }).eq('id', userId),
  ]);
  return character.error ?? user.error ?? null;
}

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
    // Not fatal for onboarding (the name can be changed in Settings), but
    // retry once and make a failure visible in logs instead of dropping it.
    const firstTry = await saveName(name, userId);
    if (firstTry) {
      const secondTry = await saveName(name, userId);
      if (secondTry) console.error('Failed to save the chosen name', secondTry);
    }
  }

  return { imageUrl: data.character.image_url };
}
