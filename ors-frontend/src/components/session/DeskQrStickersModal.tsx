import React, { useState, useEffect } from 'react';
import { Seat } from '../../types';
import { ApiClient } from '../../lib/api-client';

interface DeskQrStickersModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Seat[];
}

export const DeskQrStickersModal: React.FC<DeskQrStickersModalProps> = ({
  isOpen,
  onClose,
  seats,
}) => {
  const [qrList, setQrList] = useState<{ seat: Seat; qrDataUrl: string; qrUrl?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPod, setSelectedPod] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    ApiClient.getAllQRCodes()
      .then((data) => {
        setQrList(data);
      })
      .catch((err) => {
        console.error('Failed to load QR codes:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const pods = ['ALL', 'Pod A (Alpha)', 'Pod B (Beta)', 'Pod C (Gamma)', 'Pod D (Delta)'];
  const filteredList = selectedPod === 'ALL'
    ? qrList
    : qrList.filter(item => item.seat.podLabel.toLowerCase().includes(selectedPod.slice(4, 5).toLowerCase()));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Hardware & Physical Laboratory Integration
            </span>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">Physical Desk QR Stickers & Activation Guide</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How printed QR codes on physical workstations connect directly with the online reservation and check-in system.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 sm:p-2 rounded-lg cursor-pointer text-base sm:text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Informative Explanation Banner */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4.5 space-y-3">
            <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
              <span>💡</span>
              <span>How Physical QR Codes Work & Connect to Seat Activation:</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-900">
              <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-700 block mb-1">1. Generate & Print Stickers</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every desk in Turing Hall 101 has a permanent vinyl sticker printed with its unique QR code (e.g. SEAT-A1 to SEAT-D6).
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-700 block mb-1">2. Online Hold & Arrival</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Students check availability online and reserve a desk within 1 hour. The seat is locked (RESERVED) for 20 mins.
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-700 block mb-1">3. Scan at Desk to Activate</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Upon sitting at the physical desk, the student scans the sticker. The app validates the reservation and starts their live session timer in <strong>My Session</strong>!
                </p>
              </div>
            </div>
            <div className="text-[11px] text-blue-800 bg-white/60 p-2.5 rounded-lg border border-blue-100">
              <strong>⚠️ Unavailable Desk Protection:</strong> If someone tries to scan a desk that is already occupied by another student, the scanner immediately rejects it: <em>"Workstation is UNAVAILABLE! Occupied by another student."</em>
            </div>
          </div>

          {/* Filter & Print Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 mr-1">Filter Pod:</span>
              {pods.map(pod => (
                <button
                  key={pod}
                  onClick={() => setSelectedPod(pod)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer border ${
                    selectedPod === pod
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pod}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
            >
              <span>🖨️</span>
              <span>Print Sticker Sheet (All 24 Desks)</span>
            </button>
          </div>

          {/* QR Stickers Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-400">
              Generating high-resolution QR vectors for 24 workstations...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="printable-stickers-area">
              {filteredList.map(({ seat, qrDataUrl, qrUrl }) => (
                <div
                  key={seat.id}
                  className="p-4 bg-white border-2 border-slate-300 rounded-xl text-center flex flex-col items-center shadow-xs hover:border-blue-400 transition-colors"
                >
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    SE Innovation Lab 101
                  </span>
                  <span className="text-base font-extrabold text-slate-900 my-0.5">
                    {seat.seatCode}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mb-1.5">
                    {seat.podLabel}
                  </span>
                  
                  {/* High Resolution Scannable QR Code */}
                  <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${seat.seatCode}`}
                      className="w-28 h-28 object-contain"
                    />
                  </div>

                  <span className="text-[9px] font-mono text-slate-400 mt-2 block truncate max-w-full">
                    {seat.qrToken}
                  </span>
                  <div className="mt-1 pt-1 border-t border-slate-100 w-full text-[9px] text-slate-500 font-medium">
                    Scan with Phone Camera or App Scanner
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Stickers formatted for standard Avery label paper (3.5" x 3.5")</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
