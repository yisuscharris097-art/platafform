'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
}

export function Modal({ open, onClose, title, children }: OverlayProps) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-bg/80" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-border-strong bg-raised p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-16 font-medium">{title}</h2>
          <button onClick={onClose} className="text-faint hover:text-text" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Sheet({ open, onClose, title, children, side = 'right' }: OverlayProps & { side?: 'right' | 'bottom' }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-bg/80" onClick={onClose} />
      <div
        className={cn(
          'absolute overflow-y-auto border-border-strong bg-raised p-5',
          side === 'right' && 'inset-y-0 right-0 w-full max-w-md border-l',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-lg border-t',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-16 font-medium">{title}</h2>
          <button onClick={onClose} className="text-faint hover:text-text" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
