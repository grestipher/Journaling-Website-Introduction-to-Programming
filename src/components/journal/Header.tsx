import { BookOpen, Download, Upload, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JournalStats } from '@/types/journal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  stats: JournalStats;
  onExport: () => void;
  onImport: (file: File) => Promise<number>;
  onSignOut?: () => Promise<{ error: Error | null }>;
}

export function Header({ stats, onExport, onImport, onSignOut }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const count = await onImport(file);
      toast({
        title: 'Import successful',
        description: `Imported ${count} new entries.`,
      });
    } catch {
      toast({
        title: 'Import failed',
        description: 'Please check the file format.',
        variant: 'destructive',
      });
    }
    e.target.value = '';
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
  };

  const moodEmojis: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    sad: '😢',
    anxious: '😰',
    excited: '🎉',
    grateful: '🙏'
  };

  return (
    <header className="px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary animate-pulse-glow">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">
                My Journal
              </h1>
              <p className="text-sm text-muted-foreground">
                A calm space for your thoughts
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Stats</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Your Journey</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <StatCard label="Total Entries" value={stats.totalEntries} />
                  <StatCard label="Words Written" value={stats.totalWords.toLocaleString()} />
                  <StatCard label="Day Streak" value={`${stats.streakDays} 🔥`} />
                  <StatCard 
                    label="Top Mood" 
                    value={stats.mostUsedMood ? `${moodEmojis[stats.mostUsedMood]} ${stats.mostUsedMood}` : 'N/A'} 
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">Mood Distribution</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.moodCounts).map(([mood, count]) => (
                      <span 
                        key={mood} 
                        className={`mood-${mood} px-3 py-1 rounded-full text-xs font-medium`}
                      >
                        {moodEmojis[mood]} {count}
                      </span>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button variant="outline" size="sm" className="gap-2" onClick={handleImportClick}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            {onSignOut && (
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}
