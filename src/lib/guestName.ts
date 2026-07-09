/**
 * Random display name for guest (not-logged-in) posts & comments.
 * e.g. "SwiftTarsier42". Stored in `guest_name` at insert time so it stays stable
 * for that post even though the guest has no account.
 */
const adjectives = [
  'Swift', 'Sunny', 'Brave', 'Calm', 'Clever', 'Jolly', 'Lucky', 'Mighty',
  'Quiet', 'Witty', 'Cool', 'Bold', 'Kind', 'Chill', 'Happy', 'Zesty',
]
const nouns = [
  'Tarsier', 'Eagle', 'Carabao', 'Dolphin', 'Falcon', 'Tamaraw', 'Marlin',
  'Gecko', 'Heron', 'Panda', 'Otter', 'Lynx', 'Koi', 'Raven', 'Fox', 'Owl',
]

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export function randomGuestName(): string {
  return `${pick(adjectives)}${pick(nouns)}${Math.floor(Math.random() * 90) + 10}`
}
