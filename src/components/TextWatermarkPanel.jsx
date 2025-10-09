import React from 'react';
import { Input, Slider, Typography, Space, Row, Col, InputNumber, Select, Button } from 'antd';
import useWatermarkStore from '../store/watermarkStore';

const { Title } = Typography;
const { Option } = Select;

const TextWatermarkPanel = () => {
  const { textWatermark, updateTextWatermark } = useWatermarkStore();

  const handleContentChange = (e) => {
    updateTextWatermark({ content: e.target.value });
  };

  const handleOpacityChange = (value) => {
    updateTextWatermark({ opacity: value });
  };

  const handleFontSizeChange = (value) => {
    updateTextWatermark({ fontSize: value });
  };

  const handleFontFamilyChange = (value) => {
    updateTextWatermark({ fontFamily: value });
  };

  const handleColorChange = (e) => {
    updateTextWatermark({ color: e.target.value });
  };

  const handlePositionXChange = (value) => {
    updateTextWatermark({ 
      position: { 
        ...textWatermark.position, 
        x: value 
      } 
    });
  };

  const handlePositionYChange = (value) => {
    updateTextWatermark({ 
      position: { 
        ...textWatermark.position, 
        y: value 
      } 
    });
  };

  const handleRotationChange = (value) => {
    updateTextWatermark({ rotation: value });
  };

  // 预设位置处理函数
  const handlePresetPosition = (x, y) => {
    updateTextWatermark({
      position: { x, y }
    });
  };

  return (
    <div className="text-watermark-panel">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Title level={5}>水印文本</Title>
          <Input
            placeholder="输入水印文本"
            value={textWatermark.content}
            onChange={handleContentChange}
          />
        </div>

        <div>
          <Title level={5}>不透明度</Title>
          <Slider
            min={0}
            max={100}
            value={textWatermark.opacity}
            onChange={handleOpacityChange}
          />
        </div>

        <div>
          <Title level={5}>字体大小</Title>
          <Row>
            <Col span={16}>
              <Slider
                min={12}
                max={72}
                value={textWatermark.fontSize}
                onChange={handleFontSizeChange}
              />
            </Col>
            <Col span={7} offset={1}>
              <InputNumber
                min={12}
                max={72}
                value={textWatermark.fontSize}
                onChange={handleFontSizeChange}
              />
            </Col>
          </Row>
        </div>

        <div>
          <Title level={5}>字体</Title>
          <Select
            style={{ width: '100%' }}
            value={textWatermark.fontFamily}
            onChange={handleFontFamilyChange}
          >
            <Option value="Arial">Arial</Option>
            <Option value="Times New Roman">Times New Roman</Option>
            <Option value="Courier New">Courier New</Option>
            <Option value="Georgia">Georgia</Option>
            <Option value="Verdana">Verdana</Option>
            <Option value="SimSun">宋体</Option>
            <Option value="SimHei">黑体</Option>
            <Option value="Microsoft YaHei">微软雅黑</Option>
            <Option value="KaiTi">楷体</Option>
          </Select>
        </div>

        <div>
          <Title level={5}>颜色</Title>
          <Input
            type="color"
            value={textWatermark.color}
            onChange={handleColorChange}
            style={{ width: '100%', height: '32px' }}
          />
        </div>

        <div>
          <Title level={5}>位置</Title>
          <Row gutter={16}>
            <Col span={12}>
              <div>X 位置 (%)</div>
              <Slider
                min={0}
                max={100}
                value={textWatermark.position.x}
                onChange={handlePositionXChange}
              />
            </Col>
            <Col span={12}>
              <div>Y 位置 (%)</div>
              <Slider
                min={0}
                max={100}
                value={textWatermark.position.y}
                onChange={handlePositionYChange}
              />
            </Col>
          </Row>
        </div>

        <div>
          <Title level={5}>预设位置</Title>
          <div className="preset-positions">
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(10, 10)}>左上角</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(50, 10)}>顶部中央</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(90, 10)}>右上角</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(10, 50)}>左侧中央</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(50, 50)}>正中心</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(90, 50)}>右侧中央</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(10, 90)}>左下角</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(50, 90)}>底部中央</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => handlePresetPosition(90, 90)}>右下角</Button>
              </Col>
            </Row>
          </div>
        </div>

        <div>
          <Title level={5}>旋转角度</Title>
          <Row>
            <Col span={16}>
              <Slider
                min={-180}
                max={180}
                value={textWatermark.rotation}
                onChange={handleRotationChange}
              />
            </Col>
            <Col span={7} offset={1}>
              <InputNumber
                min={-180}
                max={180}
                value={textWatermark.rotation}
                onChange={handleRotationChange}
              />
            </Col>
          </Row>
        </div>
      </Space>
    </div>
  );
};

export default TextWatermarkPanel;