import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { SITE_FULL_NAME } from '@/components/common';
import Button from '@/components/common/Button';
import { signInWithUsername, signUpWithUsername } from '@/lib/auth';
import { AUTH_VALIDATION, signupSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

export function SignupForm({ onSwitchToLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
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
    setSubmitError(null);

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
          setSubmitError('This username is not available. Please choose another.');
          return;
        }

        setSubmitError('Unable to create account. Please try again.');
        return;
      }

      if (!signupData?.user?.id) {
        throw new Error('Sign up succeeded but no user data was returned.');
      }

      // Auto-login after successful signup
      const { data: loginData, error: loginError } = await signInWithUsername(
        data.username,
        data.password,
      );

      if (loginError) {
        logger.error('[SignupForm] auto-login failed:', { status: loginError.status });
        setSubmitError('Unable to create account. Please try again.');
        return;
      }

      if (!loginData?.user?.id) {
        throw new Error('Auto-login succeeded but no session was created.');
      }

      toast.success('Account created!', {
        description: `Welcome to ${SITE_FULL_NAME}.`,
        timeout: 3000,
      });

      reset();
      const returnTo = location.state?.from || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      logger.error('[SignupForm] Unexpected error during sign up:', err?.message ?? err);
      setSubmitError('Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-(--font-display) text-2xl text-(--color-text-primary) mb-1">
          Create Account
        </h2>
        <p className="text-sm text-(--color-text-muted)">
          Join to start evaluating circular economy ideas
        </p>
      </div>

      {/* Error display */}
      {submitError && (
        <div className="border border-[rgba(139,58,58,0.25)] bg-[rgba(139,58,58,0.05)] rounded-md p-3 text-sm text-(--color-error) mb-4">
          {submitError}
        </div>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        {/* Username */}
        <div className="mb-5">
          <Label className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wide mb-1.5 block">
            Username *
          </Label>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.username}>
                <Input
                  {...field}
                  type="text"
                  placeholder="your_username"
                  disabled={isLoading}
                  className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-md px-4 py-2.5 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) transition-all outline-none w-full"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {errors.username && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.username.message}
                  </FieldError>
                )}
              </TextField>
            )}
          />
          <div className="text-xs text-(--color-text-muted) mt-1 px-2">
            <p>{`${AUTH_VALIDATION.USERNAME.MIN_LENGTH}–${AUTH_VALIDATION.USERNAME.MAX_LENGTH} chars`}</p>
            <div className="whitespace-pre-line">{AUTH_VALIDATION.USERNAME.PATTERN_DESC}</div>
          </div>
        </div>

        {/* Password */}
        <div className="mb-5">
          <Label className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wide mb-1.5 block">
            Password *
          </Label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.password}>
                <Input
                  {...field}
                  type="password"
                  placeholder="•••••"
                  disabled={isLoading}
                  className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-md px-4 py-2.5 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) transition-all outline-none w-full"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.password.message}
                  </FieldError>
                )}
              </TextField>
            )}
          />
          <div className="text-xs text-(--color-text-muted) mt-1 px-2">
            <p>{`${AUTH_VALIDATION.PASSWORD.MIN_LENGTH}–${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} chars`}</p>
            <div className="whitespace-pre-line">{`${AUTH_VALIDATION.PASSWORD.PATTERN_DESC}`}</div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-5">
          <Label className="text-xs font-medium text-(--color-text-secondary) uppercase tracking-wide mb-1.5 block">
            Confirm Password *
          </Label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.confirmPassword}>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••"
                  disabled={isLoading}
                  className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-md px-4 py-2.5 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) transition-all outline-none w-full"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.confirmPassword.message}
                  </FieldError>
                )}
              </TextField>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          variant="primary"
          className="w-full py-3"
          isLoading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Create Account
        </Button>
      </Form>

      {/* Toggle link */}
      <div className="text-sm text-(--color-text-muted) text-center mt-6">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-(--color-accent) hover:underline"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

SignupForm.propTypes = {
  onSwitchToLogin: PropTypes.func.isRequired,
};
