import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, variant = 'primary', style, ...rest }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={(state) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        rest.disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <ThemedText type="title" style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  primaryLabel: {
    color: Colors.accentText,
    fontSize: 16,
    lineHeight: 20,
  },
  secondaryLabel: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 20,
  },
});
