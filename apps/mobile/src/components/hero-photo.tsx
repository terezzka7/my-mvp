import { useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { getPlaceholderAvatar } from '@/lib/placeholder-avatars';

// Wide card crop, same as the web ShareCard (object-cover, object-top): the
// picture covers the whole box, is centred horizontally and pinned to the
// top, so head and torso show. Laid out in points from the measured width.
export function HeroPhoto({
  username,
  height,
  style,
}: {
  username?: string | null;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const { source, aspectRatio } = getPlaceholderAvatar(username);

  const imageWidth = Math.max(width, height * aspectRatio);
  const imageHeight = imageWidth / aspectRatio;

  return (
    <View
      style={[{ width: '100%', height, overflow: 'hidden' }, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Image
          source={source}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: imageWidth,
            height: imageHeight,
            left: (width - imageWidth) / 2,
            top: 0,
          }}
        />
      )}
    </View>
  );
}
