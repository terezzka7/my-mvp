// Design tokens from product_book.md §12. Product is intentionally
// always-dark (техно-минимализм на тёмном фоне) — no light-mode variant.

export const Colors = {
  bg: '#0D0D0D',
  surface: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)',
  accent: '#C6FF00',
  accentText: '#0D0D0D',
  text: '#F5F5F5',
  textMuted: 'rgba(245,245,245,0.5)',
} as const;

export const Fonts = {
  // Заголовки (display): Inter 700–800, обычная ширина, без капса/конденседа
  displayBold: 'Inter_700Bold',
  displayExtraBold: 'Inter_800ExtraBold',
  // Body: Inter 400–500
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  // Мелкие лейблы/овер-лайны: Inter 600–700, uppercase, tracking, цвет акцента
  overlineSemiBold: 'Inter_600SemiBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  card: 20, // inner padding of a card (radius 24)
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  card: 24,
  tile: 16,
  pill: 999,
} as const;
