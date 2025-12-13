import { Header } from '@/components/journal/Header';
import { Sidebar } from '@/components/journal/Sidebar';
import { Editor } from '@/components/journal/Editor';
import { useJournal } from '@/hooks/useJournal';

const Index = () => {
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
    createEntry,
    updateEntry,
    deleteEntry,
    exportData,
    importData
  } = useJournal();

  return (
    <div className="min-h-screen">
      <Header 
        stats={stats} 
        onExport={exportData} 
        onImport={importData} 
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
