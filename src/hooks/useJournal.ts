import { useState, useEffect, useCallback } from 'react';
import { JournalEntry, JournalStats, Mood } from '@/types/journal';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'journal-entries';
const TABLE_NAME = 'journal_entries';

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
  const [syncingCount, setSyncingCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isSyncing = syncingCount > 0;

  const startSync = useCallback(() => {
    setSyncingCount(count => count + 1);
  }, []);

  const endSync = useCallback(() => {
    setSyncingCount(count => Math.max(0, count - 1));
  }, []);

  const hydrateEntry = useCallback((entry: Partial<JournalEntry>): JournalEntry => {
    const safeBody = entry.body ?? '';
    return {
      id: entry.id ?? generateId(),
      title: entry.title ?? '',
      body: safeBody,
      mood: entry.mood as Mood | undefined,
      tags: Array.isArray(entry.tags) ? entry.tags.map(tag => String(tag)) : [],
      createdAt: entry.createdAt ?? Date.now(),
      updatedAt: entry.updatedAt ?? entry.createdAt ?? Date.now(),
      wordCount: entry.wordCount ?? countWords(safeBody)
    };
  }, []);

  const sortEntries = useCallback((list: JournalEntry[]) => {
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, []);

  const refreshEntries = useCallback(async () => {
    if (!supabase) return;
    startSync();
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      setEntries(sortEntries((data ?? []).map(hydrateEntry)));
      setSyncError(null);
    } catch (err) {
      console.error('[Supabase] Failed to fetch entries', err);
      setSyncError('Unable to sync with Supabase. Showing cached entries.');
    } finally {
      endSync();
    }
  }, [endSync, hydrateEntry, sortEntries, startSync, setSyncError]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Initial remote sync
  useEffect(() => {
    if (!supabase) return;
    refreshEntries();
  }, [refreshEntries]);

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
    setEntries(prev => sortEntries([newEntry, ...prev]));
    setSelectedId(newEntry.id);

    if (supabase) {
      startSync();
      supabase
        .from(TABLE_NAME)
        .insert(newEntry)
        .then(({ error }) => {
          if (error) {
            console.error('[Supabase] Failed to create entry', error);
            setSyncError('Failed to save entry to Supabase.');
          } else {
            setSyncError(null);
          }
        })
        .finally(() => endSync());
    }

    return newEntry;
  }, [endSync, setSelectedId, sortEntries, startSync, setSyncError]);

  const updateEntry = useCallback((id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
    let updatedEntry: JournalEntry | null = null;
    setEntries(prev => {
      const mapped = prev.map(entry => {
        if (entry.id !== id) return entry;
        const newBody = updates.body ?? entry.body;
        updatedEntry = {
          ...entry,
          ...updates,
          wordCount: countWords(newBody),
          updatedAt: Date.now()
        };
        return updatedEntry;
      });
      return sortEntries(mapped);
    });

    if (supabase && updatedEntry) {
      startSync();
      supabase
        .from(TABLE_NAME)
        .update(updatedEntry)
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('[Supabase] Failed to update entry', error);
            setSyncError('Failed to update entry on Supabase.');
          } else {
            setSyncError(null);
          }
        })
        .finally(() => endSync());
    }
  }, [endSync, sortEntries, startSync, setSyncError]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }

    if (supabase) {
      startSync();
      supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('[Supabase] Failed to delete entry', error);
            setSyncError('Failed to delete entry on Supabase.');
          } else {
            setSyncError(null);
          }
        })
        .finally(() => endSync());
    }
  }, [endSync, selectedId, setSelectedId, startSync, setSyncError]);

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
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as JournalEntry[];
          if (!Array.isArray(imported)) {
            throw new Error('Invalid format');
          }
          const hydrated = imported.map(hydrateEntry);
          const existingIds = new Set(entries.map(e => e.id));
          const newEntries = hydrated.filter(e => !existingIds.has(e.id));
          if (supabase && hydrated.length > 0) {
            startSync();
            try {
              const { error } = await supabase
                .from(TABLE_NAME)
                .upsert(hydrated, { onConflict: 'id' });
              if (error) throw error;
            } finally {
              endSync();
            }
          }
          setEntries(prev => sortEntries([...newEntries, ...prev]));
          resolve(newEntries.length);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [entries, endSync, hydrateEntry, sortEntries, startSync]);

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
    importData,
    refreshEntries,
    syncError,
    isSyncing
  };
}
