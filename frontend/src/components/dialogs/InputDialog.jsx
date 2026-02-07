/**
 * Reusable Input Dialog
 * Modal-based input dialog with validation using HeroUI v3 compound syntax
 *
 * Location: src/components/dialogs/InputDialog.jsx
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Modal, Button, Input, Label } from '@heroui/react';
import { useDisclosure } from '@heroui/use-disclosure';

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
  const { isOpen, onOpenChange: handleOpenChange } = useDisclosure({
    isOpen: open,
    onChange: onOpenChange,
  });
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
    handleOpenChange(false);
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
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      variant="opaque"
      isDismissable={false}
    >
      <Modal.Container size="md">
        <Modal.Dialog aria-label={title}>
          <Modal.Header>
            <h2 className="text-lg font-semibold">{title}</h2>
          </Modal.Header>
          <Modal.Body>
            {description && <p className="mb-4 text-sm text-gray-700">{description}</p>}
            <div className="space-y-3">
              {inputLabel && (
                <Label htmlFor="dialog-input" className="text-sm font-medium">
                  {inputLabel}
                </Label>
              )}
              <Input
                id="dialog-input"
                type={type}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                maxLength={maxLength}
                autoFocus
                isInvalid={!!error}
                errorMessage={error}
              />
              {maxLength && (
                <p className="text-xs text-gray-500">
                  {value.length} / {maxLength}
                </p>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="light"
              onPress={() => {
                setError(null);
                onCancel?.();
                handleOpenChange(false);
              }}
            >
              {cancelText}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {submitText}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
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
