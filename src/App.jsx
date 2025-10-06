import React from 'react';
import { Layout, Typography } from 'antd';
import ImportPanel from './components/ImportPanel';
import ImageList from './components/ImageList';
import PreviewCanvas from './components/PreviewCanvas';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <Title level={3} style={{ margin: '16px 0' }}>PhotoWatermark2</Title>
      </Header>
      <Content style={{ padding: '20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="main-content">
            <div className="left-panel">
              <ImportPanel />
              <div style={{ marginTop: '20px' }}>
                <ImageList />
              </div>
            </div>
            <div className="right-panel">
              <PreviewCanvas />
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
