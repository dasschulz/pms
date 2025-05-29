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
        const { email, password: providedPassword } = credentials;
        
        console.log('🔐 NextAuth authorize (Create/Migrate Supabase Auth User v2): Attempting login for:', email);
        
        const { data: userRecordFromPublicUsers, error: fetchPubUserError } = await supabaseAdmin
          .from('users') // This is public.users
          .select('*, temp_password, supabase_auth_user_id') // Include supabase_auth_user_id
          .eq('email', email)
          .eq('active', true)
          .single();

        if (fetchPubUserError || !userRecordFromPublicUsers) {
          console.error('🔐 NextAuth authorize: User not found in public.users or error:', email, fetchPubUserError?.message);
          return null;
        }
        
        const publicUsersId = userRecordFromPublicUsers.id;
        console.log('🔐 NextAuth authorize: Found user in public.users with ID:', publicUsersId, 'Name:', userRecordFromPublicUsers.name);

        if (userRecordFromPublicUsers.temp_password) {
          if (providedPassword === userRecordFromPublicUsers.temp_password) {
            console.log('🔐 NextAuth authorize: Temporary password matches for:', email);
            let finalAuthUserId: string | undefined = userRecordFromPublicUsers.supabase_auth_user_id || undefined;
            let passwordSuccessfullySetInAuth = false;

            try {
              // Attempt to create the user in Supabase Auth. Supabase will generate the ID.
              console.log('🔐 NextAuth authorize: Attempting to create user in Supabase Auth for email:', email);
              const { data: newAuthUserResponse, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                email: userRecordFromPublicUsers.email,
                password: providedPassword,
                email_confirm: true, 
                user_metadata: { 
                  name: userRecordFromPublicUsers.name,
                  public_users_id: publicUsersId // Store original public.users.id in metadata for reference
                },
              });

              if (createUserError) {
                if (createUserError.message.includes('User already registered') || createUserError.message.includes('already exists')) {
                  console.log('🔐 NextAuth authorize: User already exists in Supabase Auth (email:', email, '). Attempting to find and update password.');
                  
                  const { data: existingUsersSearch, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
                  
                  if (listUsersError) {
                    console.error('🔐 NextAuth authorize: Error listing users to find existing auth user by email:', listUsersError.message);
                    return null; 
                  }
                  
                  const existingAuthUser = existingUsersSearch?.users.find(u => u.email === email);

                  if (existingAuthUser && existingAuthUser.id) {
                    finalAuthUserId = existingAuthUser.id;
                    console.log('🔐 NextAuth authorize: Found existing Supabase Auth user with ID:', finalAuthUserId, '. Updating password.');
                    const { error: updatePwdError } = await supabaseAdmin.auth.admin.updateUserById(
                      finalAuthUserId,
                      { password: providedPassword }
                    );
                    if (updatePwdError) {
                      console.error('🔐 NextAuth authorize: FAILED to update password for existing Supabase Auth user ID:', finalAuthUserId, updatePwdError.message);
                      return null; 
                    }
                    console.log('🔐 NextAuth authorize: Successfully UPDATED password for existing Supabase Auth user ID:', finalAuthUserId);
                    passwordSuccessfullySetInAuth = true;
                  } else {
                    console.error('🔐 NextAuth authorize: User marked as already existing in Auth, but could not find them by email via listUsers to get ID. Email:', email);
                    return null; 
                  }
                } else {
                  console.error('🔐 NextAuth authorize: FAILED to create user in Supabase Auth for email:', email, 'Error:', createUserError.message);
                  return null; 
                }
              } else if (newAuthUserResponse && newAuthUserResponse.user) {
                finalAuthUserId = newAuthUserResponse.user.id;
                console.log('🔐 NextAuth authorize: Successfully CREATED user in Supabase Auth with ID:', finalAuthUserId, 'for email:', email);
                passwordSuccessfullySetInAuth = true;
              } else {
                console.error('🔐 NextAuth authorize: createUser in Supabase Auth did not return a user object or an error. This is unexpected.');
                return null;
              }

              if (passwordSuccessfullySetInAuth && finalAuthUserId) {
                const { error: updatePublicUserError } = await supabaseAdmin
                  .from('users') 
                  .update({ temp_password: null, supabase_auth_user_id: finalAuthUserId })
                  .eq('id', publicUsersId);
                if (updatePublicUserError) {
                  console.error('🔐 NextAuth authorize: FAILED to update public.users (clear temp_password, set supabase_auth_user_id) for ID:', publicUsersId, updatePublicUserError.message);
                }
              } else {
                console.error('🔐 NextAuth authorize: Password was not set/authID not determined. Denying login.');
                return null;
              }

              const userToReturn = {
                id: finalAuthUserId!, 
                name: userRecordFromPublicUsers.name,
                email: userRecordFromPublicUsers.email,
                image: userRecordFromPublicUsers.profile_picture_url,
                wahlkreis: userRecordFromPublicUsers.wahlkreis,
                landesverband: userRecordFromPublicUsers.landesverband,
              };
              console.log('🔐 NextAuth authorize: Migration/Login successful. Returning user object (Auth ID:', finalAuthUserId, '):', JSON.stringify(userToReturn, null, 2));
              return userToReturn as any;

            } catch (e: any) {
              console.error('🔐 NextAuth authorize: EXCEPTION during Supabase Auth user creation/update for:', email, e.message, e);
              return null;
            }
          } else {
            console.log('🔐 NextAuth authorize: Temporary password MISMATCH for:', email);
            return null; 
          }
        } else {
          // temp_password is NULL. User is considered migrated.
          // This path is taken if:
          // 1. User tries to log in with legacy path after migration (should be rare).
          // 2. LoginModal calls signIn('credentials',...) *after* a successful supabase.auth.signInWithPassword().
          // In scenario 2, password was already checked by Supabase. We just need to build the NextAuth session.
          console.log('🔐 NextAuth authorize: temp_password is NULL for:', email, '. User is considered migrated or Supabase direct login was successful.');
          
          const authIdFromPublicUsers = userRecordFromPublicUsers.supabase_auth_user_id;
          const isAuthIdValidUUID = authIdFromPublicUsers ? isValidUUID(authIdFromPublicUsers) : false;

          console.log('🔐 NextAuth authorize: Checking supabase_auth_user_id from public.users for:', email, '. Value:', authIdFromPublicUsers, 'Is valid UUID:', isAuthIdValidUUID);

          if (!authIdFromPublicUsers || !isAuthIdValidUUID) {
            console.error(
              '🔐 NextAuth authorize: Migrated user OR user after Supabase direct login does not have a valid supabase_auth_user_id in public.users. Email:',
              email,
              'ID found:',
              authIdFromPublicUsers,
              'Is valid UUID check result:', isAuthIdValidUUID
            );
            return null; 
          }
          
          // The password was (or should have been) already checked by supabase.auth.signInWithPassword() if this is the sync call.
          // If this is a direct attempt to use credentials on a migrated user, this will succeed without password check here - 
          // which is acceptable if primary login is Supabase direct, and this only syncs the session.
          const userToReturn = {
            id: userRecordFromPublicUsers.supabase_auth_user_id, // This IS the Supabase Auth User ID
            name: userRecordFromPublicUsers.name,
            email: userRecordFromPublicUsers.email,
            image: userRecordFromPublicUsers.profile_picture_url,
            wahlkreis: userRecordFromPublicUsers.wahlkreis,
            landesverband: userRecordFromPublicUsers.landesverband,
            // We need to ensure all fields that jwt/session callbacks expect are here.
            // These should match the fields populated during the temp_password path.
            role: userRecordFromPublicUsers.role, // Make sure this exists in public.users
            is_fraktionsvorstand: userRecordFromPublicUsers.is_fraktionsvorstand, // Make sure this exists
          };
          console.log('🔐 NextAuth authorize: Returning user object for already migrated user/session sync (Auth ID:', userToReturn.id, '):', JSON.stringify(userToReturn, null, 2));
          return userToReturn as any;
        }
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