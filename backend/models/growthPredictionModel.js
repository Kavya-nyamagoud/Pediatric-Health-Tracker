/**
 * AI Growth Prediction Model
 * Analyzes child's historical growth data and predicts future measurements
 */

class GrowthPredictionModel {
  /**
   * Linear regression to predict growth
   * @param {Array} records - Array of {date, height, weight}
   * @returns {Object} {heightTrend, weightTrend, nextMonthPrediction, recommendation}
   */
  static predictGrowth(records) {
    if (!records || records.length < 2) {
      return {
        status: 'insufficient_data',
        message: 'Need at least 2 records for prediction',
        prediction: null,
        recommendation: 'Add more health records to enable growth analysis'
      }
    }

    // Extract height and weight data sorted by date
    const sortedRecords = records
      .filter(r => r.height || r.weight)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    if (sortedRecords.length < 2) {
      return {
        status: 'insufficient_data',
        message: 'Need at least 2 records with height/weight data',
        prediction: null,
        recommendation: 'Add growth measurements to enable predictions'
      }
    }

    // Prepare data for linear regression
    const n = sortedRecords.length
    const x = Array.from({ length: n }, (_, i) => i) // time index: 0, 1, 2, ...
    const heights = sortedRecords.map(r => r.height).filter(h => h)
    const weights = sortedRecords.map(r => r.weight).filter(w => w)

    // Calculate height trend
    const heightTrend = this._linearRegression(x, heights)
    const weightTrend = this._linearRegression(x, weights)

    // Predict next month (30 days, assume ~1 record per month = 1 unit)
    const nextMonthIndex = n + 1
    const predictedHeight = heightTrend ? heightTrend.slope * nextMonthIndex + heightTrend.intercept : null
    const predictedWeight = weightTrend ? weightTrend.slope * nextMonthIndex + weightTrend.intercept : null

    // Calculate growth rate (cm/month, kg/month)
    const heightGrowthRate = heightTrend ? heightTrend.slope : 0
    const weightGrowthRate = weightTrend ? weightTrend.slope : 0

    // Generate recommendation based on trends
    const recommendation = this._generateRecommendation(
      heightGrowthRate,
      weightGrowthRate,
      sortedRecords[sortedRecords.length - 1],
      sortedRecords[0]
    )

    return {
      status: 'success',
      currentRecord: {
        height: sortedRecords[sortedRecords.length - 1].height,
        weight: sortedRecords[sortedRecords.length - 1].weight,
        date: sortedRecords[sortedRecords.length - 1].createdAt
      },
      firstRecord: {
        height: sortedRecords[0].height,
        weight: sortedRecords[0].weight,
        date: sortedRecords[0].createdAt
      },
      trends: {
        heightTrendCmPerMonth: parseFloat(heightGrowthRate.toFixed(2)),
        weightTrendKgPerMonth: parseFloat(weightGrowthRate.toFixed(2))
      },
      nextMonthPrediction: {
        predictedHeight: predictedHeight ? parseFloat(predictedHeight.toFixed(1)) : null,
        predictedWeight: predictedWeight ? parseFloat(predictedWeight.toFixed(1)) : null
      },
      growthAnalysis: {
        totalHeightGain: sortedRecords[sortedRecords.length - 1].height - sortedRecords[0].height,
        totalWeightGain: sortedRecords[sortedRecords.length - 1].weight - sortedRecords[0].weight,
        recordsCount: sortedRecords.length
      },
      recommendation,
      confidenceLevel: this._calculateConfidence(n)
    }
  }

  /**
   * Simple linear regression: y = slope*x + intercept
   * @param {Array} x - X values (time)
   * @param {Array} y - Y values (measurements)
   * @returns {Object} {slope, intercept, r2}
   */
  static _linearRegression(x, y) {
    if (!y || y.length < 2) return null

    // Use only indices where y has valid values
    const validIndices = y.map((val, idx) => val ? idx : null).filter(v => v !== null)
    const validX = validIndices.map(i => x[i])
    const validY = validIndices.map(i => y[i])

    const n = validY.length
    if (n < 2) return null

    const sumX = validX.reduce((a, b) => a + b, 0)
    const sumY = validY.reduce((a, b) => a + b, 0)
    const sumXY = validX.reduce((sum, xi, i) => sum + xi * validY[i], 0)
    const sumX2 = validX.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R² for fit quality
    const yMean = sumY / n
    const ssTotal = validY.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0)
    const ssPred = validY.reduce((sum, yi, i) => {
      const predicted = slope * validX[i] + intercept
      return sum + (predicted - yMean) ** 2
    }, 0)
    const r2 = ssTotal === 0 ? 1 : ssPred / ssTotal

    return { slope, intercept, r2 }
  }

  /**
   * Generate health recommendation based on growth trends
   */
  static _generateRecommendation(heightRate, weightRate, currentRecord, firstRecord) {
    const recommendations = []

    // Height analysis
    if (heightRate > 0.5) {
      recommendations.push('✅ Height growth is strong and healthy')
    } else if (heightRate > 0.2) {
      recommendations.push('ℹ️ Height growth is steady')
    } else if (heightRate > 0) {
      recommendations.push('⚠️ Height growth is slower than typical; monitor closely')
      recommendations.push('💡 Ensure adequate nutrition and sleep for healthy growth')
    } else {
      recommendations.push('🔴 Height growth appears to be declining; consult pediatrician')
    }

    // Weight analysis
    if (weightRate > 0.15) {
      recommendations.push('✅ Weight gain is healthy')
    } else if (weightRate > 0.05) {
      recommendations.push('ℹ️ Weight gain is appropriate')
    } else if (weightRate > 0) {
      recommendations.push('⚠️ Weight gain is slower than typical; monitor nutrition')
    } else {
      recommendations.push('🔴 Weight loss detected; consult pediatrician immediately')
    }

    // BMI consideration (simplified)
    if (currentRecord.weight && currentRecord.height) {
      const bmi = currentRecord.weight / ((currentRecord.height / 100) ** 2)
      if (bmi < 15) {
        recommendations.push('⚠️ Child appears underweight; discuss nutrition with doctor')
      } else if (bmi > 22) {
        recommendations.push('⚠️ Child may be overweight; encourage physical activity')
      }
    }

    // General recommendation
    recommendations.push('📋 Schedule regular checkups every 3-6 months for optimal monitoring')

    return recommendations
  }

  /**
   * Calculate confidence level based on data points
   */
  static _calculateConfidence(n) {
    if (n < 2) return 'low'
    if (n < 4) return 'medium'
    if (n < 8) return 'high'
    return 'very_high'
  }
}

module.exports = GrowthPredictionModel
