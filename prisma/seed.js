const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@realreal.gg' },
    update: {},
    create: {
      email: 'admin@realreal.gg',
      username: 'admin',
      passwordHash: adminHash,
      displayName: 'Admin',
      role: 'ADMIN'
    }
  })
  console.log('✅ Admin user created:', admin.email)

  // Create games
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
    await prisma.game.upsert({
      where: { name: g.name },
      update: {},
      create: g
    })
  }
  console.log(`✅ ${games.length} games created`)

  // Create platform settings
  await prisma.platformSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      platformName: 'RealReal Tournament',
      tagline: 'จัดทัวร์นาเมนต์ยังไงก็ได้',
      logoIcon: '⚡'
    }
  })
  console.log('✅ Platform settings created')

  // Create sample rules templates
  const templates = [
    {
      name: 'Valorant Standard',
      content: `• BO3 รอบปกติ, BO5 Final
• Map Pool: Ascent, Bind, Haven, Lotus, Sunset
• Veto: แพ้ ban ก่อน
• ต้อง check-in ก่อน 30 นาที
• ห้ามใช้ผู้เล่นนอกทีม
• 15 นาทีไม่พร้อม = สละสิทธิ์`,
      gameType: 'FPS'
    },
    {
      name: 'Fighting Game Standard',
      content: `• Double Elimination, FT3
• FT5 Grand Final
• Random stage select
• ห้ามใช้ macro
• ต้อง check-in ก่อน 15 นาที`,
      gameType: 'Fighting'
    },
    {
      name: 'MOBA Standard',
      content: `• BO3 รอบปกติ, BO5 Final
• Pick/Ban ตามระบบเกม
• ต้อง check-in ก่อน 30 นาที
• ห้ามเปลี่ยนผู้เล่นระหว่างทัวร์`,
      gameType: 'MOBA'
    }
  ]

  for (const t of templates) {
    await prisma.rulesTemplate.create({ data: t })
  }
  console.log(`✅ ${templates.length} rule templates created`)

  console.log('🎉 Seeding complete!')
}

seed()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
