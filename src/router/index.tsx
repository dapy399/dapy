import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import AuthGuard from './auth';

// 懒加载页面
const Login = lazy(() => import('@/views/login'));
const Dashboard = lazy(() => import('@/views/dashboard'));
const UserManage = lazy(() => import('@/views/system/user'));
const MenuManage = lazy(() => import('@/views/system/menu'));
const RoleManage = lazy(() => import('@/views/system/role'));
const DeptManage = lazy(() => import('@/views/system/dept'));
const OrderList = lazy(() => import('@/views/order/list'));
const OrderCluster = lazy(() => import('@/views/order/cluster'));
const DriverList = lazy(() => import('@/views/order/driver'));

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />}>
    {children}
  </Suspense>
);

export const routes = [
  {
    path: '/login',
    element: (
      <LazyLoad>
        <Login />
      </LazyLoad>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <LazyLoad>
            <Dashboard />
          </LazyLoad>
        ),
      },
      {
        path: 'system',
        children: [
          { path: 'user', element: <LazyLoad><UserManage /></LazyLoad> },
          { path: 'menu', element: <LazyLoad><MenuManage /></LazyLoad> },
          { path: 'role', element: <LazyLoad><RoleManage /></LazyLoad> },
          { path: 'dept', element: <LazyLoad><DeptManage /></LazyLoad> },
        ],
      },
      {
        path: 'order',
        children: [
          { path: 'list', element: <LazyLoad><OrderList /></LazyLoad> },
          { path: 'cluster', element: <LazyLoad><OrderCluster /></LazyLoad> },
          { path: 'driver', element: <LazyLoad><DriverList /></LazyLoad> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
];

const router = createBrowserRouter(routes);

export default router;
