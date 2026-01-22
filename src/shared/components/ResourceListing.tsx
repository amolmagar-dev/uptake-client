import React, { useState, useMemo, useEffect } from "react";
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight, Plus } from "lucide-react";

export interface ResourceListingProps<T> {
  title: string;
  description: string;
  items: T[];
  onSearch: (query: string) => void;
  renderGridItem: (item: T) => React.ReactNode;
  renderListItem: (item: T) => React.ReactNode;
  renderEmptyState: () => React.ReactNode;
  onCreate?: () => void;
  createButtonText?: string;
  itemsPerPage?: number;
  initialViewMode?: "grid" | "list";
  searchPlaceholder?: string;
  filterFunction?: (item: T, query: string) => boolean;
  actions?: React.ReactNode;
}

export function ResourceListing<T extends { id: string }>({
  title,
  description,
  items,
  renderGridItem,
  renderListItem,
  renderEmptyState,
  onCreate,
  createButtonText = "Create New",
  itemsPerPage = 12,
  initialViewMode = "grid",
  searchPlaceholder = "Search...",
  filterFunction,
  actions,
}: ResourceListingProps<T>) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    if (filterFunction) {
      return items.filter((item) => filterFunction(item, searchQuery));
    }
    // Default fallback filter if none provided (basic layout dependent)
    return items;
  }, [items, searchQuery, filterFunction]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Empty State Logic
  if (items.length === 0 && !searchQuery) {
    return (
      <div className="p-6 lg:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-base-content/60 mt-1 text-sm">{description}</p>
          </div>
          {onCreate && (
            <button className="btn btn-primary btn-sm md:btn-md" onClick={onCreate}>
              <Plus size={18} />
              <span>{createButtonText}</span>
            </button>
          )}
        </div>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-base-content/60 mt-1 text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <div className="join bg-base-200 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`btn btn-sm join-item ${viewMode === "list" ? "btn-active btn-primary" : "btn-ghost"}`}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`btn btn-sm join-item ${viewMode === "grid" ? "btn-active btn-primary" : "btn-ghost"}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          {onCreate && (
            <button className="btn btn-primary btn-sm md:btn-md" onClick={onCreate}>
              <Plus size={18} />
              <span className="hidden sm:inline">{createButtonText}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl relative group">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-primary transition-colors"
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input input-bordered w-full pl-12 bg-base-100"
        />
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
           <Search size={48} className="mb-4 opacity-20" />
           <h3 className="text-xl font-bold">No results found</h3>
           <p className="text-base-content/60 max-w-sm">
             We couldn't find anything matching "{searchQuery}"
           </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className={
              viewMode === "list"
                ? "grid gap-4"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            }
          >
            {paginatedItems.map((item) => (
              <React.Fragment key={item.id}>
                {viewMode === "list" ? renderListItem(item) : renderGridItem(item)}
              </React.Fragment>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-base-300">
              <p className="text-sm opacity-60">
                Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}{" "}
                items
              </p>
              <div className="join shadow-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="join-item btn btn-sm btn-square bg-base-200"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <button disabled className="join-item btn btn-sm btn-disabled">
                          ...
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`join-item btn btn-sm ${currentPage === page ? "btn-primary" : "bg-base-200"}`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="join-item btn btn-sm btn-square bg-base-200"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
