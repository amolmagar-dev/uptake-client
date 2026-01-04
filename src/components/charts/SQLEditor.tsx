import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, History, Loader2 } from 'lucide-react';
import { Button } from '../../shared/components/ui/Button';
import { Select } from '../../shared/components/ui/Input';
import { DataTable } from '../../shared/components/ui/Table';
import { queriesApi } from '../../lib/api';
import { useAppStore } from '../../store/appStore';

interface SQLEditorProps {
  initialQuery?: string;
  connectionId?: string;
  onSave?: (query: string, name: string) => void;
}

export const SQLEditor: React.FC<SQLEditorProps> = ({
  initialQuery = '',
  connectionId: initialConnectionId,
  onSave,
}) => {
  const { connections, addToast } = useAppStore();
  const [query, setQuery] = useState(initialQuery);
  const [selectedConnectionId, setSelectedConnectionId] = useState(initialConnectionId || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);

  const executeQuery = useCallback(async () => {
    if (!selectedConnectionId) {
      addToast('error', 'Please select a database connection');
      return;
    }

    if (!query.trim()) {
      addToast('error', 'Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResults(null);

    try {
      const response = await queriesApi.execute(selectedConnectionId, query);
      setResults(response.data.data);
      setRowCount(response.data.rowCount);
      setExecutionTime(response.data.executionTime);
      addToast('success', `Query executed successfully (${response.data.rowCount} rows)`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Query execution failed';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setIsExecuting(false);
    }
  }, [query, selectedConnectionId, addToast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  }, [executeQuery]);

  const connectionOptions = [
    { value: '', label: 'Select a connection...' },
    ...connections.map(c => ({ value: c.id, label: `${c.name} (${c.type})` })),
  ];

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="w-64">
          <Select
            options={connectionOptions}
            value={selectedConnectionId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedConnectionId(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={executeQuery}
            isLoading={isExecuting}
            leftIcon={isExecuting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
          >
            Run Query
          </Button>
          
          {onSave && (
            <Button
              variant="secondary"
              leftIcon={<Save size={16} />}
              onClick={() => {
                const name = prompt('Enter a name for this query:');
                if (name) {
                  onSave(query, name);
                }
              }}
            >
              Save
            </Button>
          )}
        </div>

        {executionTime !== null && (
          <div className="ml-auto flex items-center gap-4 text-sm text-[#a0a0b0]">
            <span className="flex items-center gap-1">
              <History size={14} />
              {executionTime}ms
            </span>
            <span>{rowCount} rows</span>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[200px] rounded-lg overflow-hidden border border-[#2a2a3a]">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={query}
          onChange={(value) => setQuery(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>

      {/* Results */}
      <div className="mt-4">
        {error && (
          <div className="p-4 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30 text-[#ff4757]">
            <p className="font-medium mb-1">Error</p>
            <p className="text-sm font-mono">{error}</p>
          </div>
        )}
        
        {results && (
          <div className="rounded-lg border border-[#2a2a3a] overflow-hidden">
            <div className="px-4 py-2 bg-[#1a1a25] border-b border-[#2a2a3a] text-sm text-[#a0a0b0]">
              Results ({rowCount} rows)
            </div>
            <DataTable data={results} maxHeight="400px" />
          </div>
        )}
      </div>
    </div>
  );
};

