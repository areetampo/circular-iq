import { Card, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import LoaderIcon from '@/components/common/LoaderIcon';
import { signInWithUsername } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

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
    // onBlur: validate as soon as the user leaves a field — clear UX, avoids
    // showing errors mid-typing while still catching mistakes before submit.
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await signInWithUsername(data.username, data.password);

      if (error) {
        logger.error('[LoginForm] sign in error:', { status: error.status });

        toast.danger('Sign in failed', {
          description: 'Incorrect username or password.',
          timeout: 3000,
        });
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
      // Catch-all for network failures, unexpected throws, etc.
      logger.error('[LoginForm] Unexpected error during sign in:', err?.message ?? err);

      toast.danger('Sign in failed', {
        description: 'An unexpected error occurred. Please try again.',
        timeout: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
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
                  <div className="flex gap-2 items-center">
                    <Label className="text-sm font-medium text-gray-900">Password</Label>
                    {errors.password && (
                      <FieldError className="text-xs">({errors.password.message})</FieldError>
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
            <Button type="submit" className="w-full" variant="teal" isDisabled={isLoading}>
              <span className="flex items-center justify-center gap-2">
                {isLoading ? <LoaderIcon color="#ffffff" isButton /> : <>Sign in</>}
              </span>
            </Button>
          </Form>

          {/* Switch to Signup */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-semibold text-green-600 underline-offset-4 transition-colors hover:text-green-700 hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

LoginForm.propTypes = {
  onSwitchToSignup: PropTypes.func.isRequired,
};
