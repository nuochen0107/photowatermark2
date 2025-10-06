import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { Button, Empty, Spin } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, UndoOutlined, ReloadOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';

const PreviewCanvas = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [backgroundImage, setBackgroundImage] = useState(null);
  
  const { 
    selectedImage, 
    getPreview, 
    isPreviewLoading, 
    hasPreviewError,
    setSelectedImage 
  } = useImageStore();

  // 初始化Fabric.js Canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        selection: false,
        hoverCursor: 'default',
        moveCursor: 'default',
        defaultCursor: 'default'
      });

      // 禁用所有交互
      fabricCanvasRef.current.selection = false;
      fabricCanvasRef.current.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // 当选中图片变化时加载背景图片
  useEffect(() => {
    if (!fabricCanvasRef.current || !selectedImage) {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
        setBackgroundImage(null);
      }
      return;
    }

    const preview = getPreview(selectedImage.id);
    if (preview && !hasPreviewError(selectedImage.id)) {
      loadBackgroundImage(preview);
    }
  }, [selectedImage, getPreview, hasPreviewError]);

  // 加载背景图片到Canvas
  const loadBackgroundImage = (imageSrc) => {
    if (!fabricCanvasRef.current) return;

    fabric.Image.fromURL(imageSrc, (img) => {
      if (!fabricCanvasRef.current) return;

      // 清除现有内容
      fabricCanvasRef.current.clear();

      // 计算适合Canvas的尺寸
      const canvasWidth = fabricCanvasRef.current.width;
      const canvasHeight = fabricCanvasRef.current.height;
      const imgWidth = img.width;
      const imgHeight = img.height;

      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (canvasWidth - imgWidth * scale) / 2,
        top: (canvasHeight - imgHeight * scale) / 2,
        selectable: false,
        evented: false
      });

      // 设置为背景图片
      fabricCanvasRef.current.setBackgroundImage(img, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
      setBackgroundImage(img);
    }, {
      crossOrigin: 'anonymous'
    });
  };

  // 缩放功能
  const handleZoomIn = () => {
    if (!fabricCanvasRef.current || !backgroundImage) return;
    const newZoom = Math.min(zoomLevel + 10, 200);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current || !backgroundImage) return;
    const newZoom = Math.max(zoomLevel - 10, 50);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  const applyZoom = (zoom) => {
    if (!fabricCanvasRef.current || !backgroundImage) return;
    
    const zoomFactor = zoom / 100;
    fabricCanvasRef.current.setZoom(zoomFactor);
    fabricCanvasRef.current.renderAll();
  };

  // 重置视图
  const resetView = () => {
    if (!fabricCanvasRef.current) return;
    
    setZoomLevel(100);
    fabricCanvasRef.current.setZoom(1);
    fabricCanvasRef.current.absolutePan({ x: 0, y: 0 });
    fabricCanvasRef.current.renderAll();
  };

  // 重试加载
  const handleRetry = async () => {
    if (!selectedImage) return;
    try {
      await setSelectedImage(selectedImage.id);
    } catch (err) {
      console.error('重试加载预览图失败:', err);
    }
  };

  // 添加拖拽功能
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleMouseDown = (opt) => {
      const evt = opt.e;
      isDragging = true;
      canvas.selection = false;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
      canvas.setCursor('grabbing');
    };

    const handleMouseMove = (opt) => {
      if (isDragging) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      canvas.selection = true;
      canvas.setCursor('default');
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, []);

  if (!selectedImage) {
    return (
      <div className="preview-panel">
        <Empty description="请选择要预览的图片" />
      </div>
    );
  }

  const preview = getPreview(selectedImage.id);
  const loading = isPreviewLoading(selectedImage.id);
  const error = hasPreviewError(selectedImage.id);

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <Button
          className="zoom-button"
          onClick={handleZoomOut}
          disabled={!preview || error || zoomLevel <= 50}
          icon={<ZoomOutOutlined />}
        />
        <span className="zoom-level">{zoomLevel}%</span>
        <Button
          className="zoom-button"
          onClick={handleZoomIn}
          disabled={!preview || error || zoomLevel >= 200}
          icon={<ZoomInOutlined />}
        />
        {preview && !error && (
          <Button
            className="zoom-button"
            onClick={resetView}
            disabled={zoomLevel === 100}
            icon={<UndoOutlined />}
          >
            重置
          </Button>
        )}
      </div>
      
      <div className="preview-container">
        {loading ? (
          <div className="preview-loading">
            <Spin size="large" />
            <span>生成预览图...</span>
          </div>
        ) : error ? (
          <div className="preview-error">
            <div>预览图生成失败</div>
            <Button
              className="zoom-button"
              icon={<ReloadOutlined />}
              onClick={handleRetry}
            >
              重试
            </Button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              border: '1px solid #e8e8e8',
              backgroundColor: 'transparent',
              backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewCanvas;