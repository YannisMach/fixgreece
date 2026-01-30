import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getReceivedInvites, getSentInvites } from '@/lib/actions/invites'
import { InvitesList } from '@/components/invites/invites-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Send } from 'lucide-react'

export default async function InvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const [received, sent] = await Promise.all([
    getReceivedInvites(),
    getSentInvites()
  ])
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Invitations</h1>
              <p className="text-sm text-muted-foreground">
                Collaborate on ideas with other users
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Tabs defaultValue="received">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="received" className="gap-2">
              <Mail className="h-4 w-4" />
              Received
              {received.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {received.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="received">
            <InvitesList invites={received} type="received" />
          </TabsContent>
          
          <TabsContent value="sent">
            <InvitesList invites={sent} type="sent" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
