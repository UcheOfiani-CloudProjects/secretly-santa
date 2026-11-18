export const IDENTITY_FIELDS = [
  { key: 'loves', title: 'Things I love', hint: 'Favourite activities, hobbies, things that make you happy.', placeholder: 'Gospel music, baking on Saturdays, long novels, my plants…', max: 600, rows: 3, required: true },
  { key: 'wants', title: 'Things I’d love to receive', hint: 'Gift ideas, items you’ve been wanting, experiences.', placeholder: 'A nice journal, a scented candle, a spa voucher…', max: 600, rows: 3, required: true },
  { key: 'needs', title: 'Things I need', hint: 'Practical things you’d genuinely use.', placeholder: 'A good water bottle, a phone power bank…', max: 600, rows: 2 },
  { key: 'colours', title: 'Favourite colours', hint: '', placeholder: 'Emerald green, gold, soft pink', max: 200, rows: 1 },
  { key: 'treats', title: 'Favourite snacks & treats', hint: '', placeholder: 'Chin chin, dark chocolate, plantain chips', max: 300, rows: 1 },
  { key: 'gift_types', title: 'Gifts that suit me', hint: 'Pick the style that fits, so nobody gets earrings by mistake. Then add anything else: practical, books, gadgets, home…', placeholder: 'Practical things and anything for the kitchen', max: 300, rows: 1 },
  { key: 'avoid', title: 'Things to avoid', hint: 'Dislikes, things you don’t want, and allergies. Only if you choose to share.', placeholder: 'No perfumes please. Allergic to nuts.', max: 600, rows: 2 },
  { key: 'notes', title: 'Anything else my Secret Santa should know', hint: '', placeholder: 'Sizes, what I already have too many of…', max: 800, rows: 2 },
] as const;

export type IdentityKey = (typeof IDENTITY_FIELDS)[number]['key'];
export type Identity = Partial<Record<IdentityKey, string | null>>;
