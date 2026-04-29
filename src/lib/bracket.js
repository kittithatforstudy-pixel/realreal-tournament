// Bracket Generation Utility
// สร้างสาย Single & Double Elimination อัตโนมัติ

export function generateSingleElimBracket(teams, seedingType = 'RANDOM') {
  const seeded = seedTeams(teams, seedingType)
  const rounds = Math.ceil(Math.log2(seeded.length))
  const totalSlots = Math.pow(2, rounds)
  const matches = []

  // Pad with BYE if needed
  while (seeded.length < totalSlots) {
    seeded.push(null) // BYE
  }

  let matchNumber = 1

  // Round 1
  for (let i = 0; i < totalSlots; i += 2) {
    const match = {
      round: 1,
      matchNumber: matchNumber++,
      bracket: 'UPPER',
      participantAId: seeded[i]?.id || null,
      participantBId: seeded[i + 1]?.id || null,
      status: 'PENDING'
    }

    // Auto-win BYE matches
    if (!match.participantAId && match.participantBId) {
      match.winnerId = match.participantBId
      match.status = 'FINISHED'
      match.scoreA = 0
      match.scoreB = 1
    } else if (match.participantAId && !match.participantBId) {
      match.winnerId = match.participantAId
      match.status = 'FINISHED'
      match.scoreA = 1
      match.scoreB = 0
    }

    matches.push(match)
  }

  // Subsequent rounds (empty, winners will fill in)
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        matchNumber: matchNumber++,
        bracket: round === rounds ? 'GRAND_FINAL' : 'UPPER',
        participantAId: null,
        participantBId: null,
        status: 'PENDING'
      })
    }
  }

  return matches
}

export function generateDoubleElimBracket(teams, seedingType = 'RANDOM') {
  const seeded = seedTeams(teams, seedingType)
  const upperMatches = generateSingleElimBracket(seeded, 'MANUAL')
  const matches = [...upperMatches]

  // Lower bracket rounds
  const upperRounds = Math.ceil(Math.log2(seeded.length))
  const lowerRounds = (upperRounds - 1) * 2
  let matchNumber = matches.length + 1

  for (let round = 1; round <= lowerRounds; round++) {
    const matchesInRound = Math.max(1, Math.floor(seeded.length / Math.pow(2, Math.ceil(round / 2) + 1)))
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round: upperRounds + round,
        matchNumber: matchNumber++,
        bracket: 'LOWER',
        participantAId: null,
        participantBId: null,
        status: 'PENDING'
      })
    }
  }

  // Grand Final
  matches.push({
    round: upperRounds + lowerRounds + 1,
    matchNumber: matchNumber++,
    bracket: 'GRAND_FINAL',
    participantAId: null,
    participantBId: null,
    status: 'PENDING'
  })

  return matches
}

function seedTeams(teams, seedingType) {
  const copy = [...teams]

  switch (seedingType) {
    case 'RANDOM':
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy

    case 'MANUAL':
      return copy // Already in order

    case 'RANKING':
      return copy.sort((a, b) => (b.ranking || 0) - (a.ranking || 0))

    default:
      return copy
  }
}

export function advanceWinner(matches, finishedMatch) {
  const round = finishedMatch.round
  const matchIdx = finishedMatch.matchNumber
  const nextRound = round + 1

  // Find next match (winner goes to)
  const nextMatchNumber = Math.ceil(matchIdx / 2)
  const isTopSlot = matchIdx % 2 !== 0

  const nextMatch = matches.find(
    m => m.round === nextRound && m.matchNumber === nextMatchNumber && m.bracket === finishedMatch.bracket
  )

  if (nextMatch) {
    if (isTopSlot) {
      nextMatch.participantAId = finishedMatch.winnerId
    } else {
      nextMatch.participantBId = finishedMatch.winnerId
    }

    // If both slots filled, mark as READY
    if (nextMatch.participantAId && nextMatch.participantBId) {
      nextMatch.status = 'READY'
    }
  }

  return matches
}
