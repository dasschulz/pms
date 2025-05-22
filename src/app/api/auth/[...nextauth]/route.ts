import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { base } from '@/lib/airtable';

export const authOptions = {
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
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
        token.wahlkreis = user.wahlkreis;
        token.landesverband = user.landesverband;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.image = token.image as string | null;
        session.user.wahlkreis = token.wahlkreis as string;
        session.user.landesverband = token.landesverband as string;
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