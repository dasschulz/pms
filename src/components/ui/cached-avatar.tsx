"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface CachedAvatarProps {
  src?: string | null
  alt?: string
  fallbackText?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-12 w-12"
}

export function CachedAvatar({ 
  src, 
  alt = "Profilbild", 
  fallbackText,
  className,
  size = "md"
}: CachedAvatarProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(src || null)
  const [hasError, setHasError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(!!src)

  // Cache key for localStorage
  const cacheKey = src ? `avatar_cache_${btoa(src).slice(0, 20)}` : null

  React.useEffect(() => {
    if (!src) {
      setImageSrc(null)
      setHasError(false)
      setIsLoading(false)
      return
    }

    // Check if we have a cached version that's still valid (24 hours)
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const { dataUrl, timestamp } = JSON.parse(cached)
          const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000 // 24 hours
          
          if (!isExpired && dataUrl) {
            setImageSrc(dataUrl)
            setIsLoading(false)
            return
          } else if (isExpired) {
            localStorage.removeItem(cacheKey)
          }
        } catch (e) {
          localStorage.removeItem(cacheKey)
        }
      }
    }

    // If no valid cache, try to load and cache the image
    setIsLoading(true)
    setHasError(false)
    
    const img = new Image()
    // Don't set crossOrigin for Airtable URLs to avoid CORS issues
    const isAirtableUrl = src.includes('airtableusercontent.com')
    if (!isAirtableUrl) {
      img.crossOrigin = "anonymous"
    }
    
    img.onload = () => {
      try {
        // Only try canvas conversion for non-Airtable URLs or if CORS is supported
        if (!isAirtableUrl) {
          // Create canvas to convert to data URL
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
            
            // Cache the image
            if (cacheKey && dataUrl.length < 1024 * 1024) { // Only cache if < 1MB
              localStorage.setItem(cacheKey, JSON.stringify({
                dataUrl,
                timestamp: Date.now()
              }))
            }
            
            setImageSrc(dataUrl)
          } else {
            setImageSrc(src)
          }
        } else {
          // For Airtable URLs, just use the original URL and cache a reference
          if (cacheKey) {
            localStorage.setItem(cacheKey, JSON.stringify({
              dataUrl: src,
              timestamp: Date.now()
            }))
          }
          setImageSrc(src)
        }
      } catch (e) {
        // If canvas conversion fails, use original src
        setImageSrc(src)
      }
      setIsLoading(false)
    }
    
    img.onerror = () => {
      setHasError(true)
      setImageSrc(null)
      setIsLoading(false)
      
      // Remove from cache if it exists
      if (cacheKey) {
        localStorage.removeItem(cacheKey)
      }
    }
    
    img.src = src
  }, [src, cacheKey])

  // Generate fallback text from name or email
  const generateFallback = () => {
    if (fallbackText) {
      return fallbackText.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }
    return <User className="h-4 w-4" />
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {!hasError && imageSrc && !isLoading && (
        <AvatarImage 
          src={imageSrc} 
          alt={alt}
          onError={() => setHasError(true)}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {isLoading ? (
          <div className="animate-pulse bg-muted rounded-full w-full h-full" />
        ) : (
          generateFallback()
        )}
      </AvatarFallback>
    </Avatar>
  )
} 