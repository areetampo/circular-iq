import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { SITE_NAME } from '@/components/common';
import Button from '@/components/common/Button';
import LoaderIcon from '@/components/common/LoaderIcon';
import { signInWithUsername, signUpWithUsername } from '@/lib/auth';
import { AUTH_VALIDATION, signupSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

export function SignupForm({ onSwitchToLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Attempt to create new user account
      const { data: signupData, error: signupError } = await signUpWithUsername(
        data.username,
        data.password,
      );

      if (signupError) {
        // Log signup error for debugging
        logger.error('[SignupForm] sign up error:', {
          status: signupError.status,
        });

        const msg = signupError.message ?? '';
        // Handle specific error cases with user-friendly messages
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          msg.includes('unique constraint') ||
          msg.includes('duplicate key') ||
          signupError.status === 422
        ) {
          toast.danger('Sign up failed', {
            description: 'This username is not available. Please choose another.',
            timeout: 3000,
          });
          return;
        }

        // Handle other signup errors with generic message
        toast.danger('Sign up failed', {
          description: 'Unable to create account. Please try again.',
          timeout: 3000,
        });
        return;
      }

      // Verify that signup created proper user data
      if (!signupData?.user?.id) {
        throw new Error('Sign up succeeded but no user data was returned.');
      }

      // Auto-login immediately after successful signup for better UX
      const { data: loginData, error: loginError } = await signInWithUsername(
        data.username,
        data.password,
      );

      if (loginError) {
        // Log auto-login failure for debugging
        logger.error('[SignupForm] auto-login failed:', { status: loginError.status });
        toast.danger('Sign up failed', {
          description: 'Unable to create account. Please try again.',
          timeout: 3000,
        });
        return;
      }

      if (!loginData?.user?.id) {
        throw new Error('Auto-login succeeded but no session was created.');
      }

      // Show success message to user
      toast.success('Account created!', {
        description: `Welcome to ${SITE_NAME}.`,
        timeout: 3000,
      });

      reset();

      // Redirect user to their intended destination or default to home
      const returnTo = location.state?.from || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      // Handle unexpected errors during signup process
      logger.error('[SignupForm] Unexpected error during sign up:', err?.message ?? err);

      toast.danger('Sign up failed', {
        description: 'Unable to create account. Please try again.',
        timeout: 3000,
      });
    } finally {
      // Ensure loading state is reset regardless of outcome
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div
        className="border rounded-lg p-6 space-y-6"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1
            className="text-2xl font-semibold"
            style={{
              color: 'var(--foreground)',
            }}
          >
            Create Account
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Join to start evaluating circular economy ideas
          </p>
        </div>

        <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.username}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Username
                  </Label>
                  {errors.username && (
                    <FieldError className="text-xs" style={{ color: 'var(--danger)' }}>
                      Incorrect username format
                    </FieldError>
                  )}
                </div>
                <Input
                  {...field}
                  type="text"
                  placeholder="your_username"
                  disabled={isLoading}
                  className="mt-1.5"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <div className="text-xs mt-1.5 px-2" style={{ color: 'var(--muted)' }}>
                  <p>{`${AUTH_VALIDATION.USERNAME.MIN_LENGTH}–${AUTH_VALIDATION.USERNAME.MAX_LENGTH} chars`}</p>
                  <div className="whitespace-pre-line">{AUTH_VALIDATION.USERNAME.PATTERN_DESC}</div>
                </div>
              </TextField>
            )}
          />

          {/* Password */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.password}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Password
                  </Label>
                  {errors.password && (
                    <FieldError className="text-xs" style={{ color: 'var(--danger)' }}>
                      Incorrect password format
                    </FieldError>
                  )}
                </div>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••"
                  disabled={isLoading}
                  className="mt-1.5"
                  autoComplete="new-password"
                />
                <div className="text-xs mt-1.5 px-2" style={{ color: 'var(--muted)' }}>
                  <p>{`${AUTH_VALIDATION.PASSWORD.MIN_LENGTH}–${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} chars`}</p>
                  <div className="whitespace-pre-line">{`${AUTH_VALIDATION.PASSWORD.PATTERN_DESC}`}</div>
                </div>
              </TextField>
            )}
          />

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.confirmPassword}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Confirm Password
                  </Label>
                  {errors.confirmPassword && (
                    <FieldError className="text-xs" style={{ color: 'var(--danger)' }}>
                      {errors.confirmPassword.message}
                    </FieldError>
                  )}
                </div>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="mt-1.5"
                  autoComplete="new-password"
                />
              </TextField>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full text-sm font-medium"
            disabled={isLoading}
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-foreground)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? <LoaderIcon color="#ffffff" isButton /> : <>Create Account</>}
            </span>
          </Button>
        </Form>

        {/* Switch to Login */}
        <div className="text-center text-sm">
          <span style={{ color: 'var(--muted)' }}>Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium transition-colors hover:opacity-80 cursor-pointer"
            style={{
              color: 'var(--accent)',
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

SignupForm.propTypes = {
  onSwitchToLogin: PropTypes.func.isRequired,
};
