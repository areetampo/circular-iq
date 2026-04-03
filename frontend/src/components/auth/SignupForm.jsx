import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
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
      <div className="text-center mb-7">
        <h2 className="font-(--font-display) text-[22px] font-semibold tracking-[-0.01em] text-(--color-text-primary) text-center mb-1">
          Create Account
        </h2>
        <p className="font-(--font-body) text-[14px] text-(--color-text-muted) text-center mb-[28px]">
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
          <Label className="font-(--font-body) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-text-muted) mb-1.5 ml-2 block">
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
                  className="w-full h-10.5 bg-[rgba(245,240,232,0.5)] border border-[rgba(180,160,130,0.35)] rounded-[9px] px-4 text-[14px] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] transition-colors duration-150 font-(--font-body)"
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
          <div className="text-xs text-(--color-text-muted) mt-2 px-2 space-y-1">
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
          <Label className="font-(--font-body) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-text-muted) mb-1.5 ml-2 block">
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
                    className="w-full h-10.5 bg-[rgba(245,240,232,0.5)] border border-[rgba(180,160,130,0.35)] rounded-[9px] px-4 pr-10 text-[14px] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] transition-colors duration-150 font-(--font-body)"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
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
          <div className="text-xs text-(--color-text-muted) mt-2 px-2 space-y-1">
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
          <Label className="font-(--font-body) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-text-muted) mb-1.5 ml-2 block">
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
                    className="w-full h-10.5 bg-[rgba(245,240,232,0.5)] border border-[rgba(180,160,130,0.35)] rounded-[9px] px-4 pr-10 text-[14px] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] transition-colors duration-150 font-(--font-body)"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
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
          <div className="text-xs text-(--color-text-muted) mt-2 px-2">
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
          className="w-full h-10.5 bg-(--color-accent) hover:bg-(--color-accent-hover) text-white text-[14px] font-semibold rounded-[9px] transition-colors"
          isLoading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Create Account
        </Button>
      </Form>

      {/* Toggle link */}
      <p className="font-(--font-body) text-[13px] text-(--color-text-muted) text-center mt-4.5">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-(--color-accent) hover:underline font-medium"
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
