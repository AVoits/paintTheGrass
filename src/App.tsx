import React, { useMemo, useState } from 'react';

import locale from 'antd/locale/ru_RU';
import './App.css';
import LayoutBlock from './components/Layout/Layout.tsx';
import FormBlock, { FieldType } from './components/Form/Form.tsx';
import { distributeTasks } from './services/schedule/schedule.ts';
import { ScheduleFullResult, TaskInput } from './services/schedule/schedule.types.ts';
import TaskCalendarBlock from './components/TaskCalendar/TaskCalendarBlock.tsx';
import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';
import { Alert, Button, ConfigProvider } from 'antd';
import { themeConfig } from './themeConfig.ts';
import { DownloadOutlined } from '@ant-design/icons';

export function App() {
  const [formData, setFormData] = useState<FieldType>({
    sprint: [],
    tasks: [],
  });

  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const scheduleResult = useMemo((): ScheduleFullResult | undefined => {
    if (!isFormValid) {
      return undefined;
    }

    const periodStart = formData?.sprint?.[0];
    const periodEnd = formData?.sprint?.[1];

    const colorTasks: TaskInput[] = formData?.tasks?.map(({ color: colorSrc, duration, name }) => {
      return {
        duration,
        name,
        color: typeof colorSrc === 'string' ? colorSrc : colorSrc.toCssString(),
      };
    });

    const result = distributeTasks({
      tasks: colorTasks?.filter((el) => Boolean(el.duration && el.name)),
      periodStart,
      periodEnd,
    });

    return { ...result, periodStart, periodEnd };
  }, [formData.sprint, formData.tasks, isFormValid]);

  const onFormChange = (values: FieldType, isFormValid: boolean) => {
    setFormData(values);
    setIsFormValid(isFormValid);
  };

  const warningBlock = useMemo(() => {
    if (!scheduleResult?.warnings?.length) {
      return <Alert title={'Заполните данные для расчета'} type="success" />;
    }

    return scheduleResult?.warnings.map((warning, index) => {
      return <Alert title={warning.message} type="error" key={index} />;
    });
  }, [scheduleResult]);
  return (
    <ConfigProvider locale={locale} theme={themeConfig}>
      <LayoutBlock header={<Header />} footer={<Footer />}>
        <FormBlock onValuesChange={onFormChange} />
        <div className="warnButton">
          <div>{warningBlock}</div>
          <Button
            color="green"
            variant="solid"
            shape="round"
            icon={<DownloadOutlined />}
            size={'large'}
            disabled={Boolean(scheduleResult?.warnings?.length)}
          />
        </div>

        <TaskCalendarBlock schedule={scheduleResult} />
      </LayoutBlock>
    </ConfigProvider>
  );
}
