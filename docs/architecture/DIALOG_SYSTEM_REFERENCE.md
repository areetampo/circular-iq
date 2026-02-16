# Dialog System - Quick Reference Guide

## Using the Centralized Dialog System

### Basic Pattern

```javascript
import { useGlobalDialog } from '@/contexts/DialogContext';

export default function MyComponent() {
  // Get dialog functions from context
  const { openDeleteAssessmentDialog } = useGlobalDialog();

  const handleDelete = async (id) => {
    openDeleteAssessmentDialog({
      assessmentName: 'My Project',
      onConfirm: async () => {
        // This callback is executed when user confirms
        await deleteAPI(id);
      },
      isLoading: isDeleting,
    });
  };

  return <Button onClick={() => handleDelete(123)}>Delete</Button>;
}
```

---

## Available Dialogs

### 1. Delete Assessment Dialog

```javascript
const { openDeleteAssessmentDialog } = useGlobalDialog();

openDeleteAssessmentDialog({
  assessmentName: 'Project Name',      // displayed in dialog
  onConfirm: async () => { ... },      // called when user confirms
  isLoading: false,                     // shows loading state
});
```

### 2. Save Assessment Dialog

```javascript
const { openSaveAssessmentDialog } = useGlobalDialog();

openSaveAssessmentDialog({
  defaultName: 'Untitled Assessment',  // shown in name input
  onSave: async (name, isPublic, contributeGlobal) => {
    // name: string entered by user
    // isPublic: boolean from toggle
    // contributeGlobal: boolean from toggle
  },
});
```

### 3. Rename Assessment Dialog

```javascript
const { openRenameAssessmentDialog } = useGlobalDialog();

openRenameAssessmentDialog({
  defaultName: 'Current Name',         // shown in input
  onRename: async (newName) => { ... }, // called with new name
  isLoading: false,                     // shows loading state
});
```

### 4. Replace Inputs Dialog

```javascript
const { openReplaceInputsDialog } = useGlobalDialog();

openReplaceInputsDialog({
  title: 'Replace current inputs?',     // custom title (optional)
  description: 'Loading a test case...', // custom description (optional)
  onConfirm: async () => { ... },       // replace logic
  onCancel: async () => { ... },        // optional cancel handler
  confirmText: 'Replace',               // button text (optional)
  cancelText: 'Cancel',                 // button text (optional)
});
```

### 5. Generic Confirm Dialog

```javascript
const { openConfirmDialog } = useGlobalDialog();

openConfirmDialog({
  title: 'Confirm Action',
  description: 'Are you sure?',
  confirmText: 'Yes',
  cancelText: 'No',
  onConfirm: async () => { ... },
  variant: 'default' | 'destructive',  // 'destructive' = red button
  isLoading: false,
});
```

### 6. Session Restore Dialog

```javascript
const { openSessionRestoreDialog } = useGlobalDialog();

openSessionRestoreDialog({
  onRestore: () => { ... },    // called when "Restore Session" clicked
  onDismiss: () => { ... },    // called when "Start Fresh" clicked
  placement: 'center',         // modal placement (optional)
  size: 'sm',                  // modal size (optional)
});
```

---

## Dialog State Information

### Access Current Dialog State

```javascript
const { isDialogOpen, dialog, onClose } = useGlobalDialog();

if (isDialogOpen) {
  console.log(dialog.type); // e.g., 'delete-assessment'
  console.log(dialog.data); // { assessmentName, onConfirm, isLoading }
}
```

### Close Dialog Programmatically

```javascript
const { onClose } = useGlobalDialog();

onClose(); // Clears dialog state
```

---

## Error Handling

### Throw Errors to Keep Dialog Open

```javascript
const handleDelete = async () => {
  try {
    openDeleteAssessmentDialog({
      assessmentName: 'My Project',
      onConfirm: async () => {
        try {
          await deleteAPI(id);
          // Dialog will close automatically
        } catch (error) {
          // THROW error - dialog stays open
          throw error;
        }
      },
    });
  } catch (error) {
    addToast(`Error: ${error.message}`, 'error');
  }
};
```

---

## Complete Page Example

```javascript
import { useGlobalDialog } from '@/contexts/DialogContext';
import { Button } from '@/components/common';

export default function MyAssessmentsPage() {
  const { openDeleteAssessmentDialog, openRenameAssessmentDialog } = useGlobalDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleConfirmDelete = useCallback(
    async (id) => {
      try {
        setIsDeleting(true);
        await deleteAssessmentAPI(id);
        addToast('Deleted successfully', 'success');
      } catch (error) {
        addToast(`Delete failed: ${error.message}`, 'error');
        throw error; // Keep dialog open
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  const handleConfirmRename = useCallback(
    async (id, newName) => {
      try {
        setIsRenaming(true);
        await updateAssessmentAPI(id, { title: newName });
        addToast('Renamed successfully', 'success');
      } catch (error) {
        addToast(`Rename failed: ${error.message}`, 'error');
        throw error; // Keep dialog open
      } finally {
        setIsRenaming(false);
      }
    },
    [],
  );

  const handleDeleteClick = useCallback((id, name) => {
    openDeleteAssessmentDialog({
      assessmentName: name,
      onConfirm: () => handleConfirmDelete(id),
      isLoading: isDeleting,
    });
  }, [openDeleteAssessmentDialog, handleConfirmDelete, isDeleting]);

  const handleRenameClick = useCallback((id, currentName) => {
    openRenameAssessmentDialog({
      defaultName: currentName,
      onRename: (newName) => handleConfirmRename(id, newName),
      isLoading: isRenaming,
    });
  }, [openRenameAssessmentDialog, handleConfirmRename, isRenaming]);

  return (
    <div>
      {assessments.map((assessment) => (
        <div key={assessment.id}>
          <p>{assessment.title}</p>
          <Button onClick={() => handleRenameClick(assessment.id, assessment.title)}>
            Rename
          </Button>
          <Button onClick={() => handleDeleteClick(assessment.id, assessment.title)}>
            Delete
          </Button>
        </div>
      ))}
      {/* No dialog JSX needed - renders automatically from AppContainer.jsx */}
    </div>
  );
}
```

---

## Common Patterns

### Passing Additional Context

```javascript
openDeleteAssessmentDialog({
  assessmentName: assessment.title,
  onConfirm: async () => {
    // You can capture variables from outer scope
    const projectId = project.id;
    const category = assessment.category;
    
    await deleteAssessment(projectId, assessment.id);
  },
  isLoading: isDeleting,
});
```

### Chaining Operations After Dialog

```javascript
const handleFormDelete = useCallback(async (id) => {
  try {
    await deleteAssessmentAPI(id);
    // Dialog automatically closes
    // Do post-delete operations here
    await refetchAssessments();
    navigate('/assessments');
  } catch (error) {
    throw error; // Keep dialog open
  }
}, []);

openDeleteAssessmentDialog({
  assessmentName: item.name,
  onConfirm: () => handleFormDelete(item.id),
  isLoading: isDeleting,
});
```

### Using with React Query

```javascript
const { mutateAsync: deleteAsync } = useMutation(...);

openDeleteAssessmentDialog({
  assessmentName: assessment.title,
  onConfirm: async () => {
    try {
      await deleteAsync(assessment.id);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    } catch (error) {
      throw error;
    }
  },
  isLoading: isPending,
});
```

---

## Adding a New Dialog Type

### Step 1: Define Type
In `frontend/src/components/dialogs/dialogTypes.js`:
```javascript
export const DIALOGS = {
  // ... existing types
  MY_NEW_DIALOG: 'my-new-dialog',
};
```

### Step 2: Add Opener Function
In `frontend/src/hooks/useDialog.js`:
```javascript
openMyNewDialog: (data) =>
  openDialog(DIALOGS.MY_NEW_DIALOG, data),
```

### Step 3: Add Case to Manager
In `frontend/src/components/dialogs/DialogManager.jsx`:
```javascript
case DIALOGS.MY_NEW_DIALOG:
  return <MyNewDialog {...data} />;
```

### Step 4: Create Dialog Component
In `frontend/src/components/dialogs/MyNewDialog.jsx`:
```javascript
import { useGlobalDialog } from '@/contexts/DialogContext';

export function MyNewDialog() {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();
  
  // Your implementation here
  // Use dialog.data to access passed information
  
  return (
    <AlertDialog.Backdrop isOpen={isDialogOpen});
      {/* Dialog content */}
    </AlertDialog.Backdrop>
  );
}
```

### Step 5: Use Anywhere
```javascript
const { openMyNewDialog } = useGlobalDialog();

openMyNewDialog({
  // Your data payload
});
```

---

## Troubleshooting

### "useGlobalDialog must be used within a DialogProvider"
- Ensure `DialogProvider` is in `AppProvider.jsx`
- Make sure you're calling the hook inside a component

### Dialog Not Closing
- Make sure `onConfirm` doesn't return a promise that rejects
- If you want to keep it open on error, throw the error

### Multiple Dialogs
- The current system supports one dialog at a time
- To show multiple, you'd need to implement dialog queuing (future enhancement)

### Dialog Data Not Passed Correctly
- Check that DialogManager is passing data as props
- Verify dialog component imports `useGlobalDialog()` hook

---

## Best Practices

1. **Keep callbacks in closure** - Capture IDs and data from component state
2. **Always handle errors** - Throw to keep dialog open, catch to show toast
3. **Show loading state** - Pass `isLoading` from mutation state
4. **Invalidate cache** - After successful operations, refetch/invalidate related data
5. **Give user feedback** - Use toast notifications for success/error
6. **Don't nest dialogs** - Stick to one dialog at a time (current design)
7. **Clean up functions** - Use useCallback to memoize handlers

---

## Architecture Overview

```
useGlobalDialog() Hook
    ↓
DialogContext (global access)
    ↓
AppProvider (provides context)
    ↓
AppContainer (renders DialogManager)
    ↓
DialogManager (switches on type, renders component)
    ↓
Dialog Components (use useGlobalDialog for state)
```

All dialogs are rendered from a single place (`AppContainer.jsx`) ensuring proper z-index layering and preventing parent component pollution.
