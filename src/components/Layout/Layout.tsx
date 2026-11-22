import React from 'react';
import './Layout.css';
import { Layout } from 'antd';

const { Header, Content, Footer } = Layout;

interface LayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

const LayoutBlock = ({ children, header, footer }: LayoutProps) => {
  return (
    <Layout className="layout">
      <Header className="header">{header}</Header>
      <div className="scrollArea">
        <Content className="content">{children}</Content>
      </div>
      <Footer className="footer">{footer}</Footer>
    </Layout>
  );
};

export default LayoutBlock;
