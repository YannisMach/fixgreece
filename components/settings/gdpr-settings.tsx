'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileJson,
  Shield
} from 'lucide-react'
import { 
  requestDataExport, 
  requestAccountDeletion, 
  cancelAccountDeletion 
} from '@/lib/actions/gdpr'
import type { DataExportRequest, AccountDeletionRequest } from '@/lib/types'

interface GdprSettingsProps {
  exportRequests: DataExportRequest[]
  deletionRequest: AccountDeletionRequest | null
}

export function GdprSettings({ exportRequests, deletionRequest }: GdprSettingsProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  
  const handleExportRequest = async () => {
    setIsExporting(true)
    await requestDataExport()
    setIsExporting(false)
    router.refresh()
  }
  
  const handleDeletionRequest = async () => {
    setIsDeleting(true)
    await requestAccountDeletion(deleteReason || undefined)
    setIsDeleting(false)
    setDeleteReason('')
    router.refresh()
  }
  
  const handleCancelDeletion = async () => {
    await cancelAccountDeletion()
    router.refresh()
  }
  
  const pendingExport = exportRequests.find(r => r.status === 'pending' || r.status === 'processing')
  const completedExports = exportRequests.filter(r => r.status === 'completed')
  
  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    processing: <Clock className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />
  }
  
  return (
    <div className="space-y-6">
      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle>Export Your Data</CardTitle>
          </div>
          <CardDescription>
            Download a copy of all your data including profile, mind maps, comments, and votes.
            This is your right under GDPR (General Data Protection Regulation).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingExport ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              {statusIcons[pendingExport.status]}
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Export {pendingExport.status === 'processing' ? 'in progress' : 'requested'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Requested {formatDistanceToNow(new Date(pendingExport.requested_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ) : (
            <Button onClick={handleExportRequest} disabled={isExporting}>
              <FileJson className="mr-2 h-4 w-4" />
              {isExporting ? 'Requesting...' : 'Request Data Export'}
            </Button>
          )}
          
          {completedExports.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium text-foreground">Previous Exports</h4>
              <div className="space-y-2">
                {completedExports.slice(0, 3).map((exp) => (
                  <div 
                    key={exp.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-foreground">
                        {format(new Date(exp.completed_at!), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {exp.file_url && exp.expires_at && new Date(exp.expires_at) > new Date() ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={exp.file_url} download>
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="secondary">Expired</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Account Deletion Section */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Delete Account</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
            Your account will be scheduled for deletion after a 30-day grace period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deletionRequest ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">
                    Account deletion {deletionRequest.status === 'confirmed' ? 'scheduled' : 'requested'}
                  </p>
                  {deletionRequest.status === 'confirmed' && deletionRequest.scheduled_deletion_at && (
                    <p className="text-sm text-muted-foreground">
                      Your account will be permanently deleted on{' '}
                      {format(new Date(deletionRequest.scheduled_deletion_at), 'MMMM d, yyyy')}
                    </p>
                  )}
                  {deletionRequest.status === 'pending' && (
                    <p className="text-sm text-muted-foreground">
                      Check your email to confirm the deletion request.
                    </p>
                  )}
                </div>
              </div>
              
              <Button variant="outline" onClick={handleCancelDeletion}>
                Cancel Deletion Request
              </Button>
            </div>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Your Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This will permanently delete your account and all your data, including:
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                      <li>Your profile and settings</li>
                      <li>All mind maps you created</li>
                      <li>All branches, comments, and votes</li>
                      <li>Your saved items and folders</li>
                    </ul>
                    <p>
                      Your account will be scheduled for deletion after a 30-day grace period,
                      during which you can cancel the request.
                    </p>
                    
                    <div className="pt-2">
                      <label className="text-sm font-medium text-foreground">
                        Reason for leaving (optional)
                      </label>
                      <Textarea
                        placeholder="Help us improve by sharing why you're leaving..."
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletionRequest}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Processing...' : 'Delete My Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
      
      {/* Privacy Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Your Privacy Rights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            Under GDPR and other privacy regulations, you have the right to:
          </p>
          <ul>
            <li><strong>Access</strong> - Request a copy of your personal data</li>
            <li><strong>Rectification</strong> - Update or correct your data via profile settings</li>
            <li><strong>Erasure</strong> - Request deletion of your account and data</li>
            <li><strong>Portability</strong> - Export your data in a machine-readable format</li>
            <li><strong>Objection</strong> - Object to processing of your data</li>
          </ul>
          <p>
            For any privacy-related concerns or requests, please contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
