'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 150],
  className = '',
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers to show around current page
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) {
        pages.push('ellipsis');
      }
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`px-4 sm:px-6 py-3 border-t border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Left: Item range and Page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
        <span>
          Showing <strong className="text-slate-900 dark:text-white font-semibold">{startItem}-{endItem}</strong> of{' '}
          <strong className="text-slate-900 dark:text-white font-semibold">{totalItems}</strong> items
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[11px]">Rows:</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-[#edf1f7] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-3xs cursor-pointer outline-none">
              <span>{pageSize}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-28 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl"
            >
              {pageSizeOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => {
                    onPageSizeChange(opt);
                    onPageChange(1);
                  }}
                  className={`text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                    pageSize === opt
                      ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{opt} lists</span>
                  {pageSize === opt && <Check className="w-3 h-3 text-[#4a7cf6]" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        <span className="text-slate-400 text-[11px] mr-2">
          Page <strong className="text-slate-800 dark:text-slate-200">{safeCurrentPage}</strong> of {totalPages}
        </span>

        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="h-7 w-7 p-0 rounded-lg border-[#edf1f7] dark:border-slate-700 disabled:opacity-30 cursor-pointer"
          title="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Prev Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="h-7 w-7 p-0 rounded-lg border-[#edf1f7] dark:border-slate-700 disabled:opacity-30 cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Numbered Page Buttons */}
        <div className="hidden sm:flex items-center gap-1 mx-0.5">
          {getPageNumbers().map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                ...
              </span>
            ) : (
              <Button
                key={item}
                variant={safeCurrentPage === item ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(item)}
                className={`h-7 min-w-7 px-2 text-xs font-semibold rounded-lg cursor-pointer ${
                  safeCurrentPage === item
                    ? 'bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] border-transparent shadow-xs'
                    : 'border-[#edf1f7] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item}
              </Button>
            )
          )}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="h-7 w-7 p-0 rounded-lg border-[#edf1f7] dark:border-slate-700 disabled:opacity-30 cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className="h-7 w-7 p-0 rounded-lg border-[#edf1f7] dark:border-slate-700 disabled:opacity-30 cursor-pointer"
          title="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

