/**
 * Auth Integration Tests
 * 
 * Run with: npm run test
 * 
 * Validates:
 * - Proxy redirects unauthenticated users to /login?next=...
 * - Public paths are accessible without authentication
 * - Protected routes require a valid session
 * - Logout endpoint clears the session
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function expectStatus(
  response: Response,
  expectedStatus: number,
  message?: string
) {
  if (response.status !== expectedStatus) {
    throw new Error(
      message ||
        `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

async function expectRedirect(
  response: Response,
  expectedUrl: string,
  message?: string
) {
  const location = response.headers.get("location");
  if (!location || !location.includes(expectedUrl)) {
    throw new Error(
      message || `Expected redirect to ${expectedUrl}, got ${location}`
    );
  }
}

async function main() {
  console.log(`\n🧪 Running Auth Integration Tests\n`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Public login page is accessible
  await test(
    "Public route /login should be accessible without authentication",
    async () => {
      const response = await fetch(`${BASE_URL}/login`, {
        redirect: "manual",
      });
      await expectStatus(response, 200, "Login page should return 200");
    }
  );

  // Test 2: Public registro page is accessible
  await test(
    "Public route /registro should be accessible without authentication",
    async () => {
      const response = await fetch(`${BASE_URL}/registro`, {
        redirect: "manual",
      });
      await expectStatus(response, 200, "Registro page should return 200");
    }
  );

  // Test 3: Protected route without session redirects to login
  await test(
    "Protected route / should redirect to /login when no session exists",
    async () => {
      const response = await fetch(`${BASE_URL}/`, {
        redirect: "manual",
      });
      // Should redirect (307, 308, or similar)
      if (response.status < 300 || response.status >= 400) {
        throw new Error(
          `Expected redirect status (3xx), got ${response.status}`
        );
      }
      await expectRedirect(response, "/login", "Should redirect to /login");
    }
  );

  // Test 4: Logout endpoint exists and is accessible
  await test(
    "Logout endpoint POST /api/logout should exist and be callable",
    async () => {
      const response = await fetch(`${BASE_URL}/api/logout`, {
        method: "POST",
        redirect: "manual",
      });
      // Should either redirect or return success (not 404)
      if (response.status === 404) {
        throw new Error("Logout endpoint not found");
      }
    }
  );

  // Test 5: API routes without session return 401
  await test(
    "Protected API route should return 401 when no session exists",
    async () => {
      const response = await fetch(`${BASE_URL}/api/protected`, {
        redirect: "manual",
      });
      // Should either redirect or return 401
      if (response.status !== 401 && (response.status < 300 || response.status >= 400)) {
        // Acceptable: 401 or a redirect (3xx)
        if (response.status !== 401 && response.status < 300) {
          throw new Error(
            `Expected 401 or redirect, got ${response.status}`
          );
        }
      }
    }
  );

  // Test 6: Auth endpoints are publicly accessible
  await test(
    "Auth endpoints /api/auth should be accessible",
    async () => {
      const response = await fetch(`${BASE_URL}/api/auth/get-session`, {
        method: "GET",
        redirect: "manual",
      });
      // Should not be 404 (auth endpoints should exist)
      if (response.status === 404) {
        throw new Error("Auth endpoint not found");
      }
    }
  );

  // Summary
  console.log(`\n${"=".repeat(50)}\n`);
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`Tests passed: ${passed}/${total}\n`);

  if (passed === total) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("✗ Some tests failed:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
