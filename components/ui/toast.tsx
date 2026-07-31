'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
}

const ToastContext = createContext<(message: string) => void>(() => undefined)

export function useToast(): (message: string) => void {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((message: string) => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded border border-border-strong bg-raised px-4 py-2.5 text-13 text-text"
          >
            <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
            {t.message}
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="ml-2 text-faint hover:text-text"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
