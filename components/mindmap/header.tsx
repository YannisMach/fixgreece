'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MindMap, Profile, formatDisplayName, ContentStatus } from '@/lib/types'
import { ArrowLeft, Globe, Lock, FileEdit, ChevronDown, Trash2, MoreHorizontal, Bookmark, BookmarkCheck } from 'lucide-react'
import { updateMindMapStatus, deleteMindMap, updateMindMapDescription } from '@/lib/actions/mindmap'
import { saveMindMap, unsaveMindMap } from '@/lib/actions/saves'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MindMapHeaderProps {
  mindMap: MindMap & { profiles: Profile }
  isOwner: boolean
  isSaved?: boolean
  currentUserId?: string
}

const statusConfig: Record<ContentStatus, { icon: typeof Globe; label: string; className: string; bgClass: string }> = {
  draft: { icon: FileEdit, label: 'Draft', className: 'text-amber-600', bgClass: 'bg-amber-500/10' },
  public: { icon: Globe, label: 'Public', className: 'text-green-600', bgClass: 'bg-green-500/10' },
  private: { icon: Lock, label: 'Private', className: 'text-muted-foreground', bgClass: 'bg-muted' },
}

export function MindMapHeader({ mindMap, isOwner, isSaved: initialSaved = false, currentUserId }: MindMapHeaderProps) {
  const displayName = mindMap.profiles ? formatDisplayName(mindMap.profiles) : 'Unknown'
  const currentStatus = (mindMap.status || (mindMap.is_public ? 'public' : 'private')) as ContentStatus
  const [status, setStatus] = useState<ContentStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isSaving, setIsSaving] = useState(false)
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
  
  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteMindMap(mindMap.id)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  async function handleSaveToggle() {
    if (!currentUserId) return
    
    setIsSaving(true)
    if (isSaved) {
      const success = await unsaveMindMap(mindMap.id)
      if (success) setIsSaved(false)
    } else {
      const save = await saveMindMap(mindMap.id)
      if (save) setIsSaved(true)
    }
    setIsSaving(false)
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
        <p className="hidden text-xs text-muted-foreground md:block">
          Click on a node to interact, double-click to add a branch
        </p>
        
        {/* Save button for non-owners */}
        {!isOwner && currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={isSaved ? 'text-primary' : ''}
            title={isSaved ? 'Remove from saved' : 'Save subject'}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        )}
        
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete subject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{mindMap.title}&quot; and all its branches, comments, and votes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
