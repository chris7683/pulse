import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@pulse.com' },
    update: {},
    create: {
      email: 'admin@pulse.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      isActive: true
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create proms
  const proms = [
    {
      name: 'EBIS Prom',
      date: new Date('2026-05-14T19:00:00'),
      venue: 'Grand Ballroom',
      city: 'Downtown',
      description: 'An elegant evening of celebration',
      ticketTypes: [
        { name: 'Standing', price: 75.00, description: 'General admission • Dance floor access' },
        { name: 'VIP', price: 120.00, description: 'VIP section • Premium experience' },
        { name: 'Lounge', price: 150.00, description: 'Lounge access • Best seats in house' }
      ]
    },
    {
      name: 'AIS',
      date: new Date('2026-05-20T20:00:00'),
      venue: 'Crystal Hall',
      city: 'City Center',
      description: 'A night to remember',
      ticketTypes: [
        { name: 'Standing', price: 65.00, description: 'General admission • Full venue access' },
        { name: 'VIP', price: 110.00, description: 'VIP area • Exclusive access' },
        { name: 'Lounge', price: 140.00, description: 'Lounge seating • Premium comfort' }
      ]
    },
    {
      name: 'CES',
      date: new Date('2026-05-28T19:30:00'),
      venue: 'Elegance Center',
      city: 'Uptown',
      description: 'Elegant celebration',
      ticketTypes: [
        { name: 'Standing', price: 70.00, description: 'General admission • Main floor' },
        { name: 'VIP', price: 115.00, description: 'VIP section • Special treatment' },
        { name: 'Lounge', price: 145.00, description: 'Lounge area • Premium experience' }
      ]
    },
    {
      name: 'NIS',
      date: new Date('2026-06-04T20:30:00'),
      venue: 'Majestic Venue',
      city: 'Riverside',
      description: 'Exclusive prom experience',
      ticketTypes: [
        { name: 'Standing', price: 80.00, description: 'General admission • Full access' },
        { name: 'VIP', price: 125.00, description: 'VIP access • Exclusive perks' },
        { name: 'Lounge', price: 160.00, description: 'Lounge tickets • Best experience' }
      ]
    }
  ];

  for (const promData of proms) {
    const { ticketTypes, ...promInfo } = promData;
    
    // Check if prom exists
    let prom = await prisma.prom.findFirst({
      where: { name: promData.name }
    });
    
    if (!prom) {
      // Create new prom
      prom = await prisma.prom.create({
        data: {
          ...promInfo,
          isActive: true,
          ticketTypes: {
            create: ticketTypes.map(tt => ({
              ...tt,
              isActive: true
            }))
          }
        },
        include: { ticketTypes: true }
      });
      console.log(`✅ Prom created: ${prom.name} with ${prom.ticketTypes.length} ticket types`);
    } else {
      console.log(`ℹ️  Prom already exists: ${prom.name}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

