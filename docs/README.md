# Documentation Index

Welcome to the project documentation. This guide will help you find what you need.

## 🏗️ Architecture & Design

For understanding how dialogs and modals work in this application, see the **[architecture/ folder](./architecture/README.md)**.

Quick links:

- **[Architecture Insights](./architecture/ARCHITECTURE_INSIGHTS.md)** - High-level pattern overview and benefits
- **[Dialog System Reference](./architecture/DIALOG_SYSTEM_REFERENCE.md)** - Practical guide for using the dialogs
- **[Implementation Details](./architecture/DIALOG_CENTRALIZATION_IMPLEMENTATION.md)** - What was built and why
- **[Deep Study](./architecture/MODAL_DIALOG_ARCHITECTURE_STUDY.md)** - Complete architectural analysis

## 📊 Business & Market

- **[Market Analysis](./market-analysis.md)** - Market research and analysis

## 🎯 For Different Roles

### Frontend Developers

1. Start with [DIALOG_SYSTEM_REFERENCE.md](./architecture/DIALOG_SYSTEM_REFERENCE.md) to learn how to use dialogs
2. Check [ARCHITECTURE_INSIGHTS.md](./architecture/ARCHITECTURE_INSIGHTS.md) for the reasoning
3. Reference the code in `frontend/src/components/dialogs/`

### Code Reviewers

Review against [DIALOG_CENTRALIZATION_IMPLEMENTATION.md](./architecture/DIALOG_CENTRALIZATION_IMPLEMENTATION.md) to understand what changed and why.

### Architects / Tech Leads

See [MODAL_DIALOG_ARCHITECTURE_STUDY.md](./architecture/MODAL_DIALOG_ARCHITECTURE_STUDY.md) for the full technical evolution and decision-making process.

### New Team Members

1. Read [ARCHITECTURE_INSIGHTS.md](./architecture/ARCHITECTURE_INSIGHTS.md) first (30 min)
2. Skim [DIALOG_SYSTEM_REFERENCE.md](./architecture/DIALOG_SYSTEM_REFERENCE.md) (15 min)
3. Try implementing a simple dialog (1 hour)

---

## 📚 Documentation Organization

```
docs/
├── README.md                 ← You are here
├── market-analysis.md        ← Business research
└── architecture/             ← Technical documentation
    ├── README.md             ← Navigation guide for architecture docs
    ├── ARCHITECTURE_INSIGHTS.md           ← Start here for understanding
    ├── DIALOG_SYSTEM_REFERENCE.md        ← Practical usage guide
    ├── DIALOG_CENTRALIZATION_IMPLEMENTATION.md  ← Implementation details
    └── MODAL_DIALOG_ARCHITECTURE_STUDY.md       ← Deep analysis
```

---

## 🚀 Quick Start

### I want to open a dialog

See [DIALOG_SYSTEM_REFERENCE.md](./architecture/DIALOG_SYSTEM_REFERENCE.md#using-dialogs-in-your-components)

### I want to create a new dialog type

See [DIALOG_SYSTEM_REFERENCE.md](./architecture/DIALOG_SYSTEM_REFERENCE.md#adding-new-dialog-types)

### I want to understand the pattern

See [ARCHITECTURE_INSIGHTS.md](./architecture/ARCHITECTURE_INSIGHTS.md)

### I want to review what was changed

See [DIALOG_CENTRALIZATION_IMPLEMENTATION.md](./architecture/DIALOG_CENTRALIZATION_IMPLEMENTATION.md)

---

Last updated: February 16, 2026
