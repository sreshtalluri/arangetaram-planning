import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePortfolio, useReorderPortfolio, useDeletePortfolioImage, type PortfolioImage } from '@/hooks/usePortfolio'
import { deletePortfolioImage as deleteFromStorage, getPublicUrl } from '@/lib/storage'
import { GripVertical, Trash2, Loader2 } from 'lucide-react'

interface SortableImageProps {
  image: PortfolioImage
  onDelete: (id: string) => void
  isDeleting: boolean
}

function SortableImage({ image, onDelete, isDeleting }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const imageUrl = getPublicUrl(image.storage_path)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-white rounded-lg overflow-hidden shadow-sm border"
    >
      <img
        src={imageUrl}
        alt={image.caption || 'Portfolio image'}
        className="w-full h-48 object-cover"
      />

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-white/90 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(image.id)}
        disabled={isDeleting}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>

      {/* Caption */}
      {image.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-2 truncate">
          {image.caption}
        </div>
      )}
    </div>
  )
}

interface PortfolioGalleryProps {
  vendorId: string
}

export function PortfolioGallery({ vendorId }: PortfolioGalleryProps) {
  const { data: images = [], isLoading } = usePortfolio(vendorId)
  const reorderMutation = useReorderPortfolio()
  const deleteMutation = useDeletePortfolioImage()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)
      const reordered = arrayMove(images, oldIndex, newIndex)

      // Update order indices
      const updates = reordered.map((img, idx) => ({
        id: img.id,
        order_index: idx,
      }))

      try {
        await reorderMutation.mutateAsync({ vendorId, images: updates })
      } catch (error) {
        toast.error('Failed to reorder images')
      }
    }
  }

  const handleDelete = async (imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (!image) return

    setDeletingId(imageId)
    try {
      // Delete from storage first
      await deleteFromStorage(image.storage_path)
      // Then delete from database
      await deleteMutation.mutateAsync({ id: imageId, vendorId })
      toast.success('Image deleted')
    } catch (error) {
      toast.error('Failed to delete image')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No portfolio images yet. Upload some to showcase your work!
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <SortableImage
              key={image.id}
              image={image}
              onDelete={handleDelete}
              isDeleting={deletingId === image.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
