import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import BootScreen from "./components/BootScreen"
import Footer from "./components/Footer"
import Guidelines from "./components/Guidelines"
import Hero from "./components/Hero"
import NoticeStack from "./components/NoticeStack"
import ProfileModal from "./components/ProfileModal"
import SiteSections from "./components/SiteSections"
import TopBar from "./components/TopBar"
import { auth, db, googleProvider } from "./firebase"
import { useScrollReveal } from "./scrollReveal"

export default function App() {
  const [booted, setBooted] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notices, setNotices] = useState([])

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
          setProfile(snap.data())
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

      <NoticeStack notices={notices} onDismiss={dismissNotice} onRemove={removeNotice} />
    </div>
  )
}
