import React, { useCallback } from 'react';
import { Upload, Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';
// const { ipcRenderer } = window.require('electron');
const ipcRenderer = window.electron?.ipcRenderer; // Modified to use preload script

if (!ipcRenderer) {
  console.warn("ipcRenderer not available — running in browser dev mode");
}

const { Dragger } = Upload;

const ImportPanel = () => {
  const addImages = useImageStore((state) => state.addImages);

  const handleFileDrop = useCallback(async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imagePaths = files
      .filter(file => /\.(jpg|jpeg|png|bmp|tiff)$/i.test(file.path))
      .map(file => file.path);

    if (imagePaths.length > 0) {
      addImages(imagePaths);
      message.success(`成功导入 ${imagePaths.length} 张图片`);
    } else {
      message.error('请选择有效的图片文件');
    }
  }, [addImages]);

  const handleSelectFiles = async () => {
    if (!ipcRenderer) {
      // 在浏览器环境中使用HTML5的文件选择API
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.jpg,.jpeg,.png,.bmp,.tiff';
      
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          // 在浏览器环境中，我们只能获取File对象，而不是文件路径
          // 因此需要创建临时URL或直接处理File对象
          const fileObjects = files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            // 创建临时URL以便预览
            url: URL.createObjectURL(file),
            // 保存原始File对象以便后续处理
            file: file
          }));
          
          addImages(fileObjects);
          message.success(`成功导入 ${files.length} 张图片`);
        }
      };
      
      input.click();
      return;
    }
    
    try {
      const filePaths = await ipcRenderer.invoke('select-files');
      if (filePaths && filePaths.length > 0) {
        addImages(filePaths);
        message.success(`成功导入 ${filePaths.length} 张图片`);
      }
    } catch (error) {
      message.error('选择文件时出错');
      console.error(error);
    }
  };

  const handleSelectFolder = async () => {
    if (!ipcRenderer) {
      // 在浏览器环境中，无法直接选择文件夹，但可以使用多文件选择代替
      message.info('浏览器环境下无法选择文件夹，请使用"选择文件"功能选择多个图片');
      handleSelectFiles();
      return;
    }
    
    try {
      const imagePaths = await ipcRenderer.invoke('select-directory');
      if (imagePaths && imagePaths.length > 0) {
        addImages(imagePaths);
        message.success(`成功导入 ${imagePaths.length} 张图片`);
      } else if (imagePaths && imagePaths.length === 0) {
        message.info('所选文件夹中没有找到支持的图片文件');
      } else {
        message.info('未选择文件夹');
      }
    } catch (error) {
      message.error('选择文件夹时出错');
      console.error(error);
    }
  };

  return (
    <div className="import-panel">
      <Dragger
        showUploadList={false}
        accept=".jpg,.jpeg,.png,.bmp,.tiff"
        beforeUpload={() => false}
        onDrop={handleFileDrop}
        style={{ padding: '20px' }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽图片到此区域</p>
        <p className="ant-upload-hint">
          支持单张或多张图片上传
        </p>
      </Dragger>
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <Button type="primary" onClick={handleSelectFiles}>
          选择文件
        </Button>
        <Button onClick={handleSelectFolder}>
          选择文件夹
        </Button>
      </div>
    </div>
  );
};

export default ImportPanel;