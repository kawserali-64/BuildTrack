/**
 * seedAdmin.ts — Secure first-Admin bootstrap utility.
 *
 * IMPORTANT: This is NOT an HTTP endpoint. It is called only at server startup
 * in server.ts, after the database connection is established.
 *
 * Logic:
 *   1. Check if any user with role='Admin' already exists in the DB.
 *   2. If yes → skip (idempotent).
 *   3. If no  → create the admin account via Better Auth signup API,
 *               then immediately overwrite role/status to 'Admin'/'approved'
 *               bypassing the user-create hook restrictions.
 *
 * Credentials are read from environment variables only — never hardcoded.
 */

import { auth, mongoDb } from '../config/auth';

export async function seedAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  if (!adminEmail || !adminPassword) {
    console.warn(
      '[seedAdmin] ADMIN_EMAIL and/or ADMIN_PASSWORD not set in .env — skipping admin seed.'
    );
    return;
  }

  try {
    const collection = mongoDb.collection('user');

    // Idempotency check: any Admin already exists?
    const existingAdmin = await collection.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log(`[seedAdmin] Admin account already exists (${existingAdmin.email}). Skipping.`);
      return;
    }

    console.log('[seedAdmin] No admin found — creating first Admin account...');

    // Step 1: Create user via Better Auth (hooks will set role='Unassigned', status='pending').
    // We pass a dummy requestedRole to satisfy the hook's validation — it will be overwritten.
    let newUserId: string | null = null;

    try {
      // Use the Better Auth signUpEmail API (server-side, no HTTP round-trip)
      const signupResponse = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          requestedRole: 'Project Manager', // Required by hook; overwritten below immediately
        },
      });

      // signUpEmail returns a Response object — parse it
      if (signupResponse && typeof (signupResponse as any).json === 'function') {
        // It's a Web Response
        const json = await (signupResponse as any).json();
        newUserId = json?.user?.id ?? null;
      } else if ((signupResponse as any)?.user?.id) {
        newUserId = (signupResponse as any).user.id;
      }
    } catch (signupErr: unknown) {
      // If the account already exists (e.g. from a previous run before role was set)
      const msg = signupErr instanceof Error ? signupErr.message : String(signupErr);
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
        console.log('[seedAdmin] Admin email already registered — promoting to Admin role...');
        const existing = await collection.findOne({ email: adminEmail });
        newUserId = existing?.id as string ?? null;
      } else {
        throw signupErr;
      }
    }

    if (!newUserId) {
      // Fallback: find by email
      const byEmail = await collection.findOne({ email: adminEmail });
      newUserId = byEmail?.id as string ?? null;
    }

    if (!newUserId) {
      console.error('[seedAdmin] Could not determine new user ID — admin seed failed.');
      return;
    }

    // Step 2: Overwrite role and status directly in DB (bypasses hook input:false restriction).
    const now = new Date();
    await collection.updateOne(
      { id: newUserId },
      {
        $set: {
          role: 'Admin',
          status: 'active', // Admin is always active
          approvedAt: now,
          approvedBy: 'system-seed',
          updatedAt: now,
        },
      }
    );

    console.log(`[seedAdmin] ✅ Admin account created and activated: ${adminEmail}`);
  } catch (err) {
    console.error('[seedAdmin] Failed to seed admin account:', err);
    // Do not crash the server — just warn and continue
  }
}
