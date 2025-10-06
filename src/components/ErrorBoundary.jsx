import React from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="渲染错误"
          subTitle="组件渲染时发生错误，请尝试重新加载"
          extra={
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={this.handleRetry}
            >
              重试
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;