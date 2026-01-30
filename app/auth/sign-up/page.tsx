'use client'

import { useState } from 'react'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { AlertCircle, Check } from 'lucide-react'

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await signUp(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight">FixGreece</span>
          </Link>
          
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join the community and start collaborating
          </p>
          
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form action={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your email is never shared publicly
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 6 characters"
                className="h-11"
                minLength={6}
                required
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Maria"
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Papadopoulou"
                  className="h-11"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm font-medium">
                Nickname
              </Label>
              <Input
                id="nickname"
                name="nickname"
                placeholder="mariap"
                className="h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be your default display name
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us a bit about yourself..."
                rows={2}
                className="resize-none"
              />
            </div>
            
            <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right side - Benefits */}
      <div className="hidden flex-1 items-center justify-center bg-muted/30 lg:flex">
        <div className="max-w-md p-12">
          <h2 className="text-xl font-semibold text-foreground">
            Why join FixGreece?
          </h2>
          <ul className="mt-6 space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Collaborate on real problems</p>
                <p className="text-sm text-muted-foreground">
                  Work together with fellow citizens on challenges that matter
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Your voice matters</p>
                <p className="text-sm text-muted-foreground">
                  Vote on ideas and help the best solutions rise to the top
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Free forever</p>
                <p className="text-sm text-muted-foreground">
                  No cost to create, collaborate, and contribute
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
