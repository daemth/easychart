;(function($) {
  /*
   * This function combines the chart options and (external) csv into one
   * options object before it can be used by Highcharts.
   * Inspired by: http://www.highcharts.com/docs/working-with-data/preprocessing-data-from-a-file-csv-xml-json
   */
  _preprocessHighchartsData = function(options, csv) {
    var _categories = [];

    if (typeof options == 'string') {
      options = JSON.parse(options);
    }
    options.series = [];

    // Get the CSV data
    var data = csv.replace(/EC_EOL/g, '\r\n');

    // Split the lines
    var lines = data.split('\n');

    // Iterate over the lines and add categories or series
    $.each(lines, function(lineNo, line) {
      var items = line.split(_getCSVDataSeparator(csv));
      // header line contains categories
      if (lineNo == 0) {
        $.each(items, function(itemNo, item) {
          if (itemNo > 0) _categories.push(item);
        });
      }

      // the rest of the lines contain data with their name in the first position
      else {
        var series = {
          data: []
        };
        $.each(items, function(itemNo, item) {
          if (itemNo == 0) {
            series.name = item;
          }
          else {
            series.data.push([_categories[itemNo-1],parseFloat(item)]);
          }
        });

        options.series.push(series);

      }
    });
    return options;
  };

  /*
   *  Find the data separator in a CSV file.
   */
  _getCSVDataSeparator = function (data){

    if(data.length < 1){
      return false;
    }

    var dataSeparators = [{
      name: 'comma',
      value: ','
    }, {
      name: 'semicolon',
      value: ';'
    }, {
      name: 'pipe',
      value: '|'
    }, {
      name: 'tab',
      value: '\t'
    }];

    var _lines = data.split('\n');
    var _firstLine = _lines[0];

    var _biggest = 0;
    var _indexMostOccuringSeparator = 0;

    for (var i = 0; i < dataSeparators.length; i++) {
      var _search = eval('/[^' + dataSeparators[i].value + ']/g');
      var _count = _firstLine.replace(_search, "").length;

      if (_count > _biggest) {
        _indexMostOccuringSeparator = i;
        _biggest = _count;
      }
    }
    return dataSeparators[_indexMostOccuringSeparator].value;
  };

})(jQuery);