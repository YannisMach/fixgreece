import React from "react"
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Users, GitBranch, ThumbsUp, MessageSquare, Globe, Zap, Play, TrendingUp, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

async function getTopSubjects() {
  try {
    const supabase = await createClient()
    
    const { data: mindMaps, error } = await supabase
      .from('mind_maps')
      .select(`
        id,
        title,
        description,
        created_at,
        user_id,
        profiles!mind_maps_user_id_fkey (
          first_name,
          last_name,
          nickname,
          display_name_format
        )
      `)
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching top subjects:', error)
      return []
    }
    
    // Get node counts and vote counts for each mind map
    const mindMapIds = mindMaps?.map(m => m.id) || []
    
    if (mindMapIds.length === 0) return []
    
    const { data: nodes } = await supabase
      .from('nodes')
      .select('id, mind_map_id')
      .in('mind_map_id', mindMapIds)
    
    const nodeIds = nodes?.map(n => n.id) || []
    
    let voteCounts: Record<string, number> = {}
    if (nodeIds.length > 0) {
      const { data: votes } = await supabase
        .from('votes')
        .select('node_id, vote_type')
        .in('node_id', nodeIds)
      
      // Calculate total votes per mind map
      nodes?.forEach(node => {
        const nodeVotes = votes?.filter(v => v.node_id === node.id) || []
        const totalVotes = nodeVotes.reduce((sum, v) => sum + Math.abs(v.vote_type), 0)
        voteCounts[node.mind_map_id] = (voteCounts[node.mind_map_id] || 0) + totalVotes
      })
    }
    
    return mindMaps?.map(map => {
      const nodeCount = nodes?.filter(n => n.mind_map_id === map.id).length || 0
      const profile = map.profiles as { first_name: string; last_name: string; nickname: string; display_name_format: string } | null
      
      let displayName = 'Anonymous'
      if (profile) {
        switch (profile.display_name_format) {
          case 'first_name':
            displayName = profile.first_name
            break
          case 'nickname':
            displayName = profile.nickname
            break
          case 'first_last':
            displayName = `${profile.first_name} ${profile.last_name}`
            break
          case 'first_initial':
            displayName = `${profile.first_name} ${profile.last_name?.charAt(0) || ''}.`
            break
          case 'nick_initial':
            displayName = `${profile.nickname} (${profile.first_name?.charAt(0) || ''}.)`
            break
          default:
            displayName = profile.first_name || profile.nickname
        }
      }
      
      return {
        id: map.id,
        title: map.title,
        description: map.description,
        createdAt: map.created_at,
        authorName: displayName,
        nodeCount,
        voteCount: voteCounts[map.id] || 0,
      }
    }) || []
  } catch (err) {
    console.error('Error in getTopSubjects:', err)
    return []
  }
}

export default async function HomePage() {
  const topSubjects = await getTopSubjects()
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section - Whimsical/Miro inspired */}
        <section className="relative overflow-hidden pb-20 pt-16 lg:pb-32 lg:pt-24">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute right-1/4 top-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          </div>
          
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-success" />
                Open platform for collaborative thinking
              </div>
              
              <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Where Greeks come together to{' '}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  solve problems
                </span>
              </h1>
              
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
                FixGreece is the collaborative platform where citizens brainstorm solutions, 
                vote on the best ideas, and turn collective wisdom into action.
              </p>
              
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="h-12 rounded-full px-8 text-base">
                    Start collaborating free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#demo">
                  <Button size="lg" variant="outline" className="h-12 rounded-full bg-transparent px-8 text-base">
                    <Play className="mr-2 h-4 w-4" />
                    See it in action
                  </Button>
                </a>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground">
                Free forever for individuals
              </p>
            </div>
            
            {/* Hero Visual - Mind Map Preview */}
            <div id="demo" className="relative mx-auto mt-16 max-w-5xl scroll-mt-8">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5">
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-accent/60" />
                    <div className="h-3 w-3 rounded-full bg-success/60" />
                  </div>
                  <div className="ml-4 flex-1 rounded-lg bg-background px-3 py-1 text-xs text-muted-foreground">
                    fixgreece.com/mindmap/sustainable-tourism
                  </div>
                </div>
                <div className="relative h-[400px] bg-[#fafafa] p-4 lg:h-[500px]">
                  {/* Canvas dots pattern */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  
                  {/* Mock mind map nodes */}
                  <svg className="absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
                    {/* Connection lines */}
                    <line x1="50%" y1="50%" x2="25%" y2="30%" stroke="#e5e5e5" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="75%" y2="30%" stroke="#e5e5e5" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="25%" y2="70%" stroke="#e5e5e5" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="75%" y2="70%" stroke="#e5e5e5" strokeWidth="2" />
                    <line x1="25%" y1="30%" x2="12%" y2="20%" stroke="#e5e5e5" strokeWidth="2" />
                    <line x1="75%" y1="30%" x2="88%" y2="20%" stroke="#e5e5e5" strokeWidth="2" />
                  </svg>
                  
                  {/* Central node */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg">
                      Sustainable Tourism in Greece
                    </div>
                  </div>
                  
                  {/* Branch nodes */}
                  <div className="absolute left-[25%] top-[30%] -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-md">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-xs text-success">12</span>
                      Eco-friendly hotels
                    </div>
                  </div>
                  
                  <div className="absolute left-[75%] top-[30%] -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-md">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-xs text-success">8</span>
                      Local experiences
                    </div>
                  </div>
                  
                  <div className="absolute left-[25%] top-[70%] -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-md">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-xs text-success">15</span>
                      Public transport
                    </div>
                  </div>
                  
                  <div className="absolute left-[75%] top-[70%] -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-md">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">-3</span>
                      New airports
                    </div>
                  </div>
                  
                  {/* Tertiary nodes */}
                  <div className="absolute left-[12%] top-[20%] -translate-x-1/2 -translate-y-1/2">
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
                      Solar panels
                    </div>
                  </div>
                  
                  <div className="absolute left-[88%] top-[20%] -translate-x-1/2 -translate-y-1/2">
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
                      Food tours
                    </div>
                  </div>
                  
                  {/* User avatars */}
                  <div className="absolute bottom-4 right-4 flex -space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-medium text-primary-foreground">
                      MK
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-accent text-xs font-medium text-accent-foreground">
                      NP
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-chart-2 text-xs font-medium text-white">
                      AG
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                      +47
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Subjects Section */}
        {topSubjects.length > 0 && (
          <section className="border-y border-border bg-card py-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <TrendingUp className="h-4 w-4" />
                    Trending Now
                  </div>
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Top subjects being discussed
                  </h2>
                </div>
                <Link href="/explore">
                  <Button variant="outline" className="hidden bg-transparent sm:flex">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {topSubjects.map((subject, index) => (
                  <Link 
                    key={subject.id} 
                    href={`/mindmap/${subject.id}`}
                    className="group"
                  >
                    <div className="relative h-full overflow-hidden rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {subject.authorName}
                        </span>
                      </div>
                      
                      <h3 className="mb-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                        {subject.title}
                      </h3>
                      
                      {subject.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                          {subject.description}
                        </p>
                      )}
                      
                      <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3.5 w-3.5" />
                          {subject.nodeCount} ideas
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {subject.voteCount} votes
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="mt-6 text-center sm:hidden">
                <Link href="/explore">
                  <Button variant="outline" className="bg-transparent">
                    View all subjects
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Social proof */}
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">2,500+</div>
                <div className="mt-1 text-sm text-muted-foreground">Active contributors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">850+</div>
                <div className="mt-1 text-sm text-muted-foreground">Problem maps created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">12,000+</div>
                <div className="mt-1 text-sm text-muted-foreground">Ideas submitted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">45,000+</div>
                <div className="mt-1 text-sm text-muted-foreground">Votes cast</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Miro-style cards */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
                Everything you need for collaborative problem-solving
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                Powerful features designed to harness collective intelligence
              </p>
            </div>
            
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<GitBranch className="h-5 w-5" />}
                title="Unlimited branching"
                description="Create infinite branches to explore every angle of a problem. No limits on depth or complexity."
                color="bg-primary/10 text-primary"
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Real-time collaboration"
                description="Work together with other citizens. See changes live as ideas flow in from across Greece."
                color="bg-chart-2/10 text-chart-2"
              />
              <FeatureCard
                icon={<ThumbsUp className="h-5 w-5" />}
                title="Democratic voting"
                description="Upvote and downvote ideas. The best solutions rise to the top organically."
                color="bg-success/10 text-success"
              />
              <FeatureCard
                icon={<MessageSquare className="h-5 w-5" />}
                title="Threaded discussions"
                description="Discuss and refine ideas in context. Have focused conversations where the work happens."
                color="bg-accent/10 text-accent"
              />
              <FeatureCard
                icon={<Globe className="h-5 w-5" />}
                title="Public & private maps"
                description="Share with everyone or keep ideas private. You control the visibility."
                color="bg-chart-4/10 text-chart-4"
              />
              <FeatureCard
                icon={<Zap className="h-5 w-5" />}
                title="Built for speed"
                description="Optimized for instant interactions. Capture ideas at the speed of thought."
                color="bg-warning/10 text-warning"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
                From problem to solution in three steps
              </h2>
            </div>
            
            <div className="mt-16 grid gap-12 md:grid-cols-3">
              <div className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">Identify the problem</h3>
                <p className="mt-2 text-muted-foreground">
                  Create a mind map for any issue facing Greece - from local concerns to national challenges.
                </p>
              </div>
              
              <div className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">Contribute solutions</h3>
                <p className="mt-2 text-muted-foreground">
                  Add your ideas as branches. Build on others' suggestions. Vote on what works best.
                </p>
              </div>
              
              <div className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">Surface the best ideas</h3>
                <p className="mt-2 text-muted-foreground">
                  The community votes. Top solutions emerge. Turn collective wisdom into actionable plans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16 lg:px-24">
              <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
                Ready to help shape Greece's future?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-primary-foreground/80">
                Join thousands of citizens already collaborating on solutions. 
                Your ideas matter.
              </p>
              <div className="mt-10">
                <Link href="/auth/sign-up">
                  <Button size="lg" variant="secondary" className="h-12 rounded-full px-8 text-base">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer - Clean Whimsical style */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="m16.24 16.24 2.83 2.83" />
                </svg>
              </div>
              <span className="font-semibold text-foreground">FixGreece</span>
            </div>
            
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/explore" className="hover:text-foreground transition-colors">
                Explore
              </Link>
              <Link href="/auth/sign-up" className="hover:text-foreground transition-colors">
                Sign up
              </Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Log in
              </Link>
            </nav>
            
            <p className="text-sm text-muted-foreground">
              Built for Greeks, by Greeks
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description,
  color
}: { 
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-lg hover:shadow-primary/5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
