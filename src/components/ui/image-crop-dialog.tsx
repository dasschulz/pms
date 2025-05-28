"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { Crop, Download } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedImageBase64: string) => void;
  maxSizeBytes?: number;
  targetDimensions?: { width: number; height: number };
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
  maxSizeBytes = 2 * 1024 * 1024, // 2MB default
  targetDimensions = { width: 400, height: 400 } // Square 400x400 default
}: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [scale, setScale] = useState(1);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoverCorner, setHoverCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);

  // Reset state when dialog opens/closes or image changes
  useEffect(() => {
    if (!open || !imageFile) {
      setImageLoaded(false);
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      setScale(1);
      setImageNaturalSize({ width: 0, height: 0 });
      setCanvasSize({ width: 0, height: 0 });
      setImage(null);
    }
  }, [open, imageFile]);

  // Load and draw image when file changes
  useEffect(() => {
    if (!imageFile || !open) return;

    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      // Calculate canvas size to fit the dialog while maintaining aspect ratio
      const maxCanvasWidth = 500;
      const maxCanvasHeight = 400;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      let canvasWidth, canvasHeight;
      if (aspectRatio > maxCanvasWidth / maxCanvasHeight) {
        canvasWidth = maxCanvasWidth;
        canvasHeight = maxCanvasWidth / aspectRatio;
      } else {
        canvasHeight = maxCanvasHeight;
        canvasWidth = maxCanvasHeight * aspectRatio;
      }
      
      setCanvasSize({ width: canvasWidth, height: canvasHeight });
      
      // Initialize crop area as a square in the center
      const minDimension = Math.min(canvasWidth, canvasHeight) * 0.8;
      const x = (canvasWidth - minDimension) / 2;
      const y = (canvasHeight - minDimension) / 2;
      
      setCropArea({
        x,
        y,
        width: minDimension,
        height: minDimension
      });
      
      setImage(img);
      setImageLoaded(true);
    };
    
    img.src = URL.createObjectURL(imageFile);
  }, [imageFile, open]);

  // Draw canvas with image and crop overlay
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image scaled to fit canvas
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);

    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Redraw image in crop area
    const scaleX = imageNaturalSize.width / canvasSize.width;
    const scaleY = imageNaturalSize.height / canvasSize.height;
    
    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );

    // Draw crop border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    
    // Top-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // Top-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
  }, [cropArea, imageLoaded, canvasSize, imageNaturalSize, image]);

  // Redraw canvas when crop area or scale changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Helper function to detect corner handle clicks
  const getCornerHandle = (x: number, y: number): 'tl' | 'tr' | 'bl' | 'br' | null => {
    const handleSize = 8;
    const tolerance = handleSize; // Extra tolerance for easier clicking
    
    // Top-left
    if (Math.abs(x - cropArea.x) <= tolerance && Math.abs(y - cropArea.y) <= tolerance) {
      return 'tl';
    }
    // Top-right  
    if (Math.abs(x - (cropArea.x + cropArea.width)) <= tolerance && Math.abs(y - cropArea.y) <= tolerance) {
      return 'tr';
    }
    // Bottom-left
    if (Math.abs(x - cropArea.x) <= tolerance && Math.abs(y - (cropArea.y + cropArea.height)) <= tolerance) {
      return 'bl';
    }
    // Bottom-right
    if (Math.abs(x - (cropArea.x + cropArea.width)) <= tolerance && Math.abs(y - (cropArea.y + cropArea.height)) <= tolerance) {
      return 'br';
    }
    
    return null;
  };

  // Handle mouse events for dragging crop area
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a corner handle first
    const corner = getCornerHandle(x, y);
    if (corner) {
      setIsResizing(true);
      setResizeCorner(corner);
      setDragStart({ x, y });
      return;
    }

    // Check if click is inside crop area for moving
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging && !isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const minSize = 50; // Minimum crop size

    if (isResizing && resizeCorner) {
      const { x: prevX, y: prevY, width: prevWidth, height: prevHeight } = cropArea;
      let newX = prevX;
      let newY = prevY;
      let newSize = prevWidth; // Crop area is always square

      switch (resizeCorner) {
        case 'br': { // Bottom-right handle, top-left corner is fixed
          const fixedX = prevX;
          const fixedY = prevY;
          // Calculate size based on mouse distance from fixed point
          let sizeByWidth = currentX - fixedX;
          let sizeByHeight = currentY - fixedY;
          newSize = Math.max(sizeByWidth, sizeByHeight);
          // Constrain size
          newSize = Math.max(minSize, Math.min(newSize, canvasSize.width - fixedX, canvasSize.height - fixedY));
          newX = fixedX;
          newY = fixedY;
          break;
        }
        case 'tl': { // Top-left handle, bottom-right corner is fixed
          const fixedX = prevX + prevWidth;
          const fixedY = prevY + prevHeight;
          let sizeByWidth = fixedX - currentX;
          let sizeByHeight = fixedY - currentY;
          newSize = Math.max(sizeByWidth, sizeByHeight);
          // Constrain size
          newSize = Math.max(minSize, Math.min(newSize, fixedX, fixedY));
          newX = fixedX - newSize;
          newY = fixedY - newSize;
          break;
        }
        case 'tr': { // Top-right handle, bottom-left corner is fixed
          const fixedX = prevX;
          const fixedY = prevY + prevHeight;
          let sizeByWidth = currentX - fixedX;
          let sizeByHeight = fixedY - currentY;
          newSize = Math.max(sizeByWidth, sizeByHeight);
          // Constrain size
          newSize = Math.max(minSize, Math.min(newSize, canvasSize.width - fixedX, fixedY));
          newX = fixedX;
          newY = fixedY - newSize;
          break;
        }
        case 'bl': { // Bottom-left handle, top-right corner is fixed
          const fixedX = prevX + prevWidth;
          const fixedY = prevY;
          let sizeByWidth = fixedX - currentX;
          let sizeByHeight = currentY - fixedY;
          newSize = Math.max(sizeByWidth, sizeByHeight);
          // Constrain size
          newSize = Math.max(minSize, Math.min(newSize, fixedX, canvasSize.height - fixedY));
          newX = fixedX - newSize;
          newY = fixedY;
          break;
        }
      }
      
      // Ensure the derived position and size are within bounds.
      // Adjust size if position clamping would make it too small or invalid.
      // This section needs careful thought to avoid oscillation or invalid states.

      // Clamp positions first
      let clampedX = Math.max(0, Math.min(newX, canvasSize.width - newSize));
      let clampedY = Math.max(0, Math.min(newY, canvasSize.height - newSize));

      // If position was clamped, it might mean newSize is too big for that clamped position.
      // Example: if newX was negative, clampedX becomes 0. fixedX - newSize (for 'tl' or 'bl')
      // or fixedX (for 'tr' or 'br') would define the edge.
      // Let's ensure newSize is valid for the clamped positions.
      if (resizeCorner === 'tl' || resizeCorner === 'bl') { // Anchored to the right
        newSize = Math.min(newSize, (prevX + prevWidth) - clampedX);
      }
      if (resizeCorner === 'tr' || resizeCorner === 'br') { // Anchored to the left
         newSize = Math.min(newSize, canvasSize.width - clampedX);
      }
       if (resizeCorner === 'tl' || resizeCorner === 'tr') { // Anchored to the bottom
        newSize = Math.min(newSize, (prevY + prevHeight) - clampedY);
      }
      if (resizeCorner === 'bl' || resizeCorner === 'br') { // Anchored to the top
        newSize = Math.min(newSize, canvasSize.height - clampedY);
      }
      newSize = Math.max(minSize, newSize); // Ensure minSize is respected after adjustments


      // Recalculate positions based on potentially adjusted newSize
      switch (resizeCorner) {
        case 'tl':
          clampedX = (prevX + prevWidth) - newSize;
          clampedY = (prevY + prevHeight) - newSize;
          break;
        case 'tr':
          clampedY = (prevY + prevHeight) - newSize;
          break;
        case 'bl':
          clampedX = (prevX + prevWidth) - newSize;
          break;
        // For 'br', X and Y are already fixed and correct.
      }
      
      // Final clamp
      clampedX = Math.max(0, Math.min(clampedX, canvasSize.width - newSize));
      clampedY = Math.max(0, Math.min(clampedY, canvasSize.height - newSize));


      setCropArea({
        x: clampedX,
        y: clampedY,
        width: newSize,
        height: newSize
      });

    } else if (isDragging) {
      // Handle moving
      const x = currentX - dragStart.x;
      const y = currentY - dragStart.y;

      // Constrain to canvas bounds
      const maxX = canvasSize.width - cropArea.width;
      const maxY = canvasSize.height - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY))
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner(null);
  };

  // Handle mouse hover for cursor changes
  const handleMouseHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const corner = getCornerHandle(x, y);
    setHoverCorner(corner);
  };

  // Get cursor style based on current state
  const getCursor = () => {
    if (isResizing) {
      switch (resizeCorner) {
        case 'tl':
        case 'br':
          return 'nwse-resize';
        case 'tr':
        case 'bl':
          return 'nesw-resize';
        default:
          return 'nwse-resize';
      }
    }
    if (isDragging) return 'grabbing';
    if (hoverCorner) {
      switch (hoverCorner) {
        case 'tl':
        case 'br':
          return 'nwse-resize';
        case 'tr':
        case 'bl':
          return 'nesw-resize';
        default:
          return 'nwse-resize';
      }
    }
    return 'grab';
  };

  // Crop image and return as base64
  const handleCrop = async () => {
    if (!image) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    // Set target dimensions
    cropCanvas.width = targetDimensions.width;
    cropCanvas.height = targetDimensions.height;

    // Calculate source coordinates in original image
    const scaleX = imageNaturalSize.width / canvasSize.width;
    const scaleY = imageNaturalSize.height / canvasSize.height;
    
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Draw cropped image
    cropCtx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetDimensions.width,
      targetDimensions.height
    );

    // Convert to base64 and check size
    let quality = 0.9;
    let croppedImageBase64: string;
    
    do {
      croppedImageBase64 = cropCanvas.toDataURL('image/jpeg', quality);
      
      // Check file size (approximate)
      const base64Length = croppedImageBase64.length;
      const sizeInBytes = (base64Length * 3) / 4;
      
      if (sizeInBytes <= maxSizeBytes || quality <= 0.1) {
        break;
      }
      
      quality -= 0.1;
    } while (quality > 0.1);

    onCropComplete(croppedImageBase64);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Profilbild zuschneiden
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {imageLoaded && (
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 rounded-lg cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                  handleMouseHover(e);
                  handleMouseMove(e);
                }}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                  display: 'block', 
                  margin: '0 auto', 
                  cursor: getCursor()
                }}
              />
            </div>
          )}
          
          {!imageLoaded && imageFile && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Bild wird geladen...</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCrop} disabled={!imageLoaded}>
            <Download className="w-4 h-4 mr-2" />
            Zuschneiden & Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 