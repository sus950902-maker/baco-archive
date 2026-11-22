import { useEffect } from "react"

const LEAVE_MS = 480

export default function NoticeStack({ notices, onDismiss, onRemove }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-x-3 bottom-3 flex max-h-[calc(100dvh-1.5rem)] w-auto flex-col gap-3 overflow-y-auto sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[min(100%-2rem,22rem)]">
        {notices.map((notice) => (
          <NoticeCard key={notice.id} notice={notice} onDismiss={onDismiss} onRemove={onRemove} />
        ))}
      </div>
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
      className={`notice-card pointer-events-auto max-w-full border border-alert/70 bg-black p-4 break-words text-ink ${notice.leaving ? "is-leaving" : ""}`}
    >
      <p className="font-mono text-[11px] tracking-[0.12em] break-words text-alert sm:tracking-[0.18em]">{notice.code}</p>
      <p className="mt-2 text-sm leading-6 break-words text-ink">{notice.message}</p>
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
