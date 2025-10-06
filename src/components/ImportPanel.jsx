import React, { useCallback } from 'react';
import { Upload, Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';
// const { ipcRenderer } = window.require('electron');
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

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
    try {
      const dirPath = await ipcRenderer.invoke('select-directory');
      if (dirPath) {
        // TODO: 读取文件夹中的图片
        message.info('文件夹导入功能开发中');
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