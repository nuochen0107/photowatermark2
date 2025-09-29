import { create } from 'zustand'
import { ipcRenderer } from 'electron'
import fs from 'fs'
import path from 'path'

const useImageStore = create((set, get) => ({
  images: [],
  selectedImage: null,
  thumbnailCache: new Map(),
  previewCache: new Map(),
  loadingThumbnails: new Set(),
  loadingPreviews: new Set(),
  previewErrors: new Set(),

  addImages: async (filePaths) => {
    const newImages = filePaths.map(filePath => ({
      id: filePath,
      path: filePath,
      name: path.basename(filePath),
    }))

    set(state => ({
      images: [...state.images, ...newImages],
    }))

    // Generate thumbnails for new images
    newImages.forEach(async (image) => {
      if (get().loadingThumbnails.has(image.id)) return
      get().loadingThumbnails.add(image.id)
      set(state => ({ ...state }))

      try {
        const thumbnail = await ipcRenderer.invoke('generate-thumbnail', image.path)
        get().thumbnailCache.set(image.id, `data:image/jpeg;base64,${thumbnail}`)
      } catch (error) {
        console.error(`Error generating thumbnail for ${image.path}:`, error)
      } finally {
        get().loadingThumbnails.delete(image.id)
        set(state => ({ ...state }))
      }
    })
  },

  removeImage: (imageId) => {
    set(state => ({
      images: state.images.filter(img => img.id !== imageId),
      selectedImage: state.selectedImage?.id === imageId ? null : state.selectedImage,
    }))
    get().thumbnailCache.delete(imageId)
    get().previewCache.delete(imageId)
    get().loadingThumbnails.delete(imageId)
    get().loadingPreviews.delete(imageId)
    get().previewErrors.delete(imageId)
  },

  setSelectedImage: async (imageId) => {
    const image = get().images.find(img => img.id === imageId)
    if (!image) return

    set({ selectedImage: image })
    get().previewErrors.delete(imageId)

    // Generate preview if not cached
    if (!get().previewCache.has(imageId) && !get().loadingPreviews.has(imageId)) {
      get().loadingPreviews.add(imageId)
      set(state => ({ ...state }))

      try {
        const preview = await ipcRenderer.invoke('generate-preview', image.path)
        get().previewCache.set(imageId, `data:image/jpeg;base64,${preview}`)
      } catch (error) {
        console.error(`Error generating preview for ${image.path}:`, error)
        get().previewErrors.add(imageId)
      } finally {
        get().loadingPreviews.delete(imageId)
        set(state => ({ ...state }))
      }
    }
  },

  getThumbnail: (imageId) => {
    return get().thumbnailCache.get(imageId)
  },

  getPreview: (imageId) => {
    return get().previewCache.get(imageId)
  },

  isThumbnailLoading: (imageId) => {
    return get().loadingThumbnails.has(imageId)
  },

  isPreviewLoading: (imageId) => {
    return get().loadingPreviews.has(imageId)
  },

  hasPreviewError: (imageId) => {
    return get().previewErrors.has(imageId)
  },

  clearImages: () => {
    set({
      images: [],
      selectedImage: null,
    })
    get().thumbnailCache.clear()
    get().previewCache.clear()
  },

  // Function to handle file selection
  handleFileSelect: async () => {
    const filePaths = await ipcRenderer.invoke('select-files')
    if (filePaths) {
      get().addImages(filePaths)
    }
  },

  // Function to handle directory selection
  handleDirectorySelect: async () => {
    const dirPath = await ipcRenderer.invoke('select-directory')
    if (!dirPath) return

    const files = fs.readdirSync(dirPath)
    const imagePaths = files
      .filter(file => /\.(jpg|jpeg|png|gif|bmp)$/i.test(file))
      .map(file => path.join(dirPath, file))

    if (imagePaths.length > 0) {
      get().addImages(imagePaths)
    }
  },
}))

export default useImageStore;