import { Image, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getPlaceholderAvatar } from '@/lib/placeholder-avatars';

// Round face-cropped avatar. The picture is drawn larger than the circle and
// shifted so the head fills it. Everything is computed in points from `size`
// (instead of %/aspectRatio layout) so it lays out the same on every device.
export function Avatar({ username, size }: { username?: string | null; size: number }) {
  const { source, aspectRatio, widthPercent, topPercent } = getPlaceholderAvatar(username);

  const imageWidth = (size * widthPercent) / 100;
  const imageHeight = imageWidth / aspectRatio;

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={source}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: imageWidth,
          height: imageHeight,
          left: -(imageWidth - size) / 2,
          top: (size * topPercent) / 100,
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
