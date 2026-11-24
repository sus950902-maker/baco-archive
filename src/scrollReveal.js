import { useEffect } from "react"

export function useScrollReveal(active) {
  useEffect(() => {
    if (!active) return undefined
    const root = document.querySelector("[data-reveal-root]")
    if (!root) return undefined

    const known = new WeakSet()
    const revealed = new WeakSet()
    let initial = true

    const show = (element, instant) => {
      revealed.add(element)
      if (instant) element.classList.add("reveal-instant")
      element.classList.add("is-in")
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          show(entry.target, false)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.01, rootMargin: "0px 0px -8% 0px" },
    )

    const arm = (element) => {
      if (revealed.has(element)) {
        if (!element.classList.contains("is-in")) show(element, true)
        return
      }
      if (known.has(element) || element.classList.contains("is-in")) return
      known.add(element)
      const rect = element.getBoundingClientRect()
      const visible = rect.bottom > 0 && rect.top < window.innerHeight * 0.92
      if (rect.bottom <= 0 || (!initial && visible)) {
        show(element, true)
        return
      }
      observer.observe(element)
    }

    const scan = () => {
      root.querySelectorAll(".reveal-right").forEach(arm)
      initial = false
    }

    scan()
    const mutations = new MutationObserver(scan)
    mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] })

    return () => {
      observer.disconnect()
      mutations.disconnect()
    }
  }, [active])
}
