'use client'

import React, { useRef, useCallback } from 'react'
import { Node as NodeType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MinimapProps {
  nodes: NodeType[]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  viewport: {
    x: number
    y: number
    width: number
    height: number
  }
  onViewportChange: (x: number, y: number) => void
}

export function Minimap({ nodes, bounds, viewport, onViewportChange }: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null)
  
  const width = 180
  const height = 120
  const padding = 10
  
  const contentWidth = bounds.maxX - bounds.minX
  const contentHeight = bounds.maxY - bounds.minY
  
  const scale = Math.min(
    (width - padding * 2) / contentWidth,
    (height - padding * 2) / contentHeight
  )
  
  const offsetX = (width - contentWidth * scale) / 2
  const offsetY = (height - contentHeight * scale) / 2
  
  const toMinimapX = (x: number) => (x - bounds.minX) * scale + offsetX
  const toMinimapY = (y: number) => (y - bounds.minY) * scale + offsetY
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = minimapRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    const contentX = (clickX - offsetX) / scale + bounds.minX
    const contentY = (clickY - offsetY) / scale + bounds.minY
    
    onViewportChange(contentX, contentY)
  }, [bounds, scale, offsetX, offsetY, onViewportChange])
  
  return (
    <div 
      ref={minimapRef}
      className="absolute bottom-24 right-6 cursor-pointer overflow-hidden rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur-sm transition-opacity hover:opacity-100"
      style={{ width, height, opacity: 0.9 }}
      onClick={handleClick}
    >
      {/* Nodes */}
      <svg width={width} height={height} className="absolute inset-0">
        {/* Connections */}
        {nodes.map(node => {
          if (!node.parent_id) return null
          const parent = nodes.find(n => n.id === node.parent_id)
          if (!parent) return null
          
          return (
            <line
              key={`conn-${node.id}`}
              x1={toMinimapX(parent.position_x)}
              y1={toMinimapY(parent.position_y)}
              x2={toMinimapX(node.position_x)}
              y2={toMinimapY(node.position_y)}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
          )
        })}
        
        {/* Nodes */}
        {nodes.map(node => (
          <circle
            key={node.id}
            cx={toMinimapX(node.position_x)}
            cy={toMinimapY(node.position_y)}
            r={node.parent_id ? 3 : 5}
            fill={node.color || '#6366F1'}
            className="transition-transform"
          />
        ))}
        
        {/* Viewport rectangle */}
        <rect
          x={toMinimapX(viewport.x)}
          y={toMinimapY(viewport.y)}
          width={Math.max(viewport.width * scale, 20)}
          height={Math.max(viewport.height * scale, 15)}
          fill="rgba(99, 102, 241, 0.1)"
          stroke="#6366F1"
          strokeWidth={1.5}
          rx={2}
          className="pointer-events-none"
        />
      </svg>
      
      {/* Label */}
      <div className="absolute bottom-1 right-2 text-[10px] font-medium text-muted-foreground">
        Overview
      </div>
    </div>
  )
}
