import { useCallback } from 'react'

export function useProfilePicture() {
  const clearCache = useCallback((imageUrl?: string | null) => {
    if (!imageUrl) return
    
    // Clear specific image cache
    const cacheKey = `avatar_cache_${btoa(imageUrl).slice(0, 20)}`
    localStorage.removeItem(cacheKey)
    
    // Optional: Clear all avatar caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('avatar_cache_')) {
        localStorage.removeItem(key)
      }
    })
  }, [])

  const clearAllAvatarCache = useCallback(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('avatar_cache_')) {
        localStorage.removeItem(key)
      }
    })
  }, [])

  return {
    clearCache,
    clearAllAvatarCache
  }
} 