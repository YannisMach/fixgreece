'use client'

import React from "react"
import { useState, useRef, useCallback, useEffect } from 'react'
import { MindMap, Node as NodeType } from '@/lib/types'
import { MindMapNode } from './node'
import { NodePanel } from './node-panel'
import { createNode } from '@/lib/actions/mindmap'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Maximize2, Hand, MousePointer2 } from 'lucide-react'

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

export function MindMapCanvas({ mindMap, initialNodes, canEdit, currentUserId }: MindMapCanvasProps) {
  const [nodes, setNodes] = useState<NodeType[]>(initialNodes)
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null)
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState<Position>({ x: 0, y: 0 })
  const [tool, setTool] = useState<'select' | 'pan'>('select')
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Build tree structure for rendering connections
  const buildTree = useCallback(() => {
    const nodeMap = new Map<string, NodeType>()
    nodes.forEach(node => nodeMap.set(node.id, node))
    
    const connections: { from: NodeType; to: NodeType }[] = []
    nodes.forEach(node => {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        connections.push({
          from: nodeMap.get(node.parent_id)!,
          to: node,
        })
      }
    })
    
    return connections
  }, [nodes])
  
  const connections = buildTree()
  
  // Handle wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(z => Math.min(Math.max(z * delta, 0.25), 2))
    }
    
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])
  
  // Handle panning
  function handleMouseDown(e: React.MouseEvent) {
    if (tool === 'pan' || e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      if (tool === 'select') {
        setSelectedNode(null)
      }
    }
  }
  
  function handleMouseMove(e: React.MouseEvent) {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      })
    }
  }
  
  function handleMouseUp() {
    setIsPanning(false)
  }
  
  // Handle double-click to create node
  async function handleDoubleClick(e: React.MouseEvent, parentNode?: NodeType) {
    if (!canEdit || tool === 'pan') return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom
    
    const formData = new FormData()
    formData.set('mindMapId', mindMap.id)
    formData.set('parentId', parentNode?.id || nodes.find(n => !n.parent_id)?.id || '')
    formData.set('content', 'New idea')
    formData.set('positionX', x.toString())
    formData.set('positionY', y.toString())
    formData.set('color', getRandomColor())
    
    const result = await createNode(formData)
    
    if (result.success && result.node) {
      setNodes(prev => [...prev, { ...result.node, vote_count: 0, user_vote: 0, comments_count: 0 }])
    }
  }
  
  function handleNodeSelect(node: NodeType) {
    if (tool === 'select') {
      setSelectedNode(node)
    }
  }
  
  function handleNodeUpdate(updatedNode: NodeType) {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n))
    if (selectedNode?.id === updatedNode.id) {
      setSelectedNode(updatedNode)
    }
  }
  
  function handleNodeDelete(nodeId: string) {
    setNodes(prev => prev.filter(n => n.id !== nodeId && n.parent_id !== nodeId))
    setSelectedNode(null)
  }
  
  function handleAddBranch(parentNode: NodeType) {
    const angle = Math.random() * Math.PI * 2
    const distance = 150
    const x = parentNode.position_x + Math.cos(angle) * distance
    const y = parentNode.position_y + Math.sin(angle) * distance
    
    const formData = new FormData()
    formData.set('mindMapId', mindMap.id)
    formData.set('parentId', parentNode.id)
    formData.set('content', 'New branch')
    formData.set('positionX', x.toString())
    formData.set('positionY', y.toString())
    formData.set('color', getRandomColor())
    
    createNode(formData).then(result => {
      if (result.success && result.node) {
        setNodes(prev => [...prev, { ...result.node, vote_count: 0, user_vote: 0, comments_count: 0 }])
      }
    })
  }
  
  function resetView() {
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }
  
  return (
    <div className="relative flex-1 overflow-hidden bg-[#fafafa]">
      <div
        ref={canvasRef}
        className={`canvas-bg absolute inset-0 ${
          tool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={(e) => handleDoubleClick(e)}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {connections.map(({ from, to }) => (
              <line
                key={`${from.id}-${to.id}`}
                x1={from.position_x}
                y1={from.position_y}
                x2={to.position_x}
                y2={to.position_y}
                stroke="#d4d4d4"
                strokeWidth={2}
              />
            ))}
          </g>
        </svg>
        
        <div
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
              onSelect={() => handleNodeSelect(node)}
              onDoubleClick={(e) => handleDoubleClick(e, node)}
              canEdit={canEdit}
            />
          ))}
        </div>
      </div>
      
      {/* Floating toolbar - Miro style */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg">
          <Button
            variant={tool === 'select' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-9 w-9 rounded-lg p-0"
            onClick={() => setTool('select')}
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'pan' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-9 w-9 rounded-lg p-0"
            onClick={() => setTool('pan')}
          >
            <Hand className="h-4 w-4" />
          </Button>
          
          <div className="mx-1 h-6 w-px bg-border" />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-lg p-0"
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.25))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-sm font-medium text-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-lg p-0"
            onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <div className="mx-1 h-6 w-px bg-border" />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-lg p-0"
            onClick={resetView}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Help hint */}
      {canEdit && (
        <div className="absolute bottom-6 right-6 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
          Double-click to add a branch
        </div>
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
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
