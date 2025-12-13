import { ReactNode } from 'react';
import { Flame, PenSquare, Tag, Clock3, Sparkles } from 'lucide-react';
import { JournalEntry, JournalStats } from '@/types/journal';
import { cn } from '@/lib/utils';

interface JourneyInsightsProps {
  stats: JournalStats;
  entries: JournalEntry[];
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  anxious: '😰',
  excited: '🎉',
  grateful: '🙏'
};

const cardBase = 'p-4 rounded-xl border border-border/40 bg-secondary/40 flex items-center gap-3';

export function JourneyInsights({ stats, entries }: JourneyInsightsProps) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const weeklyWords = entries
    .filter(entry => entry.createdAt >= weekAgo)
    .reduce((sum, entry) => sum + entry.wordCount, 0);

  const tagCounts = entries.reduce<Record<string, number>>((acc, entry) => {
    entry.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const trendingTag = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const lastEntry = entries[0];
  const hoursSinceLastEntry = lastEntry
    ? Math.max(1, Math.round((now - lastEntry.updatedAt) / (60 * 60 * 1000)))
    : null;

  const topMoodEmoji = stats.mostUsedMood ? moodEmojis[stats.mostUsedMood] : null;

  return (
    <section className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today&apos;s focus</p>
          <h2 className="text-lg font-semibold text-foreground">Small wins that keep you writing</h2>
        </div>
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InsightCard
          icon={<Flame className="w-4 h-4" />}
          label="Day streak"
          value={`${stats.streakDays} days`}
          hint={stats.streakDays > 0 ? 'Keep the fire going' : 'Start a fresh streak'}
          highlight={stats.streakDays > 0}
        />
        <InsightCard
          icon={<PenSquare className="w-4 h-4" />}
          label="Words this week"
          value={weeklyWords.toLocaleString()}
          hint="Past 7 days"
        />
        <InsightCard
          icon={<Clock3 className="w-4 h-4" />}
          label="Last entry"
          value={lastEntry ? `${hoursSinceLastEntry}h ago` : 'No entries'}
          hint={lastEntry ? new Date(lastEntry.updatedAt).toLocaleDateString() : 'Write something today'}
        />
        <InsightCard
          icon={<Tag className="w-4 h-4" />}
          label="Trending"
          value={trendingTag ? `#${trendingTag}` : 'Tag your thoughts'}
          hint={topMoodEmoji ? `${topMoodEmoji} ${stats.mostUsedMood}` : 'Log your mood'}
        />
      </div>
    </section>
  );
}

interface InsightCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}

function InsightCard({ icon, label, value, hint, highlight }: InsightCardProps) {
  return (
    <div
      className={cn(
        cardBase,
        highlight && 'border-primary/50 bg-gradient-to-r from-primary/15 to-transparent'
      )}
    >
      <div className={cn('p-2 rounded-lg bg-secondary/60 text-muted-foreground', highlight && 'text-primary bg-primary/10')}>
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground/80">{hint}</p>
      </div>
    </div>
  );
}
