import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDisplayName, DisplayNameField } from '@/lib/types'

function formatFieldList(fields: DisplayNameField[]): string {
  const labels: Record<DisplayNameField, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    nickname: 'Nickname',
  }
  return fields.map(f => labels[f]).join(' + ')
}

export default async function AdminLogsPage() {
  const supabase = await createClient()
  
  const { data: logs } = await supabase
    .from('display_name_logs')
    .select(`
      *,
      profiles(id, first_name, last_name, nickname, display_name_format, email)
    `)
    .order('changed_at', { ascending: false })
    .limit(100)
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Display Name Logs</h1>
        <p className="text-muted-foreground">
          Transparency log of all display name format changes
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
          <CardDescription>
            Last 100 display name format changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {log.profiles ? formatDisplayName(log.profiles) : 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.profiles?.email}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.changed_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                      {formatFieldList(log.old_format)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="rounded bg-primary/10 px-2 py-1 text-primary">
                      {formatFieldList(log.new_format)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No display name changes recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
