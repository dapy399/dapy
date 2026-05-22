import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Form, Input, Modal, message,
  Space, Popconfirm, Tree,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons';
import type { Role, MenuItem } from '@/types/index';
import { mockRoles, mockMenus } from '@/api/mock';
import { generateId } from '@/utils/index';

const RoleManage: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增角色');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      setData([...mockRoles]);
      setLoading(false);
    }, 300);
  };

  const handleAdd = () => {
    setModalTitle('新增角色');
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Role) => {
    setModalTitle('编辑角色');
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingId) {
        setData(data.map((item) => (item.id === editingId ? { ...item, ...values } : item)));
        message.success('更新成功');
      } else {
        const newRole: Role = {
          ...values,
          id: generateId(),
          menuIds: [],
          createTime: new Date().toLocaleDateString(),
          updateTime: new Date().toLocaleDateString(),
        };
        setData([...data, newRole]);
        message.success('新增成功');
      }
      setModalVisible(false);
    });
  };

  const handleSetPermission = (record: Role) => {
    setCurrentRoleId(record.id);
    setCheckedKeys(record.menuIds.map(String));
    setPermModalVisible(true);
  };

  const handleSavePermission = () => {
    if (currentRoleId) {
      setData(
        data.map((item) =>
          item.id === currentRoleId ? { ...item, menuIds: checkedKeys.map(Number) } : item
        )
      );
      message.success('权限设置成功');
      setPermModalVisible(false);
    }
  };

  // 构建权限树（包含菜单和按钮）
  const buildTreeData = () => {
    const buildNode = (parentId: number): any[] => {
      return mockMenus
        .filter((m) => m.parentId === parentId)
        .map((m) => {
          const children = buildNode(m.id);
          const node: any = {
            title: m.title + (m.type === 'button' ? ' [按钮]' : ''),
            key: String(m.id),
          };
          if (children.length > 0) {
            node.children = children;
          }
          return node;
        });
    };
    return buildNode(0);
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name' },
    { title: '备注', dataIndex: 'remark' },
    { title: '创建时间', dataIndex: 'createTime' },
    { title: '更新时间', dataIndex: 'updateTime' },
    {
      title: '操作',
      width: 250,
      render: (_: unknown, record: Role) => (
        <Space>
          <Button type="link" icon={<SafetyOutlined />} onClick={() => handleSetPermission(record)}>
            设置权限
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="角色管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增角色
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新增/编辑角色 */}
      <Modal title={modalTitle} open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 设置权限 */}
      <Modal
        title="设置权限"
        open={permModalVisible}
        onOk={handleSavePermission}
        onCancel={() => setPermModalVisible(false)}
        width={500}
      >
        <Tree
          checkable
          treeData={buildTreeData()}
          checkedKeys={checkedKeys}
          onCheck={(keys) => setCheckedKeys(keys as string[])}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
};

export default RoleManage;
