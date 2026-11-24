function coarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches
}

if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    (event) => {
      document.querySelectorAll(".is-primed").forEach((item) => {
        if (!item.contains(event.target)) item.classList.remove("is-primed")
      })
    },
    true,
  )
}

export function primeTouch(event) {
  if (!coarsePointer() || event.detail === 0) return false
  const node = event.currentTarget
  if (node.classList.contains("is-primed")) {
    node.classList.remove("is-primed")
    return false
  }
  document.querySelectorAll(".is-primed").forEach((item) => item.classList.remove("is-primed"))
  node.classList.add("is-primed")
  return true
}
