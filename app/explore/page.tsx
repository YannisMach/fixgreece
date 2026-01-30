import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MindMapCard } from '@/components/mindmap-card'
import { MindMap, Profile } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Clock, Sparkles } from 'lucide-react'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: mindMaps } = await supabase
    .from('mind_maps')
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(50)
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero section */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Explore community solutions
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Discover mind maps created by Greeks working together on real problems
            </p>
            
            <div className="relative mx-auto mt-8 max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mind maps..."
                className="h-12 rounded-full bg-background pl-12 pr-4 text-base"
              />
            </div>
          </div>
        </div>
      </section>
      
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Button variant="secondary" size="sm" className="rounded-full">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Trending
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">
            <Clock className="mr-1.5 h-4 w-4" />
            Recent
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Most voted
          </Button>
        </div>
        
        {mindMaps && mindMaps.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mindMaps.map((mindMap) => (
              <MindMapCard 
                key={mindMap.id} 
                mindMap={mindMap as MindMap & { profiles: Profile }}
                isOwner={user?.id === mindMap.user_id}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">
              No public mind maps yet
            </h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Be the first to share your ideas with the community
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
