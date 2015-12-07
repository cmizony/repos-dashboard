$(document).ready(function() {
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
        data.numberPR,
        data.descAvgPR.toFixed(2),
        data.descAvgCommits.toFixed(2),
        data.numberAvgCommits.toFixed(2),
        data.numberAvgComments.toFixed(2),
        data.noDescCommits || '-',
        data.noDescPR.toFixed(2),
        data.score || '-'
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
