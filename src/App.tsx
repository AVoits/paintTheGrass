import React, { useMemo, useState } from 'react';

import locale from 'antd/locale/ru_RU';
import './App.css';
import LayoutBlock from './components/Layout/Layout.tsx';
import FormBlock, { FieldType } from './components/Form/Form.tsx';
import { distributeTasks } from './services/schedule/distributeTasks.ts';
import { ScheduleFullResult, TaskInput } from './services/schedule/schedule.types.ts';
import TaskCalendarBlock from './components/TaskCalendar/TaskCalendarBlock.tsx';
import Header from './components/Header/Header.tsx';
import Footer from './components/Footer/Footer.tsx';
import { Alert, Button, ConfigProvider, message } from 'antd';
import { themeConfig } from './themeConfig.ts';
import { DownloadOutlined } from '@ant-design/icons';
import { exportScheduleToIcs } from './services/export/IcsExporter.ts';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [formData, setFormData] = useState<FieldType>(() => ({
    sprint: [dayjs(), dayjs()],
    tasks: [],
  }));

  const success = () => {
    void messageApi.open({
      type: 'success',
      content: 'Календарь выгружен',
    });
  };

  const warning = () => {
    void messageApi.open({
      type: 'warning',
      content: 'Не получилось выгрузить календарь',
    });
  };

  const scheduleResult = useMemo(():
    (ScheduleFullResult & { unscheduledRows: ReadonlySet<number> }) | undefined => {
    const [periodStart, periodEnd] = formData.sprint ?? [];

    if (!periodStart?.isValid() || !periodEnd?.isValid()) {
      return undefined;
    }

    const taskRows = (formData.tasks ?? [])
      .map((task, rowIndex) => ({ task, rowIndex }))
      .filter(({ task }) => task.name?.trim() && task.duration);

    const tasks: TaskInput[] = taskRows.map(({ task: { name, duration, color } }) => ({
      name: name.trim(),
      duration,
      color: typeof color === 'string' ? color : (color?.toCssString() ?? 'blue'),
    }));

    const result = distributeTasks({
      tasks,
      periodStart,
      periodEnd,
    });

    return {
      ...result,
      periodStart,
      periodEnd,
      unscheduledRows: new Set(
        result.unscheduled.map(({ originalIndex }) => taskRows[originalIndex].rowIndex),
      ),
    };
  }, [formData]);

  const onFormChange = (values: FieldType) => {
    setFormData(values);
  };

  const hasTasks = formData.tasks.some((task) => task.name?.trim() && task.duration);

  const isFullyDistributed =
    hasTasks &&
    Boolean(scheduleResult) &&
    scheduleResult?.unscheduled.length === 0 &&
    scheduleResult?.warnings.length === 0;

  const warningBlock = scheduleResult?.warnings.length
    ? scheduleResult.warnings.map((warning, index) => (
        <Alert
          title={warning.message}
          type={warning.type === 'overflow' ? 'error' : 'warning'}
          key={`${warning.type}-${index}`}
        />
      ))
    : null;

  const exportCalendar = () => {
    if (scheduleResult) {
      const { periodStart, periodEnd, tasks } = scheduleResult;
      const startDate = periodStart.format('DD.MM.YYYY');
      const endDate = periodEnd.format('DD.MM.YYYY');
      exportScheduleToIcs(scheduleResult, `sprint_${startDate}-${endDate}_${tasks.length}.ics`);
      success();
    } else {
      warning();
    }
  };

  return (
    <ConfigProvider locale={locale} theme={themeConfig}>
      {contextHolder}
      <LayoutBlock header={<Header />} footer={<Footer />}>
        <FormBlock
          onValuesChange={onFormChange}
          initialValues={formData}
          unscheduledRows={scheduleResult?.unscheduledRows}
        />
        <div className="actionWrapper">
          <div className="warnButton">{warningBlock}</div>
          <Button
            className="downloadButton"
            color={isFullyDistributed ? 'green' : 'orange'}
            variant="solid"
            shape="round"
            icon={<DownloadOutlined />}
            size="large"
            disabled={!hasTasks || !scheduleResult}
            onClick={exportCalendar}
          >
            iCalendar (.ics)
          </Button>
        </div>

        <TaskCalendarBlock schedule={scheduleResult} />
      </LayoutBlock>
    </ConfigProvider>
  );
}
