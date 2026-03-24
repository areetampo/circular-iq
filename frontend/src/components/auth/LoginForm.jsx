import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '@/components/common/Button';
import LoaderIcon from '@/components/common/LoaderIcon';
import { signInWithUsername } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

export function LoginForm({ onSwitchToSignup }) {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate as soon as user leaves a field
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Attempt to sign in with provided credentials
      const { data: authData, error } = await signInWithUsername(data.username, data.password);

      if (error) {
        // Log authentication error for debugging
        logger.error('[LoginForm] sign in error:', { status: error.status });

        // Show user-friendly error message
        toast.danger('Sign in failed', {
          description: 'Incorrect username or password.',
          timeout: 3000,
        });
        return;
      }

      // Verify that authentication created a proper user session
      if (!authData?.user?.id) {
        throw new Error('Authentication succeeded but no user session was created.');
      }

      // Show success message to user
      toast.success('Welcome back!', {
        description: 'You have successfully signed in.',
        timeout: 3000,
      });

      reset();

      // Redirect user to their intended destination or default to home
      const returnTo = location.state?.from || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      // Handle unexpected errors during authentication
      logger.error('[LoginForm] unexpected error:', err);

      toast.danger('Authentication failed', {
        description: 'An unexpected error occurred. Please try again.',
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
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Sign in to access your circular economy assessments
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
                      {errors.username.message}
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
                  maxLength={30}
                />
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
                      {errors.password.message}
                    </FieldError>
                  )}
                </div>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••"
                  disabled={isLoading}
                  className="mt-1.5"
                  autoComplete="current-password"
                  maxLength={30}
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
              {isLoading ? <LoaderIcon color="#ffffff" isButton /> : <>Sign in</>}
            </span>
          </Button>
        </Form>

        {/* Switch to Signup */}
        <div className="text-center text-sm">
          <span style={{ color: 'var(--muted)' }}>Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-medium transition-colors hover:opacity-80 cursor-pointer"
            style={{
              color: 'var(--accent)',
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

LoginForm.propTypes = {
  onSwitchToSignup: PropTypes.func.isRequired,
};
