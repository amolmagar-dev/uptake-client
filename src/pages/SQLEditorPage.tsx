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
    <div className="h-full flex flex-col p-6 lg:p-10 space-y-8 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold">SQL Editor</h1>
          <p className="text-base-content/60 mt-1 text-sm">
            Write and execute SQL queries • Press <kbd className="kbd kbd-sm font-sans">Ctrl + Enter</kbd> to run
          </p>
        </div>
      </div>

      <div className="flex-1 bg-base-200 border border-base-300 rounded-2xl overflow-hidden shadow-inner">
        <SQLEditor onSave={handleSaveQuery} />
      </div>
    </div>
  );
};

