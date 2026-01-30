import React from "react"
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Map, GitBranch, Flag } from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  
  // Get stats
  const [
    { count: userCount },
    { count: mindMapCount },
    { count: nodeCount },
    { count: pendingReportCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('mind_maps').select('*', { count: 'exact', head: true }),
    supabase.from('nodes').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={userCount || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Mind Maps"
          value={mindMapCount || 0}
          icon={<Map className="h-5 w-5" />}
        />
        <StatCard
          title="Total Nodes"
          value={nodeCount || 0}
          icon={<GitBranch className="h-5 w-5" />}
        />
        <StatCard
          title="Pending Reports"
          value={pendingReportCount || 0}
          icon={<Flag className="h-5 w-5" />}
          highlight={pendingReportCount ? pendingReportCount > 0 : false}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="/admin/reports"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <Flag className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium">Review Reports</p>
                <p className="text-sm text-muted-foreground">
                  {pendingReportCount || 0} reports awaiting review
                </p>
              </div>
            </a>
            <a
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-muted-foreground">
                  View and manage user accounts
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon,
  highlight 
}: { 
  title: string
  value: number
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-destructive' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`rounded-full p-3 ${highlight ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
