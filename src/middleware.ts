import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isMentorRoute = req.nextUrl.pathname.startsWith("/dashboard/mentor");
    const isStudentRoute = req.nextUrl.pathname.startsWith("/dashboard/student");

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
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
}; 