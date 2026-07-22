import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move } from 'lucide-react';
import { Language } from '../types';

interface ImageCropperModalProps {
  imageSrc: string;
  language: Language;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  language,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle Drag / Pan
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Perform Canvas Crop
  const handleSaveCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const CROP_SIZE = 300; // Output high quality square avatar size
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    ctx.save();
    // Center of canvas
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scale factor between display viewport (240px) and canvas (300px)
    const displaySize = 240;
    const displayToCanvasRatio = CROP_SIZE / displaySize;

    // Center translation offset from dragging
    const canvasOffsetX = offset.x * displayToCanvasRatio;
    const canvasOffsetY = offset.y * displayToCanvasRatio;

    ctx.translate(canvasOffsetX, canvasOffsetY);
    ctx.scale(zoom, zoom);

    // Draw centered image
    const aspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = displaySize * displayToCanvasRatio;
    let drawHeight = displaySize * displayToCanvasRatio;

    if (aspect > 1) {
      drawWidth = drawHeight * aspect;
    } else {
      drawHeight = drawWidth / aspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Export compressed JPEG base64
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F7F5F2] border-2 border-[#1A1A1A] w-full max-w-sm overflow-hidden shadow-[10px_10px_0px_#1A1A1A] flex flex-col">
        {/* Header */}
        <div className="p-3.5 bg-white border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <Move className="w-4 h-4 text-[#C2410C]" />
            <h2 className="text-sm font-serif font-bold uppercase tracking-tight">
              {language === 'hi' ? 'फोटो क्रॉप व एडजस्ट करें' : 'Crop & Adjust Photo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white transition shadow-[2px_2px_0px_#1A1A1A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Area Container */}
        <div className="p-4 flex flex-col items-center gap-4">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative w-[240px] h-[240px] bg-[#1A1A1A]/10 border-2 border-[#1A1A1A] overflow-hidden cursor-grab active:cursor-grabbing shadow-[4px_4px_0px_#1A1A1A] touch-none flex items-center justify-center"
          >
            {/* Overlay Circular Target Mask */}
            <div className="absolute inset-0 border-[24px] border-[#1A1A1A]/50 rounded-full pointer-events-none z-10" />

            <img
              ref={imageRef}
              src={imageSrc}
              alt="To crop"
              onLoad={() => setImageLoaded(true)}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              className="max-w-none max-h-none pointer-events-none select-none min-w-[240px] min-h-[240px] object-cover"
            />
          </div>

          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#555] text-center">
            {language === 'hi'
              ? 'फोटो को ड्रैग करके और ज़ूम स्लाइडर से सेट करें'
              : 'Drag photo to position & use slider to zoom'}
          </p>

          {/* Controls: Zoom & Rotate */}
          <div className="w-full space-y-3 bg-white p-3 border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
            <div className="flex items-center gap-2 text-xs">
              <ZoomOut className="w-4 h-4 text-[#1A1A1A] shrink-0" />
              <input
                type="range"
                min="0.6"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#C2410C] cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-[#1A1A1A] shrink-0" />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#1A1A1A]">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="px-2.5 py-1 bg-[#F7F5F2] border border-[#1A1A1A] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-[#1A1A1A] hover:text-white transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'घुमाएँ' : 'Rotate'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                  setRotation(0);
                }}
                className="text-[10px] text-[#C2410C] font-bold uppercase hover:underline"
              >
                {language === 'hi' ? 'रीसेट' : 'Reset Position'}
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="w-full flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#EAE6DF] font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_#1A1A1A] transition"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={!imageLoaded}
              className="px-5 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#333] font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0px_#C2410C] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-white stroke-[3]" />
              <span>{language === 'hi' ? 'क्रॉप व सेव करें' : 'Crop & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
