import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const [rows] = await pool.query<RowDataPacket[]>(
                    "SELECT * FROM users WHERE email = ?",
                    [credentials.email]
                );

                const user = rows[0];

                if (!user) {
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
    // pages: {
    //     signIn: "/auth/signin",
    // },
    secret: process.env.NEXTAUTH_SECRET,
};

console.log("NEXTAUTH_SECRET loaded:", process.env.NEXTAUTH_SECRET ? "YES" : "NO");

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
