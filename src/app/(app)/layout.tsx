// src/app/(app)/layout.tsx
'use client'

import { Navbar } from '@/components/layout/Navbar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-gray flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
