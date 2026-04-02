'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-gray flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-light-gray flex items-center justify-center">
            <Search className="w-8 h-8 text-foggy" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-kazan mb-4">404</h1>
        <p className="text-lg text-foggy mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
