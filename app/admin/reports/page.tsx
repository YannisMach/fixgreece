import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReportActions } from '@/components/admin/report-actions'
import { formatDisplayName } from '@/lib/types'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      nodes(id, content, mind_map_id),
      comments(id, content),
      reporter:profiles!reports_reported_by_fkey(id, first_name, last_name, nickname, display_name_format),
      reviewer:profiles!reports_reviewed_by_fkey(id, first_name, last_name, nickname, display_name_format)
    `)
    .order('created_at', { ascending: false })
  
  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    reviewed: 'bg-primary text-primary-foreground',
    resolved: 'bg-success text-success-foreground',
    dismissed: 'bg-muted text-muted-foreground',
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Review and manage content reports</p>
      </div>
      
      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Report #{report.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Reported by {report.reporter ? formatDisplayName(report.reporter) : 'Unknown'} on{' '}
                      {new Date(report.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[report.status]}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="mt-1 text-foreground">{report.reason}</p>
                </div>
                
                {report.nodes && (
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm font-medium text-muted-foreground">Reported Node</p>
                    <p className="mt-1 font-medium text-foreground">{report.nodes.content}</p>
                    <a
                      href={`/mindmap/${report.nodes.mind_map_id}`}
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      View in Mind Map
                    </a>
                  </div>
                )}
                
                {report.comments && (
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm font-medium text-muted-foreground">Reported Comment</p>
                    <p className="mt-1 text-foreground">{report.comments.content}</p>
                  </div>
                )}
                
                {report.reviewer && (
                  <div className="text-sm text-muted-foreground">
                    Reviewed by {formatDisplayName(report.reviewer)} on{' '}
                    {report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString() : 'N/A'}
                  </div>
                )}
                
                {report.status === 'pending' && (
                  <ReportActions reportId={report.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No reports to review</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
