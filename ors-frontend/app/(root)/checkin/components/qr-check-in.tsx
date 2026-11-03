'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import { Seat, User, Reservation } from '@/types';
import { useActivateQrMutation, useCheckInMutation } from '@/hooks/use-session-query';
import { useCancelReservationMutation } from '@/hooks/use-reservation-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface QrCheckInProps {
  seats: Seat[];
  userReservations: Reservation[];
  currentUser: User | null;
  onOpenLogin: () => void;
  onSessionActivated: () => void;
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

  // Policy / feedback modal
  const [wrongSeatModal, setWrongSeatModal] = useState<{
    reservedSeatCode: string;
    scannedSeatCode: string;
    message: string;
  } | null>(null);

  // Manual code input modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
    const date = new Date(activeReservation.startTime);
    return {
      time: `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  }, [activeReservation]);

  const graceTime = useMemo(() => {
    if (!activeReservation?.startTime) return null;
    const date = new Date(new Date(activeReservation.startTime).getTime() + 20 * 60000);
    return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
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

    const token = rawToken.trim();

    // Verify token against seat codes or QR tokens
    const matchedSeat = seats.find(
      (s) =>
        s.qrToken.toLowerCase() === token.toLowerCase() ||
        s.seatCode.toLowerCase() === token.toLowerCase() ||
        s.seatCode.toLowerCase() === `seat-${token.toLowerCase()}` ||
        cleanSeatCode(s.seatCode).toLowerCase() === token.toLowerCase(),
    );

    // If student holds a specific pending reservation, enforce matching that desk
    if (activeReservation) {
      const reservedCode = cleanSeatCode(activeReservation.seatCode).toLowerCase();
      const tokenClean = cleanSeatCode(token).toLowerCase();

      if (tokenClean !== reservedCode && matchedSeat && cleanSeatCode(matchedSeat.seatCode).toLowerCase() !== reservedCode) {
        setWrongSeatModal({
          reservedSeatCode: displaySeatCode,
          scannedSeatCode: matchedSeat ? cleanSeatCode(matchedSeat.seatCode) : token,
          message: `The scanned QR must belong to Seat ${displaySeatCode}. A different desk's code won't start this session.`,
        });
        isProcessingRef.current = false;
        return;
      }
    }

    playSuccessChime();
    setActionLoading(true);

    try {
      if (currentUser && matchedSeat) {
        await activateMutation.mutateAsync({
          qrToken: matchedSeat.qrToken,
          seatCode: matchedSeat.seatCode,
          userId: currentUser.id,
        });
      } else if (matchedSeat) {
        await checkInMutation.mutateAsync({
          qrToken: matchedSeat.qrToken,
          userId: currentUser?.id || 1,
        });
      }
      onSessionActivated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to activate workstation session.');
    } finally {
      setActionLoading(false);
      isProcessingRef.current = false;
      stopCamera();
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
    setIsCameraActive(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && !isProcessingRef.current) {
      handleProcessQrToken(code.data);
      return;
    }

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [handleProcessQrToken]);

  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: 'environment' } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setCameraError('Camera access denied or unavailable. You can enter the code manually or upload a QR image.');
      setIsCameraActive(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
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

  // Direct quick simulation for testing if reservation exists
  const handleSimulateCheckIn = () => {
    if (activeReservation) {
      handleProcessQrToken(`QR-SELAB101-${displaySeatCode}`);
    }
  };

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
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-medium">
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

          <div className="w-8 sm:w-12 h-[1px] bg-slate-200 dark:bg-slate-700" />

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

          <div className="w-8 sm:w-12 h-[1px] bg-slate-200 dark:bg-slate-700" />

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
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs p-6 space-y-6">
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
                  <div className="font-bold text-foreground text-sm mt-0.5">{durationHours} hours</div>
                  <div className="text-muted-foreground text-[11px]">Starts after QR check-in</div>
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
                  You have a 20-minute arrival grace period from your planned arrival time.
                </p>
              </div>

              {/* When you arrive info */}
              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground">
                  When you arrive
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Find Seat {displaySeatCode} at {podLabel}. The QR label on your desk will start your {durationHours}-hour session.
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
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs p-6 space-y-5">
          {/* Card Header */}
          <div className="flex items-center justify-between">
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

          {/* Viewfinder Area */}
          <div className="relative rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 h-64 sm:h-72 flex flex-col items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="hidden" />

            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
                {/* Visual scanline */}
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-primary/80 animate-pulse shadow-sm" />
                {/* Corner guides */}
                <div className="absolute inset-8 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center select-none">
                {/* Corner bracket guides matching mockup */}
                <div className="relative w-36 h-36 flex flex-col items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-slate-400 dark:border-slate-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-slate-400 dark:border-slate-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-slate-400 dark:border-slate-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-slate-400 dark:border-slate-500 rounded-br-lg" />

                  <CameraOff className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2 stroke-[1.5]" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Camera off
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-4">
                  Your camera preview will appear here
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              onClick={toggleCamera}
              size="sm"
              className="gap-2 px-5 font-semibold text-xs rounded-xl shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCameraActive ? 'Stop camera' : 'Open camera'}</span>
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="gap-2 px-5 font-semibold text-xs rounded-xl"
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

          {/* Direct simulation / manual code options */}
          <div className="flex justify-center items-center gap-3 pt-1 text-xs text-muted-foreground">
            {activeReservation && (
              <>
                <button
                  type="button"
                  onClick={handleSimulateCheckIn}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Quick check-in desk {displaySeatCode}</span>
                </button>
                <span>·</span>
              </>
            )}
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="hover:underline cursor-pointer"
            >
              Enter code manually
            </button>
          </div>

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

      {/* Wrong Seat Warning Modal */}
      <Dialog open={!!wrongSeatModal} onOpenChange={(open) => !open && setWrongSeatModal(null)}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Different Desk Scanned
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {wrongSeatModal?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWrongSeatModal(null)}
              className="text-xs font-semibold"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Code Input Modal */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Enter Desk Code
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Type the desk code or token printed on your physical desk sticker (e.g. A1, B2, GT1-1).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. A1 or QR-SELAB101-A1"
              className="font-mono text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManualModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setManualModalOpen(false);
                handleProcessQrToken(manualCode);
              }}
              disabled={!manualCode.trim()}
              className="text-xs font-semibold"
            >
              Check in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
