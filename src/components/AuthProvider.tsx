'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { IUser } from '@/models/User';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/api';

/**
 * Returns true when all mandatory profile fields are filled in.
 * These are the same fields checked in OnboardingGate so they stay in sync.
 */
export function isProfileComplete(profile: IUser | null): boolean {
    if (!profile) return false;
    const p = profile as any;
    return !!(
        profile.name?.trim() &&
        p.college?.trim() &&
        profile.year &&
        profile.acceptedGuidelines &&
        profile.verified
    );
}

interface AuthContextType {
    user: any | null;
    profile: IUser | null;
    loading: boolean;
    /** True when the user has filled in all mandatory profile fields */
    profileComplete: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    profileComplete: false,
    refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchProfile = async (uid: string) => {
        try {
            const res = await fetch(`/api/users/${uid}`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
            } else {
                if (res.status === 404) {
                    setProfile(null);
                } else {
                    console.error('Failed to fetch user profile', res.statusText);
                    setProfile(null);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
        }
    };

    useEffect(() => {
        let mounted = true;
        const sync = async () => {
            if (status === 'loading') {
                setLoading(true);
                return;
            }
            if (status === 'unauthenticated' || !session) {
                if (!mounted) return;
                setUser(null);
                setProfile(null);
                setLoading(false);
                return;
            }
            const uid = (session?.user as any)?.id;
            if (uid) {
                if (!mounted) return;
                const suser = (session?.user as any) || {};
                setUser({ ...suser, uid: suser.id, photoURL: suser.image || suser.photoURL || null });
                await fetchProfile(uid);
            } else {
                setUser(null);
                setProfile(null);
            }
            if (!mounted) return;
            setLoading(false);
        };
        sync();
        return () => { mounted = false; };
    }, [session, status]);

    // Protect routes — redirect unauthenticated users to /login
    useEffect(() => {
        if (loading) return;

        const publicRoutes = ['/', '/login', '/signup', '/guidelines', '/privacy', '/terms'];
        const isPublic = publicRoutes.includes(pathname);

        if (!user) {
            if (!isPublic) router.replace('/login');
        } else {
            if (!loading) {
                if (!profile) {
                    if (pathname !== '/login') router.replace('/login');
                }
                // Only redirect to login for guidelines if they haven't accepted
                // AND they are on a page that requires it (not public info pages)
                else if (!profile.acceptedGuidelines && !isPublic && pathname !== '/login') {
                    router.replace('/login');
                }
                // Note: profile incompleteness is handled by OnboardingGate (overlay),
                // NOT by a redirect, so users stay on their current URL.
            }
        }
    }, [loading, user, profile, pathname, router]);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    const profileComplete = isProfileComplete(profile);

    return (
        <AuthContext.Provider value={{ user, profile, loading, profileComplete, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
