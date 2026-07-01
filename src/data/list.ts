import type { ListItem } from '../types'

// DATA SLOT: listItems=[{title, author, date, views, comments, href}]
// Generic post-list page mockup. Items render sequentially (no real pagination logic).
export const listItems: ListItem[] = Array.from({ length: 20 }, (_, i) => ({
  title: {
    en: `Sample post title #${i + 1} — community discussion thread`,
    ko: `[KO: Sample post title #${i + 1}]`,
  },
  author: ['Minho', 'Jenny', 'Carlo', 'Soo-jin', 'Dave', 'Hana'][i % 6],
  date: `2026.06.${String((i % 28) + 1).padStart(2, '0')}`,
  views: 100 + i * 37,
  comments: (i * 3) % 40,
  href: '#',
}))

// DATA SLOT: pagination={currentPage, hasMore} (placeholder only)
export const pagination = { currentPage: 1, hasMore: true }
