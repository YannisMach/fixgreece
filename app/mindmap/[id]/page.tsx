import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MindMapCanvas } from '@/components/mindmap/canvas'
import { MindMapHeader } from '@/components/mindmap/header'

interface MindMapPageProps {
  params: Promise<{ id: string }>
}

export default async function MindMapPage({ params }: MindMapPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: mindMap } = await supabase
    .from('mind_maps')
    .select('*, profiles(id, first_name, last_name, nickname, display_name_format)')
    .eq('id', id)
    .single()
  
  if (!mindMap) {
    notFound()
  }
  
  // Check access
  if (!mindMap.is_public && mindMap.user_id !== user?.id) {
    redirect('/dashboard')
  }
  
  const { data: nodes } = await supabase
    .from('nodes')
    .select(`
      *,
      profiles(id, first_name, last_name, nickname, display_name_format)
    `)
    .eq('mind_map_id', id)
    .order('created_at', { ascending: true })
  
  // Get vote counts and user votes
  const nodeIds = nodes?.map(n => n.id) || []
  
  const { data: votes } = await supabase
    .from('votes')
    .select('node_id, vote_type, user_id')
    .in('node_id', nodeIds)
  
  const { data: comments } = await supabase
    .from('comments')
    .select('node_id')
    .in('node_id', nodeIds)
  
  const enrichedNodes = nodes?.map(node => {
    const nodeVotes = votes?.filter(v => v.node_id === node.id) || []
    const voteCount = nodeVotes.reduce((sum, v) => sum + v.vote_type, 0)
    const userVote = user ? nodeVotes.find(v => v.user_id === user.id)?.vote_type || 0 : 0
    const commentsCount = comments?.filter(c => c.node_id === node.id).length || 0
    
    return {
      ...node,
      vote_count: voteCount,
      user_vote: userVote,
      comments_count: commentsCount,
    }
  }) || []
  
  const isOwner = user?.id === mindMap.user_id
  const canEdit = !!user && (isOwner || mindMap.is_public)
  
  // Check if subject is saved by current user
  let isSaved = false
  if (user && !isOwner) {
    const { data: save } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('mind_map_id', id)
      .single()
    isSaved = !!save
  }
  
  return (
    <div className="flex h-screen flex-col bg-background">
      <MindMapHeader 
        mindMap={mindMap} 
        isOwner={isOwner} 
        isSaved={isSaved}
        currentUserId={user?.id}
      />
      <MindMapCanvas 
        mindMap={mindMap} 
        initialNodes={enrichedNodes}
        canEdit={canEdit}
        currentUserId={user?.id}
      />
    </div>
  )
}
