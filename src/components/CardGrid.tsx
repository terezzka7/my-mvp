export function CardGrid() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Публичные профили /u/username подключаются на Слое 2 (Supabase) */}
      </div>
      <p className="py-16 text-center text-white/40">Пока нет публичных профилей</p>
    </div>
  )
}
