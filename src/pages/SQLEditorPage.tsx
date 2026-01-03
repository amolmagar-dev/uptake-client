import React, { useEffect } from 'react';
import { SQLEditor } from '../components/charts/SQLEditor';
import { queriesApi, connectionsApi } from '../lib/api';
import { useAppStore } from '../store/appStore';

export const SQLEditorPage: React.FC = () => {
  const { setConnections, addToast } = useAppStore();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await connectionsApi.getAll();
        setConnections(response.data.connections);
      } catch (error) {
        addToast('error', 'Failed to fetch connections');
      }
    };

    fetchConnections();
  }, [setConnections, addToast]);

  const handleSaveQuery = async (query: string, name: string) => {
    // This would be implemented to save the query
    addToast('info', 'Query saving will be available in the Charts section');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 bg-bg-primary z-10 pb-4 -mx-6 px-6">
        <div className="py-4">
          <h1 className="text-2xl font-bold text-text-primary">SQL Editor</h1>
          <p className="text-text-secondary mt-1">
            Write and execute SQL queries • Press <kbd className="px-2 py-0.5 rounded bg-bg-tertiary text-accent-primary text-xs">Ctrl + Enter</kbd> to run
          </p>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-6 h-[calc(100%-80px)]">
        <SQLEditor onSave={handleSaveQuery} />
      </div>
    </div>
  );
};

