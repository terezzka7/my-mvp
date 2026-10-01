import type { ImageSourcePropType } from 'react-native';

export interface PlaceholderAvatar {
  source: ImageSourcePropType;
  // width/height of the picture, to keep its proportions when scaled.
  aspectRatio: number;
  // How big the picture is drawn relative to the avatar circle, and where
  // it sits (percent of the circle) so only the face shows. Same numbers as
  // the web's src/lib/placeholder-avatars.ts.
  widthPercent: number;
  topPercent: number;
}

// TODO: drop this once characters have real Storage-rendered images
// (characters.image_url) — until then each known account gets a
// hand-picked photo. Unknown usernames get the default one.
const BY_USERNAME: Record<string, PlaceholderAvatar> = {
  andrey_3a1db7: {
    source: require('@/assets/avatars/andrey.png'),
    aspectRatio: 1162 / 1454,
    widthPercent: 320,
    topPercent: -6,
  },
};

const DEFAULT: PlaceholderAvatar = {
  source: require('@/assets/avatars/tereza.png'),
  aspectRatio: 1062 / 1008,
  widthPercent: 198,
  topPercent: 0,
};

export function getPlaceholderAvatar(username?: string | null): PlaceholderAvatar {
  return (username && BY_USERNAME[username]) || DEFAULT;
}
