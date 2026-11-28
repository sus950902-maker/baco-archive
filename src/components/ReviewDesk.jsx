export default function ReviewDesk({ staff, ready }) {
  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-2xl font-medium sm:text-3xl">審核區</h2>
        <p className="mt-4 font-mono text-xs tracking-wide text-ash">權限核對中</p>
      </section>
    )
  }

  if (!staff) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="reveal-right mb-5">
          <p className="font-mono text-[11px] tracking-[0.22em] text-comment">ROSTER ADMIN // REVIEW</p>
          <h2 className="mt-2 text-2xl font-medium sm:text-3xl">審核區</h2>
        </div>
        <div className="panel hud-corner p-5 sm:p-8">
          <p className="font-mono text-sm tracking-wide">權限不足。本區僅限中級以上管理權限調閱。</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-comment">ROSTER ADMIN // REVIEW</p>
        <h2 className="mt-2 text-2xl font-medium sm:text-3xl">審核區</h2>
      </div>
      <div className="panel hud-corner p-5 sm:p-8">
        <p className="font-mono text-sm tracking-wide">建置中</p>
      </div>
    </section>
  )
}
