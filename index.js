var loader = require('./modules/repo-loader.js')
var metrics = require('./modules/repo-metrics.js')
var fs = require('fs')
var Q = require('q')
var _ = require('lodash')

/**
* @module Get Github organizations metrics
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
  /**
  * Create metrics for repositories of a given organization
  * @method generateMetrics
  * @public
  * @param {String} organization
  * @param {?Number} monthsHistory - optional
  * @param {?String} outputFilePath - optional
  * @returns {Object} promise - resolves to gloablMetrics
  */
  generateMetrics: function(organization, monthsHistory, outputFilePath) {
    var module = this
    var deferred = Q.defer()
    monthsHistory = monthsHistory || 3
    outputFilePath = outputFilePath || 'dashboard/metrics.json'

    loader.createCache(organization, monthsHistory).then(function(repositoriesDetails){
      // 1. Generate meta object
      var meta = {
        organization: organization,
        generated: new Date().toISOString(),
        periodDuration: monthsHistory + ' months'
      }

      // 2. Generate data array of metrics
      var data = []
      var today = new Date().getTime()
      var milisecondPerMonths = 31 * 86400 * 1000
      var firstDate = today - monthsHistory * milisecondPerMonths

      data.push({
        tag: 'Last ' + monthsHistory + ' months (' + monthsHistory * 31 + ' days)',
        metrics: module.getFilteredRepoMetrics(repositoriesDetails, firstDate, today)
      })
      var time, history
      for(time = today, history = 1;
          time > firstDate;
          time -= milisecondPerMonths, history++) {
        data.push({
          tag: history + ' months ago (31 days)',
          metrics: module.getFilteredRepoMetrics(
                    repositoriesDetails,
                    time - milisecondPerMonths,
                    time)
        })
      }

      // 3. Write output file
      var globalMetrics = {
        meta: meta,
        data: data
      }
      fs.writeFileSync(outputFilePath, JSON.stringify(globalMetrics, false, 2))

      deferred.resolve(globalMetrics)
    }).catch(function(error) { deferred.reject(new Error(error)) })

    return deferred.promise
  },

  /**
  * Generate repositories metrics for specific period of time
  * @method getFilteredRepoMetrics
  * @private
  * @param {Array} repositoriesDetails
  * @param {Object} start - date
  * @param {Object} end - date
  * @returns {Object} metrics
  */
  getFilteredRepoMetrics: function(repositoriesDetails, start, end) {
    return _.reduce(repositoriesDetails, function(result, repositoryDetails) {
      result.push(metrics.getRepositoryMetrics(
        repositoryDetails.repository,
        _.filter(repositoryDetails.pull_requests, function(pr) {
            var prTime = new Date(pr.created_at).getTime()
            return prTime >= start && prTime <= end
          }
        )
      ))
      return result
    }, [])
  }

}
