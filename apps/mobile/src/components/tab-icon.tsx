import Svg, { Circle, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';

// Tab bar icons: the Lucide glyphs house, trophy, shopping-bag and user
// (https://lucide.dev, ISC license), drawn with react-native-svg. 24×24 grid,
// 2px round stroke; the colour comes from the tab tint.
export type TabIconName = 'home' | 'challenges' | 'shop' | 'profile';

const PATHS: Record<TabIconName, string[]> = {
  home: [
    'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
    'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  ],
  challenges: [
    'M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2',
    'M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2',
    'M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3',
    'M4 22h16',
    'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z',
    'M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3',
  ],
  shop: [
    'M16 10a4 4 0 0 1-8 0',
    'M3.103 6.034h17.794',
    'M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z',
  ],
  profile: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],
};

export function TabIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name].map((d) => (
        <Path key={d} d={d} />
      ))}
      {name === 'profile' && <Circle cx={12} cy={7} r={4} />}
    </Svg>
  );
}
