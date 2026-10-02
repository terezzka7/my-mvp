import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';

// Lucide glyphs (https://lucide.dev, ISC license) drawn with react-native-svg.
// 24×24 grid, round stroke. One place for every icon in the app, so they all
// share the same weight; add a glyph here rather than drawing one in a screen.
export type LucideName = 'house' | 'trophy' | 'shopping-bag' | 'user' | 'flame' | 'dumbbell' | 'link' | 'lock';

type Shape =
  | { d: string }
  | { circle: [cx: number, cy: number, r: number] }
  | { rect: [x: number, y: number, width: number, height: number, rx: number] };

const SHAPES: Record<LucideName, Shape[]> = {
  house: [
    { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' },
    { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  ],
  trophy: [
    { d: 'M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2' },
    { d: 'M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2' },
    { d: 'M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3' },
    { d: 'M4 22h16' },
    { d: 'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z' },
    { d: 'M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3' },
  ],
  'shopping-bag': [
    { d: 'M16 10a4 4 0 0 1-8 0' },
    { d: 'M3.103 6.034h17.794' },
    { d: 'M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z' },
  ],
  user: [{ d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }, { circle: [12, 7, 4] }],
  flame: [{ d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4' }],
  dumbbell: [
    { d: 'M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z' },
    { d: 'm2.5 21.5 1.4-1.4' },
    { d: 'm20.1 3.9 1.4-1.4' },
    { d: 'M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z' },
    { d: 'm9.6 14.4 4.8-4.8' },
  ],
  link: [
    { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
    { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  ],
  lock: [{ rect: [3, 11, 18, 11, 2] }, { d: 'M7 11V7a5 5 0 0 1 10 0v4' }],
};

export function LucideIcon({
  name,
  color,
  size = 24,
  strokeWidth = 2,
}: {
  name: LucideName;
  color: ColorValue;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SHAPES[name].map((shape, i) => {
        if ('d' in shape) return <Path key={i} d={shape.d} />;
        if ('circle' in shape) return <Circle key={i} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} />;
        const [x, y, width, height, rx] = shape.rect;
        return <Rect key={i} x={x} y={y} width={width} height={height} rx={rx} />;
      })}
    </Svg>
  );
}
