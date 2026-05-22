import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider, useAppStore } from '@/store/index';
import router from '@/router/index';
import '@/styles/global.less';

const ThemeWrapper: React.FC = () => {
  const { state } = useAppStore();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: state.theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

function App() {
  return (
    <AppProvider>
      <ThemeWrapper />
    </AppProvider>
  );
}

export default App;
