import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore"
import BootScreen from "./components/BootScreen"
import Footer from "./components/Footer"
import CharacterEditor from "./components/CharacterEditor"
import CharacterModal from "./components/CharacterModal"
import Guidelines from "./components/Guidelines"
import Hero from "./components/Hero"
import Intranet from "./components/Intranet"
import PersonnelRoster from "./components/PersonnelRoster"
import RosterAdmin from "./components/RosterAdmin"
import IdentityCard from "./components/IdentityCard"
import NoticeStack from "./components/NoticeStack"
import ProfileModal from "./components/ProfileModal"
import SiteSections from "./components/SiteSections"
import TopBar from "./components/TopBar"
import { isStaffRole, roleFromClearance } from "./characters"
import { readStoredClearance, storeClearance } from "./clearance"
import { auth, db, googleProvider } from "./firebase"
import { issuePublicUid } from "./publicUid"
import { useScrollReveal } from "./scrollReveal"

const PAGES = {
  "#intranet": "intranet",
  "#staff": "staff",
  "#staff-admin": "staff-admin",
  "#card": "card",
}

function readPage() {
  return PAGES[window.location.hash] || "archive"
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const [page, setPage] = useState(readPage)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notices, setNotices] = useState([])
  const [viewedProfile, setViewedProfile] = useState(null)
  const [clearance, setClearance] = useState(null)
  const [openCharacter, setOpenCharacter] = useState(null)
  const [editingCharacter, setEditingCharacter] = useState(null)
  const [staffEntry, setStaffEntry] = useState({ filter: "全部", token: 0 })

  const finishBoot = useCallback(() => setBooted(true), [])
  useScrollReveal(booted)

  useEffect(() => {
    setClearance(readStoredClearance(user?.uid))
  }, [user])

  useEffect(() => {
    const onHash = () => setPage(readPage())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    if (page !== "staff" || staffEntry.filter === "全部") return
    setStaffEntry((current) => ({ ...current, filter: "全部" }))
  }, [page, staffEntry.filter])

  useEffect(() => {
    if (page !== "archive") {
      window.scrollTo(0, 0)
      return
    }
    const id = window.location.hash.replace("#", "")
    if (!id) return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView()
    })
  }, [page])

  const pushNotice = useCallback((notice) => {
    setNotices((current) => {
      const same = current.find((entry) => entry.code === notice.code && entry.message === notice.message)
      if (same) {
        return current.map((entry) => {
          if (entry.id === same.id) return { ...entry, leaving: false, refresh: (entry.refresh ?? 0) + 1 }
          return entry.leaving ? entry : { ...entry, leaving: true }
        })
      }
      const item = { id: crypto.randomUUID(), leaving: false, refresh: 0, ...notice }
      const active = current.filter((entry) => !entry.leaving)
      let next = [...current, item]
      if (active.length >= 1) {
        const oldest = active[0]
        next = next.map((entry) => (entry.id === oldest.id ? { ...entry, leaving: true } : entry))
      }
      return next
    })
  }, [])

  const dismissNotice = useCallback((id) => {
    setNotices((current) =>
      current.map((entry) => (entry.id === id && !entry.leaving ? { ...entry, leaving: true } : entry)),
    )
  }, [])

  const removeNotice = useCallback((id) => {
    setNotices((current) => current.filter((entry) => entry.id !== id))
  }, [])

  async function grantClearance(level) {
    if (!user) return
    const role = roleFromClearance(level)
    storeClearance(user.uid, level)
    setClearance(level)
    try {
      await setDoc(doc(db, "users", user.uid), { role, updatedAt: serverTimestamp() }, { merge: true })
      setProfile((current) => ({ ...(current || {}), role }))
    } catch (error) {
      pushNotice({ code: "CLEARANCE // DENIED", message: error.message || "權限寫入失敗" })
      return
    }
    pushNotice({
      code: "CLEARANCE // ISSUED",
      message: level === "high" ? "高級管理權限已核發。" : "中級管理權限已核發。",
    })
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (next) => {
      setUser(next)
      if (!next) {
        setProfile(null)
        setProfileOpen(false)
        setAuthReady(true)
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", next.uid))
        if (snap.exists()) {
          const data = snap.data()
          const storedLevel = readStoredClearance(next.uid)
          if (storedLevel && !isStaffRole(data.role)) {
            const role = roleFromClearance(storedLevel)
            try {
              await setDoc(doc(db, "users", next.uid), { role }, { merge: true })
              data.role = role
            } catch {
              data.role = role
            }
          }
          if (!data.publicUid) {
            try {
              const publicUid = await issuePublicUid()
              await setDoc(doc(db, "users", next.uid), { publicUid }, { merge: true })
              data.publicUid = publicUid
            } catch {
              data.publicUid = ""
            }
          }
          setProfile(data)
        } else {
          setProfile(null)
          setProfileOpen(true)
        }
      } catch (error) {
        setProfile(null)
        setProfileOpen(true)
        pushNotice({ code: "AUTH MODULE // DENIED", message: error.message || "檔案讀取失敗" })
      } finally {
        setAuthReady(true)
      }
    })
  }, [pushNotice])

  async function login() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") return
      const blocked =
        error.code === "auth/popup-blocked" ||
        error.code === "auth/network-request-failed" ||
        error.code === "auth/internal-error" ||
        /popup-blocked|blocked by the browser/i.test(error.message || "")
      pushNotice({
        code: "AUTH MODULE // DENIED",
        message: blocked ? "請關閉阻擋彈窗或廣告攔截相關插件" : "GOOGLE 驗證未完成",
      })
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (error) {
      pushNotice({ code: "AUTH MODULE // DENIED", message: error.message || "登出失敗" })
    }
  }

  async function searchProfiles(term) {
    const value = term.trim()
    if (!value) return []
    const found = new Map()
    try {
      const direct = await getDoc(doc(db, "users", value))
      if (direct.exists()) found.set(direct.id, { id: direct.id, ...direct.data() })
      const byCode = await getDocs(
        query(collection(db, "users"), where("publicUid", "==", value.toUpperCase()), limit(5)),
      )
      byCode.forEach((entry) => found.set(entry.id, { id: entry.id, ...entry.data() }))
      const byName = await getDocs(
        query(
          collection(db, "users"),
          where("displayName", ">=", value),
          where("displayName", "<=", `${value}\uf8ff`),
          limit(8),
        ),
      )
      byName.forEach((entry) => found.set(entry.id, { id: entry.id, ...entry.data() }))
    } catch {
      pushNotice({ code: "ARCHIVE // DENIED", message: "檔案索引未開放" })
      return []
    }
    const records = [...found.values()]
    if (!records.length) pushNotice({ code: "ARCHIVE // EMPTY", message: "查無相符檔案" })
    return records
  }

  function openEditor(character) {
    setEditingCharacter(character)
    setOpenCharacter(null)
    if (window.location.hash !== "#card") window.location.hash = "#card"
  }

  const role = isStaffRole(profile?.role) ? profile.role : roleFromClearance(clearance)
  const staff = isStaffRole(role)
  const shownClearance = role === "admin" ? "high" : role === "moderator" ? "mid" : null

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="scanlines" />
      <div className="scanbar" />

      {!booted && <BootScreen onDone={finishBoot} />}

      <TopBar
        page={page}
        user={user}
        profile={profile}
        authReady={authReady}
        onLogin={login}
        onLogout={logout}
        onEditProfile={() => setProfileOpen(true)}
        clearance={shownClearance}
        staff={staff}
        onSearch={searchProfiles}
        onGrantClearance={grantClearance}
        onViewProfile={setViewedProfile}
      />
      <div className="relative z-10 flex flex-1 flex-col" data-reveal-root="">
        <main className="flex-1">
          {page === "intranet" ? (
            <Intranet />
          ) : page === "staff" ? (
            <PersonnelRoster
              key={staffEntry.token}
              initialFilter={staffEntry.filter}
              user={user}
              profile={profile}
              onNotice={pushNotice}
              onOpen={setOpenCharacter}
              onEdit={openEditor}
            />
          ) : page === "staff-admin" ? (
            <RosterAdmin staff={staff} ready={authReady} onNotice={pushNotice} />
          ) : page === "card" && editingCharacter ? (
            <CharacterEditor
              key={editingCharacter.id}
              character={editingCharacter}
              onNotice={pushNotice}
              onSaved={(record) => {
                setEditingCharacter(record)
                setStaffEntry((current) => ({ filter: "我的檔案", token: current.token + 1 }))
                if (window.location.hash !== "#staff") window.location.hash = "#staff"
              }}
            />
          ) : page === "card" ? (
            <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <h2 className="text-2xl font-medium sm:text-3xl">編輯角色卡</h2>
              <p className="mt-4 font-mono text-xs tracking-wide text-ash">請先在人員配置輸入綁定碼。</p>
            </section>
          ) : (
            <>
              <Hero user={user} onNotice={pushNotice} />
              <Guidelines />
              <SiteSections />
            </>
          )}
        </main>
        <Footer />
      </div>

      {user && profileOpen && (
        <ProfileModal
          user={user}
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={(record) => {
            setProfile(record)
            setProfileOpen(false)
          }}
        />
      )}

      {viewedProfile && <IdentityCard profile={viewedProfile} onClose={() => setViewedProfile(null)} />}

      {openCharacter && (
        <CharacterModal
          character={openCharacter}
          user={user}
          staff={staff}
          onClose={() => setOpenCharacter(null)}
          onEdit={openEditor}
        />
      )}

      <NoticeStack notices={notices} onDismiss={dismissNotice} onRemove={removeNotice} />
    </div>
  )
}
