import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface GuestPromptProps {
  /** Description of the action requiring authentication (e.g., "save this vendor", "create an event") */
  action: string
  /** If true, renders as inline text; if false, renders as a card */
  inline?: boolean
}

/**
 * GuestPrompt - Contextual signup prompt for unauthenticated users
 *
 * Usage examples:
 * - <GuestPrompt action="save this vendor" inline /> - in vendor card
 * - <GuestPrompt action="create an event" /> - on plan event page when not logged in
 */
export function GuestPrompt({ action, inline = false }: GuestPromptProps) {
  if (inline) {
    return (
      <span className="text-sm text-muted-foreground">
        <Link to="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
        {' '}to {action}
      </span>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Sign up to {action}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button asChild>
          <Link to="/signup">Sign Up</Link>
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default GuestPrompt
