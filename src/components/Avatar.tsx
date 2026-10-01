import terezaCharacter from '../assets/tereza.png'

// TODO: character.image_url once real Storage-rendered characters exist —
// placeholder photo for now. The image is scaled to ~2× the circle and
// anchored to the top so only the face shows, at any circle size.
export function Avatar({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-full border border-white/10 bg-white/5 ${className}`}>
      <img
        src={terezaCharacter}
        alt=""
        className="absolute left-1/2 top-0 w-[198%] max-w-none -translate-x-1/2"
      />
    </div>
  )
}
