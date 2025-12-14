import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/journal/Header';
import { Sidebar } from '@/components/journal/Sidebar';
import { Editor } from '@/components/journal/Editor';
import { useJournal } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    entries,
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
  } = useJournal();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header 
        stats={stats} 
        onExport={exportData} 
        onImport={importData}
        onSignOut={signOut}
      />
      
      <main className="px-4 pb-8 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6">
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
      </main>
    </div>
  );
};

export default Index;
