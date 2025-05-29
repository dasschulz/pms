import NextAuth, { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Supabase UUID
      supabaseId?: string; // Explicit Supabase UUID
      name?: string | null;
      email?: string | null;
      image?: string | null;
      wahlkreis?: string | null;
      landesverband?: string | null;
      role?: string | null;
      airtableRecordId?: string; // Legacy tracking field
      userIdNumeric?: number; // Keep for compatibility
      isFraktionsvorstand?: boolean;
    } & Omit<DefaultSession["user"], 'id' | 'name' | 'email' | 'image'>
  }

  interface User {
    id: string; // Supabase UUID
    name: string;
    email: string;
    image?: string | null;
    wahlkreis?: string | null;
    landesverband?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id: string; // Supabase UUID
    supabaseId?: string; // Explicit Supabase UUID
    name?: string | null;
    email?: string | null;
    image?: string | null;
    wahlkreis?: string | null;
    landesverband?: string | null;
    role?: string | null;
    airtableRecordId?: string; // Legacy tracking field
    userIdNumeric?: number; // Keep for compatibility
    error?: "SupabaseUserNotFound" | "SupabaseFetchError"; // Current auth system
    isFraktionsvorstand?: boolean;
  }
} 