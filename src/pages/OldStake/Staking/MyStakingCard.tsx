/** @jsxImportSource @emotion/react */

import styled from "@emotion/styled";
import { useWeb3React } from "@web3-react/core";
import React, { memo } from "react";
import { injectIntl, WrappedComponentProps } from "react-intl";
import { useGetLockingWTF } from "../hooks/useGetLockingWTF";
import { Web3Provider } from "@ethersproject/providers";
import { useTheme } from "@emotion/react";
import dayjs from "dayjs";
import { useWTFPriceLP } from "hooks/useWTFfromLP";
import numeral from "numeral";
import { useParams } from "react-router";
import Stakings from "config/staking";
import { useEarningTokenTotalSupply } from "hooks/useStaking";
import { useBalance, useTotalSupply } from "hooks";
import { StakingConfig } from "types";

type UrlParams = {
  id: string;
};

const Wrapper = styled.div`
  border-top: 1px solid ${({ theme }) => theme.primary.deep2};
  padding: 31px 0 0 60px;
  filter: drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.02));
  display: grid;
  gap: 24px;
  grid-template-areas: "a b c d e";
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal7, theme.white.normal7)};
  margin-bottom: 150px;

  @media screen and (max-width: 1000px) {
    grid-template-areas:
      "a a b b"
      "c c d e";
  }

  @media screen and (max-width: 580px) {
    grid-template-areas:
      "a a"
      "b b"
      "c c"
      "d e";
  }

  span {
    display: block;
    font-size: 14px;
    line-height: 125%;
    margin-bottom: 11px;
    white-space: nowrap;
  }
  p {
    font-weight: bold;
    font-size: 20px;
    line-height: 125%;
    color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal85, theme.white.normal85)};
    margin-bottom: 11px;
  }
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
`;

type TProps = WrappedComponentProps & {
  stakingConfig: StakingConfig;
};
const MyStakingCard = memo<TProps>(({ intl, stakingConfig }) => {
  const { primary } = useTheme();
  const { account } = useWeb3React<Web3Provider>();
  const { total: lockingWTF, expiryTimestamp } = useGetLockingWTF(account);
  const { price } = useWTFPriceLP();
  const { id } = useParams<UrlParams>();
  const { balance: VeWTFBalance } = useBalance(stakingConfig.earningTokenAddress);
  const VeWTFTotalSupply = useTotalSupply(stakingConfig.earningTokenAddress);
  return (
    <Wrapper>
      <Block css={{ gridArea: "a" }}>
        <div>
          <span>{intl.formatMessage({ defaultMessage: "Locking" })}（WTF）</span>
          <p>{lockingWTF}</p>
          <span>
            $ {price && lockingWTF ? numeral(parseFloat(price) * parseFloat(lockingWTF)).format("0,0.[0000]") : "-"}
          </span>
        </div>
      </Block>
      <Block css={{ gridArea: "b" }}>
        <div>
          <span>{intl.formatMessage({ defaultMessage: "Expire date" })}</span>
          <p>{expiryTimestamp !== "0" ? dayjs.unix(Number(expiryTimestamp)).format("YYYY-MM-DD HH:mm:ss") : "-"}</p>
        </div>
      </Block>
      <Block css={{ gridArea: "c", borderRight: "1px solid", borderColor: primary.deep2 }}>
        <div>
          <span>{intl.formatMessage({ defaultMessage: "You get Ratio" })}</span>
          <p>0.83%</p>
        </div>
      </Block>
      <Block css={{ gridArea: "d" }}>
        <span>Ve-WTF</span>
        <p>{VeWTFBalance ? numeral(VeWTFBalance).format("0,0.[0000]") : "-"}</p>
        {/* <span>$ 2517.12</span> */}
      </Block>
      <Block css={{ gridArea: "e" }}>
        <span>{intl.formatMessage({ defaultMessage: "Your Share" })}</span>
        <p>
          {VeWTFTotalSupply &&
            VeWTFBalance &&
            numeral((parseFloat(VeWTFBalance) / parseFloat(VeWTFTotalSupply)) * 100).format("0,0.[0000]")}
          %
        </p>
      </Block>
    </Wrapper>
  );
});

export default injectIntl(MyStakingCard);
