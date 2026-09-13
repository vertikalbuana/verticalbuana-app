import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hapus data lama
  await prisma.attendance.deleteMany();
  await prisma.projectWorker.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Buat Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin Vertikal",
      email: "admin@vertikalbuana.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Buat Leader
  const leaderPassword = await bcrypt.hash("leader123", 10);
  const leader = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "leader@vertikalbuana.com",
      password: leaderPassword,
      role: "LEADER",
    },
  });

  // Buat Project contoh
  const project = await prisma.project.create({
    data: {
      name: "Gedung Vertikal Tower",
      location: "Jl. Vertikal No. 88, Jakarta Selatan",
      description: "Pembangunan gedung perkantoran 32 lantai",
      status: "AKTIF",
      leaderId: leader.id,
    },
  });

  // Buat beberapa pekerja
  const workersData = [
    { name: "Suparman", position: "Mandor", nik: "3175010101010001" },
    { name: "Joko Widodo", position: "Tukang Besi", nik: "3175010101010002" },
    { name: "Ahmad Fauzi", position: "Tukang", nik: "3175010101010003" },
    { name: "Rudi Hartono", position: "Tukang Kayu", nik: "3175010101010004" },
    { name: "Samsul Arifin", position: "Tukang", nik: "3175010101010005" },
  ];

  for (const w of workersData) {
    const worker = await prisma.worker.create({
      data: w,
    });

    await prisma.projectWorker.create({
      data: {
        projectId: project.id,
        workerId: worker.id,
      },
    });
  }

  console.log("✅ Seed berhasil!");
  console.log("Admin login → email: admin@vertikalbuana.com | password: admin123");
  console.log("Leader login → email: leader@vertikalbuana.com | password: leader123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });