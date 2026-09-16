import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'display' | 'title' | 'body' | 'bodyMuted' | 'overline';
};

export function ThemedText({ style, type = 'body', ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.base,
        type === 'display' && styles.display,
        type === 'title' && styles.title,
        type === 'body' && styles.body,
        type === 'bodyMuted' && styles.bodyMuted,
        type === 'overline' && styles.overline,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
  display: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 32,
    lineHeight: 38,
  },
  title: {
    fontFamily: Fonts.displayBold,
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyMuted: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.textMuted,
  },
  overline: {
    fontFamily: Fonts.overlineSemiBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: Colors.accent,
  },
});
