import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
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
        <h2 className="mb-1 text-center font-display text-[1.375rem] font-semibold tracking-[-0.01em] text-(--color-text-primary)">
          Sign in
        </h2>
        <p className="mb-[28px] text-center font-sans text-[0.875rem] text-(--color-text-muted)">
          Welcome back!
        </p>
      </div>

      {/* Error display */}
      {submitError && (
        <div className="mb-4 rounded-md border border-[rgba(139,58,58,0.25)] bg-[rgba(139,58,58,0.05)] p-3 text-sm text-(--color-error)">
          {submitError}
        </div>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        {/* Username */}
        <div className="mb-5">
          <Label className="mb-1.5 ml-2 block font-sans text-[0.6875rem] font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase">
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
                  placeholder="username"
                  disabled={isLoading}
                  className="h-[42px] w-full rounded-[9px] border border-[rgba(180,160,130,0.35)] bg-[rgba(245,240,232,0.5)] px-4 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] focus:outline-none"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={30}
                />
                {errors.username && (
                  <FieldError className="mt-1 ml-1 text-xs text-(--color-error)">
                    {errors.username.message}
                  </FieldError>
                )}
              </TextField>
            )}
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <Label className="mb-1.5 ml-2 block font-sans text-[0.6875rem] font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase">
            Password *
          </Label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.password}>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    disabled={isLoading}
                    className="h-[42px] w-full rounded-[9px] border border-[rgba(180,160,130,0.35)] bg-[rgba(245,240,232,0.5)] px-4 pr-10 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] focus:outline-none"
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
                {errors.password && (
                  <FieldError className="mt-1 ml-1 text-xs text-(--color-error)">
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
          className="h-[42px] w-full rounded-[9px] bg-(--color-accent) text-[0.875rem] font-semibold text-white transition-colors hover:bg-accent-hover"
          isLoading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Sign in
        </Button>
      </Form>

      {/* Toggle link */}
      <p className="mt-[18px] text-center font-sans text-[0.8125rem] text-(--color-text-muted)">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="cursor-pointer font-medium text-(--color-accent) hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

LoginForm.propTypes = {
  onSwitchToSignup: PropTypes.func.isRequired,
};
