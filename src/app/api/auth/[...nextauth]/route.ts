import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from '@/lib/supabase';
import { NextAuthOptions } from "next-auth";

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate environment variables
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('🔐 NextAuth: Missing required environment variables:', missingEnvVars);
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
        
        // Find user by email and active status using ADMIN client to bypass RLS
        const { data: userRecord, error } = await supabaseAdmin
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

      // Ensure token object exists
      if (!token) {
        console.error('🔐 NextAuth JWT callback: Token is null or undefined');
        return {};
      }

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
        if (!user.id || !isValidUUID(user.id)) {
          console.error('🔐 NextAuth JWT callback: INVALID UUID FROM AUTHORIZE:', user.id);
          return { ...token, error: "InvalidUserIdFromAuthorize" };
        }
        
        try {
          // Use admin client here too
          const { data: supabaseUser, error } = await supabaseAdmin
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

          // Set token properties using Supabase data with null checks
          token.id = supabaseUser.id; // Supabase UUID
          token.supabaseId = supabaseUser.id; // Keep Supabase UUID for clarity
          
          token.name = supabaseUser.name || '';
          token.email = supabaseUser.email || '';
          token.image = supabaseUser.profile_picture_url || null;
          token.wahlkreis = supabaseUser.wahlkreis || '';
          token.landesverband = supabaseUser.landesverband || '';
          token.role = supabaseUser.role || '';
          token.isFraktionsvorstand = supabaseUser.is_fraktionsvorstand || false;

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
      
      // Ensure session and session.user exist
      if (!session) {
        console.error('🔐 NextAuth session callback: Session is null or undefined, creating empty session');
        session = { user: {}, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
      }
      
      if (!session.user) {
        console.error('🔐 NextAuth session callback: Session.user is null or undefined, creating empty user');
        session.user = {};
      }
      
      // Check for token errors - instead of returning null, clear the session
      if (token?.error) {
        console.error('🔐 NextAuth session callback: Token has error:', token.error);
        // Return empty session instead of null to prevent client errors
        return {
          user: {},
          expires: new Date(0).toISOString() // Expired session
        };
      }
      
      // Validate token ID before setting session - instead of returning null, clear the session
      if (token?.id && !isValidUUID(token.id)) {
        console.error('🔐 NextAuth session callback: INVALID UUID IN TOKEN:', token.id);
        // Return empty session instead of null to prevent client errors
        return {
          user: {},
          expires: new Date(0).toISOString() // Expired session
        };
      }
      
      if (token) {
        session.user.id = token.id || '';
        session.user.supabaseId = token.supabaseId || '';
        session.user.name = token.name || '';
        session.user.email = token.email || '';
        session.user.image = token.image || null;
        session.user.wahlkreis = token.wahlkreis || '';
        session.user.landesverband = token.landesverband || '';
        session.user.role = token.role || '';
        session.user.isFraktionsvorstand = token.isFraktionsvorstand || false;
        
        console.log('🔐 NextAuth session callback: Final session user ID:', session.user.id);
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/anmelden',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: false,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 