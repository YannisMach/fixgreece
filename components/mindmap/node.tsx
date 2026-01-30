'use client'

import React from "react"
import { Node as NodeType } from '@/lib/types'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MindMapNodeProps {
  node: NodeType
  isSelected: boolean
  onSelect: () => void
  onDoubleClick: (e: React.MouseEvent) => void
  canEdit: boolean
}

export function MindMapNode({ node, isSelected, onSelect, onDoubleClick, canEdit }: MindMapNodeProps) {
  const isRoot = !node.parent_id
  const voteCount = node.vote_count ?? 0
  const commentsCount = node.comments_count ?? 0
  
  return (
    <div
      className={cn(
        'absolute flex cursor-pointer select-none flex-col items-center transition-transform hover:scale-105',
        isSelected && 'z-10'
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
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (canEdit) onDoubleClick(e)
      }}
    >
      <div
        className={cn(
          'relative rounded-xl border-2 bg-card px-4 py-3 shadow-lg transition-all',
          isRoot ? 'min-w-[140px] text-center' : 'max-w-[220px]',
          isSelected 
            ? 'border-primary shadow-xl shadow-primary/20' 
            : 'border-transparent hover:shadow-xl'
        )}
        style={{
          borderColor: isSelected ? undefined : node.color || '#6366F1',
        }}
      >
        {/* Color indicator bar */}
        <div 
          className="absolute -top-0.5 left-4 right-4 h-1 rounded-full"
          style={{ backgroundColor: node.color || '#6366F1' }}
        />
        
        <p className={cn(
          'font-medium text-foreground',
          isRoot ? 'text-base' : 'text-sm'
        )}>
          {node.content}
        </p>
        
        {/* Stats */}
        {(voteCount !== 0 || commentsCount > 0) && (
          <div className="mt-2 flex items-center justify-center gap-3 text-xs">
            {voteCount !== 0 && (
              <span className={cn(
                'flex items-center gap-1 font-medium',
                voteCount > 0 && 'text-success',
                voteCount < 0 && 'text-destructive'
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
    </div>
  )
}
