import React from 'react';
import { List, Card, Button, Tooltip, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import useImageStore from '../store/imageStore';

const ImageList = () => {
  const { images, removeImage, setSelectedImage, selectedImage, getThumbnail } = useImageStore();

  const handleImageClick = (image) => {
    setSelectedImage(image.id);
  };

  const handleDeleteImage = (e, id) => {
    e.stopPropagation();
    removeImage(id);
  };

  return (
    <List
      grid={{
        gutter: 16,
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
      }}
      dataSource={images}
      renderItem={(image) => {
        const thumbnail = getThumbnail(image.id);
        return (
          <List.Item>
            <Card
              hoverable
              style={{
                width: '100%',
                border: selectedImage?.id === image.id ? '2px solid #1890ff' : '1px solid #f0f0f0'
              }}
              cover={
                <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                  {thumbnail ? (
                    <img
                      alt={image.name}
                      src={thumbnail}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(image)}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Spin />
                    </div>
                  )}
                  <Tooltip title="删除">
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                      }}
                      onClick={(e) => handleDeleteImage(e, image.id)}
                    />
                  </Tooltip>
                </div>
              }
            >
              <Card.Meta
                title={image.name}
                style={{ textAlign: 'center' }}
              />
            </Card>
          </List.Item>
        );
      }}
    />
  );
};

export default ImageList;