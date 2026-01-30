'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Category, Tag } from '@/lib/types'

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*, children:categories!parent_id(*)')
    .is('parent_id', null)
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  return data || []
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

// Get popular tags
export async function getPopularTags(limit = 20): Promise<Tag[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }
  
  return data || []
}

// Search tags
export async function searchTags(query: string): Promise<Tag[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error searching tags:', error)
    return []
  }
  
  return data || []
}

// Create or get tag
export async function getOrCreateTag(name: string): Promise<Tag | null> {
  const supabase = await createClient()
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  // Try to get existing tag
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (existing) {
    return existing
  }
  
  // Create new tag
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, slug })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating tag:', error)
    return null
  }
  
  return data
}

// Add tags to mind map
export async function addTagsToMindMap(mindMapId: string, tagNames: string[]): Promise<void> {
  const supabase = await createClient()
  
  for (const name of tagNames) {
    const tag = await getOrCreateTag(name)
    if (tag) {
      await supabase
        .from('mind_map_tags')
        .upsert({ mind_map_id: mindMapId, tag_id: tag.id })
      
      // Increment usage count
      await supabase.rpc('increment_tag_usage', { tag_id: tag.id })
    }
  }
  
  revalidatePath('/dashboard')
  revalidatePath('/explore')
}

// Remove tag from mind map
export async function removeTagFromMindMap(mindMapId: string, tagId: string): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('mind_map_tags')
    .delete()
    .eq('mind_map_id', mindMapId)
    .eq('tag_id', tagId)
  
  // Decrement usage count
  await supabase.rpc('decrement_tag_usage', { tag_id: tagId })
  
  revalidatePath('/dashboard')
}

// Get tags for mind map
export async function getMindMapTags(mindMapId: string): Promise<Tag[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mind_map_tags')
    .select('tags(*)')
    .eq('mind_map_id', mindMapId)
  
  if (error) {
    console.error('Error fetching mind map tags:', error)
    return []
  }
  
  return data?.map(d => d.tags).filter(Boolean) as Tag[] || []
}

// Add tags to node
export async function addTagsToNode(nodeId: string, tagNames: string[]): Promise<void> {
  const supabase = await createClient()
  
  for (const name of tagNames) {
    const tag = await getOrCreateTag(name)
    if (tag) {
      await supabase
        .from('node_tags')
        .upsert({ node_id: nodeId, tag_id: tag.id })
      
      await supabase.rpc('increment_tag_usage', { tag_id: tag.id })
    }
  }
}

// Get tags for node
export async function getNodeTags(nodeId: string): Promise<Tag[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('node_tags')
    .select('tags(*)')
    .eq('node_id', nodeId)
  
  if (error) {
    console.error('Error fetching node tags:', error)
    return []
  }
  
  return data?.map(d => d.tags).filter(Boolean) as Tag[] || []
}
