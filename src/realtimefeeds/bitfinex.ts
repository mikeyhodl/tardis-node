import { Filter } from '../types'
import { RealTimeFeedBase } from './realtimefeed'
const TIMESTAMP = 32768
const SEQ_ALL = 65536

export class BitfinexRealTimeFeed extends RealTimeFeedBase {
  protected wssURL = 'wss://api-pub.bitfinex.com/ws/2'

  protected mapToSubscribeMessages(filters: Filter<string>[]) {
    const configMessage = {
      event: 'conf',
      flags: TIMESTAMP | SEQ_ALL
    }

    const subscribeMessages = filters
      .map(filter => {
        if (!filter.symbols || filter.symbols.length === 0) {
          throw new Error('BitfinexRealTimeFeed requires explicitly specified symbols when subscribing to live feed')
        }

        return filter.symbols.map(symbol => {
          if (filter.channel === 'trades') {
            return {
              event: 'subscribe',
              channel: 'trades',
              symbol: `t${symbol}`
            }
          }
          if (filter.channel === 'book') {
            return {
              event: 'subscribe',
              channel: 'book',
              len: 100,
              prec: 'P0',
              freq: 'F0',
              symbol: `t${symbol}`
            }
          }

          if (filter.channel === 'status') {
            return {
              event: 'subscribe',
              channel: 'status',
              key: `deriv:t${symbol}`
            }
          }
          return
        })
      })
      .flatMap(c => c)

    return [configMessage, ...subscribeMessages]
  }

  protected messageIsError(message: any) {
    return message.event === 'error'
  }
}