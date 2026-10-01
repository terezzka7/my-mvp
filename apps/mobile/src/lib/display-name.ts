// Single rule for "what do we call this person": the name they set
// (users.display_name) → the name they gave their hero (characters.name)
// → the technical username as a last resort.
export function resolveDisplayName(
  displayName: string | null | undefined,
  characterName: string | null | undefined,
  username: string,
): string {
  return displayName?.trim() || characterName?.trim() || username;
}
