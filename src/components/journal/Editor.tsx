import { useState, useEffect, useCallback } from 'react';
import { JournalEntry, Mood } from '@/types/journal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PenLine, X, Plus, Check, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorProps {
  entry: JournalEntry | null;
  onUpdate: (id: string, updates: Partial<JournalEntry>) => void;
  onCreate: () => void;
}

const moodEmojis: Record<Mood, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  anxious: '😰',
  excited: '🎉',
  grateful: '🙏'
};

const moods: Mood[] = ['happy', 'calm', 'sad', 'anxious', 'excited', 'grateful'];

const prompts = [
  'Describe a small moment today that made you smile.',
  'What is something you are proud of from this week?',
  'Write a letter to your future self five years from now.',
  'How did your body feel today? What might it be telling you?',
  'List three things you are grateful for and why.',
  'What would you tell a friend who felt the same way you do now?',
  'Capture the soundtrack of your day—what did you hear?',
  'If today had a theme, what would it be and why?'
];

const WORD_GOAL = 250;

export function Editor({ entry, onUpdate, onCreate }: EditorProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * prompts.length));

  // Sync state with entry
  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setBody(entry.body);
      setMood(entry.mood);
      setTags(entry.tags);
    } else {
      setTitle('');
      setBody('');
      setMood(undefined);
      setTags([]);
    }
    setShowTagInput(false);
    setNewTag('');
    setPromptIndex(Math.floor(Math.random() * prompts.length));
  }, [entry?.id]);

  // Auto-save with debounce
  useEffect(() => {
    if (!entry) return;
    
    const timeout = setTimeout(() => {
      setIsSaving(true);
      onUpdate(entry.id, {
        title: title.trim() || 'Untitled entry',
        body,
        mood,
        tags
      });
      setTimeout(() => setIsSaving(false), 500);
    }, 800);

    return () => clearTimeout(timeout);
  }, [title, body, mood, tags, entry?.id, onUpdate]);

  const addTag = useCallback(() => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setNewTag('');
    setShowTagInput(false);
  }, [newTag, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  }, []);

  const activePrompt = prompts[promptIndex];
  const shufflePrompt = useCallback(() => {
    setPromptIndex(prev => {
      const next = Math.floor(Math.random() * prompts.length);
      return next === prev ? (next + 1) % prompts.length : next;
    });
  }, []);

  const insertPrompt = useCallback(() => {
    setBody(prev => (prev ? `${prev}\n\n${activePrompt}` : activePrompt));
  }, [activePrompt]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const bodyWordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const progress = Math.min(100, Math.round((bodyWordCount / WORD_GOAL) * 100));

  if (!entry) {
    return (
      <section className="glass rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[500px] animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
          <PenLine className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
          Welcome to Your Journal
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Capture your thoughts, track your moods, and reflect on your journey.
          Your entries are saved locally and can be exported anytime.
        </p>
        <Button onClick={onCreate} size="lg" className="gap-2 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" />
          Start Writing
        </Button>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 md:p-6 flex flex-col min-h-[500px] animate-fade-in">
      {/* Date header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
        <div>
          <p className="text-sm font-medium text-foreground">
            {formatDate(entry.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            Created at {formatTime(entry.createdAt)}
            {entry.updatedAt !== entry.createdAt && (
              <> · Updated {formatTime(entry.updatedAt)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Saving...
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Mood selector */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">How are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {moods.map(m => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? undefined : m)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all duration-150",
                mood === m 
                  ? `mood-${m} ring-2 ring-offset-2 ring-offset-card` 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              {moodEmojis[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inspiration prompt */}
      <div className="mb-4 p-4 rounded-2xl bg-secondary/40 border border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Need inspiration?
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-muted-foreground"
              onClick={shufflePrompt}
            >
              <RefreshCcw className="w-3.5 h-3.5 mr-1" />
              Shuffle
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 gap-1.5"
              variant="secondary"
              onClick={insertPrompt}
            >
              <Plus className="w-3.5 h-3.5" />
              Use prompt
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/90 leading-relaxed">{activePrompt}</p>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your entry a title..."
        className="text-lg font-medium bg-transparent border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
      />

      {/* Body */}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your thoughts here..."
        className="flex-1 min-h-[250px] resize-none bg-transparent border-none px-0 mt-2 focus-visible:ring-0 text-foreground/90 leading-relaxed placeholder:text-muted-foreground/50"
      />

      {/* Word goal */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Word goal</span>
          <span>{bodyWordCount}/{WORD_GOAL}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tags & Footer */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="gap-1 bg-accent/15 text-accent hover:bg-accent/25 cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              #{tag}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          
          {showTagInput ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTag();
                  if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setNewTag('');
                  }
                }}
                placeholder="tag name"
                className="h-7 w-24 text-xs"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={addTag}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 gap-1 text-muted-foreground"
              onClick={() => setShowTagInput(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add tag
            </Button>
          )}
          
          <span className="ml-auto text-xs text-muted-foreground">
            {bodyWordCount} words
          </span>
        </div>
      </div>
    </section>
  );
}
