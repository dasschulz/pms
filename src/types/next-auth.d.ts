import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      wahlkreis?: string;
      landesverband?: string;
    }
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    wahlkreis?: string;
    landesverband?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    image?: string;
    wahlkreis?: string;
    landesverband?: string;
  }
} 