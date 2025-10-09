import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 默认水印设置
const defaultWatermarkSettings = {
  watermarkType: 'text',
  textWatermark: {
    content: '水印文本',
    opacity: 50, // 0-100
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#000000',
    position: { x: 50, y: 50 }, // 百分比位置
    rotation: 0, // 旋转角度
  },
  imageWatermark: {
    path: null, // 图片路径
    opacity: 50, // 0-100
    scale: 100, // 百分比缩放
    size: { width: 200, height: 200 }, // 像素尺寸
    position: { x: 50, y: 50 }, // 百分比位置
    rotation: 0, // 旋转角度
    preserveAspectRatio: true, // 保持宽高比
  }
};

const useWatermarkStore = create(
  persist(
    (set, get) => ({
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
        path: null, // 图片路径
        opacity: 50, // 0-100
        scale: 100, // 百分比缩放
        size: { width: 200, height: 200 }, // 像素尺寸
        position: { x: 50, y: 50 }, // 百分比位置
        rotation: 0, // 旋转角度
        preserveAspectRatio: true, // 保持宽高比
      },
      
      // 水印模板列表
      templates: [],
      
      // 设置水印类型
      setWatermarkType: (type) => {
        if (type !== 'text' && type !== 'image' && type !== 'template') {
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
      setWatermarkImage: (path) => {
        set((state) => ({
          watermarkType: 'image',
          imageWatermark: {
            ...state.imageWatermark,
            path,
          }
        }));
      },
      
      // 保存当前水印设置为模板
      saveTemplate: (name) => {
        const { watermarkType, textWatermark, imageWatermark } = get();
        const newTemplate = {
          id: Date.now().toString(),
          name,
          watermarkType,
          textWatermark: { ...textWatermark },
          imageWatermark: { ...imageWatermark },
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          templates: [...state.templates, newTemplate]
        }));
        
        return newTemplate;
      },
      
      // 加载模板
      loadTemplate: (templateId) => {
        const { templates } = get();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
          console.error('Template not found');
          return false;
        }
        
        set({
          watermarkType: template.watermarkType,
          textWatermark: { ...template.textWatermark },
          imageWatermark: { ...template.imageWatermark }
        });
        
        return true;
      },
      
      // 删除模板
      deleteTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter(t => t.id !== templateId)
        }));
      },
      
      // 重置水印设置
      resetWatermark: () => {
        set({
          watermarkType: defaultWatermarkSettings.watermarkType,
          textWatermark: { ...defaultWatermarkSettings.textWatermark },
          imageWatermark: { ...defaultWatermarkSettings.imageWatermark }
        });
      },
    }),
    {
      name: 'watermark-storage', // 存储的名称
      getStorage: () => localStorage, // 使用localStorage存储
    }
  )
);

export default useWatermarkStore;