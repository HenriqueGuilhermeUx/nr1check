# NR1Check/MindCompliance — iOS preparation only

Status: **unverified product identity**. This is an exploratory candidate wrapper of the existing NR1Check monorepo web app. It must NOT be registered, distributed, or described as MindCompliance until the exact Google Play app/repository is confirmed.

Candidate bundle identifier `br.com.alternativeventures.nr1check.ioscandidate` is intentionally **not final**. Final Apple identifier must be selected after matching the live Android product.

Technical blockers before real iOS functionality:
- `apps/web/src/main.tsx` throws when `VITE_CLERK_PUBLISHABLE_KEY` is absent; CI compiling the UI does **not** prove login or runtime success.
- Default `VITE_API_BASE_URL` is `http://localhost:3000`; this cannot work as a backend from a real iPhone. Configure HTTPS production endpoint with explicit approval.
- Clerk sign-in redirects, deep links, session persistence, origin/CORS, consent/privacy/deletion require device testing.
- Apple review requires a usable native experience, not just packaging a website.
- Confirm Play Store identity and app ownership before replacing the candidate bundle identifier.

This isolated branch adds simulator preflight only; it does not modify Android, deploy production or submit to Apple. Homologation, signing and App Store operations are explicitly deferred to Phase 2.
