'use client';

import * as React from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from '@/providers/theme.provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeToggleProps {
  className?: string;
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'icon';
}

export function ThemeToggle({
  className = '',
  variant = 'ghost',
  size = 'icon',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`w-8 h-8 rounded-full border border-border/60 bg-background/50 opacity-50 ${className}`}
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground transition-colors cursor-pointer outline-none shadow-2xs ${className}`}
        title={`Current theme: ${theme} (${resolvedTheme})`}
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-[#5c8df6] transition-transform rotate-0 scale-100" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform rotate-0 scale-100" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
            theme === 'light'
              ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
            theme === 'dark'
              ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-[#5c8df6]" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
            theme === 'system'
              ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

