# HeroUI v3 AlertDialog Implementation Guide

## Quick Reference: AlertDialog Components & Props

### Basic Structure

```jsx
<AlertDialog isOpen={open} onOpenChange={setOpen}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[400px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header>
        <AlertDialog.Icon status="accent" />
        {/* content */}
      </AlertDialog.Header>
      <AlertDialog.Body>{/* content */}</AlertDialog.Body>
      <AlertDialog.Footer>
        <Button slot="close">Action</Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

---

## Component Reference

### `<AlertDialog>`

**Root component for the dialog system**

| Prop           | Type                    | Default | Description                        |
| -------------- | ----------------------- | ------- | ---------------------------------- |
| `isOpen`       | boolean                 | false   | Controls dialog visibility         |
| `onOpenChange` | (open: boolean) => void | -       | Callback when dialog state changes |
| `children`     | ReactNode               | -       | Dialog content                     |

### `<AlertDialog.Backdrop>`

**Semi-transparent overlay behind dialog**

| Prop        | Type   | Default | Description                                |
| ----------- | ------ | ------- | ------------------------------------------ |
| `className` | string | -       | CSS classes (recommended: `"bg-black/50"`) |

### `<AlertDialog.Container>`

**Positioning container for dialog**

| Prop        | Type                        | Default | Description                        |
| ----------- | --------------------------- | ------- | ---------------------------------- |
| `placement` | 'center' \| 'auto' \| 'top' | 'auto'  | Dialog position (**use 'center'**) |

### `<AlertDialog.Dialog>`

**Main dialog element**

| Prop        | Type   | Default | Description                                        |
| ----------- | ------ | ------- | -------------------------------------------------- |
| `className` | string | -       | Size & styling (recommended: `"sm:max-w-[400px]"`) |

### `<AlertDialog.CloseTrigger>`

**Close button (renders as X icon)**

- Takes no props
- Automatically handles closing on click
- Required for user-initiated close

### `<AlertDialog.Header>`

**Header section of dialog**

| Prop        | Type   | Description                                                     |
| ----------- | ------ | --------------------------------------------------------------- |
| `className` | string | CSS classes (recommended: `"flex items-start gap-3 px-6 pt-6"`) |

### `<AlertDialog.Icon>`

**Status icon in header**

| Prop     | Type                                           | Status   | Color  | Icon |
| -------- | ---------------------------------------------- | -------- | ------ | ---- |
| `status` | 'accent' \| 'success' \| 'warning' \| 'danger' | 'accent' | Blue   | ℹ️   |
| `status` | 'success'                                      | -        | Green  | ✓    |
| `status` | 'warning'                                      | -        | Yellow | ⚠️   |
| `status` | 'danger'                                       | -        | Red    | ✕    |

### `<AlertDialog.Body>`

**Content/body section**

| Prop        | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| `className` | string | CSS classes (recommended: `"px-6 py-4"`) |

### `<AlertDialog.Footer>`

**Footer with action buttons**

| Prop        | Type   | Description                                                     |
| ----------- | ------ | --------------------------------------------------------------- |
| `className` | string | CSS classes (recommended: `"flex justify-end gap-3 px-6 pb-6"`) |

### `<Button slot="close">`

**Footer button with auto-close**

| Prop      | Type       | Description                               |
| --------- | ---------- | ----------------------------------------- |
| `slot`    | 'close'    | **REQUIRED** for auto-close functionality |
| `onPress` | () => void | Optional: execute action before closing   |

---

## Usage Patterns

### Pattern 1: Simple Confirmation

```jsx
import { useState } from 'react';
import { AlertDialog, Button } from '@heroui/react';

export function ConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Delete</Button>

      <AlertDialog isOpen={open} onOpenChange={setOpen}>
        <AlertDialog.Backdrop className="bg-black/50" />
        <AlertDialog.Container placement="center">
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
              <AlertDialog.Icon status="danger" />
              <h2 className="text-base font-semibold">Delete Item?</h2>
            </AlertDialog.Header>
            <AlertDialog.Body className="px-6 py-4">
              <p className="text-sm text-gray-700">This action cannot be undone.</p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="light" slot="close">
                Cancel
              </Button>
              <Button color="danger" slot="close" onPress={() => deleteItem()}>
                Delete
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog>
    </>
  );
}
```

### Pattern 2: Informational Alert

```jsx
<AlertDialog isOpen={open} onOpenChange={setOpen}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[400px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
        <AlertDialog.Icon status="warning" />
        <h2 className="text-base font-semibold">Warning</h2>
      </AlertDialog.Header>
      <AlertDialog.Body className="px-6 py-4">
        <p className="text-sm text-gray-700">Please review this important information.</p>
      </AlertDialog.Body>
      <AlertDialog.Footer className="flex justify-end px-6 pb-6">
        <Button color="primary" slot="close">
          Understood
        </Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

### Pattern 3: Success Message

```jsx
<AlertDialog isOpen={open} onOpenChange={setOpen}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[400px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
        <AlertDialog.Icon status="success" />
        <h2 className="text-base font-semibold">Success!</h2>
      </AlertDialog.Header>
      <AlertDialog.Body className="px-6 py-4">
        <p className="text-sm text-gray-700">Your changes have been saved.</p>
      </AlertDialog.Body>
      <AlertDialog.Footer className="flex justify-end px-6 pb-6">
        <Button color="success" slot="close">
          Continue
        </Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

### Pattern 4: Form Input Dialog

```jsx
<AlertDialog isOpen={open} onOpenChange={setOpen}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[400px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
        <AlertDialog.Icon status="accent" />
        <h2 className="text-base font-semibold">Enter Name</h2>
      </AlertDialog.Header>
      <AlertDialog.Body className="px-6 py-4">
        <Input
          placeholder="Enter value..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </AlertDialog.Body>
      <AlertDialog.Footer className="flex justify-end gap-3 px-6 pb-6">
        <Button variant="light" slot="close">
          Cancel
        </Button>
        <Button color="primary" slot="close" onPress={() => handleSubmit(value)}>
          Submit
        </Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

---

## Common Mistakes to Avoid

❌ **Wrong:** Not using `slot="close"` on footer buttons

```jsx
// DON'T DO THIS - Dialog won't close
<Button onPress={handleDelete}>Delete</Button>
```

✅ **Right:** Always use `slot="close"` for buttons

```jsx
// DO THIS - Dialog auto-closes after action
<Button slot="close" onPress={handleDelete}>
  Delete
</Button>
```

---

❌ **Wrong:** Using old Modal components

```jsx
// DON'T DO THIS - These don't exist in v3
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
```

✅ **Right:** Use AlertDialog and sub-components

```jsx
// DO THIS - Modern AlertDialog pattern
import { AlertDialog, Button } from '@heroui/react';
```

---

❌ **Wrong:** Callback patterns with onClose

```jsx
// DON'T DO THIS - Nested callbacks are gone
{
  (onClose) => <Button onPress={onClose}>Cancel</Button>;
}
```

✅ **Right:** Use slot="close" directly

```jsx
// DO THIS - Simpler, cleaner
<Button slot="close">Cancel</Button>
```

---

## Status Icon Color Reference

Use the appropriate status for your dialog type:

| Status      | Color  | Best For                        | Icon |
| ----------- | ------ | ------------------------------- | ---- |
| `'accent'`  | Blue   | General info, confirmations     | ℹ️   |
| `'success'` | Green  | Success messages, confirmations | ✓    |
| `'warning'` | Yellow | Warnings, cautions              | ⚠️   |
| `'danger'`  | Red    | Destructive actions, errors     | ✕    |

### Example by Type:

```jsx
// Destructive action
<AlertDialog.Icon status="danger" />

// Success confirmation
<AlertDialog.Icon status="success" />

// Warning prompt
<AlertDialog.Icon status="warning" />

// General info
<AlertDialog.Icon status="accent" />
```

---

## Styling Tips

### Responsive Dialog Size

```jsx
// Small (default for most)
className = 'sm:max-w-[400px]';

// Medium (for content-rich dialogs)
className = 'sm:max-w-[500px]';

// Large (for complex forms - avoid if possible)
className = 'sm:max-w-[600px]';
```

### Content Scrolling for Long Content

```jsx
<AlertDialog.Body className="px-6 py-4 max-h-96 overflow-y-auto">
  {/* Long content will scroll */}
</AlertDialog.Body>
```

### Consistent Spacing

```jsx
// Header
className = 'flex items-start gap-3 px-6 pt-6';

// Body
className = 'px-6 py-4';

// Footer
className = 'flex justify-end gap-3 px-6 pb-6';
```

---

## Files Using AlertDialog Pattern

✅ Refactored to v3:

- `src/components/dialogs/ConfirmDialog.jsx`
- `src/components/dialogs/InputDialog.jsx`
- `src/components/dialogs/SaveAssessmentDialog.jsx`
- `src/pages/LandingPage/components/SampleTestCasesContainer.jsx`
- `src/pages/MyAssessmentsPage/MyAssessmentsPage.jsx`
- `src/components/modals/landing/SampleTestCasesHeadingInfoModal.jsx`

---

## Migration Checklist

When converting any Modal to AlertDialog:

- [ ] Replace `Modal` with `AlertDialog`
- [ ] Add `AlertDialog.Backdrop className="bg-black/50"`
- [ ] Add `AlertDialog.Container placement="center"`
- [ ] Add `AlertDialog.Dialog className="sm:max-w-[400px]"`
- [ ] Add `AlertDialog.CloseTrigger`
- [ ] Add `AlertDialog.Icon status="..."`
- [ ] Replace `ModalHeader/ModalBody/ModalFooter` with corresponding AlertDialog components
- [ ] Add `slot="close"` to all footer buttons
- [ ] Remove `onClose` callback pattern
- [ ] Test dialog opening, closing, and actions
- [ ] Verify status icon color matches action type

---

## Resources

- HeroUI Documentation: https://heroui.com/components/alert-dialog
- Tailwind CSS: https://tailwindcss.com
- React Hooks: https://react.dev/reference/react
