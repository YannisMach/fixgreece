'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Folder, FolderPlus, Inbox, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createSaveFolder, updateSaveFolder, deleteSaveFolder } from '@/lib/actions/saves'
import type { SaveFolder } from '@/lib/types'

const FOLDER_COLORS = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
]

interface FolderSidebarProps {
  folders: SaveFolder[]
  activeFolder?: string
}

export function FolderSidebar({ folders, activeFolder }: FolderSidebarProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [editingFolder, setEditingFolder] = useState<SaveFolder | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(FOLDER_COLORS[0])
  const [isLoading, setIsLoading] = useState(false)
  
  const handleCreate = async () => {
    if (!name.trim()) return
    setIsLoading(true)
    
    await createSaveFolder(name.trim(), color)
    
    setName('')
    setColor(FOLDER_COLORS[0])
    setIsCreating(false)
    setIsLoading(false)
    router.refresh()
  }
  
  const handleUpdate = async () => {
    if (!editingFolder || !name.trim()) return
    setIsLoading(true)
    
    await updateSaveFolder(editingFolder.id, name.trim(), color)
    
    setEditingFolder(null)
    setName('')
    setIsLoading(false)
    router.refresh()
  }
  
  const handleDelete = async (folder: SaveFolder) => {
    if (!confirm(`Delete folder "${folder.name}"? Saved items will be moved to Unfiled.`)) return
    
    await deleteSaveFolder(folder.id)
    router.refresh()
  }
  
  const startEditing = (folder: SaveFolder) => {
    setEditingFolder(folder)
    setName(folder.name)
    setColor(folder.color || FOLDER_COLORS[0])
  }
  
  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-4 space-y-2">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Folders</span>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Folder name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-6 w-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={!name.trim() || isLoading}
                  className="w-full"
                >
                  Create Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Link
          href="/saves"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            !activeFolder
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Inbox className="h-4 w-4" />
          All Saves
        </Link>
        
        <Link
          href="/saves?folder=unfiled"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            activeFolder === 'unfiled'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Folder className="h-4 w-4" />
          Unfiled
        </Link>
        
        <div className="my-2 h-px bg-border" />
        
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
              activeFolder === folder.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Link
              href={`/saves?folder=${folder.id}`}
              className="flex flex-1 items-center gap-3"
            >
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: folder.color || FOLDER_COLORS[0] }}
              />
              <span className="flex-1 truncate text-sm">{folder.name}</span>
              {folder.save_count !== undefined && folder.save_count > 0 && (
                <span className="text-xs text-muted-foreground">
                  {folder.save_count}
                </span>
              )}
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEditing(folder)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(folder)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        
        {/* Edit folder dialog */}
        <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Folder name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <Button 
                onClick={handleUpdate} 
                disabled={!name.trim() || isLoading}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
