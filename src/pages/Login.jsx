import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';
import './Auth.css';

function Login() {
  const onFinish = async (values) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      localStorage.setItem('token', user.accessToken);
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || 'User'
      }));
        
      message.success('Welcome back! Login successful.');
        
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message.error('Invalid email or password. Please try again.');
      } else {
        message.error(error.message || 'An error occurred during sign in.');
      }
    }
  };

  return (
    <div className="auth-container">
      <Card 
        className="auth-card" 
        title={<h2 className="auth-title">Sign In</h2>}
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          margin: 'auto',
          boxShadow: '0 12px 30px rgba(219, 39, 119, 0.06)',
          borderRadius: '16px',
          border: '1px solid #fbcfe8',
          background: '#ffffff'
        }}
      >
        <Form name="login_form" onFinish={onFinish} layout="vertical">
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter valid email!' }]}>
            <Input prefix={<MailOutlined style={{ color: '#db2777' }} />} placeholder="username@rkmail.com" size="large" className="auth-input" />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password!' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#db2777' }} />} placeholder="Password" size="large" className="auth-input" />
          </Form.Item>

          <Form.Item style={{ marginBottom: '12px' }}>
            <Button type="primary" htmlType="submit" block size="large" className="auth-btn">
              Sign In
            </Button>
          </Form.Item>

          <div className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
