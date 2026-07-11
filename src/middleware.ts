import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isMentorRoute = req.nextUrl.pathname.startsWith("/dashboard/mentor");
    const isStudentRoute = req.nextUrl.pathname.startsWith("/dashboard/student");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard/admin");
    const isApiAdmin = req.nextUrl.pathname.startsWith("/api/admin");

    // API admin protection: return JSON 401 if unauthorized
    if (isApiAdmin) {
      if (!token || token.role !== "ADMIN") {
        return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // UI admin protection: redirect to corresponding dashboard if not ADMIN
    if (isAdminRoute && token?.role !== "ADMIN") {
      if (token?.role === "MENTOR") {
        return NextResponse.redirect(new URL("/dashboard/mentor", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }

    // Redirect based on role
    if (token?.role === "MENTOR" && isStudentRoute) {
      return NextResponse.redirect(new URL("/dashboard/mentor", req.url));
    }
    if (token?.role === "STUDENT" && isMentorRoute) {
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Let the middleware function handle API auth directly to return JSON instead of redirecting
        if (req.nextUrl.pathname.startsWith("/api/admin")) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
}; 