import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSaves, getSaveFolders } from '@/lib/actions/saves'
import { SavesList } from '@/components/saves/saves-list'
import { FolderSidebar } from '@/components/saves/folder-sidebar'
import { Bookmark } from 'lucide-react'

export default async function SavesPage({
  searchParams
}: {
  searchParams: Promise<{ folder?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const params = await searchParams
  const folderId = params.folder === 'unfiled' ? null : params.folder
  
  const [folders, saves] = await Promise.all([
    getSaveFolders(),
    getSaves(folderId)
  ])
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bookmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Saved Items</h1>
              <p className="text-sm text-muted-foreground">
                Your bookmarked mind maps and branches
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-8">
          <FolderSidebar 
            folders={folders} 
            activeFolder={params.folder} 
          />
          
          <div className="flex-1">
            <SavesList 
              saves={saves} 
              folders={folders}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
