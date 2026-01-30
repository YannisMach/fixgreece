'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const nickname = formData.get('nickname') as string
  const bio = formData.get('bio') as string
  
  if (!email || !password || !firstName || !lastName || !nickname) {
    return { error: 'All required fields must be filled' }
  }
  
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          nickname: nickname,
          bio: bio || null,
        },
      },
    })
    
    if (error) {
      return { error: error.message }
    }
  } catch (err) {
    console.error('Sign up error:', err)
    return { error: 'Unable to connect to authentication service. Please try again.' }
  }
  
  redirect('/auth/sign-up-success')
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }
  
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return { error: error.message }
    }
  } catch (err) {
    console.error('Sign in error:', err)
    return { error: 'Unable to connect to authentication service. Please try again.' }
  }
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const updates = {
    first_name: formData.get('firstName') as string,
    last_name: formData.get('lastName') as string,
    nickname: formData.get('nickname') as string,
    bio: formData.get('bio') as string || null,
    first_name_public: formData.get('firstNamePublic') === 'true',
    last_name_public: formData.get('lastNamePublic') === 'true',
    nickname_public: formData.get('nicknamePublic') === 'true',
    bio_public: formData.get('bioPublic') === 'true',
    display_name_format: JSON.parse(formData.get('displayNameFormat') as string || '["nickname"]'),
    updated_at: new Date().toISOString(),
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/settings', 'page')
  return { success: true }
}
