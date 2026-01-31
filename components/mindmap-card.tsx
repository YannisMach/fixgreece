import Link from 'next/link'
import { MindMap, Profile, formatDisplayName, ContentStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { Globe, Lock, FileEdit } from 'lucide-react'

const statusConfig: Record<ContentStatus, { icon: typeof Globe; label: string; className: string }> = {
  draft: { icon: FileEdit, label: 'Draft', className: 'text-amber-600' },
  public: { icon: Globe, label: 'Public', className: 'text-green-600' },
  private: { icon: Lock, label: 'Private', className: 'text-muted-foreground' },
}

interface MindMapCardProps {
  mindMap: MindMap & { profiles: Profile }
  isOwner?: boolean
}

export function MindMapCard({ mindMap, isOwner }: MindMapCardProps) {
  const displayName = mindMap.profiles ? formatDisplayName(mindMap.profiles) : 'Unknown'
  
  return (
    <Link href={`/mindmap/${mindMap.id}`}>
      <div className="group relative h-[200px] overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Preview area with pattern */}
        <div className="h-[120px] overflow-hidden bg-muted/30">
          <div 
            className="h-full w-full"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* Mini preview nodes */}
            <div className="relative h-full w-full p-4">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="h-3 w-16 rounded-full bg-primary/60" />
              </div>
              <div className="absolute left-[30%] top-[35%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-2 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="absolute left-[70%] top-[35%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-2 w-12 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="absolute left-[30%] top-[65%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-2 w-8 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="absolute left-[70%] top-[65%] -translate-x-1/2 -translate-y-1/2">
                <div className="h-2 w-14 rounded-full bg-muted-foreground/30" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Info section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {mindMap.title}
              </h3>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                {(() => {
                  const status = mindMap.status || (mindMap.is_public ? 'public' : 'private')
                  const config = statusConfig[status as ContentStatus]
                  const StatusIcon = config.icon
                  return (
                    <span className={`flex items-center gap-1 ${config.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  )
                })()}
                <span>
                  {formatDistanceToNow(new Date(mindMap.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          {!isOwner && displayName && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {displayName}
              </span>
            </div>
          )}
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all group-hover:bg-foreground/5 group-hover:opacity-100">
          <span className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            Open map
          </span>
        </div>
      </div>
    </Link>
  )
}
