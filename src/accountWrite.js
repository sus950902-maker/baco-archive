import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"
import { taipeiDay } from "./siteControls"

const DAILY_CAP = 200

function denied(error) {
  if (error?.code === "permission-denied") {
    const blocked = new Error("操作間隔過短，或今日寫入次數已達上限")
    blocked.code = "quota"
    throw blocked
  }
  throw error
}

export async function writeOwnUser(patch, known) {
  const user = auth.currentUser
  if (!user) throw new Error("請先登入")
  let data = known
  if (!data) {
    const snap = await getDoc(doc(db, "users", user.uid))
    data = snap.data() || {}
  }
  const today = taipeiDay()
  const touchCount = data.touchDay === today ? Number(data.touchCount || 0) + 1 : 1
  if (touchCount > DAILY_CAP) throw new Error("今日寫入次數已達上限")
  try {
    await setDoc(
      doc(db, "users", user.uid),
      { ...patch, touchDay: today, touchCount, updatedAt: serverTimestamp() },
      { merge: true },
    )
  } catch (error) {
    denied(error)
  }
  return { ...data, ...patch, touchDay: today, touchCount }
}

export async function reserveCharacterWrite(characterId, bindCode = "") {
  const user = auth.currentUser
  if (!user) throw new Error("請先登入")
  const snap = await getDoc(doc(db, "users", user.uid))
  const data = snap.data() || {}
  const today = taipeiDay()
  const opCount = data.opDay === today ? Number(data.opCount || 0) + 1 : 1
  if (opCount > DAILY_CAP) throw new Error("今日寫入次數已達上限")
  const patch = {
    pendingCharacterId: characterId,
    reservedAt: serverTimestamp(),
    opDay: today,
    opCount,
  }
  if (bindCode) patch.pendingBind = bindCode
  await writeOwnUser(patch, data)
}
