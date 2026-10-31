import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Seat, User, Reservation } from '@/types';
import { sessionService, reservationService } from '@/services';

interface QrCheckInModalProps {
  seats: Seat[];
  currentUser: User | null;
  onOpenLogin: () => void;
  onSessionActivated: () => void;
  onNavigateToMap: () => void;
}

export const QrCheckInModal: React.FC<QrCheckInModalProps> = ({
  seats,
  currentUser,
  onOpenLogin,
  onSessionActivated,
  onNavigateToMap,
}) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'scanner'>('reservations');
  const [checkInMode, setCheckInMode] = useState<'camera' | 'manual'>('camera');
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unavailableSeatModal, setUnavailableSeatModal] = useState<{ seatCode: string; reason: string } | null>(null);
  const [wrongSeatModal, setWrongSeatModal] = useState<{
    reservedSeatCode: string;
    reservedPodLabel: string;
    scannedSeatCode: string;
    message: string;
  } | null>(null);
  const [noReservationModal, setNoReservationModal] = useState<{
    scannedSeatCode: string;
    message: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningSuccess, setIsScanningSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scannedResultFeedback, setScannedResultFeedback] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // Play audio chime upon successful QR code detection
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
      osc.frequency.exponentialRampToValueAtTime(1175, ctx.currentTime + 0.12); // D6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio might be muted or blocked by browser policy, ignore
    }
  };

  // Play audio warning upon wrong QR code detection
  const playWarningBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio might be muted or blocked by browser policy, ignore
    }
  };

  // Enumerate video cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const vInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vInputs);
        if (vInputs.length > 0 && !selectedDeviceId) {
          const backCam = vInputs.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedDeviceId(backCam ? backCam.deviceId : vInputs[0].deviceId);
        }
      }).catch(() => {});
    }
  }, [selectedDeviceId]);

  // Load user reservations
  const fetchReservations = useCallback(async () => {
    if (!currentUser) {
      setMyReservations([]);
      setLoadingReservations(false);
      return;
    }
    try {
      setLoadingReservations(true);
      const res = await reservationService.getUserReservations(currentUser.id);
      setMyReservations(res);
    } catch (err: any) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoadingReservations(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Clean up camera stream and animation on unmount or when camera turns off
  const stopCameraStream = useCallback(() => {
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

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Extract seatCode and qrToken from any raw QR string, URL, or JSON payload
  const parseQrPayload = useCallback((raw: string): { seatCode: string; qrToken: string } => {
    const trimmed = raw.trim();

    // 1. JSON payload: {"seatCode": "SEAT-A1", "token": "..."}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const sCode = (parsed.seatCode || parsed.seat || parsed.scan || '').toUpperCase();
        const qTok = parsed.qrToken || parsed.token || '';
        const match = seats.find((s) => (sCode && s.seatCode === sCode) || (qTok && s.qrToken === qTok));
        return {
          seatCode: match?.seatCode || sCode,
          qrToken: match?.qrToken || qTok,
        };
      } catch {
        // continue
      }
    }

    // 2. URL parsing: e.g. https://domain.edu/?scan=SEAT-A1&token=QR-SELAB101-A1
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const scan = url.searchParams.get('scan') || url.searchParams.get('seatId') || url.searchParams.get('seat') || url.searchParams.get('seatCode');
        const token = url.searchParams.get('token') || url.searchParams.get('qrToken') || '';
        let resolvedCode = scan ? scan.toUpperCase() : '';
        const resolvedToken = token;

        if (resolvedCode && !resolvedCode.startsWith('SEAT-') && /^[A-D][1-6]$/.test(resolvedCode)) {
          resolvedCode = `SEAT-${resolvedCode}`;
        }

        const match = seats.find((s) => (resolvedCode && s.seatCode === resolvedCode) || (resolvedToken && s.qrToken === resolvedToken));
        if (match) {
          return { seatCode: match.seatCode, qrToken: match.qrToken };
        }
        if (resolvedCode) {
          return { seatCode: resolvedCode, qrToken: resolvedToken };
        }
      }
    } catch {
      // not a url
    }

    // 3. Query string fragment: scan=SEAT-A1&token=...
    if (trimmed.includes('scan=') || trimmed.includes('token=')) {
      const matchScan = trimmed.match(/(?:scan|seat|seatCode)=([^&]+)/i);
      const matchToken = trimmed.match(/(?:token|qrToken)=([^&]+)/i);
      let sCode = matchScan ? decodeURIComponent(matchScan[1]).toUpperCase() : '';
      const qToken = matchToken ? decodeURIComponent(matchToken[1]) : '';
      if (sCode && !sCode.startsWith('SEAT-') && /^[A-D][1-6]$/.test(sCode)) {
        sCode = `SEAT-${sCode}`;
      }
      const match = seats.find((s) => (sCode && s.seatCode === sCode) || (qToken && s.qrToken === qToken));
      if (match) return { seatCode: match.seatCode, qrToken: match.qrToken };
      if (sCode) return { seatCode: sCode, qrToken: qToken };
    }

    // 4. Direct seatCode (e.g. SEAT-A1 or A1)
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('SEAT-')) {
      const matchingSeat = seats.find((s) => s.seatCode === upper);
      return { seatCode: upper, qrToken: matchingSeat?.qrToken || '' };
    }

    // 5. Short code like A1, B3, C4
    if (/^[A-D][1-6]$/.test(upper)) {
      const fullCode = `SEAT-${upper}`;
      const matchingSeat = seats.find((s) => s.seatCode === fullCode);
      return { seatCode: fullCode, qrToken: matchingSeat?.qrToken || '' };
    }

    // 6. Match against seat's qrToken
    const tokenMatchedSeat = seats.find((s) => s.qrToken.toLowerCase() === trimmed.toLowerCase());
    if (tokenMatchedSeat) {
      return { seatCode: tokenMatchedSeat.seatCode, qrToken: tokenMatchedSeat.qrToken };
    }

    return { seatCode: upper, qrToken: trimmed };
  }, [seats]);

  const pendingReservations = myReservations.filter((r) => r.status === 'PENDING_ACTIVATION');

  // Handle QR Activation (Scanning Physical QR code)
  const handleActivateQr = async (qrToken: string, seatCode: string) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnavailableSeatModal(null);
    setWrongSeatModal(null);
    setNoReservationModal(null);

    // Normalize seat code
    const normalizedCode = seatCode.startsWith('SEAT-') ? seatCode.toUpperCase() : `SEAT-${seatCode.toUpperCase()}`;
    const targetSeat = seats.find((s) => s.seatCode === normalizedCode || s.qrToken === qrToken);
    const resolvedCode = targetSeat ? targetSeat.seatCode : normalizedCode;

    setScannedResultFeedback(`Workstation recognized: ${resolvedCode}. Validating...`);

    // -------------------------------------------------------------------------
    // CRITICAL REQUIREMENT: User reserved seat A1, but scanned A2 -> SHOW WARNING MESSAGE!
    // -------------------------------------------------------------------------
    const activeReservation = pendingReservations[0];

    if (activeReservation) {
      // User has an active reservation
      if (activeReservation.seatCode.toUpperCase() !== resolvedCode) {
        playWarningBeep();
        setWrongSeatModal({
          reservedSeatCode: activeReservation.seatCode,
          reservedPodLabel: activeReservation.podLabel,
          scannedSeatCode: resolvedCode,
          message: `Warning: You have reserved workstation ${activeReservation.seatCode}. The QR code you scanned is for ${resolvedCode}. You cannot access this workstation. Please scan the QR code at your reserved desk ${activeReservation.seatCode}.`,
        });
        setScannedResultFeedback(null);
        setActionLoading(false);
        return;
      }
    } else {
      // User does NOT have any pending reservation
      setNoReservationModal({
        scannedSeatCode: resolvedCode,
        message: `No reservation found for workstation ${resolvedCode}. You must reserve a seat on the 2D floor plan first before scanning to activate.`,
      });
      setScannedResultFeedback(null);
      setActionLoading(false);
      return;
    }

    // Check if the seat is occupied or under maintenance
    if (targetSeat && (targetSeat.status === 'OCCUPIED' || targetSeat.status === 'EXPIRING_SOON')) {
      const activeExpiry = targetSeat.currentSession
        ? new Date(targetSeat.currentSession.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'conclusion of current session';
      setUnavailableSeatModal({
        seatCode: targetSeat.seatCode,
        reason: `This workstation is currently OCCUPIED by another student until ${activeExpiry}. To ensure fairness, you cannot activate or check in to an occupied desk. Please return to the 2D floor plan or choose an available green desk.`,
      });
      setScannedResultFeedback(null);
      setActionLoading(false);
      return;
    }

    try {
      const session = await sessionService.activateSeatWithQr({
        qrToken: qrToken || targetSeat?.qrToken || '',
        seatCode: targetSeat?.seatCode || resolvedCode,
        userId: currentUser.id,
      });
      setScannedResultFeedback(null);
      setSuccessMessage(`Activated! Welcome to ${session.seatCode}. Your session is now live.`);
      stopCameraStream();
      onSessionActivated();
    } catch (err: any) {
      setScannedResultFeedback(null);
      if (err.message && (err.message.includes('Wrong Workstation') || err.message.includes('WRONG_SEAT_QR') || err.message.includes('You reserved workstation'))) {
        setWrongSeatModal({
          reservedSeatCode: activeReservation?.seatCode || 'Your Reserved Seat',
          reservedPodLabel: activeReservation?.podLabel || '',
          scannedSeatCode: resolvedCode,
          message: err.message,
        });
      } else if (err.message && (err.message.includes('UNAVAILABLE') || err.message.includes('occupied') || err.message.includes('reserved') || err.message.includes('another student'))) {
        setUnavailableSeatModal({
          seatCode: targetSeat?.seatCode || resolvedCode,
          reason: err.message,
        });
      } else if (err.message && (err.message.includes('No reservation found') || err.message.includes('NO_RESERVATION_FOUND'))) {
        setNoReservationModal({
          scannedSeatCode: resolvedCode,
          message: err.message,
        });
      } else {
        setErrorMessage(err.message || 'Workstation activation failed. Please verify the QR code.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Decode Image using BarcodeDetector and jsQR
  const decodeImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WebP) containing a QR code.');
      return;
    }
    setErrorMessage(null);
    setScannedResultFeedback(`Analyzing image: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // 1. Try native BarcodeDetector if available
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const { seatCode, qrToken } = parseQrPayload(barcodes[0].rawValue);
              playSuccessChime();
              setSuccessMessage(`QR Code detected: ${seatCode}`);
              setScannedResultFeedback(null);
              handleActivateQr(qrToken, seatCode);
              return;
            }
          } catch {
            // fallback to jsQR
          }
        }

        // 2. Decode using scaled canvas and jsQR
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setErrorMessage('Failed to initialize image decoder canvas.');
          setScannedResultFeedback(null);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          playSuccessChime();
          const { seatCode, qrToken } = parseQrPayload(code.data);
          setSuccessMessage(`QR Code detected: ${seatCode}`);
          setScannedResultFeedback(null);
          handleActivateQr(qrToken, seatCode);
        } else {
          setScannedResultFeedback(null);
          setErrorMessage('No QR code detected in this photo. Please ensure the QR code is clearly centered and well-lit, or test using the sample desks below.');
        }
      };
      img.onerror = () => {
        setErrorMessage('Failed to load image file. Please try another image.');
        setScannedResultFeedback(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Real-time Camera Frame Scanner Loop
  const scanVideoFrame = useCallback(async () => {
    if (!isCameraActive || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const now = Date.now();

    // Throttle to every 120ms (approx 8 FPS scanning)
    if (now - lastScanTimeRef.current >= 120 && !isProcessingRef.current) {
      lastScanTimeRef.current = now;

      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        let detectedRaw: string | null = null;

        // 1. Try BarcodeDetector
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detectedRaw = barcodes[0].rawValue;
            }
          } catch {
            // fallback to jsQR
          }
        }

        // 2. Fallback to jsQR with optimized scaled canvas
        if (!detectedRaw) {
          try {
            const scanCanvas = canvasRef.current || document.createElement('canvas');
            const maxDim = 640;
            let sw = video.videoWidth;
            let sh = video.videoHeight;
            if (sw > maxDim || sh > maxDim) {
              const scale = Math.min(maxDim / sw, maxDim / sh);
              sw = Math.round(sw * scale);
              sh = Math.round(sh * scale);
            }
            scanCanvas.width = sw;
            scanCanvas.height = sh;
            const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, sw, sh);
              const imgData = ctx.getImageData(0, 0, sw, sh);
              const qr = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: 'attemptBoth',
              });
              if (qr && qr.data) {
                detectedRaw = qr.data;
              }
            }
          } catch (err) {
            console.warn('Canvas scan frame error:', err);
          }
        }

        // If detected!
        if (detectedRaw) {
          isProcessingRef.current = true;
          playSuccessChime();
          setIsScanningSuccess(true);
          const parsed = parseQrPayload(detectedRaw);
          setScannedResultFeedback(`QR Code recognized: ${parsed.seatCode}`);

          setTimeout(() => {
            handleActivateQr(parsed.qrToken, parsed.seatCode);
            setTimeout(() => {
              isProcessingRef.current = false;
              setIsScanningSuccess(false);
            }, 1800);
          }, 350);
          return;
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  }, [isCameraActive, parseQrPayload, seats]);

  // Start scanning loop whenever camera becomes active
  useEffect(() => {
    if (isCameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, scanVideoFrame]);

  // Camera start / stop toggle
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCameraStream();
    } else {
      setCameraError(null);
      setCameraLoading(true);
      setErrorMessage(null);

      let stream: MediaStream | null = null;
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
              },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err1) {
        console.warn('Environment / specified camera constraints failed, attempting basic video:', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err2: any) {
          console.error('Webcam getUserMedia failed:', err2);
          setCameraLoading(false);
          setIsCameraActive(false);
          setCameraError(
            err2.name === 'NotAllowedError'
              ? 'Camera permission was denied. Please allow camera access in your browser bar, or upload a photo of the desk sticker below.'
              : 'Webcam could not be opened on this device. You can use the "Upload QR Image" option or click any workstation in the quick test list below.'
          );
          return;
        }
      }

      if (stream) {
        streamRef.current = stream;
        setIsCameraActive(true);
        setCameraLoading(false);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch((e) => console.warn('Video play caught:', e));
        }
      }
    }
  };

  // Re-attach stream when isCameraActive changes or video element updates
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const v = videoRef.current;
      if (v.srcObject !== streamRef.current) {
        v.srcObject = streamRef.current;
      }
      v.setAttribute('playsinline', 'true');
      v.play().catch((e) => console.warn('Video play re-attach error:', e));
    }
  }, [isCameraActive]);

  // Handle Cancel Reservation Online
  const handleCancelReservation = async (reservationId: number, seatCode: string) => {
    if (!currentUser) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setWrongSeatModal(null);
    try {
      await reservationService.cancelReservation(reservationId, currentUser.id);
      setSuccessMessage(`Reservation for ${seatCode} cancelled successfully. The seat has been freed online.`);
      await fetchReservations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">QR Check-In & Workstation Activation</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage your held reservations, scan physical desk QR codes upon arrival, or cancel online if plans change.
          </p>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        
        {/* Navigation Tabs between Option 1 (Reserved Data) and Option 2 (Scanner) */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`pb-2.5 sm:pb-3 px-3 sm:px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'reservations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>1️⃣ Held Reservations ({pendingReservations.length})</span>
            {pendingReservations.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`pb-2.5 sm:pb-3 px-3 sm:px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>2️⃣ QR Scanner & Activation</span>
          </button>
        </div>

        {/* Global Feedback Banners */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-600 hover:text-rose-900 cursor-pointer">✕</button>
          </div>
        )}

        {cameraError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{cameraError}</span>
            </div>
            <button onClick={() => setCameraError(null)} className="font-bold text-amber-700 hover:text-amber-950 cursor-pointer">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
          </div>
        )}

        {/* -------------------------------------------------------------------------------- */}
        {/* WRONG WORKSTATION QR CODE: JUST ONLY SHOW WARNING MESSAGE */}
        {/* -------------------------------------------------------------------------------- */}
        {wrongSeatModal && (
          <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 border-y border-r border-amber-200 text-amber-950 shadow-xs animate-in fade-in duration-200 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Warning: Wrong Workstation QR Code
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  {wrongSeatModal.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setWrongSeatModal(null)}
              className="text-amber-700 hover:text-amber-950 font-bold p-1 text-sm cursor-pointer shrink-0"
              title="Close warning message"
            >
              ✕
            </button>
          </div>
        )}

        {/* NO RESERVATION MODAL / WARNING */}
        {noReservationModal && (
          <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-300 shadow-md animate-in fade-in duration-200 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-blue-950">
                  Reservation Required for Workstation {noReservationModal.scannedSeatCode}
                </h4>
                <p className="text-xs text-blue-900 leading-relaxed">
                  {noReservationModal.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 pl-9">
              <button
                onClick={onNavigateToMap}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Go to 2D Floor Plan to Reserve →
              </button>
              <button
                onClick={() => setNoReservationModal(null)}
                className="px-3.5 py-2 rounded-xl bg-white border border-blue-300 text-blue-800 font-semibold text-xs hover:bg-blue-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* UNAVAILABLE SEAT MODAL / ALERT */}
        {unavailableSeatModal && (
          <div className="p-5 rounded-2xl bg-rose-50/90 border-2 border-rose-300 shadow-md animate-in fade-in duration-200 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-rose-950">
                  Workstation {unavailableSeatModal.seatCode} is UNAVAILABLE
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {unavailableSeatModal.reason}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 pl-9">
              <button
                onClick={onNavigateToMap}
                className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white font-bold text-xs hover:bg-rose-800 cursor-pointer shadow-xs"
              >
                View Available Desks on 2D Map →
              </button>
              <button
                onClick={() => setUnavailableSeatModal(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 font-semibold text-xs hover:bg-rose-50 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* OPTION 1: USER ALREADY RESERVE DATA (WITH ONLINE CANCEL) */}
        {/* ============================================================================== */}
        {activeTab === 'reservations' && (
          <div className="pt-2 space-y-4">
            {!currentUser ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-2xl">🔒</span>
                <h3 className="text-sm font-bold text-slate-900">Sign In to View Your Reservations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Sign in with your university student account to see your reserved workstations and manage your arrival.
                </p>
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : loadingReservations ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                Loading your reserved workstations...
              </div>
            ) : pendingReservations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm mx-auto">
                  🪑
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">No Active Workstation Reservations</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You do not currently have any held desks. Browse the 2D floor plan on the home page to select a free green desk and reserve it for 1h to 4h (within 1 hour of your arrival).
                  </p>
                </div>
                <button
                  onClick={onNavigateToMap}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  View 2D Floor Plan →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Your Confirmed Reservations ({pendingReservations.length})</span>
                  <span>Arrival Grace Period: 20 minutes from start</span>
                </div>

                {pendingReservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">{res.seatCode}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {res.podLabel}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Pending Physical Activation
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Planned Arrival:</span>
                          <span className="font-semibold text-slate-800 font-mono tabular-nums">
                            {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration:</span>
                          <span className="font-semibold text-slate-800 font-mono tabular-nums">
                            {res.durationHours} {res.durationHours === 1 ? 'Hour' : 'Hours'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Must Activate By:</span>
                          <span className="font-semibold text-rose-700 font-mono tabular-nums">
                            {new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Cancel Online OR Activate */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-indigo-100">
                      <button
                        onClick={() => handleCancelReservation(res.id, res.seatCode)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Cancel this reservation online and free the seat for other students"
                      >
                        Cancel in Online
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('scanner');
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Activate at Desk →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* OPTION 2: SCANNER FOR ACTIVATE RESERVE SEAT */}
        {/* ============================================================================== */}
        {activeTab === 'scanner' && (
          <div className="pt-2 space-y-6">
            
            {/* Educational Explanation Box */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <span>💡</span>
                <span>Physical QR Code Matching Rule:</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                {pendingReservations.length > 0 ? (
                  <span>
                    You have reserved <strong>{pendingReservations[0].seatCode}</strong> ({pendingReservations[0].podLabel}). You must scan <strong>{pendingReservations[0].seatCode}'s</strong> QR code to activate your session. Scanning any other desk (like A2 or B3) will be denied with a warning!
                  </span>
                ) : (
                  <span>
                    Every desk has a permanent printed QR sticker. To activate a workstation, reserve it first from the 2D floor plan, then scan that specific desk's sticker upon your arrival.
                  </span>
                )}
              </p>
            </div>

            {/* MODE SWITCHER: Camera / Photo Capture vs Manual Typing */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 pl-1 sm:pl-2">
                <span className="text-xs font-bold text-slate-800">Check-In Method:</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">Choose camera scan or type desk code</span>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCheckInMode('camera')}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    checkInMode === 'camera'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📷</span>
                  <span>Photo & Camera Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckInMode('manual');
                    if (isCameraActive) {
                      stopCameraStream();
                    }
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    checkInMode === 'manual'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>⌨️</span>
                  <span>Manual Typing</span>
                </button>
              </div>
            </div>

            {/* Hidden Canvas for decoding */}
            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  decodeImageFile(e.target.files[0]);
                }
              }}
            />

            {/* ============================================================================== */}
            {/* MODE 1: CAMERA & PHOTO CAPTURE ONLY */}
            {/* ============================================================================== */}
            {checkInMode === 'camera' && (
              <div className="space-y-5">
                {/* Scanner Camera Box (Webcam, Drag & Drop, Image Upload) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📷</span>
                      <span>Camera Viewfinder & Desk Scanner</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {videoDevices.length > 1 && (
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => {
                            setSelectedDeviceId(e.target.value);
                            if (isCameraActive) {
                              stopCameraStream();
                              setTimeout(() => toggleCamera(), 200);
                            }
                          }}
                          className="text-[11px] border border-slate-300 rounded px-2 py-0.5 bg-white text-slate-700"
                        >
                          {videoDevices.map((d, i) => (
                            <option key={d.deviceId || i} value={d.deviceId}>
                              {d.label || `Camera ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        Engine: BarcodeDetector + jsQR
                      </span>
                    </div>
                  </div>

                  {/* The interactive camera / image drop box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        decodeImageFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden transition-all duration-200 border-2 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-900/30 scale-102 ring-4 ring-blue-400/40'
                        : isScanningSuccess
                        ? 'border-emerald-400 ring-4 ring-emerald-400/50 bg-black'
                        : isCameraActive
                        ? 'border-emerald-500 bg-black shadow-lg ring-2 ring-emerald-500/30'
                        : 'border-dashed border-slate-700 bg-slate-950 shadow-inner'
                    } flex flex-col items-center justify-center text-white`}
                  >
                    {/* The video element */}
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      onLoadedMetadata={() => {
                        videoRef.current?.play().catch(() => {});
                      }}
                      className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                    />

                    {/* Overlays when Camera is Active */}
                    {isCameraActive && (
                      <div
                        className={`absolute inset-8 border-2 rounded-2xl pointer-events-none flex flex-col items-center justify-center transition-colors duration-200 ${
                          isScanningSuccess ? 'border-emerald-400 bg-emerald-500/20' : 'border-emerald-400/70'
                        }`}
                      >
                        {/* Animated laser line */}
                        <div
                          className={`w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/50 ${
                            isScanningSuccess ? 'scale-x-125' : 'animate-pulse'
                          }`}
                        />

                        {/* Corner Reticle Brackets */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                        <div className="absolute bottom-3 px-2.5 py-1 bg-black/75 backdrop-blur-xs rounded-full text-[10px] font-mono text-emerald-300 border border-emerald-400/30">
                          {isScanningSuccess ? '✓ QR Code Detected!' : 'Point camera at physical desk QR sticker'}
                        </div>
                      </div>
                    )}

                    {/* Idle Camera Box / Image Drop Target when camera is not active */}
                    {!isCameraActive && (
                      <div className="p-6 text-center space-y-4 max-w-xs">
                        <div className="w-20 h-20 mx-auto rounded-2xl border-2 border-dashed border-blue-400/50 flex items-center justify-center bg-blue-950/40 relative">
                          <span className="text-3xl">📷</span>
                          <div className="absolute inset-0 border border-blue-400/30 rounded-2xl animate-pulse" />
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white">
                            {isDragging ? 'Drop QR Code Photo Here!' : 'Scan Desk QR Sticker'}
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Click <strong>"Turn On Webcam"</strong> below to scan live, or drop / upload a photo of your desk sticker.
                          </p>
                        </div>

                        {scannedResultFeedback && (
                          <div className="p-2 rounded bg-blue-900/80 text-blue-200 text-xs font-mono animate-pulse">
                            {scannedResultFeedback}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Overlay Tag */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[10px] font-mono font-medium text-slate-300 border border-white/10 flex items-center gap-1.5 z-10">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        {cameraLoading
                          ? 'Starting Camera...'
                          : isCameraActive
                          ? 'Camera Live (Scanning)'
                          : 'Scanner Ready'}
                      </span>
                    </div>
                  </div>

                  {/* Camera & Image Upload Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={toggleCamera}
                      disabled={cameraLoading}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isCameraActive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>{cameraLoading ? '⏳ Connecting...' : isCameraActive ? '⏹️ Stop Camera' : '📹 Turn On Webcam'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>📁</span>
                      <span>Upload QR Image / Photo</span>
                    </button>
                  </div>
                </div>

                {/* Quick Test / Scan Simulation Bar */}
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>Quick Scan Simulation (Test Desk Match Rules)</span>
                      </h4>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Simulate scanning your reserved desk sticker or a wrong desk:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Test user's reserved desk */}
                    {pendingReservations.length > 0 && (
                      <button
                        onClick={() => {
                          const res = pendingReservations[0];
                          const s = seats.find((st) => st.id === res.seatId);
                          handleActivateQr(s?.qrToken || '', res.seatCode);
                        }}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span>✓</span>
                        <span>Scan Reserved Desk ({pendingReservations[0].seatCode})</span>
                      </button>
                    )}

                    {/* Test scanning Wrong Desk */}
                    <button
                      onClick={() => {
                        const wrongSeat = seats.find((s) => s.seatCode === 'SEAT-A2') || seats[1];
                        handleActivateQr(wrongSeat.qrToken, wrongSeat.seatCode);
                      }}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                      title="Simulate scanning seat A2"
                    >
                      <span>⚠️</span>
                      <span>Scan Wrong Desk (SEAT-A2) [Warning Test]</span>
                    </button>

                    {/* Sample Occupied Desk */}
                    <button
                      onClick={() => {
                        const occSeat = seats.find((s) => s.seatCode === 'SEAT-A3') || seats[2];
                        handleActivateQr(occSeat.qrToken, occSeat.seatCode);
                      }}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                      title="Simulate scanning occupied desk"
                    >
                      <span>🚫</span>
                      <span>Scan Occupied Desk (SEAT-A3)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================================== */}
            {/* MODE 2: MANUAL TYPING ONLY */}
            {/* ============================================================================== */}
            {checkInMode === 'manual' && (
              <div className="space-y-6">
                {/* Manual Code Input Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>⌨️</span>
                      <span>Manual Workstation Code Entry</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Type the workstation identifier found on your desk's physical label (e.g., <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800">SEAT-A1</code> or <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800">A1</code>).
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. SEAT-A1 or A1"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && manualCode.trim()) {
                            handleActivateQr(manualCode.trim(), manualCode.trim());
                          }
                        }}
                        className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl font-mono uppercase font-bold focus:outline-blue-500 bg-white shadow-2xs"
                        autoFocus
                      />
                      {manualCode && (
                        <button
                          type="button"
                          onClick={() => setManualCode('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (manualCode.trim()) {
                          handleActivateQr(manualCode.trim(), manualCode.trim());
                        }
                      }}
                      disabled={actionLoading || !manualCode.trim()}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {actionLoading ? 'Verifying...' : 'Activate Desk Session'}
                    </button>
                  </div>

                  {/* Quick-fill shortcut for user's reserved desk */}
                  {pendingReservations.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
                      <span className="text-[11px] text-slate-500">Your reservation:</span>
                      <button
                        type="button"
                        onClick={() => setManualCode(pendingReservations[0].seatCode)}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Fill {pendingReservations[0].seatCode}</span>
                        <span>↓</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Select Workstation Buttons Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Or Select Workstation Directly (All 24 Desks)
                    </label>
                    <span className="text-[11px] text-slate-500">Click any desk to fill and activate</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1">
                    {seats.map((seat) => {
                      const isReservedByUser = pendingReservations.some((r) => r.seatId === seat.id);
                      const isOccupied = seat.status === 'OCCUPIED' || seat.status === 'EXPIRING_SOON';
                      return (
                        <button
                          key={seat.id}
                          onClick={() => {
                            setManualCode(seat.seatCode);
                            handleActivateQr(seat.qrToken, seat.seatCode);
                          }}
                          disabled={actionLoading}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer group ${
                            isReservedByUser
                              ? 'border-emerald-500 bg-emerald-50/80 hover:bg-emerald-100 ring-2 ring-emerald-400'
                              : isOccupied
                              ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-100'
                              : seat.status === 'AVAILABLE'
                              ? 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                              : seat.status === 'RESERVED'
                              ? 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300'
                              : 'border-slate-200 bg-slate-50 opacity-80'
                          }`}
                        >
                          <span className="font-extrabold text-xs text-slate-900 block group-hover:scale-105 transition-transform font-mono">
                            {seat.seatCode.replace('SEAT-', '')}
                          </span>
                          <span
                            className={`text-[9px] font-bold block mt-0.5 ${
                              isReservedByUser
                                ? 'text-emerald-700 font-extrabold'
                                : isOccupied
                                ? 'text-rose-700'
                                : seat.status === 'AVAILABLE'
                                ? 'text-emerald-600'
                                : seat.status === 'RESERVED'
                                ? 'text-indigo-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isReservedByUser ? '★ Your Desk' : isOccupied ? 'Occupied' : seat.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
