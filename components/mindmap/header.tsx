import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MindMap, Profile, formatDisplayName } from '@/lib/types'
import { ArrowLeft, Globe, Lock } from 'lucide-react'

interface MindMapHeaderProps {
  mindMap: MindMap & { profiles: Profile }
  isOwner: boolean
}

export function MindMapHeader({ mindMap, isOwner }: MindMapHeaderProps) {
  const displayName = mindMap.profiles ? formatDisplayName(mindMap.profiles) : 'Unknown'
  
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
            <Badge variant={mindMap.is_public ? 'default' : 'secondary'} className="text-xs">
              {mindMap.is_public ? (
                <Globe className="mr-1 h-3 w-3" />
              ) : (
                <Lock className="mr-1 h-3 w-3" />
              )}
              {mindMap.is_public ? 'Public' : 'Private'}
            </Badge>
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
