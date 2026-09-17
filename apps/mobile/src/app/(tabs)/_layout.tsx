import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

// M-04/M-07/M-10/M-12 tab bar (§9.2: "Tab Bar" root of the primary
// nav). Geometric shapes instead of an icon library — no icon package
// is in §11, and these four shapes (square/diamond/circle/ring) are
// simple enough as plain Views, matching how the design mockup itself
// drew them (colored divs, no icon font).
function TabIcon({ shape, color }: { shape: 'square' | 'diamond' | 'circle' | 'ring'; color: ColorValue }) {
  if (shape === 'ring') {
    return (
      <View
        style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: color }}
      />
    );
  }
  if (shape === 'diamond') {
    return (
      <View
        style={{ width: 13, height: 13, backgroundColor: color, borderRadius: 3, transform: [{ rotate: '45deg' }] }}
      />
    );
  }
  const borderRadius = shape === 'circle' ? 8 : 4;
  return <View style={{ width: 16, height: 16, borderRadius, backgroundColor: color }} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          height: 88,
          paddingTop: Spacing.two,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Дом',
          tabBarIcon: ({ color }) => <TabIcon shape="square" color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Челленджи',
          tabBarIcon: ({ color }) => <TabIcon shape="diamond" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Магазин',
          tabBarIcon: ({ color }) => <TabIcon shape="circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <TabIcon shape="ring" color={color} />,
        }}
      />
    </Tabs>
  );
}
