'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Flag, History, LayoutDashboard } from 'lucide-react'

interface AdminNavProps {
  role: 'admin' | 'moderator'
}

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'moderator'] },
  { href: '/admin/reports', label: 'Reports', icon: Flag, roles: ['admin', 'moderator'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { href: '/admin/logs', label: 'Name Change Logs', icon: History, roles: ['admin'] },
]

export function AdminNav({ role }: AdminNavProps) {
  const pathname = usePathname()
  
  const filteredItems = navItems.filter(item => item.roles.includes(role))
  
  return (
    <nav className="w-full lg:w-56">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Admin Panel</h2>
      <div className="flex flex-row gap-2 lg:flex-col">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
