import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ConfigProvider, Flex, theme } from 'antd';

import { FormatPainterFilled } from '@ant-design/icons';

import locale from 'antd/locale/ru_RU';
import './App.css';
import LayoutBlock from './components/Layout/Layout.tsx';
import FormBlock, { FieldType } from './components/Form/Form.tsx';
import { ThemeConfig } from 'antd/es/config-provider/context';
import { distributeTasks } from './services/schedule/schedule.ts';
import { CalendarBlock } from './components/Calendar/Calendar.tsx';
import { ScheduleFullResult } from './services/schedule/schedule.types.ts';

export function App() {
  const [scheduleResult, setScheduleResult] = useState<ScheduleFullResult>();

  const header = useMemo(() => {
    return (
      <Flex gap="medium" align="center" justify="space-around">
        <FormatPainterFilled className="iconRed" />
        <h1 className="gradient-text">Paint the grass</h1>
        <FormatPainterFilled className="iconGreen" />
      </Flex>
    );
  }, []);

  const footer = useMemo(() => {
    return <div className="gradient-line"></div>;
  }, []);

  const tc: ThemeConfig = {
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

  const getDistributedTasks = useCallback((values: FieldType) => {
    const periodStart = values.sprint[0];
    const periodEnd = values.sprint[1];

    const result = distributeTasks({
      tasks: values.tasks,
      periodStart: values.sprint[0],
      periodEnd: values.sprint[1],
    });

    setScheduleResult({ ...result, periodStart, periodEnd });
  }, []);

  const warningBlock = useMemo(() => {
    if (!scheduleResult?.warnings?.length) {
      return null;
    }

    return scheduleResult?.warnings.map((warning, index) => {
      return <Alert title={warning.message} type="error" key={index} />;
    });
  }, [scheduleResult]);

  return (
    <ConfigProvider locale={locale} theme={tc}>
      <LayoutBlock header={header} footer={footer}>
        <FormBlock onFinish={getDistributedTasks} />
        {warningBlock}
        {scheduleResult && <CalendarBlock schedule={scheduleResult} />}
      </LayoutBlock>
    </ConfigProvider>
  );
}
