import { useEffect, useRef, useState } from "react"
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import WorldMap from "./WorldMap"

const SEEN_KEY = "baco-announcement-seen"
const POP_MS = 4500

function formatStamp(millis) {
  if (!millis) return ""
  const date = new Date(millis)
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function Intranet({ staff, onNotice }) {
  const [items, setItems] = useState([])
  const [popup, setPopup] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState("")
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
        .map((entry) => ({
          id: entry.id,
          text: entry.data().text || "",
          createdAt: entry.data().createdAt?.toMillis?.() || 0,
        }))
        .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
      setItems(next)
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

  async function remove(item) {
    try {
      await deleteDoc(doc(db, "announcements", item.id))
      setPendingDelete("")
      setPopup((current) => (current?.id === item.id ? null : current))
    } catch (error) {
      onNotice?.({ code: "ANNOUNCE // DENIED", message: error.message || "公告刪除失敗" })
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        type="button"
        aria-expanded={historyOpen}
        onClick={() => setHistoryOpen((current) => !current)}
        className="absolute top-4 right-4 z-20 border border-white/20 bg-black px-3 py-2 font-mono text-xs tracking-wide text-white hover:border-white sm:top-6 sm:right-6"
      >
        [ 公告 ]
      </button>
      {popup && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-24 sm:top-6">
          <div className="announcement-pop w-[min(32rem,100%)] border border-white/20 bg-black px-4 py-3 text-center text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <p className="text-sm leading-6">{popup.text}</p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-white">{formatStamp(popup.createdAt)}</p>
          </div>
        </div>
      )}
      {historyOpen && (
        <div className="absolute top-16 right-4 z-20 max-h-[min(70dvh,28rem)] w-[min(22rem,calc(100%-2rem))] overflow-y-auto border border-white/15 bg-black p-4 text-white sm:right-6">
          <p className="font-mono text-[11px] tracking-[0.18em] text-white">公告歷史</p>
          {items.length === 0 ? (
            <p className="mt-4 font-mono text-xs text-white">尚無公告</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10">
              {items.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="text-sm leading-6 text-white">{item.text}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] tracking-[0.12em] text-white">{formatStamp(item.createdAt)}</p>
                    {staff && (
                      pendingDelete === item.id ? (
                        <button type="button" onClick={() => remove(item)} className="font-mono text-[11px] text-alert">
                          [ 確認刪除 ]
                        </button>
                      ) : (
                        <button type="button" onClick={() => setPendingDelete(item.id)} className="font-mono text-[11px] text-ash hover:text-alert">
                          [ 刪除 ]
                        </button>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <WorldMap />
    </section>
  )
}
