# Vibe Square Testing Strategy (Unit Tests & Edge Cases)

This document defines the testing scenarios for the Vibe Square project, optimized for execution via **Test Sprite MCP**.

## 1. API Core Service (`ApiService`)
**Path:** `src/app/core/api.service.ts`

### Unit Tests
- **Base URL Cleanup:** Verify that `apiUrl` is correctly formatted and trailing slashes are removed during initialization.
- **Request Headers:** Ensure `Content-Type: application/json` is added to all JSON requests.
- **Authorization Attachment:** Confirm that if `gallery_access_token` exists in `localStorage`, it is automatically appended to the `Authorization` header.
- **URL Formatting:** Test that `formatUrl` adds a leading slash if missing before sending the request.

### Edge Cases
- **Missing Token:** Ensure requests proceed without an `Authorization` header if the token is null in `localStorage`.
- **Blob Handling:** Verify that `postBlob` and `getFile` correctly set `responseType: 'blob'` to prevent JSON parsing errors on binary data.
- **Empty Body Requests:** Test `patch` or `put` methods with a null body to ensure they don't crash the interceptor.

---

## 2. Authentication Service (`AuthService`)
**Path:** `src/app/core/auth/services/auth.service.ts`

### Unit Tests
- **Login Flow:** Verify that a successful login stores both the `accessToken` and `user` object in `localStorage` and updates signals.
- **Session Loading:** Test that `loadSession()` correctly populates the `currentUser` signal from cached data.
- **Logout Cleanliness:** Confirm that `logout()` clears all items from `localStorage` and resets `isAuthenticated` to false.
- **Refresh Token Logic:** Ensure `refreshToken()` updates only the `accessToken` in storage without affecting the user object.

### Edge Cases
- **Corrupted Cache:** Simulate invalid JSON in `gallery_user` storage and ensure the app handles the parse error gracefully without crashing.
- **Refresh Failure (401):** Test that if `refreshToken()` fails, the service triggers `clearSession()` and redirects to `/login`.
- **OAuth Callback with No Token:** Handle cases where the OAuth redirect happens but the token parameter is missing or empty.

---

## 3. Analysis Logic (`AnalysisService`)
**Path:** `src/app/core/services/analysis.service.ts`

### Unit Tests
- **Estimation Accuracy:** Verify that `estimate()` sends the correct URL and parses the `estimatedTokens` correctly from the response.
- **State Management:** Confirm that the `isAnalyzing` signal transitions from `idle` -> `estimating` -> `analyzing` -> `completed`.

### Edge Cases
- **Quota Exceeded (402):** Mock a 402 error from the server and ensure the service triggers the `QuotaExceededModal`.
- **Invalid Target URL:** Test sending an malformed URL (e.g., "not-a-website") to see if the service or interceptor catches the error before the server call.
- **Interrupted Analysis:** Test behavior when the user navigates away or refreshes the page while a request is in the "analyzing" state.

---

## 4. Navigation & Guards
**Path:** `src/app/core/auth/guards/`

### Unit Tests
- **AuthGuard (Protected):** Ensure it returns `true` for authenticated users and a `UrlTree` (to `/login`) for guests.
- **GuestGuard (Restricted):** Ensure it prevents authenticated users from reaching the `/login` or `/register` pages.

### Edge Cases
- **Deep Linking:** Test the `returnUrl` logic in `AuthGuard` to ensure users are sent back to their original destination after logging in.

---

## 5. Subscription & Quota Management
**Path:** `src/app/core/services/quota.service.ts`

### Unit Tests
- **Progress Calculation:** Verify the math for `percentUsed` based on `used` and `limit` values.
- **Urgency State:** Confirm that `isLowQuota` returns true when the remaining tokens are below the threshold (e.g., 10%).

### Edge Cases
- **Zero Limit:** Handle cases where the `limit` might be 0 (edge case for new/unverified accounts) to avoid "Division by Zero" errors.
- **Negative Remaining:** Handle cases where the server reports usage slightly over the limit before the next sync.

---

## Execution Instructions for Test Sprite MCP
1. **Context Awareness:** Load the `repomix-output.xml` to understand the dependency injection tree.
2. **Framework:** Use `Angular/Jasmine` with `HttpClientTestingModule`.
3. **Mocks:** Mock the `localStorage` and `ToastService` to prevent side effects during unit testing.