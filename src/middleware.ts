import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/api/auth/signin");
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");
    const isRootPage = req.nextUrl.pathname === "/";

    if (isAuthPage) {
        if (isAuth) {
            // Redirect to the appropriate dashboard based on role
            const role = token.role as string;
            console.log("Middleware Redirect: Role is", role);
            return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
        }
        return null;
    }

    if (isDashboardPage) {
        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            return NextResponse.redirect(
                new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.url)
            );
        }

        // Enforce role-based access
        const role = token.role as string;
        const requestedPath = req.nextUrl.pathname;

        // Check if the requested path matches the user's role
        if (requestedPath.startsWith("/dashboard/admin") && role !== "admin") {
            return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
        }
        if (requestedPath.startsWith("/dashboard/instructor") && role !== "instructor") {
            return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
        }
        if (requestedPath.startsWith("/dashboard/student") && role !== "student") {
            return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
        }
    }

    if (isRootPage && isAuth) {
        const role = token.role as string;
        console.log("Middleware Root Redirect: Role is", role);
        return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*", "/api/auth/signin"],
};
