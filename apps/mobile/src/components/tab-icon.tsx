import { View, type ColorValue } from 'react-native';

// Tab bar icons drawn from plain Views: no icon package is named in §11, and
// four simple outline glyphs don't need one. Each sits in a 24×24 box with a
// 2px stroke, so they read as one set; colour comes from the tab tint.
export type TabIconName = 'home' | 'challenges' | 'shop' | 'profile';

const SIZE = 24;
const STROKE = 2;

function Home({ color }: { color: ColorValue }) {
  return (
    <>
      {/* roof: a rotated square with only its top-left corner drawn */}
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: 5,
          width: 14,
          height: 14,
          borderLeftWidth: STROKE,
          borderTopWidth: STROKE,
          borderColor: color,
          borderTopLeftRadius: 3,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* walls */}
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          left: 5,
          width: 14,
          height: 11,
          borderWidth: STROKE,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
      {/* door */}
      <View
        style={{
          position: 'absolute',
          bottom: 3,
          left: 10,
          width: 4,
          height: 5,
          backgroundColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />
    </>
  );
}

// A flag on a pole: the goal you are heading for.
function Challenges({ color }: { color: ColorValue }) {
  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: 5,
          width: STROKE,
          height: 20,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: 7,
          width: 13,
          height: 9,
          backgroundColor: color,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </>
  );
}

function Shop({ color }: { color: ColorValue }) {
  return (
    <>
      {/* handle */}
      <View
        style={{
          position: 'absolute',
          top: 1,
          left: 8,
          width: 8,
          height: 7,
          borderWidth: STROKE,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }}
      />
      {/* bag */}
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          left: 3,
          width: 18,
          height: 15,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 4,
        }}
      />
    </>
  );
}

function Profile({ color }: { color: ColorValue }) {
  return (
    <>
      {/* head */}
      <View
        style={{
          position: 'absolute',
          top: 1,
          left: 7,
          width: 10,
          height: 10,
          borderWidth: STROKE,
          borderColor: color,
          borderRadius: 5,
        }}
      />
      {/* shoulders */}
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          left: 3,
          width: 18,
          height: 9,
          borderWidth: STROKE,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 9,
          borderTopRightRadius: 9,
        }}
      />
    </>
  );
}

export function TabIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  return (
    <View style={{ width: SIZE, height: SIZE }}>
      {name === 'home' && <Home color={color} />}
      {name === 'challenges' && <Challenges color={color} />}
      {name === 'shop' && <Shop color={color} />}
      {name === 'profile' && <Profile color={color} />}
    </View>
  );
}
