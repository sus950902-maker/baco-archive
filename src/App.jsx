import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from "firebase/firestore"
import BootScreen from "./components/BootScreen"
import Footer from "./components/Footer"
import Guidelines from "./components/Guidelines"
import Hero from "./components/Hero"
import IdentityCard from "./components/IdentityCard"
import NoticeStack from "./components/NoticeStack"
import ProfileModal from "./components/ProfileModal"
import SiteSections from "./components/SiteSections"
import TopBar from "./components/TopBar"
import { auth, db, googleProvider } from "./firebase"
import { issuePublicUid } from "./publicUid"
import { useScrollReveal } from "./scrollReveal"

export default function App() {
  const [booted, setBooted] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notices, setNotices] = useState([])
  const [viewedProfile, setViewedProfile] = useState(null)

  const finishBoot = useCallback(() => setBooted(true), [])
  useScrollReveal(booted)

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
      pushNotice({ code: "AUTH MODULE // DENIED", message: "GOOGLE 驗證未完成" })
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

  return (
    <div className="relative min-h-screen">
      <div className="scanlines" />
      <div className="scanbar" />

      {!booted && <BootScreen onDone={finishBoot} />}

      <TopBar
        user={user}
        profile={profile}
        authReady={authReady}
        onLogin={login}
        onLogout={logout}
        onEditProfile={() => setProfileOpen(true)}
        onSearch={searchProfiles}
        onViewProfile={setViewedProfile}
      />
      <div className="relative z-10" data-reveal-root="">
        <main>
          <Hero user={user} onNotice={pushNotice} />
          <Guidelines />
          <SiteSections />
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

      <NoticeStack notices={notices} onDismiss={dismissNotice} onRemove={removeNotice} />
    </div>
  )
}
