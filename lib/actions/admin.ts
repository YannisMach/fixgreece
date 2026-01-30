'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Check if user is admin or moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return { error: 'Not authorized' }
  }
  
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/admin/reports')
  return { success: true }
}

export async function updateUserRole(userId: string, role: 'admin' | 'moderator' | 'user') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    return { error: 'Not authorized' }
  }
  
  // Cannot change own role
  if (userId === user.id) {
    return { error: 'Cannot change your own role' }
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/admin/users')
  return { success: true }
}
