/** @jsxImportSource @emotion/react */

import styled from "@emotion/styled";
import { memo, useMemo } from "react";
import { injectIntl, WrappedComponentProps } from "react-intl";
import Separator from "components/Separator/Separator";
import { useTheme } from "@emotion/react";
import { Market, Tranche } from "types";
import {
  formatAPY,
  formatAllocPoint,
  formatTVL,
  formatNumberSeparator,
  getJuniorAPY,
  getRemaining,
  compareNum,
  getPercentage,
  getWTFApr
} from "utils/formatNumbers";
import { CheckIcon } from "assets/images";
import { FlexRow } from "styles";
import { useWTFPrice } from "hooks/useSelectors";
import { useWTFPriceLP } from "hooks/useWTFfromLP";

type TProps = WrappedComponentProps & {
  color?: string;
  type: "Senior" | "Mezzanine" | "Junior";
  tranche: Tranche;
  // pool: Pool;
  totalAllocPoint: string | undefined;
  trancheIndex: number;
  assets: string;
  selected: boolean;
  data: Market;
  allocPoint: string;
};

type ProgressBarProps = {
  percentage: string;
};

const TrancheName = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal7, theme.white.normal7)};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Text2 = styled.div`
  font-size: 16px;
  line-height: 22px;
  color: ${({ color }) => color};
  margin: 10px 0;
`;
const Text3 = styled.div`
  font-size: 12px;
  line-height: 125%;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal5, theme.white.normal7)};
`;
const Text4 = styled.div`
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal7, theme.white.normal7)};
`;

const StatusDiv = styled.div`
  display: flex;
  justify-content: space-between;
`;
const Dot = styled.div`
  background-color: ${({ color }) => color};
  width: 8px;
  height: 8px;
  border-radius: 100%;
  margin-right: 5px;
`;
const SoldOut = styled.div`
  font-size: 14px;
  width: 75px;
  height: 30px;
  border: 2px solid ${({ theme }) => theme.tags.redText};
  color: ${({ theme }) => theme.tags.redText};
  box-sizing: border-box;
  border-radius: 4px;
  transform: rotate(-30deg);
  position: absolute;
  left: -20px;
  top: -9px;
  text-align: center;
  line-height: 30px;
  background-color: ${({ theme }) => theme.useColorModeValue(theme.white.normal, theme.dark.block)};
  z-index: 11;
`;
const Container = styled.div`
  padding: 20px;
  height: 100%;
  position: relative;
  cursor: pointer;
  border: ${({ theme }) => theme.table.border};
  box-sizing: border-box;
  border-radius: 8px;
  background: ${({ theme }) => theme.useColorModeValue(theme.white.normal, theme.dark.block)};
  &[data-disabled="false"][data-selected="true"] {
    border-color: ${({ theme }) => theme.primary.deep};
    background: ${({ theme }) => theme.useColorModeValue(theme.primary.lightBrown, theme.dark.block)};
  }

  &[data-disabled="false"] {
    :hover {
      background: ${({ theme }) => theme.useColorModeValue(theme.primary.lightBrown, theme.dark.block)};
    }
  }

  &[data-disabled="true"] {
    opacity: 0.5;
    cursor: default;
  }
  @media screen and (max-width: 768px) {
    & {
      height: auto;
    }
  }
`;
const ProgressBar = styled.div<ProgressBarProps>`
  margin: 10px 0;
  border-radius: 2px;
  width: 100%;
  height: 6px;
  position: relative;
  background-color: ${({ theme }) => theme.useColorModeValue(theme.primary.lightBrown, theme.white.normal2)};
  &:after {
    content: "";
    background-color: ${({ color }) => color};
    width: ${({ percentage }) => percentage}%;
    height: 6px;
    position: absolute;
  }
`;

const TranchesCard = memo<TProps>(
  ({ intl, type, tranche, totalAllocPoint, assets, selected, data, allocPoint, trancheIndex }) => {
    const { tags, primary, gray } = useTheme();
    const Types = {
      Senior: {
        color: tags.yellowText,
        text: intl.formatMessage({ defaultMessage: "Senior" }),
        riskText: "Low Risk ; Fixed"
      },
      Mezzanine: {
        color: tags.greenText,
        text: intl.formatMessage({ defaultMessage: "Mezzanine" }),
        riskText: "Medium Risk ; Fixed"
      },
      Junior: {
        color: primary.deep,
        text: intl.formatMessage({ defaultMessage: "Junior" }),
        riskText: "Multiple Leverage ; Variable"
      }
    };
    const isSoldout = useMemo(() => compareNum(tranche.principal, tranche.target), [tranche.principal, tranche.target]);
    const trancheApr = tranche.apy;
    // const wtfPrice = useWTFPrice();
    const { price: wtfPrice } = useWTFPriceLP();

    const wtfApr = data
      ? getWTFApr(
          formatAllocPoint(data?.pools[trancheIndex], data?.totalAllocPoints),
          data?.tranches[trancheIndex],
          data?.duration,
          data?.rewardPerBlock,
          wtfPrice
        )
      : "-";
    return (
      <Container data-selected={selected} data-disabled={isSoldout}>
        {isSoldout ? <SoldOut>{intl.formatMessage({ defaultMessage: "Sold out" })}</SoldOut> : null}
        <div>
          <TrancheName>
            <FlexRow>
              <Dot color={Types[type].color} />
              {Types[type].text}
            </FlexRow>
            <CheckIcon css={{ color: selected ? primary.deep : gray.normal3 }} />
          </TrancheName>
          <Text2 color={Types[type].color}>
            APR {trancheApr}% + {wtfApr}% WTF
          </Text2>
          <Text3>{Types[type].riskText}</Text3>
          <Separator margin={15} />
          <StatusDiv>
            <Text3>
              TVL: {parseFloat(formatNumberSeparator(formatTVL(tranche.principal)))} {assets}
            </Text3>
            <Text4>
              Remaining:{parseFloat(getRemaining(tranche?.target, tranche?.principal))} {assets}
            </Text4>
          </StatusDiv>
          <ProgressBar color={Types[type].color} percentage={getPercentage(tranche.principal, tranche.target)} />
        </div>
      </Container>
    );
  }
);

export default injectIntl(TranchesCard);
