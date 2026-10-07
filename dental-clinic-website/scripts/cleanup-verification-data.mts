/**
 * Remove data created while verifying the booking flow by hand.
 *
 * Kept in the repository rather than thrown away, because manual verification
 * against a seeded database is something that will be done again, and leaving
 * test patients in the diary is how a demonstration ends up showing somebody
 * called "Test Booking" to a client.
 *
 * Run with: npx tsx scripts/cleanup-verification-data.mts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { requireDatabaseUrl } from '../lib/env';

/** Contact addresses used by the manual checks and the collision tests. */
const VERIFICATION_EMAILS = [
  'nandi.flow@example.co.za',
  'pieter.flow@example.co.za',
  'thabo.test@example.co.za',
  'second.test@example.co.za',
  'collision.check@example.co.za',
  'collision.second@example.co.za',
  // Used by the pre-launch check against the deployed site. A booking made
  // within the 24 hour window cannot be cancelled through the patient API, by
  // design, so it has to be removed here instead.
  'verification.check@example.com',
  'verification.check2@example.com',
];

/** Note text used by blocks created during verification. */
const VERIFICATION_BLOCK_NOTE = 'Verification test';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
  });

  try {
    const blocks = await prisma.blockedTime.deleteMany({
      where: { note: VERIFICATION_BLOCK_NOTE },
    });

    const patients = await prisma.patient.findMany({
      where: { emailNormalized: { in: VERIFICATION_EMAILS } },
      select: { id: true },
    });
    const patientIds = patients.map((p) => p.id);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    });

    // Ordered so foreign keys are never violated.
    await prisma.appointmentEvent.deleteMany({
      where: { appointmentId: { in: appointments.map((a) => a.id) } },
    });
    await prisma.payment.deleteMany({
      where: { appointmentId: { in: appointments.map((a) => a.id) } },
    });
    const removedAppointments = await prisma.appointment.deleteMany({
      where: { patientId: { in: patientIds } },
    });

    const orders = await prisma.order.findMany({
      where: { contactEmailNormalized: { in: VERIFICATION_EMAILS } },
      select: { id: true },
    });
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: orders.map((o) => o.id) } },
    });
    const removedOrders = await prisma.order.deleteMany({
      where: { contactEmailNormalized: { in: VERIFICATION_EMAILS } },
    });

    const removedPatients = await prisma.patient.deleteMany({
      where: { id: { in: patientIds } },
    });

    console.log('Verification data removed:');
    console.log(`  blocked periods: ${blocks.count}`);
    console.log(`  appointments:    ${removedAppointments.count}`);
    console.log(`  orders:          ${removedOrders.count}`);
    console.log(`  patients:        ${removedPatients.count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
