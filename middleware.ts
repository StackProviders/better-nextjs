import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = ["/sign-in", "/forget-password", "/reset-password", "/two-factor"]
const publicRoutes = ["/", "/about", "/contact"]

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const cookies = getSessionCookie(request);
	const isAuthRoute = authRoutes.includes(pathname);
	const isPublicRoute = publicRoutes.includes(pathname);
	const isLoggedIn = !!cookies;

	// Allow access to public routes for any user
	if (isPublicRoute) {
		return NextResponse.next();
	}

	// If user is logged in and trying to access auth routes, redirect to callbackUrl or home
	if (isLoggedIn && isAuthRoute) {
		const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
		return NextResponse.redirect(new URL(callbackUrl, request.url));
	}

	// If user is not logged in and trying to access protected routes, redirect to sign-in with callbackUrl
	if (!isLoggedIn && !isAuthRoute) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"]
};
