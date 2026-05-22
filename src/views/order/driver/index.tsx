import { useState, useEffect } from 'react';
import {
  Card, Table, Form, Input, Select, Button, Tag, Avatar, Space, Progress,
  Tooltip,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, UserOutlined, CarOutlined,
  StarFilled, ThunderboltOutlined,
} from '@ant-design/icons';
import type { Driver } from '@/types/index';
import { mockDrivers } from '@/api/mock';

const statusMap: Record<number, { text: string; color: string }> = {
  1: { text: '正常', color: 'success' },
  2: { text: '暂时拉黑', color: 'warning' },
  3: { text: '永久拉黑', color: 'error' },
};

const DriverList: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [data, setData] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = (params?: Record<string, unknown>) => {
    setLoading(true);
    setTimeout(() => {
      let result = [...mockDrivers];
      if (params) {
        if (params.name) result = result.filter((d) => d.name.includes(String(params.name)));
        if (params.status !== undefined && params.status !== '') result = result.filter((d) => d.status === Number(params.status));
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

  const columns = [
    {
      title: '司机信息',
      width: 200,
      render: (_: unknown, record: Driver) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>ID: {record.id}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '注册城市/等级',
      width: 150,
      render: (_: unknown, record: Driver) => (
        <div>
          <div><Tag color="blue">{record.registerCity}</Tag></div>
          <div style={{ marginTop: 4 }}>
            <Tag color="gold">{record.memberLevel}</Tag>
            <Tag color="purple">{record.driverLevel}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: number) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
    },
    {
      title: '车辆信息',
      width: 180,
      render: (_: unknown, record: Driver) => (
        <div>
          <div><CarOutlined /> {record.licensePlate}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.brand} {record.vehicleModel}</div>
        </div>
      ),
    },
    {
      title: '昨日数据',
      width: 200,
      render: (_: unknown, record: Driver) => (
        <div>
          <div>在线时长: <Tag color="cyan">{record.onlineTimeYesterday}h</Tag></div>
          <div style={{ marginTop: 4 }}>流水: <Tag color="green">¥{record.revenueYesterday}</Tag></div>
        </div>
      ),
    },
    {
      title: '评分/行为分',
      width: 180,
      render: (_: unknown, record: Driver) => (
        <div>
          <div>
            <StarFilled style={{ color: '#faad14' }} /> {record.rating}
          </div>
          <div style={{ marginTop: 4 }}>
            <Tooltip title={`行为分: ${record.behaviorScore}`}>
              <Progress percent={record.behaviorScore} size="small" status={record.behaviorScore > 90 ? 'success' : 'normal'} />
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: '昨日单量',
      width: 150,
      render: (_: unknown, record: Driver) => (
        <div>
          <div>推单: {record.pushOrdersYesterday}</div>
          <div style={{ marginTop: 4 }}>完单: {record.completedOrdersYesterday}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#52c41a' }}>
            完单率: {((record.completedOrdersYesterday / record.pushOrdersYesterday) * 100).toFixed(1)}%
          </div>
        </div>
      ),
    },
    { title: '加入时间', dataIndex: 'joinTime', width: 120 },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="name" label="司机名称">
            <Input placeholder="请输入" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="司机状态">
            <Select placeholder="请选择" style={{ width: 130 }} allowClear>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={2}>暂时拉黑</Select.Option>
              <Select.Option value={3}>永久拉黑</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">搜索</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginLeft: 8 }}>重置</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="司机列表">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </div>
  );
};

export default DriverList;
