# Owner Tasks (Auth priority)

This file tracks tasks that require the project owner to act directly.
Update this list as the auth plan evolves.

## 1. Supabase Auth settings
- Enable Email auth in Supabase project.
- Decide email auth mode:
  - Password + email confirmation, or
  - Magic link (passwordless).
- Configure email templates (signup, magic link, reset) if needed.
- Verify redirect URLs for dev and prod.

## 2. Google OAuth settings
- Create Google OAuth client (web).
- Register authorized redirect URIs for Supabase:
  - https://<your-supabase-project>.supabase.co/auth/v1/callback
- Add authorized JavaScript origins:
  - http://localhost:3000
  - https://<your-prod-domain>
- Set client ID/secret in Supabase Auth Provider settings.

## 3. Environment variables
- Provide values for:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (if used on server only)
- Ensure Vercel env vars match local.

## 4. Domain and redirect policy
- Confirm production domain (Vercel) and any custom domain.
- Confirm auth callback routes used by app:
  - /auth/callback
  - /login, /signup
- Share final list of redirect URLs for all environments.

## 5. Security policy decisions
- Decide whether to require email confirmation before login.
- Decide session duration and refresh behavior (Supabase defaults vs custom).
