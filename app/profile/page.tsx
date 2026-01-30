import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDisplayName } from '@/lib/types'
import { User, Mail, Calendar } from 'lucide-react'

export default async function ProfilePage() {
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
  
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  
  // Get stats
  const { count: mindMapCount } = await supabase
    .from('mind_maps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  const { count: nodeCount } = await supabase
    .from('nodes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {formatDisplayName(profile).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl">{formatDisplayName(profile)}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {joinedDate}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {profile.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.bio && profile.bio_public && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">About</h3>
                <p className="mt-1 text-foreground">{profile.bio}</p>
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-2xl font-bold text-foreground">{mindMapCount || 0}</p>
                <p className="text-sm text-muted-foreground">Mind Maps Created</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-2xl font-bold text-foreground">{nodeCount || 0}</p>
                <p className="text-sm text-muted-foreground">Ideas Contributed</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Profile Details</h3>
              <div className="space-y-2 text-sm">
                {profile.first_name_public && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile.first_name} {profile.last_name_public ? profile.last_name : ''}
                    </span>
                  </div>
                )}
                {profile.nickname_public && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">@</span>
                    <span>{profile.nickname}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email hidden for privacy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
