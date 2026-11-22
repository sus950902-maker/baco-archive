import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"

function formatStamp(date) {
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const LINKS = [
  { href: "#overview", label: "01 管理局介紹" },
  { href: "#guidelines", label: "02 企劃玩法" },
  { href: "#play", label: "03 企劃須知" },
  { href: "#social", label: "04 社群媒體" },
  { href: "#protocol", label: "05 協議聲明" },
]

function IdentityMark({ src, name }) {
  const [failed, setFailed] = useState(false)
  const letter = (name || "?").trim().slice(0, 1) || "?"

  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-panel font-mono text-xs text-ink"
      style={{ clipPath: "polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))" }}
    >
      {src && !failed ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        letter
      )}
    </span>
  )
}

const actionClass =
  "shrink-0 border border-line bg-panel px-3 py-2 font-mono text-xs tracking-wide whitespace-nowrap text-ink transition-colors hover:border-alert hover:text-alert focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert disabled:opacity-40"

export default function TopBar({ user, profile, authReady, onLogin, onLogout, onEditProfile, onSearch, onViewProfile }) {
  const headerRef = useRef(null)
  const [stamp, setStamp] = useState(() => formatStamp(new Date()))
  const [open, setOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setStamp(formatStamp(new Date())), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return undefined
    const measure = () => setHeaderHeight(header.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open && !searchOpen) return undefined
    const onKey = (event) => {
      if (event.key !== "Escape") return
      if (searchOpen) {
        setSearchOpen(false)
        setResults([])
        return
      }
      setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, searchOpen])

  async function submitSearch(event) {
    event.preventDefault()
    if (!searchValue.trim() || searching) return
    setSearching(true)
    const records = await onSearch(searchValue)
    setSearching(false)
    if (records.length === 1) {
      setResults([])
      setSearchOpen(false)
      onViewProfile(records[0])
      return
    }
    setResults(records)
  }

  return (
    <>
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/10 bg-black"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2 whitespace-nowrap sm:px-6">
        <p className="flex shrink-0 items-center gap-2 font-mono text-[11px] tracking-wide text-signal">
          <span className="inline-block h-2 w-2 rounded-full bg-signal text-signal animate-led" />
          連線狀態：SECURE // CHANNEL-04
        </p>
        <div className="flex min-w-0 items-center gap-3 font-mono text-[11px] text-ash">
          <span className="truncate">
            <span className="hidden lg:inline">SYSTEM: INTERNAL ARCHIVE // </span>
            {user ? "CLEARANCE: AUTHORIZED // 已綁定" : "CLEARANCE: GUEST"}
          </span>
          <time dateTime={stamp} className="shrink-0 text-ink">
            {stamp}
          </time>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="archive-menu"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert"
          >
            <span className="sr-only">{open ? "關閉選單" : "開啟選單"}</span>
            <span className={`block h-0.5 w-5 bg-ash transition-transform ${open ? "translate-y-[8px] rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ash transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ash transition-transform ${open ? "-translate-y-[8px] -rotate-45" : ""}`} />
          </button>
          <a href="#overview" className="flex min-w-0 items-center gap-3">
          <img
            src="/logo.png"
            alt="異常收容與觀測調查局｜B.A.C.O."
            className="h-11 w-auto shrink-0 object-contain"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium tracking-wide text-ink sm:text-base">
              異常收容與觀測調查局｜B.A.C.O.
            </span>
            <span className="block truncate font-mono text-[10px] tracking-[0.22em] text-ash">
              OBSERVATION SEAL // CONTAINMENT LOCK
            </span>
          </span>
          </a>
        </div>

        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            <IdentityMark
              key={profile?.avatarUrl || user.photoURL || "mark"}
              src={profile?.avatarUrl || user.photoURL || ""}
              name={profile?.displayName || user.displayName || user.email}
            />
            <span className="hidden max-w-[7rem] truncate font-mono text-xs text-ink sm:inline">
              {profile?.displayName || user.displayName || "未命名"}
            </span>
            <button type="button" onClick={onEditProfile} className={actionClass}>
              [ 檔案設定 ]
            </button>
            <button
              type="button"
              onClick={() =>
                onViewProfile({
                  displayName: profile?.displayName || user.displayName || "未命名",
                  publicUid: profile?.publicUid || "",
                  avatarUrl: profile?.avatarUrl || user.photoURL || "",
                })
              }
              className={actionClass}
            >
              [ 識別證 ]
            </button>
            <div className="relative flex items-center gap-2">
              {searchOpen && (
                <form onSubmit={submitSearch}>
                  <input
                    autoFocus
                    value={searchValue}
                    disabled={searching}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="名稱或 UID"
                    aria-label="搜尋名稱或 UID"
                    className="w-32 border border-line bg-black px-2 py-2 font-mono text-xs text-ink outline-none focus:border-alert sm:w-44"
                  />
                </form>
              )}
              <button
                type="button"
                aria-label="搜尋人員檔案"
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen((value) => !value)
                  setResults([])
                }}
                className={`${actionClass} px-2`}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
              {results.length > 1 && (
                <ul className="absolute top-full right-0 z-50 mt-2 max-h-64 w-60 overflow-y-auto border border-white/15 bg-black">
                  {results.map((record) => (
                    <li key={record.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setResults([])
                          setSearchOpen(false)
                          onViewProfile(record)
                        }}
                        className="block w-full border-b border-white/10 px-3 py-2 text-left hover:bg-white/5"
                      >
                        <span className="block truncate text-sm text-ink">{record.displayName || "未命名"}</span>
                        <span className="font-mono text-[10px] tracking-[0.14em] text-ash">{record.publicUid || record.uid}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={onLogout} className={actionClass}>
              [ 登出 ]
            </button>
          </div>
        ) : (
          <button type="button" onClick={onLogin} disabled={!authReady} className={actionClass}>
            {authReady ? "[ 接入終端 // GOOGLE 驗證 ]" : "[ 接入終端 // 連線中 ]"}
          </button>
        )}
      </div>
    </header>

      <button
        type="button"
        aria-label="關閉選單"
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 z-30 bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ top: headerHeight }}
      />
      <nav
        id="archive-menu"
        aria-label="檔案區段"
        aria-hidden={!open}
        className={`fixed bottom-0 left-0 z-30 w-[min(100%,18rem)] border-r border-white/10 bg-black transition-transform duration-300 ${open ? "translate-x-0 shadow-[12px_0_32px_rgba(0,0,0,0.35)]" : "pointer-events-none -translate-x-full shadow-none"}`}
        style={{ top: headerHeight }}
      >
        <p className="border-b border-white/10 px-5 py-4 font-mono text-[11px] tracking-[0.22em] text-comment">
          FILE INDEX
        </p>
        <ul className="flex flex-col">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="block border-b border-white/10 px-5 py-4 font-mono text-sm tracking-wide text-ash transition-colors hover:bg-white/5 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}