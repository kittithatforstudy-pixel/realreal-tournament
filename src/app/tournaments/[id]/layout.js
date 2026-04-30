import supabase from '@/lib/supabase'

export async function generateMetadata({ params }) {
  const { id } = await params
  try {
    const { data } = await supabase.from('Tournament').select('name, description, banner').eq('id', id).maybeSingle()
    if (!data) return { title: 'ทัวร์นาเมนต์' }
    return {
      title: data.name,
      description: data.description?.slice(0, 160) || `ทัวร์นาเมนต์ ${data.name}`,
      openGraph: data.banner ? { images: [{ url: data.banner }] } : undefined
    }
  } catch {
    return { title: 'ทัวร์นาเมนต์' }
  }
}

export default function TournamentDetailLayout({ children }) {
  return children
}
