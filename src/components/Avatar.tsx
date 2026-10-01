import { getPlaceholderAvatar } from '../lib/placeholder-avatars'

interface AvatarProps {
  className: string
  username?: string | null
}

export function Avatar({ className, username }: AvatarProps) {
  const { src, cropClassName } = getPlaceholderAvatar(username)

  return (
    <div className={`relative overflow-hidden rounded-full border border-white/10 bg-white/5 ${className}`}>
      <img
        src={src}
        alt=""
        className={`absolute left-1/2 max-w-none -translate-x-1/2 ${cropClassName}`}
      />
    </div>
  )
}
