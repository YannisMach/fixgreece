'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMindMap(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const categoryId = formData.get('categoryId') as string | null
  const status = (formData.get('status') as string) || 'public'
  
  const { data, error } = await supabase
    .from('mind_maps')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      is_public: status === 'public',
      status: status,
      category_id: categoryId || null,
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  // Create the root node
  const { error: nodeError } = await supabase
    .from('nodes')
    .insert({
      mind_map_id: data.id,
      parent_id: null,
      content: title,
      position_x: 400,
      position_y: 300,
      color: '#4F46E5',
      user_id: user.id,
      status: status,
    })
  
  if (nodeError) {
    return { error: nodeError.message }
  }
  
  revalidatePath('/dashboard')
  return { success: true, id: data.id }
}

export async function getMindMaps() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  // Get public maps and user's own maps (including drafts and private)
  const { data } = await supabase
    .from('mind_maps')
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .or(`status.eq.public,user_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })
  
  return data || []
}

export async function getMindMap(id: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('mind_maps')
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .eq('id', id)
    .single()
  
  return data
}

export async function getNodes(mindMapId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: nodes } = await supabase
    .from('nodes')
    .select(`
      *,
      profiles(id, first_name, last_name, nickname, display_name_format)
    `)
    .eq('mind_map_id', mindMapId)
    .order('created_at', { ascending: true })
  
  if (!nodes) return []
  
  // Get vote counts and user votes
  const nodeIds = nodes.map(n => n.id)
  
  const { data: votes } = await supabase
    .from('votes')
    .select('node_id, vote_type, user_id')
    .in('node_id', nodeIds)
  
  const { data: comments } = await supabase
    .from('comments')
    .select('node_id')
    .in('node_id', nodeIds)
  
  return nodes.map(node => {
    const nodeVotes = votes?.filter(v => v.node_id === node.id) || []
    const voteCount = nodeVotes.reduce((sum, v) => sum + v.vote_type, 0)
    const userVote = user ? nodeVotes.find(v => v.user_id === user.id)?.vote_type || 0 : 0
    const commentsCount = comments?.filter(c => c.node_id === node.id).length || 0
    
    return {
      ...node,
      vote_count: voteCount,
      user_vote: userVote,
      comments_count: commentsCount,
    }
  })
}

export async function createNode(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const mindMapId = formData.get('mindMapId') as string
  const parentId = formData.get('parentId') as string | null
  const content = formData.get('content') as string
  const positionX = parseFloat(formData.get('positionX') as string)
  const positionY = parseFloat(formData.get('positionY') as string)
  const color = formData.get('color') as string || null
  const status = (formData.get('status') as string) || 'public'
  
  const { data, error } = await supabase
    .from('nodes')
    .insert({
      mind_map_id: mindMapId,
      parent_id: parentId || null,
      content,
      position_x: positionX,
      position_y: positionY,
      color,
      user_id: user.id,
      status: status,
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  // Update mind map timestamp
  await supabase
    .from('mind_maps')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', mindMapId)
  
  revalidatePath(`/mindmap/${mindMapId}`)
  return { success: true, node: data }
}

export async function updateNode(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const nodeId = formData.get('nodeId') as string
  const content = formData.get('content') as string
  const description = formData.get('description') as string | null
  const positionX = formData.get('positionX') ? parseFloat(formData.get('positionX') as string) : undefined
  const positionY = formData.get('positionY') ? parseFloat(formData.get('positionY') as string) : undefined
  const color = formData.get('color') as string | null
  const status = formData.get('status') as string | null
  
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  
  // Only update content if it's a non-empty string (content column is NOT NULL)
  if (content && content.trim()) updates.content = content.trim()
  if (description !== null) updates.description = description || null
  if (positionX !== undefined && !isNaN(positionX)) updates.position_x = positionX
  if (positionY !== undefined && !isNaN(positionY)) updates.position_y = positionY
  if (color) updates.color = color
  if (status) updates.status = status
  
  const { error } = await supabase
    .from('nodes')
    .update(updates)
    .eq('id', nodeId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function deleteNode(nodeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', nodeId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function vote(nodeId: string, value: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('node_id', nodeId)
    .eq('user_id', user.id)
    .single()
  
  if (existingVote) {
    if (existingVote.vote_type === value) {
      // Remove vote if same value
      await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)
    } else {
      // Update vote
      await supabase
        .from('votes')
        .update({ vote_type: value })
        .eq('id', existingVote.id)
    }
  } else {
    // Create new vote
    await supabase
      .from('votes')
      .insert({
        node_id: nodeId,
        user_id: user.id,
        vote_type: value,
      })
  }
  
  return { success: true }
}

export async function getComments(nodeId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('comments')
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .eq('node_id', nodeId)
    .order('created_at', { ascending: true })
  
  return data || []
}

export async function createComment(nodeId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      node_id: nodeId,
      user_id: user.id,
      content,
    })
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true, comment: data }
}

export async function deleteMindMap(mindMapId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // First delete all related data (nodes, votes, comments will cascade)
  const { error } = await supabase
    .from('mind_maps')
    .delete()
    .eq('id', mindMapId)
    .eq('user_id', user.id) // Ensure only owner can delete
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateMindMapDescription(mindMapId: string, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('mind_maps')
    .update({ 
      description: description || null,
      updated_at: new Date().toISOString() 
    })
    .eq('id', mindMapId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/mindmap/${mindMapId}`)
  return { success: true }
}

export async function updateMindMapStatus(mindMapId: string, status: 'draft' | 'public' | 'private') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('mind_maps')
    .update({ 
      status: status,
      is_public: status === 'public',
      updated_at: new Date().toISOString() 
    })
    .eq('id', mindMapId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/mindmap/${mindMapId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateNodeStatus(nodeId: string, status: 'draft' | 'public' | 'private') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('nodes')
    .update({ 
      status: status,
      updated_at: new Date().toISOString() 
    })
    .eq('id', nodeId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function createReport(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const nodeId = formData.get('nodeId') as string | null
  const commentId = formData.get('commentId') as string | null
  const reason = formData.get('reason') as string
  
  const { error } = await supabase
    .from('reports')
    .insert({
      node_id: nodeId || null,
      user_id: user.id,
      reason,
      details: commentId || null,
    })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}
