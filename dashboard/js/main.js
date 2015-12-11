$(document).ready(function() {

  /**
  * Format number to a string with N decimals
  * @method formatNumber
  * @param {Number} number
  * @param {?Number} precision - defaults to 2
  * @returns {Strin}
  */
  var formatNumber = function(number, precision) {
    precision = precision || 2
    return number && number.toFixed(2)
  }

  /**
   * Transform metrics object to datatable data array
   *
   * @function formatDataSet
   * @param metrics
   * returns {Array} dataset
   */
  var formatDataSet = function(metrics) {
    var dataSet = []

    for (var i = 0 ; i < metrics.length ; i ++) {
      var data = metrics[i]

      dataSet.push([
        data.repository,
        data.language,
        data.numberPR,
        data.contributors,
        formatNumber(data.descAvgPR),
        formatNumber(data.descAvgCommits),
        formatNumber(data.numberAvgCommits),
        formatNumber(data.numberAvgComments),
        formatNumber(data.noDescCommits),
        formatNumber(data.noDescPR),
      ])
    }
    return dataSet
  }

  /**
  * Use jQuery to udate DOM based on meta metrics
  *
  * @function setMetaDOM
  * @param {Object} meta
  */
  var setMetaDOM = function(meta) {
    $('#organization-name').html(meta.organization)
    $('#metrics-duration').html(meta.duration)
    $('#last-update').html(new Date(meta.generated).toDateString())
  }

  /**
   * Create datatable and update DOM meta elements
   * @function initializeDashboard
   * @param {Object} metrics
   */
  var initializeDashboard = function (metrics) {
    $('#repositories').DataTable( {
      info:     false,
      data: formatDataSet(metrics.data),
      order: [[1, 'desc']]
    })
    setMetaDOM(metrics.meta)
  }

  // Bootstrap dashboard
  $.get('metrics.json', function(data) {
    initializeDashboard(data)
  }).fail(function(error) {
    alert('Error loading data from "metrics.json"')
  })
})
