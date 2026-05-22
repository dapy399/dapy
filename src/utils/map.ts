// ===========================================
// 亮点 4：高德地图集成（map.ts）
// ===========================================
// 【功能清单】
// 1. 初始化地图（initMap）
// 2. 添加起终点标记（addMarker）
// 3. 绘制路线（addPolyline）
// 4. 地址 → 经纬度转换（addressToLngLat，模拟数据）
// 5. 真实驾车路线规划（fetchRealRoutePath，调用高德 API）
// 6. 模拟路线生成（generateRoutePath，正弦波弯曲，API 失败时的降级方案）
// 7. 距离计算 + 动态缩放（calculateDistance + getZoomByDistance）
// 8. 点聚合（initMarkerCluster）
//
// 【技术亮点】
// - fetchRealRoutePath：调用高德驾车路线规划 API，获取真实道路坐标
// - 自动降级：API 调用失败时，自动切换到 generateRoutePath 模拟路线
// - 动态 zoom：根据起点终点距离自动计算合适的缩放级别
// - 点抽稀：API 返回坐标过多时，自动抽稀避免渲染压力

// ===== 配置区 =====
// 高德 Web 服务 API Key（驾车路线规划用，需在高德控制台申请）
// 注意：这是 Web 服务 Key，不是 JS API Key
const AMAP_KEY = '552ff6e8cceff3d7904096a301281d37';

// 城市中心坐标（用于地址 → 经纬度的模拟转换）
export const cityCenters: Record<string, [number, number]> = {
  '长沙': [112.9388, 28.2282],
  '武汉': [114.3054, 30.5928],
  '郑州': [113.6253, 34.7466],
  '南昌': [115.8579, 28.6820],
  '合肥': [117.2272, 31.8206],
};

// ===== 工具函数 =====

/**
 * 简单的字符串哈希函数
 * 用于将地址字符串映射为固定的伪随机数
 * 这样同一个地址每次生成的经纬度都一样（可复现）
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash;
}

/**
 * 将地址转换为经纬度（基于城市中心的伪随机偏移）
 * 
 * 【说明】这是模拟数据，实际项目应调用高德地理编码 API
 * 这里用哈希函数保证同一个地址总是生成相同的坐标
 * 
 * @param city    城市名（用于确定基准坐标）
 * @param address 具体地址
 * @returns [经度, 纬度]
 */
export function addressToLngLat(city: string, address: string): [number, number] {
  const center = cityCenters[city] || cityCenters['长沙'];
  const hash = hashString(address);
  // 在城市中心周围生成 ±0.08 度的偏移（约 ±8km）
  const lngOffset = (Math.abs(hash) % 1600) / 10000 - 0.08;
  const latOffset = (Math.abs(hash >> 8) % 1600) / 10000 - 0.08;
  return [center[0] + lngOffset, center[1] + latOffset];
}

// ===== 高德地图初始化 =====

declare global {
  interface Window {
    AMap: any;
  }
}

/** 等待高德地图 JS API 加载完成 */
export function waitForAMap(): Promise<void> {
  return new Promise((resolve) => {
    if (window.AMap) {
      resolve();
      return;
    }
    // 轮询检查（每 100ms 检查一次）
    const check = setInterval(() => {
      if (window.AMap) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

/**
 * 初始化高德地图实例
 * @param container 地图容器（DOM 元素或容器 ID）
 * @param options  配置项（zoom 缩放级别、center 中心坐标）
 */
export async function initMap(
  container: string | HTMLDivElement,
  options: { zoom?: number; center?: [number, number] } = {}
): Promise<any> {
  await waitForAMap();
  const AMap = window.AMap;
  return new AMap.Map(container, {
    zoom: options.zoom || 12,
    center: options.center || cityCenters['长沙'],
    viewMode: '2D',
  });
}

/** 添加标记点（起点/终点） */
export function addMarker(
  map: any,
  position: [number, number],
  options: { title?: string; label?: string; color?: string } = {}
): any {
  const AMap = window.AMap;
  const marker = new AMap.Marker({
    position,
    title: options.title || '',
    anchor: 'bottom-center', // 锚点：底部居中（图标尖角对准坐标点）
  });
  // 如果传了 label，在标记上方显示文字标签
  if (options.label) {
    marker.setLabel({
      content: `<div style="padding:4px 8px;background:${options.color || '#1677ff'};color:#fff;border-radius:4px;font-size:12px;">${options.label}</div>`,
      direction: 'top',
    });
  }
  map.add(marker);
  return marker;
}

/** 绘制折线（路线） */
export function addPolyline(
  map: any,
  path: [number, number][],
  options: { color?: string; width?: number } = {}
): any {
  const AMap = window.AMap;
  const polyline = new AMap.Polyline({
    path,
    strokeColor: options.color || '#fa8c16',
    strokeWeight: options.width || 4,
    strokeStyle: 'solid',
    lineJoin: 'round',
    showDir: true,    // 显示方向箭头
    geodesic: true,   //  geodesic 曲线（地球曲面上的最短路径）
  });
  map.add(polyline);
  return polyline;
}

/** 自动调整地图视野，确保所有覆盖物都可见 */
export function fitView(map: any, points: [number, number][]): void {
  const AMap = window.AMap;
  if (points.length === 0) return;
  map.setFitView(
    points.map((p) => new AMap.Marker({ position: p })),
    false,
    [60, 60, 60, 60], // 四周留白（像素）
    12                     // 最大缩放级别（避免点太近时 zoom 过大）
  );
}

// ===== 点聚合 =====

/** 创建聚合点模拟数据 */
export function createClusterData(
  city: string,
  count: number = 30
): { lnglat: [number, number]; count: number }[] {
  const center = cityCenters[city] || cityCenters['长沙'];
  const data: { lnglat: [number, number]; count: number }[] = [];
  for (let i = 0; i < count; i++) {
    const lng = center[0] + (Math.random() - 0.5) * 0.2;
    const lat = center[1] + (Math.random() - 0.5) * 0.2;
    data.push({
      lnglat: [lng, lat],
      count: Math.floor(Math.random() * 500) + 50,
    });
  }
  return data;
}

// ===========================================
// 亮点 4-1：距离计算 + 动态缩放
// ===========================================

/**
 * 计算两点之间的直线距离（米）
 * 使用 Haversine 公式（考虑地球曲率）
 * 
 * 【公式原理】
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2(√a, √(1−a))
 * d = R ⋅ c
 * 
 * @param p1 起点 [经度, 纬度]
 * @param p2 终点 [经度, 纬度]
 * @returns 距离（米）
 */
export function calculateDistance(p1: [number, number], p2: [number, number]): number {
  const R = 6371000; // 地球半径（米）
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(p2[1] - p1[1]);
  const dLng = toRad(p2[0] - p1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1[1])) * Math.cos(toRad(p2[1])) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 根据两点距离返回合适的地图缩放级别
 * 
 * 【设计思路】
 * 距离越短 → zoom 越大 → 看得越细（能看到街道、建筑）
 * 距离越长 → zoom 越小 → 看得越广（能看到城市、区域）
 * 
 * 【映射表】
 * < 500m   → zoom 17（街道级，能看到楼）
 * < 2km    → zoom 16（街区级）
 * < 5km    → zoom 15（市区级）
 * < 15km   → zoom 14（城市级）
 * < 50km   → zoom 13（区域级）
 * < 100km  → zoom 12（大区域）
 * < 300km  → zoom 10（省级）
 * ≥ 300km  → zoom 9 （国家级）
 */
export function getZoomByDistance(distanceMeters: number): number {
  if (distanceMeters < 500) return 17;
  if (distanceMeters < 2000) return 16;
  if (distanceMeters < 5000) return 15;
  if (distanceMeters < 15000) return 14;
  if (distanceMeters < 50000) return 13;
  if (distanceMeters < 100000) return 12;
  if (distanceMeters < 300000) return 10;
  return 9;
}

// ===========================================
// 亮点 4-2：模拟路线生成（降级方案）
// ===========================================

/**
 * 在起点和终点之间生成模拟行车路线路径点
 * 
 * 【实现原理】
 * 用正弦波产生垂直于直线方向的偏移，模拟城市道路转弯效果
 * 两段不同频率的正弦波叠加 → 产生更自然的弯曲（不像单一正弦波那样规律）
 * 
 * 【为什么不用直线？】
 * 真实城市道路很少有纯粹的直线，都是弯弯曲曲的
 * 用正弦波模拟这种弯曲，比画直线看起来真实得多
 * 
 * @param start      起点坐标 [经度, 纬度]
 * @param end        终点坐标 [经度, 纬度]
 * @param numPoints  中间路径点数量（越多越平滑）
 * @returns 包含起点和终点的完整路径点数组
 */
export function generateRoutePath(
  start: [number, number],
  end: [number, number],
  numPoints: number = 8,
): [number, number][] {
  const points: [number, number][] = [start];
  const dLng = end[0] - start[0];
  const dLat = end[1] - start[1];
  const totalDist = Math.sqrt(dLng * dLng + dLat * dLat);

  // 计算垂直方向单位向量（用于正弦波偏移方向）
  const perpX = -dLat / (totalDist || 1);
  const perpY = dLng / (totalDist || 1);

  for (let i = 1; i <= numPoints; i++) {
    const t = i / (numPoints + 1);

    // 沿直线的基础插值
    const baseLng = start[0] + dLng * t;
    const baseLat = start[1] + dLat * t;

    // 【关键】两段不同频率的正弦波叠加，产生自然弯曲
    const amplitude = totalDist * 0.18;       // 振幅 = 总距离 × 18%
    const offset1 = Math.sin(t * Math.PI * 2.8) * amplitude;   // 低频波
    const offset2 = Math.sin(t * Math.PI * 5.3) * amplitude * 0.3; // 高频波（振幅更小）

    const lng = baseLng + (offset1 + offset2) * perpX;
    const lat = baseLat + (offset1 + offset2) * perpY;

    points.push([lng, lat]);
  }

  points.push(end);
  return points;
}

// ===========================================
// 亮点 4-3：真实路线规划（高德 API）
// ===========================================

/**
 * 调用高德驾车路线规划 API 获取真实行车路线坐标点
 * 
 * 【API 说明】
 * 接口：https://restapi.amap.com/v3/direction/driving
 * 参数：
 *   - key：Web 服务 API Key
 *   - origin：起点坐标 "经度,纬度"
 *   - destination：终点坐标 "经度,纬度"
 *   - extensions=all：获取完整路线坐标（不只是概况）
 *   - strategy=0：速度优先（0=速度最快，2=最短距离）
 * 
 * 【返回数据结构】
 * data.route.paths[0].steps[].polyline
 *   → "lng,lat;lng,lat;..." 格式的字符串
 * 
 * 【自动降级】
 * 如果 API 调用失败（网络错误/Key 失效/超限），
 * 自动切换到 generateRoutePath 模拟路线，确保功能不中断
 * 
 * @param start 起点 [经度, 纬度]
 * @param end   终点 [经度, 纬度]
 * @returns 路线坐标点数组（自动抽稀，避免点数过多）
 */
export async function fetchRealRoutePath(
  start: [number, number],
  end: [number, number],
): Promise<[number, number][]> {
  try {
    // 组装 API 请求 URL
    const url =
      `https://restapi.amap.com/v3/direction/driving?` +
      `key=${AMAP_KEY}` +
      `&origin=${start[0]},${start[1]}` +
      `&destination=${end[0]},${end[1]}` +
      `&extensions=all` +           // 获取完整路线坐标
      `&strategy=0`;                // 速度优先

    const res = await fetch(url);
    const data = await res.json();

    // 高德 API 返回 status='1' 表示成功
    if (data.status === '1' && data.route?.paths?.length > 0) {
      const points: [number, number][] = [];
      const steps = data.route.paths[0].steps as any[];

      // 解析所有步骤的 polyline，拼接成完整路线
      for (const step of steps) {
        const coords = step.polyline.split(';');
        for (const coord of coords) {
          const [lng, lat] = coord.split(',').map(Number);
          if (lng && lat) {
            points.push([lng, lat]);
          }
        }
      }

      // 【关键】点数过多时自动抽稀（每 3 个点取 1 个）
      // 避免渲染压力（高德 API 可能返回上千个坐标点）
      if (points.length > 200) {
        return points.filter((_, i) => i % 3 === 0);
      }
      return points;
    }
    throw new Error('API 返回空路线');
  } catch (err) {
    // 【降级策略】API 失败时，自动切换到模拟路线
    console.warn('高德路线 API 调用失败，降级为模拟路线:', err);
    return generateRoutePath(start, end, 12);
  }
}

// ===========================================
// 亮点 4-4：点聚合（MarkerCluster）
// ===========================================

/**
 * 初始化点聚合图层
 * 
 * 【功能说明】
 * 当地图上标点过多时，自动聚合为圆圈，
 * 圆圈大小/颜色根据聚合数量动态变化
 * 
 * 【聚合级别】
 * ≥ 500 → 红色，直径 50px（高危区域）
 * ≥ 200 → 橙色，直径 42px
 * ≥ 100 → 蓝色，直径 36px
 * < 100 → 绿色，直径 30px（单个点）
 */
export async function initMarkerCluster(
  map: any,
  points: { lnglat: [number, number]; count: number }[]
): Promise<any> {
  const AMap = window.AMap;
  
  // 加载 MarkerCluster 插件（异步）
  await new Promise<void>((resolve) => {
    AMap.plugin(['AMap.MarkerCluster'], () => resolve());
  });

  const cluster = new AMap.MarkerCluster(map, points, {
    gridSize: 60, // 聚合网格大小（像素），越小聚合越细
    
    // 自定义聚合点的渲染样式
    renderClusterMarker(context: any) {
      const count = context.count;
      let color = '#52c41a'; // 默认绿色
      let size = 30;
      if (count >= 500) { color = '#ff4d4f'; size = 50; }  // 红色（高危）
      else if (count >= 200) { color = '#fa8c16'; size = 42; } // 橙色（警告）
      else if (count >= 100) { color = '#1890ff'; size = 36; } // 蓝色（注意）
      // 绿色（正常）已在默认值设置

      const div = document.createElement('div');
      div.style.cssText = `
        width:${size}px;height:${size}px;
        background:${color};border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:12px;font-weight:bold;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:2px solid #fff;
      `;
      div.textContent = count;
      context.marker.setContent(div);
    },
    
    // 单个散点的渲染样式
    renderMarker(context: any) {
      const div = document.createElement('div');
      div.style.cssText = `
        width:14px;height:14px;
        background:#1890ff;border-radius:50%;
        border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
      `;
      context.marker.setContent(div);
    },
  });

  return cluster;
}
