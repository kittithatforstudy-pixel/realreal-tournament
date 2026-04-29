export class DiscordWebhook {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl
  }

  async sendEmbed(title, description, color = '#5865f2', fields = []) {
    if (!this.webhookUrl) return false

    const hexToInt = (hex) => parseInt(hex.replace('#', ''), 16)

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title,
            description,
            color: hexToInt(color),
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: 'RealReal Tournament' }
          }]
        })
      })
      return res.ok
    } catch (e) {
      console.error('Discord webhook error:', e)
      return false
    }
  }

  async sendMessage(content) {
    if (!this.webhookUrl) return false
    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      return res.ok
    } catch {
      return false
    }
  }
}

export function getWebhook(url) {
  return new DiscordWebhook(url || process.env.DISCORD_WEBHOOK_URL)
}

// Notification templates
export async function notifyRegistration(webhook, playerName, tournament) {
  return webhook.sendEmbed('✅ สมัครสำเร็จ!', `**${playerName}** เข้าร่วม **${tournament}**`, '#57f287')
}

export async function notifyPayment(webhook, teamName, tournament, amount) {
  return webhook.sendEmbed('💰 รอ Approve สลิป', `**${teamName}** ส่งสลิป ฿${amount}`, '#faa61a', [
    { name: 'ทัวร์', value: tournament, inline: true },
    { name: 'จำนวน', value: `฿${amount}`, inline: true }
  ])
}

export async function notifyMatchResult(webhook, tournament, winner, loser, score) {
  return webhook.sendEmbed('🎯 ผลแมตช์', `**${tournament}**`, '#57f287', [
    { name: '🥇 ชนะ', value: winner, inline: true },
    { name: '🥈 แพ้', value: loser, inline: true },
    { name: 'สกอร์', value: score, inline: true }
  ])
}

export async function notifyChampion(webhook, tournament, first, second, third) {
  return webhook.sendEmbed('👑 ผลสุดท้าย!', `🎉 **${tournament}** จบแล้ว!`, '#ffd700', [
    { name: '🥇 ที่ 1', value: first, inline: false },
    { name: '🥈 ที่ 2', value: second, inline: false },
    { name: '🥉 ที่ 3', value: third, inline: false }
  ])
}
