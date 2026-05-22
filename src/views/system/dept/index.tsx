import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Form, Input, Modal, message,
  Space, Popconfirm, TreeSelect,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Department } from '@/types/index';
import { mockDepts } from '@/api/mock';
import { generateId } from '@/utils/index';

const DeptManage: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增部门');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      setData([...mockDepts]);
      setLoading(false);
    }, 300);
  };

  // 将扁平数据转为树形
  const buildTreeData = (list: Department[]): any[] => {
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
    setModalTitle('新增部门');
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ parentId: parentId || undefined });
    setModalVisible(true);
  };

  const handleEdit = (record: Department) => {
    setModalTitle('编辑部门');
    setEditingId(record.id);
    form.setFieldsValue({
      parentId: record.parentId || undefined,
      name: record.name,
      manager: record.manager,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    const hasChildren = data.some((d) => d.parentId === id);
    if (hasChildren) {
      message.error('该部门下存在子部门，无法删除');
      return;
    }
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const submitData = { ...values, parentId: values.parentId || 0 };
      if (editingId) {
        setData(data.map((item) =>
          item.id === editingId
            ? { ...item, ...submitData, updateTime: new Date().toLocaleDateString() }
            : item
        ));
        message.success('更新成功');
      } else {
        const newDept: Department = {
          ...submitData,
          id: generateId(),
          createTime: new Date().toLocaleDateString(),
          updateTime: new Date().toLocaleDateString(),
        };
        setData([...data, newDept]);
        message.success('新增成功');
      }
      setModalVisible(false);
    });
  };

  const columns = [
    { title: '部门名称', dataIndex: 'name', width: 200 },
    { title: '负责人', dataIndex: 'manager', width: 150 },
    { title: '创建时间', dataIndex: 'createTime', width: 150 },
    { title: '更新时间', dataIndex: 'updateTime', width: 150 },
    {
      title: '操作',
      width: 250,
      render: (_: unknown, record: Department) => (
        <Space>
          <Button type="link" icon={<PlusOutlined />} onClick={() => handleAdd(record.id)}>
            添加子部门
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const buildTreeSelectData = (parentId = 0): any[] => {
    return data
      .filter((d) => d.parentId === parentId)
      .map((d) => {
        const children = buildTreeSelectData(d.id);
        const node: any = { title: d.name, value: d.id, key: d.id };
        if (children.length > 0) node.children = children;
        return node;
      });
  };

  return (
    <div>
      <Card
        title="部门管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(0)}>
            新增部门
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

      <Modal title={modalTitle} open={modalVisible} onOk={handleModalOk} onCancel={() => setModalVisible(false)} width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="parentId" label="上级部门">
            <TreeSelect
              treeData={buildTreeSelectData()}
              placeholder="请选择（不选为顶级）"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="manager" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeptManage;
