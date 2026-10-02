import type { ColorValue } from 'react-native';

import { LucideIcon, type LucideName } from '@/components/lucide-icon';

// Tab bar icons: home, trophy, shopping bag, user. The glyphs live in
// components/lucide-icon.tsx; the colour comes from the tab tint.
export type TabIconName = 'home' | 'challenges' | 'shop' | 'profile';

const GLYPHS: Record<TabIconName, LucideName> = {
  home: 'house',
  challenges: 'trophy',
  shop: 'shopping-bag',
  profile: 'user',
};

export function TabIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  return <LucideIcon name={GLYPHS[name]} color={color} />;
}
