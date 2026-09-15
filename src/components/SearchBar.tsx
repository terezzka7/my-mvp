export function SearchBar() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <input
        type="search"
        placeholder="Найти профиль по имени пользователя..."
        className="w-full rounded border border-white/10 bg-bg-alt px-4 py-3 text-text placeholder:text-white/40 focus:border-accent focus:outline-none"
      />
    </div>
  )
}
