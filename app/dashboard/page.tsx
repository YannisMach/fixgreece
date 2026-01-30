import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MindMapCard } from '@/components/mindmap-card'
import { CreateMindMapDialog } from '@/components/create-mindmap-dialog'
import { MindMap, Profile } from '@/lib/types'
import { Plus, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: mindMaps } = await supabase
    .from('mind_maps')
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              My Mind Maps
            </h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage your problem-solving maps
            </p>
          </div>
          <CreateMindMapDialog />
        </div>
        
        {mindMaps && mindMaps.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Create new card */}
            <CreateMindMapDialog 
              trigger={
                <button className="group flex h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 transition-all hover:border-primary/50 hover:bg-primary/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    New mind map
                  </span>
                </button>
              }
            />
            
            {mindMaps.map((mindMap) => (
              <MindMapCard 
                key={mindMap.id} 
                mindMap={mindMap as MindMap & { profiles: Profile }} 
                isOwner 
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">
              Start your first mind map
            </h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Create a mind map to start organizing ideas and collaborating with others on solutions.
            </p>
            <div className="mt-8">
              <CreateMindMapDialog />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
