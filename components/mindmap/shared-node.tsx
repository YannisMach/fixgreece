'use client'

import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, Plus, Globe, Lock, FileEdit } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shared types for node data that works for both real and demo
export interface SharedNodeData {
  id: string
  content: string
  description?: string | null
  position_x: number
  position_y: number
  parent_id: string | null
  color: string | null
  status?: 'draft' | 'public' | 'private'
  vote_count?: number
  user_vote?: number
  comments_count?: number
}

interface SharedNodeProps {
  node: SharedNodeData
  isSelected: boolean
  isDragging?: boolean
  onSelect: () => void
  onDragStart: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
  onQuickAdd?: () => void
  canEdit?: boolean
  showQuickAdd?: boolean
}

const statusIcons = {
  draft: FileEdit,
  public: Globe,
  private: Lock,
}

const statusColors = {
  draft: 'text-amber-500',
  public: 'text-green-500',
  private: 'text-muted-foreground',
}

export function SharedNode({ 
  node, 
  isSelected, 
  isDragging,
  onSelect, 
  onDragStart,
  onDoubleClick, 
  onQuickAdd,
  canEdit = false,
  showQuickAdd = false
}: SharedNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isRoot = !node.parent_id
  const voteCount = node.vote_count ?? 0
  const commentsCount = node.comments_count ?? 0
  const status = (node.status || 'public') as 'draft' | 'public' | 'private'
  const StatusIcon = statusIcons[status]
  
  return (
    <div
      className={cn(
        'group absolute flex cursor-pointer select-none flex-col items-center',
        isDragging && 'z-50 cursor-grabbing',
        isSelected && 'z-40'
      )}
      style={{
        left: node.position_x,
        top: node.position_y,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          onDragStart(e)
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (onDoubleClick) onDoubleClick(e)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quick add button - single button below node */}
      {showQuickAdd && onQuickAdd && (
        <button
          className="absolute -bottom-10 left-1/2 z-50 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110"
          onClick={(e) => { 
            e.stopPropagation()
            e.preventDefault()
            onQuickAdd() 
          }}
          title="Add branch"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
      
      {/* Main node card */}
      <div
        className={cn(
          'relative rounded-2xl border-2 bg-card px-4 py-3 shadow-lg transition-all duration-200',
          isRoot ? 'min-w-[160px] text-center' : 'max-w-[240px]',
          isDragging && 'shadow-2xl scale-105',
          isSelected 
            ? 'border-primary shadow-xl ring-4 ring-primary/20' 
            : 'border-transparent hover:shadow-xl',
          isHovered && !isSelected && 'scale-[1.02]'
        )}
        style={{
          borderColor: isSelected ? undefined : node.color || '#6366F1',
          boxShadow: isSelected ? undefined : `0 4px 20px -4px ${node.color || '#6366F1'}30`,
        }}
      >
        {/* Color indicator bar */}
        <div 
          className="absolute -top-0.5 left-4 right-4 h-1.5 rounded-full"
          style={{ backgroundColor: node.color || '#6366F1' }}
        />
        
        {/* Status badge */}
        {status !== 'public' && (
          <div className={cn('absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-card shadow-md', statusColors[status])}>
            <StatusIcon className="h-3 w-3" />
          </div>
        )}
        
        {/* Content */}
        <p className={cn(
          'font-medium text-foreground leading-snug',
          isRoot ? 'text-base' : 'text-sm'
        )}>
          {node.content}
        </p>
        
        {/* Stats bar */}
        {(voteCount !== 0 || commentsCount > 0) && (
          <div className="mt-2 flex items-center justify-center gap-3 border-t border-border/50 pt-2 text-xs">
            {voteCount !== 0 && (
              <span className={cn(
                'flex items-center gap-1 font-semibold',
                voteCount > 0 && 'text-emerald-600',
                voteCount < 0 && 'text-red-500'
              )}>
                {voteCount > 0 ? (
                  <ThumbsUp className="h-3 w-3" />
                ) : (
                  <ThumbsDown className="h-3 w-3" />
                )}
                {voteCount > 0 ? '+' : ''}{voteCount}
              </span>
            )}
            {commentsCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {commentsCount}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Connection dot */}
      {!isRoot && (
        <div 
          className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: node.color || '#6366F1' }}
        />
      )}
    </div>
  )
}
