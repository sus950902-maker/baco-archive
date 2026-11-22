import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import BootScreen from "./components/BootScreen"
import Footer from "./components/Footer"
import Guidelines from "./components/Guidelines"
import Hero from "./components/Hero"
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
  const [authError, setAuthError] = useState("")

  const finishBoot = useCallback(() => setBooted(true), [])
  useScrollReveal(booted)

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
        setAuthError(error.message || "檔案讀取失敗")
      } finally {
        setAuthReady(true)
      }
    })
  }, [])

  async function login() {
    setAuthError("")
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") return
      setAuthError("GOOGLE 驗證未完成")
    }
  }

  async function logout() {
    setAuthError("")
    try {
      await signOut(auth)
    } catch (error) {
      setAuthError(error.message || "登出失敗")
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
          <Hero />
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

      {authError && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 w-[min(100%-2rem,22rem)] border border-alert/70 bg-black p-4 text-ink"
        >
          <p className="font-mono text-[11px] tracking-[0.18em] text-alert">AUTH MODULE // DENIED</p>
          <p className="mt-2 text-sm leading-6 text-ink">{authError}</p>
          <button
            type="button"
            onClick={() => setAuthError("")}
            className="mt-3 font-mono text-[11px] text-ash hover:text-ink"
          >
            [ CLOSE ]
          </button>
        </div>
      )}
    </div>
  )
}
