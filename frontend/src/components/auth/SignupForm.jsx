'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PropTypes from 'prop-types';
import { Card, Input, Label, TextField, FieldError, Form } from '@heroui/react';
import { Button } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import LoaderIcon from '@/components/common/LoaderIcon';
import { SITE_CONFIG } from '@/constants/siteConfig';

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

export function SignupForm({ onSwitchToLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Use username with internal domain as email
      const email = `${data.username}@circular.internal`;

      const { error: signupError } = await supabase.auth.signUp({
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
    <div className="relative z-10 w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <SITE_CONFIG.logo className="h-16 w-auto" />
      </div>

      {/* Form Card */}
      <Card className="overflow-hidden bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl">
        <div className="px-8 py-8">
          <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Username Field */}
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField isInvalid={!!errors.username}>
                  <Label className="text-sm font-medium text-gray-900">Username</Label>
                  <Input
                    {...field}
                    type="text"
                    placeholder="johndoe"
                    disabled={isLoading}
                    className="mt-1.5"
                  />
                  {errors.username && (
                    <FieldError className="text-xs">{errors.username.message}</FieldError>
                  )}
                </TextField>
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField isInvalid={!!errors.password}>
                  <Label className="text-sm font-medium text-gray-900">Password</Label>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="mt-1.5"
                  />
                  {errors.password && (
                    <FieldError className="text-xs">{errors.password.message}</FieldError>
                  )}
                </TextField>
              )}
            />

            {/* Confirm Password Field */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField isInvalid={!!errors.confirmPassword}>
                  <Label className="text-sm font-medium text-gray-900">Confirm Password</Label>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="mt-1.5"
                  />
                  {errors.confirmPassword && (
                    <FieldError className="text-xs">{errors.confirmPassword.message}</FieldError>
                  )}
                </TextField>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-md hover:from-green-700 hover:to-emerald-700 hover:shadow-lg disabled:opacity-50"
              isDisabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderIcon />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-gray-600 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Signup Button */}
            <Button
              variant="secondary"
              type="button"
              className="w-full font-medium"
              onPress={() => {
                addToast({
                  title: 'Coming Soon',
                  description: 'Social login is coming soon.',
                  variant: 'default',
                });
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
          </Form>

          {/* Switch to Login */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-green-600 underline-offset-4 transition-colors hover:text-green-700 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

SignupForm.propTypes = {
  onSwitchToLogin: PropTypes.func.isRequired,
};
