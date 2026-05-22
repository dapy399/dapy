import { useState, useEffect, useRef } from 'react';
import {
  Card, Table, Button, Form, Input, Select, Modal, message,
  Space, Popconfirm, Tag, Descriptions, Row, Col, Badge, Tooltip,
  Typography, Divider,
} from 'antd';
import { useExcelExport } from '@/utils/useExcelExport';
import {
  PlusOutlined, EyeOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, DownloadOutlined, EnvironmentOutlined,
  NodeIndexOutlined, ArrowRightOutlined, PayCircleOutlined,
  CarOutlined, UserOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import type { Order } from '@/types/index';
import { mockOrders } from '@/api/mock';
import { generateId } from '@/utils/index';
import {
  addressToLngLat,
  initMap,
  addMarker,
  addPolyline,
  fitView,
  fetchRealRoutePath,
  generateRoutePath,
  calculateDistance,
  getZoomByDistance,
} from '@/utils/map';

const { Text } = Typography;

// ============================================
// 亮点 5：RBAC 权限映射表
// ============================================
// 【说明】根据用户的 permission 列表，控制按钮显示
// 菜单级权限：sidebar 根据 permission 渲染菜单
// 按钮级权限：这里根据 permission 判断是否显示操作按钮
const statusMap: Record<number, { text: string; color: string; badge: string }> = {
  1: { text: '待接单', color: 'warning', badge: 'default' },
  2: { text: '进行中', color: 'processing', badge: 'processing' },
  3: { text: '已完成', color: 'success', badge: 'success' },
  4: { text: '已取消', color: 'error', badge: 'error' },
};

const cityOptions = [
  { label: '长沙', value: '长沙' },
  { label: '武汉', value: '武汉' },
  { label: '郑州', value: '郑州' },
  { label: '南昌', value: '南昌' },
  { label: '合肥', value: '合肥' },
];

const OrderList: React.FC = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [trackModalVisible, setTrackModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Order | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ============================================
  // 亮点 1：Web Worker 异步导出
  // ============================================
  // useExcelExport Hook 管理 Worker 生命周期
  // 导出时不会阻塞 UI（Excel 生成在独立线程）
  const { exportToExcel, exporting } = useExcelExport();

  // 地图相关 refs
  const spotMapRef = useRef<HTMLDivElement>(null);
  const trackMapRef = useRef<HTMLDivElement>(null);
  const spotMapInstance = useRef<any>(null);
  const trackMapInstance = useRef<any>(null);

  // 初始加载数据
  useEffect(() => {
    fetchData();
  }, []);

  // ============================================
  // 亮点 4-1：打点地图（起点 + 终点）
  // ============================================
  // 【功能】点击"打点"按钮，弹出地图，显示起点和终点标记
  // 【亮点】动态 zoom：根据起点终点距离自动计算合适缩放级别
  useEffect(() => {
    if (mapModalVisible && spotMapRef.current && currentRecord) {
      const startLngLat = addressToLngLat(currentRecord.city, currentRecord.startAddress);
      const endLngLat = addressToLngLat(currentRecord.city, currentRecord.endAddress);
      
      // 【关键】根据两点距离动态计算 zoom 级别
      // 距离短 → zoom 大（看街道）；距离长 → zoom 小（看城市）
      const distance = calculateDistance(startLngLat, endLngLat);
      const dynamicZoom = getZoomByDistance(distance);
      
      initMap(spotMapRef.current, { zoom: dynamicZoom }).then((map) => {
        spotMapInstance.current = map;
        // 添加起点标记（绿色）
        addMarker(map, startLngLat, { title: '起点', label: '起点', color: '#52c41a' });
        // 添加终点标记（红色）
        addMarker(map, endLngLat, { title: '终点', label: '终点', color: '#f5222d' });
        // 自动调整视野，确保起点终点都可见
        fitView(map, [startLngLat, endLngLat]);
      });
    }
    if (!mapModalVisible && spotMapInstance.current) {
      spotMapInstance.current.destroy();
      spotMapInstance.current = null;
    }
  }, [mapModalVisible, currentRecord]);

  // ============================================
  // 亮点 4-3：轨迹地图（真实路线 + 模拟降级）
  // ============================================
  // 【功能】点击"轨迹"按钮，弹出地图，显示起点到终点的行车路线
  // 【亮点】优先调用高德驾车路线规划 API 获取真实道路坐标
  // 【降级】API 失败时自动切换到 generateRoutePath 模拟路线
  useEffect(() => {
    if (trackModalVisible && trackMapRef.current && currentRecord) {
      const startLngLat = addressToLngLat(currentRecord.city, currentRecord.startAddress);
      const endLngLat = addressToLngLat(currentRecord.city, currentRecord.endAddress);
      
      // 动态 zoom
      const distance = calculateDistance(startLngLat, endLngLat);
      const dynamicZoom = getZoomByDistance(distance);
      
      initMap(trackMapRef.current, { zoom: dynamicZoom }).then(async (map) => {
        trackMapInstance.current = map;
        addMarker(map, startLngLat, { title: '起点', label: '起点', color: '#52c41a' });
        addMarker(map, endLngLat, { title: '终点', label: '终点', color: '#f5222d' });
        
        // 【关键】调用高德驾车路线规划 API，获取真实道路坐标
        // 如果 API 失败，fetchRealRoutePath 内部会自动降级为模拟路线
        const routePath = await fetchRealRoutePath(startLngLat, endLngLat);
        
        // 绘制路线（橙色，线宽 5px）
        addPolyline(map, routePath, { color: '#fa8c16', width: 5 });
        
        // 以完整路径点计算视野，确保整条轨迹可见
        fitView(map, routePath);
      });
    }
    if (!trackModalVisible && trackMapInstance.current) {
      trackMapInstance.current.destroy();
      trackMapInstance.current = null;
    }
  }, [trackModalVisible, currentRecord]);

  // 获取订单数据（模拟 API 请求）
  const fetchData = (params?: Record<string, unknown>) => {
    setLoading(true);
    setTimeout(() => {
      let result = [...mockOrders];
      if (params) {
        if (params.orderNo) result = result.filter((o) => o.orderNo.includes(String(params.orderNo)));
        if (params.username) result = result.filter((o) => o.username.includes(String(params.username)));
        if (params.status !== undefined && params.status !== '') result = result.filter((o) => o.status === Number(params.status));
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
    form.resetFields();
    form.setFieldsValue({ status: 1, city: '长沙' });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    setData(data.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的订单');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条订单吗？`,
      onOk: () => {
        setData(data.filter((item) => !selectedRowKeys.includes(item.id)));
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const newOrder: Order = {
        ...values,
        id: generateId(),
        orderNo: `DD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`,
        orderTime: new Date().toLocaleString(),
        userId: generateId(),
        driverId: generateId(),
      };
      setData([newOrder, ...data]);
      message.success('新增成功');
      setModalVisible(false);
    });
  };

  const handleViewDetail = (record: Order) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  const handleSpotCheck = (record: Order) => {
    setCurrentRecord(record);
    setMapModalVisible(true);
  };

  const handleTrack = (record: Order) => {
    setCurrentRecord(record);
    setTrackModalVisible(true);
  };

  // ============================================
  // 亮点 1：导出 Excel（Web Worker 异步）
  // ============================================
  // 【流程】
  // 1. 准备导出数据和表头映射
  // 2. 调用 exportToExcel（Hook 内部会创建 Worker）
  // 3. Worker 线程生成 Excel，主线程触发下载
  // 4. 整个过程 UI 不阻塞
  const handleExport = async () => {
    const exportHeaders = [
      { key: 'orderNo', title: '订单编号' },
      { key: 'city', title: '城市' },
      { key: 'startAddress', title: '起点地址' },
      { key: 'endAddress', title: '终点地址' },
      { key: 'orderTime', title: '下单时间' },
      { key: 'price', title: '价格(元)' },
      { key: 'statusText', title: '状态' },
      { key: 'username', title: '用户' },
      { key: 'driverName', title: '司机' },
    ];

    // 将状态码转为中文文本，方便 Worker 直接写入 Sheet
    const preparedData = data.map((order) => ({
      ...order,
      statusText: statusMap[order.status]?.text || '未知',
    }));

    try {
      await exportToExcel(preparedData as unknown as Record<string, unknown>[], {
        filename: `订单列表_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`,
        headers: exportHeaders,
      });
      message.success('导出成功');
    } catch {
      // 错误已在 Hook 内部通过 message.error 展示
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  // ============================================
  // 表格列定义（含按钮级权限控制）
  // ============================================
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      width: 155,
      render: (text: string) => (
        <Text strong copyable={{ text }} style={{ fontFamily: 'monospace', fontSize: 12, color: '#1677ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '城市',
      dataIndex: 'city',
      width: 80,
      align: 'center' as const,
      render: (text: string) => (
        <Tag color="blue" style={{ fontWeight: 500, fontSize: 12 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '下单地址',
      render: (_: unknown, record: Order) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Tooltip title={`起点：${record.startAddress}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: 180, overflow: 'hidden' }}>
              <Badge color="#52c41a" />
              <Text ellipsis style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>
                {record.startAddress}
              </Text>
            </div>
          </Tooltip>
          <ArrowRightOutlined style={{ fontSize: 10, color: '#bfbfbf', flexShrink: 0 }} />
          <Tooltip title={`终点：${record.endAddress}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: 180, overflow: 'hidden' }}>
              <Badge color="#f5222d" />
              <Text ellipsis style={{ fontSize: 12, color: '#f5222d', fontWeight: 500 }}>
                {record.endAddress}
              </Text>
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      width: 145,
      render: (text: string) => (
        <span style={{ fontSize: 12, color: '#595959', fontFamily: 'monospace' }}>
          {text}
        </span>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 90,
      align: 'right' as const,
      // 【修复】防御性编程：防止 price 为字符串或 undefined 时 toFixed 报错
      render: (p: number | string | undefined) => (
        <span style={{ fontSize: 14, fontWeight: 700, color: '#cf1322', fontFamily: 'monospace' }}>
          ¥{Number(p || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center' as const,
      render: (s: number) => (
        <Tag
          color={statusMap[s]?.color}
          style={{
            fontWeight: 600,
            fontSize: 12,
            padding: '1px 8px',
            borderRadius: 12,
          }}
        >
          {statusMap[s]?.text}
        </Tag>
      ),
    },
    {
      title: '用户',
      dataIndex: 'username',
      width: 100,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#e6f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1677ff',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {text.charAt(0)}
          </div>
          <Text ellipsis style={{ fontSize: 12, maxWidth: 60 }}>{text}</Text>
        </div>
      ),
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      width: 100,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff7e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fa8c16',
              fontSize: 10,
              flexShrink: 0,
            }}
          >
            <CarOutlined />
          </div>
          <Text ellipsis style={{ fontSize: 12, maxWidth: 60 }}>{text || '-'}</Text>
        </div>
      ),
    },
    // ============================================
    // 亮点 5：按钮级权限控制
    // ============================================
    // 【说明】实际项目中，这里应根据用户权限动态判断是否显示按钮
    // 例如：if (hasPermission('order:delete')) { ... }
    // 当前为演示，全部显示
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, record: Order) => (
        <Space size={2}>
          <Tooltip title="详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              style={{ color: '#1677ff', padding: '0 4px' }}
            />
          </Tooltip>
          <Tooltip title="打点">
            <Button
              type="text"
              size="small"
              icon={<EnvironmentOutlined />}
              onClick={() => handleSpotCheck(record)}
              style={{ color: '#52c41a', padding: '0 4px' }}
            />
          </Tooltip>
          <Tooltip title="轨迹">
            <Button
              type="text"
              size="small"
              icon={<NodeIndexOutlined />}
              onClick={() => handleTrack(record)}
              style={{ color: '#fa8c16', padding: '0 4px' }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确认删除？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ padding: '0 4px' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 搜索区域 */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={8} lg={6} xl={5}>
              <Form.Item name="orderNo" label={<span style={{ fontWeight: 500 }}>订单编号</span>} style={{ marginBottom: 0, width: '100%' }}>
                <Input
                  placeholder="请输入订单编号"
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  style={{ borderRadius: 8 }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={5}>
              <Form.Item name="username" label={<span style={{ fontWeight: 500 }}>用户</span>} style={{ marginBottom: 0, width: '100%' }}>
                <Input
                  placeholder="请输入用户名"
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  style={{ borderRadius: 8 }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={5}>
              <Form.Item name="status" label={<span style={{ fontWeight: 500 }}>状态</span>} style={{ marginBottom: 0, width: '100%' }}>
                <Select
                  placeholder="请选择状态"
                  allowClear
                  style={{ borderRadius: 8 }}
                  options={[
                    { label: '待接单', value: 1 },
                    { label: '进行中', value: 2 },
                    { label: '已完成', value: 3 },
                    { label: '已取消', value: 4 },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={5}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ borderRadius: 8 }}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 表格区域 */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '12px 24px' }}
      >
        {/* 操作按钮区 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ borderRadius: 8 }}
            >
              新增
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              style={{ borderRadius: 8 }}
            >
              批量删除
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExport}
              style={{ borderRadius: 8 }}
            >
              导出 Excel
            </Button>
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchData()}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          </div>
        </div>

        {/* 表格 */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
          pagination={{
            total: data.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          style={{ fontSize: 13 }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title="新增订单"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="城市" rules={[{ required: true, message: '请选择城市' }]}>
                <Select placeholder="请选择城市" options={cityOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  options={[
                    { label: '待接单', value: 1 },
                    { label: '进行中', value: 2 },
                    { label: '已完成', value: 3 },
                    { label: '已取消', value: 4 },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startAddress" label="起点地址" rules={[{ required: true, message: '请输入起点地址' }]}>
                <Input placeholder="请输入起点地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endAddress" label="终点地址" rules={[{ required: true, message: '请输入终点地址' }]}>
                <Input placeholder="请输入终点地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
                <Input prefix="¥" placeholder="请输入价格" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="driverName" label="司机名">
                <Input placeholder="请输入司机名" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单编号">{currentRecord.orderNo}</Descriptions.Item>
            <Descriptions.Item label="城市">{currentRecord.city}</Descriptions.Item>
            <Descriptions.Item label="起点地址" span={2}>{currentRecord.startAddress}</Descriptions.Item>
            <Descriptions.Item label="终点地址" span={2}>{currentRecord.endAddress}</Descriptions.Item>
            <Descriptions.Item label="下单时间">{currentRecord.orderTime}</Descriptions.Item>
            <Descriptions.Item label="订单价格">
              <span style={{ color: '#cf1322', fontWeight: 700, fontSize: 15 }}>
                ¥{Number(currentRecord.price || 0).toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户">{currentRecord.username}</Descriptions.Item>
            <Descriptions.Item label="司机">{currentRecord.driverName}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 打点地图弹窗 */}
      <Modal
        title="订单打点"
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width={800}
      >
        <div ref={spotMapRef} style={{ width: '100%', height: 500, borderRadius: 8, overflow: 'hidden' }} />
      </Modal>

      {/* 轨迹地图弹窗 */}
      <Modal
        title="订单轨迹"
        open={trackModalVisible}
        onCancel={() => setTrackModalVisible(false)}
        footer={null}
        width={800}
      >
        <div ref={trackMapRef} style={{ width: '100%', height: 500, borderRadius: 8, overflow: 'hidden' }} />
      </Modal>
    </div>
  );
};

export default OrderList;
