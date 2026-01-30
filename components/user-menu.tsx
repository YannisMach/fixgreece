'use client'

import { Profile, formatDisplayName } from '@/lib/types'
import { signOut } from '@/lib/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface UserMenuProps {
  profile: Profile | null
}

export function UserMenu({ profile }: UserMenuProps) {
  const displayName = profile ? formatDisplayName(profile) : 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isAdminOrMod = profile?.role === 'admin' || profile?.role === 'moderator'
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 rounded-full pl-1.5 pr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initials}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {initials}
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-foreground">{displayName}</p>
            {profile?.role !== 'user' && (
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdminOrMod && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex cursor-pointer items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
