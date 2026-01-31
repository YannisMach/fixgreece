'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { MindMap, Node as NodeType, ContentStatus } from '@/lib/types'
import { MindMapNode } from './node'
import { NodePanel } from './node-panel'
import { Minimap } from './minimap'
import { createNode, updateNode } from '@/lib/actions/mindmap'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Hand, 
  MousePointer2,
  Undo2,
  Redo2,
  ZoomIn,
  Grid3X3,
  Layers,
  Share2,
  Download,
  Settings2,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MindMapCanvasProps {
  mindMap: MindMap
  initialNodes: NodeType[]
  canEdit: boolean
  currentUserId?: string
}

interface Position {
  x: number
  y: number
}

interface HistoryState {
  nodes: NodeType[]
}

const GRID_SIZE = 20
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

export function MindMapCanvas({ mindMap, initialNodes, canEdit, currentUserId }: MindMapCanvasProps) {
  const [nodes, setNodes] = useState<NodeType[]>(initialNodes)
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null)
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState<Position>({ x: 0, y: 0 })
  const [tool, setTool] = useState<'select' | 'pan'>('select')
  const [showMinimap, setShowMinimap] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Calculate canvas bounds for minimap
  const canvasBounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 800, minY: 0, maxY: 600 }
    
    const padding = 100
    const xs = nodes.map(n => n.position_x)
    const ys = nodes.map(n => n.position_y)
    
    return {
      minX: Math.min(...xs) - padding,
      maxX: Math.max(...xs) + padding,
      minY: Math.min(...ys) - padding,
      maxY: Math.max(...ys) + padding,
    }
  }, [nodes])
  
  // Build connections
  const connections = useMemo(() => {
    const nodeMap = new Map<string, NodeType>()
    nodes.forEach(node => nodeMap.set(node.id, node))
    
    const conns: { from: NodeType; to: NodeType }[] = []
    nodes.forEach(node => {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        conns.push({
          from: nodeMap.get(node.parent_id)!,
          to: node,
        })
      }
    })
    
    return conns
  }, [nodes])
  
  // Save to history
  const saveToHistory = useCallback((newNodes: NodeType[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ nodes: newNodes })
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])
  
  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setNodes(history[historyIndex - 1].nodes)
    }
  }, [history, historyIndex])
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setNodes(history[historyIndex + 1].nodes)
    }
  }, [history, historyIndex])
  
  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Prevent when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }
      
      // Tool shortcuts
      if (e.key === 'v' || e.key === '1') {
        e.preventDefault()
        setTool('select')
      }
      if (e.key === 'h' || e.key === '2') {
        e.preventDefault()
        setTool('pan')
      }
      
      // Zoom shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault()
        setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM))
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
      
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      
      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault()
        // Handle delete through node panel
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNode(null)
        setSelectedNodes(new Set())
      }
      
      // Toggle grid
      if (e.key === 'g' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowGrid(prev => !prev)
      }
      
      // Help
      if (e.key === '?') {
        setShowHelp(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, undo, redo])
  
  // Handle wheel zoom with smooth animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      
      const rect = canvas!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Zoom towards mouse position
      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05
      const newZoom = Math.min(Math.max(zoom * zoomFactor, MIN_ZOOM), MAX_ZOOM)
      
      if (newZoom !== zoom) {
        const scale = newZoom / zoom
        const newPanX = mouseX - (mouseX - pan.x) * scale
        const newPanY = mouseY - (mouseY - pan.y) * scale
        
        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })
      }
    }
    
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [zoom, pan])
  
  // Handle panning
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button === 1 || (e.button === 0 && (tool === 'pan' || e.shiftKey))) {
      // Middle mouse button or pan tool or shift+click
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      e.preventDefault()
    } else if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      // Clicked on empty canvas
      if (tool === 'select') {
        setSelectedNode(null)
        setSelectedNodes(new Set())
      }
    }
  }
  
  function handleMouseMove(e: React.MouseEvent) {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      })
    } else if (draggingNode && canEdit) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      let x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
      let y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y
      
      // Snap to grid
      if (snapToGrid) {
        x = Math.round(x / GRID_SIZE) * GRID_SIZE
        y = Math.round(y / GRID_SIZE) * GRID_SIZE
      }
      
      setNodes(prev => prev.map(n => 
        n.id === draggingNode ? { ...n, position_x: x, position_y: y } : n
      ))
    }
  }
  
  function handleMouseUp() {
    if (draggingNode) {
      // Save position to database
      const node = nodes.find(n => n.id === draggingNode)
      if (node) {
        const formData = new FormData()
        formData.set('nodeId', node.id)
        formData.set('positionX', node.position_x.toString())
        formData.set('positionY', node.position_y.toString())
        updateNode(formData)
        saveToHistory(nodes)
      }
    }
    setIsPanning(false)
    setDraggingNode(null)
  }
  
  // Handle node drag start
  function handleNodeDragStart(nodeId: string, e: React.MouseEvent) {
    if (!canEdit || tool !== 'select') return
    
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom
    
    setDraggingNode(nodeId)
    setDragOffset({
      x: x - node.position_x,
      y: y - node.position_y,
    })
  }
  
  // Handle double-click to create node
  async function handleDoubleClick(e: React.MouseEvent, parentNode?: NodeType) {
    if (!canEdit || tool === 'pan') return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    let x = (e.clientX - rect.left - pan.x) / zoom
    let y = (e.clientY - rect.top - pan.y) / zoom
    
    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE
      y = Math.round(y / GRID_SIZE) * GRID_SIZE
    }
    
    const formData = new FormData()
    formData.set('mindMapId', mindMap.id)
    formData.set('parentId', parentNode?.id || nodes.find(n => !n.parent_id)?.id || '')
    formData.set('content', 'New idea')
    formData.set('positionX', x.toString())
    formData.set('positionY', y.toString())
    formData.set('color', getRandomColor())
    formData.set('status', 'public')
    
    const result = await createNode(formData)
    
    if (result.success && result.node) {
      const newNode = { ...result.node, vote_count: 0, user_vote: 0, comments_count: 0 }
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      saveToHistory(newNodes)
      setSelectedNode(newNode)
    }
  }
  
  // Quick add branch from node
  async function handleQuickAddBranch(parentNode: NodeType, direction: 'left' | 'right' | 'up' | 'down') {
    if (!canEdit) return
    
    const offset = 150
    let x = parentNode.position_x
    let y = parentNode.position_y
    
    switch (direction) {
      case 'left': x -= offset; break
      case 'right': x += offset; break
      case 'up': y -= offset; break
      case 'down': y += offset; break
    }
    
    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE
      y = Math.round(y / GRID_SIZE) * GRID_SIZE
    }
    
    const formData = new FormData()
    formData.set('mindMapId', mindMap.id)
    formData.set('parentId', parentNode.id)
    formData.set('content', 'New branch')
    formData.set('positionX', x.toString())
    formData.set('positionY', y.toString())
    formData.set('color', getRandomColor())
    formData.set('status', 'public')
    
    const result = await createNode(formData)
    
    if (result.success && result.node) {
      const newNode = { ...result.node, vote_count: 0, user_vote: 0, comments_count: 0 }
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      saveToHistory(newNodes)
      setSelectedNode(newNode)
    }
  }
  
  function handleNodeSelect(node: NodeType) {
    if (tool === 'select') {
      setSelectedNode(node)
    }
  }
  
  function handleNodeUpdate(updatedNode: NodeType) {
    const newNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    setNodes(newNodes)
    if (selectedNode?.id === updatedNode.id) {
      setSelectedNode(updatedNode)
    }
  }
  
  function handleNodeDelete(nodeId: string) {
    const newNodes = nodes.filter(n => n.id !== nodeId && n.parent_id !== nodeId)
    setNodes(newNodes)
    saveToHistory(newNodes)
    setSelectedNode(null)
  }
  
  function handleAddBranch(parentNode: NodeType) {
    handleQuickAddBranch(parentNode, 'right')
  }
  
  function resetView() {
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }
  
  function fitToContent() {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return
    
    const rect = canvas.getBoundingClientRect()
    const { minX, maxX, minY, maxY } = canvasBounds
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    const scaleX = (rect.width - 100) / contentWidth
    const scaleY = (rect.height - 100) / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 1)
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    setZoom(newZoom)
    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom,
    })
  }
  
  // Generate curved path for connection
  function getConnectionPath(from: NodeType, to: NodeType): string {
    const dx = to.position_x - from.position_x
    const dy = to.position_y - from.position_y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Calculate control point offset
    const curvature = Math.min(distance * 0.3, 100)
    
    // Determine curve direction based on relative position
    const midX = (from.position_x + to.position_x) / 2
    const midY = (from.position_y + to.position_y) / 2
    
    // Control point perpendicular to the line
    const controlX = midX
    const controlY = midY - curvature * (Math.abs(dx) > Math.abs(dy) ? 1 : 0.3)
    
    return `M ${from.position_x} ${from.position_y} Q ${controlX} ${controlY} ${to.position_x} ${to.position_y}`
  }
  
  return (
    <TooltipProvider>
      <div className="relative flex-1 overflow-hidden bg-[#f8fafc]">
        {/* Main canvas */}
        <div
          ref={canvasRef}
          className={cn(
            'canvas-bg absolute inset-0 transition-[background-size] duration-200',
            (tool === 'pan' || isPanning) && 'cursor-grab',
            isPanning && 'cursor-grabbing'
          )}
          style={{
            backgroundImage: showGrid 
              ? 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)'
              : 'none',
            backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={(e) => handleDoubleClick(e)}
        >
          {/* SVG Connections */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {connections.map(({ from, to }) => (
                <g key={`${from.id}-${to.id}`}>
                  {/* Shadow */}
                  <path
                    d={getConnectionPath(from, to)}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                  {/* Main line */}
                  <path
                    d={getConnectionPath(from, to)}
                    fill="none"
                    stroke={to.color || '#94a3b8'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="transition-colors"
                  />
                </g>
              ))}
            </g>
          </svg>
          
          {/* Nodes */}
          <div
            ref={contentRef}
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {nodes.map((node) => (
              <MindMapNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isDragging={draggingNode === node.id}
                onSelect={() => handleNodeSelect(node)}
                onDragStart={(e) => handleNodeDragStart(node.id, e)}
                onDoubleClick={(e) => handleDoubleClick(e, node)}
                onQuickAdd={(dir) => handleQuickAddBranch(node, dir)}
                canEdit={canEdit}
                showQuickAdd={selectedNode?.id === node.id && canEdit}
              />
            ))}
          </div>
        </div>
        
        {/* Left toolbar - Miro style */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === 'select' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={() => setTool('select')}
                >
                  <MousePointer2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Select (V)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === 'pan' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={() => setTool('pan')}
                >
                  <Hand className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Pan (H)</TooltipContent>
            </Tooltip>
            
            <div className="my-1 h-px bg-border" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Undo (Cmd+Z)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Redo (Cmd+Shift+Z)</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Bottom toolbar - Zoom controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={() => setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out (Cmd+-)</TooltipContent>
            </Tooltip>
            
            <button 
              className="flex h-9 w-16 items-center justify-center rounded-lg text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={resetView}
            >
              {Math.round(zoom * 100)}%
            </button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={() => setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in (Cmd++)</TooltipContent>
            </Tooltip>
            
            <div className="mx-1 h-6 w-px bg-border" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={fitToContent}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to content</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle grid (Cmd+G)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showMinimap ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-9 w-9 rounded-lg p-0"
                  onClick={() => setShowMinimap(!showMinimap)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle minimap</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Right side - Help & Settings */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg bg-card p-0 shadow-sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>
        </div>
        
        {/* Help panel */}
        {showHelp && (
          <div className="absolute bottom-20 right-6 w-72 rounded-xl border border-border bg-card p-4 shadow-xl">
            <h3 className="mb-3 font-semibold text-foreground">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Select tool</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">V</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pan tool</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">H</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zoom in</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Cmd +</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zoom out</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Cmd -</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reset view</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Cmd 0</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Undo</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Cmd Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redo</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Cmd Shift Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle grid</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Cmd G</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deselect</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Esc</kbd>
              </div>
            </div>
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Double-click to add branch. Drag nodes to reposition.
            </div>
          </div>
        )}
        
        {/* Minimap */}
        {showMinimap && (
          <Minimap
            nodes={nodes}
            bounds={canvasBounds}
            viewport={{
              x: -pan.x / zoom,
              y: -pan.y / zoom,
              width: (canvasRef.current?.clientWidth || 800) / zoom,
              height: (canvasRef.current?.clientHeight || 600) / zoom,
            }}
            onViewportChange={(x, y) => {
              const canvas = canvasRef.current
              if (!canvas) return
              setPan({
                x: -x * zoom + canvas.clientWidth / 2,
                y: -y * zoom + canvas.clientHeight / 2,
              })
            }}
          />
        )}
        
        {/* Node panel */}
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            canEdit={canEdit}
            currentUserId={currentUserId}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            onAddBranch={handleAddBranch}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

function getRandomColor(): string {
  const colors = [
    '#6366F1', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
