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
      <div className="flex-shrink-0 sticky top-0 bg-[#0a0a0f] z-10 pb-4 -mx-6 px-6">
        <div className="py-4">
          <h1 className="text-2xl font-bold text-[#f0f0f5]">SQL Editor</h1>
          <p className="text-[#a0a0b0] mt-1">
            Write and execute SQL queries • Press <kbd className="px-2 py-0.5 rounded bg-[#1a1a25] text-[#00f5d4] text-xs">Ctrl + Enter</kbd> to run
          </p>
        </div>
      </div>

      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 h-[calc(100%-80px)]">
        <SQLEditor onSave={handleSaveQuery} />
      </div>
    </div>
  );
};

