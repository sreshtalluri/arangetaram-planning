import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadPortfolioImage, MAX_FILE_SIZE, ALLOWED_TYPES, StorageError } from '@/lib/storage'
import { useAddPortfolioImage } from '@/hooks/usePortfolio'
import { Upload, X, Loader2, ImagePlus } from 'lucide-react'

interface PortfolioUploaderProps {
  vendorId: string
  currentCount: number
  maxImages?: number
  onUploadComplete?: () => void
}

export function PortfolioUploader({
  vendorId,
  currentCount,
  maxImages = 10,
  onUploadComplete
}: PortfolioUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const addImage = useAddPortfolioImage()

  const canUpload = currentCount < maxImages

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size
    if (selected.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5MB')
      return
    }

    // Create preview
    const objectUrl = URL.createObjectURL(selected)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(objectUrl)
    setFile(selected)
  }

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!file || !vendorId) return

    setUploading(true)
    try {
      const orderIndex = currentCount // Next available index
      const result = await uploadPortfolioImage(vendorId, file, orderIndex)

      await addImage.mutateAsync({
        vendor_id: vendorId,
        storage_path: result.path,
        order_index: orderIndex,
      })

      toast.success('Image uploaded!')
      handleCancel()
      onUploadComplete?.()
    } catch (error) {
      if (error instanceof StorageError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to upload image')
      }
    } finally {
      setUploading(false)
    }
  }

  if (!canUpload) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">Maximum {maxImages} images reached</p>
      </div>
    )
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      {preview ? (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-lg object-cover"
            />
            <button
              onClick={handleCancel}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={uploading}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center cursor-pointer">
          <ImagePlus className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600">
            Click to select an image
          </span>
          <span className="text-xs text-gray-400 mt-1">
            JPEG, PNG, or WebP up to 5MB ({currentCount}/{maxImages})
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
