import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/", "/parties/:path*", "/workspaces/:path*", "/data-transfer/:path*", "/api/data/:path*"],
};
