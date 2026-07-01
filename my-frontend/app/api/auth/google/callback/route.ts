// import { BACKDEND_BASE_URL } from "@/constants/api";
// import { NextResponse } from "next/server";
// import { NextRequest } from "next/server";

// export async function GET(request: NextRequest) {
//     const searchParams = request.nextUrl.searchParams;
//     const code = searchParams.get("code");
//     const state = searchParams.get("state");

//     // Reconstruct the callback URL for the backend
//     const backendUrl = new URL(`${BACKDEND_BASE_URL}/auth/google/callback`);
//     if (code) backendUrl.searchParams.set("code", code);
//     if (state) backendUrl.searchParams.set("state", state);

//     try {
//         // We call the backend callback from the server side
//         // and pass along any cookies (important for session)
//         const response = await fetch(backendUrl.toString(), {
//             headers: {
//                 cookie: request.headers.get("cookie") || "",
//             },
//         });

//         if (!response.ok) {
//             return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", request.url));
//         }

//         const data = await response.json();

//         // Handle the scenarios from the API Contract
//         const frontendUrl = new URL(request.url).origin;

//         if (data.status === "verification_required") {
//             const verifyUrl = new URL("/auth/verify-email", frontendUrl);
//             verifyUrl.searchParams.set("email", data.email);
//             verifyUrl.searchParams.set("message", data.message);
//             return NextResponse.redirect(verifyUrl);
//         }

//         if (data.status === "signed_in") {
//             // Success! Redirect to home. 
//             // The browser will receive the set-cookie headers from the backend
//             // because this is a server-side fetch that we need to proxy back.

//             const res = NextResponse.redirect(new URL("/home", request.url));

//             // Forward Set-Cookie headers from backend to frontend
//             const setCookie = response.headers.get("set-cookie");
//             if (setCookie) {
//                 res.headers.set("set-cookie", setCookie);
//             }

//             return res;
//         }

//         return NextResponse.redirect(new URL("/auth/signin", request.url));
//     } catch (error) {
//         console.error("Google callback proxy error:", error);
//         return NextResponse.redirect(new URL("/auth/signin?error=internal_error", request.url));
//     }
// }
import { BACKDEND_BASE_URL } from "@/constants/api";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const DEFAULT_LOCALE = "en";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Reconstruct the callback URL for the backend
    const backendUrl = new URL(`${BACKDEND_BASE_URL}/auth/google/callback`);
    if (code) backendUrl.searchParams.set("code", code);
    if (state) backendUrl.searchParams.set("state", state);

    try {
        // We call the backend callback from the server side
        // and pass along any cookies (important for session)
        const response = await fetch(backendUrl.toString(), {
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
        });

        if (!response.ok) {
            return NextResponse.redirect(
                new URL(`/${DEFAULT_LOCALE}/auth/signin?error=auth_failed`, request.url)
            );
        }

        const data = await response.json();

        if (data.status === "verification_required") {
            const verifyUrl = new URL(`/${DEFAULT_LOCALE}/auth/verify-email`, request.url);
            verifyUrl.searchParams.set("email", data.email);
            verifyUrl.searchParams.set("message", data.message);
            return NextResponse.redirect(verifyUrl);
        }

        if (data.status === "signed_in") {
            const res = NextResponse.redirect(
                new URL(`/${DEFAULT_LOCALE}/home`, request.url)
            );

            const setCookies = typeof response.headers.getSetCookie === "function"
                ? response.headers.getSetCookie()
                : [];

            if (setCookies.length > 0) {
                setCookies.forEach((cookie) => {
                    res.headers.append("set-cookie", cookie);
                });
            } else {
                const setCookie = response.headers.get("set-cookie");
                if (setCookie) {
                    res.headers.set("set-cookie", setCookie);
                }
            }

            return res;
        }

        return NextResponse.redirect(
            new URL(`/${DEFAULT_LOCALE}/auth/signin`, request.url)
        );
    } catch (error) {
        console.error("Google callback proxy error:", error);
        return NextResponse.redirect(
            new URL(`/${DEFAULT_LOCALE}/auth/signin?error=internal_error`, request.url)
        );
    }
}