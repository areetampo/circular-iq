/**
 * Reusable Input Dialog
 * Base component for text input with validation using HeroUI Modal
 *
 * Location: src/components/dialogs/InputDialog.jsx
 */

import { React, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="md"
      backdrop="opaque"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validate) {
                const validationError = validate(value);
                if (validationError) {
                  setError(validationError);
                  return;
                }
              }
              setError(null);
              onSubmit?.(value);
              onClose();
            }}
          >
            <ModalHeader className="flex flex-col gap-2 py-4 px-6">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {description && <p className="text-sm text-gray-600">{description}</p>}
            </ModalHeader>

            <ModalBody className="gap-4 py-6 px-6">
              <div className="grid gap-3">
                {inputLabel && (
                  <Label htmlFor="dialog-input" className="font-medium text-gray-700">
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
                  className={`${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} transition-all`}
                />
                {error && <p className="text-sm font-medium text-red-600 mt-1">{error}</p>}
                {maxLength && (
                  <p className="text-xs text-gray-500 mt-1">
                    {value.length} / {maxLength}
                  </p>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="gap-3 py-4 px-6">
              <Button
                type="button"
                variant="light"
                onPress={() => {
                  setError(null);
                  onCancel?.();
                  onClose();
                }}
              >
                {cancelText}
              </Button>
              <Button type="submit" color="primary" className="font-medium">
                {submitText}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
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
