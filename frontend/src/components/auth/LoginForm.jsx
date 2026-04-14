import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleX, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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

      const username = authData.user.email.split('@')[0];

      toast.success(`Welcome back ${username}!`, {
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
      <div className="mb-7 text-center">
        <h2 className="text-center font-display text-[1.375rem] font-semibold tracking-[-0.01em] text-(--color-text-primary)">
          Sign in
        </h2>
        <p className="mb-7 text-center font-sans text-[0.875rem] text-(--color-text-muted)">
          Welcome back!
        </p>
      </div>

      <Form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        {/* Username */}
        <div className="mb-5">
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.username}>
                <div className="flex h-4 items-center gap-1.5 pl-2">
                  <Label className="block font-sans text-[0.6875rem] font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase">
                    Username
                  </Label>
                  {errors.username && (
                    <FieldError className="hidden pb-0.5 text-xs text-(--color-error) lowercase">
                      {errors.username.message}
                    </FieldError>
                  )}
                </div>
                <Input
                  {...field}
                  type="text"
                  placeholder="username"
                  disabled={isLoading}
                  className="h-10.5 w-full rounded-[9px] border border-(--color-border-strong) bg-(--color-bg-card-light) px-4 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_var(--color-accent-focus-ring)] focus:outline-none"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={30}
                />
              </TextField>
            )}
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.password}>
                <div className="flex h-4 items-center gap-1.5 pl-2">
                  <Label className="block font-sans text-[0.6875rem] font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase">
                    Password
                  </Label>
                  {errors.password && (
                    <FieldError className="hidden pb-0.5 text-xs text-(--color-error) lowercase">
                      {errors.password.message}
                    </FieldError>
                  )}
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    disabled={isLoading}
                    className="h-10.5 w-full rounded-[9px] border border-(--color-border-strong) bg-(--color-bg-card-light) px-4 pr-10 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_var(--color-accent-focus-ring)] focus:outline-none"
                    autoComplete="current-password"
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </TextField>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button variant="primary" fullWidth isLoading={isLoading} onPress={handleSubmit(onSubmit)}>
          Sign in
        </Button>
      </Form>

      {/* Toggle link */}
      <p className="mt-2 text-center font-sans text-[0.8125rem] text-(--color-text-muted)">
        Don&apos;t have an account?{' '}
        <Button
          size="sm"
          variant="ghastly"
          onClick={onSwitchToSignup}
          className="font-medium underline"
        >
          Sign up
        </Button>
      </p>

      {/* Error display */}
      <div className="relative mt-4 flex min-h-10 items-center justify-center">
        {submitError && (
          <div className="absolute inset-x-0 flex animate-in items-center justify-center gap-2 rounded-xl bg-(--color-error-soft-ui) px-3 py-2 text-sm text-(--color-error) duration-200 zoom-in-95 fade-in">
            <CircleX size={16} strokeWidth={2.5} />
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}

LoginForm.propTypes = {
  onSwitchToSignup: PropTypes.func.isRequired,
};
