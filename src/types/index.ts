// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  roleId: number;
  status: number;
  department: string;
  departmentId: number;
  position: string;
  registerTime: string;
  lastLoginTime: string;
}

// 菜单类型
export interface MenuItem {
  id: number;
  parentId: number;
  name: string;
  title: string;
  icon: string;
  type: 'menu' | 'button' | 'page';
  permission: string;
  path: string;
  component: string;
  status: number;
  sort: number;
  children?: MenuItem[];
}

// 角色类型
export interface Role {
  id: number;
  name: string;
  remark: string;
  menuIds: number[];
  createTime: string;
  updateTime: string;
}

// 部门类型
export interface Department {
  id: number;
  parentId: number;
  name: string;
  manager: string;
  createTime: string;
  updateTime: string;
  children?: Department[];
}

// 订单类型
export interface Order {
  id: number;
  orderNo: string;
  city: string;
  startAddress: string;
  endAddress: string;
  orderTime: string;
  price: number;
  status: number;
  username: string;
  driverName: string;
  driverId: number;
  userId: number;
}

// 司机类型
export interface Driver {
  id: number;
  name: string;
  phone: string;
  registerCity: string;
  memberLevel: string;
  driverLevel: string;
  status: number;
  licensePlate: string;
  brand: string;
  vehicleModel: string;
  onlineTimeYesterday: number;
  revenueYesterday: number;
  rating: number;
  behaviorScore: number;
  pushOrdersYesterday: number;
  completedOrdersYesterday: number;
  joinTime: string;
}

// 标签页类型
export interface TabItem {
  key: string;
  label: string;
  path: string;
  closable: boolean;
}

// 地图点位类型
export interface MapPoint {
  lng: number;
  lat: number;
  count?: number;
}
