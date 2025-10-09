import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Empty, Spin, Modal, Radio, Input, Form, message, Divider } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, UndoOutlined, DownloadOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';
import useWatermarkStore from '../store/watermarkStore';
import WatermarkPanel from './WatermarkPanel';
import WatermarkRenderer from './WatermarkRenderer';
// import { ipcRenderer } from 'electron'; // Original import
const ipcRenderer = window.electron?.ipcRenderer; // Modified to use preload script

if (!ipcRenderer) {
  console.warn("ipcRenderer not available — running in browser dev mode");
}

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
  const [isExportModalVisible, setIsExportModalVisible] = useState(false); // New state for export modal
  const [namingRule, setNamingRule] = useState('original');
  const [prefix, setPrefix] = useState('wm_');
  const [suffix, setSuffix] = useState('_watermarked');
  const [form] = Form.useForm();

  console.log("PreviewPanel component rendering..."); // New log to check if component renders

  useEffect(() => {
    console.log("✅ 测试日志 - 这是最新构建的 React 代码");
    console.log("useEffect - 导出按钮初始化完毕");
    setZoomLevel(100);
    setPosition({ x: 0, y: 0 });
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    console.log('useEffect - selectedImage:', selectedImage);
  }, [selectedImage, getPreview, hasPreviewError]); // Keep this useEffect for state changes

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

  // 浏览器模式下的下载功能
  const handleBrowserDownload = async () => {
    try {
      const values = await form.validateFields();
      
      // 创建一个临时canvas来合成带水印的图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 创建图片对象
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          // 设置canvas尺寸为原图尺寸
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          // 绘制原图
          ctx.drawImage(img, 0, 0);
          
          // 绘制水印
          await renderWatermarkOnCanvas(ctx, canvas.width, canvas.height);
          
          // 生成文件名
          const originalName = selectedImage.name || 'image';
          const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
          const ext = originalName.match(/\.[^/.]+$/) ? originalName.match(/\.[^/.]+$/)[0] : '.png';
          
          let fileName;
          switch (values.namingRule) {
            case 'prefix':
              fileName = `${values.prefix || 'wm_'}${originalName}`;
              break;
            case 'suffix':
              fileName = `${nameWithoutExt}${values.suffix || '_watermarked'}${ext}`;
              break;
            default:
              fileName = originalName;
          }
          
          // 转换为blob并下载
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            message.success('图片下载成功！');
            setIsExportModalVisible(false);
          }, 'image/png', 1.0);
          
        } catch (error) {
          console.error('下载过程中出错:', error);
          message.error('下载失败，请重试。');
          setIsExportModalVisible(false);
        }
      };
      
      img.onerror = () => {
        message.error('加载图片失败，无法下载。');
        setIsExportModalVisible(false);
      };
      
      // 加载图片
      img.src = preview;
      
    } catch (errorInfo) {
      console.error('下载失败:', errorInfo);
      message.error('下载失败，请检查设置。');
      setIsExportModalVisible(false);
    }
  };

  const handleExport = async () => {
    if (!ipcRenderer) {
      // 浏览器模式下使用下载功能
      await handleBrowserDownload();
      return;
    }

    try {
      const values = await form.validateFields();
      
      // 创建一个临时canvas来合成带水印的图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 创建图片对象
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          // 设置canvas尺寸为原图尺寸
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          // 绘制原图
          ctx.drawImage(img, 0, 0);
          
          // 绘制水印
          await renderWatermarkOnCanvas(ctx, canvas.width, canvas.height);
          
          // 转换为base64
          const dataURL = canvas.toDataURL('image/png', 1.0);
          const base64Data = dataURL.split(',')[1];
          
          const imagesToSave = [
            {
              originalPath: selectedImage.path,
              data: base64Data,
            },
          ];
          
          const exportOptions = {
            namingRule: values.namingRule,
            prefix: values.prefix || 'wm_',
            suffix: values.suffix || '_watermarked',
          };

          const result = await ipcRenderer.invoke('save-images', imagesToSave, exportOptions);

          if (result.success) {
            message.success(result.message);
          } else {
            message.error(result.message);
            if (result.errorMessages && result.errorMessages.length > 0) {
              result.errorMessages.forEach(msg => message.warn(msg));
            }
          }
        } catch (error) {
          console.error('导出过程中出错:', error);
          message.error('导出失败，请重试。');
        } finally {
          setIsExportModalVisible(false);
        }
      };
      
      img.onerror = () => {
        message.error('加载图片失败，无法导出。');
        setIsExportModalVisible(false);
      };
      
      // 加载图片
      img.src = preview;
      
    } catch (errorInfo) {
      console.error('导出失败:', errorInfo);
      message.error('导出失败，请检查设置。');
      setIsExportModalVisible(false);
    }
  };

  // 在canvas上渲染水印的函数
  const renderWatermarkOnCanvas = async (ctx, canvasWidth, canvasHeight) => {
    const { watermarkType, textWatermark, imageWatermark } = useWatermarkStore.getState();
    
    if (watermarkType === 'text' && textWatermark.content) {
      // 渲染文本水印
      const { content, opacity, fontSize, fontFamily, color, position, rotation } = textWatermark;
      
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      
      const posX = canvasWidth * position.x / 100;
      const posY = canvasHeight * position.y / 100;
      
      ctx.translate(posX, posY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.fillText(content, 0, 0);
      ctx.restore();
      
    } else if (watermarkType === 'image' && imageWatermark.path) {
      // 渲染图片水印
      return new Promise((resolve) => {
        const watermarkImg = new Image();
        watermarkImg.crossOrigin = 'anonymous';
        
        watermarkImg.onload = () => {
          const { opacity, scale, position, rotation, size } = imageWatermark;
          
          ctx.save();
          ctx.globalAlpha = opacity / 100;
          
          const posX = canvasWidth * position.x / 100;
          const posY = canvasHeight * position.y / 100;
          
          ctx.translate(posX, posY);
          ctx.rotate(rotation * Math.PI / 180);
          
          const drawWidth = size.width * scale / 100;
          const drawHeight = size.height * scale / 100;
          
          ctx.drawImage(watermarkImg, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
          ctx.restore();
          resolve();
        };
        
        watermarkImg.onerror = () => {
          console.warn('水印图片加载失败');
          resolve();
        };
        
        watermarkImg.src = imageWatermark.path;
      });
    }
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

  console.log('selectedImage:', selectedImage);
  console.log('preview:', preview);
  console.log('error:', error);

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
        <Button // New Export Button
          className="export-button"
          onClick={() => setIsExportModalVisible(true)}
          disabled={!selectedImage || !preview || error}
          icon={<DownloadOutlined />}
        >
          {ipcRenderer ? '导出' : '下载'}
        </Button>
      </div>
      
      {selectedImage && !error && preview && (
        <div className="watermark-settings">
          <Divider orientation="left">水印设置</Divider>
          <WatermarkPanel />
        </div>
      )}
      
      <Modal
        title={ipcRenderer ? "导出图片" : "下载图片"}
        open={isExportModalVisible}
        onOk={handleExport}
        onCancel={() => setIsExportModalVisible(false)}
        okText={ipcRenderer ? "导出" : "下载"}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            namingRule: namingRule,
            prefix: prefix,
            suffix: suffix,
          }}
        >
          {!ipcRenderer && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f8ff', border: '1px solid #d1ecf1', borderRadius: 4 }}>
              <p style={{ margin: 0, color: '#0c5460' }}>
                💡 浏览器模式下，图片将直接下载到您的默认下载文件夹中。
              </p>
            </div>
          )}
          <Form.Item label="命名规则" name="namingRule">
            <Radio.Group onChange={(e) => setNamingRule(e.target.value)} value={namingRule}>
              <Radio value="original">保留原文件名</Radio>
              <Radio value="prefix">添加前缀</Radio>
              <Radio value="suffix">添加后缀</Radio>
            </Radio.Group>
          </Form.Item>
          {namingRule === 'prefix' && (
            <Form.Item
              label="前缀"
              name="prefix"
              rules={[{ required: true, message: '请输入前缀' }]}
            >
              <Input onChange={(e) => setPrefix(e.target.value)} value={prefix} />
            </Form.Item>
          )}
          {namingRule === 'suffix' && (
            <Form.Item
              label="后缀"
              name="suffix"
              rules={[{ required: true, message: '请输入后缀' }]}
            >
              <Input onChange={(e) => setSuffix(e.target.value)} value={suffix} />
            </Form.Item>
          )}
        </Form>
      </Modal>
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
          <div className="preview-image-container" style={{ position: 'relative' }}>
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
            <WatermarkRenderer 
              zoomLevel={zoomLevel} 
              position={position} 
              containerRef={containerRef}
              imageRef={imageRef}
              // 检查是否为浏览器环境中的图片
              isBrowserImage={selectedImage.isLocalFile && selectedImage.path.startsWith('blob:')}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PreviewPanel;