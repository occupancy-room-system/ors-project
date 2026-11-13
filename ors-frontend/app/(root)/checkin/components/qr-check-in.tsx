'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import { Seat, User, Reservation, OccupancySession } from '@/types';
import { useActivateQrMutation, useCheckInMutation } from '@/hooks/use-session-query';
import { useCancelReservationMutation } from '@/hooks/use-reservation-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Monitor,
  MapPin,
  Clock,
  Check,
  Camera,
  CameraOff,
  UploadCloud,
  Info,
  HelpCircle,
  Map,
  ArrowUpRight,
  ChevronRight,
  Scan,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import {
  getLabReservationActivationDeadline,
  parseLabDateTime,
} from '@/utils/lab-hours';

interface QrCheckInProps {
  seats: Seat[];
  userReservations: Reservation[];
  currentUser: User | null;
  onOpenLogin: () => void;
  onSessionActivated: (session?: OccupancySession | null) => void;
  onNavigateToMap: () => void;
}

export function QrCheckIn({
  seats,
  userReservations,
  currentUser,
  onOpenLogin,
  onSessionActivated,
  onNavigateToMap,
}: QrCheckInProps) {
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Alert modal state for wrong QR, invalid token, or mismatch
  const [qrAlertModal, setQrAlertModal] = useState<{
    title: string;
    message: string;
    type?: 'error' | 'warning';
  } | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const activateMutation = useActivateQrMutation();
  const checkInMutation = useCheckInMutation();
  const cancelMutation = useCancelReservationMutation();

  // Determine current active or pending reservation - ONLY from actual userReservations
  const activeReservation = useMemo(() => {
    if (userReservations && userReservations.length > 0) {
      return (
        userReservations.find((r) => r.status === 'PENDING_ACTIVATION') || null
      );
    }
    return null;
  }, [userReservations]);

  const cleanSeatCode = (rawCode?: string) => {
    if (!rawCode) return '';
    let code = rawCode.replace(/^SEAT-/, '');
    if (code.startsWith('GT')) {
      const parts = code.replace('GT', '').split('-');
      if (parts.length === 2) return `G${parts[0]}-D${parts[1]}`;
    }
    return code;
  };

  const displaySeatCode = activeReservation ? cleanSeatCode(activeReservation.seatCode) : '';
  const podLabel = activeReservation?.podLabel || '';
  const durationHours = activeReservation?.durationHours || 2;
  const reservedForName = currentUser?.fullName || activeReservation?.userName || '';

  const plannedTime = useMemo(() => {
    if (!activeReservation?.startTime) return null;
    const date = parseLabDateTime(activeReservation.startTime);
    return {
      time: `Today, ${date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok',
      })}`,
      date: date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Bangkok',
      }),
    };
  }, [activeReservation]);

  const graceTime = useMemo(() => {
    if (!activeReservation?.startTime) return null;
    const date = getLabReservationActivationDeadline(parseLabDateTime(activeReservation.startTime));
    return `Today, ${date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    })}`;
  }, [activeReservation]);

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1175, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Process scanned token
  const handleProcessQrToken = async (rawToken: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setErrorMessage(null);

    let token = rawToken.trim();

    // Check if raw token is a URL (e.g. from an admin/checkin URL)
    try {
      if (token.startsWith('http://') || token.startsWith('https://')) {
        const parsed = new URL(token);
        const qToken = parsed.searchParams.get('token') || parsed.searchParams.get('qr') || parsed.searchParams.get('seat') || parsed.searchParams.get('code');
        if (qToken) {
          token = qToken.trim();
        } else {
          const parts = parsed.pathname.split('/').filter(Boolean);
          if (parts.length > 0) {
            token = parts[parts.length - 1].trim();
          }
        }
      }
    } catch {
      // not a URL
    }

    // Verify token against seat codes or QR tokens
    const matchedSeat = seats.find((s) => {
      const sToken = s.qrToken?.toLowerCase();
      const sCode = s.seatCode?.toLowerCase();
      const sClean = cleanSeatCode(s.seatCode).toLowerCase();
      const sNoHyphen = sCode?.replace(/^seat[-_ ]?/i, '');
      const t = token.toLowerCase();
      const tClean = cleanSeatCode(token).toLowerCase();
      const tNoPrefix = t.replace(/^qr-selab101-/i, '').replace(/^seat[-_ ]?/i, '');

      return (
        sToken === t ||
        sCode === t ||
        sClean === t ||
        sCode === `seat-${t}` ||
        sClean === tClean ||
        sClean === tNoPrefix ||
        sNoHyphen === tNoPrefix
      );
    });

    // 1. If scanned code is not recognized as any valid workstation in the room
    if (!matchedSeat) {
      setQrAlertModal({
        title: 'Invalid QR Code',
        message: `The scanned code "${token.slice(0, 32)}" is not a valid SE Lab workstation. Please scan the official QR code sticker placed on your desk.`,
        type: 'error',
      });
      isProcessingRef.current = false;
      return;
    }

    // 2. If student holds a specific pending reservation, enforce matching that desk
    if (activeReservation) {
      const reservedCode = cleanSeatCode(activeReservation.seatCode).toLowerCase();
      const matchedCode = cleanSeatCode(matchedSeat.seatCode).toLowerCase();

      if (reservedCode !== matchedCode) {
        setQrAlertModal({
          title: 'Wrong Workstation Scanned',
          message: `You reserved Seat ${displaySeatCode}. You cannot activate this session by scanning Seat ${cleanSeatCode(matchedSeat.seatCode)}. Please scan the QR code sticker on your reserved desk (${displaySeatCode}).`,
          type: 'warning',
        });
        isProcessingRef.current = false;
        return;
      }
    }

    // 3. User must be signed in
    if (!currentUser) {
      onOpenLogin();
      isProcessingRef.current = false;
      return;
    }

    setActionLoading(true);

    try {
      let activatedSession: OccupancySession | null = null;
      if (activeReservation) {
        activatedSession = await activateMutation.mutateAsync({
          qrToken: matchedSeat.qrToken,
          seatCode: matchedSeat.seatCode,
          userId: currentUser.id,
        });
      } else {
        activatedSession = await checkInMutation.mutateAsync({
          qrToken: matchedSeat.qrToken,
          userId: currentUser.id,
        });
      }

      playSuccessChime();
      stopCamera();
      onSessionActivated(activatedSession);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to activate workstation session.';
      setQrAlertModal({
        title: 'Check-In Error',
        message: msg,
        type: 'error',
      });
    } finally {
      setActionLoading(false);
      isProcessingRef.current = false;
    }
  };

  // Camera Management
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !isProcessingRef.current) {
          handleProcessQrToken(code.data);
          return;
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [handleProcessQrToken]);

  const startCamera = useCallback(
    async (requestedFacingMode?: 'environment' | 'user') => {
      setCameraError(null);
      setErrorMessage(null);
      setCameraLoading(true);

      const mode = requestedFacingMode || facingMode;

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay permissions fallback
          }
        }

        setIsCameraActive(true);
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError(
          'Camera access denied or unavailable. Please enable camera access in your browser or upload a QR image.',
        );
        setIsCameraActive(false);
      } finally {
        setCameraLoading(false);
      }
    },
    [facingMode, scanFrame],
  );

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // QR Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleProcessQrToken(code.data);
        } else {
          setErrorMessage('Could not detect a valid QR code in the uploaded image. Please try another image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCancelReservation = async () => {
    if (activeReservation?.id && currentUser) {
      setActionLoading(true);
      try {
        await cancelMutation.mutateAsync({
          reservationId: activeReservation.id,
          userId: currentUser.id,
        });
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to cancel reservation');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
        <span>Turing Hall</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-foreground font-medium">SE Lab</span>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Reservation &amp; QR check-in
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Your workspace is ready. Scan your desk&apos;s QR code to begin your session.
          </p>
        </div>

        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          <Map className="w-3.5 h-3.5" />
          <span>View floor plan</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Stepper Bar */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-4 sm:px-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Steps */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-medium">
          {/* Step 1: Reservation */}
          <div className="flex items-center gap-2">
            {activeReservation ? (
              <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                1
              </div>
            )}
            <span className={activeReservation ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-foreground'}>
              Reservation
            </span>
          </div>

          <div className="w-5 sm:w-12 h-[1px] bg-slate-200 dark:bg-slate-700" />

          {/* Step 2: Check in */}
          <div className="flex items-center gap-2">
            {activeReservation ? (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                2
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[11px] font-medium">
                2
              </div>
            )}
            <span className={activeReservation ? 'font-bold text-foreground' : 'text-slate-400 dark:text-slate-500'}>
              Check in
            </span>
          </div>

          <div className="w-5 sm:w-12 h-[1px] bg-slate-200 dark:bg-slate-700" />

          {/* Step 3: Active session */}
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] font-medium">
              3
            </div>
            <span>Active session</span>
          </div>
        </div>

        {/* Right Label */}
        <div className="text-xs text-muted-foreground font-normal">
          {activeReservation
            ? `Seat ${displaySeatCode} is reserved. Check in when you arrive.`
            : 'Select an available desk from the floor plan to make a reservation.'}
        </div>
      </div>

      {/* Error message alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setErrorMessage(null)}
            className="h-6 px-2 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 4. Two Columns Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Your Reservation Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs p-4 sm:p-6 space-y-6">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-sm font-bold text-foreground">Your reservation</span>
            {activeReservation ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                <span>Awaiting check-in</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                <span>No reservation</span>
              </div>
            )}
          </div>

          {activeReservation ? (
            <>
              {/* Desk Information */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                  <Monitor className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Seat {displaySeatCode}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {podLabel} · Individual workstation
                  </p>
                </div>
              </div>

              {/* Location line */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>SE Lab</span>
              </div>

              {/* Planned arrival & duration grid */}
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                <div>
                  <div className="text-muted-foreground font-medium">Planned arrival</div>
                  <div className="font-bold text-foreground text-sm mt-0.5">{plannedTime?.time}</div>
                  <div className="text-muted-foreground text-[11px]">{plannedTime?.date}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium">Session duration</div>
                  <div className="font-bold text-foreground text-sm mt-0.5">{durationHours} hours requested</div>
                  <div className="text-muted-foreground text-[11px]">Session ends by 5:00 PM</div>
                </div>
              </div>

              {/* Grace period callout */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">Check in by</span>
                </div>
                <div className="text-lg font-bold text-foreground tracking-tight">
                  {graceTime}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have up to 20 minutes to check in, but no later than 5:00 PM.
                </p>
              </div>

              {/* When you arrive info */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground">
                  When you arrive
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Find Seat {displaySeatCode} at {podLabel}. The QR label on your desk will start your session for up to {durationHours} hours, ending by 5:00 PM.
                </p>
              </div>

              {/* Footer: Cancel & user attribution */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  className="text-muted-foreground hover:text-destructive underline underline-offset-4 font-medium transition-colors cursor-pointer"
                >
                  Cancel reservation
                </button>
                <span className="text-muted-foreground font-medium">
                  Reserved for {reservedForName}
                </span>
              </div>
            </>
          ) : (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Monitor className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">No Pending Reservation</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  You don&apos;t have any active reservations. Select an available desk on the floor plan to reserve your workspace.
                </p>
              </div>
              <Button
                size="sm"
                onClick={onNavigateToMap}
                className="text-xs font-semibold gap-1.5"
              >
                <Map className="w-3.5 h-3.5" />
                <span>View 2D Floor Plan</span>
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Check In At Your Desk (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs p-4 sm:p-6 space-y-5">
          {/* Card Header */}
          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Scan className="w-4 h-4 text-primary" />
              <span>Check in at your desk</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {activeReservation ? `Reserved desk: ${displaySeatCode}` : 'Walk-in check-in'}
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {activeReservation
              ? `Scan the QR code on desk ${displaySeatCode} to start your session.`
              : 'Scan any available desk QR code in Turing Hall 101 to start a session.'}
          </p>

          {/* Camera Error Alert Banner if permission denied */}
          {cameraError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Camera Unavailable</span>
                <p className="text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                  {cameraError}
                </p>
              </div>
            </div>
          )}

          {/* Viewfinder Area */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 h-80 sm:h-96 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            <canvas ref={canvasRef} className="hidden" />

            {/* Video element is permanently mounted to keep ref and stream intact */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Starting Camera State */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#4a7cf6]" />
                <span className="text-xs font-semibold text-slate-300 tracking-wide">Starting Camera...</span>
              </div>
            )}

            {/* Verification In Progress Overlay */}
            {actionLoading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-20">
                <div className="w-12 h-12 rounded-2xl bg-[#4a7cf6]/20 border border-[#4a7cf6]/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4a7cf6]" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-bold text-white">Verifying Desk Code...</div>
                  <p className="text-[11px] text-slate-400">Connecting to Turing Hall reservation system</p>
                </div>
              </div>
            )}

            {/* Realistic HUD Scanner Overlay when Camera is Active */}
            {isCameraActive && !cameraLoading && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Live Camera Badge */}
                <div className="absolute top-3.5 left-3.5 pointer-events-auto px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-bold text-white tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Scanner</span>
                </div>

                {/* Flip / Switch Camera Button */}
                <button
                  type="button"
                  onClick={switchCamera}
                  className="absolute top-3.5 right-3.5 pointer-events-auto p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
                  title="Switch camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Centered Target Cutout Box with Vignette Mask */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl shadow-[0_0_0_9999px_rgba(10,15,25,0.65)] border border-white/20">
                  {/* Glowing Futuristic Corner Targeting Brackets */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-3 border-l-3 border-[#4a7cf6] rounded-tl-xl shadow-[0_0_8px_rgba(74,124,246,0.7)]" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-3 border-r-3 border-[#4a7cf6] rounded-tr-xl shadow-[0_0_8px_rgba(74,124,246,0.7)]" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-3 border-l-3 border-[#4a7cf6] rounded-bl-xl shadow-[0_0_8px_rgba(74,124,246,0.7)]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-3 border-r-3 border-[#4a7cf6] rounded-br-xl shadow-[0_0_8px_rgba(74,124,246,0.7)]" />

                  {/* Laser Scan Beam sweeping up and down */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#4a7cf6] to-transparent shadow-[0_0_12px_#4a7cf6] animate-qr-scan" />

                  {/* Target Crosshairs */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-4 h-0.5 bg-white rounded-full" />
                    <div className="h-4 w-0.5 bg-white rounded-full absolute" />
                  </div>
                </div>

                {/* Guidance Pill Badge */}
                <div className="mt-4 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90 flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Point camera at desk QR sticker</span>
                </div>
              </div>
            )}

            {/* Camera Off Placeholder Overlay */}
            {!isCameraActive && !cameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-900/90 backdrop-blur-xs z-10">
                <div className="relative w-36 h-36 flex flex-col items-center justify-center mb-2">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-slate-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-slate-500 rounded-tl-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-slate-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-slate-500 rounded-br-lg" />

                  <CameraOff className="w-9 h-9 text-slate-400 mb-2 stroke-[1.5]" />
                  <span className="text-xs font-semibold text-slate-400">
                    Camera is off
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Click &quot;Turn camera on&quot; to scan your workstation QR sticker.
                </p>
                <Button
                  size="sm"
                  onClick={() => startCamera()}
                  className="mt-4 gap-2 text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Turn camera on</span>
                </Button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              onClick={toggleCamera}
              size="sm"
              variant={isCameraActive ? 'outline' : 'default'}
              className="gap-2 px-5 font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{isCameraActive ? 'Turn camera off' : 'Turn camera on'}</span>
            </Button>

            {isCameraActive && (
              <Button
                onClick={switchCamera}
                variant="outline"
                size="sm"
                className="gap-2 px-4 font-semibold text-xs rounded-xl cursor-pointer"
                title="Switch between front and back camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip camera</span>
              </Button>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="gap-2 px-5 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload QR image</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Allow camera access when prompted, then hold the desk QR inside the guides.
          </p>

          {/* Notice Box at Bottom of Card */}
          <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-200">
                {activeReservation ? 'Use the QR code on your reserved desk' : 'Instant walk-in check-in'}
              </div>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                {activeReservation
                  ? `The scanned QR must belong to Seat ${displaySeatCode}. A different desk's code won't start this session.`
                  : 'Scan any available desk QR code in the lab to begin an instant workstation session immediately without reserving.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Page Footer */}
      <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>Turing Hall · Ground floor · Room 101</div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need help? Contact lab support</span>
        </div>
      </div>

      {/* Alert Error Modal (Wrong seat, invalid QR, check-in failure) */}
      <Dialog
        open={!!qrAlertModal}
        onOpenChange={(open) => {
          if (!open) {
            setQrAlertModal(null);
            isProcessingRef.current = false;
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                qrAlertModal?.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-600'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {qrAlertModal?.title || 'Scan Error'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {qrAlertModal?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setQrAlertModal(null);
                isProcessingRef.current = false;
              }}
              className="text-xs font-semibold px-4"
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
