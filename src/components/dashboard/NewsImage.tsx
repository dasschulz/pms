"use client";

// import Image from "next/image"; // No longer using next/image for this component
import { useState, useEffect } from "react";

interface NewsImageProps {
  src: string | null | undefined; // Allow null/undefined
  alt: string;
  width: number; 
  height: number;
  className?: string;
}

const FALLBACK_IMAGE_SRC = "/images/categories/pm.jpeg";

export function NewsImage({ src: initialSrc, alt, width, height, className }: NewsImageProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null | undefined>(initialSrc);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    // When the src prop changes, reset the image URL and error state
    setCurrentImageUrl(initialSrc);
    setHasLoadError(false);
  }, [initialSrc]);

  const handleError = () => {
    if (!hasLoadError) { // Prevent infinite loops
      setHasLoadError(true);
    }
  };

  let finalSrcToRender: string;

  if (hasLoadError || !currentImageUrl || currentImageUrl.trim() === "") {
    finalSrcToRender = FALLBACK_IMAGE_SRC;
  } else if (currentImageUrl.startsWith('/') || currentImageUrl.startsWith('http')) {
    finalSrcToRender = currentImageUrl;
  } else {
    // Assuming it's a partial path that needs https prepended - though NewsData.io should give full URLs
    finalSrcToRender = `https://${currentImageUrl}`;
  }

  // Using a standard <img> tag
  return (
    <img
      src={finalSrcToRender}
      alt={alt}
      width={width} // browser handles this as an attribute, not for optimization like next/image
      height={height} // browser handles this as an attribute
      className={className} // Ensure your CSS handles object-fit etc.
      onError={handleError}
      style={{ objectFit: 'cover' }} // explicit style for consistency with next/image behavior
    />
  );
} 