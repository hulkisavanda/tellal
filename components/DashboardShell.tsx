import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { DashboardNav, type DashboardNavKey } from '@/components/DashboardNav'

export function DashboardShell({
  children,
  userEmail,
  officeName,
  current,
  maxWidthClass = 'max-w-6xl mx-auto',
}: {
  children: React.ReactNode
  userEmail: string
  officeName: string
  current: DashboardNavKey
  /** Örn. lead detay: `max-w-3xl mx-auto` */
  maxWidthClass?: string
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className={maxWidthClass}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900 hover:opacity-80">
            tellal.
          </Link>
          <LogoutButton />
        </div>
        <p className="text-gray-500 text-sm mb-1">{officeName}</p>
        <p className="text-gray-500">Hoş geldin, {userEmail}</p>

        <DashboardNav current={current} />

        {children}
      </div>
    </div>
  )
}
