'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/lib/actions/admin'

interface UserRoleSelectProps {
  userId: string
  currentRole: 'admin' | 'moderator' | 'user'
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const [isPending, startTransition] = useTransition()
  
  function handleChange(role: string) {
    startTransition(async () => {
      await updateUserRole(userId, role as 'admin' | 'moderator' | 'user')
    })
  }
  
  return (
    <Select defaultValue={currentRole} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="moderator">Moderator</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  )
}
