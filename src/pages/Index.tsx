import { Header } from '@/components/journal/Header';
import { Sidebar } from '@/components/journal/Sidebar';
import { Editor } from '@/components/journal/Editor';
import { useJournal } from '@/hooks/useJournal';
import { JourneyInsights } from '@/components/journal/JourneyInsights';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

const Index = () => {
  const {
    entries,
    allEntries,
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
  } = useJournal();

  return (
    <div className="min-h-screen">
      <Header 
        stats={stats} 
        onExport={exportData} 
        onImport={importData} 
      />
      
      <main className="px-4 pb-8 md:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {(isSyncing || syncError) && (
            <div
              className={`rounded-2xl px-4 py-3 text-xs flex flex-wrap items-center gap-2 ${
                syncError
                  ? 'glass border border-destructive/40 text-destructive'
                  : 'glass border border-border/40 text-muted-foreground'
              }`}
            >
              {syncError ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="flex-1 min-w-[180px]">{syncError}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-3" onClick={refreshEntries}>
                    Retry
                  </Button>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Syncing with Supabase...</span>
                </>
              )}
            </div>
          )}
          <JourneyInsights stats={stats} entries={allEntries} />
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6">
            <Sidebar
              entries={entries}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCreate={createEntry}
              onDelete={deleteEntry}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterMood={filterMood}
              onFilterMoodChange={setFilterMood}
              filterTag={filterTag}
              onFilterTagChange={setFilterTag}
              allTags={allTags}
            />
            
            <Editor
              entry={selectedEntry}
              onUpdate={updateEntry}
              onCreate={createEntry}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
