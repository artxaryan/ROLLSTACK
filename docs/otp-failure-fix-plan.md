# OTP Sending Failure - Production Fix Plan

## Problem Summary
User gets "Failed to send OTP, Please try again" in production despite all variables being "implemented".

## Root Causes Identified

### 1. Client Server URL Mismatch (CRITICAL)
**File:** `apps/web/.env`
```
NEXT_PUBLIC_SERVER_URL=http://localhost:3001  ← LOCALHOST!
```

In production, the Next.js client still sends requests to `localhost:3001` instead of the deployed server.

**Fix:** Set `NEXT_PUBLIC_SERVER_URL=https://your-server.vercel.app` in Vercel environment variables for the **web** app.

---

### 2. CORS Origin Defaulting to Localhost (CRITICAL)
**File:** `apps/server/src/index.ts:19`
```typescript
origin: process.env.CORS_ORIGIN || "http://localhost:3001",
```

**File:** `packages/auth/src/index.ts:23`
```typescript
trustedOrigins: [process.env.CORS_ORIGIN ?? "http://localhost:3001"],
```

If `CORS_ORIGIN` isn't set in Vercel, requests from production web app are blocked.

**Fix:** Set `CORS_ORIGIN=https://your-web.vercel.app` in Vercel environment variables for the **server** app.

---

### 3. Missing Brevo Credentials (LIKELY)
**File:** `packages/env/src/server.ts:15-16`
```typescript
BREVO_API_KEY: z.string().min(1).optional(),  // OPTIONAL but required!
BREVO_SENDER_EMAIL: z.string().email().optional(),
```

The env schema marks Brevo credentials as optional, but they're actually required for OTP to work.

**Fix Options:**
- Option A: Set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` in Vercel server environment
- Option B: Add validation that fails fast if Brevo credentials are missing

---

### 4. Better Auth URL Mismatch (POSSIBLE)
**File:** `packages/auth/src/index.ts` uses `BETTER_AUTH_URL` env var automatically.

If `BETTER_AUTH_URL=https://localhost:3000` in production, session cookies won't work correctly.

**Fix:** Ensure `BETTER_AUTH_URL=https://your-server.vercel.app` in Vercel server environment.

---

## Immediate Fixes Required

### Step 1: Vercel Environment Variables

**For the Server app on Vercel:**
| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `BETTER_AUTH_SECRET` | `rX2Tbkmos7BiEUHuL/PMK9a2qnSJtkbhGbOeH8bkGKE=` | Use new generated secret |
| `BETTER_AUTH_URL` | `https://your-server-app.vercel.app` | No trailing slash |
| `CORS_ORIGIN` | `https://your-web-app.vercel.app` | Must match web app URL |
| `DATABASE_URL` | Neon production connection string | |
| `BREVO_API_KEY` | Your Brevo API key | Required for OTP |
| `BREVO_SENDER_EMAIL` | `your@email.com` | Must be verified in Brevo |

**For the Web app on Vercel:**
| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SERVER_URL` | `https://your-server-app.vercel.app` | CRITICAL - must point to server |

---

### Step 2: Verify Brevo Configuration

1. Log into Brevo (SendinBlue)
2. Check if API key is active: https://app.brevo.com/settings/keys
3. Verify sender email is verified: https://app.brevo.com/settings/senders
4. Check email quota: Free tier = 100 emails/day

---

### Step 3: Debug the Error Response

**Add better error logging to understand what's failing:**

The current code catches errors but doesn't log the actual error message:

```typescript
// Current (sign-in-form.tsx:44-45)
} catch (_err) {
  toast.error("Failed to send OTP. Please try again.");
}
```

The server DOES log the error (`packages/auth/src/index.ts:105`):
```typescript
console.error("[Auth] Email send failed:", errorMsg);
```

**Check Vercel logs** for `[Auth] Email send failed:` to see the actual error.

---

## Code Changes (If Needed)

### 1. Make Brevo Credentials Required in Env Schema
**File:** `packages/env/src/server.ts`

Change from optional to required:
```typescript
BREVO_API_KEY: z.string().min(1),  // Required
BREVO_SENDER_EMAIL: z.string().email(),  // Required
```

---

### 2. Add Better Error Propagation
**File:** `packages/auth/src/index.ts`

The current error handling throws but doesn't include enough context. Consider adding more specific error codes.

---

### 3. Verify Cookie Configuration for Cross-Origin
**File:** `packages/auth/src/index.ts:52-58`

The current cookie config:
```typescript
advanced: {
  defaultCookieAttributes: {
    sameSite: "none",
    secure: true,
    httpOnly: true,
  },
},
```

This is correct for cross-origin (server on different domain than web), but requires HTTPS everywhere.

---

## Verification Steps

1. **Check Vercel logs** for the server app:
   ```bash
   vercel logs your-server-app
   ```
   Look for `[Auth] Email send failed:` messages.

2. **Test locally with production-like settings:**
   - Set `CORS_ORIGIN=http://localhost:3001` in server .env
   - Make sure `NEXT_PUBLIC_SERVER_URL=http://localhost:3001` in web .env
   - Run both apps and test OTP flow

3. **Verify CORS headers:**
   ```bash
   curl -X OPTIONS https://your-server.vercel.app/api/auth/email-otp/send \
     -H "Origin: https://your-web.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

---

## Summary Checklist

- [ ] Set `NEXT_PUBLIC_SERVER_URL` in Vercel web app environment
- [ ] Set `CORS_ORIGIN` in Vercel server app environment  
- [ ] Set `BETTER_AUTH_URL` in Vercel server app environment
- [ ] Set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` in Vercel server app environment
- [ ] Check Vercel server logs for actual error message
- [ ] Verify Brevo account has available email quota
- [ ] Rotate Brevo API key if it's the one from .env file (compromised)
