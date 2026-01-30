'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DataExportRequest, AccountDeletionRequest } from '@/lib/types'
import crypto from 'crypto'

// Request data export (GDPR)
export async function requestDataExport(): Promise<DataExportRequest | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Check for existing pending request
  const { data: existing } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .single()
  
  if (existing) {
    return existing // Already has a pending request
  }
  
  const { data, error } = await supabase
    .from('data_export_requests')
    .insert({
      user_id: user.id,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error requesting data export:', error)
    return null
  }
  
  revalidatePath('/settings')
  return data
}

// Get user's data export requests
export async function getDataExportRequests(): Promise<DataExportRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching data export requests:', error)
    return []
  }
  
  return data || []
}

// Request account deletion (GDPR)
export async function requestAccountDeletion(reason?: string): Promise<AccountDeletionRequest | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Check for existing pending request
  const { data: existing } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .single()
  
  if (existing) {
    return existing // Already has a pending request
  }
  
  // Generate confirmation token
  const confirmationToken = crypto.randomBytes(32).toString('hex')
  
  const { data, error } = await supabase
    .from('account_deletion_requests')
    .insert({
      user_id: user.id,
      reason: reason || null,
      status: 'pending',
      confirmation_token: confirmationToken
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error requesting account deletion:', error)
    return null
  }
  
  // TODO: Send confirmation email with token
  
  revalidatePath('/settings')
  return data
}

// Confirm account deletion
export async function confirmAccountDeletion(token: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  // Find the request with matching token
  const { data: request } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('confirmation_token', token)
    .eq('status', 'pending')
    .single()
  
  if (!request) {
    return false
  }
  
  // Set scheduled deletion date (30 days from now)
  const scheduledDate = new Date()
  scheduledDate.setDate(scheduledDate.getDate() + 30)
  
  const { error } = await supabase
    .from('account_deletion_requests')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      scheduled_deletion_at: scheduledDate.toISOString()
    })
    .eq('id', request.id)
  
  if (error) {
    console.error('Error confirming account deletion:', error)
    return false
  }
  
  revalidatePath('/settings')
  return true
}

// Cancel account deletion
export async function cancelAccountDeletion(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { error } = await supabase
    .from('account_deletion_requests')
    .update({
      status: 'cancelled'
    })
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed'])
  
  if (error) {
    console.error('Error canceling account deletion:', error)
    return false
  }
  
  revalidatePath('/settings')
  return true
}

// Get current deletion request
export async function getAccountDeletionRequest(): Promise<AccountDeletionRequest | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .order('requested_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

// Generate user data export (admin function or background job)
export async function generateDataExport(requestId: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Get the request
  const { data: request } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  
  if (!request) return false
  
  // Update status to processing
  await supabase
    .from('data_export_requests')
    .update({ status: 'processing' })
    .eq('id', requestId)
  
  try {
    // Fetch all user data
    const userId = request.user_id
    
    const [profile, mindMaps, nodes, votes, comments, saves] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('mind_maps').select('*').eq('user_id', userId),
      supabase.from('nodes').select('*').eq('user_id', userId),
      supabase.from('votes').select('*').eq('user_id', userId),
      supabase.from('comments').select('*').eq('user_id', userId),
      supabase.from('saves').select('*').eq('user_id', userId)
    ])
    
    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      mind_maps: mindMaps.data,
      nodes: nodes.data,
      votes: votes.data,
      comments: comments.data,
      saves: saves.data
    }
    
    // In a real implementation, you would:
    // 1. Create a JSON file with this data
    // 2. Upload it to secure storage (e.g., Supabase Storage)
    // 3. Set an expiration date
    // 4. Update the request with the file URL
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days to download
    
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        // file_url would be set here in production
      })
      .eq('id', requestId)
    
    return true
  } catch (error) {
    console.error('Error generating data export:', error)
    
    await supabase
      .from('data_export_requests')
      .update({ status: 'failed' })
      .eq('id', requestId)
    
    return false
  }
}
