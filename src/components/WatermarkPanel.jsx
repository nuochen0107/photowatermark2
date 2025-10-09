import React from 'react';
import { Tabs } from 'antd';
import TextWatermarkPanel from './TextWatermarkPanel';
import ImageWatermarkPanel from './ImageWatermarkPanel';
import TemplatePanel from './TemplatePanel';
import useWatermarkStore from '../store/watermarkStore';

const WatermarkPanel = () => {
  const { watermarkType, setWatermarkType } = useWatermarkStore();

  const handleTabChange = (key) => {
    setWatermarkType(key);
  };

  return (
    <div className="watermark-panel">
      <Tabs
        activeKey={watermarkType}
        onChange={handleTabChange}
        items={[
          {
            key: 'text',
            label: '文本水印',
            children: <TextWatermarkPanel />,
          },
          {
            key: 'image',
            label: '图片水印',
            children: <ImageWatermarkPanel />,
          },
          {
            key: 'template',
            label: '模板管理',
            children: <TemplatePanel />,
          },
        ]}
      />
    </div>
  );
};

export default WatermarkPanel;