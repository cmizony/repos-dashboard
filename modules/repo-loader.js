var github = require('./repo-github.js')
var Q = require('q')
var _ = require('lodash')
var fs = require('fs')

/**
* @module Repo-loader
* @description Cache and Load repos pull requests
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
  /**
  * Count of Github network queries to anticipate API rate limits
  * @type {Number}
  */
  countQueries: 0,

  /**
   * Remove all cached file for a given organization
   *
   * @method refreshCache
   * @public
   * @param {String} organization
   */
  refreshCache: function(organization) {
    /**
    * Remove folder recursively and synchronously
    *
    * @method deleteFolderRecursive
    * @private
    * @param {String} path
    */
    var deleteFolderRecursive = function(path) {
      if(fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath)
          } else { // delete file
            fs.unlinkSync(curPath)
          }
        })
        fs.rmdirSync(path)
      }
    }

    deleteFolderRecursive('cache/' + organization)
  },

  /**
  * Load repositories and pull requests on the file system. Skip pull requests
  * that already exist.
  *
  * @method createCache
  * @public
  * @param {String} organization
  * @param {?Number} monthsHistory - optional
  * @param {?String} rootPath - optional
  * @returns {Object} promise resolving to number of API queries done
  */
  createCache: function(organization, monthsHistory, rootPath) {
    var module = this
    monthsHistory = monthsHistory || 3

    // Create main cache folder
    var cachePathOrg = (rootPath || 'cache') + '/' + organization
    if (!fs.existsSync(cachePathOrg)) {
      fs.mkdirSync(cachePathOrg)
    }

    // Process Organization
    var organizationDeferred = Q.defer()
    module.countQueries += 1
    github.getOrganizationRepos(organization).then(function(repositories) {
      module.processRepositories(repositories, organization, monthsHistory, cachePathOrg).then(function(result) {
        organizationDeferred.resolve(result)
      }).catch(function(error) { organizationDeferred.reject(new Error(error)) })
    }).catch(function(error) { organizationDeferred.reject(new Error(error)) })

    return organizationDeferred.promise
  },

  /**
  * Get details of pull request from API for file system if exists
  * @method getPullRequestDetails
  * @private
  * @param {Object} pullRequest
  * @param {String} cachePathRepo
  * @returns {Object} promise - resolved in pull request detail
  */
  getPullRequestDetails: function(pullRequest, cachePathRepo) {
    var cachePathPR = cachePathRepo + '/pr_' + pullRequest.number + '.json'
    var pullRequestDeferred = Q.defer()

    // Get data from file system
    if (fs.existsSync(cachePathPR)) {
      fs.readFile(cachePathPR, 'utf8', function(error, data) {
        var result
        try {
          result = JSON.parse(data)
        } catch (error) {
          fs.unlinkSync(cachePathPR) // Delete corrupted file
          pullRequestDeferred.reject(new Error(error))
        }

        if (result) {
          pullRequestDeferred.resolve(result)
        }
      })
    } else { // Query Github API
      var commitsDeferred = Q.defer()
      var commentsDeferred = Q.defer()

      module.countQueries += 1
      github.getPullRequestCommits(pullRequest).then(function(commits) {
        commitsDeferred.resolve(commits)
      }).catch(function(error) { commitsDeferred.reject(new Error(error)) })

      module.countQueries += 1
      github.getPullRequestComments(pullRequest).then(function(comments) {
        commentsDeferred.resolve(comments)
      }).catch(function(error) { commentsDeferred.reject(new Error(error)) })

      Q.all([
        commitsDeferred.promise,
        commentsDeferred.promise
      ]).then(function(result) {
        pullRequest.pull_request_commits = result[0]
        pullRequest.pull_request_comments = result[1]
        fs.writeFileSync(cachePathPR, JSON.stringify(pullRequest, false, 2))
        pullRequestDeferred.resolve(pullRequest)
      }).catch(function(error) { pullRequestDeferred.reject(new Error(error)) })
    }

    return pullRequestDeferred.promise
  },

  /**
  * @method processRepositories
  * @private
  * @param {Array} repositories
  * @param {String} organization
  * @param {Number} monthsHistory
  * @param {String} cachePathOrg
  * @return {Object} promise - resolves to array of pull requests details
  */
  processRepositories: function(repositories, organization, monthsHistory, cachePathOrg) {
    var repositoryPromises = []
    var module = this

    _.forEach(repositories, function(repository) {
      var repositoryDeferred = Q.defer()
      var cachePathRepo = cachePathOrg + '/' + repository.name

      if (!fs.existsSync(cachePathRepo)) {
        fs.mkdirSync(cachePathRepo)
      }

      // Process repository
      github.getPullRequests(organization, repository.name,
      monthsHistory).then(function(pullRequests) {
        module.countQueries += pullRequests.length/100
        module.processPullRequests(pullRequests, cachePathRepo).then(function(result) {
          repositoryDeferred.resolve({
            repository: repository,
            pull_requests: result
          })
        }).catch(function(error) { repositoryDeferred.reject(new Error(error)) })
      }).catch(function(error) { repositoryDeferred.reject(new Error(error)) })

      repositoryPromises.push(repositoryDeferred.promise)
    })

    return Q.all(repositoryPromises)
  },

  /**
  * @method processPullRequests
  * @private
  * @param {Array} pullRequests
  * @param {String} cachePathRepo
  * @return {Object} promise - resolves to array of pull request details
  */
  processPullRequests: function(pullRequests, cachePathRepo) {
    var module = this
    var pullRequestPromises = []

    _.forEach(pullRequests, function(pullRequest) {
      var pullRequestDetailsDeferred = Q.defer()
      module.getPullRequestDetails(pullRequest, cachePathRepo).then(function(pullRequestDetails) {
        pullRequestDetailsDeferred.resolve(pullRequestDetails)
      }).catch(function(error) { pullRequestDetailsDeferred.reject(new Error(error)) })

      pullRequestPromises.push(pullRequestDetailsDeferred.promise)
    })

    return Q.all(pullRequestPromises)
  },

  /**
  * Load all organinzation repositories from file system into json object
  *
  * @method createCache
  * @public
  * @param {String} organization
  * @returns {Object} promise resolving to organization data
  */
  getCache: function(organization) {
  },
}
