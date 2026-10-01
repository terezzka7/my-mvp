import { Tabs } from 'expo-router';
import { TabIcon } from '@/components/tab-icon';
import { Colors, Spacing } from '@/constants/theme';

// M-04/M-07/M-10/M-12 tab bar (§9.2: "Tab Bar" root of the primary
// nav). Icons are drawn from plain Views in components/tab-icon.tsx —
// no icon package is in §11.

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        // Solid grey (what textMuted looks like on the bar): a see-through colour
        // makes the strokes darker where an icon's lines cross.
        tabBarInactiveTintColor: '#808080',
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
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Челленджи',
          tabBarIcon: ({ color }) => <TabIcon name="challenges" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Магазин',
          tabBarIcon: ({ color }) => <TabIcon name="shop" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
