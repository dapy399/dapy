import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/index';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAppStore();
  const location = useLocation();
  const { token, permissionList } = state;

  // 严格判断：无 token、token 为无效字符串、或权限列表为空时均拦截
  if (
    !token ||
    token === 'null' ||
    token === 'undefined' ||
    token === '' ||
    !permissionList ||
    permissionList.length === 0
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
