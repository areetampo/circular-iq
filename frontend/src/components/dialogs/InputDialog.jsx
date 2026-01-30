/**
 * Reusable Input Dialog
 * Base component for text input with validation using shadcn/ui Dialog
 *
 * Location: src/components/dialogs/InputDialog.jsx
 */

import { React, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * Reusable input dialog for text input with validation
 *
 * @example
 * <InputDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Save Assessment"
 *   description="Enter a name for this assessment"
 *   inputLabel="Assessment Name"
 *   inputPlaceholder="My Circular Economy Project"
 *   defaultValue=""
 *   onSubmit={handleSave}
 *   submitText="Save"
 *   validate={(value) => value.length >= 3 ? null : "Name must be at least 3 characters"}
 * />
 */
export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  inputLabel,
  inputPlaceholder = '',
  defaultValue = '',
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  validate, // Function: (value) => errorMessage | null
  maxLength,
  type = 'text', // 'text' | 'email' | 'tel' | 'url'
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(null);

  // Reset value when dialog opens/closes
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
    }
  }, [open, defaultValue]);

  const handleSubmit = (e) => {
    e?.preventDefault();

    // Validate if validator provided
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Clear and submit
    setError(null);
    onSubmit?.(value);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setError(null);
    onCancel?.();
    onOpenChange(false);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear error on change
    if (error) {
      setError(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {inputLabel && <Label htmlFor="dialog-input">{inputLabel}</Label>}
              <Input
                id="dialog-input"
                type={type}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                maxLength={maxLength}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              {maxLength && (
                <p className="text-xs text-muted-foreground">
                  {value.length} / {maxLength}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
            <Button type="submit">{submitText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

InputDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  inputLabel: PropTypes.string,
  inputPlaceholder: PropTypes.string,
  defaultValue: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  validate: PropTypes.func,
  maxLength: PropTypes.number,
  type: PropTypes.oneOf(['text', 'email', 'tel', 'url']),
};
