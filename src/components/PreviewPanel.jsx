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

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      const imagesToSave = [
        {
          originalPath: selectedImage.path,
          data: getPreview(selectedImage.id).split(',')[1], // Assuming base64 data
        },
      ];
      const exportOptions = {
        namingRule: values.namingRule,
        prefix: values.prefix,
        suffix: values.suffix,
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
    } catch (errorInfo) {
      console.error('导出失败:', errorInfo);
      message.error('导出失败，请检查设置。');
    } finally {
      setIsExportModalVisible(false);
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
          导出
        </Button>
      </div>
      
      {selectedImage && !error && preview && (
        <div className="watermark-settings">
          <Divider orientation="left">水印设置</Divider>
          <WatermarkPanel />
        </div>
      )}
      
      <Modal
        title="导出图片"
        open={isExportModalVisible}
        onOk={handleExport}
        onCancel={() => setIsExportModalVisible(false)}
        okText="导出"
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
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PreviewPanel;