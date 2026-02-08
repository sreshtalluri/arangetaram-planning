import { supabase } from './supabase'

const PORTFOLIO_BUCKET = 'portfolio-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface UploadResult {
  path: string
  url: string
}

export class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Validate file before upload
 */
function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new StorageError(
      'Image too large. Please use an image under 5MB.',
      'FILE_TOO_LARGE'
    )
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new StorageError(
      'Invalid file type. Please use JPEG, PNG, or WebP.',
      'INVALID_TYPE'
    )
  }
}

/**
 * Upload a portfolio image for a vendor
 * Images are stored in vendor-specific folders: {vendorId}/{filename}
 */
export async function uploadPortfolioImage(
  vendorId: string,
  file: File,
  orderIndex: number
): Promise<UploadResult> {
  validateFile(file)

  // Generate unique filename with order prefix for sorting
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${orderIndex}-${Date.now()}.${ext}`
  const filePath = `${vendorId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new StorageError(
      'Failed to upload image. Please try again.',
      'UPLOAD_FAILED'
    )
  }

  const url = getPublicUrl(filePath)
  return { path: filePath, url }
}

/**
 * Delete a portfolio image from storage
 */
export async function deletePortfolioImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .remove([storagePath])

  if (error) {
    console.error('Delete error:', error)
    throw new StorageError(
      'Failed to delete image. Please try again.',
      'DELETE_FAILED'
    )
  }
}

/**
 * Get public URL for a portfolio image
 * Note: Supabase Image Transforms require Pro plan
 * Using basic public URL for now
 */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(PORTFOLIO_BUCKET)
    .getPublicUrl(storagePath)

  return data.publicUrl
}

/**
 * Upload a profile photo for a vendor
 * Stored at: {vendorId}/profile.{ext}
 */
export async function uploadProfilePhoto(
  vendorId: string,
  file: File
): Promise<string> {
  validateFile(file)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${vendorId}/profile.${ext}`

  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Allow replacing profile photo
    })

  if (error) {
    throw new StorageError(
      'Failed to upload profile photo. Please try again.',
      'UPLOAD_FAILED'
    )
  }

  return getPublicUrl(filePath)
}

// Export constants for use in components
export { MAX_FILE_SIZE, ALLOWED_TYPES, PORTFOLIO_BUCKET }
