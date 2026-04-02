// src/app/page.tsx — Server Component
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
