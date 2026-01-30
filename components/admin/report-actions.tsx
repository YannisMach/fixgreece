'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateReportStatus } from '@/lib/actions/admin'
import { Check, X } from 'lucide-react'

interface ReportActionsProps {
  reportId: string
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const [isPending, startTransition] = useTransition()
  
  function handleAction(status: 'resolved' | 'dismissed') {
    startTransition(async () => {
      await updateReportStatus(reportId, status)
    })
  }
  
  return (
    <div className="flex gap-2 border-t border-border pt-4">
      <Button
        variant="default"
        size="sm"
        onClick={() => handleAction('resolved')}
        disabled={isPending}
      >
        <Check className="mr-2 h-4 w-4" />
        Resolve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('dismissed')}
        disabled={isPending}
      >
        <X className="mr-2 h-4 w-4" />
        Dismiss
      </Button>
    </div>
  )
}
