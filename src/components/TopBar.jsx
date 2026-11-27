import { useEffect, useRef, useState } from "react"
import { Lock, Megaphone, Search } from "lucide-react"
import { peekBoundRoster, subscribeBoundRoster } from "../boundRoster"
import { characterTitle, factionLabel } from "../characters"
import { matchClearance } from "../clearance"

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

const DOMAIN_LINKS = [
  { href: "#intranet", page: "intranet", label: "內部網域" },
  { href: "#staff", page: "staff", label: "檔案庫" },
  { href: "#staff-admin", page: "staff-admin", label: "人員管理", staffOnly: true },
]

const ACTIVE_KEY = "baco-active-character"

function readActiveId(uid) {
  if (!uid) return ""
  try {
    return localStorage.getItem(`${ACTIVE_KEY}:${uid}`) || ""
  } catch {
    return ""
  }
}

function CharacterSwitch({ user, covered }) {
  const cached = peekBoundRoster()
  const [records, setRecords] = useState(cached.records)
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState(() => readActiveId(user?.uid))
  const rootRef = useRef(null)
  const owned = records
    .filter((record) => user && record.ownerUid === user.uid)
    .sort((left, right) => characterTitle(left).localeCompare(characterTitle(right), "zh-Hant"))
  const active = owned.find((record) => record.id === activeId) || owned[0] || null

  useEffect(() => subscribeBoundRoster((snapshot) => setRecords(snapshot.records)), [])

  useEffect(() => {
    if (covered) setOpen(false)
  }, [covered])

  useEffect(() => {
    if (!user) return
    const next = owned.find((record) => record.id === activeId)?.id || owned[0]?.id || ""
    if (next !== activeId) setActiveId(next)
  }, [user, owned, activeId])

  useEffect(() => {
    if (!user || !activeId) return
    try {
      localStorage.setItem(`${ACTIVE_KEY}:${user.uid}`, activeId)
    } catch {
      // 瀏覽器不允許儲存時，這次停留期間仍使用目前選擇。
    }
  }, [user, activeId])

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!active) return null

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`切換角色，目前為${characterTitle(active)}`}
        onClick={() => setOpen((current) => !current)}
        className="block aspect-[7/9] h-16 overflow-hidden border border-white/25 bg-black sm:h-20"
      >
        {active.avatarUrl ? (
          <img src={active.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-white">{characterTitle(active).slice(0, 1)}</span>
        )}
      </button>
      {open && (
        <ul role="listbox" aria-label="選擇角色" className="absolute top-0 left-full z-50 ml-2 min-w-52 border border-white/15 bg-black py-1 shadow-lg">
          {owned.map((record) => {
            const selected = record.id === active.id
            return (
              <li key={record.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(record.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-white/10 ${selected ? "bg-white/10" : ""}`}
                >
                  {record.avatarUrl ? (
                    <img src={record.avatarUrl} alt="" referrerPolicy="no-referrer" className="aspect-[7/9] h-8 shrink-0 object-cover" />
                  ) : (
                    <span className="flex aspect-[7/9] h-8 shrink-0 items-center justify-center bg-white/10 font-mono text-[10px] text-white">{characterTitle(record).slice(0, 1)}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white">{characterTitle(record)}</span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] tracking-wide text-white/60">{factionLabel(record)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function IdentityMark({ src, name }) {
  const [failed, setFailed] = useState(false)
  const letter = (name || "?").trim().slice(0, 1) || "?"

  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden bg-panel font-mono text-[10px] text-ink sm:h-8 sm:w-8 sm:text-xs"
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
  "shrink-0 border border-line bg-panel px-2 py-1.5 font-mono text-[10px] tracking-wide whitespace-nowrap text-ink transition-colors hover:border-alert hover:text-alert focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert disabled:opacity-40 sm:px-3 sm:py-2 sm:text-xs"

const LINK_STATE = {
  secure: { label: "連線狀態：SECURE", tone: "text-signal", dot: "bg-signal" },
  unstable: { label: "連線狀態：UNSTABLE", tone: "text-amber", dot: "bg-amber" },
  offline: { label: "連線狀態：OFFLINE", tone: "text-alert", dot: "bg-alert" },
}

function readLink() {
  if (typeof navigator === "undefined" || navigator.onLine === false) return "offline"
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return "secure"
  const slowType = connection.effectiveType === "slow-2g" || connection.effectiveType === "2g"
  const highLatency = typeof connection.rtt === "number" && connection.rtt >= 800
  const weakDownlink = typeof connection.downlink === "number" && connection.downlink > 0 && connection.downlink < 0.5
  if (slowType || highLatency || weakDownlink) return "unstable"
  return "secure"
}

export default function TopBar({
  page,
  user,
  profile,
  authReady,
  staff,
  domainFirst,
  domainAccess,
  onLogin,
  onLogout,
  onEditProfile,
  onSearch,
  onGrantClearance,
  onViewProfile,
}) {
  const headerRef = useRef(null)
  const [stamp, setStamp] = useState(() => formatStamp(new Date()))
  const [link, setLink] = useState(readLink)
  const [open, setOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [confirmAdmin, setConfirmAdmin] = useState(false)
  const granting = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setStamp(formatStamp(new Date())), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const sync = () => setLink(readLink())
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    connection?.addEventListener?.("change", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
      connection?.removeEventListener?.("change", sync)
    }
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return undefined
    const measure = () => {
      setHeaderHeight(header.offsetHeight)
      document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) setConfirmAdmin(false)
  }, [open])

  useEffect(() => {
    if (!confirmAdmin) return undefined
    const onPointerDown = (event) => {
      const node = event.target instanceof Element ? event.target : event.target.parentElement
      if (node?.closest("[data-staff-admin]")) return
      setConfirmAdmin(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [confirmAdmin])

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

  async function grantFromSearch(level) {
    if (granting.current) return
    granting.current = true
    try {
      await onGrantClearance(level)
    } finally {
      granting.current = false
    }
    setSearchValue("")
    setResults([])
    setSearchOpen(false)
  }

  function changeSearch(value) {
    setSearchValue(value)
    const level = matchClearance(value)
    if (level) grantFromSearch(level)
  }

  async function submitSearch(event) {
    event.preventDefault()
    const value = searchValue.trim()
    if (!value || searching) return
    const level = matchClearance(value)
    if (level) {
      grantFromSearch(level)
      return
    }
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
      className="sticky top-0 z-40 border-b border-white/10 bg-black overscroll-none"
    >
      <div className="hidden items-center justify-between gap-3 overflow-hidden border-b border-line px-4 py-2 sm:flex sm:px-6">
        <p className={`flex min-w-0 items-center gap-1.5 font-mono text-[10px] tracking-wide sm:gap-2 sm:text-[11px] ${LINK_STATE[link].tone}`}>
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full animate-led sm:h-2 sm:w-2 ${LINK_STATE[link].dot}`} />
          <span className="truncate">{LINK_STATE[link].label}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-ash sm:gap-3 sm:text-[11px]">
          <span className="hidden truncate sm:inline">FEDERAL STANDARD TIME //</span>
          <time dateTime={stamp} className="shrink-0 text-ink">
            {stamp}
          </time>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-2 sm:gap-x-3 sm:gap-y-2 sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="archive-menu"
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert sm:h-11 sm:w-11 sm:gap-1.5"
          >
            <span className="sr-only">{open ? "關閉選單" : "開啟選單"}</span>
            <span className={`block h-0.5 w-4 bg-ash transition-transform sm:w-5 ${open ? "translate-y-[6px] rotate-45 sm:translate-y-[8px]" : ""}`} />
            <span className={`block h-0.5 w-4 bg-ash transition-opacity sm:w-5 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-4 bg-ash transition-transform sm:w-5 ${open ? "-translate-y-[6px] -rotate-45 sm:-translate-y-[8px]" : ""}`} />
          </button>
          <a href="#overview" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img
            src="/logo.png"
            alt="異常收容與觀測調查局｜B.A.C.O."
            className="h-8 w-auto shrink-0 object-contain sm:h-11"
          />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium tracking-wide text-ink sm:text-base">
              異常收容與觀測調查局｜B.A.C.O.
            </span>
            <span className="block truncate font-mono text-[9px] tracking-[0.14em] text-ash sm:text-[10px] sm:tracking-[0.22em]">
              OBSERVATION SEAL // CONTAINMENT LOCK
            </span>
          </span>
          </a>
        </div>

        {user ? (
          <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
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
            <button type="button" onClick={onLogout} className={actionClass}>
              [ 登出 ]
            </button>
            <button
              type="button"
              aria-label="搜尋人員檔案"
              aria-expanded={searchOpen}
              aria-controls="archive-search"
              onClick={() => {
                setSearchOpen((value) => !value)
                setResults([])
              }}
              className={`${actionClass} px-1.5 sm:px-2`}
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={onLogin} disabled={!authReady} className={actionClass}>
            {authReady ? (
              <>
                <span className="sm:hidden">[ 接入終端 ]</span>
                <span className="hidden sm:inline">[ 接入終端 // GOOGLE 驗證 ]</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">[ 連線中 ]</span>
                <span className="hidden sm:inline">[ 接入終端 // 連線中 ]</span>
              </>
            )}
          </button>
        )}
      </div>
      {page === "intranet" && (
        <button
          type="button"
          onClick={() => {
            window.location.hash = "#announcements"
          }}
          className="absolute top-full right-4 z-10 mt-3 flex flex-col items-center gap-1 border border-white/20 bg-black px-2.5 py-2 text-white hover:border-white sm:right-6"
        >
          <Megaphone className="h-5 w-5" aria-hidden="true" />
          <span className="font-mono text-[10px] leading-none tracking-[0.14em]">公告</span>
        </button>
      )}
    </header>

      {page === "intranet" && (
        <div className="fixed left-4 z-[32] mt-3 sm:left-6" style={{ top: headerHeight }}>
          <CharacterSwitch user={user} covered={open} />
        </div>
      )}

      {searchOpen && (
        <form
          id="archive-search"
          onSubmit={submitSearch}
          className="fixed inset-x-0 z-40 border-b border-white/10 bg-black px-4 py-3 sm:px-6"
          style={{ top: headerHeight }}
        >
          <input
            autoFocus
            value={searchValue}
            disabled={searching}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="名稱或 UID"
            aria-label="搜尋名稱或 UID"
            className="ml-auto block w-full max-w-sm border border-line bg-black px-3 py-2 font-mono text-xs text-ink outline-none focus:border-alert"
          />
          {results.length > 1 && (
            <ul className="ml-auto mt-2 max-h-64 w-full max-w-sm overflow-y-auto border border-white/15 bg-black">
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
        </form>
      )}

      <button
        type="button"
        aria-label="關閉選單"
        onClick={() => setOpen(false)}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 z-[33] bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ top: headerHeight }}
      />
      <nav
        id="archive-menu"
        aria-label="檔案區段"
        aria-hidden={!open}
        className={`fixed bottom-0 left-0 z-[33] w-[min(100%,18rem)] border-r border-white/10 bg-black transition-transform duration-300 ${open ? "translate-x-0 shadow-[12px_0_32px_rgba(0,0,0,0.35)]" : "pointer-events-none -translate-x-full shadow-none"}`}
        style={{ top: headerHeight }}
      >
        {(domainFirst ? ["domain", "files"] : ["files", "domain"])
          .filter((section) => user || section !== "domain")
          .map((section, index) =>
          section === "files" ? (
            <div key={section}>
              <p className={`border-b border-white/10 px-5 py-4 font-mono text-[11px] tracking-[0.22em] text-comment ${index === 0 ? "" : "mt-8 border-t"}`}>
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
            </div>
          ) : (
            <div key={section}>
              <p className={`border-b border-white/10 px-5 py-4 font-mono text-[11px] tracking-[0.22em] text-comment ${index === 0 ? "" : "mt-8 border-t"}`}>
                INTERNAL DOMAIN
              </p>
              {DOMAIN_LINKS.filter((link) => (!link.staffOnly || staff) && (link.page !== "intranet" || domainAccess)).map((link) => {
                const guarded = link.page === "staff-admin"
                const armed = guarded && confirmAdmin
                return (
                <a
                  key={link.href}
                  href={link.href}
                  tabIndex={open ? 0 : -1}
                  data-staff-admin={guarded ? "" : undefined}
                  onClick={(event) => {
                    if (!guarded) {
                      setConfirmAdmin(false)
                      setOpen(false)
                      return
                    }
                    if (!confirmAdmin) {
                      event.preventDefault()
                      setConfirmAdmin(true)
                      return
                    }
                    setConfirmAdmin(false)
                    setOpen(false)
                  }}
                  className={`flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 font-mono text-sm tracking-wide transition-colors ${armed ? "bg-signal text-black" : `hover:bg-white/5 hover:text-ink ${page === link.page ? "text-ink" : "text-ash"}`}`}
                >
                  <span>
                    {link.label}
                    {armed && <span className="mt-1 block text-[11px] tracking-[0.14em]">是否進入</span>}
                  </span>
                  {guarded && <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </a>
                )
              })}
            </div>
          ),
        )}
      </nav>
    </>
  )
}