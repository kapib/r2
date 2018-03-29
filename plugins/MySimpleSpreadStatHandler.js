const _ = require('lodash');
const ss = require('simple-statistics');
const { getLogger } = require('@bitr/logger');

const precision = 3;

class SimpleSpreadStatHandler {
  // Constructor is called when initial snapshot of spread stat history has arrived.
  constructor(history) {
    this.history = history; // historyを保存
    this.log = getLogger(this.constructor.name);
    const profitPercentHistory = history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.sampleSize = profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.variance(profitPercentHistory) : 0;
  }

  // The method is called each time new spread stat has arrived, by default every 3 seconds.
  // Return value: part of ConfigRoot or undefined.
  // If part of ConfigRoot is returned, the configuration will be merged. If undefined is returned, no update will be made.
  async handle(spreadStat) {
    this.history.push(spreadStat); // 最新データを追加
    this.history = this.history.filter(x => x.timestamp > Date.now() - 1000 * 60 * 3); // 3分に限定

    const profitPercentHistory = this.history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.sampleSize = profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.variance(profitPercentHistory) : 0;

    // set μ + σ to minTargetProfitPercent
    const n = this.sampleSize;
    const mean = this.profitPercentMean;
    const standardDeviation = Math.sqrt(this.profitPercentVariance * n/(n-1));
    const minTargetProfitPercent = _.round(mean + 2 * standardDeviation, precision);
    if (_.isNaN(minTargetProfitPercent)) {
      return undefined;
    }
    this.log.info(
      `μ: ${_.round(mean, precision)}, σ: ${_.round(
        standardDeviation,
        precision
      )}, n: ${n} => minTargetProfitPercent: ${minTargetProfitPercent}`
    );
    const config = { minTargetProfitPercent };
    return config;
  }
}

module.exports = SimpleSpreadStatHandler;
                                                                                                                                                                        57,1         末尾
