import { useState, useEffect, useRef } from "react"
import { loadRemote } from "@/utils/loadRemote"
import logger  from "@/logger"

const REMOTE_BASE = "https://micro-frontend.flast.vn"

export function useFlastRemote(componentId, exposedModule = "MPage") {
  const [ Component, setComponent ] = useState(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadRemote(componentId, exposedModule, REMOTE_BASE)
      .then((mod) => setComponent(() => mod.default ?? mod))
      .catch((err) => logger.error(`[useFlastRemote] ${componentId}/${exposedModule}`, err))
  }, [componentId, exposedModule])

  return Component
};
