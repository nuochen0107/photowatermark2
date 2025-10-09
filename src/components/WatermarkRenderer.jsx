import React, { useEffect, useRef } from 'react';
import useWatermarkStore from '../store/watermarkStore';

const WatermarkRenderer = ({ zoomLevel, position, containerRef, imageRef }) => {
  const canvasRef = useRef(null);
  const {
    watermarkType,
    textWatermark,
    imageWatermark
  } = useWatermarkStore();

  useEffect(() => {
    const renderWatermark = () => {
      if (!imageRef.current || !containerRef.current || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const container = containerRef.current;
      const image = imageRef.current;
      
      // 设置画布大小与容器相同
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 获取图片在容器中的实际位置和大小
      const imgRect = image.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // 计算图片相对于容器的位置
      const relX = imgRect.left - containerRect.left;
      const relY = imgRect.top - containerRect.top;
      
      // 使用图片在页面中的实际显示尺寸（避免依赖 naturalWidth/zoom 造成偏差）
      const scaledWidth = imgRect.width;
      const scaledHeight = imgRect.height;
      
      // 根据水印类型渲染
      // 在template模式下，根据当前的水印设置来决定渲染哪种类型
      if ((watermarkType === 'text' || watermarkType === 'template') && textWatermark.content) {
        renderTextWatermark(ctx, relX, relY, scaledWidth, scaledHeight);
      } else if ((watermarkType === 'image' || watermarkType === 'template') && imageWatermark.path) {
        renderImageWatermark(ctx, relX, relY, scaledWidth, scaledHeight);
      }
    };
    
    const renderTextWatermark = (ctx, x, y, width, height) => {
      const { content, opacity, fontSize, fontFamily, color, position, rotation } = textWatermark;
      
      // 设置透明度
      ctx.globalAlpha = opacity / 100;
      
      // 设置字体
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      
      // 计算水印位置
      const posX = x + (width * position.x / 100);
      const posY = y + (height * position.y / 100);
      
      // 保存当前状态
      ctx.save();
      
      // 移动到水印位置
      ctx.translate(posX, posY);
      
      // 应用旋转
      ctx.rotate(rotation * Math.PI / 180);
      
      // 绘制文本
      ctx.fillText(content, 0, 0);
      
      // 恢复状态
      ctx.restore();
      
      // 重置透明度
      ctx.globalAlpha = 1.0;
    };
    
    const renderImageWatermark = (ctx, x, y, width, height) => {
      const { path, opacity, scale, position, rotation, size, preserveAspectRatio } = imageWatermark;
      
      // 创建图片对象
      const img = new Image();
      img.src = path;
      
      img.onload = () => {
        // 设置透明度
        ctx.globalAlpha = opacity / 100;
        
        // 计算水印尺寸：优先使用自定义尺寸；在保持比例时根据原始比例推导另一维
        let watermarkWidth;
        let watermarkHeight;
        const naturalW = img.width;
        const naturalH = img.height;
        const ratio = naturalW / naturalH || 1;

        if (size && (size.width || size.height)) {
          const targetW = Number(size.width) || 0;
          const targetH = Number(size.height) || 0;
          if (preserveAspectRatio) {
            if (targetW > 0) {
              watermarkWidth = targetW;
              watermarkHeight = Math.max(1, Math.round(targetW / ratio));
            } else if (targetH > 0) {
              watermarkHeight = targetH;
              watermarkWidth = Math.max(1, Math.round(targetH * ratio));
            } else {
              watermarkWidth = naturalW * (scale / 100);
              watermarkHeight = naturalH * (scale / 100);
            }
          } else {
            watermarkWidth = targetW > 0 ? targetW : naturalW * (scale / 100);
            watermarkHeight = targetH > 0 ? targetH : naturalH * (scale / 100);
          }
        } else {
          watermarkWidth = naturalW * (scale / 100);
          watermarkHeight = naturalH * (scale / 100);
        }
        
        // 计算水印位置
        const posX = x + (width * position.x / 100);
        const posY = y + (height * position.y / 100);
        
        // 保存当前状态
        ctx.save();
        
        // 移动到水印位置
        ctx.translate(posX, posY);
        
        // 应用旋转
        ctx.rotate(rotation * Math.PI / 180);
        
        // 绘制图片水印
        ctx.drawImage(img, -watermarkWidth / 2, -watermarkHeight / 2, watermarkWidth, watermarkHeight);
        
        // 恢复状态
        ctx.restore();
        
        // 重置透明度
        ctx.globalAlpha = 1.0;
      };
    };
    
    // 初始渲染
    renderWatermark();
    
    // 监听窗口大小变化
    window.addEventListener('resize', renderWatermark);
    
    return () => {
      window.removeEventListener('resize', renderWatermark);
    };
  }, [watermarkType, textWatermark, imageWatermark, zoomLevel, position]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // 确保不会干扰鼠标事件
      }}
    />
  );
};

export default WatermarkRenderer;