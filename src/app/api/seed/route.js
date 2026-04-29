import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== 'realreal-seed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = new PrismaClient()
  const results = []

  try {
    // Push schema
    await prisma.$executeRaw`SELECT 1`
    results.push('DB connected')

    // Admin user
    const adminHash = await bcrypt.hash('admin123', 12)
    await prisma.user.upsert({
      where: { email: 'admin@realreal.gg' },
      update: { role: 'SUPER_ADMIN' },
      create: {
        email: 'admin@realreal.gg',
        username: 'admin',
        passwordHash: adminHash,
        displayName: 'Admin',
        role: 'SUPER_ADMIN'
      }
    })
    results.push('admin@realreal.gg created (password: admin123)')

    // Games
    const games = [
      { name: 'Valorant', icon: '🎯', category: 'FPS', defaultTeamSize: 5, supportedFormats: ['SINGLE_ELIM', 'DOUBLE_ELIM', 'SWISS'] },
      { name: 'RoV', icon: '⚔️', category: 'MOBA', defaultTeamSize: 5, supportedFormats: ['SINGLE_ELIM', 'DOUBLE_ELIM'] },
      { name: 'PUBG', icon: '🔫', category: 'Battle Royale', defaultTeamSize: 4, supportedFormats: ['BATTLE_ROYALE'] },
      { name: 'FIFA 26', icon: '⚽', category: 'Sports', defaultTeamSize: 1, supportedFormats: ['SINGLE_ELIM', 'DOUBLE_ELIM'] },
      { name: 'Tekken 8', icon: '👊', category: 'Fighting', defaultTeamSize: 1, supportedFormats: ['DOUBLE_ELIM', 'ROUND_ROBIN'] },
      { name: 'Street Fighter 6', icon: '🥊', category: 'Fighting', defaultTeamSize: 1, supportedFormats: ['DOUBLE_ELIM', 'ROUND_ROBIN'] },
      { name: 'League of Legends', icon: '🏰', category: 'MOBA', defaultTeamSize: 5, supportedFormats: ['SINGLE_ELIM', 'DOUBLE_ELIM', 'GROUP_PLAYOFF'] },
      { name: 'Mobile Legends', icon: '📱', category: 'MOBA', defaultTeamSize: 5, supportedFormats: ['SINGLE_ELIM', 'DOUBLE_ELIM'] },
      { name: 'Apex Legends', icon: '🎖️', category: 'Battle Royale', defaultTeamSize: 3, supportedFormats: ['BATTLE_ROYALE'] },
      { name: 'Free Fire', icon: '🔥', category: 'Battle Royale', defaultTeamSize: 4, supportedFormats: ['BATTLE_ROYALE'] }
    ]
    for (const g of games) {
      await prisma.game.upsert({ where: { name: g.name }, update: {}, create: g })
    }
    results.push(`${games.length} games created`)

    // Platform settings
    await prisma.platformSettings.upsert({
      where: { id: 'main' },
      update: {},
      create: { platformName: 'RealReal Tournament', tagline: 'จัดทัวร์นาเมนต์ยังไงก็ได้', logoIcon: '⚡' }
    })
    results.push('Platform settings created')

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
