function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * @param {string[]} attendeeIds
 * @param {'perGroup'|'totalGroups'} mode
 * @param {number} value - members per group, or total number of groups
 */
export function createBalancedGroups(attendeeIds, mode, value) {
  const n = attendeeIds.length
  if (n === 0) return []

  let totalGroups
  if (mode === 'perGroup') {
    totalGroups = Math.ceil(n / value)
  } else {
    totalGroups = Math.min(value, n)
  }
  if (totalGroups < 1) totalGroups = 1

  const baseSize = Math.floor(n / totalGroups)
  const remainder = n % totalGroups
  const sizes = []
  for (let i = 0; i < totalGroups; i++) {
    sizes.push(i < remainder ? baseSize + 1 : baseSize)
  }

  const shuffled = shuffle(attendeeIds)
  const groups = []
  let idx = 0
  for (let g = 0; g < totalGroups; g++) {
    groups.push({
      groupNumber: g + 1,
      memberIds: shuffled.slice(idx, idx + sizes[g]),
    })
    idx += sizes[g]
  }
  return groups
}
