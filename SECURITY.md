# Security maintenance

Never commit server credentials. Store production secrets in Appwrite function variables; use ignored environment files locally. Every VITE_ value is exposed to browsers. Authentication and permissions must be enforced by Appwrite/the backend, not just route guards.

## Deploying the security updates

1. Run `npm ci`, `npm run build`, and `node --test scripts/security.test.mjs appwrite/functions/admin/admin.test.js appwrite/functions/ai-advisor/security.test.js`.
2. Provide `APPWRITE_API_KEY` securely in the shell environment. Run `node scripts/setup-security.mjs` to prepare the private quota collection. Never paste the key into source or command history.
3. Set `SECURITY_ENABLE_FUNCTION_SCOPES=1` and rerun the setup script immediately before deploying the AI function. Clear the flag afterward. This grants the dynamic function key document read/write access, required for quota enforcement. Keep function execute permissions restricted to verified users.
4. Deploy both admin and ai-advisor functions, including their respective rateLimit.js files. Keep admin execution restricted to the admin label. Deploy the frontend production build.
5. After the new frontend is active, set `SECURITY_LOCK_USERNAMES=1` and rerun setup to restrict username creation to verified users. Clear the flag afterward. Do not restore anonymous creation when rolling back; use a compatible frontend.
6. Clear APPWRITE_API_KEY from the shell. Manually verify signup/email verification, OAuth, map, admin editing and AI requests. Check deployment logs for generic errors without exposing credentials.

The current quotas are 5 AI requests/minute and 100/day per user, and 60 admin actions/minute per user. They fail closed when quota storage is unavailable. They do not impose a project-wide AI spending cap.

For periodic cleanup, set SECURITY_CLEAN_COUNTERS=1 and run the same setup script with a securely supplied server key. Clear the flag and key afterward. Cleanup removes counters expired more than one day ago. Schedule this in your trusted operations environment; no scheduler is installed by this script.

Production CSP is injected into index.html during builds. Review it when adding external services. Frame restrictions and Permissions-Policy require HTTP response headers at hosting/edge level; a meta tag cannot enforce frame-ancestors. Keep HSTS and nosniff enabled.

Use MFA for administrators, review Appwrite session/password policies, rotate exposed credentials, and retain recoverable database backups. Public catalog data can have public read permissions; private user records require explicit owner access. Never authorize administrators using user-editable preferences.
