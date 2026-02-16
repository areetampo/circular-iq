# Architecture Documentation

This folder contains comprehensive documentation of the application's architecture, focusing on the centralized dialog and modal systems.

## Quick Navigation

### For Quick Understanding

Start here: **[ARCHITECTURE_INSIGHTS.md](./ARCHITECTURE_INSIGHTS.md)**

- Visual diagrams of the 4-layer pattern
- Why this pattern works (with real benefits)
- Migration examples (before/after code)
- Future enhancement ideas
- **Best for**: Understanding the "why" and getting started

### For Using the System

Go here: **[DIALOG_SYSTEM_REFERENCE.md](./DIALOG_SYSTEM_REFERENCE.md)**

- How to use each dialog type
- Complete working examples
- Common patterns
- How to add new dialogs
- Troubleshooting guide
- **Best for**: Developers implementing features

### For Implementation Details

See: **[DIALOG_CENTRALIZATION_IMPLEMENTATION.md](./DIALOG_CENTRALIZATION_IMPLEMENTATION.md)**

- Before/after architecture comparison
- Detailed file-by-file breakdown
- Data flow diagrams
- Benefits achieved
- Testing checklist
- **Best for**: Code reviews and understanding changes made

### For Deep Architectural Analysis

Reference: **[MODAL_DIALOG_ARCHITECTURE_STUDY.md](./MODAL_DIALOG_ARCHITECTURE_STUDY.md)**

- 6-layer modal architecture breakdown
- Current dialog problems identified
- Proposed solutions with code patterns
- Detailed implementation steps
- Key takeaways and lessons
- **Best for**: Learning the complete evolution of the architecture

---

## The Core Pattern

```
Hook (useDialog)
  └─ State: { type, data }
  └─ Openers: openDeleteDialog(), openRenameDialog(), etc.
  └─ All dialog logic in one place

    ↓ Context (DialogContext)
      └─ Provider wraps app
      └─ useGlobalDialog() hook gives access anywhere

        ↓ Registry (DIALOGS constants)
          └─ Type-safe dialog type enumeration
          └─ Prevents typos, enables refactoring

          ↓ Manager (DialogManager)
            └─ Single switch statement routes to components
            └─ Renders in AppContainer for correct z-index

            ↓ Components (DeleteDialog, SaveDialog, etc.)
              └─ Use hook for state
              └─ Receive callbacks via dialog.data
              └─ No lifecycle management needed
```

---

## File Structure

```
frontend/
├── src/
│   ├── contexts/
│   │   └── DialogContext.jsx      ← Provider + hook
│   ├── components/
│   │   └── dialogs/
│   │       ├── DialogManager.jsx  ← Central router
│   │       ├── dialogTypes.js      ← Type constants
│   │       ├── *.jsx              ← Dialog components
│   │       └── index.js           ← Exports
│   └── hooks/
│       └── useDialog.js           ← State management
│   └── app/
│       └── AppProvider.jsx        ← Includes DialogProvider
│   └── components/
│       └── layout/
│           └── AppContainer.jsx   ← Renders DialogManager
└── docs/
    └── architecture/
        ├── README.md              ← You are here
        ├── ARCHITECTURE_INSIGHTS.md
        ├── DIALOG_SYSTEM_REFERENCE.md
        ├── DIALOG_CENTRALIZATION_IMPLEMENTATION.md
        └── MODAL_DIALOG_ARCHITECTURE_STUDY.md
```

---

## Quick Examples

### Opening a Dialog from Any Component

```javascript
import { useGlobalDialog } from '@/contexts/DialogContext';

export default function MyPage() {
  const { openDeleteAssessmentDialog } = useGlobalDialog();

  const handleDelete = async (id) => {
    // ... deletion logic
  };

  return (
    <button
      onClick={() =>
        openDeleteAssessmentDialog({
          assessmentName: 'My Project',
          onConfirm: () => handleDelete(123),
          isLoading: isDeleting,
        })
      }
    >
      Delete
    </button>
  );
}
```

### Creating a New Dialog Type

1. Add constant to `dialogTypes.js`
2. Add opener function to `useDialog.js`
3. Add case to `DialogManager.jsx` switch
4. Create dialog component
5. Done!

See [DIALOG_SYSTEM_REFERENCE.md](./DIALOG_SYSTEM_REFERENCE.md#adding-new-dialog-types) for detailed instructions.

---

## Key Concepts

**Single Source of Truth**

- All dialog state in one hook (`useDialog`)
- Type + data model prevents synchronization bugs
- Loading states managed by parent components

**Zero Prop Drilling**

- Hook accessible from any component
- Callbacks passed through `dialog.data`
- No intermediary components needed

**Type Safety**

- Constants prevent typos
- Enables IDE autocomplete
- Refactoring is safe

**Separation of Concerns**

- Hook: State logic
- Context: Distribution
- Manager: Routing
- Component: Presentation

---

## Testing

Run the application and test:

- ✅ Open each dialog type from different pages
- ✅ Verify close on success, stay open on error
- ✅ Check loading states display correctly
- ✅ Confirm callbacks execute with correct data
- ✅ Test rapid click prevention (can't double-submit)

See [DIALOG_CENTRALIZATION_IMPLEMENTATION.md](./DIALOG_CENTRALIZATION_IMPLEMENTATION.md#testing-checklist) for complete testing checklist.

---

## For Questions

- "How do I use this?" → [DIALOG_SYSTEM_REFERENCE.md](./DIALOG_SYSTEM_REFERENCE.md)
- "How does it work?" → [ARCHITECTURE_INSIGHTS.md](./ARCHITECTURE_INSIGHTS.md)
- "What was changed?" → [DIALOG_CENTRALIZATION_IMPLEMENTATION.md](./DIALOG_CENTRALIZATION_IMPLEMENTATION.md)
- "Why this pattern?" → [MODAL_DIALOG_ARCHITECTURE_STUDY.md](./MODAL_DIALOG_ARCHITECTURE_STUDY.md)

---

Last updated: February 16, 2026
Pattern version: 1.0 (stable)
