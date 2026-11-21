import { FormatPainterFilled } from '@ant-design/icons';
import { Flex } from 'antd';

import './Header.css';

const Header = () => {
  return (
    <Flex gap="medium" align="center" justify="space-around">
      <FormatPainterFilled className="iconRed" />
      <h1 className="gradient-text">Paint the grass</h1>
      <FormatPainterFilled className="iconGreen" />
    </Flex>
  );
};

export default Header;
