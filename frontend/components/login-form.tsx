'use client';
import { cn } from "@/lib/utils"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { GoogleSignInButton } from "./google-signin-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      router.push('/dashboard');
    }
    catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);

      router.push('/dashboard');
    }
    catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Incorrect email or password. Please try again.');
      }
      else {
        setError(err?.message || 'Failed to sign in. Please try again.');
      }
    }
    finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card >
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className={cn("flex flex-col gap-6", className)} {...props}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background"
                />
              </Field>
              {error && (<Field> <p className="text-sm text-red-500">{error} </p></Field>)}
              <Field>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</Button>

              </Field>
              <FieldSeparator>Or continue with</FieldSeparator>
              <Field>
                <GoogleSignInButton onCredential={handleGoogleCredential} text="signin_with" />
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a href="/signup" className="underline underline-offset-4">
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
