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
  * @param {Object} data
  * @param {Number} dataIndex
  * returns {Array} dataset
  */
  var formatDataSet = function(data, dataIndex) {
    var metrics = data[dataIndex].metrics
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
  * @function setDOM
  * @param {Object} metrics
  */
  var setDOM = function(metrics) {
    $('#organization-name').html(metrics.meta.organization)
    $('#metrics-duration').html(metrics.meta.periodDuration)
    $('#last-update').html(new Date(metrics.meta.generated).toDateString())

    $.each(metrics.data, function(index, value) {
      $('#filter-tag').append(
        $('<option/>').text(value.tag).val(index)
      )
    })

    $('#filter-tag').change(function() {
      var selectedTagIndex = $('#filter-tag option:selected').val()
      datatable.clear()
      datatable.rows.add(formatDataSet(metricsData.data, selectedTagIndex))
      datatable.draw()
    })
  }

  /**
   * Create datatable and update DOM meta elements
   * @function initializeDatatable
   * @param {Object} metrics
   * @param {?Number} dataIndex
   */
  var initializeDatatable = function (metrics, dataIndex) {
    dataIndex = dataIndex || 0

    datatable = $('#repositories').DataTable( {
      info:     false,
      order: [[ 2, 'desc' ]],
      dom: 'lBfrtip',
      select: true,
      buttons: [
        {
          extend: 'collection',
          text: 'Export',
          buttons: [
            'copy',
            'excel',
            'csv',
            'pdf'
          ]
        }
      ],
      data: formatDataSet(metrics.data, dataIndex)
    })
  }

  /**
  * @type {Object} metricsData - metrics.json
  */
  var metricsData
  /**
  * $type {Object} datatable - reference to Datatable repositories
  */
  var datatable

  // Bootstrap dashboard
  $.get('metrics.json', function(data) {
    metricsData = data
    initializeDatatable(metricsData)
    setDOM(metricsData)
  }).fail(function(error) {
    alert('Error loading data from "metrics.json"')
  })
})
