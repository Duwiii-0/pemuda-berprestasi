// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const existingAdmin = await prisma.tb_akun.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (!existingAdmin) {
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
    console.log('✅ Admin account created');
  } else {
    console.log('ℹ️ Admin account already exists');
  }

  // Check if pelatih already exists
  const existingPelatih = await prisma.tb_akun.findUnique({
    where: { email: 'pelatih@example.com' }
  });

  const dojang = await prisma.tb_dojang.upsert({
    where: { id_dojang: 1 },
    update: {},
    create: {
      nama_dojang: "Dojang Utama",
      email: "dojang@example.com",
      no_telp: "0811111111",
      founder: "Master Kim",
      negara: "Indonesia",
      provinsi: "Jawa Barat",
      kota: "Bandung"
    }
  });


  if (!existingPelatih) {
    const hashedPelatihPassword = await bcrypt.hash('pelatih123', 10);

    const pelatihAccount = await prisma.tb_akun.create({
      data: {
        email: 'pelatih@example.com',
        password_hash: await bcrypt.hash('pelatih123', 10),
        role: 'PELATIH',
        pelatih: {
          create: {
            nama_pelatih: 'Budi Pelatih',
            no_telp: '08123456789',
            dojang: {       // << ini wajib karena relasi required
              connect: { id_dojang: dojang.id_dojang }
            }
          }
        }
      },
      include: {
        pelatih: true  // ⬅ ini wajib supaya TS tahu ada properti pelatih
      }
    });

    
    console.log('✅ Pelatih account created');

      const pelatihId = pelatihAccount.pelatih!.id_pelatih;

    // Buat 3 atlet
    await prisma.tb_atlet.create({
      data: 
        {
          nama_atlet: 'Andi Sumarecon',
          tanggal_lahir: new Date('2005-05-10'),
          berat_badan: 60,
          tinggi_badan: 170,
          jenis_kelamin: 'LAKI_LAKI',  // ✅ harus sama persis
          id_dojang: dojang.id_dojang,
          id_pelatih_pembuat: pelatihId,
          akte_kelahiran: 'akte_andi.pdf',
          pas_foto: 'andi.jpg',
          sertifikat_belt: 'belt_1.pdf'
        }
    });
  
    console.log('✅ 3 Atlet created');

  } else {
    console.log('ℹ️ Pelatih account already exists');
  }
}



main()
  .then(() => console.log('🎉 Seeding completed'))
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect();
  });