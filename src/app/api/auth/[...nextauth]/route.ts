import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from '@/lib/supabase';
import { NextAuthOptions } from "next-auth";

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'E-Mail', type: 'email', placeholder: 'max.mustermann@bundestag.de' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;
        const { email, password } = credentials;
        
        console.log('🔐 NextAuth authorize: Attempting login for:', email);
        
        // Find user by email and active status
        const { data: userRecord, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .single();

        if (error || !userRecord) {
          console.log('🔐 NextAuth authorize: User not found or inactive:', email, error?.message);
          return null;
        }

        console.log('🔐 NextAuth authorize: Found user with ID:', userRecord.id, 'Name:', userRecord.name);

        // Validate that we have a proper UUID
        if (!isValidUUID(userRecord.id)) {
          console.error('🔐 NextAuth authorize: INVALID UUID FORMAT:', userRecord.id);
          return null;
        }

        // Note: In a real implementation, you'd want to hash passwords
        // For now, we're assuming direct password comparison (migrate existing logic)
        // TODO: Implement proper password hashing with bcrypt
        
        // Return user object (cast to any to include custom fields)
        const userToReturn = {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          image: userRecord.profile_picture_url,
          wahlkreis: userRecord.wahlkreis,
          landesverband: userRecord.landesverband,
        };
        
        console.log('🔐 NextAuth authorize: Returning user object:', JSON.stringify(userToReturn, null, 2));
        return userToReturn as any;
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user, account }: { token: any; user?: any, account?: any }) {
      console.log('🔐 NextAuth JWT callback: Called with:', {
        hasAccount: !!account,
        hasUser: !!user,
        userEmail: user?.email,
        userId: user?.id,
        tokenId: token?.id,
        tokenEmail: token?.email
      });

      // Check for problematic user IDs in existing token
      if (token?.id && !isValidUUID(token.id)) {
        console.error('🔐 NextAuth JWT callback: INVALID UUID IN EXISTING TOKEN:', token.id);
        // Force token to be invalid to trigger re-authentication
        return { ...token, error: "InvalidUserId" };
      }

      if (account && user && user.email) {
        console.log('🔐 NextAuth JWT callback: Processing new login for:', user.email);
        console.log('🔐 NextAuth JWT callback: User object from authorize:', JSON.stringify(user, null, 2));
        
        // Validate user ID from authorize callback
        if (!isValidUUID(user.id)) {
          console.error('🔐 NextAuth JWT callback: INVALID UUID FROM AUTHORIZE:', user.id);
          return { ...token, error: "InvalidUserIdFromAuthorize" };
        }
        
        try {
          const { data: supabaseUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (error || !supabaseUser) {
            console.error(`🔐 NextAuth JWT callback: User with email ${user.email} not found in Supabase:`, error?.message);
            return { ...token, error: "SupabaseUserNotFound" };
          }

          // Double check UUID from Supabase
          if (!isValidUUID(supabaseUser.id)) {
            console.error('🔐 NextAuth JWT callback: INVALID UUID FROM SUPABASE:', supabaseUser.id);
            return { ...token, error: "InvalidSupabaseUserId" };
          }

          console.log('🔐 NextAuth JWT callback: Found Supabase user with ID:', supabaseUser.id);

          // Set token properties using Supabase data
          token.id = supabaseUser.id; // Supabase UUID
          token.supabaseId = supabaseUser.id; // Keep Supabase UUID for clarity
          
          token.name = supabaseUser.name;
          token.email = supabaseUser.email;
          token.image = supabaseUser.profile_picture_url;
          token.wahlkreis = supabaseUser.wahlkreis;
          token.landesverband = supabaseUser.landesverband;
          token.role = supabaseUser.role;
          token.isFraktionsvorstand = supabaseUser.is_fraktionsvorstand;

          console.log('🔐 NextAuth JWT callback: Updated token with ID:', token.id);

        } catch (error) {
          console.error("🔐 NextAuth JWT callback: Error fetching user from Supabase:", error);
          return { ...token, error: "SupabaseFetchError" };
        }
      } else {
        console.log('🔐 NextAuth JWT callback: Existing session, token ID:', token?.id);
      }
      
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('🔐 NextAuth session callback: Called with token ID:', token?.id, 'token email:', token?.email);
      
      // Check for token errors
      if (token?.error) {
        console.error('🔐 NextAuth session callback: Token has error:', token.error);
        // Force sign out by returning null session
        return null;
      }
      
      // Validate token ID before setting session
      if (token?.id && !isValidUUID(token.id)) {
        console.error('🔐 NextAuth session callback: INVALID UUID IN TOKEN:', token.id);
        // Force sign out by returning null session
        return null;
      }
      
      if (token) {
        session.user.id = token.id as string; // Supabase UUID
        session.user.supabaseId = token.supabaseId as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string | null;
        session.user.wahlkreis = token.wahlkreis as string;
        session.user.landesverband = token.landesverband as string;
        session.user.role = token.role as string;
        session.user.isFraktionsvorstand = token.isFraktionsvorstand as boolean;
        
        console.log('🔐 NextAuth session callback: Final session user ID:', session.user.id);
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/anmelden',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 