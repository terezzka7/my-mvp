import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  type?: 'background' | 'surface';
};

export function ThemedView({ style, type = 'background', ...rest }: ThemedViewProps) {
  return (
    <View
      style={[{ backgroundColor: type === 'surface' ? Colors.surface : Colors.bg }, style]}
      {...rest}
    />
  );
}
