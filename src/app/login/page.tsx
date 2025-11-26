"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { loginUser, type LoginFormState } from '@/actions/authActions';

// SubmitButton component using useFormStatus for pending state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}

export default function LoginPage() {
  // useActionState manages the error state based on the action's return value
  const initialState: LoginFormState = { error: null };
  const [state, formAction] = useActionState(loginUser, initialState);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-var(--content-offset,80px))] p-4 bg-gradient-to-br from-background-accent to-background">
      <Card variant="glass" className="w-full max-w-md shadow-2xl">
        <form action={formAction}>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <LogIn className="h-8 w-8 text-primary" />
              Login
            </CardTitle>
            <CardDescription>Enter your credentials to access the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}