import React from 'react';
import { Upload, Button, Slider, Typography, Space, InputNumber, Row, Col, Switch } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import useWatermarkStore from '../store/watermarkStore';

const { Title } = Typography;

const ImageWatermarkPanel = () => {
  const { imageWatermark, updateImageWatermark, setWatermarkImage } = useWatermarkStore();

  const handleImageUpload = (info) => {
    const fileObj = info?.file?.originFileObj || info?.file;
    if (!fileObj) {
      console.warn('未获取到文件对象，无法加载图片水印');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setWatermarkImage(e.target.result);
    };
    reader.onerror = (err) => {
      console.error('读取图片失败:', err);
    };
    reader.readAsDataURL(fileObj);
  };

  const handleOpacityChange = (value) => {
    updateImageWatermark({ opacity: value });
  };

  const handleScaleChange = (value) => {
    updateImageWatermark({ scale: value });
  };

  const handleSizeChange = (dimension, value) => {
    updateImageWatermark({
      size: {
        ...imageWatermark.size,
        [dimension]: value
      }
    });
  };
  
  const handlePreserveAspectRatioChange = (checked) => {
    updateImageWatermark({ preserveAspectRatio: checked });
  };

  const handlePositionXChange = (value) => {
    updateImageWatermark({
      position: {
        ...imageWatermark.position,
        x: value
      }
    });
  };

  const handlePositionYChange = (value) => {
    updateImageWatermark({
      position: {
        ...imageWatermark.position,
        y: value
      }
    });
  };

  const handleRotationChange = (value) => {
    updateImageWatermark({ rotation: value });
  };

  return (
    <div className="image-watermark-panel">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Title level={5}>上传水印图片</Title>
           <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={() => false}
              customRequest={({ file, onSuccess }) => {
                setTimeout(() => {
                  onSuccess("ok", null);
                }, 0);
              }}
              onChange={handleImageUpload}
            >
            <Button icon={<UploadOutlined />}>选择图片</Button>
          </Upload>
          {imageWatermark.imageUrl && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imageWatermark.imageUrl}
                alt="水印图片预览"
                style={{ maxWidth: '100%', maxHeight: '100px' }}
              />
            </div>
          )}
        </div>

        <div>
          <Title level={5}>不透明度</Title>
          <Slider
            min={0}
            max={100}
            value={imageWatermark.opacity}
            onChange={handleOpacityChange}
          />
        </div>

        <div>
          <Title level={5}>缩放比例</Title>
          <Row>
            <Col span={16}>
              <Slider
                min={10}
                max={200}
                value={imageWatermark.scale}
                onChange={handleScaleChange}
              />
            </Col>
            <Col span={7} offset={1}>
              <InputNumber
                min={10}
                max={200}
                value={imageWatermark.scale}
                onChange={handleScaleChange}
                addonAfter="%"
              />
            </Col>
          </Row>
        </div>

        <div>
          <Row align="middle">
            <Col span={18}>
              <Title level={5}>自定义尺寸</Title>
            </Col>
            <Col span={6}>
              <Switch
                checked={imageWatermark.preserveAspectRatio}
                onChange={handlePreserveAspectRatioChange}
              />
              <span style={{ marginLeft: 8 }}>保持比例</span>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <div>宽度 (px)</div>
              <InputNumber
                min={10}
                max={1000}
                value={imageWatermark.size.width}
                onChange={(value) => handleSizeChange('width', value)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={12}>
              <div>高度 (px)</div>
              <InputNumber
                min={10}
                max={1000}
                value={imageWatermark.size.height}
                onChange={(value) => handleSizeChange('height', value)}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </div>
         
        <div>
          <Title level={5}>位置</Title>
          <Row gutter={16}>
            <Col span={12}>
              <div>X 位置 (%)</div>
              <Slider
                min={0}
                max={100}
                value={imageWatermark.position.x}
                onChange={handlePositionXChange}
              />
            </Col>
            <Col span={12}>
              <div>Y 位置 (%)</div>
              <Slider
                min={0}
                max={100}
                value={imageWatermark.position.y}
                onChange={handlePositionYChange}
              />
            </Col>
          </Row>
        </div>
         
        <div>
          <Title level={5}>旋转角度</Title>
          <Row>
            <Col span={16}>
              <Slider
                min={-180}
                max={180}
                value={imageWatermark.rotation}
                onChange={handleRotationChange}
              />
            </Col>
            <Col span={7} offset={1}>
              <InputNumber
                min={-180}
                max={180}
                value={imageWatermark.rotation}
                onChange={handleRotationChange}
              />
            </Col>
          </Row>
        </div>
      </Space>
    </div>
  );

};
export default ImageWatermarkPanel;