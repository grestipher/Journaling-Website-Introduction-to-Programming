export type Mood = 'happy' | 'calm' | 'sad' | 'anxious' | 'excited' | 'grateful';

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood?: Mood;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  wordCount: number;
}

export interface JournalStats {
  totalEntries: number;
  totalWords: number;
  streakDays: number;
  mostUsedMood: Mood | null;
  moodCounts: Record<Mood, number>;
}
