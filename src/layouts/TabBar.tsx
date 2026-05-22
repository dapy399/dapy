import { Tabs, theme as antTheme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/index';

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const {
    token: { colorBgContainer },
  } = antTheme.useToken();

  const handleChange = (key: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: key });
    navigate(key);
  };

  const handleClose = (targetKey: string) => {
    const currentIndex = state.tabs.findIndex((tab) => tab.key === targetKey);
    const newTabs = state.tabs.filter((tab) => tab.key !== targetKey);
    
    let activeKey = state.activeTabKey;
    if (activeKey === targetKey && newTabs.length > 0) {
      // 关闭当前标签，切换到左侧或右侧标签
      const newIndex = Math.min(currentIndex, newTabs.length - 1);
      activeKey = newTabs[Math.max(0, newIndex)].key;
      navigate(activeKey);
    }
    
    dispatch({ type: 'REMOVE_TAB', payload: targetKey });
    if (activeKey !== state.activeTabKey) {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: activeKey });
    }
  };

  if (state.tabs.length === 0) return null;

  return (
    <div style={{ background: colorBgContainer, borderBottom: '1px solid #f0f0f0' }}>
      <Tabs
        activeKey={state.activeTabKey}
        onChange={handleChange}
        type="editable-card"
        hideAdd
        size="small"
        items={state.tabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          closable: tab.closable,
        }))}
        onEdit={(targetKey, action) => {
          if (action === 'remove') {
            handleClose(targetKey as string);
          }
        }}
      />
    </div>
  );
};

export default TabBar;
