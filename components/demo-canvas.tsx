'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Plus, Minus, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, MessageSquare, X, Send, Flag } from 'lucide-react'
import Link from 'next/link'
import { SharedNode, SharedNodeData } from '@/components/mindmap/shared-node'

interface DemoComment {
  id: string
  author: string
  content: string
  createdAt: Date
}

interface DemoNodeData extends SharedNodeData {
  userVote: -1 | 0 | 1
  comments: DemoComment[]
}

const INITIAL_NODES: DemoNodeData[] = [
  { 
    id: '1', 
    content: 'Improving Greek Tourism', 
    position_x: 400, 
    position_y: 250, 
    parent_id: null, 
    color: '#4F46E5', 
    vote_count: 24, 
    userVote: 0, 
    comments_count: 2,
    comments: [
      { id: 'c1', author: 'Maria K.', content: 'Great initiative! We need more sustainable options.', createdAt: new Date('2024-01-15') },
      { id: 'c2', author: 'Nikos P.', content: 'What about focusing on off-season tourism?', createdAt: new Date('2024-01-16') }
    ]
  },
  { 
    id: '2', 
    content: 'Sustainable practices', 
    position_x: 180, 
    position_y: 120, 
    parent_id: '1', 
    color: '#10B981', 
    vote_count: 18, 
    userVote: 0, 
    comments_count: 1,
    comments: [
      { id: 'c3', author: 'Anna G.', content: 'Eco-certifications would help here.', createdAt: new Date('2024-01-17') }
    ]
  },
  { 
    id: '3', 
    content: 'Local experiences', 
    position_x: 620, 
    position_y: 120, 
    parent_id: '1', 
    color: '#F59E0B', 
    vote_count: 12, 
    userVote: 0, 
    comments_count: 0,
    comments: []
  },
  { 
    id: '4', 
    content: 'Infrastructure', 
    position_x: 180, 
    position_y: 380, 
    parent_id: '1', 
    color: '#8B5CF6', 
    vote_count: 8, 
    userVote: 0, 
    comments_count: 1,
    comments: [
      { id: 'c4', author: 'Dimitris S.', content: 'Public transport needs major improvements.', createdAt: new Date('2024-01-18') }
    ]
  },
  { 
    id: '5', 
    content: 'Digital tools', 
    position_x: 620, 
    position_y: 380, 
    parent_id: '1', 
    color: '#EC4899', 
    vote_count: 15, 
    userVote: 0, 
    comments_count: 0,
    comments: []
  },
]

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']
const DEMO_USERNAMES = ['Guest User', 'Visitor', 'Anonymous', 'Demo User']

export function DemoCanvas() {
  const [nodes, setNodes] = useState<DemoNodeData[]>(INITIAL_NODES)
  const [selectedNode, setSelectedNode] = useState<DemoNodeData | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [dragNode, setDragNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [newComment, setNewComment] = useState('')
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
          n.id === dragNode ? { ...n, position_x: x, position_y: y } : n
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
      x: x - node.position_x,
      y: y - node.position_y
    })
  }

  const handleNodeSelect = (node: DemoNodeData) => {
    setSelectedNode(node)
  }

  const handleNodeDoubleClick = (node: DemoNodeData) => {
    setEditingNode(node.id)
    setEditContent(node.content)
  }

  const handleAddBranch = (parentNode: DemoNodeData) => {
    const offset = 150
    const newNode: DemoNodeData = {
      id: Date.now().toString(),
      content: 'New idea',
      position_x: parentNode.position_x,
      position_y: parentNode.position_y + offset,
      parent_id: parentNode.id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vote_count: 0,
      userVote: 0,
      comments_count: 0,
      comments: []
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
      
      const updatedNode = {
        ...n,
        userVote: newUserVote,
        vote_count: (n.vote_count ?? 0) + voteDelta
      }
      
      // Update selected node if it's the same
      if (selectedNode?.id === nodeId) {
        setSelectedNode(updatedNode)
      }
      
      return updatedNode
    }))
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedNode) return
    
    const comment: DemoComment = {
      id: Date.now().toString(),
      author: DEMO_USERNAMES[Math.floor(Math.random() * DEMO_USERNAMES.length)],
      content: newComment.trim(),
      createdAt: new Date()
    }
    
    setNodes(prev => prev.map(n => {
      if (n.id !== selectedNode.id) return n
      
      const updatedNode = {
        ...n,
        comments: [...n.comments, comment],
        comments_count: (n.comments_count ?? 0) + 1
      }
      
      setSelectedNode(updatedNode)
      return updatedNode
    }))
    
    setNewComment('')
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
  const getConnectionPath = (from: DemoNodeData, to: DemoNodeData): string => {
    const dx = to.position_x - from.position_x
    const dy = to.position_y - from.position_y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const curvature = Math.min(distance * 0.3, 100)
    const midX = (from.position_x + to.position_x) / 2
    const midY = (from.position_y + to.position_y) / 2
    const controlX = midX
    const controlY = midY - curvature * (Math.abs(dx) > Math.abs(dy) ? 1 : 0.3)
    
    return `M ${from.position_x} ${from.position_y} Q ${controlX} ${controlY} ${to.position_x} ${to.position_y}`
  }

  // Draw connections
  const renderConnections = () => {
    return nodes.filter(n => n.parent_id).map(node => {
      const parent = nodes.find(p => p.id === node.parent_id)
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
            stroke={node.color || '#6366F1'}
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
          
          {/* Nodes - using SharedNode component */}
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id
            const isEditing = editingNode === node.id
            const isDragging = dragNode === node.id
            
            return isEditing ? (
              // Editing state - inline input
              <div
                key={node.id}
                className="absolute z-50"
                style={{
                  left: node.position_x,
                  top: node.position_y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className="rounded-2xl border-2 border-primary bg-card px-4 py-3 shadow-xl ring-4 ring-primary/20"
                  style={{ minWidth: '160px' }}
                >
                  <div 
                    className="absolute -top-0.5 left-4 right-4 h-1.5 rounded-full"
                    style={{ backgroundColor: node.color || '#6366F1' }}
                  />
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="h-auto min-w-[120px] border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <SharedNode
                key={node.id}
                node={node}
                isSelected={isSelected}
                isDragging={isDragging}
                onSelect={() => handleNodeSelect(node)}
                onDragStart={(e) => handleNodeDragStart(node.id, e)}
                onDoubleClick={() => handleNodeDoubleClick(node)}
                onQuickAdd={() => handleAddBranch(node)}
                canEdit={true}
                showQuickAdd={isSelected}
              />
            )
          })}
        </div>
        
        {/* Node Panel - styled like the actual NodePanel */}
        {selectedNode && !editingNode && (
          <Card className="absolute right-4 top-4 z-20 w-80 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {!selectedNode.parent_id ? 'Main Topic' : 'Branch'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <p className="font-medium">{selectedNode.content}</p>
              </div>
              
              {/* Voting */}
              <div className="flex items-center justify-between rounded-lg border border-border p-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(selectedNode.id, 1)}
                    className={cn(selectedNode.userVote === 1 && 'bg-emerald-100 text-emerald-600')}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className={cn(
                    'min-w-[2rem] text-center font-medium',
                    (selectedNode.vote_count ?? 0) > 0 && 'text-emerald-600',
                    (selectedNode.vote_count ?? 0) < 0 && 'text-red-500'
                  )}>
                    {selectedNode.vote_count ?? 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(selectedNode.id, -1)}
                    className={cn(selectedNode.userVote === -1 && 'bg-red-100 text-red-600')}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  title="Report (demo only)"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Comments Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({selectedNode.comments?.length ?? 0})
                </div>
                
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {selectedNode.comments?.length === 0 ? (
                    <p className="py-2 text-center text-sm text-muted-foreground">
                      No comments yet
                    </p>
                  ) : (
                    selectedNode.comments?.map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-muted p-2">
                        <p className="text-xs font-medium text-foreground">
                          {comment.author}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Add Comment */}
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="icon" onClick={handleAddComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => handleAddBranch(selectedNode)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Branch
                </Button>
              </div>
            </CardContent>
          </Card>
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
