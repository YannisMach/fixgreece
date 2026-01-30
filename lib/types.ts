// User roles
export type UserRole = 'admin' | 'moderator' | 'user'

export type DisplayNameField = 'first_name' | 'last_name' | 'nickname'

export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  nickname: string
  bio: string | null
  role: UserRole
  first_name_public: boolean
  last_name_public: boolean
  nickname_public: boolean
  bio_public: boolean
  display_name_format: DisplayNameField[]
  created_at: string
  updated_at: string
}

export interface MindMap {
  id: string
  user_id: string
  title: string
  description: string | null
  is_public: boolean
  category_id: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  category?: Category
  tags?: Tag[]
  node_count?: number
  vote_count?: number
  view_count?: number
  comment_count?: number
}

export interface Node {
  id: string
  mind_map_id: string
  parent_id: string | null
  content: string
  description: string | null
  position_x: number
  position_y: number
  color: string | null
  user_id: string
  created_at: string
  updated_at: string
  children?: Node[]
  vote_count?: number
  user_vote?: number
  comments_count?: number
  profiles?: Profile
  tags?: Tag[]
}

export interface Vote {
  id: string
  node_id: string
  user_id: string
  vote_type: number
  created_at: string
}

export interface Comment {
  id: string
  node_id: string
  user_id: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  replies?: Comment[]
}

export interface Report {
  id: string
  node_id: string | null
  user_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  created_at: string
  updated_at: string
  nodes?: Node
  reporter?: Profile
  reviewer?: Profile
}

// Category for organizing mind maps
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
  children?: Category[]
  mind_map_count?: number
}

// Tag for mind maps and nodes
export interface Tag {
  id: string
  name: string
  slug: string
  usage_count: number
  created_at: string
}

// Junction tables
export interface MindMapTag {
  mind_map_id: string
  tag_id: string
  created_at: string
}

export interface NodeTag {
  node_id: string
  tag_id: string
  created_at: string
}

// Save folder for organizing bookmarks
export interface SaveFolder {
  id: string
  user_id: string
  name: string
  color: string | null
  sort_order: number
  created_at: string
  save_count?: number
}

// Save/Bookmark
export interface Save {
  id: string
  user_id: string
  mind_map_id: string | null
  node_id: string | null
  folder_id: string | null
  notes: string | null
  created_at: string
  mind_map?: MindMap
  node?: Node
  folder?: SaveFolder
}

// Invite for expert collaboration
export interface Invite {
  id: string
  node_id: string
  invited_by: string
  invited_user_id: string | null
  invited_email: string | null
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  created_at: string
  responded_at: string | null
  inviter?: Profile
  invitee?: Profile
  node?: Node
}

// View tracking for statistics
export interface View {
  id: string
  mind_map_id: string | null
  node_id: string | null
  user_id: string | null
  ip_hash: string | null
  created_at: string
}

// Change log for admin transparency
export interface ChangeLog {
  id: string
  user_id: string
  entity_type: 'profile' | 'mind_map' | 'node' | 'comment'
  entity_id: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  change_reason: string | null
  created_at: string
  profiles?: Profile
}

// Display name change log (legacy, now part of change_logs)
export interface DisplayNameLog {
  id: string
  user_id: string
  old_format: DisplayNameField[]
  new_format: DisplayNameField[]
  changed_at: string
  profiles?: Profile
}

// GDPR: Data export request
export interface DataExportRequest {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_url: string | null
  requested_at: string
  completed_at: string | null
  expires_at: string | null
}

// GDPR: Account deletion request
export interface AccountDeletionRequest {
  id: string
  user_id: string
  reason: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  confirmation_token: string | null
  requested_at: string
  confirmed_at: string | null
  scheduled_deletion_at: string | null
  completed_at: string | null
}

// Statistics
export interface MindMapStats {
  views: number
  unique_viewers: number
  total_votes: number
  upvotes: number
  downvotes: number
  comments: number
  saves: number
  nodes: number
}

export interface NodeStats {
  views: number
  votes: number
  upvotes: number
  downvotes: number
  comments: number
  saves: number
  children: number
}

// Helper function
export function formatDisplayName(profile: Profile): string {
  if (!profile.display_name_format || profile.display_name_format.length === 0) {
    return profile.nickname || profile.first_name || 'Anonymous'
  }
  
  const parts: string[] = []
  
  for (const field of profile.display_name_format) {
    switch (field) {
      case 'first_name':
        if (profile.first_name) parts.push(profile.first_name)
        break
      case 'last_name':
        if (profile.last_name) {
          const prevField = profile.display_name_format[profile.display_name_format.indexOf(field) - 1]
          if (prevField === 'first_name' && profile.display_name_format.length === 2) {
            parts.push(profile.last_name.charAt(0) + '.')
          } else {
            parts.push(profile.last_name)
          }
        }
        break
      case 'nickname':
        if (profile.nickname) {
          if (parts.length > 0) {
            parts.push(`(${profile.nickname})`)
          } else {
            parts.push(profile.nickname)
          }
        }
        break
    }
  }
  
  return parts.join(' ') || 'Anonymous'
}
