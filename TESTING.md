# Testing Auth Implementation

## Overview

The project now includes automated integration tests that validate the authentication system:
- ✓ Public routes are accessible without authentication
- ✓ Protected routes redirect to `/login` when no session exists
- ✓ Logout endpoint clears sessions and redirects
- ✓ Auth API endpoints remain publicly accessible
- ✓ Callback URLs are preserved during authentication flow

## Running Tests

### Prerequisites
Your application must be running on `http://localhost:3000`.

### Steps

1. **Start the dev server** in one terminal:
   ```bash
   npm run dev
   ```

2. **Run tests** in another terminal:
   ```bash
   npm test
   ```

### Expected Output

When all tests pass, you'll see:
```
🧪 Running Auth Integration Tests

Base URL: http://localhost:3000

✓ Public route /login should be accessible without authentication
✓ Public route /registro should be accessible without authentication
✓ Protected route / should redirect to /login when no session exists
✓ Logout endpoint POST /api/logout should exist and be callable
✓ Protected API route should return 401 or redirect when no session exists
✓ Auth endpoints /api/auth should be accessible
✓ Login redirect should preserve 'next' parameter

==================================================

Tests passed: 7/7

✓ All tests passed!
```

### Custom Base URL

To test against a different server:
```bash
TEST_BASE_URL=http://localhost:8080 npm test
```

## Test Details

| Test | Validates |
|------|-----------|
| Public /login | Unauthenticated users can access login page |
| Public /registro | Unauthenticated users can access registration page |
| Protected / | Unauthenticated users are redirected to /login |
| Logout endpoint | POST /api/logout exists and is callable |
| Protected API | API protection redirects or returns 401 |
| Auth endpoints | /api/auth/* routes bypass proxy protection |
| Callback preservation | `?next=` parameter is preserved in redirects |

## Troubleshooting

### "Cannot connect to http://localhost:3000"
- Ensure `npm run dev` is running in another terminal
- Check that your app is listening on port 3000

### "Logout endpoint not found"
- Verify `/api/logout` route is properly implemented
- Check [app/api/logout/route.ts](../app/api/logout/route.ts)

### "Auth endpoint not found"
- Verify Better Auth is configured at `/api/auth/[...all]`
- Check [app/api/auth/[...all]/route.ts](../app/api/auth/%5B...all%5D/route.ts)

### Tests timeout
- Increase timeout by setting `TEST_TIMEOUT` environment variable:
  ```bash
  TEST_TIMEOUT=10000 npm test
  ```

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Start dev server
  run: npm run dev &
  
- name: Wait for server
  run: sleep 5
  
- name: Run tests
  run: npm test
```

## Future Test Enhancements

Potential additions:
- E2E tests with Playwright (full login/logout flows)
- Session validation tests (verify session cookie is set/cleared)
- OAuth callback tests (simulate Google OAuth response)
- Database state verification (check session table after auth)
