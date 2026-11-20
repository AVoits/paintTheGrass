import React from 'react';
import { Layout } from 'antd';

const { Header, Footer, Content } = Layout;

import './Layout.css';

interface LayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

const LayoutBlock = ({ children, header, footer }: LayoutProps) => {
  return (
    <Layout className="layout">
      <Header className="header">{header}</Header>
      <Content className="content">{children}</Content>
      <Footer className="footer">{footer}</Footer>
    </Layout>
  );
};

export default LayoutBlock;
