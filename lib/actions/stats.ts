'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import type { MindMapStats, NodeStats, ChangeLog } from '@/lib/types'

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.SUPABASE_URL).digest('hex').slice(0, 16)
}

// Track view for mind map
export async function trackMindMapView(mindMapId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ipHash = hashIP(ip)
  
  // Check if already viewed recently (within 1 hour)
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)
  
  const { data: recentView } = await supabase
    .from('views')
    .select('id')
    .eq('mind_map_id', mindMapId)
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo.toISOString())
    .limit(1)
    .single()
  
  if (recentView) {
    return // Already tracked recently
  }
  
  await supabase
    .from('views')
    .insert({
      mind_map_id: mindMapId,
      user_id: user?.id || null,
      ip_hash: ipHash
    })
}

// Track view for node
export async function trackNodeView(nodeId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ipHash = hashIP(ip)
  
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)
  
  const { data: recentView } = await supabase
    .from('views')
    .select('id')
    .eq('node_id', nodeId)
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo.toISOString())
    .limit(1)
    .single()
  
  if (recentView) {
    return
  }
  
  await supabase
    .from('views')
    .insert({
      node_id: nodeId,
      user_id: user?.id || null,
      ip_hash: ipHash
    })
}

// Get mind map statistics
export async function getMindMapStats(mindMapId: string): Promise<MindMapStats> {
  const supabase = await createClient()
  
  // Get view counts
  const { count: views } = await supabase
    .from('views')
    .select('*', { count: 'exact', head: true })
    .eq('mind_map_id', mindMapId)
  
  // Get unique viewers
  const { data: uniqueViewers } = await supabase
    .from('views')
    .select('ip_hash')
    .eq('mind_map_id', mindMapId)
  
  const uniqueViewerCount = new Set(uniqueViewers?.map(v => v.ip_hash)).size
  
  // Get node count
  const { count: nodes } = await supabase
    .from('nodes')
    .select('*', { count: 'exact', head: true })
    .eq('mind_map_id', mindMapId)
  
  // Get all node IDs for this mind map
  const { data: nodeIds } = await supabase
    .from('nodes')
    .select('id')
    .eq('mind_map_id', mindMapId)
  
  const ids = nodeIds?.map(n => n.id) || []
  
  if (ids.length === 0) {
    return {
      views: views || 0,
      unique_viewers: uniqueViewerCount,
      total_votes: 0,
      upvotes: 0,
      downvotes: 0,
      comments: 0,
      saves: 0,
      nodes: nodes || 0
    }
  }
  
  // Get vote counts
  const { data: votes } = await supabase
    .from('votes')
    .select('vote_type')
    .in('node_id', ids)
  
  const upvotes = votes?.filter(v => v.vote_type === 1).length || 0
  const downvotes = votes?.filter(v => v.vote_type === -1).length || 0
  
  // Get comment count
  const { count: comments } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .in('node_id', ids)
  
  // Get save count
  const { count: saves } = await supabase
    .from('saves')
    .select('*', { count: 'exact', head: true })
    .eq('mind_map_id', mindMapId)
  
  return {
    views: views || 0,
    unique_viewers: uniqueViewerCount,
    total_votes: upvotes + downvotes,
    upvotes,
    downvotes,
    comments: comments || 0,
    saves: saves || 0,
    nodes: nodes || 0
  }
}

// Get node statistics
export async function getNodeStats(nodeId: string): Promise<NodeStats> {
  const supabase = await createClient()
  
  // Get view count
  const { count: views } = await supabase
    .from('views')
    .select('*', { count: 'exact', head: true })
    .eq('node_id', nodeId)
  
  // Get vote counts
  const { data: votes } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('node_id', nodeId)
  
  const upvotes = votes?.filter(v => v.vote_type === 1).length || 0
  const downvotes = votes?.filter(v => v.vote_type === -1).length || 0
  
  // Get comment count
  const { count: comments } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('node_id', nodeId)
  
  // Get save count
  const { count: saves } = await supabase
    .from('saves')
    .select('*', { count: 'exact', head: true })
    .eq('node_id', nodeId)
  
  // Get children count
  const { count: children } = await supabase
    .from('nodes')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', nodeId)
  
  return {
    views: views || 0,
    votes: upvotes + downvotes,
    upvotes,
    downvotes,
    comments: comments || 0,
    saves: saves || 0,
    children: children || 0
  }
}

// Log a change (for admin transparency)
export async function logChange(
  entityType: 'profile' | 'mind_map' | 'node' | 'comment',
  entityId: string,
  fieldChanged: string,
  oldValue: string | null,
  newValue: string | null,
  changeReason?: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return
  
  await supabase
    .from('change_logs')
    .insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      field_changed: fieldChanged,
      old_value: oldValue,
      new_value: newValue,
      change_reason: changeReason || null
    })
}

// Get change logs for entity (admin only)
export async function getChangeLogs(
  entityType?: string,
  entityId?: string,
  userId?: string,
  limit = 50
): Promise<ChangeLog[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') return []
  
  let query = supabase
    .from('change_logs')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (entityType) {
    query = query.eq('entity_type', entityType)
  }
  if (entityId) {
    query = query.eq('entity_id', entityId)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching change logs:', error)
    return []
  }
  
  return data || []
}
