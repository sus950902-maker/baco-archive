const SECTIONS = [
  {
    id: "play",
    code: "SECTOR 03 // FIELD PLAY",
    title: "企劃須知",
    file: "FILE STATUS // COMPILING",
    body: "建置中",
  },
  {
    id: "social",
    code: "SECTOR 04 // UPLINK",
    title: "社群媒體",
    file: "CHANNEL INDEX // STANDBY",
    body: "建置中",
  },
  {
    id: "protocol",
    code: "SECTOR 05 // DIRECTIVE",
    title: "協議聲明",
    file: "B.A.C.O. SECURITY PROTOCOL",
    body: "建置中",
  },
]

export default function SiteSections() {
  return (
    <>
      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="mx-auto w-full max-w-6xl scroll-mt-36 px-4 pb-16 sm:px-6 sm:pb-56"
        >
          <div className="reveal-right mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5 sm:gap-3">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] text-comment sm:tracking-[0.28em]">{section.code}</p>
              <h2 className="mt-2 text-2xl font-medium text-ink sm:text-3xl">{section.title}</h2>
            </div>
            <p className="font-mono text-[11px] text-ash">FILE LOCK: READ ONLY // GUEST</p>
          </div>
          <div className="reveal-right panel hud-corner p-5 sm:p-8">
            <p className="font-mono text-[11px] tracking-[0.18em] text-ash sm:tracking-[0.22em]">{section.file}</p>
            <p className="mt-3 max-w-3xl text-base font-[450] leading-7 text-ink sm:mt-4 sm:text-[17px] sm:leading-8">{section.body}</p>
          </div>
        </section>
      ))}
    </>
  )
}
