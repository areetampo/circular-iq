import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '@/components/common/Button';
import { signInWithUsername } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

export function LoginForm({ onSwitchToSignup }) {
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
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const { data: authData, error } = await signInWithUsername(data.username, data.password);

      if (error) {
        logger.error('[LoginForm] sign in error:', { status: error.status });
        setSubmitError('Incorrect username or password.');
        return;
      }

      if (!authData?.user?.id) {
        throw new Error('Authentication succeeded but no user session was created.');
      }

      toast.success('Welcome back!', {
        description: 'You have successfully signed in.',
        timeout: 3000,
      });

      reset();
      const returnTo = location.state?.from || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      logger.error('[LoginForm] unexpected error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-(--font-display) text-2xl text-(--color-text-primary) mb-1">Sign in</h2>
        <p className="text-sm text-(--color-text-muted)">Welcome back to your account</p>
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
                  maxLength={30}
                />
                {errors.username && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.username.message}
                  </FieldError>
                )}
              </TextField>
            )}
          />
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
                  autoComplete="current-password"
                  maxLength={30}
                />
                {errors.password && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.password.message}
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
          Sign in
        </Button>
      </Form>

      {/* Toggle link */}
      <div className="text-sm text-(--color-text-muted) text-center mt-6">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-(--color-accent) hover:underline"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

LoginForm.propTypes = {
  onSwitchToSignup: PropTypes.func.isRequired,
};
