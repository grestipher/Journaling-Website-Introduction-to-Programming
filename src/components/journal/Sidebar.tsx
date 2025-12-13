import { Search, Plus, X, Tag, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JournalEntry, Mood } from '@/types/journal';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  entries: JournalEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMood: Mood | null;
  onFilterMoodChange: (mood: Mood | null) => void;
  filterTag: string | null;
  onFilterTagChange: (tag: string | null) => void;
  allTags: string[];
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

export function Sidebar({
  entries,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  searchQuery,
  onSearchChange,
  filterMood,
  onFilterMoodChange,
  filterTag,
  onFilterTagChange,
  allTags
}: SidebarProps) {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = d.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="glass rounded-2xl p-4 flex flex-col h-[calc(100vh-180px)] min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Entries
        </h2>
        <Button size="sm" onClick={onCreate} className="gap-1.5 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>
      
      {/* Search & Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={filterMood ? 'secondary' : 'outline'} 
                size="sm" 
                className="gap-1.5 flex-1"
              >
                <Smile className="w-3.5 h-3.5" />
                {filterMood ? moodEmojis[filterMood] : 'Mood'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {filterMood && (
                <>
                  <DropdownMenuItem onClick={() => onFilterMoodChange(null)}>
                    Clear filter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {moods.map(mood => (
                <DropdownMenuItem key={mood} onClick={() => onFilterMoodChange(mood)}>
                  {moodEmojis[mood]} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={filterTag ? 'secondary' : 'outline'} 
                size="sm" 
                className="gap-1.5 flex-1"
              >
                <Tag className="w-3.5 h-3.5" />
                {filterTag || 'Tag'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass max-h-48 overflow-auto">
              {filterTag && (
                <>
                  <DropdownMenuItem onClick={() => onFilterTagChange(null)}>
                    Clear filter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {allTags.length === 0 ? (
                <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
              ) : (
                allTags.map(tag => (
                  <DropdownMenuItem key={tag} onClick={() => onFilterTagChange(tag)}>
                    #{tag}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Active filters */}
        {(filterMood || filterTag) && (
          <div className="flex flex-wrap gap-1.5">
            {filterMood && (
              <span 
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer",
                  `mood-${filterMood}`
                )}
                onClick={() => onFilterMoodChange(null)}
              >
                {moodEmojis[filterMood]} {filterMood}
                <X className="w-3 h-3" />
              </span>
            )}
            {filterTag && (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent/20 text-accent cursor-pointer"
                onClick={() => onFilterTagChange(null)}
              >
                #{filterTag}
                <X className="w-3 h-3" />
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Entry List */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {entries.length === 0 ? (
          <div className="text-center py-8 px-4 text-muted-foreground text-sm">
            {searchQuery || filterMood || filterTag ? (
              <p>No entries match your filters</p>
            ) : (
              <p>No entries yet. Click <span className="text-primary">New</span> to start writing.</p>
            )}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className={cn(
                  "group p-3 rounded-xl cursor-pointer transition-all duration-150 animate-slide-in",
                  entry.id === selectedId 
                    ? "bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/30" 
                    : "hover:bg-secondary/60"
                )}
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => onSelect(entry.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {entry.mood && (
                        <span className="text-sm">{moodEmojis[entry.mood]}</span>
                      )}
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {entry.title || 'Untitled entry'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </span>
                      {entry.wordCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {entry.wordCount} words
                        </span>
                      )}
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent"
                          >
                            #{tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{entry.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this entry?')) onDelete(entry.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
