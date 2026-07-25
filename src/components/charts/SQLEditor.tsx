import React, { useState, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Save,
  Loader2,
  Download,
  Copy,
  Filter,
  Code2,
  Database,
  Terminal,
  Zap,
  Trash2,
} from 'lucide-react';
import { Button } from '../../shared/components/ui/Button';
import { Select } from '../../shared/components/ui/Input';
import { DataTable } from '../../shared/components/ui/Table';
import { WorkspaceHeader } from '../../shared/components';
import { queriesApi } from '../../lib/api';
import { useAppStore } from '../../store/appStore';
import { useThemeStore } from '../../store/themeStore';

const LIGHT_THEMES = [
  'light',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'retro',
  'cyberpunk',
  'valentine',
  'garden',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'cmyk',
  'autumn',
  'acid',
  'lemonade',
  'winter',
];

interface SQLEditorProps {
  initialQuery?: string;
  connectionId?: string;
  onSave?: (query: string, name: string) => void;
}

export const SQLEditor: React.FC<SQLEditorProps> = ({
  initialQuery = 'SELECT * FROM shipping_db.std_user LIMIT 100;',
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
  const [filterText, setFilterText] = useState('');

  const currentThemeId = useThemeStore((s) => s.currentThemeId);
  const monacoTheme = LIGHT_THEMES.includes(currentThemeId) ? 'vs' : 'vs-dark';

  // Automatically select first connection if none selected
  React.useEffect(() => {
    if (!selectedConnectionId && connections.length > 0) {
      setSelectedConnectionId(connections[0].id);
    }
  }, [connections, selectedConnectionId]);

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

    try {
      const response = await queriesApi.execute(selectedConnectionId, query);
      const resData = response.data;
      const dataRows = Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData?.rows)
        ? resData.rows
        : Array.isArray(resData?.results)
        ? resData.results
        : Array.isArray(resData)
        ? resData
        : [];

      const returnedRowCount =
        typeof resData?.rowCount === 'number'
          ? resData.rowCount
          : typeof resData?.count === 'number'
          ? resData.count
          : dataRows.length;

      const returnedExecTime =
        typeof resData?.executionTime === 'number'
          ? resData.executionTime
          : typeof resData?.execution_time === 'number'
          ? resData.execution_time
          : null;

      setResults(dataRows);
      setRowCount(returnedRowCount);
      setExecutionTime(returnedExecTime);
      addToast('success', `Query executed successfully (${returnedRowCount} rows)`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Query execution failed';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setIsExecuting(false);
    }
  }, [selectedConnectionId, query, addToast]);

  const handleEditorMount = useCallback(
    (editor: any, monaco: any) => {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        executeQuery();
      });
    },
    [executeQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
    },
    [executeQuery]
  );

  const filteredResults = useMemo(() => {
    if (!results || !filterText.trim()) return results;
    const queryLower = filterText.toLowerCase();
    return results.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '')
          .toLowerCase()
          .includes(queryLower)
      )
    );
  }, [results, filterText]);

  const handleExportCSV = useCallback(() => {
    if (!results || results.length === 0) return;
    const headers = Object.keys(results[0]).join(',');
    const rows = results.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'CSV exported successfully');
  }, [results, addToast]);

  const handleCopyJSON = useCallback(() => {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    addToast('success', 'JSON copied to clipboard');
  }, [results, addToast]);

  const connectionOptions = [
    { value: '', label: 'Select a connection...' },
    ...connections.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
  ];

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  return (
    <div className="flex flex-col h-full bg-base-100 min-h-0 overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Header */}
      <WorkspaceHeader
        title="SQL Studio"
        description="Run raw SQL queries against your connected database"
        actions={
          <div className="flex items-center gap-2">
            {executionTime !== null && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-base-200/70 border border-base-300 rounded-lg text-xs font-mono text-base-content/80">
                <span className="flex items-center gap-1 text-success font-semibold">
                  <Zap size={13} />
                  {executionTime}ms
                </span>
                <span className="text-base-content/40">•</span>
                <span>{rowCount} rows</span>
              </div>
            )}

            <Button
              onClick={executeQuery}
              isLoading={isExecuting}
              leftIcon={isExecuting ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
              variant="primary"
            >
              <span>Run Query</span>
              <kbd className="hidden md:inline-block kbd kbd-xs bg-primary-content/20 text-primary-content border-0 font-mono text-[9px] ml-1">
                ⌘↵
              </kbd>
            </Button>

            {onSave && (
              <Button
                variant="secondary"
                leftIcon={<Save size={15} />}
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
        }
      >
        <div className="w-56 md:w-64">
          <Select
            options={connectionOptions}
            value={selectedConnectionId}
            onChange={(val: any) =>
              setSelectedConnectionId(typeof val === 'string' ? val : val?.target?.value ?? '')
            }
          />
        </div>
      </WorkspaceHeader>

      {/* Main Workspace Split Layout */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Upper SQL Editor Section */}
        <div className="flex-1 min-h-[160px] flex flex-col bg-base-200/40 overflow-hidden">
          {/* Editor Info Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-base-200/90 border-b border-base-300 shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm bg-primary/15 text-primary border-primary/20 font-bold font-mono text-[10px] gap-1">
                <Code2 size={12} />
                SQL
              </span>
              {selectedConnection && (
                <span className="text-base-content/60 font-medium text-[11px] hidden sm:inline flex items-center gap-1">
                  <Database size={12} className="text-base-content/50" />
                  {selectedConnection.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-base-content/50 text-[11px]">
              <span className="hidden md:inline">Press <kbd className="font-mono bg-base-300 px-1 py-0.5 rounded text-[10px]">Ctrl + Enter</kbd> to run</span>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="btn btn-ghost btn-xs text-base-content/50 hover:text-error gap-1 px-1.5"
                  title="Clear Query"
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full h-full min-h-0 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={query}
              onChange={(value) => setQuery(value || '')}
              onMount={handleEditorMount}
              theme={monacoTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 10, bottom: 10 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
              }}
            />
          </div>
        </div>

        {/* Lower Results / Status Section */}
        <div className="flex-1 min-h-[220px] max-h-[55%] flex flex-col border-t border-base-300 bg-base-100 overflow-hidden">
          {error ? (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error space-y-1 shadow-xs">
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>Execution Error</span>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed opacity-90">
                  {error}
                </pre>
              </div>
            </div>
          ) : results ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Results Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-base-200/80 border-b border-base-300 shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base-content flex items-center gap-1.5">
                    <Terminal size={14} className="text-primary" />
                    Query Results
                  </span>
                  <span className="badge badge-sm bg-base-300 text-base-content/80 font-mono text-[10px] font-semibold">
                    {filteredResults ? filteredResults.length : 0} / {rowCount} rows
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {/* Search Filter Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter results..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="input input-xs bg-base-100 border-base-300 pl-7 w-36 sm:w-48 text-xs focus:outline-none focus:border-primary"
                    />
                    <Filter size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-base-content/40" />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyJSON}
                    leftIcon={<Copy size={13} />}
                    title="Copy JSON"
                    className="h-7 text-xs px-2"
                  >
                    JSON
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleExportCSV}
                    leftIcon={<Download size={13} />}
                    title="Export CSV"
                    className="h-7 text-xs px-2"
                  >
                    CSV
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 min-h-0 overflow-hidden p-2">
                <DataTable data={filteredResults || []} maxHeight="100%" className="h-full rounded-lg" />
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 text-base-content/50 bg-base-100">
              <div className="w-12 h-12 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center text-primary shadow-xs">
                <Database size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-base-content">SQL Query Studio</h4>
                <p className="text-xs max-w-sm">
                  Write a SQL query in the editor above and press <kbd className="font-mono bg-base-200 px-1 py-0.5 rounded border border-base-300 text-[10px]">Ctrl + Enter</kbd> or click <strong>Run Query</strong> to view live results.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

