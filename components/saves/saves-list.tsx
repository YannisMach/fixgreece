'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bookmark, 
  ExternalLink, 
  Folder, 
  GitBranch, 
  Map, 
  MoreHorizontal, 
  Trash2 
} from 'lucide-react'
import { removeSave, moveSaveToFolder } from '@/lib/actions/saves'
import type { Save, SaveFolder } from '@/lib/types'

interface SavesListProps {
  saves: Save[]
  folders: SaveFolder[]
}

export function SavesList({ saves, folders }: SavesListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const handleRemove = async (saveId: string) => {
    setLoadingId(saveId)
    await removeSave(saveId)
    setLoadingId(null)
    router.refresh()
  }
  
  const handleMove = async (saveId: string, folderId: string | null) => {
    setLoadingId(saveId)
    await moveSaveToFolder(saveId, folderId)
    setLoadingId(null)
    router.refresh()
  }
  
  if (saves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
        <Bookmark className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium text-foreground">No saved items</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Save mind maps and branches to access them quickly later.
        </p>
        <Button asChild className="mt-4">
          <Link href="/explore">Explore Mind Maps</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {saves.map((save) => {
        const isMindMap = !!save.mind_map_id
        const title = isMindMap 
          ? save.mind_map?.title 
          : save.node?.content
        const href = isMindMap
          ? `/mindmap/${save.mind_map_id}`
          : `/mindmap/${save.node?.mind_map_id}?node=${save.node_id}`
        
        return (
          <Card 
            key={save.id} 
            className={`group relative overflow-hidden transition-all hover:shadow-md ${
              loadingId === save.id ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isMindMap ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Map className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                      <GitBranch className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {isMindMap ? 'Mind Map' : 'Branch'}
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={href}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Folder className="mr-2 h-4 w-4" />
                        Move to folder
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem 
                          onClick={() => handleMove(save.id, null)}
                        >
                          Unfiled
                        </DropdownMenuItem>
                        {folders.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={() => handleMove(save.id, folder.id)}
                          >
                            <div
                              className="mr-2 h-3 w-3 rounded-sm"
                              style={{ backgroundColor: folder.color || '#4F46E5' }}
                            />
                            {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleRemove(save.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <Link href={href} className="block">
                <h3 className="mb-1 line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
                  {title || 'Untitled'}
                </h3>
                
                {save.notes && (
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {save.notes}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Saved {formatDistanceToNow(new Date(save.created_at), { addSuffix: true })}
                  </span>
                  {save.folder && (
                    <span className="flex items-center gap-1">
                      <div
                        className="h-2 w-2 rounded-sm"
                        style={{ backgroundColor: save.folder.color || '#4F46E5' }}
                      />
                      {save.folder.name}
                    </span>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
