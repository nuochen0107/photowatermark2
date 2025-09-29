import React, { useState, useRef, useEffect } from 'react';
import { Button, Empty, Spin } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, UndoOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';

const PreviewPanel = () => {
  const { 
    selectedImage, 
    getPreview, 
    isPreviewLoading, 
    hasPreviewError,
    setSelectedImage 
  } = useImageStore();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    setZoomLevel(100);
    setPosition({ x: 0, y: 0 });
  }, [selectedImage]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleMouseDown = (e) => {
    if (!selectedImage || hasPreviewError(selectedImage.id)) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRetry = async () => {
    if (!selectedImage) return;
    try {
      await setSelectedImage(selectedImage.id);
    } catch (err) {
      console.error('重试加载预览图失败:', err);
    }
  };

  const resetView = () => {
    setZoomLevel(100);
    setPosition({ x: 0, y: 0 });
  };

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
            disabled={zoomLevel === 100 && position.x === 0 && position.y === 0}
            icon={<UndoOutlined />}
          >
            重置
          </Button>
        )}
      </div>
      <div
        ref={containerRef}
        className="preview-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
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
        ) : preview ? (
          <img
            ref={imageRef}
            src={preview}
            alt="Preview"
            style={{
              transform: `scale(${zoomLevel / 100}) translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            draggable={false}
          />
        ) : null}
      </div>
    </div>
  );
};

export default PreviewPanel;