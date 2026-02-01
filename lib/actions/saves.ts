'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Save, SaveFolder } from '@/lib/types'

// Get user's save folders
export async function getSaveFolders(): Promise<SaveFolder[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('save_folders')
    .select('*, saves(count)')
    .eq('user_id', user.id)
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching save folders:', error)
    return []
  }
  
  return data?.map(f => ({
    ...f,
    save_count: f.saves?.[0]?.count || 0
  })) || []
}

// Create save folder
export async function createSaveFolder(name: string, color?: string): Promise<SaveFolder | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('save_folders')
    .insert({
      user_id: user.id,
      name,
      color: color || null
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating save folder:', error)
    return null
  }
  
  revalidatePath('/saves')
  return data
}

// Update save folder
export async function updateSaveFolder(folderId: string, name: string, color?: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('save_folders')
    .update({ name, color: color || null })
    .eq('id', folderId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error updating save folder:', error)
    return false
  }
  
  revalidatePath('/saves')
  return true
}

// Delete save folder
export async function deleteSaveFolder(folderId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  // First, unassign all saves from this folder
  await supabase
    .from('saves')
    .update({ folder_id: null })
    .eq('folder_id', folderId)
    .eq('user_id', user.id)
  
  const { error } = await supabase
    .from('save_folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting save folder:', error)
    return false
  }
  
  revalidatePath('/saves')
  return true
}

// Get user's saves
export async function getSaves(folderId?: string | null): Promise<Save[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  let query = supabase
    .from('saves')
    .select(`
      *,
      mind_maps(*),
      nodes(*),
      save_folders(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (folderId === null) {
    query = query.is('folder_id', null)
  } else if (folderId) {
    query = query.eq('folder_id', folderId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching saves:', error)
    return []
  }
  
  return data?.map(s => ({
    ...s,
    mind_map: s.mind_maps,
    node: s.nodes,
    folder: s.save_folders
  })) || []
}

// Save/bookmark a mind map
export async function saveMindMap(mindMapId: string, folderId?: string, notes?: string): Promise<Save | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Check if already saved
  const { data: existing } = await supabase
    .from('saves')
    .select('*')
    .eq('user_id', user.id)
    .eq('mind_map_id', mindMapId)
    .single()
  
  if (existing) {
    // Update existing save
    const { data, error } = await supabase
      .from('saves')
      .update({
        folder_id: folderId || null,
        notes: notes || null
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating save:', error)
      return null
    }
    
    revalidatePath('/saves')
    return data
  }
  
  // Create new save
  const { data, error } = await supabase
    .from('saves')
    .insert({
      user_id: user.id,
      mind_map_id: mindMapId,
      folder_id: folderId || null,
      notes: notes || null
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error saving mind map:', error)
    return null
  }
  
  revalidatePath('/saves')
  revalidatePath('/explore')
  return data
}

// Save/bookmark a node
export async function saveNode(nodeId: string, folderId?: string, notes?: string): Promise<Save | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Check if already saved
  const { data: existing } = await supabase
    .from('saves')
    .select('*')
    .eq('user_id', user.id)
    .eq('node_id', nodeId)
    .single()
  
  if (existing) {
    const { data, error } = await supabase
      .from('saves')
      .update({
        folder_id: folderId || null,
        notes: notes || null
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) return null
    
    revalidatePath('/saves')
    return data
  }
  
  const { data, error } = await supabase
    .from('saves')
    .insert({
      user_id: user.id,
      node_id: nodeId,
      folder_id: folderId || null,
      notes: notes || null
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error saving node:', error)
    return null
  }
  
  revalidatePath('/saves')
  return data
}

// Remove save
export async function removeSave(saveId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('saves')
    .delete()
    .eq('id', saveId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error removing save:', error)
    return false
  }
  
  revalidatePath('/saves')
  return true
}

// Unsave mind map
export async function unsaveMindMap(mindMapId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('saves')
    .delete()
    .eq('user_id', user.id)
    .eq('mind_map_id', mindMapId)
  
  if (error) {
    console.error('Error unsaving mind map:', error)
    return false
  }
  
  revalidatePath('/saves')
  revalidatePath('/explore')
  return true
}

// Check if mind map is saved
export async function isMindMapSaved(mindMapId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('mind_map_id', mindMapId)
    .single()
  
  return !!data
}

// Check if node is saved and return save info
export async function getNodeSaveInfo(nodeId: string): Promise<{ isSaved: boolean; saveId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { isSaved: false }
  
  const { data } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('node_id', nodeId)
    .single()
  
  return data ? { isSaved: true, saveId: data.id } : { isSaved: false }
}

// Get all saved node IDs for a user (for batch checking)
export async function getSavedNodeIds(): Promise<Map<string, string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return new Map()
  
  const { data } = await supabase
    .from('saves')
    .select('id, node_id')
    .eq('user_id', user.id)
    .not('node_id', 'is', null)
  
  const map = new Map<string, string>()
  data?.forEach(s => {
    if (s.node_id) map.set(s.node_id, s.id)
  })
  return map
}

// Unsave node
export async function unsaveNode(nodeId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('saves')
    .delete()
    .eq('user_id', user.id)
    .eq('node_id', nodeId)
  
  if (error) {
    console.error('Error unsaving node:', error)
    return false
  }
  
  revalidatePath('/saves')
  return true
}

// Move save to folder
export async function moveSaveToFolder(saveId: string, folderId: string | null): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('saves')
    .update({ folder_id: folderId })
    .eq('id', saveId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error moving save:', error)
    return false
  }
  
  revalidatePath('/saves')
  return true
}
