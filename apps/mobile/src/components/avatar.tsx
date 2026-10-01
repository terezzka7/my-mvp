import { Image, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getPlaceholderAvatar } from '@/lib/placeholder-avatars';

// Round face-cropped avatar. The picture is drawn larger than the circle
// and shifted (all in % of the circle) so the head fills it.
export function Avatar({ username, size }: { username?: string | null; size: number }) {
  const { source, aspectRatio, widthPercent, topPercent } = getPlaceholderAvatar(username);

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          width: `${widthPercent}%`,
          aspectRatio,
          left: `${-(widthPercent - 100) / 2}%`,
          top: `${topPercent}%`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
