'use client'

import React from 'react'
import { Node as NodeType } from '@/lib/types'
import { SharedNode } from './shared-node'

interface MindMapNodeProps {
  node: NodeType
  isSelected: boolean
  isDragging?: boolean
  onSelect: () => void
  onDragStart: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onQuickAdd?: (direction: 'left' | 'right' | 'up' | 'down') => void
  canEdit: boolean
  showQuickAdd?: boolean
}

export function MindMapNode({ 
  node, 
  isSelected, 
  isDragging,
  onSelect, 
  onDragStart,
  onDoubleClick, 
  onQuickAdd,
  canEdit,
  showQuickAdd
}: MindMapNodeProps) {
  // Convert NodeType to SharedNodeData format
  const sharedNodeData = {
    id: node.id,
    content: node.content,
    description: node.description,
    position_x: node.position_x,
    position_y: node.position_y,
    parent_id: node.parent_id,
    color: node.color,
    status: node.status,
    vote_count: node.vote_count,
    user_vote: node.user_vote,
    comments_count: node.comments_count,
  }

  return (
    <SharedNode
      node={sharedNodeData}
      isSelected={isSelected}
      isDragging={isDragging}
      onSelect={onSelect}
      onDragStart={onDragStart}
      onDoubleClick={canEdit ? onDoubleClick : undefined}
      onQuickAdd={onQuickAdd ? () => onQuickAdd('down') : undefined}
      canEdit={canEdit}
      showQuickAdd={showQuickAdd}
    />
  )
}
