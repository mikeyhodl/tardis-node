import { onlyUnique } from '../handy'
import { Filter } from '../types'
import { RealTimeFeedBase } from './realtimefeed'

export class BinanceEuropeanOptionsRealTimeFeed extends RealTimeFeedBase {
  protected wssURL = 'wss://nbstream.binance.com/eoptions/stream'

  protected mapToSubscribeMessages(filters: Filter<string>[]): any[] {
    const payload = filters.map((filter, index) => {
      if (!filter.symbols || filter.symbols.length === 0) {
        throw new Error('BinanceEuropeanOptionsRealTimeFeed requires explicitly specified symbols when subscribing to live feed')
      }

      return {
        method: 'SUBSCRIBE',
        params: filter.symbols
          .map((symbol) => {
            if (filter.channel === 'depth100') {
              return [`${symbol}@${filter.channel}@100ms`]
            }

            if (filter.channel === 'openInterest') {
              const matchingTickerChannel = filters.find((f) => f.channel === 'ticker')

              if (matchingTickerChannel !== undefined) {
                const expirations = matchingTickerChannel
                  .symbols!.filter((s) => s.startsWith(symbol))
                  .map((s) => {
                    const symbolParts = s.split('-')
                    return `${symbolParts[1]}`
                  })
                  .filter(onlyUnique)

                return expirations.map((expiration) => {
                  return `${symbol}@${filter.channel}@${expiration}`
                })
              }
            }

            return [`${symbol}@${filter.channel}`]
          })
          .flatMap((s) => s),
        id: index + 1
      }
    })

    return payload
  }

  protected messageIsError(message: any): boolean {
    if (message.data !== undefined && message.data.e === 'error') {
      return true
    }

    return false
  }
}
