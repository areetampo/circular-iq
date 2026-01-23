# 🗂️ Database Migration Quick Reference

## TL;DR - What You Need to Know

### Your old file is now split:

- **setup.sql** (Phase 1) - Documents + Search
- **migrations/001_assessments_system.sql** (Phase 2) - Portfolio + Analytics

### Safe to re-run?

✅ **YES** - Both files use `IF NOT EXISTS` and won't delete data

### How to deploy?

1. Run `setup.sql` once (initial setup)
2. Run embeddings (chunking pipeline)
3. Run `migrations/001_assessments_system.sql` once (assessment features)

### Can I run them again?

✅ **YES** - Safe to re-run without losing data

---

## File Sizes

| File                                  | Lines | Purpose                       |
| ------------------------------------- | ----- | ----------------------------- |
| setup.sql                             | 312   | Base infrastructure (Phase 1) |
| migrations/001_assessments_system.sql | 129   | Assessment tracking (Phase 2) |
| Total                                 | 441   | Combined functionality        |

---

## Running in Supabase

### Step 1: Phase 1 (Initial - do this first)

```
1. Open Supabase → SQL Editor
2. New Query
3. Copy/paste: backend/supabase/setup.sql
4. Click Run ✅
5. Wait for success message
```

### Step 2: Run Chunking Pipeline

```bash
cd backend
node scripts/chunk.js
node scripts/embed_and_store.js
```

### Step 3: Phase 2 (Assessment features)

```
1. Open Supabase → SQL Editor
2. New Query
3. Copy/paste: backend/supabase/migrations/001_assessments_system.sql
4. Click Run ✅
5. Wait for success message
```

---

## Verification

After each step, verify in Supabase SQL Editor:

```sql
-- After Phase 1:
SELECT COUNT(*) FROM documents;

-- After Phase 2:
SELECT COUNT(*) FROM assessments;
```

---

## Directory Structure

```
backend/supabase/
├── setup.sql                              ← Phase 1 (docs + search)
├── migrations/
│   └── 001_assessments_system.sql        ← Phase 2 (assessments)
├── README.md                              ← Full setup guide
└── migrations/ (for future phases)
    ├── 002_*.sql                         ← Phase 3 (when you build it)
    ├── 003_*.sql                         ← Phase 4 (when you build it)
    └── ...
```

---

## Common Questions

**Q: Can I re-run setup.sql?**
✅ Yes, it's safe. Won't delete documents.

**Q: Do I have to run migrations in order?**
✅ Yes. Run 001 → 002 → 003. Can't skip ahead.

**Q: Will migrations delete my assessments?**
✅ No, they only add/update structure. Data is preserved.

**Q: What if I mess up?**

- Reset everything:
  ```sql
  DROP TABLE IF EXISTS assessments CASCADE;
  DROP TABLE IF EXISTS documents CASCADE;
  ```
- Then re-run setup.sql and migrations in order

**Q: How do I track what I've run?**

- Optional: Keep a log in `backend/supabase/MIGRATION_LOG.md`:
  ```
  ✅ 2026-01-23 - setup.sql (Phase 1)
  ✅ 2026-01-23 - 001_assessments_system.sql (Phase 2)
  ```

---

## When to Use Each File

| Scenario                | Action                                   |
| ----------------------- | ---------------------------------------- |
| Fresh Supabase project  | Run setup.sql → pipeline → 001 migration |
| Adding Phase 2 features | Run 001 migration                        |
| Deploying to production | Run all migrations in order              |
| Resetting database      | Drop tables → re-run all                 |
| Adding Phase 3 features | Create 002\_\*.sql → run it              |

---

## File Safety Status

| File                       | `IF NOT EXISTS` | `DROP IF EXISTS` | Safe to Re-run? |
| -------------------------- | --------------- | ---------------- | --------------- |
| setup.sql                  | ✅ Yes          | ✅ Yes           | ✅ YES          |
| 001_assessments_system.sql | ✅ Yes          | ✅ Yes           | ✅ YES          |

---

## Performance Notes

- **setup.sql execution time**: ~2-5 seconds
- **001_assessments_system.sql time**: ~1-2 seconds
- **No data loss**: All re-runs safe
- **No downtime**: Execute anytime

---

## Support Resources

- 📚 **Full guide**: backend/supabase/README.md
- 📋 **Setup overview**: DATABASE_REORGANIZATION.md
- 🔗 **Supabase docs**: https://supabase.com/docs
- ❓ **Questions?**: Check README.md Troubleshooting section

---

**Last Updated**: January 23, 2026
**Status**: Production Ready ✅
**Version**: 1.0
