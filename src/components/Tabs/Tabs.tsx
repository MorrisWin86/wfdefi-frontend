/** @jsxImportSource @emotion/react */

import React from "react";
import { Tabs as ANTDTabs, TabsProps } from "antd";
import styled from "@emotion/styled";
const { TabPane } = ANTDTabs;

const TabsStyled = styled(ANTDTabs)`
  .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    color: ${({ theme }) => theme.primary.normal};
  }
  &.ant-tabs-top > .ant-tabs-nav::before,
  .ant-tabs-bottom > .ant-tabs-nav::before,
  .ant-tabs-top > div > .ant-tabs-nav::before,
  .ant-tabs-bottom > div > .ant-tabs-nav::before {
    border-bottom-color: ${({ theme }) => theme.useColorModeValue(theme.primary.deep1, theme.white.normal2)};
  }
  .ant-tabs-tab {
    color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal5, theme.white.normal7)};
    font-size: 18px;
    font-weight: 600;
    &:hover {
      color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal5, theme.white.normal7)};
    }
  }
  .ant-tabs-ink-bar {
    background-color: ${({ theme }) => theme.primary.normal};
    /* width: 32px !important; */
    margin: 0 auto;
  }
  &.ant-tabs-top > .ant-tabs-nav .ant-tabs-ink-bar,
  .ant-tabs-bottom > .ant-tabs-nav .ant-tabs-ink-bar,
  .ant-tabs-top > div > .ant-tabs-nav .ant-tabs-ink-bar,
  .ant-tabs-bottom > div > .ant-tabs-nav .ant-tabs-ink-bar {
    height: 4px;
  }
  &.ant-tabs-top > .ant-tabs-nav,
  .ant-tabs-bottom > .ant-tabs-nav,
  .ant-tabs-top > div > .ant-tabs-nav,
  .ant-tabs-bottom > div > .ant-tabs-nav {
    margin-bottom: 32px;
  }
`;

type TProps = TabsProps;

const Tabs: React.FC<TProps> = ({ children, ...props }) => {
  return <TabsStyled {...props}>{children}</TabsStyled>;
};

export default Tabs;
export { TabPane };
