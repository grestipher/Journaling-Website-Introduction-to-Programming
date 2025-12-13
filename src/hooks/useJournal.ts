import { useState, useEffect, useCallback } from 'react';
import { JournalEntry, JournalStats, Mood } from '@/types/journal';

const STORAGE_KEY = 'journal-entries';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateStats(entries: JournalEntry[]): JournalStats {
  const moodCounts: Record<Mood, number> = {
    happy: 0, calm: 0, sad: 0, anxious: 0, excited: 0, grateful: 0
  };
  
  let totalWords = 0;
  entries.forEach(entry => {
    totalWords += entry.wordCount;
    if (entry.mood) {
      moodCounts[entry.mood]++;
    }
  });
  
  const mostUsedMood = (Object.entries(moodCounts) as [Mood, number][])
    .sort((a, b) => b[1] - a[1])[0];
  
  // Calculate streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streakDays = 0;
  const sortedDates = [...new Set(entries.map(e => {
    const d = new Date(e.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = today.getTime() - (i * 86400000);
    if (sortedDates[i] === expected) {
      streakDays++;
    } else {
      break;
    }
  }
  
  return {
    totalEntries: entries.length,
    totalWords,
    streakDays,
    mostUsedMood: mostUsedMood[1] > 0 ? mostUsedMood[0] : null,
    moodCounts
  };
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<Mood | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const createEntry = useCallback(() => {
    const newEntry: JournalEntry = {
      id: generateId(),
      title: '',
      body: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 0
    };
    setEntries(prev => [newEntry, ...prev]);
    setSelectedId(newEntry.id);
    return newEntry;
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const newBody = updates.body ?? entry.body;
      return {
        ...entry,
        ...updates,
        wordCount: countWords(newBody),
        updatedAt: Date.now()
      };
    }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const selectedEntry = entries.find(e => e.id === selectedId) ?? null;

  // Filtered entries
  const filteredEntries = entries.filter(entry => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = entry.title.toLowerCase().includes(query);
      const matchesBody = entry.body.toLowerCase().includes(query);
      const matchesTags = entry.tags.some(tag => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesBody && !matchesTags) return false;
    }
    if (filterMood && entry.mood !== filterMood) return false;
    if (filterTag && !entry.tags.includes(filterTag)) return false;
    return true;
  });

  // All unique tags
  const allTags = [...new Set(entries.flatMap(e => e.tags))].sort();

  // Stats
  const stats = calculateStats(entries);

  // Export/Import
  const exportData = useCallback(() => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  const importData = useCallback((file: File) => {
    return new Promise<number>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as JournalEntry[];
          if (!Array.isArray(imported)) {
            throw new Error('Invalid format');
          }
          // Merge with existing, avoiding duplicates by id
          const existingIds = new Set(entries.map(e => e.id));
          const newEntries = imported.filter(e => !existingIds.has(e.id));
          setEntries(prev => [...newEntries, ...prev].sort((a, b) => b.createdAt - a.createdAt));
          resolve(newEntries.length);
        } catch {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [entries]);

  return {
    entries: filteredEntries,
    allEntries: entries,
    selectedEntry,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    filterMood,
    setFilterMood,
    filterTag,
    setFilterTag,
    allTags,
    stats,
    createEntry,
    updateEntry,
    deleteEntry,
    exportData,
    importData
  };
}
