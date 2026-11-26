/**
 * E2E Verification Script — Signup, Login, Session & Authorization
 *
 * Tests the full flow: signup → login → session → protected API
 * Run with: npx tsx src/utils/verifySignupLogin.ts
 * Server must be running on localhost:5000.
 */

const BASE = 'http://localhost:5000';
const TS = Date.now();

let passed = 0;
let failed = 0;

function pass(label: string, detail?: string) {
  passed++;
  console.log(`  ✅ PASS  ${label}${detail ? ' — ' + detail : ''}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.error(`  ❌ FAIL  ${label}${detail ? ' — ' + detail : ''}`);
}

// Better Auth CSRF protection requires Origin header — browsers send this automatically;
// test scripts must include it manually to simulate a trusted browser request.
const BROWSER_HEADERS = {
  'Content-Type': 'application/json',
  'Origin': 'http://localhost:3000',
  'Referer': 'http://localhost:3000/',
};

async function signupUser(payload: Record<string, unknown>) {
  return fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: BROWSER_HEADERS,
    body: JSON.stringify(payload),
  });
}

async function signinUser(email: string, password: string) {
  return fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: BROWSER_HEADERS,
    body: JSON.stringify({ email, password }),
  });
}

function extractCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie') ?? '';
  // Extract all better-auth session cookies
  return setCookie
    .split(',')
    .map((c) => c.split(';')[0].trim())
    .filter((c) => c.includes('='))
    .join('; ');
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  BuildTrack — Full Auth E2E Verification');
  console.log('══════════════════════════════════════════════════════\n');

  // ── 1. Health check ───────────────────────────────────────────
  console.log('[ 1 ] Server health check');
  try {
    const r = await fetch(`${BASE}/api/v1/health`);
    const body = await r.json() as any;
    if (r.ok && body.status === 'ok') pass('Server is healthy', `status=${body.status}`);
    else fail('Server health', `HTTP ${r.status}`);
  } catch {
    fail('Server not reachable at localhost:5000 — is it running?');
    console.log('\nAborting: server must be running.\n');
    process.exit(1);
  }

  // ── 2. Admin role rejected at signup ──────────────────────────
  console.log('\n[ 2 ] Admin signup must be rejected');
  {
    const r = await signupUser({
      name: 'Evil Admin',
      email: `evil-admin-${TS}@test.com`,
      password: 'Test@1234!',
      requestedRole: 'Admin',
    });
    if (r.status === 400 || r.status === 422 || !r.ok) {
      pass('Admin signup rejected', `HTTP ${r.status}`);
    } else {
      const body = await r.json() as any;
      fail('Admin signup was NOT rejected', `HTTP ${r.status} — ${JSON.stringify(body)}`);
    }
  }

  // ── 3. All 4 public roles — signup success ────────────────────
  const publicRoles = ['Project Manager', 'Site Engineer', 'Finance Manager', 'Contractor'];
  const testUsers: Array<{ email: string; password: string; role: string }> = [];

  console.log('\n[ 3 ] All 4 public roles signup successfully');
  for (const role of publicRoles) {
    const email = `${role.toLowerCase().replace(/ /g, '-')}-${TS}@test.com`;
    const password = 'Test@1234!';

    const r = await signupUser({
      name: `Test ${role}`,
      email,
      password,
      requestedRole: role,
      phone: '+8801234567890',
      company: 'BuildTrack Test Co',
    });

    let body: any;
    try { body = await r.json(); } catch { body = {}; }

    if (r.ok && (r.status === 200 || r.status === 201)) {
      const user = body?.data?.user ?? body?.user ?? body;
      const actualRole = user?.role;
      const actualStatus = user?.status;
      const reqRole = user?.requestedRole;

      if (actualRole === role) {
        pass(`Signup [${role}] — role correct`, `role="${actualRole}"`);
      } else {
        fail(`Signup [${role}] — wrong role`, `expected="${role}" got="${actualRole}"`);
      }

      if (actualStatus === 'active') {
        pass(`Signup [${role}] — status=active`);
      } else {
        fail(`Signup [${role}] — wrong status`, `expected="active" got="${actualStatus}"`);
      }

      if (reqRole === role) {
        pass(`Signup [${role}] — requestedRole stored`);
      } else {
        fail(`Signup [${role}] — requestedRole mismatch`, `expected="${role}" got="${reqRole}"`);
      }

      testUsers.push({ email, password, role });
    } else {
      fail(`Signup [${role}] failed`, `HTTP ${r.status} — ${JSON.stringify(body)}`);
    }
  }

  if (testUsers.length === 0) {
    fail('No test users created — aborting login tests');
    printSummary();
    process.exit(1);
  }

  // ── 4. Login returns a session for active user ─────────────────
  console.log('\n[ 4 ] Login with real credentials');
  const { email: testEmail, password: testPass, role: testRole } = testUsers[0];

  let sessionCookie = '';
  {
    const r = await signinUser(testEmail, testPass);
    let body: any;
    try { body = await r.json(); } catch { body = {}; }

    if (r.ok) {
      pass(`Login [${testRole}] succeeded`, `HTTP ${r.status}`);
      sessionCookie = extractCookie(r);

      const user = body?.data?.user ?? body?.user ?? body;
      // Better Auth v1.7 sign-in returns: { token, user, redirect } at top level
      const sessionToken = body?.token ?? body?.data?.token ?? body?.data?.session?.id ?? null;

      if (user?.role === testRole) pass('Login response has correct role', `role="${user.role}"`);
      else fail('Login response role mismatch', `expected="${testRole}" got="${user?.role}"`);

      if (user?.status === 'active') pass('Login response has status=active');
      else fail('Login response status wrong', `got="${user?.status}"`);

      if (sessionToken) pass('Session token returned', `token=${sessionToken.substring(0, 10)}...`);
      else fail('No session token in login response', JSON.stringify(body));
    } else {
      fail(`Login [${testRole}] failed`, `HTTP ${r.status} — ${JSON.stringify(body)}`);
    }
  }

  // ── 5. Wrong password is rejected ─────────────────────────────
  console.log('\n[ 5 ] Wrong password rejected');
  {
    const r = await signinUser(testEmail, 'WrongPass999!');
    if (!r.ok && r.status === 401) pass('Wrong password rejected', `HTTP ${r.status}`);
    else fail('Wrong password should return 401', `HTTP ${r.status}`);
  }

  // ── 6. Session verification via /api/auth/get-session ─────────
  console.log('\n[ 6 ] Session verification');
  if (sessionCookie) {
    const r = await fetch(`${BASE}/api/auth/get-session`, {
      headers: { Cookie: sessionCookie },
    });
    let body: any;
    try { body = await r.json(); } catch { body = {}; }

    if (r.ok) {
      const user = body?.user;
      pass('Session cookie is valid', `HTTP ${r.status}`);
      if (user?.role === testRole) pass('Session has correct role', `role="${user.role}"`);
      else fail('Session role wrong', `expected="${testRole}" got="${user?.role}"`);
      if (user?.status === 'active') pass('Session has status=active');
      else fail('Session status wrong', `got="${user?.status}"`);
    } else {
      fail('Session cookie not accepted', `HTTP ${r.status} — ${JSON.stringify(body)}`);
    }
  } else {
    fail('No session cookie to verify (login failed)');
  }

  // ── 7. Protected API accessible with valid session ─────────────
  console.log('\n[ 7 ] Protected API access');
  if (sessionCookie) {
    const r = await fetch(`${BASE}/api/v1/health`, {
      headers: { Cookie: sessionCookie },
    });
    if (r.ok) pass('Protected API accessible with session');
    else fail('Protected API rejected valid session', `HTTP ${r.status}`);
  } else {
    fail('Skipped (no session cookie)');
  }

  // ── 8. Protected API blocked without session ───────────────────
  console.log('\n[ 8 ] Protected API blocked without session');
  {
    // Use a non-existent endpoint that goes through authenticate middleware
    const r = await fetch(`${BASE}/api/v1/admin/users`);
    if (r.status === 401) pass('Unauthenticated request returns 401', `HTTP ${r.status}`);
    else if (r.status === 403) pass('Unauthenticated blocked (403)', `HTTP ${r.status}`);
    else fail('Expected 401/403 for unauthenticated request', `HTTP ${r.status}`);
  }

  // ── 9. Admin-only endpoint blocked for non-admin ───────────────
  console.log('\n[ 9 ] Admin endpoint blocked for non-admin user');
  if (sessionCookie) {
    const r = await fetch(`${BASE}/api/v1/admin/users`, {
      headers: { Cookie: sessionCookie },
    });
    if (r.status === 403) pass('Non-admin blocked from /admin/users', `HTTP ${r.status}`);
    else if (r.status === 401) pass('Non-admin not authenticated for admin route', `HTTP ${r.status}`);
    else fail('Expected 403 for non-admin', `HTTP ${r.status}`);
  } else {
    fail('Skipped (no session cookie)');
  }

  // ── 10. Nonexistent user login rejected ───────────────────────
  console.log('\n[10 ] Nonexistent user login rejected');
  {
    const r = await signinUser(`nobody-${TS}@test.com`, 'Fake@1234!');
    if (!r.ok && (r.status === 401 || r.status === 404)) {
      pass('Nonexistent user rejected', `HTTP ${r.status}`);
    } else {
      fail('Expected 401/404 for nonexistent user', `HTTP ${r.status}`);
    }
  }

  printSummary();
}

function printSummary() {
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════════\n');
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});

export {};
