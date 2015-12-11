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
  * The list of metrics generated
  * @typedef {Object} metrics
  * @property {String} repository
  * @property {String} language
  * @property {Number} contributors      - number of pull requests creators
  * @property {Number} numberPR          - count of pull requests
  * @property {Number} descAvgPR         - average words per pull requests
  * @property {Number} descAvgCommits    - average words per pr commit messages
  * @property {Number} numberAvgCommits  - average number commits per pr
  * @property {Number} numberAvgComments - average number comments per pr
  * @property {Number} noDescCommits     - percentage commits without description
  * @property {Number} noDescPR          - percentage pull requests without description
  */

  /**
  * Generate detailed metrics for given repository
  * @method getRepositoryMetrics
  * @public
  * @param {Object} repositoryDetails - contains repository and pull_requests properties
  * @retuns {Object} metrics
  */
  getRepositoryMetrics: function(repositoryDetails) {
    var module = this

    return {
      repository:         repositoryDetails.repository.name,
      language:           repositoryDetails.repository.language,
      numberPR:           repositoryDetails.pull_requests.length,
      contributors:       module.getNumberContributors(repositoryDetails.pull_requests),
      descAvgPR:          module.getAveragePullRequestsWords(repositoryDetails.pull_requests),
      numberAvgCommits:   module.getAverageCommitsNumber(repositoryDetails.pull_requests),
      numberAvgComments:  module.getAverageCommentsNumber(repositoryDetails.pull_requests),
      noDescPR:           module.getPercentPullRequestsNoDesc(repositoryDetails.pull_requests),
      noDescCommits:      module.getPercentCommitsNoDesc(repositoryDetails.pull_requests),
      descAvgCommits:     module.getAverageCommitsWords(repositoryDetails.pull_requests)
    }
  },

  /**
  * Get number of contributors that created a pull request
  * @method getNumberContributors
  * @public
  * @param {Array} pullRequests
  * @returns {Number}
  */
  getNumberContributors: function(pullRequests) {
    return _.uniq(_.pluck(pullRequests,'user.id')).length
  },

  /**
  * Get percentage of pull requests commits without description
  * @method getPercentCommitsNoDesc
  * @public
  * @param {Array} pullRequests
  * @returns {Number}
  */
  getPercentCommitsNoDesc: function (pullRequests) {
    var totalCommits = 0
    return pullRequests.length > 0 ?
    _.reduce(pullRequests, function(sumForPR, pullRequest) {
      return sumForPR + _.reduce(pullRequest.pull_request_commits,
        function(sumForCommit, commitWrapper) {
          totalCommits ++
          return sumForCommit +
            commitWrapper.commit.message.split('\n\n').length > 1 ? 0 : 1
        }, 0)
    }, 0) * 100  / totalCommits : 100
  },

  /**
  * Get percentage of pull requests without body description
  * @method getPercentPullRequestsNoDesc
  * @public
  * @param {Array} pullRequests
  * @returns {Number}
  */
  getPercentPullRequestsNoDesc: function (pullRequests) {
    return pullRequests.length > 0 ?
    _.reduce(pullRequests, function(result, pullRequest) {
      return pullRequest.body ? result : result + 1
    }, 0) * 100 / pullRequests.length : 100
  },

  /**
  * Return the word average of the pull requests description
  * @method getAveragePullRequestsWords
  * @public
  * @param {Array} pullRequests
  * @returns {Number}
  */
  getAveragePullRequestsWords: function(pullRequests) {
    return pullRequests.length > 0 ?
    _.reduce(pullRequests, function(result, pullRequest) {
      return pullRequest.body === null && typeof pullRequest.body === 'object' ? result :
        result + pullRequest.body.split(' ').length
    }, 0) / pullRequests.length : 0
  },

  /**
  * Return the word average of commit messages
  * @method getAverageCommitsWords
  * @public
  * @param {Array} pullRequests
  * @returns {Number}
  */
  getAverageCommitsWords: function(pullRequests) {
    var totalCommits = 0
    return pullRequests.length > 0 ?
    _.reduce(pullRequests, function(sumForPR, pullRequest) {
      return sumForPR + _.reduce(pullRequest.pull_request_commits,
        function(sumForCommit, commitWrapper) {
          totalCommits ++
          return sumForCommit + commitWrapper.commit.message.split(' ').length
        }, 0)
    }, 0) / totalCommits : 0
  },

  /**
  * Get average number of commits per pull requests
  *
  * @method getAverageCommitsNumber
  * @public
  * @param {Array} pullRequests - contains array of commits
  * @return {Number}
  */
  getAverageCommitsNumber: function(pullRequests) {
    return pullRequests.length > 0 ?
    _.reduce(pullRequests, function(sum, pullRequest){
      return sum + pullRequest.pull_request_commits.length
    }, 0) / pullRequests.length : 0
  },

  /**
  * Get average number of comments per pull requests
  *
  * @method getAverageCommentsNumber
  * @public
  * @param {Array} pullRequests - contains array of comments
  * @return {Number}
  */
  getAverageCommentsNumber: function(pullRequests) {
    return pullRequests.length > 0 ?
    _.reduce(pullRequests, function(sum, pullRequest){
      return sum + pullRequest.pull_request_comments.length
    }, 0) / pullRequests.length : 0
  }
}
