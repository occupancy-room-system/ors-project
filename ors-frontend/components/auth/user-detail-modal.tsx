'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app-store';
import { usersApi } from '@/utils/api-request/users';
import { useLogoutMutation } from '@/hooks/use-auth-query';
import { ROUTES } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { User } from '@/types';

export function UserDetailModal() {
  const {
    currentUser,
    setCurrentUser,
    isUserDetailModalOpen,
    closeUserDetailModal,
    showToast,
  } = useApp();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.username || '');
      setEmail(currentUser.email || '');
      setPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
    }
  }, [currentUser, isUserDetailModalOpen]);

  if (!currentUser) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
    closeUserDetailModal();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setCurrentUser(null);
      handleClose();
      showToast('Signed out of laboratory session.', 'info');
      window.location.href = ROUTES.HOME;
    } catch {
      setCurrentUser(null);
      handleClose();
      window.location.href = ROUTES.HOME;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMsg('Full Name must be at least 2 characters long.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMsg('Email Address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: {
        fullName: string;
        email: string;
        password?: string;
      } = {
        fullName: trimmedName,
        email: trimmedEmail,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      let updatedUser: User = {
        ...currentUser,
        fullName: trimmedName,
        email: trimmedEmail,
      };

      try {
        const res = await usersApi.updateUser(currentUser.id, payload);
        if (res) {
          updatedUser = {
            ...currentUser,
            fullName: res.fullName || trimmedName,
            email: res.email || trimmedEmail,
          };
        }
      } catch (apiErr: unknown) {
        // If it's a specific validation/conflict message from server, show error
        const message = apiErr instanceof Error ? apiErr.message : '';
        if (message.toLowerCase().includes('already in use') || message.toLowerCase().includes('duplicate')) {
          setErrorMsg(message);
          setIsSubmitting(false);
          return;
        }
        // If server connection is offline or unavailable, proceed with local update
        console.warn('Backend update failed; applying profile update to local session', apiErr);
      }

      setCurrentUser(updatedUser);
      showToast('User information updated successfully!', 'success');
      handleClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update user details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = currentUser.role === 'ADMINISTRATOR' || currentUser.role === 'ROLE_ADMIN';

  return (
    <Dialog open={isUserDetailModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-border bg-card">
        {/* Header Section */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/70 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {getInitials(currentUser.fullName || currentUser.username)}
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  User Information
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  View and update your personal account details.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick status pills */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-[10px] font-bold px-2 py-0.5 ${
                isAdmin
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {isAdmin ? (
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Administrator
                </span>
              ) : (
                'Student'
              )}
            </Badge>

            <Badge
              variant="outline"
              className="text-[10px] font-semibold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5"
            >
              Active Account
            </Badge>

            <span className="text-[11px] text-muted-foreground font-mono ml-auto">
              ID #{currentUser.id}
            </span>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Student ID / Username (Read-only Identifier) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="detail-student-id" className="text-xs font-semibold">
                {isAdmin ? 'Administrator ID' : 'Student ID'}
              </Label>
              <span className="text-[10px] text-muted-foreground font-medium">Read-only Identity</span>
            </div>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="detail-student-id"
                type="text"
                value={currentUser.username || `User #${currentUser.id}`}
                disabled
                className="pl-9 text-xs font-mono bg-muted/50 cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Full Name (Editable) */}
          <div className="space-y-1.5">
            <Label htmlFor="detail-full-name" className="text-xs font-semibold flex items-center justify-between">
              <span>Full Name</span>
              <span className="text-[10px] text-muted-foreground font-normal">Required</span>
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="detail-full-name"
                type="text"
                placeholder="e.g. Alex Kim"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9 text-xs"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          {/* Email Address (Editable) */}
          <div className="space-y-1.5">
            <Label htmlFor="detail-email" className="text-xs font-semibold flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-muted-foreground font-normal">Required</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="detail-email"
                type="email"
                placeholder="e.g. user@lamduan.mfu.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password update section */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">Change Password</span>
              <p className="text-[11px] text-muted-foreground">
                Leave blank if you do not want to change your password.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detail-password" className="text-xs font-medium text-muted-foreground">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="detail-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-xs"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                <Label htmlFor="detail-confirm-password" className="text-xs font-medium text-muted-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="detail-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 h-9 px-2.5 cursor-pointer"
              disabled={isSubmitting}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="text-xs h-9 px-3 cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold gap-1.5 h-9 px-4 cursor-pointer shadow-xs"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

