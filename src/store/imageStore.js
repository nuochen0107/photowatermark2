import { create } from 'zustand'
// 使用 preload 脚本中暴露的 ipcRenderer
const ipcRenderer = window.electron?.ipcRenderer;

if (!ipcRenderer) {
  console.warn("ipcRenderer not available in imageStore — running in browser dev mode");
}
// import fs from 'fs'
// import path from 'path'

const useImageStore = create((set, get) => ({
  images: [],
  selectedImage: null,
  thumbnailCache: new Map(),
  previewCache: new Map(),
  loadingThumbnails: new Set(),
  loadingPreviews: new Set(),
  previewErrors: new Set(),

  addImages: async (filePaths) => {
    if (!ipcRenderer) {
      console.error('ipcRenderer not available');
      return;
    }

    console.log('Adding images:', filePaths); // 调试日志

    const newImages = filePaths.map(filePath => ({
      id: filePath,
      path: filePath,
      name: filePath.split(/[/\\]/).pop(), // 使用简单的路径解析替代path.basename
    }))

    console.log('New images created:', newImages); // 调试日志

    set(state => ({
      images: [...state.images, ...newImages],
    }))

    console.log('Images added to store, total:', get().images.length); // 调试日志

    // Generate thumbnails for new images
    newImages.forEach(async (image) => {
      if (get().loadingThumbnails.has(image.id)) return
      get().loadingThumbnails.add(image.id)
      set(state => ({ ...state }))

      console.log('Generating thumbnail for:', image.path); // 调试日志

      try {
        const thumbnail = await ipcRenderer.invoke('generate-thumbnail', image.path)
        console.log('Thumbnail generated successfully for:', image.path); // 调试日志
        get().thumbnailCache.set(image.id, `data:image/jpeg;base64,${thumbnail}`)
        set(state => ({ ...state })) // 强制更新状态
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

    console.log('Setting selected image:', imageId); // 调试日志

    set({ selectedImage: image })
    get().previewErrors.delete(imageId)

    // Generate preview if not cached
    if (!get().previewCache.has(imageId) && !get().loadingPreviews.has(imageId)) {
      if (!ipcRenderer) {
        console.error('ipcRenderer not available for preview generation');
        return;
      }

      console.log('Starting preview generation for:', imageId); // 调试日志
      get().loadingPreviews.add(imageId)
      set(state => ({ ...state }))

      try {
        const preview = await ipcRenderer.invoke('generate-preview', image.path)
        const metadata = await ipcRenderer.invoke('get-image-metadata', image.path)
        console.log('Preview generated, metadata:', metadata); // 调试日志
        
        const hasAlpha = metadata.channels === 4 || metadata.hasAlpha
        const mimeType = hasAlpha ? 'image/png' : 'image/jpeg'
        const previewDataUrl = `data:${mimeType};base64,${preview}`
        
        console.log('Preview data URL created:', previewDataUrl.substring(0, 100) + '...'); // 调试日志
        get().previewCache.set(imageId, previewDataUrl)
        set(state => ({ ...state })) // 强制更新状态
      } catch (error) {
        console.error(`Error generating preview for ${image.path}:`, error)
        get().previewErrors.add(imageId)
      } finally {
        get().loadingPreviews.delete(imageId)
        set(state => ({ ...state }))
      }
    } else if (get().previewCache.has(imageId)) {
      console.log('Using cached preview for:', imageId); // 调试日志
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