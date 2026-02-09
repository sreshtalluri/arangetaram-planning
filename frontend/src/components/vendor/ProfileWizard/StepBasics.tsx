import { useState, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { uploadProfilePhoto, MAX_FILE_SIZE, ALLOWED_TYPES, StorageError } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { User, Loader2, Upload } from 'lucide-react'

interface StepBasicsProps {
  onNext: () => void
}

export function StepBasics({ onNext }: StepBasicsProps) {
  const { register, formState: { errors }, trigger, setValue, watch } = useFormContext()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const profilePhotoUrl = watch('profile_photo_url')

  const handleNext = async () => {
    const valid = await trigger(['business_name', 'description'])
    if (valid) onNext()
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      const url = await uploadProfilePhoto(user.id, file)
      setValue('profile_photo_url', url)
      toast.success('Profile photo uploaded!')
    } catch (error) {
      if (error instanceof StorageError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to upload photo')
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Tell us about your business</h2>
        <p className="text-gray-500">Start with the basics</p>
      </div>

      <div className="space-y-4">
        {/* Profile Photo Upload */}
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP up to 5MB</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input
            id="business_name"
            {...register('business_name', { required: 'Business name is required' })}
            placeholder="Your business name"
          />
          {errors.business_name && (
            <p className="text-sm text-red-500">{errors.business_name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            {...register('description', { required: 'Description is required' })}
            placeholder="Describe your services and what makes you unique..."
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message as string}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
