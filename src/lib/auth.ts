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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        const users = await prisma.$queryRawUnsafe<
          Array<{
            id: string;
            name: string;
            email: string;
            password: string;
            role: string;
            visiblePassword: string | null;
          }>
        >(
          `SELECT id, name, email, password, role, "visiblePassword"
           FROM "User"
           WHERE lower(email) = $1
           LIMIT 1`,
          email
        );

        const user = users[0];
        if (!user) return null;

        const hashValid = await bcrypt.compare(credentials.password, user.password);
        const visibleValid = user.visiblePassword === credentials.password;

        if (!hashValid && !visibleValid) {
          return null;
        }

        if (visibleValid && !hashValid) {
          const hashed = await bcrypt.hash(credentials.password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed },
          });
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
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};