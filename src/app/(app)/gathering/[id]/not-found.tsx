'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

export default function GatheringNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-light-gray flex items-center justify-center">
            <Search className="w-8 h-8 text-foggy" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-kazan mb-2">Gathering not found</h1>
        <p className="text-foggy mb-8">
          This gathering doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
