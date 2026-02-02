'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      // Use username with internal domain as email
      const email = `${data.username}@circular.internal`;

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      });

      if (signupError) {
        // Check if username is already taken (unique constraint violation)
        if (
          signupError.message.includes('already registered') ||
          signupError.message.includes('already exists') ||
          signupError.message.includes('unique constraint')
        ) {
          throw new Error('This username is unavailable');
        }
        throw signupError;
      }

      // Auto-login after successful signup
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

      if (loginError) throw loginError;

      addToast({
        title: 'Account created successfully!',
        description: 'Welcome to Circular Economy Business Auditor.',
        variant: 'success',
      });

      reset();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during sign up.';
      addToast({
        title: 'Sign up failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              {...register('username')}
              disabled={isLoading}
            />
            {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} disabled={isLoading} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={() => {
              addToast({
                title: 'Coming Soon',
                description: 'Social login is coming soon.',
                variant: 'default',
              });
            }}
          >
            Sign up with Google
          </Button>

          <div className="text-sm text-center">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
