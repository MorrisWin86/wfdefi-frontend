/** @jsxImportSource @emotion/react */

import React, { memo } from "react";
import { injectIntl, WrappedComponentProps } from "react-intl";
import styled from "@emotion/styled";
import { TwitterTimelineEmbed } from "react-twitter-embed";
import { useTheme } from "@emotion/react";

const Wrapper = styled.div`
  border-radius: 24px;
  background: ${({ theme }) => theme.useColorModeValue(theme.white.normal, theme.dark.block)};
  filter: drop-shadow(0px 4px 20px rgba(0, 108, 253, 0.04));
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  div:last-child {
    height: 100%;
  }
`;

const Title = styled.div`
  height: 75px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.gray.normal08};
  font-size: 24px;
  line-height: 31px;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal85, theme.white.normal85)};
  font-weight: 500;
`;

type TProps = WrappedComponentProps;

const ContactCard = memo<TProps>(({ intl }) => {
  const { colorMode } = useTheme();
  return (
    <Wrapper>
      <Title>{intl.formatMessage({ defaultMessage: "Announcements" })}</Title>
      {colorMode === "dark" && (
        <TwitterTimelineEmbed
          sourceType="profile"
          screenName="Waterfalldefi"
          theme="dark"
          noHeader
          noFooter
          options={{ height: "100%" }}
          transparent
        />
      )}
      {(!colorMode || colorMode === "light") && (
        <TwitterTimelineEmbed
          sourceType="profile"
          screenName="Waterfalldefi"
          theme="light"
          noHeader
          noFooter
          options={{ height: "100%" }}
          transparent
        />
      )}
    </Wrapper>
  );
});

export default injectIntl(ContactCard);
