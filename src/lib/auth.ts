import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();

        const users = await prisma.$queryRawUnsafe(
          `SELECT id, name, email, password, role, "visiblePassword" FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
          email
        ) as any[];

        const user = users[0];
        if (!user) return null;

        const plain = user.visiblePassword;
        let hashOk = false;
        try {
          if (user.password) {
            hashOk = await bcrypt.compare(credentials.password, user.password);
          }
        } catch {
          hashOk = false;
        }
        const plainOk = plain && String(plain).trim() === credentials.password;

        if (!hashOk && !plainOk) return null;

        if (plainOk && !hashOk) {
          const newHash = await bcrypt.hash(credentials.password, 10);
          await prisma.$executeRawUnsafe(
            `UPDATE "User" SET password = $1 WHERE id = $2`,
            newHash,
            user.id
          );
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};