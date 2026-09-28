import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Table, Modal, Form, Input, Space, Tag, message } from 'antd';
import { InboxOutlined, SendOutlined, DeleteOutlined, PlusOutlined, LogoutOutlined, StarFilled, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, writeBatch, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import './Dashboard.css';

const { Header, Sider, Content } = Layout;

function Dashboard() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState('User');
  const [form] = Form.useForm();
  
  const user = JSON.parse(localStorage.getItem('user')) || { fullName: 'User', email: 'me@rkmail.com' };
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || !user.uid) return;

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().fullName) {
          setUserName(userDoc.data().fullName);
        } else if (user.fullName) {
          setUserName(user.fullName);
        }
      } catch (error) {
        if (user.fullName) setUserName(user.fullName);
      }
    };

    fetchUserProfile();
  }, [token, user.uid, user.fullName]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "emails"),
      where("participants", "array-contains", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emailList = snapshot.docs.map(doc => {
        const data = doc.data();
        let folder = 'inbox';
        
        if (data.isDeleted) {
          folder = 'trash';
        } else if (data.sender === user.email) {
          folder = 'sent';
        }

        return {
          _id: doc.id,
          ...data,
          folder,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      setEmails(emailList);
      setLoading(false);
    }, (error) => {
      message.error('Failed to load emails.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [token, user.email, navigate]);

  const handleSendEmail = async (values) => {
    let receiverEmail = values.receiver.toLowerCase();
    if (!receiverEmail.includes('@')) receiverEmail = `${receiverEmail}@rkmail.com`;

    try {
      await addDoc(collection(db, "emails"), {
        sender: user.email,
        receiver: receiverEmail,
        subject: values.subject,
        body: values.body,
        isStarred: false,
        isDeleted: false,
        participants: [user.email, receiverEmail],
        createdAt: new Date()
      });

      message.success('Email sent successfully!');
      setIsComposeOpen(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to send email.');
    }
  };

  const toggleStar = async (id) => {
    try {
      const emailRef = doc(db, "emails", id);
      const emailToUpdate = emails.find(e => e._id === id);
      await updateDoc(emailRef, {
        isStarred: !emailToUpdate.isStarred
      });
    } catch (error) {
      message.error('Error updating star status.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select at least one email!');
      return;
    }

    try {
      const batch = writeBatch(db);
      selectedRowKeys.forEach((id) => {
        const emailRef = doc(db, "emails", id);
        batch.update(emailRef, { isDeleted: true });
      });
      await batch.commit();

      message.success('Operation successful.');
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Failed to delete selected emails.');
    }
  };

  const filteredEmails = emails.filter(email => {
    if (currentFolder === 'starred') return email.isStarred && email.folder !== 'trash';
    return email.folder === currentFolder;
  });

  const menuItems = [
    { key: 'inbox', icon: <InboxOutlined />, label: 'Inbox' },
    { key: 'starred', icon: <StarFilled style={{ color: '#fadb14' }} />, label: 'Starred' },
    { key: 'sent', icon: <SendOutlined />, label: 'Sent Mails' },
    { key: 'trash', icon: <DeleteOutlined />, label: 'Trash' },
  ];

  const columns = [
    {
      title: '',
      key: 'star',
      width: 50,
      render: (_, record) => (
        <span onClick={() => toggleStar(record._id)} style={{ cursor: 'pointer', fontSize: 18, color: record.isStarred ? '#fadb14' : '#d9d9d9' }}>
          {record.isStarred ? <StarFilled /> : <StarFilled style={{ color: '#e2e8f0' }} />}
        </span>
      )
    },
    { title: currentFolder === 'sent' ? 'To' : 'From', dataIndex: currentFolder === 'sent' ? 'receiver' : 'sender', key: 'sender', width: 200 },
    { 
      title: 'Subject', 
      dataIndex: 'subject', 
      key: 'subject', 
      render: (text, record) => (
        <span style={{ cursor: 'pointer', color: '#db2777', fontWeight: '600' }} onClick={() => Modal.info({ title: record.subject, content: record.body })}>
          {text}
        </span>
      )
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (date) => new Date(date).toLocaleDateString() }
  ];

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <Space>
          <Button type="text" icon={<MenuOutlined style={{ color: '#db2777', fontSize: 18 }} />} onClick={() => setCollapsed(!collapsed)} />
          <div className="logo-text">RK Mail</div>
        </Space>
        <Space size="middle">
          <span className="welcome-text" style={{ color: '#475569' }}>Welcome, <b>{userName}</b></span>
          <Button type="default" danger icon={<LogoutOutlined />} onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ borderRadius: 6 }}>Logout</Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={240} trigger={null} collapsible collapsed={collapsed} breakpoint="lg" collapsedWidth="0" onBreakpoint={(b) => { setCollapsed(b); setIsMobile(b); }} style={{ background: '#ffffff', borderRight: '1px solid #fbcfe8' }}>
          <div style={{ padding: '20px 16px' }}>
            <Button type="primary" icon={<PlusOutlined />} block size="large" className="compose-btn" onClick={() => { setIsComposeOpen(true); if(isMobile) setCollapsed(true); }}>
              Compose
            </Button>
          </div>
          <Menu 
            mode="inline" 
            selectedKeys={[currentFolder]} 
            onClick={(e) => { setCurrentFolder(e.key); setSelectedRowKeys([]); if (isMobile) setCollapsed(true); }} 
            style={{ borderRight: 0 }}
            items={menuItems} 
          />
        </Sider>

        <Content style={{ padding: '16px' }}>
          <div className="main-content-box">
            <div className="folder-header-row" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="folder-title" style={{ textTransform: 'uppercase' }}>{currentFolder}</h2>
              <Space>
                <Button type="primary" danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0} onClick={handleDeleteSelected}>
                  Delete Selected
                </Button>
                <Tag color="magenta">{filteredEmails.length} Messages</Tag>
              </Space>
            </div>
            <Table
              rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
              columns={columns}
              dataSource={filteredEmails}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 550 }}
              pagination={{ pageSize: 7 }}
              locale={{ emptyText: 'No emails found.' }}
            />
          </div>
        </Content>
      </Layout>

      <Modal title={<span style={{ color: '#db2777', fontWeight: 700 }}>New Message</span>} open={isComposeOpen} onCancel={() => setIsComposeOpen(false)} onOk={() => form.submit()} okText="Send" cancelText="Cancel">
        <Form form={form} layout="vertical" onFinish={handleSendEmail} style={{ marginTop: 12 }}>
          <Form.Item name="receiver" label="To:" rules={[{ required: true, message: 'Please enter recipient!' }]}>
            <Input suffix="@rkmail.com" placeholder="username" size="large" style={{ borderRadius: 6 }} />
          </Form.Item>
          <Form.Item name="subject" label="Subject:" rules={[{ required: true, message: 'Please enter subject!' }]}>
            <Input placeholder="Enter subject" size="large" style={{ borderRadius: 6 }} />
          </Form.Item>
          <Form.Item name="body" label="Message:" rules={[{ required: true, message: 'Please write message!' }]}>
            <Input.TextArea placeholder="Write your email here..." rows={4} style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default Dashboard;
