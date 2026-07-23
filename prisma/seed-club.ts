/**
 * Prestige Club demo seed — realistic data so AG can demo the portal before
 * Jobber is connected. Run with: npm run db:seed:club
 *
 * Demo login:  demo@prestigeviewservices.ca / PrestigeDemo2026!
 * The member has multi-category history (lawn + windows), an upcoming snow
 * visit, a points ledger with the cross-category bonus, a pending
 * redemption, and an open ticket with a threaded reply.
 *
 * Idempotent: re-running wipes and recreates only the demo member's data.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@prestigeviewservices.ca";
const DEMO_PASSWORD = "PrestigeDemo2026!";

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysAhead(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function main() {
  // Clean slate for the demo member only.
  const existing = await db.member.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await db.member.delete({ where: { id: existing.id } });
    await db.serviceRecord.deleteMany({
      where: { jobberJobId: { startsWith: "demo-" } },
    });
  }

  const member = await db.member.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      firstName: "Jordan",
      lastName: "Tremblay",
      phone: "(613) 555-0148",
      profile: {
        create: {
          streetAddress: "18 Riverview Crescent",
          city: "Petawawa",
          postalCode: "K8H 2X4",
          birthdayMonth: 7,
          veteranStatus: "SELF_DECLARED",
        },
      },
    },
  });

  // ---- Service history: 3 paid lawn visits + 1 paid window job (second
  // category → cross-sell bonus) + 1 upcoming snow visit.
  const records = [
    {
      jobberJobId: "demo-lawn-1",
      category: "LAWN_CARE" as const,
      title: "Weekly lawn mowing",
      serviceDate: daysAgo(75),
      amountCents: 12_000,
      status: "COMPLETED" as const,
      paid: true,
      paidAt: daysAgo(73),
    },
    {
      jobberJobId: "demo-lawn-2",
      category: "LAWN_CARE" as const,
      title: "Weekly lawn mowing",
      serviceDate: daysAgo(47),
      amountCents: 12_000,
      status: "COMPLETED" as const,
      paid: true,
      paidAt: daysAgo(45),
    },
    {
      jobberJobId: "demo-lawn-3",
      category: "LAWN_CARE" as const,
      title: "Lawn mowing + hedge trim",
      serviceDate: daysAgo(19),
      amountCents: 12_000,
      status: "COMPLETED" as const,
      paid: true,
      paidAt: daysAgo(16),
    },
    {
      jobberJobId: "demo-windows-1",
      category: "WINDOW_EXTERIOR" as const,
      title: "Exterior window cleaning",
      serviceDate: daysAgo(10),
      amountCents: 42_000,
      status: "COMPLETED" as const,
      paid: true,
      paidAt: daysAgo(8),
    },
    {
      jobberJobId: "demo-snow-1",
      category: "SNOW_REMOVAL" as const,
      title: "Seasonal snow pass, first staking visit",
      serviceDate: daysAhead(12),
      amountCents: 0,
      status: "SCHEDULED" as const,
      paid: false,
      paidAt: null,
    },
  ];

  const created = [] as { id: string; title: string; paidAt: Date | null }[];
  for (const r of records) {
    const rec = await db.serviceRecord.create({
      data: {
        ...r,
        memberId: member.id,
        address: "18 Riverview Crescent, Petawawa",
        pointsAwarded: r.paid, // ledger entries created explicitly below
      },
    });
    created.push({ id: rec.id, title: rec.title, paidAt: r.paidAt });
  }

  // ---- Points ledger (append-only; balance derives from these rows).
  const paidRecords = created.filter((r) => r.paidAt);
  for (const r of paidRecords) {
    await db.pointsTransaction.create({
      data: {
        memberId: member.id,
        type: "EARN_SERVICE",
        amount: 50,
        sourceRef: r.id,
        note: `Completed visit: ${r.title}`,
        createdAt: r.paidAt!,
      },
    });
  }
  await db.pointsTransaction.create({
    data: {
      memberId: member.id,
      type: "EARN_CROSS_CATEGORY",
      amount: 200,
      sourceRef: created[3].id,
      note: "First booking in a second category, welcome to the club bonus",
      createdAt: daysAgo(8),
    },
  });
  await db.pointsTransaction.create({
    data: {
      memberId: member.id,
      type: "EARN_REVIEW",
      amount: 250,
      note: "Verified Google review, thank you!",
      createdAt: daysAgo(5),
    },
  });
  // Balance: 4×50 + 200 + 250 = 650 points.

  // ---- Pending redemption (points deduct from the ledger on approval).
  await db.redemption.create({
    data: {
      memberId: member.id,
      points: 500,
      creditCents: 2_500,
      status: "REQUESTED",
    },
  });

  // ---- Open ticket with a threaded conversation.
  await db.clubTicket.create({
    data: {
      memberId: member.id,
      type: "QUOTE",
      subject: "Quote for gutter cleaning this fall",
      preferredContact: "phone",
      timeWindow: "Weekdays after 4pm",
      status: "IN_PROGRESS",
      messages: {
        create: [
          {
            authorType: "member",
            body: "Hi! We've got a lot of maples over the back of the house — could I get a quote for a fall gutter cleaning? Two-storey home.",
            createdAt: daysAgo(3),
          },
          {
            authorType: "admin",
            body: "Hi Jordan! Absolutely — two-storey with mature maples is our bread and butter. We'll swing by for a quick look this week and call you after 4pm with a firm number.",
            createdAt: daysAgo(2),
          },
          {
            authorType: "admin",
            internal: true,
            body: "Route note: pair with the Riverview Crescent window repeat, same street.",
            createdAt: daysAgo(2),
          },
        ],
      },
    },
  });

  // ---- Cache tier from the rolling 12-month paid spend (= $780 → Insider).
  const spendAgg = await db.serviceRecord.aggregate({
    where: {
      memberId: member.id,
      paid: true,
      paidAt: { gte: daysAgo(365) },
    },
    _sum: { amountCents: true },
  });
  const spend = spendAgg._sum.amountCents ?? 0;
  const tier =
    spend >= 400_000
      ? "PRESTIGE"
      : spend >= 200_000
        ? "ELITE"
        : spend >= 75_000
          ? "INSIDER"
          : "MEMBER";
  await db.customerProfile.update({
    where: { memberId: member.id },
    data: { tier, tierSpend12moCents: spend },
  });

  // ---- Starter category mappings (admin-editable at /admin/club/mapping).
  for (const [matchTerm, category] of [
    ["window", "WINDOW_EXTERIOR"],
    ["gutter", "WINDOW_EXTERIOR"],
    ["house wash", "WINDOW_EXTERIOR"],
    ["pressure", "WINDOW_EXTERIOR"],
    ["lawn", "LAWN_CARE"],
    ["mow", "LAWN_CARE"],
    ["hedge", "LAWN_CARE"],
    ["snow", "SNOW_REMOVAL"],
    ["shovel", "SNOW_REMOVAL"],
    ["salting", "SNOW_REMOVAL"],
  ] as const) {
    await db.categoryMapping.upsert({
      where: { matchTerm },
      create: { matchTerm, category },
      update: {},
    });
  }

  console.log(
    `Seeded demo member ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) — tier ${tier}, spend $${spend / 100}, 650 pts`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
