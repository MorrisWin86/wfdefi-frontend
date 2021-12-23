/** @jsxImportSource @emotion/react */

import { useTheme } from "@emotion/react";
import React, { memo, useEffect, useMemo } from "react";
import { injectIntl, WrappedComponentProps } from "react-intl";
import Button from "components/Button/Button";
import { useState } from "react";
import Select, { Option } from "components/Select/Select";
import { Table, TableColumn, TableHeaderColumn, TableRow } from "components/Table/Table";
import { CaretDown, Union } from "assets/images";
import Tooltip from "components/Tooltip/Tooltip";
import styled from "@emotion/styled";
import { useSize } from "ahooks";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { MarketList } from "config/market";
import { formatNumberDisplay, formatNumberWithDecimalsDisplay, formatTimestamp } from "utils/formatNumbers";
import BigNumber from "bignumber.js";
import { PORTFOLIO_STATUS, TrancheCycle, UserInvest } from "types";
import Tag from "components/Tag/Tag";
import { useHistoryQuery } from "pages/PortfolioDetails/hooks/useSubgraph";
import NoData from "components/NoData/NoData";
import { IType } from "./Portfolio/components/MyPortfolio/type";
import SparePositionItem from "./SparePositionItem";
import { getPosition } from "store/position";
import { useMarkets, usePosition } from "hooks/useSelectors";
import useRedeemDirect from "./PortfolioDetails/hooks/useRedeemDirect";
import { successNotification } from "utils/notification";
import { useAppDispatch } from "store";
import numeral from "numeral";
import { BIG_TEN } from "utils/bigNumber";
import { useTrancheSnapshot } from "hooks";

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  @media screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    & > div {
      margin-bottom: 20px;
    }
  }
`;

const Segement = styled.div`
  border-radius: 8px;
  padding: 7px 8px;
  border: 1px solid ${({ theme }) => theme.primary.deep2};
  display: grid;
  gap: 5px;
  grid-auto-flow: column;
`;

const SegementBlock = styled.div`
  padding: 6px 16px;
  cursor: pointer;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal7, theme.white.normal7)};
  &[data-actived="true"] {
    border-radius: 8px;
    box-shadow: ${({ theme }) => theme.shadow.positionsTab};
    color: ${({ theme }) => theme.primary.deep};
    background: ${({ theme }) => theme.white.normal};
  }
`;

const SelectGroup = styled.div`
  display: grid;
  gap: 14px;
  grid-auto-flow: column;
  color: ${({ theme }) => theme.useColorModeValue(theme.gray.normal7, theme.white.normal7)};
  title {
    font-size: 12px;
    margin-bottom: 6px;
  }
`;

const NoDataWrapper = styled(NoData)`
  @media screen and (max-width: 768px) {
    display: grid;
    gap: 20px;
    grid-auto-flow: row;
  }
`;

type TProps = WrappedComponentProps;

const SparePositions = memo<TProps>(({ intl }) => {
  const { gray, primary, shadow, linearGradient, white } = useTheme();
  const [activedTab, setActivedTab] = useState<IType>("ALL");
  const [isfolds, setFolds] = useState<{ [key: string]: boolean }>({});
  const [redeemLoading, setRedeemLoading] = useState<{ [key: number]: boolean }>({});
  const { onRedeemDirect } = useRedeemDirect();

  const { width } = useSize(document.body);
  const { account } = useWeb3React<Web3Provider>();
  const [selectedTranche, setSelectedTranche] = useState(-1);
  const [selectedStatus, setSelectedStatus] = useState(-1);

  const position = usePosition();
  // console.log(position);
  const markets = useMarkets();
  const market = markets[0];
  const trancheSnapshot = useTrancheSnapshot(market?.cycle);
  const { userInvests: _userInvests, trancheCycles } = useHistoryQuery(account);
  const dispatch = useAppDispatch();
  useEffect(() => {
    market && account && dispatch(getPosition({ market, account }));
  }, [market, account]);
  let userInvests = _userInvests?.filter((_userInvest: UserInvest) => {
    if (_userInvest?.cycle === Number(market?.cycle) && market?.status === PORTFOLIO_STATUS.PENDING) return false;
    if (_userInvest?.cycle === Number(market?.cycle) && market?.status === PORTFOLIO_STATUS.ACTIVE) return false;
    return true;
  });

  for (let i = 0; i < position.length; i++) {
    const _cycle = new BigNumber(position[i][0].hex).toString();
    const _principal = numeral(new BigNumber(position[i][1].hex).dividedBy(BIG_TEN.pow(18)).toString()).format(
      "0,0.[0000]"
    );
    if (
      _cycle == market?.cycle &&
      (market?.status === PORTFOLIO_STATUS.PENDING || market?.status === PORTFOLIO_STATUS.ACTIVE)
    ) {
      userInvests = [
        {
          capital: "0",
          cycle: Number(market?.cycle),
          harvestAt: 0,
          id: "",
          investAt: 0,
          owner: "",
          principal: _principal,
          tranche: i,
          interest: "0",
          earningsAPY: "NaN"
        },
        ...userInvests
      ];
    }
  }
  const TYPES: { name: string; value: IType; status: number }[] = [
    { name: intl.formatMessage({ defaultMessage: "All" }), value: "ALL", status: -1 },
    { name: intl.formatMessage({ defaultMessage: "Pending" }), value: "PENDING", status: 0 },
    { name: intl.formatMessage({ defaultMessage: "Active" }), value: "ACTIVE", status: 1 },
    { name: intl.formatMessage({ defaultMessage: "Matured" }), value: "EXPIRED", status: 2 }
  ];
  const tranchesName = ["Senior", "Mezzanine", "Junior"];
  const handleTranchesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTranche(Number(event));
  };
  const handleStatusChange = (value: IType, status: number) => {
    setActivedTab(value);
    setSelectedStatus(status);
    console.log(status);
  };
  const redeemDirect = async (i: number) => {
    setRedeemLoading((redeemLoading) => ({ ...redeemLoading, [i]: true }));
    try {
      await onRedeemDirect(i);
      successNotification("Redeem Success", "");
    } catch (e) {
      console.error(e);
    } finally {
      setRedeemLoading((redeemLoading) => ({ ...redeemLoading, [i]: false }));
    }
  };
  const payload = useMemo(() => {
    return userInvests?.filter((_userInvest: any) => {
      if (!trancheCycles) return false;
      const trancheCycleId = _userInvest.tranche + "-" + _userInvest.cycle;
      if (_userInvest.principal == "0") return false;
      if (selectedTranche > -1 && selectedTranche !== _userInvest.tranche) return false;
      if (
        selectedStatus > -1 &&
        trancheCycles[trancheCycleId] &&
        selectedStatus !== trancheCycles[trancheCycleId].state
      )
        return false;
      return true;
    });
  }, [selectedTranche, selectedStatus, trancheCycles, trancheCycles.length, userInvests, userInvests.length]);
  return (
    <React.Fragment>
      <FilterWrapper>
        <Segement>
          {TYPES.map(({ name, value, status }) => (
            <SegementBlock
              key={value}
              data-actived={activedTab === value}
              onClick={() => handleStatusChange(value, status)}
            >
              {name}
            </SegementBlock>
          ))}
        </Segement>
        <SelectGroup>
          <div>
            <title>{intl.formatMessage({ defaultMessage: "Assets" })}</title>
            <Select>
              <Option value="ALL">All</Option>
              <Option value="BUSD">BUSD</Option>
            </Select>
          </div>
          <div>
            <title>{intl.formatMessage({ defaultMessage: "Tranches" })}</title>
            <Select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTranchesChange(e)}>
              <Option value="-1">All</Option>
              <Option value="0">Senior</Option>
              <Option value="1">Mezzanine</Option>
              <Option value="2">Junior</Option>
            </Select>
          </div>
        </SelectGroup>
      </FilterWrapper>

      <Table>
        <TableRow>
          <TableHeaderColumn>{intl.formatMessage({ defaultMessage: "Portfolio Name" })}</TableHeaderColumn>
          <TableHeaderColumn minWidth={60}>{intl.formatMessage({ defaultMessage: "Asset" })}</TableHeaderColumn>
          <TableHeaderColumn minWidth={200}>{intl.formatMessage({ defaultMessage: "Cycle" })}</TableHeaderColumn>
          <TableHeaderColumn minWidth={80}>{intl.formatMessage({ defaultMessage: "Tranche" })}</TableHeaderColumn>
          <TableHeaderColumn minWidth={160}>{intl.formatMessage({ defaultMessage: "Expected APR" })}</TableHeaderColumn>
          <TableHeaderColumn minWidth={150}>{intl.formatMessage({ defaultMessage: "Principal" })}</TableHeaderColumn>
          <TableHeaderColumn>{intl.formatMessage({ defaultMessage: "Status" })}</TableHeaderColumn>
          <TableHeaderColumn>{intl.formatMessage({ defaultMessage: "Yield" })}</TableHeaderColumn>
          <TableHeaderColumn></TableHeaderColumn>
        </TableRow>

        <NoDataWrapper isNoData={!payload?.length}>
          {trancheCycles &&
            market &&
            payload.map((_userInvest: UserInvest, _idx: number) => {
              const trancheCycleId = _userInvest.tranche + "-" + _userInvest.cycle;
              const trancheCycle = trancheCycles[trancheCycleId];
              // if (trancheCycle)
              return (
                <SparePositionItem
                  key={_idx}
                  userInvest={_userInvest}
                  market={market}
                  trancheCycle={trancheCycle}
                  redeemDirect={redeemDirect}
                  redeemLoading={redeemLoading[_idx] || false}
                />
              );
            })}
        </NoDataWrapper>
      </Table>
    </React.Fragment>
  );
});

export default injectIntl(SparePositions);
