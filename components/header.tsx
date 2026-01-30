import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }
  
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">FixGreece</span>
          </Link>
          
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Explore
                </Button>
              </Link>
              <Link href="/saves">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Saved
                </Button>
              </Link>
            </nav>
          )}
        </div>
        
        <nav className="flex items-center gap-3">
          {user ? (
            <UserMenu profile={profile} />
          ) : (
            <>
              <Link href="/explore">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Explore
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="rounded-full px-4">
                  Get started free
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
