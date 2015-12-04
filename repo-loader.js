var githubAPI = require('github')
var Q = require('q')
var _ = require('lodash')
var fs = require('fs')

/**
* @module Load pull requests from repos
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
  github: null,

  /**
  * Initialize the module to use github.com api version 3 with ssl encryption
  *
  * @method initialize
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
   * Remove all cached file for a given repository
   *
   * @method refreshCache
   * @param {String} repo
   */
  refreshCache: function(repo) {
    /**
    * Remove folder recursively and synchronously
    *
    * @method deleteFolderRecursive
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

    deleteFolderRecursive('data/' + repo)
  },

  /**
  * Get recent closed pull requests of a github repository
  *
  * @method getPullRequests
  * @param {String} user
  * @param {String} repo
  * @param {Integer} months - history limit
  */
  getPullRequests: function(user, repo, months) {
    var module = this
    var deferred = Q.defer()

    if (!module.github) {
      module.initialize()
    }

    var queryConfig      = {}
    queryConfig.user     = user
    queryConfig.repo     = repo
    queryConfig.months   = months
    queryConfig.repoPath = 'data/' + queryConfig.repo
    queryConfig.prPath   = queryConfig.repoPath + '/pullRequests.json'

    /**
    * Recursively load N pull-requests for a repository based on created date
    *
    * @method getRepoPullRequests
    * @param {Integer} page - current page to load
    * @param {Array} result - pull requests alread loaded
    * @returns {Object} promise resolving to pull requests array
    */
    var getRepoPullRequests = function(page, result) {
      module.github.pullRequests.getAll({
        user: queryConfig.user,
        repo: queryConfig.repo,
        per_page: 100,
        page: page,
        state: 'closed'
      }, function(error, data) {
        if (error) {
          console.log('Error loading Pull requests')
          console.log(JSON.stringify(error, false, 2))
        } else {
          var filteredData = _.filter(data, function(pr) {
            return new Date(pr.created_at).getTime() >=
              new Date().getTime() - (queryConfig.months * 30 * 86400 * 1000)
          })

          result = _.union(result, filteredData)

          if (filteredData.length === data.length) {
            getRepoPullRequests(page + 1, result)
          } else {
            // Update pull requests with meta data
            deferred.resolve(_.map(result, function(pullRequest) {
              pullRequest.auth_user = queryConfig.user
              pullRequest.auth_repo = queryConfig.repo
              return pullRequest
            }))

            // Create pullRequests.json cache file
            fs.mkdirSync(queryConfig.repoPath)
            fs.writeFileSync(queryConfig.prPath, JSON.stringify(result, false, 2))

            console.log(result.length + ' Pull requests loaded from Github')
          }
        }
      })
    }

    if (fs.existsSync(queryConfig.prPath)) {
      fs.readFile(queryConfig.prPath, 'utf8', function(error, data) {
        var result
        try {
          result = JSON.parse(data)
        } catch (error) {
          deferred.reject(new Error(error))
          return deferred.promise;
        }

        deferred.resolve(result)
        console.log(result.length + ' Pull requests loaded from cache');
      })
    } else {
      // Query last X months of pull requests using Github API
      getRepoPullRequests(1, [])
    }

    return deferred.promise;
  },

  /**
  * Get all commits related to some pull requests
  *
  * @method getPullRequestsComments
  * @param {Array} pullRequests
  * @TODO Get more than 100 commits per PR
  * @TODO Add caching strategy to comments
  * @return {Object} promise resolving to commits array
  */
  getPullRequestsCommits: function(pullRequests) {
    var module = this

    if (!module.github) {
      module.initialize()
    }

    var promises = []
    _.forEach(pullRequests, function(pullRequest) {
      var deferred = Q.defer()
      module.github.pullRequests.getCommits({
        user: pullRequest.auth_user,
        repo: pullRequest.auth_repo,
        number: pullRequest.number,
        per_page: 100
      }, function(error, commits) {
        if (error) {
          deferred.reject(new Error(error))
          console.log('Error loading Commits for Pull request #' + pullRequest.number)
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
      promises.push(deferred.promise)
    })

    return Q.all(promises)
  },

  /**
  * Get all file comments related to some pull requests
  *
  * @method getPullRequestsComments
  * @param {Array} pullRequests
  * @TODO Get file comments and issue comments
  * @TODO Get more than 100 comments per PR
  * @TODO Add caching strategy to comments
  * @returns {Object} promise resolving to comments array
  */
  getPullRequestsComments: function(pullRequests) {
    var module = this

    if (!module.github) {
      module.initialize()
    }

    var promises = []
    _.forEach(pullRequests, function(pullRequest) {
      var deferred = Q.defer()
      module.github.pullRequests.getComments({
        user: pullRequest.auth_user,
        repo: pullRequest.auth_repo,
        number: pullRequest.number,
        per_page: 100
      }, function(error, comments) {
        if (error) {
          deferred.reject(new Error(error))
          console.log('Error loading Comments for Pull request #' + pullRequest.number)
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
      promises.push(deferred.promise)
    })

    return Q.all(promises)
  }
}
