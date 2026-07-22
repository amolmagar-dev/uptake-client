import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, History, Loader2 } from 'lucide-react';
import { Button } from '../../shared/components/ui/Button';
import { Select } from '../../shared/components/ui/Input';
import { DataTable } from '../../shared/components/ui/Table';
import { WorkspaceHeader } from '../../shared/components';
import { queriesApi } from '../../lib/api';
import { useAppStore } from '../../store/appStore';
import { useThemeStore } from '../../store/themeStore';

const LIGHT_THEMES = ['light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'retro', 'cyberpunk', 'valentine', 'garden', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'acid', 'lemonade', 'winter'];

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
  const currentThemeId = useThemeStore((s) => s.currentThemeId);
  const monacoTheme = LIGHT_THEMES.includes(currentThemeId) ? 'vs' : 'vs-dark';

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
  }, [selectedConnectionId, query, addToast]);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeQuery();
    });
  }, [executeQuery]);

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
    <div className="flex flex-col h-full bg-base-100" onKeyDown={handleKeyDown}>
      {/* Header */}
      <WorkspaceHeader
        title="SQL Editor"
        description="Run raw SQL queries against your connected database"
        actions={
          <>
            {executionTime !== null && (
              <div className="flex items-center gap-4 text-sm text-base-content/50 mr-2">
                <span className="flex items-center gap-1">
                  <History size={14} />
                  {executionTime}ms
                </span>
                <span>{rowCount} rows</span>
              </div>
            )}
            <Button
              onClick={executeQuery}
              isLoading={isExecuting}
              leftIcon={isExecuting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            >
              Run Query
            </Button>
            {onSave && (
              <Button
                variant="ghost"
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
          </>
        }
      >
        <div className="w-56">
          <Select
            options={connectionOptions}
            value={selectedConnectionId}
            onChange={(val: any) => setSelectedConnectionId(typeof val === 'string' ? val : (val?.target?.value ?? ''))}
          />
        </div>
      </WorkspaceHeader>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Editor */}
        <div className="flex-1 min-h-[120px] border-b border-base-300">
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={query}
            onChange={(value) => setQuery(value || '')}
            onMount={handleEditorMount}
            theme={monacoTheme}
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
        {(error || results) && (
          <div className="p-4 shrink-0">
            {error && (
              <div className="p-4 rounded-lg bg-error/10 border border-error/30 text-error">
                <p className="font-medium mb-1">Error</p>
                <p className="text-sm font-mono">{error}</p>
              </div>
            )}
            
            {results && (
              <div className="rounded-lg border border-base-300 overflow-hidden">
                <div className="px-4 py-2 bg-base-200 border-b border-base-300 text-sm text-base-content/50">
                  Results ({rowCount} rows)
                </div>
                <DataTable data={results} maxHeight="400px" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

