'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/auth'
import { Profile, DisplayNameField, formatDisplayName } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Eye } from 'lucide-react'

interface ProfileSettingsFormProps {
  profile: Profile
}

const DISPLAY_NAME_OPTIONS: { value: DisplayNameField; label: string }[] = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'nickname', label: 'Nickname' },
]

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [nickname, setNickname] = useState(profile.nickname)
  const [bio, setBio] = useState(profile.bio || '')
  const [firstNamePublic, setFirstNamePublic] = useState(profile.first_name_public)
  const [lastNamePublic, setLastNamePublic] = useState(profile.last_name_public)
  const [nicknamePublic, setNicknamePublic] = useState(profile.nickname_public)
  const [bioPublic, setBioPublic] = useState(profile.bio_public)
  const [displayNameFormat, setDisplayNameFormat] = useState<DisplayNameField[]>(
    profile.display_name_format || ['nickname']
  )
  
  const previewProfile: Profile = {
    ...profile,
    first_name: firstName,
    last_name: lastName,
    nickname: nickname,
    display_name_format: displayNameFormat,
  }
  
  function toggleDisplayNameField(field: DisplayNameField) {
    setDisplayNameFormat(prev => {
      if (prev.includes(field)) {
        const newFormat = prev.filter(f => f !== field)
        return newFormat.length > 0 ? newFormat : ['nickname']
      }
      return [...prev, field]
    })
  }
  
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setSuccess(false)
    
    formData.set('firstName', firstName)
    formData.set('lastName', lastName)
    formData.set('nickname', nickname)
    formData.set('bio', bio)
    formData.set('firstNamePublic', firstNamePublic.toString())
    formData.set('lastNamePublic', lastNamePublic.toString())
    formData.set('nicknamePublic', nicknamePublic.toString())
    formData.set('bioPublic', bioPublic.toString())
    formData.set('displayNameFormat', JSON.stringify(displayNameFormat))
    
    const result = await updateProfile(formData)
    
    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    
    setLoading(false)
  }
  
  return (
    <form action={handleSubmit} className="space-y-6">
      {success && (
        <Alert className="border-success bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell others about yourself..."
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Choose which fields are visible to other users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>First Name</Label>
              <p className="text-sm text-muted-foreground">Show your first name publicly</p>
            </div>
            <Switch checked={firstNamePublic} onCheckedChange={setFirstNamePublic} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Last Name</Label>
              <p className="text-sm text-muted-foreground">Show your last name publicly</p>
            </div>
            <Switch checked={lastNamePublic} onCheckedChange={setLastNamePublic} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Nickname</Label>
              <p className="text-sm text-muted-foreground">Show your nickname publicly</p>
            </div>
            <Switch checked={nicknamePublic} onCheckedChange={setNicknamePublic} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bio</Label>
              <p className="text-sm text-muted-foreground">Show your bio publicly</p>
            </div>
            <Switch checked={bioPublic} onCheckedChange={setBioPublic} />
          </div>
        </CardContent>
      </Card>
      
      {/* Display Name */}
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            Choose how your name appears to others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {DISPLAY_NAME_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={displayNameFormat.includes(option.value)}
                  onCheckedChange={() => toggleDisplayNameField(option.value)}
                />
                <Label htmlFor={option.value} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              Preview
            </div>
            <p className="mt-2 text-lg font-medium">
              {formatDisplayName(previewProfile)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
