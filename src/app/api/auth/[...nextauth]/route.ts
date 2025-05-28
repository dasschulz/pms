import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { base } from '@/lib/airtable';
import { NextAuthOptions } from "next-auth";

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
        // Find user by email and active
        const records = await base('Users')
          .select({
            filterByFormula: `AND({Email} = '${email}', {Active} = TRUE())`,
            maxRecords: 1,
          })
          .firstPage();
        const userRecord = records[0];
        if (!userRecord) return null;
        const storedPassword = userRecord.get('Passwort') as string;
        if (storedPassword !== password) {
          return null;
        }
        const attachments = userRecord.get('Profile Picture') as any[];
        const profilePictureUrl = attachments?.[0]?.url || null;
        // Return user object (cast to any to include custom fields)
        return {
          id: String(userRecord.get('UserID')),
          name: String(userRecord.get('Name')),
          email: String(userRecord.get('Email')),
          image: profilePictureUrl,
          wahlkreis: userRecord.get('Wahlkreis') as string,
          landesverband: userRecord.get('Landesverband') as string,
        } as any;
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user, account }: { token: any; user?: any, account?: any }) {
      if (account && user && user.email) {
        try {
          const records = await base('Users').select({
            filterByFormula: `{Email} = "${user.email}"`,
            maxRecords: 1,
          }).firstPage();

          if (records && records.length > 0) {
            const airtableUser = records[0];
            token.airtableRecordId = airtableUser.id;
            token.userIdNumeric = airtableUser.fields.UserID;
            
            // Get fresh profile picture URL from Airtable
            const attachments = airtableUser.fields['Profile Picture'] as any[];
            const profilePictureUrl = attachments?.[0]?.url || null;
            
            token.id = user.id;
            token.name = airtableUser.fields.Name;
            token.email = airtableUser.fields.Email;
            token.image = profilePictureUrl; // Use fresh URL from Airtable
            token.wahlkreis = airtableUser.fields.Wahlkreis;
            token.landesverband = airtableUser.fields.Landesverband;
            token.role = airtableUser.fields.Role;

          } else {
            console.error(`User with email ${user.email} not found in Airtable.`);
            return { ...token, error: "AirtableUserNotFound" };
          }
        } catch (error) {
          console.error("Error fetching user from Airtable in JWT callback:", error);
          return { ...token, error: "AirtableFetchError" };
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string | null;
        session.user.wahlkreis = token.wahlkreis as string;
        session.user.landesverband = token.landesverband as string;
        session.user.role = token.role as string;
        session.user.airtableRecordId = token.airtableRecordId as string;
        session.user.userIdNumeric = token.userIdNumeric as number;
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