export default function Intranet() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="reveal-right mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-comment">INTERNAL DOMAIN // STANDALONE</p>
          <h2 className="mt-2 text-2xl font-medium text-ink sm:text-3xl">內部網域</h2>
        </div>
        <p className="font-mono text-[11px] text-ash">FILE LOCK: ISOLATED</p>
      </div>
      <div className="reveal-right panel hud-corner p-5 sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ash">DOMAIN STATUS // STANDBY</p>
        <p className="mt-4 max-w-3xl text-base font-[450] leading-8 text-ink sm:text-[17px]">
          本頁與公開檔案 01–05 分離。
        </p>
      </div>
    </section>
  )
}
