import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ProfileSettingsForm } from '@/components/profile-settings-form'
import { GdprSettings } from '@/components/settings/gdpr-settings'
import { getDataExportRequests, getAccountDeletionRequest } from '@/lib/actions/gdpr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Shield, Bell } from 'lucide-react'

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
  
  const [exportRequests, deletionRequest] = await Promise.all([
    getDataExportRequests(),
    getAccountDeletionRequest()
  ])
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile, privacy, and data
        </p>
        
        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              Privacy & Data
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileSettingsForm profile={profile} />
          </TabsContent>
          
          <TabsContent value="privacy">
            <GdprSettings 
              exportRequests={exportRequests}
              deletionRequest={deletionRequest}
            />
          </TabsContent>
          
          <TabsContent value="notifications">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Notification Preferences
              </h2>
              <p className="mt-2 text-muted-foreground">
                Notification settings coming soon. You will be able to customize 
                email and in-app notifications for invites, comments, and more.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
