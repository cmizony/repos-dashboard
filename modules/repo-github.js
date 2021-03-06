var githubAPI = require('github')
var Q = require('q')
var _ = require('lodash')

/**
* @module Repo-github
* @description Github API utils wrapper
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
  github: null,

  /**
  * Initialize the module to use github.com api version 3 with ssl encryption
  *
  * @method initialize
  * @private
  */
  initialize: function() {
    this.github = new githubAPI({
      version: '3.0.0',
      debug: false,
      protocol: 'https',
      host: 'api.github.com',
      headers: {
        'user-agent': 'NodeJS - Repos dashboard metrics'
      }
    })

    if (process.env.GITHUB_USERNAME && process.env.GITHUB_PASSWORD) {
      this.github.authenticate({
        type: "basic",
        username: process.env.GITHUB_USERNAME,
        password: process.env.GITHUB_PASSWORD
      })
    }
  },

  /**
  * Get API limit rates of current user session
  *
  * @method getRateLimit
  * @public
  * @returns {Object} Promise - resolves to rate limits
  */
  getRateLimit: function() {
    var module = this
    var deferred = Q.defer()

    if (!module.github) {
      module.initialize()
    }

    module.github.misc.rateLimit({}, function(error, data) {
      if (error) {
        deferred.reject(new Error(error))
      } else {
        deferred.resolve(data.rate)
      }
    })

    return deferred.promise;
  },

  /**
  * Get recent closed pull requests of a github repository
  *
  * @TODO current limitation to only 100 maximum
  * @method getPullRequests
  * @public
  * @param {String} organization
  * @returns {Object} promise resolving to pull requests array
  */
  getOrganizationRepos: function(organization) {
    var module = this
    var deferred = Q.defer()

    if (!module.github) {
      module.initialize()
    }

    module.github.repos.getFromOrg({
      org: organization,
      per_page: 100
    }, function(error, data) {
      if (error) {
        deferred.reject(new Error(error))
      } else {
        deferred.resolve(_.sortBy(data, function(repo) {
          return Number.MAX_VALUE - new Date(repo.updated_at).getTime()
        }))
      }
    })

    return deferred.promise;
  },

  /**
  * Get recent closed pull requests of a github repository
  *
  * @method getPullRequests
  * @public
  * @param {String} organization
  * @param {String} repo
  * @param {Integer} months - history limit
  * @returns {Object} promise resolving to pull requests array
  */
  getPullRequests: function(organization, repo, months) {
    var module = this
    var deferred = Q.defer()

    if (!module.github) {
      module.initialize()
    }

    var queryConfig          = {}
    queryConfig.organization = organization
    queryConfig.repo         = repo
    queryConfig.months       = months
    queryConfig.repoPath     = 'data/' + queryConfig.repo
    queryConfig.prPath       = queryConfig.repoPath + '/pullRequests.json'

    /**
    * Recursively load N pull-requests for a repository based on created date
    *
    * @method getRepoPullRequests
    * @private
    * @param {Integer} page - current page to load
    * @param {Array} result - pull requests alread loaded
    */
    var getRepoPullRequests = function(page, result) {
      module.github.pullRequests.getAll({
        user: queryConfig.organization,
        repo: queryConfig.repo,
        per_page: 100,
        page: page,
        state: 'closed'
      }, function(error, data) {
        if (error) {
          deferred.reject(new Error(error))
        } else {
          var filteredData = _.filter(data, function(pr) {
            return new Date(pr.created_at).getTime() >=
              new Date().getTime() - (queryConfig.months * 30 * 86400 * 1000)
          })

          result = _.union(result, filteredData)

          if (data.length > 0 && filteredData.length === data.length) {
            getRepoPullRequests(page + 1, result)
          } else {
            // Update pull requests with meta data
            deferred.resolve(_.map(result, function(pullRequest) {
              pullRequest.auth_user = queryConfig.organization
              pullRequest.auth_repo = queryConfig.repo
              return pullRequest
            }))
          }
        }
      })
    }

    getRepoPullRequests(1, [])

    return deferred.promise;
  },

  /**
  * Get all commits related to a given pull request
  *
  * @method getPullRequestCommits
  * @public
  * @param {Object} pullRequest
  * @TODO Get more than 100 commits per PR
  * @return {Object} promise resolving to commits array
  */
  getPullRequestCommits: function(pullRequest) {
    var module = this

    if (!module.github) {
      module.initialize()
    }

    var deferred = Q.defer()
    module.github.pullRequests.getCommits({
      user: pullRequest.auth_user,
      repo: pullRequest.auth_repo,
      number: pullRequest.number,
      per_page: 100
    }, function(error, commits) {
      if (error) {
        deferred.reject(new Error(error))
      } else {
        delete commits.meta
        deferred.resolve(_.map(commits, function(commit) {
          commit.pull_request_number = pullRequest.number
          commit.auth_user = pullRequest.auth_user
          commit.auth_repo = pullRequest.auth_repo
          return commit
        }))
      }
    })

    return deferred.promise
  },

  /**
  * Get all file comments related to a given pull request
  *
  * @method getPullRequestComments
  * @public
  * @param {Object} pullRequest
  * @TODO Get file comments, issue comments and commits comments
  * @TODO Get more than 100 comments per PR
  * @returns {Object} promise resolving to comments array
  */
  getPullRequestComments: function(pullRequest) {
    var module = this

    if (!module.github) {
      module.initialize()
    }

    var deferred = Q.defer()
    module.github.pullRequests.getComments({
      user: pullRequest.auth_user,
      repo: pullRequest.auth_repo,
      number: pullRequest.number,
      per_page: 100
    }, function(error, comments) {
      if (error) {
        deferred.reject(new Error(error))
      } else {
        delete comments.meta
        deferred.resolve(_.map(comments, function(comment) {
          comment.pull_request_number = pullRequest.number
          comment.auth_user = pullRequest.auth_user
          comment.auth_repo = pullRequest.auth_repo
          return comment
        }))
      }
    })

    return deferred.promise
  }
}
