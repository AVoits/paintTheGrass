import React from 'react';
import { Alert, DatePicker, DatePickerProps, Divider, FormProps, Radio, Tag, theme } from 'antd';
import { Button, Form, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

import './form.css';
import dayjs, { Dayjs } from 'dayjs';
import { getProductionState } from '../../services/productionCalendar/helpers.ts';
import { durationTaskOptions } from './form.const.ts';
import { TaskInput } from '../../services/schedule/schedule.types.ts';

export type FieldType = {
  sprint: Dayjs[];
  tasks: TaskInput[];
};

interface FormBlockProps {
  onFinish: (values: FieldType) => void;
}

const initialTestData: FieldType = {
  sprint: [dayjs(), dayjs().add(14, 'd')],
  tasks: [
    { name: '111', duration: '4ч' },
    { name: '222', duration: '2д 4ч' },
    { name: '333', duration: '1д' },
    { name: '444', duration: '1д 4ч' },
  ],
};

const FormBlock = ({ onFinish }: FormBlockProps) => {
  const { token } = theme.useToken();

  const onFinishForm: FormProps<FieldType>['onFinish'] = (values) => {
    console.log('Success:', values);
    onFinish(values);
  };

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const styleHolidays: React.CSSProperties = {
    backgroundColor: `${token.green}`,
  };

  const styleWorkingWeekends: React.CSSProperties = {
    border: `${token.lineWidth}px ${token.lineType} ${token.magenta}`,
    backgroundColor: `${token.magenta4}`,
  };

  const styleShortDays: React.CSSProperties = {
    border: `${token.lineWidth}px ${token.lineType} ${token.green}`,
  };

  const cellRender: DatePickerProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type !== 'date') {
      return info.originNode;
    }

    if (typeof current === 'number' || typeof current === 'string') {
      return <div className="ant-picker-cell-inner">{current}</div>;
    }

    const state = getProductionState(current);

    let currentStyle = undefined;
    if (state.holidays) {
      currentStyle = styleHolidays;
    }
    if (state.shortDays) {
      currentStyle = styleShortDays;
    }
    if (state.workingWeekends) {
      currentStyle = styleWorkingWeekends;
    }

    return (
      <div className="ant-picker-cell-inner" style={currentStyle}>
        {current.date()}
      </div>
    );
  };

  return (
    <Form
      name="basic"
      initialValues={initialTestData}
      onFinish={onFinishForm}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
      className="form"
    >
      <Form.Item<FieldType>
        label={'Спринт'}
        name={'sprint'}
        required={true}
        rules={[{ required: true, message: 'Выберите длительность спринта' }]}
      >
        <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" cellRender={cellRender} />
      </Form.Item>
      <Divider variant="solid" className="divider" />
      <Form.List
        name="tasks"
        rules={[
          {
            validator: async (_, names) => {
              if (!names || names.length < 1) {
                return Promise.reject(new Error('Ну хоть одну задачу-то добавь!'));
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => {
          const errorsBlock = errors.map((el, index) => (
            <Alert title={el} type="error" key={index} />
          ));

          return (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} className="block">
                  <Tag variant="outlined" style={{ flexGrow: 0 }}>
                    {index + 1}
                  </Tag>
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    required={true}
                    rules={[{ required: true, message: 'Укажите название задачи' }]}
                  >
                    <Input placeholder="Название задачи, например 101010" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    required={true}
                    name={[name, 'duration']}
                    rules={[{ required: true, message: 'Укажите длительность задачи' }]}
                  >
                    <Radio.Group
                      block
                      options={durationTaskOptions}
                      optionType="button"
                      buttonStyle="solid"
                    />
                  </Form.Item>
                  <Button
                    shape="circle"
                    color="red"
                    variant="filled"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                    style={{ flexGrow: 0 }}
                  />
                </div>
              ))}
              <Form.ErrorList errors={errorsBlock} className="errorBlock" />
              <Form.Item className="addButton">
                <Button
                  color="default"
                  variant="solid"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  Добавить задачу
                </Button>
              </Form.Item>
            </>
          );
        }}
      </Form.List>
      <Form.Item label={null}>
        <Button htmlType="submit" color="green" variant="solid">
          Рассчитать календарь
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormBlock;
