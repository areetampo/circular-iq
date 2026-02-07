/**
 * Save Assessment Dialog
 * Specialized dialog for saving assessments with a name
 * Uses HeroUI v3 AlertDialog compound syntax
 *
 * Location: src/components/dialogs/SaveAssessmentDialog.jsx
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Button, Switch, Input, Label, Description } from '@heroui/react';
import { cn } from '@/utils/cn';
import { Globe, Save } from 'lucide-react';

/**
 * Specialized dialog for saving assessments with a name
 *
 * @example
 * <SaveAssessmentDialog
 *   isOpen={showSave}
 *   onOpenChange={setShowSave}
 *   defaultName="Untitled Assessment"
 *   onSave={(name) => {
 *     console.log('Saving assessment with name:', name);
 *   }}
 * />
 */
export function SaveAssessmentDialog({ isOpen, onOpenChange, onSave, defaultName = '' }) {
  const [name, setName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setIsPublic(true);
      setError('');
    }
  }, [isOpen, defaultName]);

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

  const handleSubmit = (close) => {
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(name.trim(), isPublic);
    close();
  };

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="opaque"
      isDismissable={false}
    >
      <AlertDialog.Container placement="center" size="lg">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="success">
                  <Save className="w-6 h-6" />
                </AlertDialog.Icon>
                <AlertDialog.Heading>Save Assessment</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="gap-6">
                <p className="text-sm text-gray-600">
                  Give your assessment a memorable name and choose your privacy settings
                </p>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <Label htmlFor="name" className="text-sm font-medium">
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
                    className={cn('w-4/5 sm:w-3/5', error && 'border-red-600 focus:ring-red-600')}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 p-4 border-2 border-blue-300 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex-1">
                      <Switch isSelected={isPublic} onChange={setIsPublic} size="lg">
                        <div className="flex gap-3">
                          <div className="-mt-0.5 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <Label className="text-sm font-medium text-gray-900">
                                Contribute to global benchmarks
                              </Label>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                            </div>
                            <Description className="text-xs text-gray-700">
                              Allow your anonymized score to be included in industry-wide averages.
                              This helps improve circular economy insights for everyone.
                            </Description>
                          </div>
                        </div>
                      </Switch>
                    </div>
                  </div>
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer>
                <Button
                  variant="light"
                  onPress={() => {
                    close();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    handleSubmit(close);
                  }}
                >
                  Save Assessment
                </Button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

SaveAssessmentDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  defaultName: PropTypes.string,
};
