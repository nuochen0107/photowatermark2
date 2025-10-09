import React, { useState } from 'react';
import { Button, Input, List, Modal, Typography, Space, Popconfirm, message } from 'antd';
import { SaveOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import useWatermarkStore from '../store/watermarkStore';

const { Title } = Typography;

const TemplatePanel = () => {
  const { templates, saveTemplate, loadTemplate, deleteTemplate } = useWatermarkStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [loading, setLoading] = useState(false);

  // 保存模板
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      message.error('请输入模板名称');
      return;
    }

    setLoading(true);
    try {
      saveTemplate(templateName.trim());
      message.success('模板保存成功');
      setIsModalVisible(false);
      setTemplateName('');
    } catch (error) {
      message.error('保存模板失败');
      console.error('保存模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载模板
  const handleLoadTemplate = (templateId) => {
    try {
      const success = loadTemplate(templateId);
      if (success) {
        message.success('模板加载成功');
      } else {
        message.error('模板加载失败');
      }
    } catch (error) {
      message.error('加载模板失败');
      console.error('加载模板失败:', error);
    }
  };

  // 删除模板
  const handleDeleteTemplate = (templateId) => {
    try {
      deleteTemplate(templateId);
      message.success('模板删除成功');
    } catch (error) {
      message.error('删除模板失败');
      console.error('删除模板失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="template-panel">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5}>水印模板</Title>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            保存当前设置为模板
          </Button>
        </div>

        {templates.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={templates}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="load" 
                    type="link" 
                    onClick={() => handleLoadTemplate(item.id)}
                  >
                    加载
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个模板吗？"
                    onConfirm={() => handleDeleteTemplate(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      type="link" 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={item.name}
                  description={`创建时间: ${formatDate(item.createdAt)} | 类型: ${item.watermarkType === 'text' ? '文本水印' : '图片水印'}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
            暂无保存的模板
          </div>
        )}
      </Space>

      <Modal
        title="保存模板"
        open={isModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setIsModalVisible(false);
          setTemplateName('');
        }}
        confirmLoading={loading}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="请输入模板名称"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          maxLength={50}
          showCount
        />
      </Modal>
    </div>
  );
};

export default TemplatePanel;