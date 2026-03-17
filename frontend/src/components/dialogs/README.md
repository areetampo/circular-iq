/\*\*

- Dialogs System Documentation
- HeroUI v3 AlertDialog & Modal Implementation Guide
-
- This folder contains reusable dialog components following the HeroUI v3 patterns
- and implementing the DRY principle for common dialog use cases.
-
- Location: src/components/dialogs/README.md
  \*/

# Dialogs System

Centralized, reusable dialog components based on HeroUI v3 AlertDialog and Modal patterns.

## 🎯 Design Philosophy

### Why Centralized Dialogs?

1. **DRY Principle**: Avoid scattered AlertDialog implementations across components
2. **Consistent UX**: Unified styling, animations, and behavior
3. **Type Safety**: Reusable PropTypes and validation
4. **Maintainability**: Update dialog behavior in one place
5. **Accessibility**: Built-in ARIA support and keyboard navigation

### AlertDialog vs Modal

- **AlertDialog**: For critical confirmations requiring user attention
  - Blocking by default (`isDismissable={false}`)
  - Keyboard dismiss disabled by default
  - Status-based styling (danger, warning, success, etc.)
  - Examples: Delete confirmations, destructive actions, session restore

- **Modal**: For complex interactions and forms
  - Can be dismissed freely
  - Supports form inputs and complex layouts
  - Examples: Save dialogs, settings, multi-step forms

## 📦 Available Components

### Base Components

#### `ConfirmationDialog` ⭐ (New - Preferred)

Flexible confirmation dialog with full status support.

```jsx
import { ConfirmationDialog } from '@/components/dialogs';

<ConfirmationDialog
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  status="danger"
  title="Delete project?"
  description="This will permanently delete your project and all associated data."
  confirmText="Delete"
  onConfirm={handleDelete}
/>;
```

**Status Variants**:

- `default` - Gray (neutral actions)
- `accent` - Blue (information, save actions)
- `success` - Green (positive confirmations)
- `warning` - Orange (caution required)
- `danger` - Red (destructive actions)

**Props**:

```typescript
{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  status?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  placement?: 'auto' | 'center' | 'top' | 'bottom';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover';
}
```

#### `ConfirmDialog` (Legacy)

Basic confirmation dialog. Use `ConfirmationDialog` for new code.

```jsx
import { ConfirmDialog } from '@/components/dialogs';

<ConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  variant="destructive"
  title="Delete Assessment?"
  description="This action cannot be undone."
  confirmText="Delete"
  onConfirm={handleDelete}
/>;
```

#### `InputDialog`

Modal for text input with validation.

```jsx
import { InputDialog } from '@/components/dialogs';

<InputDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Rename Project"
  inputLabel="Project Name"
  inputPlaceholder="My Circular Economy Project"
  defaultValue={currentName}
  onSubmit={(name) => handleRename(name)}
  validate={(value) => (value.length < 3 ? 'Name must be at least 3 characters' : null)}
  maxLength={100}
/>;
```

### Specialized Components

#### `ReplaceInputsDialog`

Confirms overwriting current form inputs (used when loading test cases).

```jsx
import { ReplaceInputsDialog } from '@/components/dialogs';

<ReplaceInputsDialog
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Replace current inputs?"
  description="Loading a test case will overwrite your current data."
  onConfirm={handleReplace}
/>;
```

#### `SessionRestoreDialog`

Offers to restore a previous evaluation session.

```jsx
import { SessionRestoreDialog } from '@/components/dialogs';

<SessionRestoreDialog isOpen={hasSession} onRestore={handleRestore} onDismiss={handleDismiss} />;
```

#### `DeleteAssessmentDialog`

Specialized deletion confirmation for assessments.

```jsx
import { DeleteAssessmentDialog } from '@/components/dialogs';

<DeleteAssessmentDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  assessmentName="My Project Assessment"
  onConfirm={handleDelete}
/>;
```

#### `SaveAssessmentDialog`

Modal for saving assessments with name and privacy settings.

```jsx
import { SaveAssessmentDialog } from '@/components/dialogs';

<SaveAssessmentDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  defaultName="Untitled Assessment"
  onSave={(payload) => handleSave(payload)}
/>;
```

## 🎨 Styling & Theming

### Status-Based Colors

Following HeroUI v3 AlertDialog guide:

```css
/* Status backgrounds (automatically applied) */
.bg-danger-soft text-danger-soft-foreground    /* Destructive actions */
.bg-success-soft text-success-soft-foreground  /* Positive confirmations */
.bg-warning-soft text-warning-soft-foreground  /* Caution required */
.bg-accent-soft text-accent-soft-foreground    /* Informational */
```

### Customization

Dialogs use Tailwind classes and can be customized via className props:

```jsx
<ConfirmationDialog
  className="custom-dialog"
  // Dialog will have both default styles and custom class
/>
```

## 🔧 Creating New Specialized Dialogs

When you need a new dialog pattern used in multiple places:

1. **Create the component** in `components/dialogs/`
2. **Extend base dialogs** (ConfirmationDialog, InputDialog, etc.)
3. **Export** from `index.js`
4. **Document** here in README

Example:

```jsx
// ClearFormDialog.jsx
import { ConfirmationDialog } from './ConfirmationDialog';

export function ClearFormDialog({ isOpen, onOpenChange, onConfirm }) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      status="warning"
      title="Clear form?"
      description="All unsaved changes will be lost."
      confirmText="Clear"
      onConfirm={onConfirm}
    />
  );
}
```

## 📝 Usage Guidelines

### DO ✓

- Use `ConfirmationDialog` for new confirmation dialogs
- Choose appropriate status variants (danger for destructive, success for positive, etc.)
- Create specialized dialogs for repeated patterns
- Keep dialogs in this centralized folder
- Use `isDismissable={false}` for critical actions
- Provide clear, concise titles and descriptions

### DON'T ✕

- Scatter `AlertDialog.Backdrop` implementations across components
- Use `Modal` for simple confirmations (use AlertDialog)
- Use `AlertDialog` for forms (use Modal)
- Create custom dialogs when a base component works
- Override status colors unless absolutely necessary

## 🔍 Finding Dialog Usage

Search for dialog imports to find all usages:

```pwsh
# Find all dialog usages
Get-ChildItem -Path src/ -Recurse -Filter "*.jsx" -o "*.js" | Select-String "from '@/components/dialogs'"

# Find specific dialog
Get-ChildItem -Path src/ -Recurse -Filter "*.jsx" -o "*.js" | Select-String "ConfirmationDialog"
```

## 🧪 Testing Dialogs

Basic test pattern:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '@/components/dialogs';

test('calls onConfirm when confirmed', () => {
  const onConfirm = jest.fn();

  render(
    <ConfirmationDialog
      isOpen={true}
      onOpenChange={() => {}}
      title="Test Dialog"
      description="Test description"
      onConfirm={onConfirm}
    />,
  );

  fireEvent.click(screen.getByText('Confirm'));
  expect(onConfirm).toHaveBeenCalled();
});
```

## 📚 References

- [HeroUI v3 AlertDialog Documentation](https://v3.heroui.com/docs/react/components/alert-dialog)
- [HeroUI v3 Modal Documentation](https://v3.heroui.com/docs/react/components/modal)
- [WAI-ARIA AlertDialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)

## 🔄 Migration from Scattered Dialogs

If you find an AlertDialog scattered in a component file:

1. Check if an existing dialog in this folder fits the use case
2. If yes, import and use it
3. If no, create a new reusable dialog here
4. Update the component to use the new dialog
5. Update this README

Example migration:

```jsx
// Before (in component file) ✕
<AlertDialog.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
  <AlertDialog.Container>
    <AlertDialog.Dialog>{/* ... lots of boilerplate ... */}</AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog.Backdrop>;

// After (using centralized dialog) ✓
import { ReplaceInputsDialog } from '@/components/dialogs';

<ReplaceInputsDialog isOpen={isOpen} onOpenChange={setIsOpen} onConfirm={handleReplace} />;
```

---

**Last Updated**: February 2026
**HeroUI Version**: v3.0.0-beta-6
