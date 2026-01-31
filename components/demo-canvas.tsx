'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Plus, Minus, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface DemoNode {
  id: string
  content: string
  x: number
  y: number
  parentId: string | null
  color: string
  votes: number
  userVote: -1 | 0 | 1 // -1 = downvoted, 0 = no vote, 1 = upvoted
  comments: number
}

const INITIAL_NODES: DemoNode[] = [
  { id: '1', content: 'Improving Greek Tourism', x: 400, y: 250, parentId: null, color: '#4F46E5', votes: 24, userVote: 0, comments: 12 },
  { id: '2', content: 'Sustainable practices', x: 180, y: 120, parentId: '1', color: '#10B981', votes: 18, userVote: 0, comments: 5 },
  { id: '3', content: 'Local experiences', x: 620, y: 120, parentId: '1', color: '#F59E0B', votes: 12, userVote: 0, comments: 3 },
  { id: '4', content: 'Infrastructure', x: 180, y: 380, parentId: '1', color: '#8B5CF6', votes: 8, userVote: 0, comments: 7 },
  { id: '5', content: 'Digital tools', x: 620, y: 380, parentId: '1', color: '#EC4899', votes: 15, userVote: 0, comments: 2 },
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

  // Handle panning - same as actual canvas
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isCanvasBackground = 
      target === canvasRef.current || 
      target.classList.contains('canvas-bg') ||
      target.tagName === 'svg' ||
      target.tagName === 'path' ||
      target.tagName === 'g' ||
      target === contentRef.current
    
    if (e.button === 1 || (e.button === 0 && isCanvasBackground)) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedNode(null)
      e.preventDefault()
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y })
    }
    
    if (dragNode) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - pan.x - dragOffset.x) / zoom
        const y = (e.clientY - rect.top - pan.y - dragOffset.y) / zoom
        
        setNodes(prev => prev.map(n => 
          n.id === dragNode ? { ...n, x, y } : n
        ))
      }
    }
  }, [isPanning, startPan, dragNode, dragOffset, zoom, pan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragNode(null)
  }, [])

  // Handle node drag start
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom
    
    setDragNode(nodeId)
    setDragOffset({
      x: x - node.x,
      y: y - node.y
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
    const offset = 150
    const newNode: DemoNode = {
      id: Date.now().toString(),
      content: 'New idea',
      x: parentNode.x,
      y: parentNode.y + offset,
      parentId: parentNode.id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      votes: 0,
      userVote: 0,
      comments: 0
    }
    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode)
    setEditingNode(newNode.id)
    setEditContent(newNode.content)
  }

  // Toggle vote - only allows 1 upvote or 1 downvote (like the real app)
  const handleVote = (nodeId: string, voteType: 1 | -1) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      
      let newUserVote: -1 | 0 | 1
      let voteDelta: number
      
      if (n.userVote === voteType) {
        // Clicking same vote again removes it
        newUserVote = 0
        voteDelta = -voteType
      } else if (n.userVote === 0) {
        // No previous vote, add new vote
        newUserVote = voteType
        voteDelta = voteType
      } else {
        // Switching vote (e.g., from up to down)
        newUserVote = voteType
        voteDelta = voteType * 2 // Remove old vote and add new
      }
      
      return {
        ...n,
        userVote: newUserVote,
        votes: n.votes + voteDelta
      }
    }))
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

  // Generate curved path - same as actual canvas
  const getConnectionPath = (from: DemoNode, to: DemoNode): string => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const curvature = Math.min(distance * 0.3, 100)
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    const controlX = midX
    const controlY = midY - curvature * (Math.abs(dx) > Math.abs(dy) ? 1 : 0.3)
    
    return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`
  }

  // Draw connections
  const renderConnections = () => {
    return nodes.filter(n => n.parentId).map(node => {
      const parent = nodes.find(p => p.id === node.parentId)
      if (!parent) return null
      
      return (
        <g key={`${parent.id}-${node.id}`}>
          {/* Shadow */}
          <path
            d={getConnectionPath(parent, node)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Main line */}
          <path
            d={getConnectionPath(parent, node)}
            fill="none"
            stroke={node.color}
            strokeWidth={2}
            strokeLinecap="round"
            className="transition-colors"
          />
        </g>
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
            <div className="h-3 w-3 rounded-full bg-amber-500/60" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Try it yourself</span>
            <span className="hidden text-muted-foreground sm:inline">- no signup required</span>
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
          'canvas-bg relative h-[450px] cursor-grab select-none overflow-hidden bg-[#f8fafc] lg:h-[500px]',
          isPanning && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dot pattern - same as actual canvas */}
        <div 
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
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
          <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
            {renderConnections()}
          </svg>
          
          {/* Nodes - styled like actual MindMapNode */}
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id
            const isEditing = editingNode === node.id
            const isRoot = !node.parentId
            const isDragging = dragNode === node.id
            
            return (
              <div
                key={node.id}
                className={cn(
                  'group absolute flex cursor-pointer select-none flex-col items-center',
                  isDragging && 'z-50 cursor-grabbing',
                  isSelected && 'z-40'
                )}
                style={{
                  left: node.x,
                  top: node.y,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    handleNodeDragStart(node.id, e)
                  }
                }}
                onClick={(e) => handleNodeClick(node, e)}
                onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
              >
                {/* Quick add button - single button below node */}
                {isSelected && (
                  <button
                    className="absolute -bottom-10 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all hover:scale-110 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); handleAddBranch(node) }}
                    title="Add branch"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                
                {/* Main node card - styled like actual MindMapNode */}
                <div
                  className={cn(
                    'relative rounded-2xl border-2 bg-card px-4 py-3 shadow-lg transition-all duration-200',
                    isRoot ? 'min-w-[160px] text-center' : 'max-w-[240px]',
                    isDragging && 'scale-105 shadow-2xl',
                    isSelected 
                      ? 'border-primary shadow-xl ring-4 ring-primary/20' 
                      : 'border-transparent hover:shadow-xl'
                  )}
                  style={{
                    borderColor: isSelected ? undefined : node.color,
                    boxShadow: isSelected ? undefined : `0 4px 20px -4px ${node.color}30`,
                  }}
                >
                  {/* Color indicator bar */}
                  <div 
                    className="absolute -top-0.5 left-4 right-4 h-1.5 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  
                  {/* Content */}
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
                    <p className={cn(
                      'font-medium leading-snug text-foreground',
                      isRoot ? 'text-base' : 'text-sm'
                    )}>
                      {node.content}
                    </p>
                  )}
                  
                  {/* Stats bar - styled like actual MindMapNode */}
                  {(node.votes !== 0 || node.comments > 0) && (
                    <div className="mt-2 flex items-center justify-center gap-3 border-t border-border/50 pt-2 text-xs">
                      {node.votes !== 0 && (
                        <span className={cn(
                          'flex items-center gap-1 font-semibold',
                          node.votes > 0 && 'text-emerald-600',
                          node.votes < 0 && 'text-red-500'
                        )}>
                          {node.votes > 0 ? (
                            <ThumbsUp className="h-3 w-3" />
                          ) : (
                            <ThumbsDown className="h-3 w-3" />
                          )}
                          {node.votes > 0 ? '+' : ''}{node.votes}
                        </span>
                      )}
                      {node.comments > 0 && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {node.comments}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Connection dot */}
                {!isRoot && (
                  <div 
                    className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Selected node actions */}
        {selectedNode && !editingNode && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-lg">
            <Button
              variant={selectedNode.userVote === 1 ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 gap-1.5', selectedNode.userVote === 1 && 'bg-emerald-600 hover:bg-emerald-700')}
              onClick={() => handleVote(selectedNode.id, 1)}
            >
              <ThumbsUp className="h-4 w-4" />
              {selectedNode.userVote === 1 ? 'Upvoted' : 'Upvote'}
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button
              variant={selectedNode.userVote === -1 ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 gap-1.5', selectedNode.userVote === -1 && 'bg-red-600 hover:bg-red-700')}
              onClick={() => handleVote(selectedNode.id, -1)}
            >
              <ThumbsDown className="h-4 w-4" />
              {selectedNode.userVote === -1 ? 'Downvoted' : 'Downvote'}
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
          Like what you see? Sign up to save your work and collaborate.
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
