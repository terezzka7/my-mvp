import andrey from '../assets/andrey.png'
import tereza from '../assets/tereza.png'

export interface PlaceholderAvatar {
  src: string
  // Tailwind classes positioning the image inside the avatar circle so only
  // the face shows (each source picture frames the head differently).
  cropClassName: string
}

// TODO: drop this once characters have real Storage-rendered images
// (character.image_url) — until then each known account gets a hand-picked
// photo. Unknown usernames fall back to the default one.
const BY_USERNAME: Record<string, PlaceholderAvatar> = {
  andrey_3a1db7: {
    src: andrey,
    cropClassName: 'top-[-6%] w-[320%]',
  },
}

const DEFAULT: PlaceholderAvatar = {
  src: tereza,
  cropClassName: 'top-0 w-[198%]',
}

export function getPlaceholderAvatar(username?: string | null): PlaceholderAvatar {
  return (username && BY_USERNAME[username]) || DEFAULT
}
