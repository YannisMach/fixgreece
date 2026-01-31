'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MindMap, Profile, formatDisplayName, ContentStatus } from '@/lib/types'
import { ArrowLeft, Globe, Lock, FileEdit, ChevronDown } from 'lucide-react'
import { updateMindMapStatus } from '@/lib/actions/mindmap'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MindMapHeaderProps {
  mindMap: MindMap & { profiles: Profile }
  isOwner: boolean
}

const statusConfig: Record<ContentStatus, { icon: typeof Globe; label: string; className: string; bgClass: string }> = {
  draft: { icon: FileEdit, label: 'Draft', className: 'text-amber-600', bgClass: 'bg-amber-500/10' },
  public: { icon: Globe, label: 'Public', className: 'text-green-600', bgClass: 'bg-green-500/10' },
  private: { icon: Lock, label: 'Private', className: 'text-muted-foreground', bgClass: 'bg-muted' },
}

export function MindMapHeader({ mindMap, isOwner }: MindMapHeaderProps) {
  const displayName = mindMap.profiles ? formatDisplayName(mindMap.profiles) : 'Unknown'
  const currentStatus = (mindMap.status || (mindMap.is_public ? 'public' : 'private')) as ContentStatus
  const [status, setStatus] = useState<ContentStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  
  const config = statusConfig[status]
  const StatusIcon = config.icon
  
  async function handleStatusChange(newStatus: ContentStatus) {
    if (newStatus === status) return
    
    setIsUpdating(true)
    const result = await updateMindMapStatus(mindMap.id, newStatus)
    if (result.success) {
      setStatus(newStatus)
      router.refresh()
    }
    setIsUpdating(false)
  }
  
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <Link href={isOwner ? '/dashboard' : '/explore'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-foreground">{mindMap.title}</h1>
            
            {isOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-6 gap-1 px-2 ${config.bgClass} ${config.className}`}
                    disabled={isUpdating}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {(Object.keys(statusConfig) as ContentStatus[]).map((s) => {
                    const cfg = statusConfig[s]
                    const Icon = cfg.icon
                    return (
                      <DropdownMenuItem 
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={status === s ? 'bg-muted' : ''}
                      >
                        <Icon className={`mr-2 h-4 w-4 ${cfg.className}`} />
                        <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                        {s === 'draft' && <span className="ml-2 text-xs text-muted-foreground">Only you</span>}
                        {s === 'public' && <span className="ml-2 text-xs text-muted-foreground">Anyone</span>}
                        {s === 'private' && <span className="ml-2 text-xs text-muted-foreground">Invite only</span>}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${config.bgClass} ${config.className}`}>
                <StatusIcon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            by {isOwner ? 'You' : displayName}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Click on a node to interact, double-click to add a branch
        </p>
      </div>
    </header>
  )
}
