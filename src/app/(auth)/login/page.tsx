'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const roleBadgeVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  MANAGER: 'success',
  EMPLOYEE: 'warning',
  ADMIN: 'danger',
};

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<MockUser[]>([]);
  const [signingInId, setSigningInId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/users')
      .then(res => res.json())
      .then((data: MockUser[]) => setUsers(data))
      .catch(() => {});
  }, []);

  const handleLogin = async (user: MockUser) => {
    setSigningInId(user.id);
    const result = await signIn('credentials', {
      email: user.email,
      redirect: false,
    });
    if (result?.ok) {
      router.push('/dashboard');
    } else {
      setSigningInId(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-gray p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="p-10 text-center shadow-modal">
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-rausch tracking-tight mb-2">Gatherings</h1>
            <p className="text-foggy text-lg">Plan intentional team gatherings</p>
          </div>

          <CardContent className="p-0">
            <p className="text-sm font-medium text-kazan mb-4">Sign in as:</p>
            <div className="space-y-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u)}
                  disabled={signingInId !== null}
                  className="w-full flex items-center gap-4 rounded-card border border-light-gray bg-white p-4 text-left hover:border-kazan hover:shadow-elevated transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-gray text-foggy">
                    {signingInId === u.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-rausch border-t-transparent" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-kazan truncate">{u.name}</span>
                      <Badge variant={roleBadgeVariant[u.role] ?? 'default'}>
                        {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-foggy truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm text-foggy">
              Internal tool for Airbnb Employee Experience team
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
