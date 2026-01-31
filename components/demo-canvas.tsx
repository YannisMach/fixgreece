'use client'

import React from "react"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Plus, Minus, RotateCcw, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface DemoNode {
  id: string
  content: string
  x: number
  y: number
  parentId: string | null
  color: string
  votes: number
}

const INITIAL_NODES: DemoNode[] = [
  { id: '1', content: 'Improving Greek Tourism', x: 400, y: 250, parentId: null, color: '#4F46E5', votes: 24 },
  { id: '2', content: 'Sustainable practices', x: 180, y: 120, parentId: '1', color: '#10B981', votes: 18 },
  { id: '3', content: 'Local experiences', x: 620, y: 120, parentId: '1', color: '#F59E0B', votes: 12 },
  { id: '4', content: 'Infrastructure', x: 180, y: 380, parentId: '1', color: '#8B5CF6', votes: 8 },
  { id: '5', content: 'Digital tools', x: 620, y: 380, parentId: '1', color: '#EC4899', votes: 15 },
]

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']

export function DemoCanvas() {
  const [nodes, setNodes] = useState<DemoNode[]>(INITIAL_NODES)
  const [selectedNode, setSelectedNode] = useState<DemoNode | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [dragNode, setDragNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isCanvasBackground = 
      target === canvasRef.current || 
      target.classList.contains('canvas-bg') ||
      target.tagName === 'svg' ||
      target.tagName === 'path'
    
    if (e.button === 0 && isCanvasBackground) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedNode(null)
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y })
    }
    
    if (dragNode) {
      const rect = contentRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - dragOffset.x) / zoom
        const y = (e.clientY - rect.top - dragOffset.y) / zoom
        
        setNodes(prev => prev.map(n => 
          n.id === dragNode ? { ...n, x, y } : n
        ))
      }
    }
  }, [isPanning, startPan, dragNode, dragOffset, zoom])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragNode(null)
  }, [])

  // Handle node interactions
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    setDragNode(nodeId)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleNodeClick = (node: DemoNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(node)
  }

  const handleNodeDoubleClick = (node: DemoNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingNode(node.id)
    setEditContent(node.content)
  }

  const handleAddBranch = (parentNode: DemoNode) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 150
    const newNode: DemoNode = {
      id: Date.now().toString(),
      content: 'New idea',
      x: parentNode.x + Math.cos(angle) * distance,
      y: parentNode.y + Math.sin(angle) * distance,
      parentId: parentNode.id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      votes: 0
    }
    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode)
    setEditingNode(newNode.id)
    setEditContent(newNode.content)
  }

  const handleVote = (nodeId: string, delta: number) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, votes: n.votes + delta } : n
    ))
  }

  const handleSaveEdit = () => {
    if (editingNode && editContent.trim()) {
      setNodes(prev => prev.map(n => 
        n.id === editingNode ? { ...n, content: editContent.trim() } : n
      ))
    }
    setEditingNode(null)
    setEditContent('')
  }

  const handleReset = () => {
    setNodes(INITIAL_NODES)
    setPan({ x: 0, y: 0 })
    setZoom(1)
    setSelectedNode(null)
  }

  // Draw connections
  const renderConnections = () => {
    return nodes.filter(n => n.parentId).map(node => {
      const parent = nodes.find(p => p.id === node.parentId)
      if (!parent) return null
      
      const startX = parent.x
      const startY = parent.y
      const endX = node.x
      const endY = node.y
      
      // Control points for bezier curve
      const midX = (startX + endX) / 2
      const midY = (startY + endY) / 2
      const dx = endX - startX
      const dy = endY - startY
      const ctrl1X = startX + dx * 0.25
      const ctrl1Y = startY + dy * 0.5
      const ctrl2X = startX + dx * 0.75
      const ctrl2Y = startY + dy * 0.5
      
      return (
        <path
          key={`${parent.id}-${node.id}`}
          d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
          stroke={node.color}
          strokeWidth="2"
          strokeOpacity="0.4"
          fill="none"
          className="transition-all duration-200"
        />
      )
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-warning/60" />
            <div className="h-3 w-3 rounded-full bg-success/60" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Try it yourself</span>
            <span className="text-muted-foreground">- no signup required</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} title="Reset demo">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          'relative h-[450px] cursor-grab select-none overflow-hidden bg-[#fafafa] lg:h-[500px]',
          isPanning && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dot pattern */}
        <div 
          className="canvas-bg absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />
        
        {/* Content layer */}
        <div
          ref={contentRef}
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Connections */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ overflow: 'visible' }}>
            {renderConnections()}
          </svg>
          
          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id
            const isEditing = editingNode === node.id
            const isRoot = !node.parentId
            
            return (
              <div
                key={node.id}
                className={cn(
                  'absolute cursor-pointer transition-shadow duration-200',
                  isSelected && 'z-10'
                )}
                style={{
                  left: node.x,
                  top: node.y,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                onClick={(e) => handleNodeClick(node, e)}
                onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
              >
                <div
                  className={cn(
                    'group relative rounded-xl border-2 px-4 py-2.5 shadow-md transition-all',
                    isRoot 
                      ? 'border-transparent text-white' 
                      : 'border-border bg-card hover:shadow-lg',
                    isSelected && !isRoot && 'border-primary ring-2 ring-primary/20',
                    isSelected && isRoot && 'ring-2 ring-white/40'
                  )}
                  style={{
                    backgroundColor: isRoot ? node.color : undefined,
                    borderColor: !isRoot && isSelected ? node.color : undefined,
                  }}
                >
                  {isEditing ? (
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className="h-auto min-w-[120px] border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
                      autoFocus
                    />
                  ) : (
                    <span className={cn(
                      'text-sm font-medium whitespace-nowrap',
                      isRoot ? 'text-white' : 'text-foreground'
                    )}>
                      {node.content}
                    </span>
                  )}
                  
                  {/* Vote display */}
                  {!isRoot && (
                    <div className={cn(
                      'absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                      node.votes > 0 ? 'bg-success text-white' : node.votes < 0 ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      {node.votes > 0 ? '+' : ''}{node.votes}
                    </div>
                  )}
                  
                  {/* Add branch button */}
                  {isSelected && (
                    <button
                      className="absolute -bottom-9 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110"
                      onClick={(e) => { e.stopPropagation(); handleAddBranch(node) }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Selected node actions */}
        {selectedNode && !editingNode && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => handleVote(selectedNode.id, 1)}
            >
              <ThumbsUp className="h-4 w-4" />
              Upvote
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => handleVote(selectedNode.id, -1)}
            >
              <ThumbsDown className="h-4 w-4" />
              Downvote
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => handleAddBranch(selectedNode)}
            >
              <Plus className="h-4 w-4" />
              Add branch
            </Button>
          </div>
        )}
        
        {/* Instructions */}
        <div className="absolute left-4 top-4 z-10 rounded-lg bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow backdrop-blur-sm">
          <div><strong>Drag canvas</strong> to pan</div>
          <div><strong>Click node</strong> to select</div>
          <div><strong>Double-click</strong> to edit</div>
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Like what you see? Sign up to save your work and collaborate with others.
        </p>
        <Link href="/auth/sign-up">
          <Button size="sm">
            Create free account
          </Button>
        </Link>
      </div>
    </div>
  )
}
