/**
 * @module LoginForm
 * @description Username/password sign-in form backed by Supabase auth helpers.
 */

import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound, Minus, User } from 'lucide-react';
import PropTypes from 'prop-types';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, CopyButton, DetailsBadge } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { signInWithUsername } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

/**
 * A login form component that handles user authentication with username and password.
 * Exposes a `submit` method via ref to programmatically trigger form submission.
 *
 * @param {Object} props - Component props
 * @param {() => void} props.onSwitchToSignup - Callback function to switch to the signup form view
 * @param {React.ForwardedRef<{ submit: () => void }>} ref - Ref to expose the submit method
 * @returns {JSX.Element} Rendered login form
 */
const LoginForm = forwardRef(function LoginForm({ onSwitchToSignup }, ref) {
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
    setValue,
    trigger,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(onSubmit),
  }));

  const handleFillTestCredentials = () => {
    setValue('username', FRONTEND_CONFIG.testCredentials.username);
    setValue('password', FRONTEND_CONFIG.testCredentials.password);
    // Trigger validation to clear error states after setting values because -
    // bug - in login form - user focuses a TextField but doesn't enter any value, upon unfocusing it gets invalid state for being empty (correct behaviour), issue is - when fill button is clicked and sets TextField values, invalid state persists until user manually focuses that TextField
    trigger(['username', 'password']);
    // No blur() needed — AuthRightPanel's keydown handler now skips Enter
    // for ALL buttons (not just submit), so focus on FILL no longer blocks submit.
  };

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
        timeout: 2000,
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
    <div className="w-full md_lg:-mt-20">
      {/* Header */}
      <div className="mb-7 text-center">
        <p className="text-center font-sans text-[1.375rem] font-medium tracking-[-0.01em] text-(--color-text-primary)">
          Sign in
        </p>
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
                <div>
                  <Label>Username</Label>
                  {errors.username && (
                    <FieldError className="hidden">{errors.username.message}</FieldError>
                  )}
                </div>
                <Input
                  {...field}
                  type="text"
                  placeholder="username"
                  disabled={isLoading}
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
                <div>
                  <Label>Password</Label>
                  {errors.password && (
                    <FieldError className="hidden">{errors.password.message}</FieldError>
                  )}
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    disabled={isLoading}
                    className="w-full"
                    autoComplete="current-password"
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform cursor-pointer text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </TextField>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
          Sign in
        </Button>
      </Form>

      {/* Toggle link */}
      <p className="mt-2 text-center font-sans text-[0.8125rem] text-(--color-text-muted)">
        Don&apos;t have an account?{' '}
        <Button
          size="sm"
          variant="ghastly"
          onPress={onSwitchToSignup}
          className="font-medium underline"
        >
          Sign up
        </Button>
      </p>

      <div className="relative mt-4 min-h-10">
        {/* Error display */}
        {submitError && <DetailsBadge variant="error" message={submitError} />}

        {/* test login credentials */}
        <div className="absolute inset-x-0 top-16 flex animate-in flex-col items-center justify-center gap-1 rounded-xl bg-(--color-info-soft-ui) px-3 py-2 text-sm font-medium text-(--color-info)">
          <div className="flex items-center gap-1 uppercase">
            <Minus size={16} strokeWidth={2.5} />
            <span>Test login credentials</span>
            <Minus size={16} strokeWidth={2.5} />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <User size={12} strokeWidth={2.5} />
            <span>Username: {FRONTEND_CONFIG.testCredentials.username}</span>
            <CopyButton
              variant="info-text"
              size="sm"
              copyValue={FRONTEND_CONFIG.testCredentials.username}
              buttonCn="p-0 pl-1"
            />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <KeyRound size={12} strokeWidth={2.5} />
            <span>Password: {FRONTEND_CONFIG.testCredentials.password}</span>
            <CopyButton
              variant="info-text"
              size="sm"
              copyValue={FRONTEND_CONFIG.testCredentials.password}
              buttonCn="p-0 pl-1"
            />
          </div>
          <Button
            variant="info-soft"
            onPress={handleFillTestCredentials}
            className="py-0.5 tracking-wide shadow-sm transition-all duration-200 active:scale-95"
          >
            FILL
          </Button>
        </div>
      </div>
    </div>
  );
});

LoginForm.propTypes = {
  onSwitchToSignup: PropTypes.func.isRequired,
};

export default LoginForm;
