var githubAPI = require('github')
var _ = require('lodash')

/**
* @module Repo-metrics
* @description Generate pull requests metrics
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
  /**
  * Return the word average of the pull requests description
  * @method getAverageWords
  * @param {Array} pullRequests - Github API result
  * @returns {Number}
  */
  getAverageWords: function(pullRequests) {
    return pr.body === null && typeof pr.body === 'object' ? 0 :
      _.reduce(pullRequests, function(result, pr) {
        result + pr.body.split(' ').length
      }, 0) / pullRequests.length
  },

  /**
  * Get average number of commits per pull requests
  *
  * @method getAverageCommits
  * @param {Array} pullRequests - contains array of commits
  * @return {Number}
  */
  getAverageCommits: function(pullRequests) {
    return _.reduce(pullRequests, function(sum, commits){
      return sum + commits.length }, 0) / pullRequests.length
  },

  /**
  * Get average number of comments per pull requests
  *
  * @method getAverageComments
  * @param {Array} pullRequests - contains array of comments
  * @return {Number}
  */
  getAverageComments: function(pullRequests) {
    return _.reduce(pullRequests, function(sum, comments){
      return sum + comments.length }, 0) / pullRequests.length
  }
}
