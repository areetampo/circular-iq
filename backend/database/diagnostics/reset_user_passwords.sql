-- ============================================================
-- FILE: diagnostics/reset_user_passwords.sql
-- PURPOSE: Re-hash and update passwords for all app users.
--
-- WHEN TO RUN:
--   • After migrating to a new Supabase project — encrypted_password
--     hashes are NOT portable across projects (different salts).
--   • When a user needs a password reset and email delivery is
--     unavailable (this app uses @ce.internal, no real emails).
--   • After running recreate_users.sql if you want to change passwords.
--
-- HOW IT WORKS:
--   extensions.crypt() hashes the plaintext password with a fresh
--   bcrypt salt specific to this Supabase instance. The old hash
--   from a previous project will NOT work — always re-hash here.
--
-- PLACEHOLDERS — replace before running:
--   <USER_1_USERNAME>  e.g. liko  (used to target the right row)
--   <USER_1_PASSWORD>  desired new password
--   (repeat for each user)
--
-- SAFE TO RUN REPEATEDLY — each call generates a new salt/hash.
-- ============================================================

UPDATE auth.users
SET encrypted_password = extensions.crypt('<USER_1_PASSWORD>', extensions.gen_salt('bf'))
WHERE email = '<USER_1_USERNAME>@ce.internal';

UPDATE auth.users
SET encrypted_password = extensions.crypt('<USER_2_PASSWORD>', extensions.gen_salt('bf'))
WHERE email = '<USER_2_USERNAME>@ce.internal';

UPDATE auth.users
SET encrypted_password = extensions.crypt('<USER_3_PASSWORD>', extensions.gen_salt('bf'))
WHERE email = '<USER_3_USERNAME>@ce.internal';

-- ── Verify the update applied ─────────────────────────────────────────────────
SELECT id, email, updated_at
FROM auth.users
WHERE email IN (
    '<USER_1_USERNAME>@ce.internal',
    '<USER_2_USERNAME>@ce.internal',
    '<USER_3_USERNAME>@ce.internal'
)
ORDER BY email;
