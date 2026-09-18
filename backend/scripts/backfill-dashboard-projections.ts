/**
 * One-time operational backfill for dashboard_request_projections.
 *
 * This is deliberately NOT part of DashboardReportingModule's runtime
 * code path — that module must never read another module's operational
 * tables directly (docs/ARCHITECTURE.md §2 boundary rule 4 /
 * ARCHITECTURE_REVIEW.md A-4/CRIT-6). Reading Request/Beneficiary/
 * RequestPriorityGroup/Delivery here is acceptable ONLY because this is
 * an ops script run by a human outside the application's request path —
 * the same category as a database migration, not application code.
 *
 * Use it once when this feature is first deployed against a system that
 * already has data (so historical requests appear on the dashboard
 * immediately instead of only from that point forward), or to recover
 * the projection if event processing ever missed something. Ongoing
 * updates come exclusively from DashboardProjectionListener.
 *
 * Run with: npm run dashboard:backfill --workspace backend
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.request.findMany({
    include: {
      beneficiary: true,
      priorityGroups: true,
      delivery: {
        include: {
          stops: {
            where: { status: 'CONFIRMED' },
            orderBy: { completedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  console.log(`Backfilling ${requests.length} request(s) into dashboard_request_projections...`);

  for (const req of requests) {
    const location = req.beneficiary?.location as { district?: string } | null;
    const district = location?.district ?? undefined;
    const deliveredAt = req.delivery?.stops[0]?.completedAt ?? undefined;

    await prisma.dashboardRequestProjection.upsert({
      where: { requestId: req.id },
      update: {
        status: req.status,
        sourceChannel: req.sourceChannel,
        district,
        hasPriorityGroup: req.priorityGroups.length > 0,
        deliveredAt,
      },
      create: {
        requestId: req.id,
        status: req.status,
        sourceChannel: req.sourceChannel,
        district,
        hasPriorityGroup: req.priorityGroups.length > 0,
        createdAt: req.createdAt,
        deliveredAt,
      },
    });
  }

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
