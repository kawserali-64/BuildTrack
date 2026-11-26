/**
 * Step 2 Verification Script — run standalone to verify auth/admin middleware.
 * Usage: npx tsx src/utils/verifyStep2.ts
 * The server must be running on localhost:5000.
 */

const BASE = 'http://localhost:5000';
let pass = 0;
let fail = 0;

async function test(
  label: string,
  expectStatus: number,
  url: string,
  opts?: RequestInit
): Promise<{ status: number; body: unknown } | null> {
  try {
    const r = await fetch(url, opts);
    const body = await r.json().catch(() => null);
    const ok = r.status === expectStatus;
    if (ok) {
      pass++;
      console.log(`✅ PASS ${label} (HTTP ${r.status})`);
    } else {
      fail++;
      console.log(
        `❌ FAIL ${label} expected=${expectStatus} got=${r.status} body=${JSON.stringify(body).slice(0, 200)}`
      );
    }
    return { status: r.status, body };
  } catch (e: unknown) {
    fail++;
    console.log(`💥 ERR  ${label}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  console.log('=== BuildTrack Step 2 — Verification Tests ===\n');

  // ── Unauthenticated guards ──────────────────────────────────────────────────
  await test('T1 Unauth GET  /admin/users -> 401', 401, `${BASE}/api/v1/admin/users`);
  await test(
    'T2 Unauth GET  /admin/users/pending -> 401',
    401,
    `${BASE}/api/v1/admin/users/pending`
  );
  await test('T3 Unauth GET  /admin/users/:id -> 401', 401, `${BASE}/api/v1/admin/users/fakeid`);
  await test('T4 Unauth PATCH /admin/users/:id/approve -> 401', 401, `${BASE}/api/v1/admin/users/x/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  await test('T5 Unauth PATCH /admin/users/:id/reject -> 401', 401, `${BASE}/api/v1/admin/users/x/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  await test('T6 Unauth PATCH /admin/users/:id/role -> 401', 401, `${BASE}/api/v1/admin/users/x/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'Admin' }),
  });

  // ── Infrastructure health ──────────────────────────────────────────────────
  await test('T7 Health check -> 200', 200, `${BASE}/api/v1/health`);

  // T8: Admin endpoints listed in API root
  const r8 = await fetch(`${BASE}/api/v1/`);
  const b8 = (await r8.json().catch(() => ({}))) as Record<string, unknown>;
  const hasAdmin = JSON.stringify(b8).includes('admin');
  if (hasAdmin) {
    pass++;
    console.log('✅ PASS T8 API root lists admin endpoints');
  } else {
    fail++;
    console.log('❌ FAIL T8 API root missing admin endpoints');
  }

  // ── Security: Block Admin role at signup ───────────────────────────────────
  const r9 = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'badactor@test.com',
      password: 'Test1234!',
      name: 'Bad Actor',
      requestedRole: 'Admin',
    }),
  });
  const b9 = (await r9.json().catch(() => null)) as Record<string, unknown> | null;
  const adminBlocked =
    r9.status >= 400 ||
    (b9 !== null && JSON.stringify(b9).toLowerCase().includes('invalid'));
  if (adminBlocked) {
    pass++;
    console.log(`✅ PASS T9 Admin role signup blocked (HTTP ${r9.status})`);
  } else {
    fail++;
    console.log(`❌ FAIL T9 Admin signup NOT blocked (HTTP ${r9.status})`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${pass} PASS / ${fail} FAIL`);
  if (fail === 0) {
    console.log('🎉 All tests passed!');
  }
}

main().catch((e) => {
  console.error('Fatal error in verification script:', e);
  process.exit(1);
});

export {};
