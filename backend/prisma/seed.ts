/**
 * Seeds reference/config data — never business decisions. Every value here
 * is either (a) directly taken from the SRS/architecture docs (the 8
 * priority groups, REQ-023; the two verification outcomes, docs/
 * ARCHITECTURE_REVIEW.md B-3) or (b) an explicitly-labeled DEFAULT pending
 * an OPEN-BUSINESS-DECISION-xx, stored in policy_settings so it can be
 * changed by an Admin without a redeploy. Do not add a value here that
 * isn't traceable to one of those two sources.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// docs/ARCHITECTURE.md §7 proposed RBAC matrix — NOT a resolution of
// OPEN-BUSINESS-DECISION-05/03/04; must be ratified by MoICS/NOC before
// production go-live. Kept as data so ratification is a re-seed, not code.
const PERMISSIONS = [
  'request:create',
  'request:read',
  'request:update',
  'request:verify',
  'request:classify-priority',
  'priority-policy:manage',
  'request:shortlist',
  'request:queue',
  'delivery-plan:create',
  'delivery-plan:read',
  'delivery:assign',
  'delivery:read-own',
  'delivery:start',
  'delivery:reschedule',
  'otp:verify',
  'otp:resend',
  'otp:manual-override',
  'dashboard:read',
  'report:read',
  'audit-log:read',
  'user:manage',
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [...PERMISSIONS],
  INTAKE_OPERATOR: ['request:create', 'request:read', 'request:update'],
  VERIFICATION_OFFICER: ['request:read', 'request:verify', 'request:classify-priority'],
  DISPATCH_COORDINATOR: [
    'request:read',
    'request:shortlist',
    'request:queue',
    'delivery-plan:create',
    'delivery-plan:read',
    'delivery:assign',
    'delivery:reschedule',
    'otp:manual-override',
  ],
  DELIVERY_AGENT: ['delivery:read-own', 'delivery:start', 'otp:verify', 'otp:resend'],
  OFFICIAL: ['dashboard:read', 'report:read'],
  AUDITOR: ['audit-log:read'],
};

// SRS REQ-023 — the 8 priority groups verbatim from the concept paper §4.
const PRIORITY_GROUPS = [
  { code: 'EXTREME_POVERTY', labelEn: 'Extremely poor / deprived families', labelNe: 'अत्यन्त विपन्न परिवार' },
  { code: 'STUDENT', labelEn: 'Students / student hostels', labelNe: 'विद्यार्थी/विद्यार्थी आवास' },
  { code: 'MARGINALIZED_AT_RISK', labelEn: 'Marginalized and at-risk communities', labelNe: 'सीमान्तकृत तथा जोखिममा रहेका समुदाय' },
  { code: 'SENIOR_CITIZEN', labelEn: 'Senior citizens', labelNe: 'ज्येष्ठ नागरिक' },
  { code: 'PERSON_WITH_DISABILITY', labelEn: 'Persons with disabilities', labelNe: 'अपाङ्गता भएका व्यक्ति' },
  { code: 'WOMEN_HEADED_POOR_FAMILY', labelEn: 'Single women / women-headed poor families', labelNe: 'एकल महिला तथा महिला-प्रमुख विपन्न परिवार' },
  { code: 'ESSENTIAL_SERVICE', labelEn: 'Essential services/institutions', labelNe: 'अत्यावश्यक सेवा/संस्था' },
  { code: 'OTHER_HUMANITARIAN_NEED', labelEn: 'Other special humanitarian need', labelNe: 'अन्य विशेष मानवीय आवश्यकता भएका लाभग्राही' },
];

// docs/ARCHITECTURE_REVIEW.md B-3 — lookup table, not a CHECK enum, so a
// third outcome can be added later by data alone.
const VERIFICATION_OUTCOMES = ['CONFIRMED', 'FAILED'];

// docs/ARCHITECTURE.md §9 proposed OTP defaults — pending OPEN-BUSINESS-DECISION-11.
// Stored in policy_settings, not literals in OtpService, so ratifying the
// real values is a data change.
const POLICY_SETTINGS: Array<{ key: string; value: unknown; description: string }> = [
  {
    key: 'otp.expiry_seconds',
    value: 300,
    description: 'OTP validity window. DEFAULT pending OPEN-BUSINESS-DECISION-11.',
  },
  {
    key: 'otp.max_verify_attempts',
    value: 3,
    description: 'Max OTP verify attempts before EXHAUSTED. DEFAULT pending OPEN-BUSINESS-DECISION-11.',
  },
  {
    key: 'otp.resend_cooldown_seconds',
    value: 60,
    description: 'Minimum gap between resends. DEFAULT pending OPEN-BUSINESS-DECISION-11.',
  },
  {
    key: 'otp.max_resends',
    value: 3,
    description: 'Max resends per delivery stop. DEFAULT pending OPEN-BUSINESS-DECISION-11.',
  },
];

async function main() {
  console.log('Seeding permissions...');
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  console.log('Seeding roles + role_permissions...');
  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    for (const code of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding priority groups...');
  for (const group of PRIORITY_GROUPS) {
    await prisma.priorityGroup.upsert({
      where: { code: group.code },
      update: {},
      create: group,
    });
  }

  console.log('Seeding verification outcomes...');
  for (const code of VERIFICATION_OUTCOMES) {
    await prisma.verificationOutcome.upsert({ where: { code }, update: {}, create: { code } });
  }

  console.log('Seeding policy_settings defaults...');
  for (const setting of POLICY_SETTINGS) {
    await prisma.policySetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting as any,
    });
  }

  console.log('Seeding baseline (unranked) priority policy version...');
  const existingVersion = await prisma.priorityPolicyVersion.findFirst({
    where: { versionLabel: 'v0-unranked' },
  });
  if (!existingVersion) {
    await prisma.priorityPolicyVersion.create({
      data: {
        versionLabel: 'v0-unranked',
        scoringFormula: undefined, // deliberately null — OPEN-BUSINESS-DECISION-08
        activatedAt: new Date(),
      },
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('Seeding a local-dev ADMIN user (dev-only — do not rely on this in staging/production)...');
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
    const passwordHash = await argon2.hash('change-me-immediately');
    const admin = await prisma.user.upsert({
      where: { phoneOrUsername: 'admin' },
      update: {},
      create: {
        fullName: 'Local Dev Admin',
        phoneOrUsername: 'admin',
        passwordHash,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
    console.log('  -> login: admin / change-me-immediately (LOCAL DEV ONLY)');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
