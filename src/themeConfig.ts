import { theme } from 'antd';
import { ThemeConfig } from 'antd/es/config-provider/context';

export const themeConfig: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  components: {
    Layout: {
      headerBg: '#232323',
    },
  },
  token: {
    colorPrimary: '#3a3a3a',
    colorInfo: '#3a3a3a',
  },
};
