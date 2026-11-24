import { useEffect, useRef, useState } from "react"
import { Megaphone } from "lucide-react"
import { collection, onSnapshot } from "firebase/firestore"
import { readAnnouncement } from "../characters"
import { db } from "../firebase"
import AnnouncementLine from "./AnnouncementLine"
import WorldMap from "./WorldMap"

const SEEN_KEY = "baco-announcement-seen"
const POP_MS = 4500

function formatStamp(millis) {
  if (!millis) return ""
  const date = new Date(millis)
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function Intranet() {
  const [popup, setPopup] = useState(null)
  const seen = useRef(sessionStorage.getItem(SEEN_KEY) || "")
  const ready = useRef(false)
  const known = useRef(new Set())

  function show(item) {
    seen.current = item.id
    sessionStorage.setItem(SEEN_KEY, item.id)
    setPopup(item)
  }

  useEffect(() => {
    return onSnapshot(collection(db, "announcements"), (snap) => {
      const next = snap.docs
        .map((entry) => readAnnouncement(entry.id, entry.data()))
        .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
      if (!ready.current) {
        ready.current = true
        next.forEach((item) => known.current.add(item.id))
        if (next[0] && next[0].id !== seen.current) show(next[0])
        return
      }
      const added = next.filter((item) => !known.current.has(item.id))
      next.forEach((item) => known.current.add(item.id))
      if (added[0]) show(added[0])
    })
  }, [])

  useEffect(() => {
    if (!popup) return undefined
    const timer = window.setTimeout(() => setPopup(null), POP_MS)
    return () => window.clearTimeout(timer)
  }, [popup])

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        type="button"
        onClick={() => {
          window.location.hash = "#announcements"
        }}
        className="absolute top-4 right-4 z-20 flex flex-col items-center gap-1 border border-white/20 bg-black px-2.5 py-2 text-white hover:border-white sm:top-6 sm:right-6"
      >
        <Megaphone className="h-5 w-5" aria-hidden="true" />
        <span className="font-mono text-[10px] leading-none tracking-[0.14em]">公告</span>
      </button>
      {popup && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-24 sm:top-6">
          <div className="announcement-pop w-[min(32rem,100%)] border border-white/20 bg-black px-4 py-3 text-center text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <AnnouncementLine item={popup} className="text-sm leading-6" />
            <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-white">{formatStamp(popup.createdAt)}</p>
          </div>
        </div>
      )}
      <WorldMap />
    </section>
  )
}
