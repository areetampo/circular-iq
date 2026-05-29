-- ============================================================
-- FILE: diagnostics/recreate_users.sql
-- PURPOSE: Wipe and fully reconstruct all auth.users, auth.identities,
--          and public.profiles rows for this app's user accounts.
--
-- WHEN TO RUN:
--   • After a pg_restore where auth.users was not included
--   • When login breaks due to corrupted or missing auth rows
--   • When migrating to a new Supabase project
--
-- IMPORTANT NOTES:
--   • Runs in replica mode to suppress triggers during deletion/insertion.
--   • Passwords are re-hashed with the new project's salt via extensions.crypt().
--     This means users MUST use the passwords set in this script going forward —
--     old hashes from the previous project are NOT portable across projects.
--   • After running, also run reset_permissions.sql to ensure grants are correct.
--   • The Send Email auth hook must be registered in Dashboard →
--     Authentication → Hooks → Send Email → supabase_noop_send_email.
--
-- PLACEHOLDERS — replace before running:
--   <USER_1_UUID>      e.g. 092d0a9a-52c3-4355-a55a-8aeabb2cec5b
--   <USER_1_USERNAME>  e.g. liko
--   <USER_1_PASSWORD>  desired login password
--   <USER_1_EMAIL_CONFIRMED_AT>  original confirmation timestamp
--   <USER_1_CREATED_AT>          original created_at timestamp
--   <USER_1_UPDATED_AT>          original updated_at timestamp
--   <USER_1_ASSESSMENT_COUNT>    from old profiles row
--   <USER_1_LAST_ASSESSMENT_AT>  from old profiles row (or NULL)
--   (repeat for USER_2, USER_3, etc.)
-- ============================================================

BEGIN;

-- ── Step 1: replica mode suppresses all triggers during wipe/insert ──────────
SET local session_replication_role = 'replica';

-- ── Step 2: wipe existing rows in dependency order ───────────────────────────
-- user_assessments cascade-deletes when profiles are deleted,
-- so wipe identities and profiles first, then users.
DELETE FROM auth.identities
WHERE user_id IN (
    '<USER_1_UUID>',
    '<USER_2_UUID>',
    '<USER_3_UUID>'
);

DELETE FROM public.profiles
WHERE id IN (
    '<USER_1_UUID>',
    '<USER_2_UUID>',
    '<USER_3_UUID>'
);

DELETE FROM auth.users
WHERE id IN (
    '<USER_1_UUID>',
    '<USER_2_UUID>',
    '<USER_3_UUID>'
);

-- ── Step 3: insert auth.users rows ───────────────────────────────────────────
-- encrypted_password uses extensions.crypt() with the new project's salt.
-- instance_id is pulled from existing users or falls back to the zero UUID.
DO $$
DECLARE
    v_instance_id uuid;
BEGIN
    SELECT instance_id INTO v_instance_id
    FROM auth.users
    WHERE instance_id IS NOT NULL
    LIMIT 1;

    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_user_meta_data, role, aud, is_sso_user,
        -- Token columns must be '' not NULL — Supabase Auth scan fails on NULL
        confirmation_token, recovery_token, email_change_token_new,
        email_change, phone_change, phone_change_token,
        email_change_token_current, reauthentication_token
    ) VALUES
    (
        '<USER_1_UUID>',
        v_instance_id,
        '<USER_1_USERNAME>@ce.internal',
        extensions.crypt('<USER_1_PASSWORD>', extensions.gen_salt('bf')),
        '<USER_1_EMAIL_CONFIRMED_AT>',
        '<USER_1_CREATED_AT>',
        '<USER_1_UPDATED_AT>',
        jsonb_build_object('username', '<USER_1_USERNAME>', 'email_verified', true),
        'authenticated', 'authenticated', false,
        '', '', '', '', '', '', '', ''
    ),
    (
        '<USER_2_UUID>',
        v_instance_id,
        '<USER_2_USERNAME>@ce.internal',
        extensions.crypt('<USER_2_PASSWORD>', extensions.gen_salt('bf')),
        '<USER_2_EMAIL_CONFIRMED_AT>',
        '<USER_2_CREATED_AT>',
        '<USER_2_UPDATED_AT>',
        jsonb_build_object('username', '<USER_2_USERNAME>', 'email_verified', true),
        'authenticated', 'authenticated', false,
        '', '', '', '', '', '', '', ''
    ),
    (
        '<USER_3_UUID>',
        v_instance_id,
        '<USER_3_USERNAME>@ce.internal',
        extensions.crypt('<USER_3_PASSWORD>', extensions.gen_salt('bf')),
        '<USER_3_EMAIL_CONFIRMED_AT>',
        '<USER_3_CREATED_AT>',
        '<USER_3_UPDATED_AT>',
        jsonb_build_object('username', '<USER_3_USERNAME>', 'email_verified', true),
        'authenticated', 'authenticated', false,
        '', '', '', '', '', '', '', ''
    );
END $$;

-- ── Step 4: link auth.identities (email provider) ────────────────────────────
INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
) VALUES
(
    '<USER_1_UUID>', '<USER_1_UUID>',
    jsonb_build_object('sub', '<USER_1_UUID>', 'email', '<USER_1_USERNAME>@ce.internal'),
    'email', '<USER_1_USERNAME>@ce.internal',
    NOW(), '<USER_1_CREATED_AT>', '<USER_1_UPDATED_AT>'
),
(
    '<USER_2_UUID>', '<USER_2_UUID>',
    jsonb_build_object('sub', '<USER_2_UUID>', 'email', '<USER_2_USERNAME>@ce.internal'),
    'email', '<USER_2_USERNAME>@ce.internal',
    NOW(), '<USER_2_CREATED_AT>', '<USER_2_UPDATED_AT>'
),
(
    '<USER_3_UUID>', '<USER_3_UUID>',
    jsonb_build_object('sub', '<USER_3_UUID>', 'email', '<USER_3_USERNAME>@ce.internal'),
    'email', '<USER_3_USERNAME>@ce.internal',
    NOW(), '<USER_3_CREATED_AT>', '<USER_3_UPDATED_AT>'
);

-- ── Step 5: restore profiles rows with historical counters ───────────────────
-- assessment_count and last_assessment_at should match the old project's values.
-- If restoring after a cascade delete, re-run the user_assessments pg_dump
-- restore after this script to repopulate the actual assessment rows.
INSERT INTO public.profiles (
    id, username, display_name, avatar_url, bio, preferred_industry,
    assessment_count, last_assessment_at, created_at, updated_at
) VALUES
(
    '<USER_1_UUID>', '<USER_1_USERNAME>',
    NULL, NULL, NULL, NULL,
    <USER_1_ASSESSMENT_COUNT>,
    <USER_1_LAST_ASSESSMENT_AT>,   -- use NULL if no assessments
    '<USER_1_CREATED_AT>',
    '<USER_1_UPDATED_AT>'
),
(
    '<USER_2_UUID>', '<USER_2_USERNAME>',
    NULL, NULL, NULL, NULL,
    <USER_2_ASSESSMENT_COUNT>,
    <USER_2_LAST_ASSESSMENT_AT>,
    '<USER_2_CREATED_AT>',
    '<USER_2_UPDATED_AT>'
),
(
    '<USER_3_UUID>', '<USER_3_USERNAME>',
    NULL, NULL, NULL, NULL,
    <USER_3_ASSESSMENT_COUNT>,
    <USER_3_LAST_ASSESSMENT_AT>,
    '<USER_3_CREATED_AT>',
    '<USER_3_UPDATED_AT>'
);

-- ── Step 6: restore normal trigger behaviour ──────────────────────────────────
SET local session_replication_role = 'origin';

COMMIT;

-- ── Post-run checklist ────────────────────────────────────────────────────────
-- 1. Run reset_permissions.sql to ensure all grants are correct.
-- 2. Verify auth triggers exist:
--      SELECT trigger_name FROM information_schema.triggers
--      WHERE event_object_schema = 'auth' AND event_object_table = 'users';
-- 3. Verify users appear in Dashboard → Authentication → Users.
-- 4. Test login for each user.
