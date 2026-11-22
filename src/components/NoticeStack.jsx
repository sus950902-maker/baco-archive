import { useEffect } from "react"

const LEAVE_MS = 480

export default function NoticeStack({ notices, onDismiss, onRemove }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-3">
      {notices.map((notice) => (
        <NoticeCard key={notice.id} notice={notice} onDismiss={onDismiss} onRemove={onRemove} />
      ))}
    </div>
  )
}

function NoticeCard({ notice, onDismiss, onRemove }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (notice.leaving) onRemove(notice.id)
      else onDismiss(notice.id)
    }, notice.leaving ? LEAVE_MS : 6000)
    return () => window.clearTimeout(timer)
  }, [notice.id, notice.leaving, notice.refresh, onDismiss, onRemove])

  return (
    <article
      role="status"
      className={`notice-card pointer-events-auto border border-alert/70 bg-black p-4 text-ink ${notice.leaving ? "is-leaving" : ""}`}
    >
      <p className="font-mono text-[11px] tracking-[0.18em] text-alert">{notice.code}</p>
      <p className="mt-2 text-sm leading-6 text-ink">{notice.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(notice.id)}
        className="mt-3 font-mono text-[11px] text-ash hover:text-ink"
      >
        [ CLOSE ]
      </button>
    </article>
  )
}
