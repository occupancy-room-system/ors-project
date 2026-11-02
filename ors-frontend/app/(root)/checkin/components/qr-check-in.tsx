'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Seat, User, Reservation } from '@/types';
import { useActivateQrMutation, useCheckInMutation } from '@/hooks/use-session-query';
import { useCancelReservationMutation } from '@/hooks/use-reservation-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  QrCode,
  Bookmark,
  Camera,
  Keyboard,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'reservations' | 'scanner'>('reservations');
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals for policy feedback
  const [wrongSeatModal, setWrongSeatModal] = useState<{
    reservedSeatCode: string;
    reservedPodLabel: string;
    scannedSeatCode: string;
    message: string;
  } | null>(null);
  const [unavailableSeatModal, setUnavailableSeatModal] = useState<{
    seatCode: string;
    reason: string;
  } | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningSuccess, setIsScanningSuccess] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const activateMutation = useActivateQrMutation();
  const checkInMutation = useCheckInMutation();
  const cancelMutation = useCancelReservationMutation();

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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

  const handleProcessQrToken = async (rawToken: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setErrorMessage(null);

    const token = rawToken.trim();

    // Verify token matches known seats
    const matchedSeat = seats.find(
      (s) =>
        s.qrToken.toLowerCase() === token.toLowerCase() ||
        s.seatCode.toLowerCase() === token.toLowerCase() ||
        s.seatCode.toLowerCase() === `seat-${token.toLowerCase()}`,
    );

    if (!matchedSeat) {
      setErrorMessage(`Invalid QR code token: "${token}". Please scan a valid Turing 101 desk QR code.`);
      isProcessingRef.current = false;
      return;
    }

    if (matchedSeat.status === 'MAINTENANCE') {
      setUnavailableSeatModal({
        seatCode: matchedSeat.seatCode,
        reason: 'This workstation is currently marked for maintenance / hardware inspection.',
      });
      isProcessingRef.current = false;
      return;
    }

    if (matchedSeat.status === 'OCCUPIED') {
      setUnavailableSeatModal({
        seatCode: matchedSeat.seatCode,
        reason: 'This workstation is currently occupied by another student session.',
      });
      isProcessingRef.current = false;
      return;
    }

    // Check if user has a pending reservation for a DIFFERENT seat
    const pendingRes = userReservations.find((r) => r.status === 'PENDING_ACTIVATION');
    if (pendingRes && pendingRes.seatId !== matchedSeat.id) {
      setWrongSeatModal({
        reservedSeatCode: pendingRes.seatCode,
        reservedPodLabel: pendingRes.podLabel,
        scannedSeatCode: matchedSeat.seatCode,
        message: `You hold an active reservation for ${pendingRes.seatCode} (${pendingRes.podLabel}), but scanned ${matchedSeat.seatCode}.`,
      });
      isProcessingRef.current = false;
      return;
    }

    playSuccessChime();
    setIsScanningSuccess(true);
    setActionLoading(true);

    try {
      if (currentUser) {
        await activateMutation.mutateAsync({
          qrToken: matchedSeat.qrToken,
          seatCode: matchedSeat.seatCode,
          userId: currentUser.id,
        });
      } else {
        // Guest direct check-in with anonymous student ID
        await checkInMutation.mutateAsync({
          qrToken: matchedSeat.qrToken,
          userId: 2,
        });
      }
      onSessionActivated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to activate workstation session.');
      setIsScanningSuccess(false);
    } finally {
      setActionLoading(false);
      isProcessingRef.current = false;
    }
  };

  // Direct activation from My Reservations list
  const handleActivateReservation = async (res: Reservation) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      playSuccessChime();
      await activateMutation.mutateAsync({
        seatCode: res.seatCode,
        userId: res.userId,
      });
      onSessionActivated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await cancelMutation.mutateAsync({ reservationId, userId: currentUser.id });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to cancel reservation.');
    } finally {
      setActionLoading(false);
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

    if (code && code.data) {
      stopCamera();
      handleProcessQrToken(code.data);
      return;
    }

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraLoading(true);
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      }

      // Enumerate cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err) {
      setCameraError('Camera access denied or device not found. You can enter the seat code manually below.');
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Image upload decoding
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
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleProcessQrToken(code.data);
        } else {
          setErrorMessage('Could not find a valid QR code in this image. Please ensure the QR code is clearly visible.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const pendingReservations = userReservations.filter((r) => r.status === 'PENDING_ACTIVATION');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          Workstation Check-In
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Scan the desk QR code at Turing Hall 101 or activate an existing reservation to start your session.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-11 p-1 bg-muted rounded-xl">
          <TabsTrigger value="reservations" className="text-xs font-bold gap-2 data-[state=active]:bg-background">
            <Bookmark className="w-4 h-4" />
            My Reservations
            {pendingReservations.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-indigo-100 text-indigo-700">
                {pendingReservations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scanner" className="text-xs font-bold gap-2 data-[state=active]:bg-background">
            <QrCode className="w-4 h-4" />
            Scan Desk QR Code
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Reservations */}
        <TabsContent value="reservations" className="pt-4 space-y-4">
          {!currentUser ? (
            <Card className="border-border">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Sign In to View Reservations</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Sign in with your student account to access reserved workstations or view upcoming bookings.
                  </p>
                </div>
                <Button onClick={onOpenLogin} size="sm" className="h-9 px-4 text-xs font-bold">
                  Sign In to University Account
                </Button>
              </CardContent>
            </Card>
          ) : pendingReservations.length === 0 ? (
            <Card className="border-border">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">No Pending Reservations</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    You do not have any pending workstation bookings. Select an available desk on the 2D floor plan or scan a desk QR code directly.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button onClick={onNavigateToMap} variant="outline" size="sm" className="text-xs">
                    View Floor Plan
                  </Button>
                  <Button onClick={() => setActiveTab('scanner')} size="sm" className="text-xs font-bold gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    Scan Desk QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingReservations.map((res) => (
                <Card key={res.id} className="border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold border-indigo-300 text-indigo-700 bg-indigo-50">
                          {res.podLabel}
                        </Badge>
                        <h4 className="text-base font-extrabold text-foreground">{res.seatCode}</h4>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Duration: {res.durationHours} hours
                        </span>
                        <span>·</span>
                        <span>Expires: {new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleCancelReservation(res.id)}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleActivateReservation(res)}
                        className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Activate Workstation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Camera Scanner & Manual Input */}
        <TabsContent value="scanner" className="pt-4 space-y-4">
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Desk QR Scanner</CardTitle>
                  <CardDescription className="text-xs">
                    Point your camera at the QR code sticker affixed to the workstation desk surface.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg border border-border/60">
                  <Button
                    variant={scannerMode === 'camera' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setScannerMode('camera')}
                    className="h-7 text-xs px-2.5 gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Camera
                  </Button>
                  <Button
                    variant={scannerMode === 'manual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      stopCamera();
                      setScannerMode('manual');
                    }}
                    className="h-7 text-xs px-2.5 gap-1.5"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    Manual
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {scannerMode === 'camera' ? (
                <div className="space-y-4">
                  {cameraError && (
                    <div className="p-3 text-xs rounded-lg border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Video Viewport */}
                  <div className="relative aspect-video w-full rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-border">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />

                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white p-4 text-center space-y-3">
                        <Camera className="w-10 h-10 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold">Camera is idle</p>
                          <p className="text-[11px] text-muted-foreground">Click below to activate live QR detection</p>
                        </div>
                        <Button
                          onClick={() => startCamera(selectedDeviceId)}
                          disabled={cameraLoading}
                          size="sm"
                          className="text-xs font-bold gap-2"
                        >
                          {cameraLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                          Start Camera
                        </Button>
                      </div>
                    )}

                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-primary/80 rounded-2xl relative animate-pulse shadow-lg">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {isCameraActive ? (
                      <Button variant="outline" size="sm" onClick={stopCamera} className="text-xs">
                        Stop Camera
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => startCamera()} className="text-xs">
                        Start Camera
                      </Button>
                    )}

                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload QR Image
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Manual Seat Code Entry */
                <div className="space-y-4 max-w-md mx-auto py-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Workstation Code or QR Token
                    </label>
                    <Input
                      placeholder="e.g. SEAT-A1 or QR-SELAB101-A1"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="font-mono text-xs uppercase"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Located on the white QR label on the corner of the desk.
                    </p>
                  </div>

                  <Button
                    onClick={() => handleProcessQrToken(manualCode)}
                    disabled={!manualCode.trim() || actionLoading}
                    className="w-full text-xs font-bold gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Verify & Check In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wrong Seat Scanned Dialog */}
      <Dialog open={!!wrongSeatModal} onOpenChange={(open) => !open && setWrongSeatModal(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">Wrong Workstation Scanned</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {wrongSeatModal?.message}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200">
            Please walk over to your assigned desk: <strong className="font-mono">{wrongSeatModal?.reservedSeatCode}</strong> in {wrongSeatModal?.reservedPodLabel}.
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setWrongSeatModal(null)} className="text-xs font-bold">
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unavailable Seat Dialog */}
      <Dialog open={!!unavailableSeatModal} onOpenChange={(open) => !open && setUnavailableSeatModal(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
              <XCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Workstation {unavailableSeatModal?.seatCode} Unavailable
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {unavailableSeatModal?.reason}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setUnavailableSeatModal(null)} className="text-xs font-bold">
              Choose Another Desk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

