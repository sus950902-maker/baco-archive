import { collection, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore"
import { publicCharacter } from "./characters"
import { db } from "./firebase"
import { subscribeSiteControls } from "./siteControls"

const SNAPSHOT_MS = 10 * 60 * 1000
const SNAPSHOT_DOC = doc(db, "snapshots", "roster")
const LOCK_DOC = doc(db, "snapshots", "rosterLock")

const state = {
  records: [],
  error: "",
  started: false,
  mode: false,
  updatedAt: 0,
}

const listeners = new Set()
const adopted = new Map()
let stopData = () => {}
let refreshTimer = 0
let refreshing = false
let dataMode = null

function publish() {
  const snapshot = { records: state.records, error: state.error }
  listeners.forEach((listener) => listener(snapshot))
}

function emit() {
  publish()
}

function applyServerRecords(records, authoritative) {
  const present = new Set(records.map((record) => record.id))
  adopted.forEach((record, id) => {
    if (present.has(id) || authoritative) adopted.delete(id)
  })
  const extras = []
  adopted.forEach((record) => {
    if (!present.has(record.id)) extras.push(record)
  })
  state.records = extras.length ? [...records, ...extras] : records
  state.error = ""
  publish()
}

export function adoptBoundRecord(record) {
  if (!record?.id) return
  adopted.set(record.id, record)
  const index = state.records.findIndex((item) => item.id === record.id)
  state.records = index === -1
    ? [...state.records, record]
    : state.records.map((item) => (item.id === record.id ? { ...item, ...record } : item))
  state.error = ""
  publish()
}

function clearRefresh() {
  window.clearTimeout(refreshTimer)
  refreshTimer = 0
}

function scheduleRefresh() {
  clearRefresh()
  if (!state.mode || listeners.size === 0) return
  const age = state.updatedAt ? Date.now() - state.updatedAt : SNAPSHOT_MS
  const wait = Math.max(0, SNAPSHOT_MS - age)
  refreshTimer = window.setTimeout(() => {
    refreshSnapshot()
  }, wait)
}

async function refreshSnapshot() {
  if (!state.mode || refreshing || listeners.size === 0) return
  if (state.updatedAt && Date.now() - state.updatedAt < SNAPSHOT_MS) {
    scheduleRefresh()
    return
  }
  refreshing = true
  try {
    const won = await runTransaction(db, async (transaction) => {
      const lock = await transaction.get(LOCK_DOC)
      const until = lock.exists() ? lock.data().until?.toMillis?.() || 0 : 0
      if (until > Date.now()) return false
      transaction.set(LOCK_DOC, { until: Timestamp.fromMillis(Date.now() + 90 * 1000) })
      return true
    })
    if (!won) return
    const snap = await getDocs(query(collection(db, "characters"), where("status", "==", "bound")))
    const cards = snap.docs.map((entry) => publicCharacter(entry.id, entry.data()))
    await setDoc(SNAPSHOT_DOC, { cards, updatedAt: serverTimestamp() })
    applyServerRecords(cards, true)
    state.updatedAt = Date.now()
  } catch {
    state.error = "內部名冊讀取失敗"
    emit()
  } finally {
    refreshing = false
    if (!state.mode || listeners.size === 0) return
    if (!state.updatedAt || Date.now() - state.updatedAt >= SNAPSHOT_MS) {
      clearRefresh()
      refreshTimer = window.setTimeout(() => {
        refreshSnapshot()
      }, 60 * 1000)
      return
    }
    scheduleRefresh()
  }
}

function listenLive() {
  const roster = query(collection(db, "characters"), where("status", "==", "bound"))
  const unsubscribe = onSnapshot(
    roster,
    (snap) => {
      applyServerRecords(snap.docs.map((entry) => publicCharacter(entry.id, entry.data())), true)
      state.updatedAt = 0
    },
    () => {
      state.error = "內部名冊讀取失敗"
      emit()
    },
  )
  stopData = () => unsubscribe()
}

function listenSnapshot() {
  const unsubscribe = onSnapshot(
    SNAPSHOT_DOC,
    (snap) => {
      const data = snap.data()
      applyServerRecords(Array.isArray(data?.cards) ? data.cards : [], false)
      state.updatedAt = data?.updatedAt?.toMillis?.() || 0
      scheduleRefresh()
    },
    () => {
      state.error = "內部名冊讀取失敗"
      emit()
    },
  )
  stopData = () => {
    unsubscribe()
    clearRefresh()
  }
  scheduleRefresh()
}

function useMode(enabled) {
  if (dataMode === enabled) return
  dataMode = enabled
  state.mode = enabled
  stopData()
  stopData = () => {}
  if (enabled) listenSnapshot()
  else listenLive()
}

function start() {
  if (state.started) return
  state.started = true
  subscribeSiteControls((controls) => {
    useMode(controls.rosterSnapshot)
  })
}

export function peekBoundRoster() {
  return { records: state.records, error: state.error }
}

export function subscribeBoundRoster(listener) {
  listeners.add(listener)
  start()
  listener({ records: state.records, error: state.error })
  if (state.mode) scheduleRefresh()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearRefresh()
  }
}
