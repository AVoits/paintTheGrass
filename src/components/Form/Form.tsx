import React, { useMemo } from 'react';
import {
  Alert,
  ColorPicker,
  DatePicker,
  DatePickerProps,
  Divider,
  FormProps,
  Radio,
  Tag,
  theme,
} from 'antd';
import { Button, Form, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

import './form.css';
import { Dayjs } from 'dayjs';
import { getProductionState } from '../../services/productionCalendar/helpers.ts';
import { durationTaskOptions } from './form.const.ts';
import { createTaskColorGenerator } from '../../services/schedule/taskColorGenerator.ts';
import { FieldData } from '@rc-component/form/es/interface';
import { Color } from 'antd/lib/color-picker';

export type FormTaskInput = {
  name: string;
  duration: string;
  color: Color;
};

export type FieldType = {
  sprint: Dayjs[];
  tasks: FormTaskInput[];
};

interface FormBlockProps {
  onValuesChange: (values: FieldType, isFormValid: boolean) => void;
}

const FormBlock = ({ onValuesChange }: FormBlockProps) => {
  const { token } = theme.useToken();
  const colorGenerator = useMemo(() => createTaskColorGenerator(token), [token]);
  const [form] = Form.useForm<FieldType>();
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

  const onFormChange = () => {
    const isFormValid = form.getFieldsError().every(({ errors }) => errors.length === 0);
    const formCurrent = form.getFieldsValue(true);
    onValuesChange(formCurrent, isFormValid);
  };

  return (
    <Form<FieldType> autoComplete="off" className="form" form={form} onValuesChange={onFormChange}>
      <Form.Item<FieldType>
        label={'Спринт'}
        name={'sprint'}
        required={false}
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
                  <Tag variant="outlined">{index + 1}</Tag>
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    required={true}
                    rules={[{ required: true, message: 'Укажите название задачи' }]}
                  >
                    <Input placeholder="Название задачи" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'color']}>
                    <ColorPicker size="small" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    required={true}
                    name={[name, 'duration']}
                    rules={[{ required: true, message: 'Укажите длительность задачи' }]}
                    className="block_grow"
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
                  />
                </div>
              ))}
              <Form.ErrorList errors={errorsBlock} className="errorBlock" />
              <Form.Item className="addButton">
                <Button
                  color="default"
                  variant="solid"
                  onClick={() => {
                    const color = colorGenerator.getNext();
                    add({ color });
                  }}
                  icon={<PlusOutlined />}
                >
                  Добавить задачу
                </Button>
              </Form.Item>
            </>
          );
        }}
      </Form.List>
      {/*<Form.Item label={null}>*/}
      {/*  <Button htmlType="submit" color="green" variant="solid">*/}
      {/*    Рассчитать календарь*/}
      {/*  </Button>*/}
      {/*</Form.Item>*/}
    </Form>
  );
};

export default FormBlock;
