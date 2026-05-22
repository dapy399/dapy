import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Form, Input, Modal, message,
  Space, Popconfirm, Tag, Radio, TreeSelect,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { MenuItem } from '@/types/index';
import { mockMenus } from '@/api/mock';
import { generateId } from '@/utils/index';

const MenuManage: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增菜单');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      setData([...mockMenus]);
      setLoading(false);
    }, 300);
  };

  // 将扁平数据转为树形
  const buildTreeData = (list: MenuItem[]): any[] => {
    const map: Record<number, any> = {};
    const roots: any[] = [];

    list.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    list.forEach((item) => {
      if (item.parentId === 0) {
        roots.push(map[item.id]);
      } else if (map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      }
    });

    // 移除空的 children
    const clean = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        const result = { ...node };
        if (result.children && result.children.length > 0) {
          result.children = clean(result.children);
        } else {
          delete result.children;
        }
        return result;
      });
    };

    return clean(roots);
  };

  const handleAdd = (parentId = 0) => {
    setModalTitle('新增菜单');
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ parentId: parentId || undefined, type: 'menu', status: 1, sort: 1 });
    setModalVisible(true);
  };

  const handleEdit = (record: MenuItem) => {
    setModalTitle('编辑菜单');
    setEditingId(record.id);
    form.setFieldsValue({
      parentId: record.parentId || undefined,
      name: record.name,
      title: record.title,
      icon: record.icon,
      type: record.type,
      permission: record.permission,
      path: record.path,
      component: record.component,
      sort: record.sort,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    const hasChildren = data.some((m) => m.parentId === id);
    if (hasChildren) {
      message.error('该菜单下存在子菜单，无法删除');
      return;
    }
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const submitData = { ...values, parentId: values.parentId || 0 };
      if (editingId) {
        setData(data.map((item) => (item.id === editingId ? { ...item, ...submitData } : item)));
        message.success('更新成功');
      } else {
        const newMenu: MenuItem = {
          ...submitData,
          id: generateId(),
        };
        setData([...data, newMenu]);
        message.success('新增成功');
      }
      setModalVisible(false);
    });
  };

  const typeTag = (type: string) => {
    const map: Record<string, { color: string; label: string }> = {
      menu: { color: 'blue', label: '菜单' },
      page: { color: 'green', label: '页面' },
      button: { color: 'orange', label: '按钮' },
    };
    const item = map[type] || map.menu;
    return <Tag color={item.color}>{item.label}</Tag>;
  };

  const columns = [
    { title: '菜单名称', dataIndex: 'title', width: 150 },
    { title: '图标', dataIndex: 'icon', width: 100, render: (icon: string) => icon || '-' },
    { title: '类型', dataIndex: 'type', width: 100, render: (t: string) => typeTag(t) },
    { title: '权限标识', dataIndex: 'permission', width: 150 },
    { title: '路由地址', dataIndex: 'path', render: (p: string) => p || '-' },
    { title: '组件路径', dataIndex: 'component', render: (c: string) => c || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: number) => <Tag color={s === 1 ? 'success' : 'error'}>{s === 1 ? '正常' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      width: 200,
      render: (_: unknown, record: MenuItem) => (
        <Space>
          {record.type === 'menu' && (
            <Button type="link" icon={<PlusOutlined />} onClick={() => handleAdd(record.id)}>
              新增
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const treeData = data
    .filter((m) => m.type === 'menu')
    .map((m) => ({ title: m.title, value: m.id, key: m.id, children: [] }));

  // 手动构建 TreeSelect 的层级
  const buildTreeSelectData = (parentId = 0): any[] => {
    return data
      .filter((m) => m.parentId === parentId && m.type === 'menu')
      .map((m) => {
        const children = buildTreeSelectData(m.id);
        const node: any = { title: m.title, value: m.id, key: m.id };
        if (children.length > 0) node.children = children;
        return node;
      });
  };

  return (
    <div>
      <Card
        title="菜单管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(0)}>
            新增菜单
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={buildTreeData(data)}
          loading={loading}
          pagination={false}
          defaultExpandAllRows
        />
      </Card>

      <Modal title={modalTitle} open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="parentId" label="上级菜单">
            <TreeSelect
              treeData={buildTreeSelectData()}
              placeholder="请选择上级菜单（不选为顶级）"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="title" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item name="name" label="标识名" rules={[{ required: true, message: '请输入标识名' }]}>
            <Input placeholder="请输入标识名" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="menu">菜单</Radio>
              <Radio value="page">页面</Radio>
              <Radio value="button">按钮</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="如：DashboardOutlined" />
          </Form.Item>
          <Form.Item name="permission" label="权限标识" rules={[{ required: true, message: '请输入权限标识' }]}>
            <Input placeholder="如：system:user" />
          </Form.Item>
          <Form.Item name="path" label="路由地址">
            <Input placeholder="如：/system/user" />
          </Form.Item>
          <Form.Item name="component" label="组件路径">
            <Input placeholder="如：UserManage" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <Input type="number" placeholder="排序号" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>正常</Radio>
              <Radio value={0}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManage;
