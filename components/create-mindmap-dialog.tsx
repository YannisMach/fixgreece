'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMindMap } from '@/lib/actions/mindmap'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Globe, Lock } from 'lucide-react'

interface CreateMindMapDialogProps {
  trigger?: React.ReactNode
}

export function CreateMindMapDialog({ trigger }: CreateMindMapDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const router = useRouter()
  
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.set('isPublic', isPublic.toString())
    
    const result = await createMindMap(formData)
    
    if (result.success && result.id) {
      setOpen(false)
      router.push(`/mindmap/${result.id}`)
    }
    
    setLoading(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            New mind map
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a new mind map</DialogTitle>
          <DialogDescription>
            Start mapping out a problem or idea to collaborate on
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Improving public transport in Athens"
              className="h-11"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What problem are you trying to solve?"
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Globe className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
              )}
              <div>
                <Label htmlFor="public" className="text-sm font-medium">
                  {isPublic ? 'Public' : 'Private'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Anyone can view and contribute' : 'Only you can see this map'}
                </p>
              </div>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 bg-transparent" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create map'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
