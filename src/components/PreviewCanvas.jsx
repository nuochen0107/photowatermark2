import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Button, Empty, Spin } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, UndoOutlined, ReloadOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';
import { shallow } from 'zustand/shallow';

const PreviewCanvas = () => {
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [canvasKey, setCanvasKey] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const { selectedImage, preview, loading, error } = useImageStore(state => {
    if (!state) {
      return { selectedImage: null, preview: null, loading: false, error: false };
    }
    const selectedImage = state.selectedImage;
    if (!selectedImage) {
      return { selectedImage: null, preview: null, loading: false, error: false };
    }
    const imageId = selectedImage.id;
    return {
      selectedImage,
      preview: state.previewCache.get(imageId),
      loading: state.loadingPreviews.has(imageId),
      error: state.previewErrors.has(imageId),
    };
  }, shallow);

  // 强制重新初始化Canvas
  const forceReinitialize = useCallback(() => {
    setCanvasKey(prev => prev + 1);
    setIsInitialized(false);
    setZoomLevel(100);
  }, []);

  // 清理Canvas
  const cleanupCanvas = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }
    if (canvasContainerRef.current) {
      canvasContainerRef.current.innerHTML = '';
    }
    setIsInitialized(false);
  }, []);

  // 初始化Canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasContainerRef.current) return;

    try {
      cleanupCanvas();

      const canvasElement = document.createElement('canvas');
      canvasElement.id = `preview-canvas-${canvasKey}`;
      canvasElement.width = 800;
      canvasElement.height = 600;
      
      canvasContainerRef.current.innerHTML = '';
      canvasContainerRef.current.appendChild(canvasElement);

      const fabricCanvas = new fabric.Canvas(canvasElement.id, {
        width: 800,
        height: 600,
        backgroundColor: 'transparent'
      });

      fabricCanvasRef.current = fabricCanvas;
      setIsInitialized(true);

    } catch (error) {
      console.error('Canvas initialization failed:', error);
      setIsInitialized(false);
    }
  }, [canvasKey, cleanupCanvas]);

  // 加载图片到Canvas
  const loadImageToCanvas = useCallback((dataUrl) => {
        console.log('loadImageToCanvas called with dataUrl:', dataUrl ? dataUrl.substring(0, 100) + '...' : 'null');
        if (!fabricCanvasRef.current || !dataUrl) {
            console.log('loadImageToCanvas: fabricCanvasRef.current is null or dataUrl is null');
            return;
        }

        const canvas = fabricCanvasRef.current;

        // Attempt to load with native Image object first to verify dataUrl validity
        const nativeImage = new Image();
        nativeImage.onload = () => {
            console.log('Native Image loaded successfully. DataURL is valid. Proceeding to create fabric.Image.');
            const fabricImage = new fabric.Image(nativeImage);
            canvas.clear();
            
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const imgAspectRatio = fabricImage.width / fabricImage.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;

            let scale;
            if (imgAspectRatio > canvasAspectRatio) {
                scale = canvasWidth / fabricImage.width;
            } else {
                scale = canvasHeight / fabricImage.height;
            }

            fabricImage.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
            });

            canvas.add(fabricImage);
            canvas.renderAll();
            console.log('Image added to canvas and rendered using native Image.');
        };
        nativeImage.onerror = (e) => {
            console.error('Native Image failed to load. DataURL might be invalid.', e);
        };
        nativeImage.src = dataUrl;
    }, []);

  // Canvas初始化效果
  useEffect(() => {
    if (canvasContainerRef.current && !isInitialized) {
      initializeCanvas();
    }
  }, [isInitialized, initializeCanvas]);

  // 图片加载效果
  useEffect(() => {
    if (!isInitialized) return;

    if (!selectedImage) {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.renderAll();
      }
      return;
    }

    if (!loading && !error && preview) {
      loadImageToCanvas(preview);
    }
  }, [selectedImage, isInitialized, loading, error, preview, loadImageToCanvas]);

  // 组件卸载清理
  useEffect(() => {
    return cleanupCanvas;
  }, [cleanupCanvas]);

  // 缩放功能
  const handleZoomIn = () => {
    if (zoomLevel < 200 && fabricCanvasRef.current) {
      const newZoom = Math.min(zoomLevel + 25, 200);
      setZoomLevel(newZoom);
      fabricCanvasRef.current.setZoom(newZoom / 100);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50 && fabricCanvasRef.current) {
      const newZoom = Math.max(zoomLevel - 25, 50);
      setZoomLevel(newZoom);
      fabricCanvasRef.current.setZoom(newZoom / 100);
      fabricCanvasRef.current.renderAll();
    }
  };

  const resetView = () => {
    if (fabricCanvasRef.current) {
      setZoomLevel(100);
      fabricCanvasRef.current.setZoom(1);
      fabricCanvasRef.current.viewportTransform = [1, 0, 0, 1, 0, 0];
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleRetry = () => {
    if (selectedImage) {
      // 重新生成预览
      const { setSelectedImage } = useImageStore.getState();
      setSelectedImage(selectedImage.path);
    }
  };

  return (
    <div className="preview-panel" key={canvasKey}>
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
          {loading && (
            <div className="preview-loading">
              <Spin size="large" />
              <span>生成预览图...</span>
            </div>
          )}
          
          {error && (
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
          )}

          {!selectedImage && !loading && !error && (
            <div className="preview-empty" style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}>
              <Empty description="请选择要预览的图片" />
            </div>
          )}
          
          <div 
            ref={canvasContainerRef}
            style={{
              display: 'block',
              width: '800px',
              height: '600px',
              border: '1px solid #e8e8e8',
              backgroundColor: 'white',
              backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
      </div>
    </div>
  );
};

export default PreviewCanvas;