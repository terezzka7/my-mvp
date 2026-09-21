interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Найти профиль по имени пользователя..."
        className="w-full rounded border border-white/10 bg-white/5 px-4 py-3 text-text placeholder:text-white/40 focus:border-accent focus:outline-none"
      />
    </div>
  )
}
