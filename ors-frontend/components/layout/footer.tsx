import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20 mt-auto py-6 pb-20 md:pb-6 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-primary text-primary-foreground font-black text-[9px] flex items-center justify-center">
            SE
          </div>
          <span className="font-semibold text-foreground">Occupancy Room System (ORS)</span>
          <span>·</span>
          <span>Software Engineering Lab 101</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Turing Hall of Computing</span>
          <span>·</span>
          <span>School of Information Technology, MFU</span>
        </div>
      </div>
    </footer>
  );
}

