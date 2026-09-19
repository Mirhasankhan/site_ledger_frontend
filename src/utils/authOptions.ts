import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  // callbacks: {
  //   async signIn({ user }) {
  //     console.log("Inside signIn callback", user);
  //     if (user.name && user.email) {
  //       getData(user.name, user.email);
  //     }
  //     return true;
  //   },
  // },
  callbacks: {
  async signIn({ user }) {
    console.log("Inside signIn callback", user);

    if (user.name && user.email) {
      try {
        const res = await fetch(`https://glamvibe-backend.vercel.app/api/v1/auth/social-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: user.name,
            email: user.email,
          }),
        });

        const result = await res.json();

        if (res.ok && result?.data?.result?.accessToken) {          
          (user as any).token = result.data.result.accessToken;
          (user as any).role = result.data.result.userInfo.role;
        }
      } catch (error) {
        console.error("Error calling social login API", error);
      }
    }

    return true;
  },
  },
};
