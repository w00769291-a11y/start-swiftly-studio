export type AccountType = 'personal' | 'business';
export type CreateKind = 'Post' | 'Reel' | 'Tweet' | 'Event' | 'Ticket';
export function createOptions(type: AccountType): CreateKind[] {
  return type === 'business' ? ['Post', 'Reel', 'Tweet', 'Event', 'Ticket'] : ['Post', 'Reel', 'Tweet'];
}
