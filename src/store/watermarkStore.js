import { create } from 'zustand';

const useWatermarkStore = create((set, get) => ({
  // 水印类型：'text' 或 'image'
  watermarkType: 'text',
  
  // 文本水印设置
  textWatermark: {
    content: '水印文本',
    opacity: 50, // 0-100
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#000000',
    position: { x: 50, y: 50 }, // 百分比位置
    rotation: 0, // 旋转角度
  },
  
  // 图片水印设置
  imageWatermark: {
    imageUrl: null, // Base64 或 URL
    opacity: 50, // 0-100
    scale: 100, // 百分比缩放
    size: { width: 200, height: 200 }, // 像素尺寸
    position: { x: 50, y: 50 }, // 百分比位置
    rotation: 0, // 旋转角度
    preserveAspectRatio: true, // 保持宽高比
  },
  
  // 设置水印类型
  setWatermarkType: (type) => {
    if (type !== 'text' && type !== 'image') {
      console.error('Invalid watermark type');
      return;
    }
    set({ watermarkType: type });
  },
  
  // 更新文本水印设置
  updateTextWatermark: (updates) => {
    set((state) => ({
      textWatermark: {
        ...state.textWatermark,
        ...updates,
      }
    }));
  },
  
  // 更新图片水印设置
  updateImageWatermark: (updates) => {
    set((state) => ({
      imageWatermark: {
        ...state.imageWatermark,
        ...updates,
      }
    }));
  },
  
  // 设置图片水印
  setWatermarkImage: (imageUrl) => {
    set((state) => ({
      watermarkType: 'image',
      imageWatermark: {
        ...state.imageWatermark,
        imageUrl,
      }
    }));
  },
  
  // 重置水印设置
  resetWatermark: () => {
    set({
      watermarkType: 'text',
      textWatermark: {
        content: '水印文本',
        opacity: 50,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        position: { x: 50, y: 50 },
        rotation: 0,
      },
      imageWatermark: {
        imageUrl: null,
        opacity: 50,
        scale: 100,
        size: { width: 200, height: 200 },
        position: { x: 50, y: 50 },
        rotation: 0,
        preserveAspectRatio: true,
      }
    });
  },
}));

export default useWatermarkStore;