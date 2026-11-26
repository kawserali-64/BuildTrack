import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { MongoClient } from 'mongodb';
import { config } from './env';

// Native MongoClient connected to MongoDB Atlas database 'build-track'
export const mongoClient = new MongoClient(config.mongodbUri);
export const mongoDb = mongoClient.db('build-track');

export const PUBLIC_ROLES = [
  'Project Manager',
  'Site Engineer',
  'Finance Manager',
  'Contractor',
] as const;

export type PublicRole = (typeof PUBLIC_ROLES)[number];

export const ALL_ROLES = ['Admin', ...PUBLIC_ROLES, 'Unassigned'] as const;
export type UserRole = (typeof ALL_ROLES)[number];

export const USER_STATUSES = ['active', 'pending', 'approved', 'rejected', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    client: mongoClient, // Enables transaction support on MongoDB Atlas
  }),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigins: [
    config.clientUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
  },
  user: {
    additionalFields: {
      requestedRole: {
        type: 'string',
        required: true,
        returned: true,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'Unassigned',
        input: false, // Security: Never writable from public signup body
        returned: true,
      },
      status: {
        type: 'string',
        required: false,
        defaultValue: 'active',
        input: false, // Security: Never writable from public signup body
        returned: true,
      },
      company: {
        type: 'string',
        required: false,
        returned: true,
      },
      phone: {
        type: 'string',
        required: false,
        returned: true,
      },
      approvedAt: {
        type: 'date',
        required: false,
        input: false,
        returned: true,
      },
      approvedBy: {
        type: 'string',
        required: false,
        input: false,
        returned: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Security Rule 1: Validate requestedRole is strictly one of the 4 public roles.
          // Admin can never be registered via public signup — not now, not by any client modification.
          if (!PUBLIC_ROLES.includes(user.requestedRole as any)) {
            throw new Error(
              `Invalid role requested: "${user.requestedRole}". Admin cannot be selected via public registration.`
            );
          }
          // Security Rule 2: Set role = requested public role (server-side, cannot be spoofed).
          // Security Rule 3: Set status = 'active' so users can login immediately after signup.
          // The Admin role can only be assigned manually in MongoDB or via the Admin API.
          return {
            data: {
              ...user,
              role: user.requestedRole as string, // The validated public role becomes the user's role
              status: 'active',                    // Active immediately — no pending queue for public roles
            },
          };
        },
      },
    },
  },
});
