import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDisplayName } from '@/lib/types'
import { UserRoleSelect } from '@/components/admin/user-role-select'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  const roleColors: Record<string, string> = {
    admin: 'bg-destructive text-destructive-foreground',
    moderator: 'bg-primary text-primary-foreground',
    user: 'bg-muted text-muted-foreground',
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users?.length || 0} registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {formatDisplayName(profile).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {formatDisplayName(profile)}
                      {profile.id === currentUser?.id && (
                        <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                  {profile.id === currentUser?.id ? (
                    <Badge className={roleColors[profile.role]}>
                      {profile.role}
                    </Badge>
                  ) : (
                    <UserRoleSelect userId={profile.id} currentRole={profile.role} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
