import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Brain, AlertTriangle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MindFlow</span>
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The link may have expired or already been used. Please try again.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/auth/login">
              <Button className="w-full">
                Back to login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outline" className="w-full bg-transparent">
                Create new account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
