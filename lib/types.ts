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
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Node {
  id: string
  mind_map_id: string
  parent_id: string | null
  content: string
  position_x: number
  position_y: number
  color: string | null
  created_by: string
  created_at: string
  updated_at: string
  children?: Node[]
  vote_count?: number
  user_vote?: number
  comments_count?: number
  profiles?: Profile
}

export interface Vote {
  id: string
  node_id: string
  user_id: string
  value: number
  created_at: string
}

export interface Comment {
  id: string
  node_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Report {
  id: string
  node_id: string | null
  comment_id: string | null
  reported_by: string
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  nodes?: Node
  comments?: Comment
  reporter?: Profile
  reviewer?: Profile
}

export interface DisplayNameLog {
  id: string
  user_id: string
  old_format: DisplayNameField[]
  new_format: DisplayNameField[]
  changed_at: string
  profiles?: Profile
}

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
          // Check if we should abbreviate (only first letter)
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
