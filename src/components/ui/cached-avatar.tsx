"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserDetails } from "@/hooks/use-user-details"

interface CachedAvatarProps {
  src?: string | null
  alt?: string
  fallbackText?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
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
  const [retryCount, setRetryCount] = React.useState(0)

  // Use shared user details hook to get profile picture URL
  const { data: userDetails } = useUserDetails()

  // Cache key for localStorage
  const cacheKey = src ? `avatar_cache_${btoa(src).slice(0, 20)}` : null

  React.useEffect(() => {
    // If no src provided, try to use the profile picture from user details
    if (!src && userDetails?.profilePictureUrl) {
      setImageSrc(userDetails.profilePictureUrl)
      setIsLoading(false)
      setHasError(false)
      return
    }

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
          const cacheTime = 24 * 60 * 60 * 1000 // 24 hours
          const isExpired = Date.now() - timestamp > cacheTime
          
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
    img.crossOrigin = "anonymous"
    
    img.onload = () => {
      try {
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
        setRetryCount(0) // Reset retry count on success
      } catch (e) {
        // If canvas conversion fails, use original src
        setImageSrc(src)
        setRetryCount(0)
      }
      setIsLoading(false)
    }
    
    img.onerror = async () => {
      console.warn('Avatar image failed to load:', src)
      
      // Remove from cache if it exists
      if (cacheKey) {
        localStorage.removeItem(cacheKey)
      }
      
      // Try to get a fresh URL if we haven't retried too many times and user details has a profile picture
      if (retryCount < 2 && userDetails?.profilePictureUrl && userDetails.profilePictureUrl !== src) {
        console.log('Attempting to use fresh avatar URL from user details...')
        setRetryCount(prev => prev + 1)
        
        const freshUrl = userDetails.profilePictureUrl
        console.log('Got fresh avatar URL, retrying...')
        // Create a new image element with the fresh URL
        const freshImg = new Image()
        freshImg.crossOrigin = "anonymous"
        freshImg.onload = () => {
          setImageSrc(freshUrl)
          setIsLoading(false)
          setHasError(false)
          // Cache the fresh URL
          const freshCacheKey = `avatar_cache_${btoa(freshUrl).slice(0, 20)}`
          localStorage.setItem(freshCacheKey, JSON.stringify({
            dataUrl: freshUrl,
            timestamp: Date.now()
          }))
        }
        freshImg.onerror = () => {
          setHasError(true)
          setImageSrc(null)
          setIsLoading(false)
        }
        freshImg.src = freshUrl
        return
      }
      
      setHasError(true)
      setImageSrc(null)
      setIsLoading(false)
    }
    
    img.src = src
  }, [src, cacheKey, retryCount, userDetails?.profilePictureUrl])

  // Handle AvatarImage error as additional fallback
  const handleAvatarImageError = React.useCallback(async () => {
    console.warn('AvatarImage onError triggered')
    
    // Clear cache
    if (cacheKey) {
      localStorage.removeItem(cacheKey)
    }
    
    // Try to use profile picture from user details if we haven't retried too many times
    if (retryCount < 2 && userDetails?.profilePictureUrl && userDetails.profilePictureUrl !== src) {
      setRetryCount(prev => prev + 1)
      const freshUrl = userDetails.profilePictureUrl
      setImageSrc(freshUrl)
      setHasError(false)
      return
    }
    
    setHasError(true)
    setImageSrc(null)
  }, [src, cacheKey, retryCount, userDetails?.profilePictureUrl])

  // Generate fallback text from name or email
  const generateFallback = () => {
    if (fallbackText) {
      return fallbackText.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }
    // Try to generate from user details if available
    if (userDetails?.name) {
      return userDetails.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }
    return <User className="h-4 w-4" />
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {!hasError && imageSrc && !isLoading && (
        <AvatarImage 
          src={imageSrc} 
          alt={alt}
          onError={handleAvatarImageError}
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