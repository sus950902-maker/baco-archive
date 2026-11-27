import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "./firebase"

export const CONTROLS_DOC = doc(db, "settings", "controls")

const EMPTY = { rosterSnapshot: false, editQuota: false }

export function taipeiDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function readControls(data) {
  return {
    rosterSnapshot: data?.rosterSnapshot === true,
    editQuota: data?.editQuota === true,
  }
}

export function subscribeSiteControls(listener) {
  return onSnapshot(
    CONTROLS_DOC,
    (snap) => listener(readControls(snap.data())),
    () => listener(EMPTY),
  )
}

export async function writeSiteControls(controls) {
  await setDoc(CONTROLS_DOC, {
    rosterSnapshot: controls.rosterSnapshot === true,
    editQuota: controls.editQuota === true,
    updatedAt: serverTimestamp(),
  })
}
