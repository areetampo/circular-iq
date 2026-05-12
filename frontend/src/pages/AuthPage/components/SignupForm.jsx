import { FieldError, Form, Input, Label, TextField, toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, CircleDot, CircleX, Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, DetailsBadge, SITE_FULL_NAME } from '@/components/common';
import { signInWithUsername, signUpWithUsername } from '@/lib/auth';
import {
  AUTH_VALIDATION,
  signupSchema,
  validatePasswordLength,
  validatePasswordMatch,
  validatePasswordNoSpaces,
  validatePasswordSpecialChar,
  validateUsernameChars,
  validateUsernameHasLetter,
  validateUsernameLength,
  validateUsernameNoSpaces,
} from '@/lib/validation';
import { cn } from '@/utils/cn';

/**
 * Reusable validation rule component.
 * @param {boolean} isValid - Whether the validation passed.
 * @param {boolean} hasInput - Whether the field has input.
 * @param {React.ReactNode} children - The validation text.
 * @returns {React.ReactNode} The validation rule component.
 */
const ValidationRule = ({ isValid, hasInput, children }) => (
  <div
    className={cn(
      'flex items-center gap-1.5 [&>*:first-child]:mt-0.5',
      !hasInput ? 'text-(--color-checkbox)' : isValid ? 'text-green-900' : 'text-red-900',
    )}
  >
    {!hasInput ? (
      <CircleDot size={14} strokeWidth={2.5} />
    ) : isValid ? (
      <CircleCheck size={14} strokeWidth={2.5} />
    ) : (
      <CircleX size={14} strokeWidth={2.5} />
    )}
    <span className="font-medium">{children}</span>
  </div>
);

ValidationRule.propTypes = {
  /** Whether the validation passed */
  isValid: PropTypes.bool.isRequired,
  /** Whether the field has input */
  hasInput: PropTypes.bool.isRequired,
  /** The validation text */
  children: PropTypes.node.isRequired,
};

/**
 * A signup form component that handles new user registration.
 * Exposes a `submit` method via ref to programmatically trigger form submission.
 *
 * @param {Object} props - Component props
 * @param {() => void} props.onSwitchToLogin - Callback function to switch back to the login form view
 * @param {React.ForwardedRef<{ submit: () => void }>} ref - Ref to expose the submit method
 * @returns {JSX.Element} Rendered signup form
 */
const SignupForm = forwardRef(function SignupForm({ onSwitchToLogin }, ref) {
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

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(onSubmit),
  }));

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
        timeout: 4000,
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
        <p className="text-center font-sans text-[1.375rem] font-medium tracking-[-0.01em] text-(--color-text-primary)">
          Create Account
        </p>
        <p className="mb-7 text-center font-sans text-[0.875rem] text-(--color-text-muted)">
          Join to start evaluating circular economy ideas
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
                />
              </TextField>
            )}
          />
          <div className="mt-2 grid grid-cols-[max-content_max-content] justify-start gap-x-4 gap-y-1 px-2 text-xs text-(--color-text-muted) opacity-75">
            {[
              {
                validate: () => validateUsernameLength(formData.username || ''),
                text: `${AUTH_VALIDATION.USERNAME.MIN_LENGTH} - ${AUTH_VALIDATION.USERNAME.MAX_LENGTH} chars`,
              },
              {
                validate: () => validateUsernameChars(formData.username || ''),
                text: AUTH_VALIDATION.USERNAME.PATTERN_DESC.split('\n')[0],
              },
              {
                validate: () => validateUsernameHasLetter(formData.username || ''),
                text: AUTH_VALIDATION.USERNAME.PATTERN_DESC.split('\n')[1],
              },
              {
                validate: () => validateUsernameNoSpaces(formData.username || ''),
                text: AUTH_VALIDATION.USERNAME.PATTERN_DESC.split('\n')[2],
              },
            ].map((rule, index) => (
              <ValidationRule key={index} isValid={rule.validate()} hasInput={!!formData.username}>
                {rule.text}
              </ValidationRule>
            ))}
          </div>
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
                    placeholder="•••••"
                    disabled={isLoading}
                    className="w-full"
                    autoComplete="new-password"
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
          <div className="mt-2 grid grid-cols-[max-content_max-content] justify-start gap-x-4 gap-y-1 px-2 text-xs text-(--color-text-muted) opacity-75">
            {[
              {
                validate: () => validatePasswordLength(formData.password || ''),
                text: `${AUTH_VALIDATION.PASSWORD.MIN_LENGTH} – ${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} chars`,
              },
              {
                validate: () => validatePasswordSpecialChar(formData.password || ''),
                text: AUTH_VALIDATION.PASSWORD.PATTERN_DESC.split('\n')[0],
              },
              {
                validate: () => validatePasswordNoSpaces(formData.password || ''),
                text: AUTH_VALIDATION.PASSWORD.PATTERN_DESC.split('\n')[1],
              },
            ].map((rule, index) => (
              <ValidationRule key={index} isValid={rule.validate()} hasInput={!!formData.password}>
                {rule.text}
              </ValidationRule>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-5">
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.confirmPassword}>
                <div>
                  <Label>Confirm Password</Label>
                  {errors.confirmPassword && (
                    <FieldError className="hidden">{errors.confirmPassword.message}</FieldError>
                  )}
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    disabled={isLoading}
                    className="w-full"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform cursor-pointer text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </TextField>
            )}
          />
          <div className="mt-2 grid grid-cols-[max-content_max-content] justify-start gap-x-4 gap-y-1 px-2 text-xs text-(--color-text-muted) opacity-75">
            {[
              {
                validate: () =>
                  validatePasswordMatch(formData.password || '', formData.confirmPassword || ''),
                text: 'Passwords match',
              },
            ].map((rule, index) => (
              <ValidationRule
                key={index}
                isValid={rule.validate()}
                hasInput={!!formData.confirmPassword}
              >
                {rule.text}
              </ValidationRule>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
          Create Account
        </Button>
      </Form>

      {/* Toggle link */}
      <p className="mt-2 text-center font-sans text-[0.8125rem] text-(--color-text-muted)">
        Already have an account?{' '}
        <Button
          size="sm"
          variant="ghastly"
          onPress={onSwitchToLogin}
          className="font-medium underline"
        >
          Sign in
        </Button>
      </p>

      {/* Error display */}
      <div className="relative mt-4 min-h-10">
        {submitError && (
          <DetailsBadge variant="error" message={submitError} className="absolute inset-x-0" />
        )}
      </div>
    </div>
  );
});

SignupForm.propTypes = {
  /** Callback function to switch back to the login form view */
  onSwitchToLogin: PropTypes.func.isRequired,
};

export default SignupForm;
