import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, message, theme as antTheme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/index';
import { loginApi } from '@/api/index';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 已登录用户访问登录页，自动跳转到首页
  useEffect(() => {
    if (state.token) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.token, navigate]);

  const {
    token: { colorPrimary },
  } = antTheme.useToken();

  const handleLogin = async (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      // Mock登录
      if (values.username === 'admin' && values.password === '123456') {
        const token = 'mock_token_' + Date.now();
        const user = {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          phone: '13800138000',
          avatar: '',
          role: '超级管理员',
          roleId: 1,
          status: 1,
          department: '技术部',
          departmentId: 1,
          position: '技术总监',
          registerTime: '2024-01-01 10:00:00',
          lastLoginTime: '2024-05-06 08:30:00',
        };

        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({
          type: 'SET_MENU_LIST',
          payload: [],
        });
        dispatch({
          type: 'SET_PERMISSION_LIST',
          payload: ['*'],
        });

        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          top: '-200px',
          right: '-200px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          bottom: '-100px',
          left: '-100px',
        }}
      />

      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.95)',
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
            React Admin
          </h1>
          <p style={{ color: '#666', fontSize: 14 }}>物流/网约车后台管理系统</p>
        </div>

        <Form
          form={form}
          name="login"
          initialValues={{ remember: true, username: 'admin', password: '123456' }}
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用户名: admin"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码: 123456"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a style={{ color: colorPrimary }}>忘记密码？</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ borderRadius: 8, height: 44 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
