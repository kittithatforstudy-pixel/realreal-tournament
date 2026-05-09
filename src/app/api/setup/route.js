import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

// POST /api/setup
// สร้าง admin user ถ้ายังไม่มีในฐานข้อมูล
// ใช้ครั้งเดียวตอน setup ครั้งแรก — จะล้มเหลวถ้า admin มีอยู่แล้ว
export async function POST() {
  try {
    // ตรวจสอบว่า admin มีอยู่แล้วหรือไม่
    const { data: existing, error: checkError } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', 'admin@realreal.gg')
      .maybeSingle()

    if (checkError) {
      console.error('Setup check error:', checkError)
      return NextResponse.json({
        error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        detail: checkError.message
      }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({
        message: 'Admin มีอยู่แล้ว ไม่จำเป็นต้อง setup',
        email: existing.email
      })
    }

    const passwordHash = await hashPassword('admin123')
    const { data: admin, error: createError } = await supabase
      .from('User')
      .insert({
        email: 'admin@realreal.gg',
        username: 'admin',
        passwordHash,
        displayName: 'Admin',
        role: 'SUPER_ADMIN'
      })
      .select('id, email, role')
      .single()

    if (createError) {
      console.error('Setup create error:', createError)
      return NextResponse.json({
        error: 'สร้าง admin ไม่สำเร็จ',
        detail: createError.message
      }, { status: 500 })
    }

    // Seed games ถ้ายังไม่มี
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
      { name: 'Free Fire', icon: '🔥', category: 'Battle Royale', defaultTeamSize: 4, supportedFormats: ['BATTLE_ROYALE'] },
    ]

    const { data: existingGames } = await supabase.from('Game').select('name')
    const existingNames = new Set((existingGames || []).map(g => g.name))
    const newGames = games.filter(g => !existingNames.has(g.name))
    if (newGames.length > 0) {
      await supabase.from('Game').insert(newGames)
    }

    // Platform settings
    const { data: existingSettings } = await supabase.from('PlatformSettings').select('id').eq('id', 'main').maybeSingle()
    if (!existingSettings) {
      await supabase.from('PlatformSettings').insert({
        id: 'main',
        platformName: 'RealReal Tournament',
        tagline: 'จัดทัวร์นาเมนต์ยังไงก็ได้',
        logoIcon: '⚡'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Setup สำเร็จ สร้าง admin + เกม + platform settings แล้ว',
      admin: { email: admin.email, role: admin.role },
      gamesAdded: newGames.length
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 })
  }
}
