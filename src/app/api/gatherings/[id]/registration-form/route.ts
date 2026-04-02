import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import {
  getRegistrationQuestions,
  updateQuestionVisibility,
  addCustomQuestion,
  deleteCustomQuestion,
} from '@/lib/db/registration-questions'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const questions = await getRegistrationQuestions(id)
  return NextResponse.json({ questions })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(['MANAGER', 'ADMIN'])
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const { action } = body as { action: string }

  switch (action) {
    case 'toggle_visibility': {
      const { questionId, visible } = body as { questionId: string; visible: boolean; action: string }
      if (!questionId || typeof visible !== 'boolean') {
        return NextResponse.json({ error: 'questionId and visible are required' }, { status: 400 })
      }
      const updated = await updateQuestionVisibility(questionId, visible)
      return NextResponse.json({ question: updated })
    }

    case 'add_question': {
      const { label, type, options, required } = body as {
        label: string; type: 'text' | 'multiple_choice'; options?: string[]; required: boolean; action: string
      }
      if (!label || !type) {
        return NextResponse.json({ error: 'label and type are required' }, { status: 400 })
      }
      const created = await addCustomQuestion({ gatheringId: id, label, type, options, required })
      return NextResponse.json({ question: created }, { status: 201 })
    }

    case 'delete_question': {
      const { questionId } = body as { questionId: string; action: string }
      if (!questionId) {
        return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
      }
      await deleteCustomQuestion(questionId)
      return NextResponse.json({ success: true })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
