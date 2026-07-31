import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary: 'bg-gold text-bg hover:bg-gold-dim',
  secondary: 'border border-border bg-surface text-text hover:border-border-strong hover:bg-raised',
  ghost: 'text-dim hover:text-text hover:bg-raised',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' && 'h-8 px-3 text-13',
        size === 'md' && 'h-9 px-4 text-13',
        size === 'lg' && 'h-12 px-5 text-14',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
