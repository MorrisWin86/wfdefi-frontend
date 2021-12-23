import { getContract } from "hooks";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Market, Pool, PORTFOLIO_STATUS, Tranche } from "types";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import { BIG_TEN, BIG_ZERO } from "utils/bigNumber";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import multicall from "utils/multicall";
import { formatAPY } from "utils/formatNumbers";
import { useWTFPrice } from "hooks/useSelectors";
import { abi as WTFRewardsABI } from "config/abi/WTFRewards.json";

const initialState: Market[] = [];
const calculateJuniorAPY = (tranches: Tranche[], totalTarget: BigNumber, juniorTarget: BigNumber, decimals = 18) => {
  const juniorTVL = juniorTarget;
  tranches.map((_t, _i) => {
    let _apy = new BigNumber(_t.apy);
    _apy = _apy.plus(new BigNumber(100));
    _apy = _apy.dividedBy(new BigNumber(100));
    const _target = new BigNumber(_t.target);
    totalTarget = totalTarget.minus(_apy.times(_target));
  });
  totalTarget = totalTarget.dividedBy(juniorTVL);
  const result = totalTarget.minus(new BigNumber(1)).times(new BigNumber(100)).toString();
  return result;
};
export const getMarkets = createAsyncThunk<Market[] | undefined, Market[]>("markets/getMarket", async (payload) => {
  try {
    // if (!Web3.givenProvider) return;
    const _payload: Market[] = JSON.parse(JSON.stringify(payload));
    const _tt1 = Date.now();
    const markets = await Promise.all(
      _payload.map(async (marketData) => {
        const _marketAddress = marketData.address;
        const calls = [
          {
            address: _marketAddress,
            name: "tranches",
            params: [0]
          },
          {
            address: _marketAddress,
            name: "tranches",
            params: [1]
          },
          {
            address: _marketAddress,
            name: "tranches",
            params: [2]
          },
          {
            address: _marketAddress,
            name: "active"
          },
          {
            address: _marketAddress,
            name: "duration"
          },
          {
            address: _marketAddress,
            name: "actualStartAt"
          },
          {
            address: _marketAddress,
            name: "cycle"
          }
        ];
        const [t0, t1, t2, active, duration, actualStartAt, cycle] = await multicall(marketData.abi, calls);
        const _tranches = [t0, t1, t2];
        let totalTranchesTarget = BIG_ZERO;
        let tvl = BIG_ZERO;
        let totalTarget = BIG_ZERO;
        let expectedAPY = new BigNumber("210000000000000000").dividedBy(BIG_TEN.pow(18));
        expectedAPY = expectedAPY.plus(new BigNumber(1));
        const tranches: Tranche[] = [];
        _tranches.map((_t, _i) => {
          const _target = new BigNumber(_t.target?._hex).dividedBy(BIG_TEN.pow(18));
          totalTarget = totalTarget.plus(_target);
        });
        totalTarget = totalTarget.times(expectedAPY);
        _tranches.map((_t, _i) => {
          const _principal = _t ? new BigNumber(_t.principal?._hex).dividedBy(BIG_TEN.pow(18)) : BIG_ZERO;

          const _fee = _t ? new BigNumber(_t.fee?._hex).dividedBy(1000) : BIG_ZERO;
          const _target = _t ? new BigNumber(_t.target?._hex).dividedBy(BIG_TEN.pow(18)) : BIG_ZERO;
          const _apy =
            _t && _i !== _tranches.length - 1
              ? new BigNumber(_t.apy?._hex).dividedBy(BIG_TEN.pow(16))
              : calculateJuniorAPY(tranches, totalTarget, _target);

          totalTranchesTarget = totalTranchesTarget.plus(_target);
          tvl = tvl.plus(_principal);
          const __t = {
            principal: _principal.toString(),
            apy: _apy.toString(),
            fee: _fee.toString(),
            target: _target.toString()
          };
          tranches.push(__t);
        });
        const status = active[0] ? PORTFOLIO_STATUS.ACTIVE : PORTFOLIO_STATUS.PENDING;

        marketData = {
          ...marketData,
          tranches,
          duration: duration.toString(),
          actualStartAt: actualStartAt.toString(),
          status,
          totalTranchesTarget: totalTranchesTarget.toString(),
          tvl: tvl.toString(),
          cycle: cycle.toString()
        };

        const _masterchefAddress = marketData.masterChefAddress;
        const calls2 = [
          {
            address: _masterchefAddress,
            name: "poolInfo",
            params: [0]
          },
          {
            address: _masterchefAddress,
            name: "poolInfo",
            params: [1]
          },
          {
            address: _masterchefAddress,
            name: "poolInfo",
            params: [2]
          },
          {
            address: _masterchefAddress,
            name: "rewardPerBlock"
          }
        ];
        const [p0, p1, p2, _rewardPerBlock] = await multicall(marketData.masterChefAbi, calls2);
        const rewardPerBlock = new BigNumber(_rewardPerBlock[0]._hex).dividedBy(BIG_TEN.pow(18)).toString();
        const pools: string[] = [];
        let totalAllocPoints = BIG_ZERO;
        const _pools = [p0, p1, p2];
        _pools.map((_p, _i) => {
          const _allocPoint = _p ? new BigNumber(_p?.allocPoint._hex) : BIG_ZERO;
          totalAllocPoints = totalAllocPoints.plus(_allocPoint);
          pools.push(_allocPoint.toString());
        });
        // const totalAllocPoints = getTotalAllocPoints(pools);
        marketData = { ...marketData, pools, totalAllocPoints: totalAllocPoints.toString(), rewardPerBlock };
        return marketData;
      })
    );
    return JSON.parse(JSON.stringify(markets));
  } catch (e) {
    console.error(e);
  }
});
// export const getMarkets = createAsyncThunk<Market[] | undefined, Market[]>("markets/getMarket", async (payload) => {
//   try {
//     // if (!Web3.givenProvider) return;
//     const _payload: Market[] = JSON.parse(JSON.stringify(payload));

//     const markets = await Promise.all(
//       _payload.map(async (marketData) => {
//         const contractTranches = getContract(marketData.abi, marketData.address);
//         const contractMasterChef = getContract(marketData.masterChefAbi, marketData.masterChefAddress);

//         if (contractTranches) {
//           const _tranches = await Promise.all([
//             contractTranches.tranches(0),
//             contractTranches.tranches(1),
//             contractTranches.tranches(2)
//           ]);

//           let totalTranchesTarget = BIG_ZERO;
//           let tvl = BIG_ZERO;
//           const tranches: Tranche[] = [];
//           _tranches.map((_t, _i) => {
//             const _principal = _t ? new BigNumber(_t.principal?._hex) : BIG_ZERO;
//             const _apy = _t ? new BigNumber(_t.apy?._hex) : BIG_ZERO;
//             const _fee = _t ? new BigNumber(_t.fee?._hex) : BIG_ZERO;
//             const _target = _t ? new BigNumber(_t.target?._hex) : BIG_ZERO;

//             totalTranchesTarget = totalTranchesTarget.plus(_target);
//             tvl = tvl.plus(_principal);
//             const __t = {
//               principal: _t.principal.toString(),
//               apy: _t.apy.toString(),
//               fee: _t.fee.toString(),
//               target: _t.target.toString()
//             };
//             tranches.push(__t);
//           });

//           const [active, duration, actualStartAt, cycle] = await Promise.all([
//             contractTranches.active(),
//             contractTranches.duration(),
//             contractTranches.actualStartAt(),
//             contractTranches.cycle()
//           ]);

//           const status = active ? PORTFOLIO_STATUS.ACTIVE : PORTFOLIO_STATUS.PENDING;

//           marketData = {
//             ...marketData,
//             tranches,
//             duration: duration.toString(),
//             actualStartAt: actualStartAt.toString(),
//             status,
//             totalTranchesTarget: totalTranchesTarget.toString(),
//             tvl: tvl.toString(),
//             cycle: cycle.toString()
//           };
//         }
//         if (contractMasterChef) {
//           const _poolLength = await contractMasterChef.poolLength();
//           const pools: string[] = [];
//           let totalAllocPoints = BIG_ZERO;
//           if (_poolLength > 0) {
//             const arr = [];
//             for (let i = 0; i < _poolLength; i++) {
//               arr.push(contractMasterChef.poolInfo(i));
//             }
//             const _pools = await Promise.all(arr);
//             _pools.map((_p, _i) => {
//               const _allocPoint = _p ? new BigNumber(_p?._hex) : BIG_ZERO;
//               totalAllocPoints = totalAllocPoints.plus(_allocPoint);

//               pools.push(_allocPoint.toString());
//             });
//           }
//           // const totalAllocPoints = getTotalAllocPoints(pools);

//           marketData = { ...marketData, pools, totalAllocPoints: totalAllocPoints.toString() };
//         }
//         return marketData;
//       })
//     );
//     return JSON.parse(JSON.stringify(markets));
//   } catch (e) {
//     console.error(e);
//   }
// });

export const marketsSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setMarkets: (state, action: PayloadAction<Market[]>) => action.payload
  },
  extraReducers: (builder) => {
    builder.addCase(getMarkets.fulfilled, (state, { payload }) => payload && payload);
  }
});

// Actions
export const { setMarkets } = marketsSlice.actions;

export default marketsSlice.reducer;
