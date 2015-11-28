var githubAPI = require('github')
var _ = require('lodash')

/**
* @module Load pull requests from repos
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
  github: null,
  repos: {},
  defaultConfig: null,

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

    this.defaultConfig = {
      user: 'docker',
      repo: 'docker',
      months: 1
    }
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
    if (!module.github) {
      module.initialize()
    }

    var prConfig = {
      user:   user || module.defaultConfig.user,
      repo:   repo || module.defaultConfig.repo,
      months:  months || module.defaultConfig.months
    }

    module.repos[prConfig.repo] = [] // Clean pull of repository

    /**
    * Recursively load N pull-requests for a repository based on created date
    *
    * @method getRepoPullRequests
    * @param {Integer} page - current page to load
    * @param {Array} result - pull requests alread loaded
    */
    var getRepoPullRequests = function(page, result) {
      module.github.pullRequests.getAll({
        user: prConfig.user,
        repo: prConfig.repo,
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
              new Date().getTime() - (prConfig.months * 30 * 86400 * 1000)
          })

          result = _.union(result, filteredData)

          if (filteredData.length === data.length) {
            getRepoPullRequests(page + 1, result)
          } else {
            module.repos[prConfig.repo] = result
            console.log(result.length + ' PR added to module.repos.' + prConfig.repo)
          }
        }
      })
    }

    // Get last X months of pull requests
    getRepoPullRequests(1, [])
  }
}
