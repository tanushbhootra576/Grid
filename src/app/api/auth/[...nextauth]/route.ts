import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Upsert user into MongoDB on sign-in
    async signIn(params: any) {
      const { user, account, profile } = params;
      try {
        await dbConnect();
        const firebaseUid = account?.providerAccountId || (profile && (profile as any).sub);
        const email = user.email as string;
        const name = (user.name as string) || (profile && (profile as any).name) || email.split('@')[0];

        if (!firebaseUid || !email) {
          console.error('[nextauth.signIn] missing required fields', { firebaseUid, email, name });
          return false;
        }

        // Re-use the same detection logic as /api/users POST route
        let yearOfStudy = 1;
        let calculatedRole: any = "student";

        const emailMatch = email.match(/(\d{2,4})@.*$/);
        if (emailMatch) {
          let joiningYear = parseInt(emailMatch[1], 10);
          if (joiningYear < 100) joiningYear += 2000;
          const now = new Date();
          const currentCalendarYear = now.getFullYear();
          const currentMonth = now.getMonth();

          yearOfStudy = currentCalendarYear - joiningYear;
          if (currentMonth >= 6) yearOfStudy += 1;
        }

        if (yearOfStudy < 1) yearOfStudy = 1;
        if (yearOfStudy > 4) calculatedRole = "alumni";

        let existing = await User.findOne({ firebaseUid });

        if (!existing) {
          await User.create({
            firebaseUid,
            email,
            name,
            role: calculatedRole,
            year: yearOfStudy,
            profileLocked: false,
            skills: [],
            interests: [],
          });
        } else {
          const updates: any = {};
          if (!existing.year || existing.year !== yearOfStudy) updates.year = yearOfStudy;
          if (existing.role !== 'admin' && existing.role !== calculatedRole) updates.role = calculatedRole;
          if (existing.role !== 'admin' && existing.role !== calculatedRole) updates.role = calculatedRole;

          if (Object.keys(updates).length > 0) {
            Object.assign(existing, updates);
            await existing.save();
          }
        }

        return true;
      } catch (err) {
        console.error('[nextauth.signIn] error', err);
        return false;
      }
    },

    // Persist provider id into JWT token
    async jwt(params: any) {
      const { token, user, account } = params;
      if (account?.providerAccountId) {
        (token as any).uid = account.providerAccountId;
      }
      // When first signing in, NextAuth may pass `user`
      if (!(token as any).uid && user && (user as any).id) {
        (token as any).uid = (user as any).id;
      }
      return token;
    },

    // Expose uid in session.user.id and session.user.uid
    async session(params: any) {
      const { session, token } = params;
      if (!session.user) (session as any).user = {};
      const uid = (token as any).uid || (token as any).sub;
      if (uid) {
        (session.user as any).uid = uid;
        (session.user as any).id = uid;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions as any);

export const GET = handler;
export const POST = handler;
