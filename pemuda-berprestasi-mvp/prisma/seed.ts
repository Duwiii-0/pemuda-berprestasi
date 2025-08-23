import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.tb_akun.create({
    data: {
      email: 'admin@example.com',
      password_hash: hashedPassword,
      role: 'ADMIN',
      admin: {
        create: {
          nama: 'Super Admin'
        }
      }
    }
  });

  const hashedPelatihPassword = await bcrypt.hash('pelatih123', 10);

  await prisma.tb_akun.create({
    data: {
      email: 'pelatih@example.com',
      password_hash: hashedPelatihPassword,
      role: 'PELATIH',
      pelatih: {
        create: {
          nama_pelatih: 'Budi Pelatih',
          no_telp: '08123456789',
        }
      }
    }
  });
}

main()
  .then(() => console.log('Seeding selesai'))
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });