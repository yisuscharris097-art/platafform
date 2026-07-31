import { Sidebar } from '@/components/shell/sidebar'
import { Topbar } from '@/components/shell/topbar'
import { CommandPalette } from '@/components/shell/command-palette'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:pl-[240px]">
      <Sidebar />
      <Topbar />
      <CommandPalette />
      <main className="mx-auto max-w-6xl p-5 pb-20 md:p-8 md:pb-8">{children}</main>
    </div>
  )
}
