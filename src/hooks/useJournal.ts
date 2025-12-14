import { useState, useEffect, useCallback } from 'react';
import { JournalEntry, JournalStats, Mood } from '@/types/journal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<Mood | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Fetch entries from database
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const fetchEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        toast.error('Failed to load entries');
      } else {
        const mapped: JournalEntry[] = (data || []).map(row => ({
          id: row.id,
          title: row.title,
          body: row.body,
          mood: row.mood as Mood | undefined,
          tags: row.tags || [],
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
          wordCount: row.word_count
        }));
        setEntries(mapped);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [user]);

  const createEntry = useCallback(async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: '',
        body: '',
        tags: [],
        word_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to create entry');
      return null;
    }

    const newEntry: JournalEntry = {
      id: data.id,
      title: data.title,
      body: data.body,
      mood: data.mood as Mood | undefined,
      tags: data.tags || [],
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      wordCount: data.word_count
    };

    setEntries(prev => [newEntry, ...prev]);
    setSelectedId(newEntry.id);
    return newEntry;
  }, [user]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
    const newWordCount = updates.body !== undefined ? countWords(updates.body) : undefined;
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.body !== undefined) dbUpdates.body = updates.body;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (newWordCount !== undefined) dbUpdates.word_count = newWordCount;

    const { error } = await supabase
      .from('journal_entries')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating entry:', error);
      return;
    }

    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      return {
        ...entry,
        ...updates,
        wordCount: newWordCount ?? entry.wordCount,
        updatedAt: Date.now()
      };
    }));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
      return;
    }

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

  const importData = useCallback(async (file: File) => {
    if (!user) return 0;
    
    return new Promise<number>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as JournalEntry[];
          if (!Array.isArray(imported)) {
            throw new Error('Invalid format');
          }
          
          // Insert imported entries
          const toInsert = imported.map(entry => ({
            user_id: user.id,
            title: entry.title,
            body: entry.body,
            mood: entry.mood,
            tags: entry.tags,
            word_count: entry.wordCount
          }));

          const { data, error } = await supabase
            .from('journal_entries')
            .insert(toInsert)
            .select();

          if (error) {
            throw error;
          }

          const newEntries: JournalEntry[] = (data || []).map(row => ({
            id: row.id,
            title: row.title,
            body: row.body,
            mood: row.mood as Mood | undefined,
            tags: row.tags || [],
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
            wordCount: row.word_count
          }));

          setEntries(prev => [...newEntries, ...prev].sort((a, b) => b.createdAt - a.createdAt));
          resolve(newEntries.length);
        } catch {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [user]);

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
    loading,
    createEntry,
    updateEntry,
    deleteEntry,
    exportData,
    importData
  };
}
