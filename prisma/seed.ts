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

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
