/**
 * Save Assessment Dialog
 * Specialized dialog for saving assessments with a name
 * Wraps InputDialog with specific validation and messaging
 *
 * Location: src/components/dialogs/SaveAssessmentDialog.jsx
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InputDialog } from './InputDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

  React.useEffect(() => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Assessment</DialogTitle>
          <DialogDescription>
            Give your assessment a memorable name and choose your privacy settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Assessment Name</Label>
            <Input
              id="name"
              placeholder="e.g., Recycled Plastic Packaging Project"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              maxLength={100}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <Label htmlFor="is-public" className="font-semibold cursor-pointer">
                    Contribute to global benchmarks
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow your anonymized score to be included in industry-wide averages. This helps
                  improve circular economy insights for everyone.
                </p>
              </div>
              <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Assessment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

SaveAssessmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  defaultName: PropTypes.string,
};
