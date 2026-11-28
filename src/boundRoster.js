import { collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore"
import { publicCharacter, rosterCard } from "./characters"
import { db } from "./firebase"
import { CONTROLS_DOC, readControls, subscribeSiteControls } from "./siteControls"

const SNAPSHOT_MS = 10 * 60 * 1000
const CACHE_KEY = "baco-roster-cache"
const SNAPSHOT_DOC = doc(db, "snapshots", "roster")
const LOCK_DOC = doc(db, "snapshots", "rosterLock")
const DIRTY_DOC = doc(db, "snapshots", "rosterDirty")

const state = {
  records: [],
  error: "",
  started: false,
  mode: false,
  snapshotAt: 0,
  fetchedAt: 0,
}

const listeners = new Set()
const adopted = new Map()
let stopData = () => {}
let attachTimer = 0
let writeTimer = 0
let refreshing = false
let dirtyPending = false
let pendingForce = false
let dataMode = null
let listening = false
let primed = false

function publish() {
  const snapshot = { records: state.records, error: state.error }
  listeners.forEach((listener) => listener(snapshot))
}

function emit() {
  publish()
}

function cardTime(record) {
  return record?.updatedAt || 0
}

function applyServerRecords(records, authoritative) {
  const present = new Set()
  const merged = records.map((record) => {
    present.add(record.id)
    const local = adopted.get(record.id)
    if (local && cardTime(local) > cardTime(record)) return local
    adopted.delete(record.id)
    return record
  })
  adopted.forEach((record, id) => {
    if (present.has(id)) return
    if (authoritative) adopted.delete(id)
    else merged.push(record)
  })
  state.records = merged
  state.error = ""
  publish()
}

function loadCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "")
    if (!parsed || !Array.isArray(parsed.cards)) return
    state.records = parsed.cards
    state.snapshotAt = parsed.updatedAt || 0
    state.fetchedAt = parsed.fetchedAt || 0
    parsed.cards.forEach((card) => {
      if (cardTime(card) > state.snapshotAt) adopted.set(card.id, card)
    })
  } catch {
    // 瀏覽器不允許讀取時，改等這次的線上結果。
  }
}

function writeCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      cards: state.records,
      updatedAt: state.snapshotAt,
      fetchedAt: state.fetchedAt,
    }))
  } catch {
    // 瀏覽器不允許儲存時，這次停留期間仍使用記憶體中的名冊。
  }
}

export function adoptBoundRecord(record) {
  if (!record?.id) return
  const next = { ...record, updatedAt: cardTime(record) || Date.now() }
  adopted.set(next.id, next)
  const index = state.records.findIndex((item) => item.id === next.id)
  state.records = index === -1
    ? [...state.records, next]
    : state.records.map((item) => (item.id === next.id ? { ...item, ...next } : item))
  state.error = ""
  writeCache()
  publish()
}

function clearAttach() {
  window.clearTimeout(attachTimer)
  attachTimer = 0
}

function detachListener() {
  clearAttach()
  stopData()
  stopData = () => {}
  listening = false
}

function scheduleSnapshotWrite(delay, force = false) {
  if (force) pendingForce = true
  if (writeTimer) return
  const age = state.snapshotAt ? Date.now() - state.snapshotAt : SNAPSHOT_MS
  const wait = delay == null ? Math.max(0, SNAPSHOT_MS - age) : delay
  writeTimer = window.setTimeout(() => {
    writeTimer = 0
    const nextForce = pendingForce
    pendingForce = false
    writeSnapshot(nextForce)
  }, wait)
}

async function ensureMode() {
  if (dataMode !== null) return
  const snap = await getDoc(CONTROLS_DOC)
  useMode(readControls(snap.data()).rosterSnapshot)
}

export async function markRosterDirty() {
  try {
    await ensureMode()
    if (!dataMode) return
    if (!dirtyPending) {
      await setDoc(DIRTY_DOC, { pending: true, at: serverTimestamp() })
      dirtyPending = true
    }
    scheduleSnapshotWrite()
  } catch {
    dirtyPending = false
  }
}

async function clearDirtyIfSettled(seenAt) {
  return runTransaction(db, async (transaction) => {
    const dirty = await transaction.get(DIRTY_DOC)
    if (!dirty.exists() || dirty.data().pending !== true) return false
    const at = dirty.data().at?.toMillis?.() || 0
    if (seenAt && at !== seenAt) return true
    transaction.set(DIRTY_DOC, { pending: false, at: serverTimestamp() })
    return false
  })
}

async function writeSnapshot(force) {
  if (refreshing) return
  refreshing = true
  let outcome = ""
  let retryIn = 0
  try {
    const decision = await runTransaction(db, async (transaction) => {
      const lock = await transaction.get(LOCK_DOC)
      const until = lock.exists() ? lock.data().until?.toMillis?.() || 0 : 0
      if (until > Date.now()) return { outcome: "busy" }
      const roster = await transaction.get(SNAPSHOT_DOC)
      const updatedAt = roster.exists() ? roster.data().updatedAt?.toMillis?.() || 0 : 0
      if (updatedAt && Date.now() - updatedAt < SNAPSHOT_MS) {
        return { outcome: "wait", retryIn: SNAPSHOT_MS - (Date.now() - updatedAt) }
      }
      const dirty = await transaction.get(DIRTY_DOC)
      const pending = dirty.exists() && dirty.data().pending === true
      if (!force && !pending) return { outcome: "idle" }
      transaction.set(LOCK_DOC, { until: Timestamp.fromMillis(Date.now() + 90 * 1000) })
      return { outcome: "go", seenAt: pending ? dirty.data().at?.toMillis?.() || 0 : 0 }
    })
    outcome = decision.outcome
    retryIn = decision.retryIn || 0
    if (outcome !== "go") return
    const snap = await getDocs(query(collection(db, "characters"), where("status", "==", "bound")))
    const cards = snap.docs.map((entry) => rosterCard(entry.id, entry.data()))
    await setDoc(SNAPSHOT_DOC, { cards, updatedAt: serverTimestamp() })
    const stillDirty = await clearDirtyIfSettled(decision.seenAt || 0)
    applyServerRecords(cards, false)
    state.snapshotAt = Date.now()
    state.fetchedAt = Date.now()
    writeCache()
    dirtyPending = stillDirty
    if (stillDirty) scheduleSnapshotWrite()
  } catch {
    outcome = "error"
    state.error = "內部名冊讀取失敗"
    emit()
  } finally {
    refreshing = false
    if (outcome === "idle") dirtyPending = false
    if (outcome === "wait" && dirtyPending && retryIn > 0) scheduleSnapshotWrite(retryIn)
    if (outcome === "busy" && (dirtyPending || force)) scheduleSnapshotWrite(15 * 1000, force)
    if (outcome === "error" && (dirtyPending || force)) scheduleSnapshotWrite(60 * 1000, force)
  }
}

function rememberSnapshot(snap) {
  const data = snap.data()
  const cards = Array.isArray(data?.cards) ? data.cards.map((card) => rosterCard(card.id, card)) : []
  if (snap.metadata.fromCache && !cards.length) return
  const updatedAt = data?.updatedAt?.toMillis?.() || 0
  applyServerRecords(cards, false)
  if (snap.metadata.fromCache) return
  state.snapshotAt = updatedAt || state.snapshotAt
  state.fetchedAt = Date.now()
  writeCache()
  if (!updatedAt && !primed) {
    primed = true
    writeSnapshot(true)
  }
}

function listenLive() {
  listening = true
  const roster = query(collection(db, "characters"), where("status", "==", "bound"))
  const unsubscribe = onSnapshot(
    roster,
    (snap) => {
      applyServerRecords(snap.docs.map((entry) => publicCharacter(entry.id, entry.data())), true)
    },
    () => {
      state.error = "內部名冊讀取失敗"
      emit()
    },
  )
  stopData = () => unsubscribe()
}

function listenSnapshot() {
  listening = true
  primed = false
  const unsubscribe = onSnapshot(
    SNAPSHOT_DOC,
    (snap) => rememberSnapshot(snap),
    () => {
      state.error = "內部名冊讀取失敗"
      emit()
    },
  )
  stopData = () => unsubscribe()
}

function syncAttachment() {
  if (listeners.size === 0 || dataMode === null) {
    detachListener()
    return
  }
  if (listening) return
  if (!dataMode) {
    listenLive()
    return
  }
  const age = state.fetchedAt ? Date.now() - state.fetchedAt : SNAPSHOT_MS
  if (age < SNAPSHOT_MS) {
    if (attachTimer) return
    attachTimer = window.setTimeout(() => {
      attachTimer = 0
      if (listeners.size > 0 && dataMode) listenSnapshot()
    }, SNAPSHOT_MS - age)
    return
  }
  listenSnapshot()
}

function useMode(enabled) {
  const next = enabled === true
  if (dataMode === next) return
  dataMode = next
  state.mode = next
  detachListener()
  syncAttachment()
}

function start() {
  if (state.started) return
  state.started = true
  subscribeSiteControls((controls) => {
    useMode(controls.rosterSnapshot)
  })
}

loadCache()

export function peekBoundRoster() {
  return { records: state.records, error: state.error }
}

export function subscribeBoundRoster(listener) {
  listeners.add(listener)
  start()
  listener({ records: state.records, error: state.error })
  syncAttachment()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) detachListener()
  }
}
