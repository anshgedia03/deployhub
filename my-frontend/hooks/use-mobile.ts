import * as React from "react"

const MOBILE_BREAKPOINT =1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const current = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile((prev) => (prev !== current ? current : prev));
    }
    mql.addEventListener("change", onChange)
    const initial = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile((prev) => (prev !== initial ? initial : prev));
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
