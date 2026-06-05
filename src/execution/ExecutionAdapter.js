/**
 * ONETO EUR/USD AI Tool — ExecutionAdapter
 * ==========================================
 * Multi-broker execution interface contract.
 *
 * STATUS: DESIGN ONLY — all methods return NOT_IMPLEMENTED.
 * This file defines the binding interface that all future broker
 * adapters must implement. ExecutionManager will route through
 * this adapter once a broker is implemented.
 *
 * Required interface (5 methods — all adapters must match exactly):
 *
 *   submitOrder(params)              → Promise<OrderResult>
 *   closeOrder(orderId, units?)      → Promise<CloseResult>
 *   modifySLTP(orderId, params)      → Promise<ModifyResult>
 *   getPositions()                   → Promise<Position[]>
 *   getAccount()                     → Promise<AccountSummary>
 *
 * Future adapter files (to be created, not in V4.3):
 *   src/execution/adapters/OandaPracticeAdapter.js
 *     Base URL: https://api-fxpractice.oanda.com/v3
 *     Auth:     Bearer token (OANDA v20 REST)
 *
 *   src/execution/adapters/OandaLiveAdapter.js
 *     Base URL: https://api-fxtrade.oanda.com/v3
 *     Auth:     Bearer token (OANDA v20 REST)
 *     WARNING:  Requires full paper trading validation before use
 *
 *   src/execution/adapters/ICMarketsAdapter.js
 *     Protocol: cTrader Open API (REST + WebSocket)
 *     Auth:     OAuth 2.0 access token
 *
 *   src/execution/adapters/ExnessAdapter.js
 *     Protocol: MetaTrader 5 Web API (or FIX API)
 *     Auth:     API token
 *
 * Routing note (future ExecutionManager update):
 *   const adapter = ExecutionAdapter.get(brokerName)
 *   adapter.submitOrder(params)
 *
 * Architecture Freeze V4.0-R1 | V4.3 STEP 6 — Design Only
 */

'use strict';

// ─────────────────────────────────────────────
// NOT_IMPLEMENTED RESPONSE
// ─────────────────────────────────────────────

const NOT_IMPLEMENTED = Object.freeze({
  status:    'not_implemented',
  success:   false,
  message:   'ExecutionAdapter: broker integration is not yet implemented. '
           + 'Complete paper trading validation before requesting live activation. '
           + 'See src/execution/adapters/ for future broker implementations.',
});

// ─────────────────────────────────────────────
// INTERFACE CONTRACT
// All 5 methods below define the complete live execution contract.
// All future adapter files must implement these signatures exactly.
// ─────────────────────────────────────────────

/**
 * Submits a market or limit order to the broker.
 *
 * @param {OrderParams} params
 * @returns {Promise<OrderResult>}
 *
 * @example
 * // OANDA v20 implementation would call:
 * // POST /v3/accounts/{accountID}/orders
 * // Body: { order: { type: "MARKET", instrument: "EUR_USD", units: "10000",
 * //                  stopLossOnFill: { price: "1.07500" },
 * //                  takeProfitOnFill: { price: "1.08000" } } }
 *
 * // cTrader Open API implementation would call:
 * // ProtoOANewOrderReq via WebSocket
 *
 * // MT5 Web API implementation would call:
 * // POST /order/create
 */
export async function submitOrder(params) {
  return { ...NOT_IMPLEMENTED };
}

/**
 * Closes an existing open order/trade, fully or partially.
 *
 * @param {string} orderId      - broker-specific trade/order ID
 * @param {number} [units]      - partial close if specified; full close if omitted
 * @returns {Promise<CloseResult>}
 *
 * @example
 * // OANDA v20: PUT /v3/accounts/{accountID}/trades/{tradeID}/close
 * // cTrader:   ProtoOACloseOrderReq
 * // MT5:       DELETE /order/{orderId}
 */
export async function closeOrder(orderId, units) {
  return { ...NOT_IMPLEMENTED };
}

/**
 * Modifies the stop-loss and/or take-profit of an existing trade.
 *
 * @param {string} orderId
 * @param {ModifySLTPParams} params
 * @returns {Promise<ModifyResult>}
 *
 * @example
 * // OANDA v20: PUT /v3/accounts/{accountID}/trades/{tradeID}/orders
 * // Body: { takeProfit: { price: "1.08500" }, stopLoss: { price: "1.07000" } }
 * // cTrader: ProtoOAAmendOrderReq
 * // MT5: PUT /order/{orderId}/modify
 */
export async function modifySLTP(orderId, params) {
  return { ...NOT_IMPLEMENTED };
}

/**
 * Returns all currently open positions for the configured account.
 *
 * @returns {Promise<Position[]>}
 *
 * @example
 * // OANDA v20: GET /v3/accounts/{accountID}/openTrades
 * // cTrader:   ProtoOAGetPositionListReq
 * // MT5:       GET /positions
 */
export async function getPositions() {
  return [];
}

/**
 * Returns account summary including balance, equity, and margin.
 *
 * @returns {Promise<AccountSummary>}
 *
 * @example
 * // OANDA v20: GET /v3/accounts/{accountID}/summary
 * // cTrader:   ProtoOAGetAccountListByAccessTokenReq
 * // MT5:       GET /account
 */
export async function getAccount() {
  return { ...NOT_IMPLEMENTED };
}

/**
 * Returns whether this adapter is implemented and ready.
 * Override in concrete adapter implementations.
 *
 * @returns {{ implemented: boolean, broker: string, env: string }}
 */
export function getAdapterInfo() {
  return {
    implemented: false,
    broker:      'none',
    env:         'none',
    message:     'Base ExecutionAdapter — not yet implemented. Use a concrete broker adapter.',
  };
}

// ─────────────────────────────────────────────
// JSDoc typedefs — binding contract for all adapters
// ─────────────────────────────────────────────

/**
 * @typedef {Object} OrderParams
 * @property {'BUY'|'SELL'}         direction      trade direction
 * @property {number}               units          base currency units (NOT lots)
 * @property {'market'|'limit'}     order_type     order execution type
 * @property {number}               [entry_price]  required for limit orders
 * @property {number}               stop_loss      absolute price level
 * @property {number}               take_profit    absolute price level (TP2)
 * @property {number}               [take_profit_1] optional partial TP1
 */

/**
 * @typedef {Object} OrderResult
 * @property {boolean}       success
 * @property {string}        [order_id]     broker-assigned ID
 * @property {number}        [fill_price]   actual execution price
 * @property {number}        [units]        actual filled units
 * @property {number}        [timestamp]    UNIX ms
 * @property {string}        [error]        error message if !success
 * @property {string}        status         'filled'|'pending'|'not_implemented'
 */

/**
 * @typedef {Object} CloseResult
 * @property {boolean}  success
 * @property {number}   [close_price]
 * @property {number}   [pnl]          realized P&L in account currency
 * @property {number}   [timestamp]
 * @property {string}   [error]
 * @property {string}   status
 */

/**
 * @typedef {Object} ModifySLTPParams
 * @property {number} [stop_loss]    new SL price (omit to leave unchanged)
 * @property {number} [take_profit]  new TP price (omit to leave unchanged)
 */

/**
 * @typedef {Object} ModifyResult
 * @property {boolean} success
 * @property {string}  [order_id]
 * @property {number}  [timestamp]
 * @property {string}  [error]
 * @property {string}  status
 */

/**
 * @typedef {Object} Position
 * @property {string}        id              broker trade ID
 * @property {'BUY'|'SELL'}  direction
 * @property {number}        units
 * @property {number}        entry_price
 * @property {number}        stop_loss
 * @property {number}        take_profit
 * @property {number}        unrealized_pnl  in account currency
 * @property {string}        open_since      ISO timestamp
 */

/**
 * @typedef {Object} AccountSummary
 * @property {number}  balance          account balance
 * @property {number}  equity           balance + unrealized P&L
 * @property {number}  margin_used      margin currently in use
 * @property {number}  unrealized_pnl   total open trade P&L
 * @property {string}  currency         account currency (e.g. 'USD')
 * @property {number}  [leverage]       account leverage ratio
 * @property {boolean} [success]
 * @property {string}  [status]
 */
