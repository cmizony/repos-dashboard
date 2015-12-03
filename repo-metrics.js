var githubAPI = require('github')
var _ = require('lodash')

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

  getAverageCommits: function(pullRequests) {
  },

  getAverageComments: function(pullRequests) {
  }
}
