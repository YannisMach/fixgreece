'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Invite } from '@/lib/types'

// Get invites for a node
export async function getNodeInvites(nodeId: string): Promise<Invite[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('invites')
    .select(`
      *,
      inviter:profiles!invited_by(*),
      invitee:profiles!invited_user_id(*)
    `)
    .eq('node_id', nodeId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching invites:', error)
    return []
  }
  
  return data || []
}

// Get user's received invites
export async function getReceivedInvites(): Promise<Invite[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('invites')
    .select(`
      *,
      inviter:profiles!invited_by(*),
      nodes(*, mind_maps(*))
    `)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching received invites:', error)
    return []
  }
  
  return data || []
}

// Get user's sent invites
export async function getSentInvites(): Promise<Invite[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('invites')
    .select(`
      *,
      invitee:profiles!invited_user_id(*),
      nodes(*)
    `)
    .eq('invited_by', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching sent invites:', error)
    return []
  }
  
  return data || []
}

// Send invite to user
export async function sendInvite(
  nodeId: string,
  invitedUserId?: string,
  invitedEmail?: string,
  message?: string
): Promise<Invite | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  if (!invitedUserId && !invitedEmail) return null
  
  // Check if invite already exists
  let query = supabase
    .from('invites')
    .select('*')
    .eq('node_id', nodeId)
    .eq('invited_by', user.id)
    .in('status', ['pending', 'accepted'])
  
  if (invitedUserId) {
    query = query.eq('invited_user_id', invitedUserId)
  } else if (invitedEmail) {
    query = query.eq('invited_email', invitedEmail)
  }
  
  const { data: existing } = await query.single()
  
  if (existing) {
    return null // Already invited
  }
  
  const { data, error } = await supabase
    .from('invites')
    .insert({
      node_id: nodeId,
      invited_by: user.id,
      invited_user_id: invitedUserId || null,
      invited_email: invitedEmail || null,
      message: message || null,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error sending invite:', error)
    return null
  }
  
  revalidatePath('/invites')
  return data
}

// Accept invite
export async function acceptInvite(inviteId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('invites')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString()
    })
    .eq('id', inviteId)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error accepting invite:', error)
    return false
  }
  
  revalidatePath('/invites')
  return true
}

// Decline invite
export async function declineInvite(inviteId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('invites')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString()
    })
    .eq('id', inviteId)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error declining invite:', error)
    return false
  }
  
  revalidatePath('/invites')
  return true
}

// Cancel invite (by sender)
export async function cancelInvite(inviteId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('invites')
    .delete()
    .eq('id', inviteId)
    .eq('invited_by', user.id)
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error canceling invite:', error)
    return false
  }
  
  revalidatePath('/invites')
  return true
}

// Search users to invite
export async function searchUsersToInvite(query: string): Promise<{ id: string; display_name: string }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, nickname')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,nickname.ilike.%${query}%`)
    .neq('id', user.id)
    .limit(10)
  
  if (error) {
    console.error('Error searching users:', error)
    return []
  }
  
  return data?.map(p => ({
    id: p.id,
    display_name: p.nickname || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Anonymous'
  })) || []
}

// Get invite count (for notifications)
export async function getPendingInviteCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return 0
  
  const { count, error } = await supabase
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
  
  if (error) {
    return 0
  }
  
  return count || 0
}
