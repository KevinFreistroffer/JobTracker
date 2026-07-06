import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isAllowedGitHubUsername } from "@/lib/auth-allowlist";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    signIn({ profile }) {
      const login =
        profile && "login" in profile && typeof profile.login === "string"
          ? profile.login
          : undefined;

      if (!isAllowedGitHubUsername(login)) {
        return "/unauthorized";
      }

      return true;
    },
  },
});
