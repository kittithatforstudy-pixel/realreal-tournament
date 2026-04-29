import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { getWebhook, notifyRegistration, notifyPayment } from '@/lib/discord'

// POST /api/tournaments/[id]/register
export async function POST(request, { params }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { teamName, teamMembers, slipUrl, amount, channel, transferredAt, note } = await request.json()

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: 'ไม่พบทัวร์นาเมนต์' }, { status: 404 })
    }

    if (tournament.status !== 'OPEN') {
      return NextResponse.json({ error: 'ทัวร์นาเมนต์ยังไม่เปิดรับสมัคร' }, { status: 400 })
    }

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: { tournamentId_userId: { tournamentId: id, userId: user.userId } }
    })
    if (existing) {
      return NextResponse.json({ error: 'คุณสมัครทัวร์นี้แล้ว' }, { status: 409 })
    }

    // Create team if team mode
    let team = null
    if (tournament.teamMode && teamName) {
      team = await prisma.team.create({
        data: {
          name: teamName,
          tournamentId: id,
          leaderId: user.userId,
          members: {
            create: { userId: user.userId, role: 'LEADER' }
          }
        }
      })
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        tournamentId: id,
        userId: user.userId,
        teamId: team?.id,
        status: tournament.entryFee > 0 ? 'PENDING' : 'CONFIRMED'
      }
    })

    // Create payment if entry fee > 0
    if (tournament.entryFee > 0 && slipUrl) {
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          amount: amount || tournament.entryFee,
          channel: channel || 'PROMPTPAY',
          slipUrl,
          transferredAt: transferredAt ? new Date(transferredAt) : new Date(),
          note
        }
      })
    } else if (tournament.entryFee === 0) {
      // Free tournament — auto confirm
      await prisma.payment.create({
        data: {
          registrationId: registration.id,
          amount: 0,
          channel: 'FREE',
          status: 'APPROVED'
        }
      })
    }

    // Discord notification
    const webhook = getWebhook(tournament.discordWebhook)
    await notifyRegistration(webhook, user.username, tournament.name)

    if (slipUrl) {
      await notifyPayment(webhook, teamName || user.username, tournament.name, amount || tournament.entryFee)
    }

    return NextResponse.json({
      success: true,
      registration: registration.id,
      team: team?.id,
      inviteCode: team?.inviteCode
    }, { status: 201 })

  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'สมัครไม่สำเร็จ' }, { status: 500 })
  }
}
