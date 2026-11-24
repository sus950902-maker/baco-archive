import { collection, onSnapshot, query, where } from "firebase/firestore"
import { publicCharacter } from "./characters"
import { db } from "./firebase"

const state = {
  records: [],
  error: "",
  started: false,
}

const listeners = new Set()

function emit() {
  const snapshot = { records: state.records, error: state.error }
  listeners.forEach((listener) => listener(snapshot))
}

function start() {
  if (state.started) return
  state.started = true
  const roster = query(collection(db, "characters"), where("status", "==", "bound"))
  onSnapshot(
    roster,
    (snap) => {
      state.records = snap.docs.map((entry) => publicCharacter(entry.id, entry.data()))
      state.error = ""
      emit()
    },
    () => {
      state.error = "內部名冊讀取失敗"
      emit()
    },
  )
}

export function peekBoundRoster() {
  return { records: state.records, error: state.error }
}

export function subscribeBoundRoster(listener) {
  listeners.add(listener)
  start()
  listener({ records: state.records, error: state.error })
  return () => listeners.delete(listener)
}
