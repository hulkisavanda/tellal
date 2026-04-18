import Link from 'next/link'

export type DashboardNavKey =
  | 'dashboard'
  | 'leads'
  | 'campaigns'
  | 'agents'
  | 'sequences'
  | 'reports'
  | 'settings'

const links: { href: string; label: string; key: DashboardNavKey }[] = [
  { href: '/dashboard', label: 'Özet', key: 'dashboard' },
  { href: '/leads', label: 'Leadler', key: 'leads' },
  { href: '/campaigns', label: 'Kampanyalar', key: 'campaigns' },
  { href: '/agents', label: 'Danışmanlar', key: 'agents' },
  { href: '/sequences', label: 'Sekanslar', key: 'sequences' },
  { href: '/reports', label: 'Raporlar', key: 'reports' },
  { href: '/settings', label: 'Ayarlar', key: 'settings' },
]

export function DashboardNav({ current }: { current: DashboardNavKey }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-gray-200 pb-3 mb-6">
      {links.map(({ href, label, key }) => {
        const active = current === key
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
