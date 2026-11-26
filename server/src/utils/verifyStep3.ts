/**
 * Step 3 Verification Script
 * Tests the signup flow end-to-end against the real Express + MongoDB backend.
 *
 * Usage: npx tsx src/utils/verifyStep3.ts
 * Server must be running on localhost:5000.
 */

const BASE = 'http://localhost:5000';
const SIGNUP_URL = `${BASE}/api/auth/sign-up/email`;

let pass = 0;
let fail = 0;

async function test(
  label: string,
  fn: () => Promise<{ ok: boolean; detail?: string }>
): Promise<void> {
  try {
    const result = await fn();
    if (result.ok) {
      pass++;
      console.log(`✅ PASS ${label}${result.detail ? ` — ${result.detail}` : ''}`);
    } else {
      fail++;
      console.log(`❌ FAIL ${label}${result.detail ? ` — ${result.detail}` : ''}`);
    }
  } catch (e: unknown) {
    fail++;
    console.log(`💥 ERR  ${label}: ${(e as Error).message}`);
  }
}

async function signup(payload: Record<string, unknown>): Promise<Response> {
  return fetch(SIGNUP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function main() {
  console.log('=== BuildTrack Step 3 — Backend Verification Tests ===\n');

  // Unique test emails (timestamp suffix prevents conflicts on re-runs)
  const ts = Date.now();
  const testEmails = {
    pm: `test.pm.${ts}@buildtrack-test.local`,
    se: `test.se.${ts}@buildtrack-test.local`,
    fm: `test.fm.${ts}@buildtrack-test.local`,
    con: `test.con.${ts}@buildtrack-test.local`,
    dup: `test.dup.${ts}@buildtrack-test.local`,
  };

  let pmUserId: string | null = null;

  // ── T1: Valid signup — Project Manager ────────────────────────────────────
  await test('T1 Valid signup — Project Manager → 200', async () => {
    const r = await signup({
      email: testEmails.pm,
      password: 'TestPass123!',
      name: 'Test Project Manager',
      requestedRole: 'Project Manager',
      phone: '+880 1700 000001',
      company: 'Test Construction Ltd',
    });
    const body = (await r.json()) as Record<string, unknown>;
    const user = (body.user ?? body) as Record<string, unknown>;
    pmUserId = (user.id as string) ?? null;

    if (r.status !== 200) {
      return { ok: false, detail: `HTTP ${r.status}: ${JSON.stringify(body).slice(0, 150)}` };
    }
    return { ok: true, detail: `userId=${pmUserId}` };
  });

  // ── T2: selected role is assigned at signup ───────────────────────────────
  await test('T2 requested role is assigned after signup', async () => {
    const r = await signup({
      email: `test.role.check.${ts}@buildtrack-test.local`,
      password: 'TestPass123!',
      name: 'Role Check User',
      requestedRole: 'Site Engineer',
    });
    const body = (await r.json()) as Record<string, unknown>;
    const user = (body.user ?? body) as Record<string, unknown>;
    const role = user.role as string | undefined;
    return {
      ok: role === 'Site Engineer',
      detail: `role=${role}`,
    };
  });

  // ── T3: new accounts are active ──────────────────────────────────────────
  await test('T3 account status is active after signup', async () => {
    const r = await signup({
      email: `test.status.check.${ts}@buildtrack-test.local`,
      password: 'TestPass123!',
      name: 'Status Check User',
      requestedRole: 'Finance Manager',
    });
    const body = (await r.json()) as Record<string, unknown>;
    const user = (body.user ?? body) as Record<string, unknown>;
    const status = user.status as string | undefined;
    return {
      ok: status === 'active',
      detail: `status=${status}`,
    };
  });

  // ── T4: All 4 public roles work ───────────────────────────────────────────
  await test('T4 Site Engineer role signup → 200', async () => {
    const r = await signup({
      email: testEmails.se,
      password: 'TestPass123!',
      name: 'Test Site Engineer',
      requestedRole: 'Site Engineer',
    });
    return { ok: r.status === 200, detail: `HTTP ${r.status}` };
  });

  await test('T4b Finance Manager role signup → 200', async () => {
    const r = await signup({
      email: testEmails.fm,
      password: 'TestPass123!',
      name: 'Test Finance Manager',
      requestedRole: 'Finance Manager',
    });
    return { ok: r.status === 200, detail: `HTTP ${r.status}` };
  });

  await test('T4c Contractor role signup → 200', async () => {
    const r = await signup({
      email: testEmails.con,
      password: 'TestPass123!',
      name: 'Test Contractor',
      requestedRole: 'Contractor',
    });
    return { ok: r.status === 200, detail: `HTTP ${r.status}` };
  });

  // ── T5: Admin role REJECTED ───────────────────────────────────────────────
  await test('T5 Admin role signup → rejected (400 or 422)', async () => {
    const r = await signup({
      email: `badactor.${ts}@buildtrack-test.local`,
      password: 'TestPass123!',
      name: 'Bad Actor',
      requestedRole: 'Admin',
    });
    const body = (await r.json()) as Record<string, unknown>;
    const blocked = r.status >= 400;
    return {
      ok: blocked,
      detail: `HTTP ${r.status}: ${JSON.stringify(body).slice(0, 100)}`,
    };
  });

  // ── T6: Duplicate email rejected ─────────────────────────────────────────
  await test('T6 Duplicate email → rejected', async () => {
    // First signup
    await signup({
      email: testEmails.dup,
      password: 'TestPass123!',
      name: 'First User',
      requestedRole: 'Project Manager',
    });
    // Duplicate attempt
    const r = await signup({
      email: testEmails.dup,
      password: 'AnotherPass123!',
      name: 'Duplicate User',
      requestedRole: 'Site Engineer',
    });
    return { ok: r.status >= 400, detail: `HTTP ${r.status}` };
  });

  // ── T7: signup establishes a session ──────────────────────────────────────
  await test('T7 signup returns an automatic session cookie', async () => {
    const r = await signup({
      email: `test.auto.signin.${ts}@buildtrack-test.local`,
      password: 'TestPass123!',
      name: 'Auto Sign-in Test',
      requestedRole: 'Project Manager',
    });
    const sessionCookie = r.headers.get('set-cookie');
    return {
      ok: r.status === 200 && Boolean(sessionCookie),
      detail: `HTTP ${r.status}, session cookie=${Boolean(sessionCookie)}`,
    };
  });

  // ── T8: Unauthenticated requests remain blocked ───────────────────────────
  await test('T8 Unauthenticated access to protected API → 401', async () => {
    // This request deliberately does not attach a cookie.
    const r = await fetch(`${BASE}/api/v1/admin/users`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return { ok: r.status === 401, detail: `HTTP ${r.status}` };
  });

  // ── T9: Password not exposed in response ──────────────────────────────────
  await test('T9 Password hash NOT exposed in signup response', async () => {
    const r = await signup({
      email: `test.pw.expose.${ts}@buildtrack-test.local`,
      password: 'TestPass123!',
      name: 'Password Exposure Test',
      requestedRole: 'Contractor',
    });
    const body = (await r.json()) as Record<string, unknown>;
    const bodyStr = JSON.stringify(body).toLowerCase();
    const hasPassword =
      bodyStr.includes('hashedpassword') ||
      bodyStr.includes('password_hash') ||
      (bodyStr.includes('password') && !bodyStr.includes('requestedpassword'));
    return {
      ok: !hasPassword,
      detail: hasPassword ? 'Password field found in response!' : 'No password exposed',
    };
  });

  // ── T10: requestedRole persisted correctly ────────────────────────────────
  await test('T10 requestedRole="Project Manager" persisted in DB', async () => {
    const r = await signup({
      email: `test.role.persist.${ts}@buildtrack-test.local`,
      password: 'TestPass123!',
      name: 'Role Persist Test',
      requestedRole: 'Project Manager',
    });
    const body = (await r.json()) as Record<string, unknown>;
    const user = (body.user ?? body) as Record<string, unknown>;
    const requestedRole = user.requestedRole as string | undefined;
    return {
      ok: requestedRole === 'Project Manager',
      detail: `requestedRole=${requestedRole}`,
    };
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(55)}`);
  console.log(`RESULTS: ${pass} PASS / ${fail} FAIL`);
  if (fail === 0) {
    console.log('🎉 All Step 3 backend verification tests passed!');
  }
}

main().catch((e) => {
  console.error('Fatal error in verification script:', e);
  process.exit(1);
});

export {};
