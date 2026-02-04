# HeroUI AlertDialog Refactor - Before & After Examples

## Example 1: ConfirmDialog - Simple Confirmation

### BEFORE (Modal Pattern)

```jsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
}) {
  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="sm"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 py-4 px-6">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </ModalHeader>
            <ModalBody className="py-6 px-6">
              {description && <p className="text-gray-700 leading-relaxed">{description}</p>}
            </ModalBody>
            <ModalFooter className="gap-3 py-4 px-6">
              <Button variant="light" onPress={onClose}>
                {cancelText}
              </Button>
              <Button
                onPress={() => {
                  onConfirm?.();
                  onClose();
                }}
                color={variant === 'destructive' ? 'danger' : 'primary'}
                className="font-medium"
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
```

### AFTER (AlertDialog Pattern)

```jsx
import { AlertDialog, Button } from '@heroui/react';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
}) {
  const status = variant === 'destructive' ? 'danger' : 'accent';

  return (
    <AlertDialog isOpen={open} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop className="bg-black/50" />
      <AlertDialog.Container placement="center">
        <AlertDialog.Dialog className="sm:max-w-[400px]">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
            <AlertDialog.Icon status={status} />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            </div>
          </AlertDialog.Header>
          <AlertDialog.Body className="px-6 py-4">
            {description && <p className="text-sm text-gray-700 leading-relaxed">{description}</p>}
          </AlertDialog.Body>
          <AlertDialog.Footer className="flex justify-end gap-3 px-6 pb-6">
            <Button variant="light" onPress={() => {}} slot="close">
              {cancelText}
            </Button>
            <Button
              onPress={onConfirm}
              color={variant === 'destructive' ? 'danger' : 'primary'}
              className="font-medium"
              slot="close"
            >
              {confirmText}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog>
  );
}
```

**Key Changes:**

- ✅ Removed nested callback function pattern `{(onClose) => (...)}`
- ✅ Added `AlertDialog.Icon` with status-based color
- ✅ Used `AlertDialog.Backdrop`, `Container`, `Dialog` structure
- ✅ Added `AlertDialog.CloseTrigger` for close button
- ✅ Added `slot="close"` to buttons for auto-closing
- ✅ Cleaner sizing with `sm:max-w-[400px]`

---

## Example 2: Deletion Dialog - Destructive Action

### BEFORE (Modal Pattern)

```jsx
<Modal
  isOpen={showDeleteModal}
  onOpenChange={setShowDeleteModal}
  size="sm"
  backdrop="opaque"
  placement="center"
  classNames={{
    backdrop: 'bg-black/50',
  }}
>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="flex flex-col gap-1 py-4 px-6">
          <h2 className="text-lg font-semibold text-gray-900">Delete Assessment</h2>
        </ModalHeader>
        <ModalBody className="py-6 px-6">
          <p className="text-gray-700 font-medium mb-4">
            Are you sure you want to delete this assessment?
          </p>
          {confirmDeleteAssessment && (
            <div className="p-4 rounded-lg bg-gray-100 border border-gray-200">
              <div className="font-semibold text-gray-900">
                {confirmDeleteAssessment.title || 'Untitled Assessment'}
              </div>
            </div>
          )}
          <p className="mt-4 text-sm font-semibold text-red-600">This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter className="gap-3 py-4 px-6">
          <Button variant="light" onPress={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onPress={() => {
              proceedDelete(confirmDeleteId);
              onClose();
            }}
            color="danger"
            disabled={isDeleting}
            className="font-medium"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
```

### AFTER (AlertDialog Pattern)

```jsx
<AlertDialog isOpen={showDeleteModal} onOpenChange={setShowDeleteModal}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[400px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
        <AlertDialog.Icon status="danger" />
        <h2 className="text-base font-semibold text-gray-900">Delete Assessment</h2>
      </AlertDialog.Header>
      <AlertDialog.Body className="px-6 py-4">
        <p className="text-sm text-gray-700 font-medium mb-4">
          Are you sure you want to delete this assessment?
        </p>
        {confirmDeleteAssessment && (
          <div className="p-4 rounded-lg bg-gray-100 border border-gray-200">
            <div className="font-semibold text-gray-900">
              {confirmDeleteAssessment.title || 'Untitled Assessment'}
            </div>
          </div>
        )}
        <p className="mt-4 text-sm font-semibold text-red-600">This action cannot be undone.</p>
      </AlertDialog.Body>
      <AlertDialog.Footer className="flex justify-end gap-3 px-6 pb-6">
        <Button variant="light" disabled={isDeleting} slot="close">
          Cancel
        </Button>
        <Button
          onPress={() => {
            proceedDelete(confirmDeleteId);
          }}
          color="danger"
          disabled={isDeleting}
          className="font-medium"
          slot="close"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

**Key Changes:**

- ✅ Red danger icon via `AlertDialog.Icon status="danger"`
- ✅ Removed `onClose` callback pattern
- ✅ Direct `onPress` handlers without needing to call `onClose()`
- ✅ Cleaner semantic structure
- ✅ Better visual hierarchy

---

## Example 3: Information Modal - Multi-content

### BEFORE (Modal Pattern)

```jsx
<Modal
  isOpen={isModalOpen}
  onOpenChange={onClose}
  size="lg"
  scrollBehavior="inside"
  backdrop="opaque"
  placement="center"
  hideCloseButton={true}
  classNames={{
    backdrop: 'bg-black/50',
    base: 'bg-white rounded-2xl shadow-xl',
  }}
>
  <ModalContent className="outline-none focus:outline-none focus-visible:outline-none ring-0">
    <ModalHeader className="flex items-center gap-3 py-5">
      <div className="p-2 bg-blue-100 rounded-lg">
        <ClipboardPenLine className="text-blue-600" size={24} />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold text-[#2c3e50]">Sample Test Cases</h2>
        <p className="text-xs text-gray-500">Pre-filled business model examples</p>
      </div>
      <Button
        isIconOnly
        variant="light"
        onPress={onClose}
        aria-label="Close"
        className="ml-auto hover:bg-gray-100 rounded-md transition-colors"
      >
        <X className="w-5 h-5" />
      </Button>
    </ModalHeader>
    <ModalBody className="gap-4 px-6 py-6">{/* Content */}</ModalBody>
    <ModalFooter className="gap-2 py-2" />
  </ModalContent>
</Modal>
```

### AFTER (AlertDialog Pattern)

```jsx
<AlertDialog isOpen={isModalOpen} onOpenChange={onClose}>
  <AlertDialog.Backdrop className="bg-black/50" />
  <AlertDialog.Container placement="center">
    <AlertDialog.Dialog className="sm:max-w-[500px]">
      <AlertDialog.CloseTrigger />
      <AlertDialog.Header className="flex items-start gap-3 px-6 pt-6">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <ClipboardPenLine className="text-blue-600" size={24} />
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-base font-bold text-[#2c3e50]">Sample Test Cases</h2>
          <p className="text-xs text-gray-500">Pre-filled business model examples</p>
        </div>
      </AlertDialog.Header>
      <AlertDialog.Body className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Content */}
      </AlertDialog.Body>
      <AlertDialog.Footer className="flex justify-end px-6 pb-6">
        <Button onPress={onClose} slot="close">
          Got it
        </Button>
      </AlertDialog.Footer>
    </AlertDialog.Dialog>
  </AlertDialog.Container>
</AlertDialog>
```

**Key Changes:**

- ✅ Automatic `AlertDialog.CloseTrigger` replaces manual X button
- ✅ Removed `hideCloseButton` and custom close button
- ✅ Better scrolling with `max-h-96 overflow-y-auto` on body
- ✅ Cleaner footer with single action button
- ✅ Removed need for `hideCloseButton` workaround

---

## Pattern Summary: HeroUI v2 → v3 Migration

| Aspect              | v2 (Modal)                            | v3 (AlertDialog)                                      |
| ------------------- | ------------------------------------- | ----------------------------------------------------- |
| **Container**       | `<Modal>`                             | `<AlertDialog>`                                       |
| **Content Wrapper** | `<ModalContent>{(onClose) => ()}`     | `<AlertDialog.Dialog>`                                |
| **Header**          | `<ModalHeader>` + manual close button | `<AlertDialog.Header>` + `<AlertDialog.CloseTrigger>` |
| **Icon**            | Manual icon in content                | `<AlertDialog.Icon status="...">`                     |
| **Body**            | `<ModalBody>`                         | `<AlertDialog.Body>`                                  |
| **Footer**          | `<ModalFooter>`                       | `<AlertDialog.Footer>`                                |
| **Close Handling**  | `onClose()` callback                  | `slot="close"` + auto-close                           |
| **Backdrop**        | Part of Modal classNames              | Separate `<AlertDialog.Backdrop>`                     |
| **Sizing**          | Via size prop                         | Via Dialog className                                  |
| **Placement**       | placement prop                        | Container placement prop                              |

---

## Benefits of AlertDialog v3

✅ **Simpler API:** No nested callback patterns
✅ **Better Semantics:** Clear sub-component hierarchy
✅ **Automatic Closing:** `slot="close"` handles dialog dismissal
✅ **Built-in Icons:** Status-aware icon component
✅ **Enhanced Accessibility:** Better semantic HTML structure
✅ **Cleaner Code:** Less boilerplate, more readable
