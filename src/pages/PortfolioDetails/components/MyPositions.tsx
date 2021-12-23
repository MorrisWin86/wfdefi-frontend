/** @jsxImportSource @emotion/react */

import { useTheme } from "@emotion/react";
import React, { memo, useState, useEffect, useMemo } from "react";
import { injectIntl, WrappedComponentProps } from "react-intl";
import { Table, TableColumn, TableHeaderColumn, TableRow } from "components/Table/Table";
import { CaretDown, Union } from "assets/images";
import Tooltip from "components/Tooltip/Tooltip";
import MyPositionItem from "./MyPositionItem";
import { useSize } from "ahooks";
import Button from "components/Button/Button";
import Tag from "components/Tag/Tag";
import { Market, PORTFOLIO_STATUS, TrancheCycle, UserInvest } from "types";

import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import {
  formatAllocPoint,
  formatAPY,
  formatNumberDisplay,
  formatTimestamp,
  getInterest,
  getJuniorAPY,
  getNetApr,
  getWTFApr
} from "utils/formatNumbers";
import styled from "@emotion/styled";
import { successNotification } from "utils/notification";
import { useAppDispatch } from "store";
import { getPosition } from "store/position";
import { usePendingWTFReward, usePosition, useSelectedMarket, useWTFPrice } from "hooks/useSelectors";
import useRedeemDirect from "../hooks/useRedeemDirect";
import BigNumber from "bignumber.js";
import { useHistoryQuery } from "../hooks/useSubgraph";
import { IType } from "pages/Portfolio/components/MyPortfolio/type";
import Select, { Option } from "components/Select/Select";
import NoData from "components/NoData/NoData";
import { useWTF } from "hooks";

type TProps = WrappedComponentProps & {
  data: Market;
};
const FilterDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  @media screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    & > div {
      margin-bottom: 10px;
    }
  }
`;
const APRPopup = styled.div`
  width: 100%;
  & > div {
    display: flex;
    justify-content: space-between;
  }
`;
const Text2 = styled.div`
  font-size: 16px;
  line-height: 22px;
  color: ${({ color }) => color};
  margin: 10px 0;
`;
const MyPositions = memo<TProps>(({ intl }) => {
  const { gray, white, primary, linearGradient, tags, shadow } = useTheme();
  const { width } = useSize(document.body);
  const { weekDistribution } = useWTF();
  const [redeemLoading, setRedeemLoading] = useState<{ [key: number]: boolean }>({});
  const [activedTab, setActivedTab] = useState<IType>("PENDING");
  const [isfolds, setFolds] = useState<{ [key: number]: boolean }>({});
  const [selectedTranche, setSelectedTranche] = useState(-1);
  const [selectedStatus, setSelectedStatus] = useState(0);
  const { account, active } = useWeb3React<Web3Provider>();
  const dispatch = useAppDispatch();
  const market = useSelectedMarket();
  const position = usePosition();
  const { onRedeemDirect } = useRedeemDirect();
  const { tranchesPendingReward } = usePendingWTFReward();
  const { interests, principalAndInterests } = getInterest(market?.tranches, position, market?.duration);
  // const { loading, error, data } = useHistoryQuery(account);
  const { userInvests, trancheCycles } = useHistoryQuery(account);
  const wtfPrice = useWTFPrice();

  const TYPES: { name: string; value: IType; status: number }[] = [
    { name: intl.formatMessage({ defaultMessage: "All" }), value: "ALL", status: -1 },
    { name: intl.formatMessage({ defaultMessage: "Pending" }), value: "PENDING", status: 0 },
    { name: intl.formatMessage({ defaultMessage: "Active" }), value: "ACTIVE", status: 1 },
    { name: intl.formatMessage({ defaultMessage: "Matured" }), value: "EXPIRED", status: 2 }
  ];
  const tranchesName = ["Senior", "Mezzanine", "Junior"];
  const tranchesState = [PORTFOLIO_STATUS.PENDING, PORTFOLIO_STATUS.ACTIVE, PORTFOLIO_STATUS.EXPIRED];
  const handleTranchesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTranche(Number(event));
  };
  const handleStatusChange = (value: IType, status: number) => {
    setActivedTab(value);
    setSelectedStatus(status);
  };

  useEffect(() => {
    market && account && dispatch(getPosition({ market, account }));
  }, [market, account]);

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
  const tranchesDisplayText = ["Senior", "Mezzanine", "Junior"];
  const tranchesDisplayTextColor = [tags.yellowText, tags.greenText, primary.deep];

  const positionPayload = useMemo(() => {
    return position?.filter((p, i) => {
      if (selectedTranche > -1 && selectedTranche !== i) return false;
      if (selectedStatus > -1 && market?.status !== tranchesState[selectedStatus]) return false;
      const _cycle = new BigNumber(p[0].hex).toString();
      if (_cycle !== market?.cycle) return false;
      if (new BigNumber(p[1].hex).toNumber() === 0) return false;

      return true;
    });
  }, [position, selectedTranche, selectedStatus, tranchesState]);
  const payload = useMemo(() => {
    return userInvests?.filter((_userInvest: any) => {
      const trancheCycleId = _userInvest.tranche + "-" + _userInvest.cycle;
      if (_userInvest.principal == "0") return false;
      if (trancheCycles[trancheCycleId].state === 0) return false;
      if (selectedTranche > -1 && selectedTranche !== _userInvest.tranche) return false;
      if (selectedStatus > -1 && selectedStatus !== trancheCycles[trancheCycleId].state) return false;
      if (_userInvest.cycle == market?.cycle) return false;
      return true;
    });
  }, [selectedTranche, selectedStatus, trancheCycles]);

  const isNoData = useMemo(() => !(positionPayload?.length + payload?.length), [positionPayload, payload]);

  return (
    <>
      <FilterDiv>
        <div css={{ borderRadius: 8, padding: "7px 8px", border: `1px solid ${primary.deep2}`, display: "flex" }}>
          {TYPES.map(({ name, value, status }) => (
            <div
              key={value}
              css={{
                padding: "6px 10px",
                marginRight: 5,
                cursor: "pointer",
                ":last-of-type": {
                  marginRight: 0
                },
                color: gray.normal7,
                ...(activedTab === value
                  ? { borderRadius: 8, boxShadow: shadow.positionsTab, color: primary.deep }
                  : {})
              }}
              onClick={() => handleStatusChange(value, status)}
            >
              {name}
            </div>
          ))}
        </div>
        <div css={{ display: "flex" }}>
          <div css={{ marginRight: 14, color: gray.normal7 }}>
            <div css={{ marginBottom: 6 }}>{intl.formatMessage({ defaultMessage: "Assets" })}</div>
            <Select>
              {/* <Option value="Cake">Cake</Option> */}
              {/* <Option value="USDC">USDC</Option> */}
              <Option value="ALL">All</Option>
              <Option value="BUSD">BUSD</Option>
            </Select>
          </div>
          <div css={{ color: gray.normal7 }}>
            <div css={{ marginBottom: 6 }}>{intl.formatMessage({ defaultMessage: "Tranches" })}</div>
            <Select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTranchesChange(e)}>
              <Option value="-1">All</Option>
              <Option value="0">Senior</Option>
              <Option value="1">Mezzanine</Option>
              <Option value="2">Junior</Option>
            </Select>
          </div>
        </div>
      </FilterDiv>
      {Boolean(width && width > 768) && (
        <Table>
          <TableRow>
            <TableHeaderColumn minWidth={150}>
              {intl.formatMessage({ defaultMessage: "Portfolio Name" })}
            </TableHeaderColumn>
            <TableHeaderColumn minWidth={60}>{intl.formatMessage({ defaultMessage: "Asset" })}</TableHeaderColumn>
            <TableHeaderColumn minWidth={240}>{intl.formatMessage({ defaultMessage: "Cycle" })}</TableHeaderColumn>
            <TableHeaderColumn minWidth={240}>
              {intl.formatMessage({ defaultMessage: "Deposit APR" })}
            </TableHeaderColumn>
            <TableHeaderColumn minWidth={200}>{intl.formatMessage({ defaultMessage: "Principal" })}</TableHeaderColumn>
            <TableHeaderColumn>{intl.formatMessage({ defaultMessage: "Status" })}</TableHeaderColumn>
            <TableHeaderColumn>{intl.formatMessage({ defaultMessage: "Yield" })}</TableHeaderColumn>
            <TableHeaderColumn></TableHeaderColumn>
          </TableRow>
          <NoData isNoData={isNoData} />
          {position.map((p, i) => {
            if (selectedTranche > -1 && selectedTranche !== i) return;
            if (selectedStatus > -1 && market?.status !== tranchesState[selectedStatus]) return;
            const _cycle = new BigNumber(p[0].hex).toString();
            if (_cycle !== market?.cycle) return;
            if (new BigNumber(p[1].hex).toNumber() === 0) return;

            return (
              <div
                key={i}
                css={
                  {
                    // ":hover": {
                    //   boxShadow: "0px 0px 20px rgba(0, 108, 253, 0.1)"
                    // }
                  }
                }
              >
                <TableRow css={{ color: gray.normal85, fontSize: 16, borderBottom: `1px solid ${primary.lightBrown}` }}>
                  <TableColumn minWidth={150}>{market?.portfolio}</TableColumn>
                  <TableColumn minWidth={60}>{market?.assets}</TableColumn>
                  <TableColumn minWidth={240} style={{ whiteSpace: "unset" }}>
                    {market?.status === PORTFOLIO_STATUS.ACTIVE && market.actualStartAt && market.duration
                      ? `${formatTimestamp(market.actualStartAt)} -
                          ${formatTimestamp(Number(market.actualStartAt) + Number(market.duration))}`
                      : "--"}
                  </TableColumn>
                  <TableColumn minWidth={240}>
                    <APRPopup>
                      <div>
                        <div>{tranchesDisplayText[i]}:</div>
                        <div>
                          {i !== position.length - 1
                            ? formatAPY(market?.tranches[i].apy)
                            : getJuniorAPY(market?.tranches)}
                        </div>
                      </div>
                      <div>
                        <div>WTF:</div>
                        <div>
                          {getWTFApr(
                            formatAllocPoint(market?.pools[i], market?.totalAllocPoints),
                            market?.tranches[i],
                            market.duration,
                            market.rewardPerBlock,
                            wtfPrice
                          )}
                          {" %"}
                        </div>
                        {/* {formatAllocPoint(market?.pools[i], market?.totalAllocPoints).replace("+ ", "")} */}
                      </div>
                      <div>
                        <div>Fee:</div>
                        <div>- {market?.tranches[i].fee} %</div>
                      </div>
                      <div>
                        <div>{intl.formatMessage({ defaultMessage: "Expected Apr" })}:</div>
                        <div>
                          {getNetApr(
                            i !== position.length - 1
                              ? formatAPY(market?.tranches[i].apy)
                              : getJuniorAPY(market?.tranches),
                            formatAllocPoint(market?.pools[i], market?.totalAllocPoints),
                            market?.tranches[i],
                            market.duration,
                            market.rewardPerBlock,
                            wtfPrice
                          )}
                          {" %"}
                        </div>
                      </div>
                    </APRPopup>
                  </TableColumn>
                  <TableColumn minWidth={200}>
                    {formatNumberDisplay(p?.[1]?.hex)} {market?.assets}
                  </TableColumn>
                  <TableColumn>
                    {market?.status === PORTFOLIO_STATUS.PENDING && <Tag color="yellow" value="Pending" />}
                    {market?.status === PORTFOLIO_STATUS.ACTIVE && <Tag color="green" value="Active" />}
                    {market?.status === PORTFOLIO_STATUS.EXPIRED && <Tag color="red" value="Matured" />}
                  </TableColumn>
                  <TableColumn>
                    {market?.status === PORTFOLIO_STATUS.ACTIVE && interests
                      ? interests[i] + " " + market?.assets
                      : "--"}
                  </TableColumn>
                  <TableColumn>
                    <div
                      css={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `2px solid ${primary.deep2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setFolds((isfolds) => ({ ...isfolds, [i]: !isfolds[i] }));
                      }}
                    >
                      <CaretDown
                        css={{
                          transition: "transform 0.3s",
                          transform: "rotate(0)",
                          color: primary.normal,
                          ...(isfolds[i] ? { transform: "rotate(180deg)" } : {})
                        }}
                      />
                    </div>
                  </TableColumn>
                </TableRow>
                {isfolds[i] && (
                  <div css={{ padding: "24px 32px", position: "relative" }}>
                    <div
                      css={{
                        width: "100%",
                        height: "100%",
                        background: linearGradient.primary,
                        opacity: 0.02,
                        position: "absolute",
                        top: 0,
                        left: 0
                      }}
                    />
                    <div css={{ display: "flex", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                      <div
                        css={{
                          padding: "16px 19px",
                          marginRight: 27,
                          border: `1px solid ${primary.deep2}`,
                          borderRadius: 8
                        }}
                      >
                        <div css={{ display: "flex", alignItems: "flex-start", fontSize: 12, color: gray.normal7 }}>
                          <div>
                            {intl.formatMessage({ defaultMessage: "Principal+" })}
                            <Tooltip
                              overlay={intl.formatMessage({
                                defaultMessage:
                                  "Before the cycle starts, the principal can be redeemed in the Pending state."
                              })}
                            >
                              <u
                                css={{
                                  borderBottom: "1px dotted",
                                  borderColor: gray.normal7,
                                  color: gray.normal7,
                                  textDecoration: "none"
                                }}
                              >
                                {intl.formatMessage({ defaultMessage: "Est. yield" })}
                              </u>
                            </Tooltip>
                          </div>

                          <Tooltip
                            overlay={intl.formatMessage({
                              defaultMessage:
                                "In the active state, the yield is the theoretical yield calculated based on the theoretical APR.The actual yield is subject to the system display after expiration."
                            })}
                            css={{ marginLeft: 5 }}
                          >
                            <Union css={{ color: gray.normal3 }} />
                          </Tooltip>
                        </div>
                        <div css={{ color: primary.deep, margin: "8px 0 6px 0" }}>
                          {market?.status === PORTFOLIO_STATUS.ACTIVE
                            ? principalAndInterests && principalAndInterests[i]
                            : formatNumberDisplay(p?.[1]?.hex)}{" "}
                          {market?.assets}
                        </div>
                        <div css={{ display: "flex" }}>
                          <Button
                            css={{
                              marginRight: 10,
                              fontSize: 12,
                              height: 30,
                              padding: "0 12px",
                              borderRadius: 4,
                              visibility: market?.status !== PORTFOLIO_STATUS.PENDING ? "hidden" : "visible"
                            }}
                            type="primary"
                            onClick={() => redeemDirect(i)}
                            loading={redeemLoading[i] || false}
                          >
                            {intl.formatMessage({ defaultMessage: "Redeem" })}
                          </Button>

                          {/* <Button css={{ fontSize: 12, height: 30, padding: "0 12px", borderRadius: 4 }} type="primary">
                            {intl.formatMessage({ defaultMessage: "Re-deposit" })}
                          </Button> */}
                        </div>
                      </div>
                      <div
                        css={{
                          padding: "16px 19px",
                          width: 235,
                          marginRight: 23,
                          border: `1px solid ${primary.deep2}`,
                          borderRadius: 8
                        }}
                      >
                        <div css={{ display: "flex", alignItems: "center" }}>
                          <span css={{ marginRight: 5, color: gray.normal7, fontSize: 12 }}>
                            {intl.formatMessage({ defaultMessage: "WTF Reward" })}
                          </span>
                        </div>
                        <div css={{ color: primary.deep, margin: "8px 0 6px 0" }}>
                          {tranchesPendingReward[i] ? formatNumberDisplay(tranchesPendingReward[i].toString()) : "-"}
                          WTF
                        </div>
                        <div css={{ display: "flex" }}>
                          <Button
                            css={{
                              marginRight: 10,
                              fontSize: 12,
                              height: 30,
                              padding: "0 12px",
                              borderRadius: 4,
                              visibility: "hidden"
                            }}
                            type="primary"
                          >
                            {intl.formatMessage({ defaultMessage: "Claim" })}
                          </Button>
                        </div>
                      </div>
                      <div css={{ flex: 1, padding: 18, width: "100%", position: "relative", borderRadius: 8 }}>
                        <div
                          css={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            backgroundColor: white.normal,
                            borderRadius: 8
                          }}
                        />
                        <div css={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start" }}>
                          <div css={{ marginRight: 4 }}>
                            <Union css={{ color: primary.deep, transform: "translateY(2px)" }} />
                          </div>
                          <div css={{ color: gray.normal7, fontSize: 12 }}>
                            {intl.formatMessage({
                              defaultMessage: `Upon maturity, you can choose to withdraw all the principal + yield. Alternatively you can choose to deposit to the next cycle - and choose the amount of re-deposit and tranche you re-deposit to.`
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {payload?.map((_userInvest: UserInvest, _idx: number) => {
            const trancheCycleId = _userInvest.tranche + "-" + _userInvest.cycle;

            // if (_userInvest.principal == "0") return;
            // if (trancheCycles[trancheCycleId].state === 0) return;
            // if (selectedTranche > -1 && selectedTranche !== _userInvest.tranche) return;
            // if (selectedStatus > -1 && selectedStatus !== trancheCycles[trancheCycleId].state) return;

            return (
              <div
                key={_idx}
                css={{
                  ":hover": {
                    // boxShadow: "0px 0px 20px rgba(0, 108, 253, 0.1)"
                  }
                }}
              >
                <TableRow
                  css={{
                    color: gray.normal85,
                    fontSize: 16,
                    borderBottom: `1px solid ${primary.lightBrown}`
                  }}
                >
                  <TableColumn minWidth={150}>{market?.portfolio}</TableColumn>
                  <TableColumn minWidth={60}>{market?.assets}</TableColumn>
                  <TableColumn minWidth={240} style={{ whiteSpace: "unset" }}>
                    {trancheCycles &&
                      trancheCycles[trancheCycleId] &&
                      trancheCycles[trancheCycleId].state !== 0 &&
                      `${formatTimestamp(trancheCycles[trancheCycleId].startAt)} → ${formatTimestamp(
                        Number(trancheCycles[trancheCycleId].endAt)
                      )}`}
                  </TableColumn>
                  <TableColumn minWidth={240} style={{ whiteSpace: "break-spaces" }}>
                    <APRPopup>
                      <div>
                        <div>{tranchesName[_userInvest.tranche]}:</div>
                        <div>
                          {trancheCycles && trancheCycles[trancheCycleId] && trancheCycles[trancheCycleId].state !== 0
                            ? _userInvest.earningsAPY
                            : "-"}
                          %
                        </div>
                      </div>
                      <div>
                        <div>WTF:</div>
                        <div>- %</div>
                      </div>
                      {/* <div>
                        <div>{intl.formatMessage({ defaultMessage: "Expected Apr" })}:</div>
                        <div>
                          {getNetApr(
                            i !== position.length - 1
                              ? formatAPY(market?.tranches[i].apy)
                              : getJuniorAPY(market?.tranches),
                            formatAllocPoint(market?.pools[i], market?.totalAllocPoints),
                            market?.tranches[i]
                          )}
                        </div>
                      </div> */}
                    </APRPopup>
                  </TableColumn>
                  <TableColumn minWidth={200}>
                    {formatNumberDisplay(_userInvest.principal)} {market?.assets}
                  </TableColumn>
                  <TableColumn>
                    {trancheCycles[trancheCycleId].state === 0 ? <Tag color="yellow" value={"Pending"}></Tag> : null}
                    {trancheCycles[trancheCycleId].state === 1 ? <Tag color="green" value={"Active"}></Tag> : null}
                    {trancheCycles[trancheCycleId].state === 2 ? <Tag color="red" value={"Matured"}></Tag> : null}
                  </TableColumn>
                  <TableColumn>
                    {trancheCycles && trancheCycles[trancheCycleId] && trancheCycles[trancheCycleId].state !== 0
                      ? _userInvest.interest
                      : "-"}{" "}
                    {market?.assets}
                  </TableColumn>
                  <TableColumn>
                    <div
                      css={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `2px solid ${primary.deep2}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setFolds((isfolds) => ({ ...isfolds, [_idx]: !isfolds[_idx] }));
                      }}
                    >
                      <CaretDown
                        css={{
                          transition: "transform 0.3s",
                          transform: "rotate(0)",
                          color: primary.normal,
                          ...(isfolds[_idx] ? { transform: "rotate(180deg)" } : {})
                        }}
                      />
                    </div>
                  </TableColumn>
                </TableRow>
                {isfolds[_idx] && (
                  <div css={{ padding: "24px 32px", position: "relative" }}>
                    <div
                      css={{
                        width: "100%",
                        height: "100%",
                        background: linearGradient.primary,
                        opacity: 0.02,
                        position: "absolute",
                        top: 0,
                        left: 0
                      }}
                    />
                    <div css={{ display: "flex", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                      <div
                        css={{
                          padding: "16px 19px",
                          marginRight: 27,
                          border: `1px solid ${primary.deep2}`,
                          borderRadius: 8
                        }}
                      >
                        <div css={{ display: "flex", alignItems: "flex-start", fontSize: 12, color: gray.normal7 }}>
                          <div>
                            {intl.formatMessage({ defaultMessage: "Principal+" })}
                            <Tooltip
                              overlay={intl.formatMessage({
                                defaultMessage:
                                  "Before the cycle starts, the principal can be redeemed in the Pending state."
                              })}
                            >
                              <u
                                css={{
                                  borderBottom: "1px dotted",
                                  borderColor: gray.normal7,
                                  color: gray.normal7,
                                  textDecoration: "none"
                                }}
                              >
                                {intl.formatMessage({ defaultMessage: "Est. yield" })}
                              </u>
                            </Tooltip>
                          </div>

                          <Tooltip
                            overlay={intl.formatMessage({
                              defaultMessage:
                                "In the active state, the yield is the theoretical yield calculated based on the theoretical APR.The actual yield is subject to the system display after expiration."
                            })}
                            css={{ marginLeft: 5 }}
                          >
                            <Union css={{ color: gray.normal3 }} />
                          </Tooltip>
                        </div>
                        <div css={{ color: primary.deep, margin: "8px 0 6px 0" }}>
                          {formatNumberDisplay(_userInvest.capital)} {market?.assets}
                        </div>
                        <div css={{ display: "flex" }}>
                          {/* <Button
                              css={{ marginRight: 10, fontSize: 12, height: 30, padding: "0 12px", borderRadius: 4 }}
                              type="primary"
                            >
                              {intl.formatMessage({ defaultMessage: "Withdraw all" })}
                            </Button>
                            <Button
                              css={{ fontSize: 12, height: 30, padding: "0 12px", borderRadius: 4 }}
                              type="primary"
                            >
                              {intl.formatMessage({ defaultMessage: "Re-deposit" })}
                            </Button> */}
                        </div>
                      </div>
                      <div
                        css={{
                          padding: "16px 19px",
                          width: 235,
                          marginRight: 23,
                          border: `1px solid ${primary.deep2}`,
                          borderRadius: 8
                        }}
                      >
                        <div css={{ display: "flex", alignItems: "center" }}>
                          <span css={{ marginRight: 5, color: gray.normal7, fontSize: 12 }}>
                            {intl.formatMessage({ defaultMessage: "WTF Reward" })}
                          </span>
                        </div>
                        <div css={{ color: primary.deep, margin: "8px 0 6px 0" }}>- WTF</div>
                        <div css={{ display: "flex" }}>
                          {/* <Button
                              css={{ marginRight: 10, fontSize: 12, height: 30, padding: "0 12px", borderRadius: 4 }}
                              type="primary"
                            >
                              {intl.formatMessage({ defaultMessage: "Claim" })}
                            </Button> */}
                        </div>
                      </div>
                      <div css={{ flex: 1, padding: 18, width: "100%", position: "relative", borderRadius: 8 }}>
                        <div
                          css={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            backgroundColor: white.normal,
                            borderRadius: 8
                          }}
                        />
                        <div css={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start" }}>
                          <div css={{ marginRight: 4 }}>
                            <Union css={{ color: primary.deep, transform: "translateY(2px)" }} />
                          </div>
                          <div css={{ color: gray.normal7, fontSize: 12 }}>
                            {intl.formatMessage({
                              defaultMessage: `Upon maturity, you can choose to withdraw all the principal + yield. Alternatively you can choose to deposit to the next cycle - and choose the amount of re-deposit and tranche you re-deposit to.`
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Table>
      )}
      {Boolean(width && width <= 768) && (
        <>
          {market &&
            redeemDirect &&
            position.map((p, i) => {
              const _cycle = new BigNumber(p[0].hex).toString();
              if (_cycle !== market?.cycle) return;
              if (selectedTranche > -1 && selectedTranche !== i) return;
              if (selectedStatus > -1 && market?.status !== tranchesState[selectedStatus]) return;

              if (new BigNumber(p[1].hex).toNumber() === 0) return;
              return (
                <div key={i}>
                  <MyPositionItem
                    market={market}
                    positionIdx={i}
                    position={p}
                    tranchesPendingReward={tranchesPendingReward[i]}
                    principalAndInterest={principalAndInterests && principalAndInterests[i]}
                    interest={interests && interests[i]}
                    redeemLoading={redeemLoading[i] || false}
                    redeemDirect={redeemDirect}
                    isCurrentPosition={true}
                  />
                </div>
              );
            })}
          {market &&
            userInvests.map((_userInvest: any, _idx: number) => {
              const trancheCycleId = _userInvest.tranche + "-" + _userInvest.cycle;
              if (_userInvest.principal == "0") return;
              if (trancheCycles[trancheCycleId].state === 0) return;
              if (selectedTranche > -1 && selectedTranche !== _userInvest.tranche) return;
              if (selectedStatus > -1 && selectedStatus !== trancheCycles[trancheCycleId].state) return;

              return (
                <div key={_idx}>
                  <MyPositionItem
                    market={market}
                    redeemDirect={redeemDirect}
                    isCurrentPosition={false}
                    _userInvest={_userInvest}
                    positionIdx={0}
                    _trancheCycle={trancheCycles[trancheCycleId]}
                  />
                </div>
              );
            })}
        </>
      )}
    </>
  );
});

export default injectIntl(MyPositions);
