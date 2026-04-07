import { Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, CircleX, Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { SITE_FULL_NAME } from '@/components/common';
import Button from '@/components/common/Button';
import { signInWithUsername, signUpWithUsername } from '@/lib/auth';
import { AUTH_VALIDATION, signupSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

// Validation helper functions
const validateUsernameLength = (value) => {
  const length = value?.trim().length || 0;
  return (
    length >= AUTH_VALIDATION.USERNAME.MIN_LENGTH && length <= AUTH_VALIDATION.USERNAME.MAX_LENGTH
  );
};

const validateUsernameChars = (value) => {
  const trimmed = value?.trim() || '';
  // Only letters, numbers, - and _ allowed
  const charsRegex = /^[a-zA-Z0-9_-]+$/;
  return charsRegex.test(trimmed);
};

const validateUsernameHasLetter = (value) => {
  const trimmed = value?.trim() || '';
  // Must contain at least one letter
  const letterRegex = /[a-zA-Z]/;
  return letterRegex.test(trimmed);
};

const validateUsernameNoSpaces = (value) => {
  // No spaces allowed - check the actual value without trimming
  const noSpacesRegex = /^\S*$/;
  return noSpacesRegex.test(value || '');
};

const validatePasswordLength = (value) => {
  const length = value?.length || 0;
  return (
    length >= AUTH_VALIDATION.PASSWORD.MIN_LENGTH && length <= AUTH_VALIDATION.PASSWORD.MAX_LENGTH
  );
};

const validatePasswordSpecialChar = (value) => {
  // Must include at least one special character
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  return specialCharRegex.test(value || '');
};

const validatePasswordNoSpaces = (value) => {
  // No spaces allowed - check the actual value without trimming
  const noSpacesRegex = /^\S*$/;
  return noSpacesRegex.test(value || '');
};

const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword && password.length > 0;
};

// Reusable validation rule component
const ValidationRule = ({ isValid, children }) => (
  <div className="flex items-center gap-2">
    {isValid ? (
      <CircleCheck size={12} className="text-green-800" />
    ) : (
      <CircleX size={12} className="text-red-700" />
    )}
    <span className={isValid ? 'text-green-800' : 'text-inherit'}>{children}</span>
  </div>
);

export function SignupForm({ onSwitchToLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const formData = watch();

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
        description: `Welcome to ${SITE_FULL_NAME}, ${data.username}.`,
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
      <div className="mb-7 text-center">
        <h2 className="mb-1 text-center font-display text-[1.375rem] font-semibold tracking-[-0.01em] text-(--color-text-primary)">
          Create Account
        </h2>
        <p className="mb-[28px] text-center font-sans text-[0.875rem] text-(--color-text-muted)">
          Join to start evaluating circular economy ideas
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
                  placeholder="your_username"
                  disabled={isLoading}
                  className="h-10.5 w-full rounded-[9px] border border-[rgba(180,160,130,0.35)] bg-[rgba(245,240,232,0.5)] px-4 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] focus:outline-none"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {/* {errors.username && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.username.message}
                  </FieldError>
                )} */}
              </TextField>
            )}
          />
          <div className="mt-2 space-y-1 px-2 text-xs text-(--color-text-muted)">
            <ValidationRule isValid={validateUsernameLength(formData.username || '')}>
              {`${AUTH_VALIDATION.USERNAME.MIN_LENGTH}–${AUTH_VALIDATION.USERNAME.MAX_LENGTH} chars`}
            </ValidationRule>
            <ValidationRule isValid={validateUsernameChars(formData.username || '')}>
              {AUTH_VALIDATION.USERNAME.PATTERN_DESC.split('\n')[0]}
            </ValidationRule>
            <ValidationRule isValid={validateUsernameHasLetter(formData.username || '')}>
              {AUTH_VALIDATION.USERNAME.PATTERN_DESC.split('\n')[1]}
            </ValidationRule>
            <ValidationRule isValid={validateUsernameNoSpaces(formData.username || '')}>
              {AUTH_VALIDATION.USERNAME.PATTERN_DESC.split('\n')[2]}
            </ValidationRule>
          </div>
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
                    placeholder="•••••"
                    disabled={isLoading}
                    className="h-10.5 w-full rounded-[9px] border border-[rgba(180,160,130,0.35)] bg-[rgba(245,240,232,0.5)] px-4 pr-10 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] focus:outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* {errors.password && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.password.message}
                  </FieldError>
                )} */}
              </TextField>
            )}
          />
          <div className="mt-2 space-y-1 px-2 text-xs text-(--color-text-muted)">
            <ValidationRule isValid={validatePasswordLength(formData.password || '')}>
              {`${AUTH_VALIDATION.PASSWORD.MIN_LENGTH}–${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} chars`}
            </ValidationRule>
            <ValidationRule isValid={validatePasswordSpecialChar(formData.password || '')}>
              {AUTH_VALIDATION.PASSWORD.PATTERN_DESC.split('\n')[0]}
            </ValidationRule>
            <ValidationRule isValid={validatePasswordNoSpaces(formData.password || '')}>
              {AUTH_VALIDATION.PASSWORD.PATTERN_DESC.split('\n')[1]}
            </ValidationRule>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-5">
          <Label className="mb-1.5 ml-2 block font-sans text-[0.6875rem] font-semibold tracking-[0.08em] text-(--color-text-muted) uppercase">
            Confirm Password *
          </Label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.confirmPassword}>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    disabled={isLoading}
                    className="h-10.5 w-full rounded-[9px] border border-[rgba(180,160,130,0.35)] bg-[rgba(245,240,232,0.5)] px-4 pr-10 font-sans text-[0.875rem] text-(--color-text-primary) transition-colors duration-150 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] focus:outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* {errors.confirmPassword && (
                  <FieldError className="text-xs text-(--color-error) mt-1">
                    {errors.confirmPassword.message}
                  </FieldError>
                )} */}
              </TextField>
            )}
          />
          <div className="mt-2 px-2 text-xs text-(--color-text-muted)">
            <ValidationRule
              isValid={validatePasswordMatch(
                formData.password || '',
                formData.confirmPassword || '',
              )}
            >
              Passwords match
            </ValidationRule>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          variant="primary"
          className="h-10.5 w-full rounded-[9px] bg-(--color-accent) text-[0.875rem] font-semibold text-white transition-colors hover:bg-accent-hover"
          isLoading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Create Account
        </Button>
      </Form>

      {/* Toggle link */}
      <p className="mt-4.5 text-center font-sans text-[0.8125rem] text-(--color-text-muted)">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="cursor-pointer font-medium text-(--color-accent) hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

SignupForm.propTypes = {
  onSwitchToLogin: PropTypes.func.isRequired,
};
