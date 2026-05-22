import { useState, useEffect, useRef } from 'react';
import { Card, Select, Row, Col, Statistic, theme as antTheme } from 'antd';
import { EnvironmentOutlined, ClusterOutlined, FireOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  cityCenters,
  initMap,
  createClusterData,
  initMarkerCluster,
} from '@/utils/map';

const cityData: Record<string, { center: [number, number]; orders: number; heatData: [number, number, number][] }> = {
  '长沙': {
    center: [112.9388, 28.2282],
    orders: 15234,
    heatData: [
      [112.9388, 28.2282, 500], [112.95, 28.23, 300], [112.92, 28.22, 200],
      [112.96, 28.24, 150], [112.90, 28.21, 100], [112.94, 28.25, 80],
      [112.98, 28.20, 250], [112.88, 28.26, 180], [112.93, 28.19, 120],
      [112.97, 28.23, 90], [112.91, 28.27, 60], [112.99, 28.25, 70],
    ],
  },
  '武汉': {
    center: [114.3054, 30.5928],
    orders: 12890,
    heatData: [
      [114.3054, 30.5928, 400], [114.32, 30.60, 250], [114.29, 30.58, 180],
      [114.34, 30.61, 120], [114.28, 30.57, 90], [114.31, 30.63, 200],
      [114.35, 30.59, 150], [114.27, 30.62, 80], [114.33, 30.56, 100],
      [114.30, 30.64, 70], [114.36, 30.58, 60], [114.26, 30.60, 50],
    ],
  },
  '郑州': {
    center: [113.6253, 34.7466],
    orders: 9876,
    heatData: [
      [113.6253, 34.7466, 350], [113.64, 34.76, 200], [113.61, 34.74, 150],
      [113.66, 34.75, 100], [113.60, 34.73, 80], [113.63, 34.77, 180],
      [113.67, 34.74, 120], [113.59, 34.76, 70], [113.65, 34.72, 90],
      [113.62, 34.78, 60], [113.68, 34.75, 50], [113.58, 34.74, 40],
    ],
  },
};

const cityOptions = [
  { label: '长沙', value: '长沙' },
  { label: '武汉', value: '武汉' },
  { label: '郑州', value: '郑州' },
];

const OrderCluster: React.FC = () => {
  const [currentCity, setCurrentCity] = useState('长沙');
  const data = cityData[currentCity];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);

  const {
    token: { borderRadiusLG },
  } = antTheme.useToken();

  // 初始化/更新高德地图聚合
  useEffect(() => {
    const setupMap = async () => {
      if (!mapContainerRef.current) return;

      // 销毁旧地图
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }

      const center = cityCenters[currentCity] || cityCenters['长沙'];
      const map = await initMap(mapContainerRef.current, {
        zoom: 11,
        center,
      });
      mapInstanceRef.current = map;

      const clusterPoints = createClusterData(currentCity, 35);
      const cluster = await initMarkerCluster(map, clusterPoints);
      clusterRef.current = cluster;
    };

    setupMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [currentCity]);

  // 柱状图：各区域订单量对比
  const barOption = {
    title: { text: '区域订单量Top10', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['五一广场', '火车站', '机场', '大学城', 'CBD', '高新区', '步行街', '景区', '体育馆', '医院'] },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: [820, 750, 680, 620, 580, 520, 480, 420, 380, 320],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ borderRadius: borderRadiusLG }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', fontSize: 16 }}>城市切换:</span>
              <Select
                value={currentCity}
                options={cityOptions}
                onChange={setCurrentCity}
                style={{ width: 200 }}
              />
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="总订单量"
                    value={data.orders}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="聚合点数"
                    value={data.heatData.length}
                    prefix={<ClusterOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="热点区域"
                    value={5}
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            style={{ borderRadius: borderRadiusLG }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: 600 }}>{currentCity} - 订单分布聚合图</span>
              </div>
            }
          >
            <div
              ref={mapContainerRef}
              style={{
                height: 450,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #e8e8e8',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: borderRadiusLG }}>
            <ReactECharts option={barOption} style={{ height: 450 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderCluster;
