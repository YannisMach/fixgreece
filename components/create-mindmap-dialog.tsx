'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createMindMap } from '@/lib/actions/mindmap'
import { getCategories, searchTags, addTagsToMindMap } from '@/lib/actions/categories'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Globe, Lock, X, Tag } from 'lucide-react'
import type { Category, Tag as TagType } from '@/lib/types'

interface CreateMindMapDialogProps {
  trigger?: React.ReactNode
}

export function CreateMindMapDialog({ trigger }: CreateMindMapDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<TagType[]>([])
  const router = useRouter()
  
  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
    }
  }, [open])
  
  useEffect(() => {
    if (tagInput.length >= 2) {
      searchTags(tagInput).then(setTagSuggestions)
    } else {
      setTagSuggestions([])
    }
  }, [tagInput])
  
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed])
      setTagInput('')
      setTagSuggestions([])
    }
  }
  
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }
  
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.set('isPublic', isPublic.toString())
    if (selectedCategory) {
      formData.set('categoryId', selectedCategory)
    }
    
    const result = await createMindMap(formData)
    
    if (result.success && result.id) {
      // Add tags to the mind map
      if (tags.length > 0) {
        await addTagsToMindMap(result.id, tags)
      }
      
      setOpen(false)
      setTags([])
      setSelectedCategory('')
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
      <DialogContent className="sm:max-w-lg">
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
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tags <span className="font-normal text-muted-foreground">(up to 5)</span>
            </Label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  placeholder="Add tags..."
                  className="flex-1"
                  disabled={tags.length >= 5}
                />
              </div>
              {tagSuggestions.length > 0 && (
                <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                      onClick={() => addTag(tag.name)}
                    >
                      <span>{tag.name}</span>
                      <span className="text-xs text-muted-foreground">{tag.usage_count} uses</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pl-2">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
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
