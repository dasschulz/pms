# Profile Picture Caching with Supabase

## Overview

This document outlines the caching mechanism for MdB (Member of Parliament) profile pictures using Supabase Storage and edge functions for optimal performance.

## Implementation

### 1. Supabase Storage Configuration

```sql
-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true);

-- Create policy for public read access
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'profile-pictures');

-- Create policy for authenticated upload
CREATE POLICY "Authenticated upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);
```

### 2. Database Schema

```sql
-- Add profile picture fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_cached_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_storage_path TEXT;
```

### 3. API Endpoints

#### Upload Profile Picture
```typescript
// /api/profile-picture/upload
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;
  
  const fileName = `${userId}_${Date.now()}.${file.name.split('.').pop()}`;
  const filePath = `profiles/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, file);
    
  if (error) throw error;
  
  // Update user record with storage path
  await supabase
    .from('users')
    .update({
      profile_picture_storage_path: filePath,
      profile_picture_cached_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  return Response.json({ success: true, path: filePath });
}
```

#### Get Profile Picture
```typescript
// /api/profile-picture/[userId]
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  
  // Check if we have a cached version
  const { data: user } = await supabase
    .from('users')
    .select('profile_picture_storage_path, profile_picture_cached_at')
    .eq('id', userId)
    .single();
    
  if (user?.profile_picture_storage_path) {
    // Return cached version from Supabase Storage
    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(user.profile_picture_storage_path);
      
    return Response.redirect(data.publicUrl);
  }
  
  // Fallback to external source or default image
  return Response.redirect('/images/default-profile.png');
}
```

### 4. Frontend Integration

```typescript
// Hook for profile picture management
export function useProfilePicture(userId: string) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadProfilePicture() {
      try {
        const response = await fetch(`/api/profile-picture/${userId}`);
        setImageUrl(response.url);
      } catch (error) {
        setImageUrl('/images/default-profile.png');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (userId) {
      loadProfilePicture();
    }
  }, [userId]);
  
  return { imageUrl, isLoading };
}
```

### 5. Caching Strategy

1. **Storage**: All profile pictures stored in Supabase Storage bucket
2. **Database Tracking**: User table tracks storage path and cache timestamp
3. **CDN**: Supabase Storage provides automatic CDN distribution
4. **Fallback**: Default image for users without profile pictures

### 6. Background Sync Process

```typescript
// Edge function for periodic cache refresh
export async function refreshProfilePictures() {
  const { data: users } = await supabase
    .from('users')
    .select('id, name, profile_picture_cached_at')
    .lt('profile_picture_cached_at', 
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
    );
    
  for (const user of users || []) {
    try {
      // Fetch fresh profile picture from external source
      const freshImage = await fetchExternalProfilePicture(user.name);
      
      if (freshImage) {
        // Upload to Supabase Storage
        const filePath = `profiles/${user.id}_${Date.now()}.jpg`;
        await supabase.storage
          .from('profile-pictures')
          .upload(filePath, freshImage);
          
        // Update database record
        await supabase
          .from('users')
          .update({
            profile_picture_storage_path: filePath,
            profile_picture_cached_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error(`Failed to refresh profile picture for user ${user.id}:`, error);
    }
  }
}
```

## Benefits

- **Performance**: Fast CDN delivery via Supabase Storage
- **Reliability**: Cached images always available, even if external sources fail
- **Scalability**: Automatic scaling via Supabase infrastructure
- **Cost Effective**: Only store what's needed, automatic cleanup policies
- **Security**: Proper access controls and policies 