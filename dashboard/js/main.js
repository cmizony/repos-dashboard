$(document).ready(function() {
  /**
   * Transform metrics object to datatable data array
   *
   * @function getDataSet
   * @param metrics
   * returns {Array} dataset
   */
  var getDataSet = function(metrics) {
    var dataSet = []

    for (var i = 0 ; i < metrics.length ; i ++) {
      var data = metrics[i]

      dataSet.push([
        data.repository,
        data.numberPR,
        data.descAvgPR,
        data.descAvgCommits,
        data.numberAvgCommits,
        data.numberAvgComments,
        data.noDescCommits,
        data.noDescPR,
        data.score
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
    $('#period-start').html(meta.periodStart)
    $('#period-end').html(meta.periodEnd)
  }


  // Create datatable
  $('#repositories').DataTable( {
    paging:   false,
    info:     false,
    data: getDataSet(gloablMetrics.data)
  })
  // Update DOM
  setMetaDOM(gloablMetrics.meta)
} )
