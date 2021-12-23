/** @jsxImportSource @emotion/react */

import styled from "@emotion/styled";
import useScrollTop from "hooks/useScrollTop";
import React, { memo } from "react";
import { injectIntl, WrappedComponentProps } from "react-intl";
import { useHistory } from "react-router";
import { LinearGradientSubtract } from "styles";

const Wrapper = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 48px;
`;

const Label = styled.div`
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.useColorModeValue(theme.primary.deep1, theme.white.normal1)};
  font-size: 20px;
  line-height: 125%;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal7, theme.white.normal7)};
`;

const CardGroup = styled.div`
  display: grid;
  column-gap: 35px;
  row-gap: 24px;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas: "a b c";
  position: relative;
  @media screen and (max-width: 876px) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "a b";
  }

  @media screen and (max-width: 512px) {
    grid-template-columns: auto;
    grid-template-areas: "a";
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.useColorModeValue(theme.white.normal5, theme.dark.block5)};
  border-radius: 24px;
  padding: 19px 16px 22px;
  filter: drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.02));
  cursor: pointer;
  transition: transform 0.5s;
  :hover {
    transform: translateY(-10px);
  }
`;

const LinearGradientSubtractWrapper = styled(LinearGradientSubtract)`
  position: absolute;
  top: 0;
  left: -140px;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  span {
    margin-right: 10px;
    font-weight: 600;
    font-size: 16px;
    line-height: 125%;
    color: ${({ theme }) => theme.background.iconfont};
  }
`;

const IconGroup = styled.div`
  display: flex;
  img {
    width: 44px;
    height: 44px;
    background: ${({ theme }) => theme.white.normal};
    border-radius: 50%;
    padding: 11px;
  }
`;

const LabelLP = styled.div`
  font-size: 20px;
  line-height: 125%;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal85, theme.white.normal85)};
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.useColorModeValue(theme.gray.normal04, theme.white.normal08)};
`;

const DataWrapper = styled.div`
  display: flex;
  justify-content: space-between;

  div {
    display: grid;
    gap: 8px;
    grid-auto-flow: row;
    p {
      font-size: 12px;
      line-height: 125%;
      color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal5, theme.white.normal5)};
    }
    span {
      font-size: 16px;
      line-height: 125%;
      color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal85, theme.white.normal85)};
      font-weight: bold;
    }
  }
`;

type TProps = WrappedComponentProps;

const FarmContainer = memo<TProps>(({ intl }) => {
  const { push } = useHistory();

  return (
    <Wrapper>
      <Label>{intl.formatMessage({ defaultMessage: "Farming WTF" })}</Label>
      <CardGroup>
        <LinearGradientSubtractWrapper />
        {[1, 2, 3, 4].map((p) => (
          <Card
            key={p}
            onClick={() => {
              push({ pathname: `/stake/farming/${p}` });
            }}
          >
            <IconWrapper>
              <IconGroup>
                <img src="https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png?v=013" />
                <img
                  src="https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=013"
                  css={{ transform: "translateX(-11px)" }}
                />
              </IconGroup>
              <span>WTF</span>
            </IconWrapper>
            <LabelLP>WTF-BUSD LP</LabelLP>
            <DataWrapper>
              <div>
                <p>{intl.formatMessage({ defaultMessage: "Total Stake" })}</p>
                <span>1,000,000</span>
              </div>
              <div>
                <p>{intl.formatMessage({ defaultMessage: "APR" })}</p>
                <span>736%</span>
              </div>
              <div>
                <p>{intl.formatMessage({ defaultMessage: "Your stake" })}</p>
                <span>0</span>
              </div>
            </DataWrapper>
          </Card>
        ))}
      </CardGroup>
    </Wrapper>
  );
});

export default injectIntl(FarmContainer);
