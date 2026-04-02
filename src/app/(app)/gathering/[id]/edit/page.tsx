'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { motion } from 'motion/react'
import { ArrowLeft, Save } from 'lucide-react'
import { format } from 'date-fns'

const MAX_GROUP_SIZE = 500

interface ApiGathering {
  id: string
  title: string
  type: string
  location: string
  startDate: string
  endDate: string
  groupSize: number
  status: string
  purpose?: string
  teamContext?: string
  duration?: number
  dailyStartTime?: string
  dailyEndTime?: string
}

export default function EditGatheringPage() {
  const params = useParams<{ id: string }>()
  const { id } = params
  const router = useRouter()
  const { addToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    groupSize: 10,
    startDate: null as Date | null,
    endDate: null as Date | null,
    location: '',
    dailyStartTime: '',
    dailyEndTime: '',
  })

  useEffect(() => {
    async function fetchGathering() {
      try {
        const res = await fetch(`/api/gatherings/${id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error('Failed to fetch')

        const data: ApiGathering = await res.json()
        setFormData({
          title: data.title,
          groupSize: data.groupSize,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          location: data.location,
          dailyStartTime: data.dailyStartTime || '',
          dailyEndTime: data.dailyEndTime || '',
        })
      } catch {
        addToast({ message: 'Failed to load gathering details', type: 'error' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchGathering()
  }, [id, addToast])

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)

    try {
      const res = await fetch(`/api/gatherings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          groupSize: formData.groupSize,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          dailyStartTime: formData.dailyStartTime || undefined,
          dailyEndTime: formData.dailyEndTime || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      addToast({ message: 'Gathering details updated', type: 'success' })
      router.push(`/gathering/${id}`)
    } catch {
      addToast({ message: 'Failed to update gathering. Please try again.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-pill border-4 border-light-gray border-t-rausch animate-spin" />
          <p className="text-foggy text-lg">Loading gathering details...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-kazan mb-4">Gathering not found</h2>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-gray pb-20">
      <div className="bg-white border-b border-light-gray sticky top-20 z-40">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-4">
            <Link href={`/gathering/${id}`} className="text-foggy hover:text-kazan transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <span className="font-bold text-kazan">Edit Gathering</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-kazan mb-4">Edit Details</h2>
            <p className="text-foggy text-lg">Update your gathering&apos;s information.</p>
          </div>

          <div className="space-y-8">
            <Input
              label="Gathering Title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="flex items-center justify-between p-6 border border-light-gray rounded-card bg-white">
              <div>
                <h3 className="font-bold text-kazan text-lg">Group Size</h3>
                <p className="text-foggy">Number of attendees (max {MAX_GROUP_SIZE})</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="w-10 h-10 rounded-pill border border-light-gray flex items-center justify-center text-foggy hover:border-kazan hover:text-kazan transition-colors"
                  onClick={() => setFormData(f => ({ ...f, groupSize: Math.max(1, f.groupSize - 1) }))}
                >-</button>
                <input
                  type="number"
                  min={1}
                  max={MAX_GROUP_SIZE}
                  value={formData.groupSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val)) setFormData(f => ({ ...f, groupSize: Math.min(MAX_GROUP_SIZE, Math.max(1, val)) }))
                  }}
                  className="text-xl font-bold w-20 text-center border border-light-gray rounded-btn py-1 focus:outline-none focus:ring-2 focus:ring-kazan focus:border-transparent"
                />
                <button
                  className="w-10 h-10 rounded-pill border border-light-gray flex items-center justify-center text-foggy hover:border-kazan hover:text-kazan transition-colors"
                  onClick={() => setFormData(f => ({ ...f, groupSize: Math.min(MAX_GROUP_SIZE, f.groupSize + 1) }))}
                >+</button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-1.5 block">Event Dates</label>
              <DateRangePicker
                startDate={formData.startDate}
                endDate={formData.endDate}
                onChange={(start, end) => setFormData({ ...formData, startDate: start, endDate: end })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Daily Start Time"
                type="text"
                placeholder="e.g., 8:00 AM"
                value={formData.dailyStartTime}
                onChange={(e) => setFormData({ ...formData, dailyStartTime: e.target.value })}
              />
              <Input
                label="Daily End Time"
                type="text"
                placeholder="e.g., 9:00 PM"
                value={formData.dailyEndTime}
                onChange={(e) => setFormData({ ...formData, dailyEndTime: e.target.value })}
              />
            </div>

            <Input
              label="Location / City"
              type="text"
              placeholder="e.g., Austin, TX"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value.slice(0, 100) })}
            />
          </div>

          <div className="flex justify-between mt-12">
            <Link
              href={`/gathering/${id}`}
              className="inline-flex items-center justify-center rounded-btn font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan bg-white text-kazan border border-kazan hover:bg-bg-gray h-14 px-8 text-lg gap-2"
            >
              <ArrowLeft size={18} /> Cancel
            </Link>
            <Button size="lg" onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
