import { Card, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, LoaderIcon, SITE_NAME } from '@/components/common';
import { signInWithUsername, signUpWithUsername } from '@/lib/auth';
import { AUTH_VALIDATION, signupSchema } from '@/lib/validation';

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
    // onBlur: validate as soon as the user leaves a field — clear UX, avoids
    // showing errors mid-typing while still catching mistakes before submit.
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const { data: signupData, error: signupError } = await signUpWithUsername(
        data.username,
        data.password,
      );

      if (signupError) {
        logger.error('[SignupForm] sign up error:', {
          status: signupError.status,
        });

        const msg = signupError.message ?? '';
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

        toast.danger('Sign up failed', {
          description: 'Unable to create account. Please try again.',
          timeout: 3000,
        });
        return;
      }

      if (!signupData?.user?.id) {
        throw new Error('Sign up succeeded but no user data was returned.');
      }

      // Auto-login immediately after successful signup
      const { data: loginData, error: loginError } = await signInWithUsername(
        data.username,
        data.password,
      );

      if (loginError) {
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

      toast.success('Account created!', {
        description: `Welcome to ${SITE_NAME}.`,
        timeout: 3000,
      });

      reset();

      const returnTo = location.state?.from || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      logger.error('[SignupForm] Unexpected error during sign up:', err?.message ?? err);

      toast.danger('Sign up failed', {
        description: 'Unable to create account. Please try again.',
        timeout: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <Card className="overflow-hidden bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl">
        <div className="p-2 sm:p-4">
          <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Username */}
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField isInvalid={!!errors.username}>
                  <div className="flex gap-2 items-center">
                    <Label className="text-sm font-medium text-gray-900">Username</Label>
                    {errors.username && (
                      <FieldError className="text-xs">({errors.username.message})</FieldError>
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
                  <span className="text-xs pl-2 pt-1 opacity-60">
                    {`${AUTH_VALIDATION.USERNAME.MIN_LENGTH}–${AUTH_VALIDATION.USERNAME.MAX_LENGTH} chars · ${AUTH_VALIDATION.USERNAME.PATTERN_DESC}`}
                  </span>
                </TextField>
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField isInvalid={!!errors.password}>
                  <div className="flex gap-2 items-center">
                    <Label className="text-sm font-medium text-gray-900">Password</Label>
                    {errors.password && (
                      <FieldError className="text-xs">({errors.password.message})</FieldError>
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
                  <span className="text-xs pl-2 pt-1 opacity-60">
                    {`${AUTH_VALIDATION.PASSWORD.MIN_LENGTH}–${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} chars · ${AUTH_VALIDATION.PASSWORD.PATTERN_DESC}`}
                  </span>
                </TextField>
              )}
            />

            {/* Confirm Password */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField isInvalid={!!errors.confirmPassword}>
                  <div className="flex gap-2 items-center">
                    <Label className="text-sm font-medium text-gray-900">Confirm Password</Label>
                    {errors.confirmPassword && (
                      <FieldError className="text-xs">
                        ({errors.confirmPassword.message})
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
            <Button type="submit" className="w-full" variant="teal" isDisabled={isLoading}>
              <span className="flex items-center justify-center gap-2">
                {isLoading ? <LoaderIcon color="#ffffff" isButton /> : <>Create Account</>}
              </span>
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
