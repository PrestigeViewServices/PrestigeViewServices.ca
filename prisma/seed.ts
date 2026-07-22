/**
 * Phase-1 seed.
 *
 * Run: `npm run db:seed` after applying migrations (`npm run db:migrate`).
 *
 * Idempotent — re-running won't duplicate rows. Real users sync via Clerk's
 * webhook; the seed is for hand-testing the admin views before Clerk is wired.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Hand-test users — these will be overwritten by the Clerk webhook the
  // first time the matching real users sign in.
  await db.user.upsert({
    where: { email: "seed-admin@prestigeviewservices.ca" },
    update: {},
    create: {
      id: "seed_user_admin",
      email: "seed-admin@prestigeviewservices.ca",
      firstName: "Seed",
      lastName: "Admin",
      role: "ADMIN",
      signupMethod: "EMAIL",
    },
  });

  await db.user.upsert({
    where: { email: "seed-employee@prestigeviewservices.ca" },
    update: {},
    create: {
      id: "seed_user_employee",
      email: "seed-employee@prestigeviewservices.ca",
      firstName: "Seed",
      lastName: "Employee",
      role: "EMPLOYEE",
      signupMethod: "EMAIL",
    },
  });

  // A handful of applications across statuses so the admin view has data.
  const apps = [
    {
      name: "Mike Lavoie",
      phone: "6135550101",
      email: "mike.l@example.com",
      roleSlug: "lawn-crew-member",
      availability: "Seasonal",
      validLicense: "yes",
      reliableCommute: "yes",
      yearsExperience: "1-2 years",
      whyJoin: "I want consistent outdoor work.",
      status: "NEW" as const,
    },
    {
      name: "Sarah Cote",
      phone: "6135550102",
      email: "sarah.c@example.com",
      roleSlug: "exterior-cleaning-technician",
      availability: "Full-time",
      validLicense: "yes",
      reliableCommute: "yes",
      yearsExperience: "3-5 years",
      whyJoin: "I take pride in detail work.",
      status: "CONTACTED" as const,
    },
    {
      name: "Jonas Brown",
      phone: "6135550103",
      email: "jonas.b@example.com",
      roleSlug: "snow-removal-operator",
      availability: "Seasonal",
      validLicense: "yes",
      reliableCommute: "yes",
      yearsExperience: "5+ years",
      status: "HIRED" as const,
    },
  ];

  for (const a of apps) {
    await db.application.create({ data: a });
  }

  // Sample support requests
  await db.supportRequest.create({
    data: {
      name: "Karen Roy",
      email: "karen@example.com",
      phone: "6135550201",
      type: "ISSUE",
      propertyAddress: "12 Pine St, Pembroke ON",
      details: "Gutter section came loose during last cleaning visit.",
      status: "NEW",
    },
  });

  await db.supportRequest.create({
    data: {
      name: "Dave Mercier",
      email: "dave@example.com",
      phone: "6135550202",
      type: "DISPATCH",
      propertyAddress: "5 Riverside Dr, Petawawa ON",
      details: "Snow contract — driveway not cleared this morning.",
      status: "IN_PROGRESS",
    },
  });

  await seedOps(db);

  console.log("Seed complete");
}

/**
 * Field-service ops seed (Phase 1 dashboard). Idempotent: clears the ops tables
 * and rebuilds a realistic snapshot so every Command Center tile, the pipeline
 * board, the accounts list (incl. winter-only), and the crew portal show real
 * numbers. Does NOT touch users / applications / support.
 */
async function seedOps(db: PrismaClient) {
  // ---- Clean slate (FK-safe child → parent order) -------------------------
  await db.activityLog.deleteMany();
  await db.review.deleteMany();
  await db.invoice.deleteMany();
  await db.job.deleteMany();
  await db.route.deleteMany();
  await db.recurringContract.deleteMany();
  await db.lead.deleteMany();
  await db.crewMember.deleteMany();
  await db.crew.deleteMany();
  await db.account.deleteMany();
  await db.property.deleteMany();
  await db.service.deleteMany();
  await db.customer.deleteMany();

  const now = new Date();
  const at = (hour: number, dayOffset = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  };
  const lastMonth15 = new Date(now.getFullYear(), now.getMonth() - 1, 15);

  // ---- Service catalog (mirrors lib/content/divisions.ts slugs) -----------
  const serviceDefs = [
    { slug: "lawn-mowing", name: "Lawn Mowing", division: "LAWNPROS" as const, cents: 4500 },
    { slug: "spring-cleanup", name: "Spring Cleanup", division: "LAWNPROS" as const, cents: 22000 },
    { slug: "aeration", name: "Aeration", division: "LAWNPROS" as const, cents: 18000 },
    { slug: "window-cleaning", name: "Window Cleaning", division: "CLEARVIEW" as const, cents: 16000 },
    { slug: "gutter-cleaning", name: "Gutter Cleaning", division: "CLEARVIEW" as const, cents: 14000 },
    { slug: "pressure-washing", name: "Pressure Washing", division: "CLEARVIEW" as const, cents: 24000 },
    { slug: "snow-removal", name: "Snow Removal", division: "SNOWLAND" as const, cents: 6000 },
    { slug: "seasonal-snow-contract", name: "Seasonal Snow Contract", division: "SNOWLAND" as const, cents: 65000 },
    { slug: "walkway-clearing", name: "Walkway Clearing", division: "SNOWLAND" as const, cents: 3500 },
  ];
  const svc: Record<string, string> = {};
  for (const s of serviceDefs) {
    const created = await db.service.create({
      data: { slug: s.slug, name: s.name, division: s.division, defaultPriceCents: s.cents },
    });
    svc[s.slug] = created.id;
  }

  // ---- Crews --------------------------------------------------------------
  const crew1 = await db.crew.create({
    data: {
      name: "Truck 1 — Green Crew",
      members: {
        create: [
          { name: "Marc Pellerin", title: "Crew Lead", userId: "seed_user_employee" },
          { name: "Tyler Ross", title: "Technician" },
        ],
      },
    },
  });
  const crew2 = await db.crew.create({
    data: {
      name: "Truck 2 — Blue Crew",
      members: {
        create: [
          { name: "Dan Forbes", title: "Crew Lead" },
          { name: "Amir Haddad", title: "Technician" },
        ],
      },
    },
  });

  // ---- Customers (+ one property + one account each) -----------------------
  async function makeCustomer(o: {
    first: string; last: string; email: string; phone: string;
    street: string; city: string; postal: string;
  }) {
    const c = await db.customer.create({
      data: {
        firstName: o.first,
        lastName: o.last,
        email: o.email,
        phone: o.phone,
        properties: {
          create: [{ label: "Home", streetAddress: o.street, city: o.city, region: "ON", postalCode: o.postal }],
        },
        accounts: { create: [{ name: `${o.first} ${o.last}` }] },
      },
      include: { properties: true, accounts: true },
    });
    return { id: c.id, propertyId: c.properties[0].id, accountId: c.accounts[0].id };
  }

  const cindy = await makeCustomer({ first: "Cindy", last: "Thrasher", email: "cindy.t@example.com", phone: "6135550111", street: "14 Civic Ave", city: "Petawawa", postal: "K8H 2X1" });
  const ken = await makeCustomer({ first: "Ken", last: "Laybolt", email: "ken.l@example.com", phone: "6135550112", street: "32 Mackay St", city: "Pembroke", postal: "K8A 1A5" });
  const ryan = await makeCustomer({ first: "Ryan", last: "White", email: "ryan.w@example.com", phone: "6135550113", street: "9 Paquette Rd", city: "Petawawa", postal: "K8H 3M2" });
  const karen = await makeCustomer({ first: "Karen", last: "Roy", email: "karen.r@example.com", phone: "6135550114", street: "12 Pine St", city: "Pembroke", postal: "K8A 6T1" });
  const dave = await makeCustomer({ first: "Dave", last: "Mercier", email: "dave.m@example.com", phone: "6135550115", street: "5 Riverside Dr", city: "Petawawa", postal: "K8H 1B9" });
  const mike = await makeCustomer({ first: "Mike", last: "Lavoie", email: "mike.l2@example.com", phone: "6135550116", street: "88 Doran Rd", city: "Petawawa", postal: "K8H 2P4" });
  const sarah = await makeCustomer({ first: "Sarah", last: "Cote", email: "sarah.c2@example.com", phone: "6135550117", street: "21 Boundary Rd", city: "Pembroke", postal: "K8A 6W3" });
  const jonas = await makeCustomer({ first: "Jonas", last: "Brown", email: "jonas.b2@example.com", phone: "6135550118", street: "40 Edey St", city: "Petawawa", postal: "K8H 1V2" });
  const tom = await makeCustomer({ first: "Tom", last: "Allen", email: "tom.a@example.com", phone: "6135550119", street: "7 Christie St", city: "Pembroke", postal: "K8A 3J8" });
  const lisa = await makeCustomer({ first: "Lisa", last: "Nguyen", email: "lisa.n@example.com", phone: "6135550120", street: "63 Greenwood Ave", city: "Petawawa", postal: "K8H 2R7" });

  // ---- Recurring contracts -------------------------------------------------
  // ACTIVE weekly lawn contracts drive monthly recurring revenue (summer is on).
  // Snow contracts are EXPIRED off-season but still flag winter-only accounts.
  async function contract(o: {
    acct: { accountId: string; propertyId: string };
    slug: string; division: "LAWNPROS" | "CLEARVIEW" | "SNOWLAND";
    frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "PER_STORM" | "SEASONAL";
    status: "ACTIVE" | "PAUSED" | "EXPIRED" | "CANCELED";
    cents: number; startOffset: number; endOffset?: number;
  }) {
    await db.recurringContract.create({
      data: {
        accountId: o.acct.accountId,
        propertyId: o.acct.propertyId,
        division: o.division,
        serviceId: svc[o.slug],
        frequency: o.frequency,
        status: o.status,
        priceCents: o.cents,
        startDate: day(o.startOffset),
        endDate: o.endOffset !== undefined ? day(o.endOffset) : null,
      },
    });
  }
  await contract({ acct: cindy, slug: "lawn-mowing", division: "LAWNPROS", frequency: "WEEKLY", status: "ACTIVE", cents: 4500, startOffset: -60 });
  await contract({ acct: mike, slug: "lawn-mowing", division: "LAWNPROS", frequency: "WEEKLY", status: "ACTIVE", cents: 4500, startOffset: -45 });
  await contract({ acct: sarah, slug: "lawn-mowing", division: "LAWNPROS", frequency: "WEEKLY", status: "ACTIVE", cents: 5000, startOffset: -70 });
  await contract({ acct: tom, slug: "lawn-mowing", division: "LAWNPROS", frequency: "WEEKLY", status: "ACTIVE", cents: 4500, startOffset: -50 });
  await contract({ acct: lisa, slug: "lawn-mowing", division: "LAWNPROS", frequency: "WEEKLY", status: "ACTIVE", cents: 5500, startOffset: -55 });
  // Snow (winter-only customers + dual-service customers' lapsed snow contracts)
  await contract({ acct: karen, slug: "seasonal-snow-contract", division: "SNOWLAND", frequency: "SEASONAL", status: "EXPIRED", cents: 65000, startOffset: -210, endOffset: -75 });
  await contract({ acct: dave, slug: "snow-removal", division: "SNOWLAND", frequency: "PER_STORM", status: "EXPIRED", cents: 6000, startOffset: -210, endOffset: -75 });
  await contract({ acct: jonas, slug: "seasonal-snow-contract", division: "SNOWLAND", frequency: "SEASONAL", status: "EXPIRED", cents: 72000, startOffset: -210, endOffset: -75 });
  await contract({ acct: sarah, slug: "seasonal-snow-contract", division: "SNOWLAND", frequency: "SEASONAL", status: "EXPIRED", cents: 65000, startOffset: -210, endOffset: -75 });
  await contract({ acct: lisa, slug: "seasonal-snow-contract", division: "SNOWLAND", frequency: "SEASONAL", status: "EXPIRED", cents: 70000, startOffset: -210, endOffset: -75 });

  // ---- Leads (pipeline: NEW + QUOTED columns, plus WON/LOST for funnel) ----
  async function lead(o: {
    name: string; email: string; phone: string; address: string;
    division: "LAWNPROS" | "CLEARVIEW" | "SNOWLAND"; slugs: string[];
    status: "NEW" | "QUOTED" | "WON" | "LOST"; source: "PUBLIC_FORM" | "PORTAL" | "MANUAL" | "PHONE";
    estimate?: number; createdOffset: number; message?: string;
  }) {
    return db.lead.create({
      data: {
        name: o.name, email: o.email, phone: o.phone, propertyAddress: o.address,
        division: o.division, serviceSlugs: o.slugs, status: o.status, source: o.source,
        estimateCents: o.estimate ?? null, message: o.message ?? null, createdAt: day(o.createdOffset),
      },
    });
  }
  await lead({ name: "Janet Poirier", email: "janet.p@example.com", phone: "6135550201", address: "3 Allan Dr, Petawawa", division: "CLEARVIEW", slugs: ["window-cleaning"], status: "NEW", source: "PUBLIC_FORM", createdOffset: -1, message: "Two-storey, ~18 windows. Quote please." });
  await lead({ name: "Marc Belanger", email: "marc.b@example.com", phone: "6135550202", address: "55 Festubert Blvd, Petawawa", division: "LAWNPROS", slugs: ["lawn-mowing", "spring-cleanup"], status: "NEW", source: "PUBLIC_FORM", createdOffset: 0 });
  await lead({ name: "Olivia Tremblay", email: "olivia.t@example.com", phone: "6135550203", address: "120 Pembroke St W, Pembroke", division: "CLEARVIEW", slugs: ["pressure-washing"], status: "NEW", source: "PHONE", createdOffset: -2 });
  await lead({ name: "Greg Hamill", email: "greg.h@example.com", phone: "6135550204", address: "18 Bell St, Pembroke", division: "LAWNPROS", slugs: ["aeration"], status: "QUOTED", source: "PUBLIC_FORM", estimate: 18000, createdOffset: -4 });
  await lead({ name: "Priya Anand", email: "priya.a@example.com", phone: "6135550205", address: "9 Victoria St, Petawawa", division: "CLEARVIEW", slugs: ["window-cleaning", "gutter-cleaning"], status: "QUOTED", source: "PUBLIC_FORM", estimate: 30000, createdOffset: -6 });
  const wonLead = await lead({ name: "Brian Scott", email: "brian.s@example.com", phone: "6135550206", address: "27 Paquette Rd, Petawawa", division: "CLEARVIEW", slugs: ["pressure-washing"], status: "WON", source: "PUBLIC_FORM", estimate: 24000, createdOffset: -9 });
  await lead({ name: "Helen Park", email: "helen.p@example.com", phone: "6135550207", address: "4 Moffat St, Pembroke", division: "LAWNPROS", slugs: ["lawn-mowing"], status: "LOST", source: "PUBLIC_FORM", createdOffset: -12 });

  // ---- Jobs ---------------------------------------------------------------
  type JobInput = {
    acct: { accountId: string; propertyId: string };
    slug: string; division: "LAWNPROS" | "CLEARVIEW" | "SNOWLAND";
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "INVOICED" | "CANCELED";
    cents: number; crew?: string; scheduledFor?: Date; completedOffset?: number;
    leadId?: string; crewNotes?: string;
  };
  async function job(o: JobInput) {
    return db.job.create({
      data: {
        accountId: o.acct.accountId,
        propertyId: o.acct.propertyId,
        division: o.division,
        serviceId: svc[o.slug],
        status: o.status,
        priceCents: o.cents,
        crewId: o.crew ?? null,
        scheduledFor: o.scheduledFor ?? null,
        completedAt: o.completedOffset !== undefined ? day(o.completedOffset) : null,
        leadId: o.leadId ?? null,
        crewNotes: o.crewNotes ?? null,
      },
    });
  }

  // Today's schedule (crew portal + dispatch + route density)
  await job({ acct: cindy, slug: "lawn-mowing", division: "LAWNPROS", status: "SCHEDULED", cents: 4500, crew: crew1.id, scheduledFor: at(9) });
  await job({ acct: mike, slug: "lawn-mowing", division: "LAWNPROS", status: "SCHEDULED", cents: 4500, crew: crew1.id, scheduledFor: at(11) });
  await job({ acct: sarah, slug: "lawn-mowing", division: "LAWNPROS", status: "SCHEDULED", cents: 5000, crew: crew1.id, scheduledFor: at(13) });
  await job({ acct: lisa, slug: "gutter-cleaning", division: "CLEARVIEW", status: "SCHEDULED", cents: 14000, crew: crew2.id, scheduledFor: at(9) });
  await job({ acct: ken, slug: "pressure-washing", division: "CLEARVIEW", status: "IN_PROGRESS", cents: 24000, crew: crew2.id, scheduledFor: at(11) });
  await job({ acct: tom, slug: "window-cleaning", division: "CLEARVIEW", status: "SCHEDULED", cents: 16000, crew: crew2.id, scheduledFor: at(14) });
  // Unassigned job today → "no crew assigned" alert + dispatch unassigned bucket
  await job({ acct: ryan, slug: "window-cleaning", division: "CLEARVIEW", status: "SCHEDULED", cents: 16000, scheduledFor: at(15) });
  // Future scheduled
  await job({ acct: cindy, slug: "lawn-mowing", division: "LAWNPROS", status: "SCHEDULED", cents: 4500, crew: crew1.id, scheduledFor: at(9, 7) });
  // Won-lead → scheduled job (shows lead→job linkage)
  await job({ acct: ryan, slug: "pressure-washing", division: "CLEARVIEW", status: "SCHEDULED", cents: 24000, crew: crew2.id, scheduledFor: at(10, 2), leadId: wonLead.id });

  // Completed / invoiced jobs — paired with invoices below.
  const jWindowCindy = await job({ acct: cindy, slug: "window-cleaning", division: "CLEARVIEW", status: "INVOICED", cents: 16000, crew: crew2.id, completedOffset: -5, crewNotes: "All exterior + interior done. Screens wiped." });
  const jPressureKen = await job({ acct: ken, slug: "pressure-washing", division: "CLEARVIEW", status: "INVOICED", cents: 24000, crew: crew2.id, completedOffset: -6, crewNotes: "Driveway + front walk." });
  const jGutterSarah = await job({ acct: sarah, slug: "gutter-cleaning", division: "CLEARVIEW", status: "INVOICED", cents: 14000, crew: crew2.id, completedOffset: -8 });
  const jPressureLisa = await job({ acct: lisa, slug: "pressure-washing", division: "CLEARVIEW", status: "INVOICED", cents: 24000, crew: crew2.id, completedOffset: -10 });
  const jWindowTom = await job({ acct: tom, slug: "window-cleaning", division: "CLEARVIEW", status: "INVOICED", cents: 16000, crew: crew1.id, completedOffset: -28 });
  // Completed but not yet invoiced (→ draft invoice auto-created in Phase 2)
  const jLawnCindyDone = await job({ acct: cindy, slug: "lawn-mowing", division: "LAWNPROS", status: "COMPLETE", cents: 4500, crew: crew1.id, completedOffset: -2, crewNotes: "Trimmed + edged." });
  const jLawnMikeDone = await job({ acct: mike, slug: "lawn-mowing", division: "LAWNPROS", status: "COMPLETE", cents: 4500, crew: crew1.id, completedOffset: -3 });

  // ---- Invoices (AR + cash tiles) -----------------------------------------
  async function invoice(o: {
    acct: { accountId: string }; jobId?: string; number: string;
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE"; cents: number;
    issuedOffset?: number; dueOffset?: number; paidAt?: Date;
  }) {
    await db.invoice.create({
      data: {
        accountId: o.acct.accountId,
        jobId: o.jobId ?? null,
        number: o.number,
        status: o.status,
        amountCents: o.cents,
        issuedAt: o.issuedOffset !== undefined ? day(o.issuedOffset) : null,
        dueDate: o.dueOffset !== undefined ? day(o.dueOffset) : null,
        paidAt: o.paidAt ?? null,
      },
    });
  }
  // PAID this month → cash booked this month + LTV
  await invoice({ acct: cindy, jobId: jWindowCindy.id, number: "INV-1001", status: "PAID", cents: 16000, issuedOffset: -5, dueOffset: 10, paidAt: day(-3) });
  await invoice({ acct: ken, jobId: jPressureKen.id, number: "INV-1002", status: "PAID", cents: 24000, issuedOffset: -6, dueOffset: 9, paidAt: day(-2) });
  // PAID last month → LTV but not this month's cash
  await invoice({ acct: tom, jobId: jWindowTom.id, number: "INV-0990", status: "PAID", cents: 16000, issuedOffset: -28, dueOffset: -13, paidAt: lastMonth15 });
  // SENT (outstanding, not overdue)
  await invoice({ acct: sarah, jobId: jGutterSarah.id, number: "INV-1003", status: "SENT", cents: 14000, issuedOffset: -8, dueOffset: 7 });
  // OVERDUE → AR outstanding + alert
  await invoice({ acct: lisa, jobId: jPressureLisa.id, number: "INV-1004", status: "OVERDUE", cents: 24000, issuedOffset: -20, dueOffset: -5 });
  // Historical PAID for LTV depth (winter season, last year)
  await invoice({ acct: karen, number: "INV-0820", status: "PAID", cents: 65000, issuedOffset: -180, dueOffset: -165, paidAt: day(-175) });
  await invoice({ acct: jonas, number: "INV-0821", status: "PAID", cents: 72000, issuedOffset: -180, dueOffset: -165, paidAt: day(-175) });
  await invoice({ acct: dave, number: "INV-0822", status: "PAID", cents: 42000, issuedOffset: -150, dueOffset: -135, paidAt: day(-140) });
  await invoice({ acct: cindy, number: "INV-0815", status: "PAID", cents: 4500, issuedOffset: -14, dueOffset: 1, paidAt: day(-10) });

  // ---- Reviews (module is Phase 3; seed a few for later) -------------------
  await db.review.create({ data: { customerId: cindy.id, jobId: jWindowCindy.id, status: "RECEIVED", rating: 5, requestedAt: day(-4), receivedAt: day(-3) } });
  await db.review.create({ data: { customerId: ken.id, jobId: jPressureKen.id, status: "REQUESTED", requestedAt: day(-5) } });
  await db.review.create({ data: { customerId: sarah.id, status: "REQUESTED", requestedAt: day(-7) } });

  // ---- Recompute account aggregates (LTV + winter-only) -------------------
  const accounts = await db.account.findMany({ select: { id: true } });
  for (const a of accounts) {
    const [paid, contracts, jobs] = await Promise.all([
      db.invoice.aggregate({ where: { accountId: a.id, status: "PAID" }, _sum: { amountCents: true } }),
      db.recurringContract.findMany({ where: { accountId: a.id }, select: { division: true } }),
      db.job.findMany({ where: { accountId: a.id, status: { not: "CANCELED" } }, select: { division: true } }),
    ]);
    const divisions = new Set([...contracts, ...jobs].map((x) => x.division));
    const hasWinter = divisions.has("SNOWLAND");
    const hasSummer = [...divisions].some((d) => d !== "SNOWLAND");
    await db.account.update({
      where: { id: a.id },
      data: { ltvCents: paid._sum.amountCents ?? 0, winterOnly: hasWinter && !hasSummer },
    });
  }

  const [cust, jobCount, leadCount, invCount] = await Promise.all([
    db.customer.count(),
    db.job.count(),
    db.lead.count(),
    db.invoice.count(),
  ]);
  console.log(
    `Ops seed: ${cust} customers, ${jobCount} jobs, ${leadCount} leads, ${invCount} invoices`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
