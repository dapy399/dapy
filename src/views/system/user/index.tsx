import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Select, Form, Modal, message,
  Popconfirm, Space, Avatar, Tag, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, UserOutlined,
} from '@ant-design/icons';
import type { User, Department, Role } from '@/types/index';
import { mockUsers, mockDepts, mockRoles } from '@/api/mock';
import { generateId } from '@/utils/index';

const UserManage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增用户');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [depts] = useState<Department[]>(mockDepts);
  const [roles] = useState<Role[]>(mockRoles);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = (params?: Record<string, unknown>) => {
    setLoading(true);
    setTimeout(() => {
      let result = [...mockUsers];
      if (params) {
        if (params.id) result = result.filter((u) => u.id === Number(params.id));
        if (params.username) result = result.filter((u) => u.username.includes(String(params.username)));
        if (params.status !== undefined && params.status !== '') result = result.filter((u) => u.status === Number(params.status));
      }
      setData(result);
      setLoading(false);
    }, 300);
  };

  const handleSearch = (values: Record<string, unknown>) => {
    fetchData(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    fetchData();
  };

  const handleAdd = () => {
    setModalTitle('新增用户');
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setModalTitle('编辑用户');
    setEditingId(record.id);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      phone: record.phone,
      status: record.status,
      departmentId: record.departmentId,
      roleId: record.roleId,
      position: record.position,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的数据');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selectedRowKeys.length} 条数据吗？`,
      onOk: () => {
        setData(data.filter((item) => !selectedRowKeys.includes(item.id)));
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const roleName = roles.find((r) => r.id === values.roleId)?.name || '';
      const deptName = depts.find((d) => d.id === values.departmentId)?.name || '';

      if (editingId) {
        setData(data.map((item) =>
          item.id === editingId
            ? { ...item, ...values, role: roleName, department: deptName }
            : item
        ));
        message.success('更新成功');
      } else {
        const newUser: User = {
          ...values,
          id: generateId(),
          registerTime: new Date().toLocaleString(),
          lastLoginTime: '-',
          role: roleName,
          department: deptName,
          avatar: '',
        };
        setData([...data, newUser]);
        message.success('新增成功');
      }
      setModalVisible(false);
    });
  };

  const columns = [
    { title: '用户ID', dataIndex: 'id', width: 80 },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (text: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} size="small" />
          {text}
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email' },
    { title: '角色', dataIndex: 'role' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    { title: '注册时间', dataIndex: 'registerTime' },
    { title: '最后登录', dataIndex: 'lastLoginTime' },
    {
      title: '操作',
      width: 150,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const deptOptions = depts.map((d) => ({ label: d.name, value: d.id }));
  const roleOptions = roles.map((r) => ({ label: r.name, value: r.id }));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="id" label="用户ID">
            <Input placeholder="请输入" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginLeft: 8 }}>重置</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="用户列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
            <Button danger onClick={handleBatchDelete}>批量删除</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal title={modalTitle} open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择">
                  <Select.Option value={1}>正常</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="departmentId" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
                <Select options={deptOptions} placeholder="请选择部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roleId" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select options={roleOptions} placeholder="请选择角色" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="position" label="岗位">
            <Input placeholder="请输入岗位" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;
