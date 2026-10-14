import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "admin@vertikalbuana.com").toLowerCase();
    const password = searchParams.get("password") || "admin123";

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ ok: false, reason: "user tidak ketemu", email });
    }

    const hashOk = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    return NextResponse.json({
      ok: hashOk,
      email: user.email,
      role: user.role,
      hashOk,
      passwordStartsWith: user.password?.slice(0, 4) || "",
      nextAuthUrl: process.env.NEXTAUTH_URL || "KOSONG",
      hasSecret: Boolean(process.env.NEXTAUTH_SECRET),
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      reason: error?.message || "error",
    });
  }
}