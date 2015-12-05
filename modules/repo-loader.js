var github = require('./repo-github.js')
var Q = require('q')
var _ = require('lodash')
var fs = require('fs')

/**
* @module Load pull requests from repos
* @author Camille Mizony
* @version 1.0.0
*/
module.exports = {
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
  * @returns {Object} promise resolving to number of API queries done
  */
  createCache: function(organization) {
    // getOrganizationRepos
    // getPullRequests
    //  getPullRequestsCommits
    //  getPullRequestsComments
    //  cache PR
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
