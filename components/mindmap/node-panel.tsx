'use client'

import React from "react"

import { useState, useEffect, useTransition, useRef } from 'react'
import { Node as NodeType, Comment, formatDisplayName, ContentStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Flag, 
  Plus, 
  Trash2,
  Send,
  Globe,
  Lock,
  FileEdit,
  GripHorizontal,
  PanelTop,
  Minimize2
} from 'lucide-react'
import { vote, getComments, createComment, updateNode, deleteNode, createReport, updateNodeStatus } from '@/lib/actions/mindmap'
import { cn } from '@/lib/utils'

const statusConfig: Record<ContentStatus, { icon: typeof Globe; label: string; className: string }> = {
  draft: { icon: FileEdit, label: 'Draft', className: 'text-amber-600 border-amber-500' },
  public: { icon: Globe, label: 'Public', className: 'text-green-600 border-green-500' },
  private: { icon: Lock, label: 'Private', className: 'text-muted-foreground border-muted-foreground' },
}

interface NodePanelProps {
  node: NodeType
  canEdit: boolean
  currentUserId?: string
  onUpdate: (node: NodeType) => void
  onDelete: (nodeId: string) => void
  onAddBranch: (node: NodeType) => void
  onClose: () => void
}

export function NodePanel({ 
  node, 
  canEdit, 
  currentUserId,
  onUpdate, 
  onDelete, 
  onAddBranch,
  onClose 
}: NodePanelProps) {
  const [content, setContent] = useState(node.content)
  const [description, setDescription] = useState(node.description || '')
  const [nodeStatus, setNodeStatus] = useState<ContentStatus>((node.status || 'public') as ContentStatus)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Draggable and docking state
  const [isDocked, setIsDocked] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  
  const isRoot = !node.parent_id
  const canDelete = canEdit && !isRoot && node.user_id === currentUserId
  const isNodeOwner = node.user_id === currentUserId
  
  useEffect(() => {
    setContent(node.content)
    setDescription(node.description || '')
    loadComments()
  }, [node.id])
  
  // Handle drag
  useEffect(() => {
    if (!isDragging) return
    
    function handleMouseMove(e: MouseEvent) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
    
    function handleMouseUp() {
      setIsDragging(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])
  
  function handleDragStart(e: React.MouseEvent) {
    if (isDocked) return
    
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    setIsDragging(true)
  }
  
  function toggleDock() {
    setIsDocked(!isDocked)
    if (!isDocked) {
      setPosition({ x: 0, y: 0 })
    }
  }
  
  async function loadComments() {
    const data = await getComments(node.id)
    setComments(data)
  }
  
  function handleVote(value: number) {
    if (!currentUserId) return
    
    startTransition(async () => {
      await vote(node.id, value)
      
      let newVoteCount = node.vote_count ?? 0
      let newUserVote = 0
      
      if (node.user_vote === value) {
        newVoteCount -= value
        newUserVote = 0
      } else if (node.user_vote) {
        newVoteCount = newVoteCount - node.user_vote + value
        newUserVote = value
      } else {
        newVoteCount += value
        newUserVote = value
      }
      
      onUpdate({ ...node, vote_count: newVoteCount, user_vote: newUserVote })
    })
  }
  
  function handleContentSave() {
    if (content === node.content) return
    
    startTransition(async () => {
      const formData = new FormData()
      formData.set('nodeId', node.id)
      formData.set('content', content)
      
      const result = await updateNode(formData)
      if (result.success) {
        onUpdate({ ...node, content })
      }
    })
  }
  
  function handleDescriptionSave() {
    if (description === (node.description || '')) return
    
    startTransition(async () => {
      const formData = new FormData()
      formData.set('nodeId', node.id)
      formData.set('description', description)
      
      const result = await updateNode(formData)
      if (result.success) {
        onUpdate({ ...node, description })
      }
    })
  }
  
  function handleDelete() {
    if (!canDelete) return
    
    startTransition(async () => {
      const result = await deleteNode(node.id)
      if (result.success) {
        onDelete(node.id)
      }
    })
  }
  
  function handleAddComment() {
    if (!newComment.trim() || !currentUserId) return
    
    startTransition(async () => {
      const result = await createComment(node.id, newComment)
      if (result.success && result.comment) {
        setComments(prev => [...prev, result.comment as Comment])
        setNewComment('')
        onUpdate({ ...node, comments_count: (node.comments_count ?? 0) + 1 })
      }
    })
  }
  
  function handleReport() {
    if (!reportReason.trim() || !currentUserId) return
    
    startTransition(async () => {
      const formData = new FormData()
      formData.set('nodeId', node.id)
      formData.set('reason', reportReason)
      
      await createReport(formData)
      setReportReason('')
      setShowReport(false)
    })
  }
  
  function handleStatusChange(newStatus: ContentStatus) {
    if (newStatus === nodeStatus || !isNodeOwner) return
    
    startTransition(async () => {
      const result = await updateNodeStatus(node.id, newStatus)
      if (result.success) {
        setNodeStatus(newStatus)
        onUpdate({ ...node, status: newStatus })
      }
    })
  }
  
  // Panel positioning classes
  const panelClasses = cn(
    'z-50 w-80 shadow-xl transition-all duration-200',
    isDocked 
      ? 'fixed left-1/2 top-16 -translate-x-1/2 rounded-b-xl rounded-t-none border-t-0' 
      : 'absolute rounded-xl',
    isDragging && 'cursor-grabbing'
  )
  
  const panelStyle = isDocked 
    ? {} 
    : { 
        right: position.x === 0 && position.y === 0 ? '16px' : 'auto',
        top: position.x === 0 && position.y === 0 ? '16px' : 'auto',
        left: position.x !== 0 || position.y !== 0 ? `${position.x}px` : 'auto',
        transform: position.x !== 0 || position.y !== 0 ? `translateY(${position.y}px)` : 'none',
      }
  
  return (
    <Card 
      ref={panelRef}
      className={panelClasses}
      style={panelStyle}
    >
      {/* Draggable header */}
      <CardHeader 
        className={cn(
          'flex flex-row items-center justify-between space-y-0 border-b border-border pb-2',
          !isDocked && 'cursor-grab',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          {!isDocked && (
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-base font-medium">
            {isRoot ? 'Main Topic' : 'Branch'}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleDock}
            className="h-7 w-7 p-0"
            title={isDocked ? 'Undock panel' : 'Dock to top'}
          >
            {isDocked ? <Minimize2 className="h-3.5 w-3.5" /> : <PanelTop className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        'space-y-4 pt-4',
        isDocked && 'max-h-[60vh] overflow-y-auto'
      )}>
        {/* Content */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            {canEdit ? (
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleContentSave}
                onKeyDown={(e) => e.key === 'Enter' && handleContentSave()}
                className="font-medium"
                placeholder="Enter title..."
              />
            ) : (
              <p className="font-medium">{node.content}</p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            {canEdit || isNodeOwner ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                placeholder="Add a description..."
                rows={2}
                className="resize-none text-sm"
              />
            ) : description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">No description</p>
            )}
          </div>
        </div>
        
        {/* Status Selector for node owner */}
        {isNodeOwner && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Branch Status</p>
            <div className="flex gap-1">
              {(Object.keys(statusConfig) as ContentStatus[]).map((s) => {
                const cfg = statusConfig[s]
                const Icon = cfg.icon
                const isActive = nodeStatus === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    disabled={isPending}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-all',
                      isActive 
                        ? `${cfg.className} border-current bg-current/5` 
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Voting */}
        <div className="flex items-center justify-between rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(1)}
              disabled={!currentUserId || isPending}
              className={cn(node.user_vote === 1 && 'bg-success/20 text-success')}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className={cn(
              'min-w-[2rem] text-center font-medium',
              (node.vote_count ?? 0) > 0 && 'text-success',
              (node.vote_count ?? 0) < 0 && 'text-destructive'
            )}>
              {node.vote_count ?? 0}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={!currentUserId || isPending}
              className={cn(node.user_vote === -1 && 'bg-destructive/20 text-destructive')}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReport(!showReport)}
            disabled={!currentUserId}
            className="text-muted-foreground"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Report */}
        {showReport && (
          <div className="space-y-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">Report this content</p>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Why are you reporting this?"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleReport}
                disabled={isPending || !reportReason.trim()}
              >
                Submit Report
              </Button>
            </div>
          </div>
        )}
        
        {/* Tabs for Comments */}
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="comments" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Comments ({node.comments_count ?? 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="space-y-3">
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No comments yet
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-muted p-2">
                    <p className="text-xs font-medium text-foreground">
                      {comment.profiles ? formatDisplayName(comment.profiles) : 'Anonymous'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
            
            {currentUserId && (
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button size="icon" onClick={handleAddComment} disabled={isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Actions */}
        {canEdit && (
          <div className="flex gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => onAddBranch(node)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
