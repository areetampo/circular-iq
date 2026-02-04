/**
 * Save Assessment Dialog
 * Specialized dialog for saving assessments with a name
 * Wraps InputDialog with specific validation and messaging
 *
 * Location: src/components/dialogs/SaveAssessmentDialog.jsx
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
} from '@heroui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

/**
 * Specialized dialog for saving assessments with a name
 *
 * @example
 * <SaveAssessmentDialog
 *   open={showSave}
 *   onOpenChange={setShowSave}
 *   defaultName="Untitled Assessment"
 *   onSave={(name) => {
 *     console.log('Saving assessment with name:', name);
 *   }}
 * />
 */
export function SaveAssessmentDialog({ open, onOpenChange, onSave, defaultName = '' }) {
  const [name, setName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setIsPublic(true);
      setError('');
    }
  }, [open, defaultName]);

  const validateName = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Assessment name is required';
    }

    if (trimmed.length < 3) {
      return 'Assessment name must be at least 3 characters';
    }

    if (trimmed.length > 100) {
      return 'Assessment name must be less than 100 characters';
    }

    return null;
  };

  const handleSubmit = () => {
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(name.trim(), isPublic);
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
          <div>
            <ModalHeader className="flex flex-col gap-2 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Save Assessment</h2>
              <p className="text-sm text-gray-600">
                Give your assessment a memorable name and choose your privacy settings
              </p>
            </ModalHeader>
            <ModalBody className="gap-6 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-gray-700">
                  Assessment Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Recycled Plastic Packaging Project"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  maxLength={100}
                  className={`${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} transition-all`}
                />
                {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 space-x-3 border border-blue-100 rounded-lg bg-blue-50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <Label
                        htmlFor="is-public"
                        className="font-semibold text-gray-900 cursor-pointer"
                      >
                        Contribute to global benchmarks
                      </Label>
                    </div>
                    <p className="text-sm text-gray-700">
                      Allow your anonymized score to be included in industry-wide averages. This
                      helps improve circular economy insights for everyone.
                    </p>
                  </div>
                  <Switch
                    isSelected={isPublic}
                    onValueChange={setIsPublic}
                    color="primary"
                    size="lg"
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="gap-3 px-6 py-4">
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSubmit} className="font-medium">
                Save Assessment
              </Button>
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

SaveAssessmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  defaultName: PropTypes.string,
};
