'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Check, Clock, ExternalLink, Mail, X } from 'lucide-react'
import { acceptInvite, declineInvite, cancelInvite } from '@/lib/actions/invites'
import type { Invite } from '@/lib/types'

interface InvitesListProps {
  invites: Invite[]
  type: 'received' | 'sent'
}

export function InvitesList({ invites, type }: InvitesListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const handleAccept = async (inviteId: string) => {
    setLoadingId(inviteId)
    await acceptInvite(inviteId)
    setLoadingId(null)
    router.refresh()
  }
  
  const handleDecline = async (inviteId: string) => {
    setLoadingId(inviteId)
    await declineInvite(inviteId)
    setLoadingId(null)
    router.refresh()
  }
  
  const handleCancel = async (inviteId: string) => {
    setLoadingId(inviteId)
    await cancelInvite(inviteId)
    setLoadingId(null)
    router.refresh()
  }
  
  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
        <Mail className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium text-foreground">
          {type === 'received' ? 'No invitations' : 'No sent invitations'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {type === 'received'
            ? 'You have not received any invitations to collaborate.'
            : 'You have not invited anyone to collaborate yet.'}
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {invites.map((invite) => {
        const person = type === 'received' ? invite.inviter : invite.invitee
        const personName = person
          ? person.nickname || `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Anonymous'
          : invite.invited_email || 'Unknown'
        
        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-800',
          accepted: 'bg-green-100 text-green-800',
          declined: 'bg-red-100 text-red-800',
          expired: 'bg-gray-100 text-gray-800'
        }
        
        return (
          <Card 
            key={invite.id}
            className={loadingId === invite.id ? 'opacity-50' : ''}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {personName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {personName}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={statusColors[invite.status]}
                        >
                          {invite.status}
                        </Badge>
                      </div>
                      
                      <p className="mt-1 text-sm text-muted-foreground">
                        {type === 'received' 
                          ? 'invited you to collaborate on a branch'
                          : `invited to collaborate`}
                      </p>
                      
                      {invite.message && (
                        <p className="mt-2 rounded-lg bg-muted p-3 text-sm text-foreground">
                          {'"'}{invite.message}{'"'}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                        </span>
                        {invite.node && (
                          <Link
                            href={`/mindmap/${invite.node.mind_map_id}?node=${invite.node_id}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View branch
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    {invite.status === 'pending' && (
                      <div className="flex gap-2">
                        {type === 'received' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAccept(invite.id)}
                              disabled={!!loadingId}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(invite.id)}
                              disabled={!!loadingId}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Decline
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(invite.id)}
                            disabled={!!loadingId}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
