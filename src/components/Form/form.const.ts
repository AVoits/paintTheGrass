import { CheckboxGroupProps } from 'antd/es/checkbox';

export const durationTaskOptions: CheckboxGroupProps<string>['options'] = [
  { label: '4ч', value: '4ч' },
  { label: '1д', value: '1д' },
  { label: '1д 4ч', value: '1д 4ч' },
  { label: '2д', value: '2д' },
  { label: '2д 4ч', value: '2д 4ч' },
  { label: '3д', value: '3д' },
];
