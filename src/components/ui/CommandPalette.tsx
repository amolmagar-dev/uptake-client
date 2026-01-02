import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Database,
  BarChart3,
  Layers,
  FileCode,
  Code2,
  Settings,
  ArrowRight,
  Clock,
  Command,
} from 'lucide-react';
import { dashboardsApi, chartsApi, connectionsApi, datasetsApi } from '../../lib/api';

interface SearchResult {
  id: string;
  type: 'dashboard' | 'chart' | 'connection' | 'dataset' | 'action';
  name: string;
  description?: string;
  path: string;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  path: string;
  type: 'action';
}

const quickActions: QuickAction[] = [
  { id: 'new-dashboard', name: 'Create Dashboard', description: 'Create a new dashboard', path: '/', type: 'action' },
  { id: 'new-connection', name: 'Add Connection', description: 'Connect to a database', path: '/connections', type: 'action' },
  { id: 'new-dataset', name: 'Create Dataset', description: 'Create a new dataset', path: '/datasets/new', type: 'action' },
  { id: 'new-chart', name: 'Create Chart', description: 'Create a new visualization', path: '/charts', type: 'action' },
  { id: 'sql-editor', name: 'SQL Editor', description: 'Write and execute SQL', path: '/sql-editor', type: 'action' },
  { id: 'components', name: 'Custom Components', description: 'Build custom components', path: '/components', type: 'action' },
  { id: 'settings', name: 'Settings', description: 'Application settings', path: '/settings', type: 'action' },
];

// Get icon based on type - prevents storing React elements in localStorage
const getIconForType = (type: string, id?: string): React.ReactNode => {
  switch (type) {
    case 'dashboard':
      return <LayoutDashboard size={18} className="text-[#00f5d4]" />;
    case 'chart':
      return <BarChart3 size={18} className="text-[#7b2cbf]" />;
    case 'connection':
      return <Database size={18} className="text-[#ff6b6b]" />;
    case 'dataset':
      return <Layers size={18} className="text-[#4cc9f0]" />;
    case 'action':
      // Return specific icon based on action id
      if (id === 'new-dashboard') return <LayoutDashboard size={18} />;
      if (id === 'new-connection') return <Database size={18} />;
      if (id === 'new-dataset') return <Layers size={18} />;
      if (id === 'new-chart') return <BarChart3 size={18} />;
      if (id === 'sql-editor') return <FileCode size={18} />;
      if (id === 'components') return <Code2 size={18} />;
      if (id === 'settings') return <Settings size={18} />;
      return <Command size={18} />;
    default:
      return <Search size={18} />;
  }
};

const RECENT_SEARCHES_KEY = 'uptake_recent_searches';
const MAX_RECENT = 5;

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const q = searchQuery.toLowerCase();

    try {
      const [dashboardsRes, chartsRes, connectionsRes, datasetsRes] = await Promise.all([
        dashboardsApi.getAll().catch(() => ({ data: { dashboards: [] } })),
        chartsApi.getAll().catch(() => ({ data: { charts: [] } })),
        connectionsApi.getAll().catch(() => ({ data: { connections: [] } })),
        datasetsApi.getAll().catch(() => ({ data: { datasets: [] } })),
      ]);

      const searchResults: SearchResult[] = [];

      // Search dashboards
      dashboardsRes.data.dashboards
        .filter((d: any) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((d: any) => {
          searchResults.push({
            id: d.id,
            type: 'dashboard',
            name: d.name,
            description: d.description || `${d.chart_count || 0} charts`,
            path: `/dashboard/${d.id}`,
          });
        });

      // Search charts
      chartsRes.data.charts
        .filter((c: any) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((c: any) => {
          searchResults.push({
            id: c.id,
            type: 'chart',
            name: c.name,
            description: c.chart_type || 'Chart',
            path: '/charts',
          });
        });

      // Search connections
      connectionsRes.data.connections
        .filter((c: any) => c.name.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((c: any) => {
          searchResults.push({
            id: c.id,
            type: 'connection',
            name: c.name,
            description: c.type,
            path: '/connections',
          });
        });

      // Search datasets
      datasetsRes.data.datasets
        .filter((d: any) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((d: any) => {
          searchResults.push({
            id: d.id,
            type: 'dataset',
            name: d.name,
            description: d.source_type || 'Dataset',
            path: `/datasets/${d.id}/edit`,
          });
        });

      // Also search quick actions
      quickActions
        .filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
        .forEach((a) => {
          searchResults.push({
            id: a.id,
            type: 'action',
            name: a.name,
            description: a.description,
            path: a.path,
          });
        });

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle navigation
  const handleSelect = useCallback(
    (result: SearchResult) => {
      // Save to recent searches (without icon - we'll recreate it)
      const { id, type, name, description, path } = result;
      const newRecent = [
        { id, type, name, description, path },
        ...recentSearches.filter((r) => r.id !== result.id)
      ].slice(0, MAX_RECENT);
      setRecentSearches(newRecent);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));

      navigate(result.path);
      setIsOpen(false);
    },
    [navigate, recentSearches]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query ? results : [...recentSearches, ...quickActions];
      const maxIndex = items.length - 1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[selectedIndex];
        if (selected) {
          handleSelect(selected as SearchResult);
        }
      }
    },
    [query, results, recentSearches, selectedIndex, handleSelect]
  );

  // Items to display
  const displayItems = useMemo(() => {
    if (query) {
      return results;
    }
    // Show recent searches + quick actions when empty
    return [...recentSearches, ...quickActions];
  }, [query, results, recentSearches]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-[101]">
        <div
          className="bg-[#12121a] border border-[#2a2a3a] rounded-xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2a2a3a]">
            <Search size={20} className="text-[#606070]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search dashboards, charts, connections..."
              className="flex-1 bg-transparent text-[#f0f0f5] placeholder-[#606070] text-lg focus:outline-none"
            />
            <div className="flex items-center gap-1 text-xs text-[#606070]">
              <kbd className="px-1.5 py-0.5 bg-[#2a2a3a] rounded text-[#a0a0b0]">esc</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-[#606070]">
                <div className="spinner mx-auto mb-2" />
                Searching...
              </div>
            ) : displayItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#606070]">
                {query ? 'No results found' : 'Start typing to search...'}
              </div>
            ) : (
              <div className="py-2">
                {!query && recentSearches.length > 0 && (
                  <div className="px-4 py-2 text-xs text-[#606070] uppercase tracking-wider flex items-center gap-2">
                    <Clock size={12} />
                    Recent
                  </div>
                )}
                {!query && recentSearches.length > 0 && (
                  <>
                    {recentSearches.map((item, idx) => (
                      <button
                        key={`recent-${item.id}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          selectedIndex === idx ? 'bg-[#1a1a25]' : ''
                        }`}
                      >
                        {getIconForType(item.type, item.id)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#f0f0f5] truncate">{item.name}</p>
                          <p className="text-xs text-[#606070] truncate">{item.description}</p>
                        </div>
                        <ArrowRight size={14} className="text-[#606070]" />
                      </button>
                    ))}
                  </>
                )}

                {!query && (
                  <div className="px-4 py-2 text-xs text-[#606070] uppercase tracking-wider flex items-center gap-2 mt-2">
                    <Command size={12} />
                    Quick Actions
                  </div>
                )}

                {(query ? displayItems : quickActions).map((item: any, idx: number) => {
                  const actualIdx = query ? idx : recentSearches.length + idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item as SearchResult)}
                      onMouseEnter={() => setSelectedIndex(actualIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selectedIndex === actualIdx ? 'bg-[#1a1a25]' : ''
                      }`}
                    >
                      {getIconForType(item.type, item.id)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#f0f0f5] truncate">{item.name}</p>
                        <p className="text-xs text-[#606070] truncate">{item.description}</p>
                      </div>
                      {item.type && item.type !== 'action' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a3a] text-[#a0a0b0] capitalize">
                          {item.type}
                        </span>
                      )}
                      <ArrowRight size={14} className="text-[#606070]" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#2a2a3a] flex items-center justify-between text-xs text-[#606070]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#2a2a3a] rounded text-[#a0a0b0]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#2a2a3a] rounded text-[#a0a0b0]">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command size={12} />
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-[#2a2a3a] rounded text-[#a0a0b0]">K</kbd>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;

