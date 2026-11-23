export default function DomainPage({ title }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <h2 className="text-2xl font-medium text-ink sm:text-3xl">{title}</h2>
      </div>
      <div className="reveal-right panel hud-corner min-h-40 p-5 sm:p-8" />
    </section>
  )
}
