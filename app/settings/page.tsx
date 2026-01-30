import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ProfileSettingsForm } from '@/components/profile-settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    redirect('/auth/login')
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile and privacy preferences
        </p>
        
        <div className="mt-8">
          <ProfileSettingsForm profile={profile} />
        </div>
      </main>
    </div>
  )
}
