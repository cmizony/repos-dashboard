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
    var deferred = Q.defer()
    monthsHistory = monthsHistory || 3
    outputFilePath = outputFilePath || 'dashboard/metrics.json'

    loader.createCache(organization, monthsHistory).then(function(repositoriesDetails){
      // 1. Generate meta object
      var meta = {
        organization: organization,
        generated: new Date().toISOString(),
        duration: monthsHistory + ' months'
      }

      // 2. Generate data array of metrics
      var data =  _.reduce(repositoriesDetails, function(result, repositoryDetails) {
        result.push(metrics.getRepositoryMetrics(repositoryDetails))
        return result
      }, [])

      // 3. Write output file
      var globalMetrics = {
        meta: meta,
        data: data
      }
      fs.writeFileSync(outputFilePath, JSON.stringify(globalMetrics, false, 2))

      deferred.resolve(globalMetrics)
    }).catch(function(error) { deferred.reject(new Error(error)) })

    return deferred.promise
  }
}
