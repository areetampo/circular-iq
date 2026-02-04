# HeroUI AlertDialog - Quick Reference Card

## Copy-Paste Template

```jsx
import { AlertDialog, Button } from '@heroui/react';
import { useState } from 'react';

export function MyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Open Dialog</Button>

      <AlertDialog isOpen={open} onOpenChange={setOpen}>
        <AlertDialog.Backdrop className="bg-black/50" />
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.CloseTrigger />

            <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
              <AlertDialog.Icon status="accent" />
              <h2 className="text-base font-semibold">Dialog Title</h2>
            </AlertDialog.Header>

            <AlertDialog.Body className="px-6 py-4">
              <p className="text-sm text-gray-700">Dialog content goes here.</p>
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="light" slot="close">
                Cancel
              </Button>
              <Button color="primary" slot="close">
                Action
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog>
    </>
  );
}
```

---

## Status Icon Colors

```jsx
<AlertDialog.Icon status="accent" />    // 🔵 Blue
<AlertDialog.Icon status="success" />   // 🟢 Green
<AlertDialog.Icon status="warning" />   // 🟡 Yellow
<AlertDialog.Icon status="danger" />    // 🔴 Red
```

---

## Common Patterns

### Confirmation (Delete)

```jsx
<AlertDialog.Icon status="danger" />
// Red icon, "Delete" action
```

### Warning Alert

```jsx
<AlertDialog.Icon status="warning" />
// Yellow icon, informational
```

### Success Message

```jsx
<AlertDialog.Icon status="success" />
// Green icon, confirmatory
```

### General Info

```jsx
<AlertDialog.Icon status="accent" />
// Blue icon, general purpose
```

---

## Button Slots

```jsx
// Auto-close on click
<Button slot="close">
  Cancel
</Button>

// Auto-close + action
<Button slot="close" onPress={() => handleDelete()}>
  Delete
</Button>

// Always auto-closes when slot="close"
<Button color="danger" slot="close" onPress={handleAction}>
  Action
</Button>
```

---

## Dialog Sizes

```jsx
// Small (recommended)
className = 'sm:max-w-[400px]';

// Medium
className = 'sm:max-w-[500px]';

// Large (avoid if possible)
className = 'sm:max-w-[600px]';
```

---

## Spacing Classes

```jsx
// Header: icon + title/subtitle
className = 'flex items-start gap-3 px-6 pt-6';

// Body: content area
className = 'px-6 py-4';

// Body with scroll
className = 'px-6 py-4 max-h-96 overflow-y-auto';

// Footer: buttons
className = 'flex justify-end gap-3 px-6 pb-6';
```

---

## Do's & Don'ts

### ✅ DO

```jsx
<Button slot="close" onPress={handleAction}>
  Action
</Button>
```

### ❌ DON'T

```jsx
<Button onPress={handleAction}>Action</Button>
```

---

### ✅ DO

```jsx
<AlertDialog.Icon status="danger" />
```

### ❌ DON'T

```jsx
<AlertCircle className="..." />
```

---

### ✅ DO

```jsx
<AlertDialog isOpen={open} onOpenChange={setOpen}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog>
```

### ❌ DON'T

```jsx
<AlertDialog placement="center" backdrop="opaque">
  <AlertDialog.Content>
```

---

## Files Using This Pattern

1. `ConfirmDialog.jsx` - General confirmations
2. `InputDialog.jsx` - Text input with validation
3. `SaveAssessmentDialog.jsx` - Save with settings
4. `SampleTestCasesContainer.jsx` - Test case confirmation
5. `MyAssessmentsPage.jsx` - Delete confirmation
6. `SampleTestCasesHeadingInfoModal.jsx` - Information modal

---

## Quick Migration from Modal

### Replace:

```jsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
```

### With:

```jsx
import { AlertDialog, Button } from '@heroui/react';
```

### Replace:

```jsx
<Modal isOpen={open} onOpenChange={setOpen} size="sm" backdrop="opaque" placement="center">
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>Title</ModalHeader>
        <ModalBody>Content</ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button
            onPress={() => {
              action();
              onClose();
            }}
          >
            Action
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
```

### With:

```jsx
<AlertDialog isOpen={open} onOpenChange={setOpen}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[400px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
        <AlertDialog.Icon status="accent" />
        <h2 className="text-base font-semibold">Title</h2>
      </AlertDialog.Header>
      <AlertDialog.Body className="px-6 py-4">Content</AlertDialog.Body>
      <AlertDialog.Footer className="flex justify-end gap-3 px-6 pb-6">
        <Button variant="light" slot="close">
          Cancel
        </Button>
        <Button slot="close" onPress={action}>
          Action
        </Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

---

## Keyboard Shortcuts

- **ESC** - Close dialog
- **Tab** - Navigate buttons
- **Enter** - Activate focused button

---

## Accessibility

✅ All components include:

- Semantic HTML structure
- Keyboard navigation
- Screen reader support
- ARIA attributes
- Focus management

---

## Performance Tips

- Use `slot="close"` for automatic cleanup
- Avoid heavy re-renders in body
- Use callbacks with `useCallback` for action handlers
- Keep dialog content simple

---

## Resources

📖 Full Guide: `ALERTDIALOG_GUIDE.md`
📋 Examples: `REFACTOR_EXAMPLES.md`
📊 Summary: `REFACTOR_SUMMARY.md`
🔗 HeroUI: https://heroui.com/components/alert-dialog
