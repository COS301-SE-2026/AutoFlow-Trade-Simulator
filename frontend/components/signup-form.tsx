'use client';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { cn } from "@/lib/utils"
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    try {
      loginWithGoogle(idToken);
      router.push('/dashboard');
    }
    catch (err: any) {
      setError(err?.message || 'Failed to sign up with Google. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    if (password !== cpassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    const symbolRegex: RegExp = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (!symbolRegex.test(password)) {
      setError('Password must contain at least 1 symbol.');
      setIsLoading(false);
      return;

    }
    setIsLoading(true);

    try {
      register(fullName, email, password);
      router.push('/dashboard');
    }
    catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Email already exists. Please use a different email.');
      }
      else {
        setError(err?.message || 'Failed to create account. Please try again.');
      }
    }
    finally {
      setIsLoading(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className={cn("flex flex-col gap-6", className)} {...props}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Thandi Mokoena"
                required
                value={fullName}
                className="bg-background"
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="m@example.com"
                required
                value={email}
                className="bg-background"
                onChange={(e) => setEmail(e.target.value)}
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                className="bg-background"
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldDescription>
                Must be at least 8 characters long and include at least 1 symbol.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={cpassword}
                className="bg-background"
                onChange={(e) => setCPassword(e.target.value)}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            {error && (<Field><p role="alert" className="text-sm text-[#ff6b72]">{error}</p></Field>)}
            <Field>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Signing Up…' : 'Create Account'}</Button>
            </Field>
            <FieldSeparator>Or continue with</FieldSeparator>
            <Field>
              <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" />
              <FieldDescription className="px-6 text-center">
                Already have an account? <a href="/login" className="underline underline-offset-4">Sign in</a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
