import React from 'react';
import { Form, Input, Button, Card, Select, InputNumber, Row, Col, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import './Auth.css';

const { Option } = Select;

function Register() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    const customEmail = `${values.username.toLowerCase()}@rkmail.com`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, customEmail, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.fullName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: values.fullName,
        lastName: values.lastName,
        age: values.age,
        gender: values.gender,
        email: customEmail,
        createdAt: new Date()
      });

      message.success(`Account created successfully! Your email is: ${customEmail}`);
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        message.error('Registration failed. Username is already taken.');
      } else {
        message.error(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <Card 
        className="auth-card register-card-wide" 
        title={<h2 className="auth-title">Create Account</h2>}
        style={{ 
          width: '100%', 
          margin: 'auto',
          boxShadow: '0 12px 35px rgba(219, 39, 119, 0.07)',
          borderRadius: '20px',
          border: '1px solid #fbcfe8',
          background: '#ffffff',
          padding: '10px'
        }}
      >
        <Form name="register_form" onFinish={onFinish} layout="vertical">
          
          <Row gutter={[24, 0]}>
            
            <Col xs={24} sm={12}>
              <Form.Item name="fullName" label="First Name" rules={[{ required: true, message: 'Please enter your first name!' }]}>
                <Input prefix={<UserOutlined style={{ color: '#db2777' }} />} placeholder="First Name" size="large" className="auth-input" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please enter your last name!' }]}>
                <Input prefix={<UserOutlined style={{ color: '#db2777' }} />} placeholder="Last Name" size="large" className="auth-input" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="age" label="Age" rules={[{ required: true, message: 'Age required!' }]}>
                <InputNumber min={15} max={100} placeholder="18" size="large" style={{ width: '100%' }} className="auth-input" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Select gender!' }]}>
                <Select placeholder="Select" size="large" className="auth-input">
                  <Option value="Female">Female</Option>
                  <Option value="Male">Male</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={24}>
              <Form.Item name="username" label="Choose Username" rules={[{ required: true, message: 'Username required!' }]}>
                <Input prefix={<MailOutlined style={{ color: '#db2777' }} />} suffix="@rkmail.com" placeholder="username" size="large" className="auth-input" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: 'At least 6 characters!' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#db2777' }} />} placeholder="Password" size="large" className="auth-input" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="confirmPassword" label="Confirm Password" rules={[{ required: true, message: 'Please confirm password!' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#db2777' }} />} placeholder="Confirm Password" size="large" className="auth-input" />
              </Form.Item>
            </Col>

          </Row>

          <Form.Item style={{ marginBottom: '12px', marginTop: '10px' }}>
            <Button type="primary" htmlType="submit" block size="large" className="auth-btn">
              Create Account
            </Button>
          </Form.Item>

          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Login here</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Register;
