;(function($) {
  /*
   * This function combines the chart options and (external) csv into one
   * options object before it can be used by Highcharts.
   * Inspired by/based on: http://www.highcharts.com/docs/working-with-data/preprocessing-data-from-a-file-csv-xml-json
   */
  _preprocessHighchartsData = function(options, data) {

    // Support for CMS modules that need to send the data as a one-line string.
    data = data.replace(/EC_EOL/g, '\r\n');

    if (typeof options == 'string') {
      options = Papa.parse(options).data;
    }

    if (data && typeof data == 'string') {
      data = Papa.parse(data).data;
    }

    options.series = [];

    var _chartType = typeof options.chart.type != 'undefined' ? options.chart.type : 'line';

    switch(_chartType){
      case 'line':
      case 'spline':
      case 'column':
      case 'area':
      case 'areaspline':
      case 'pie':
      case 'funnel':
      case 'gauge':
      case 'waterfall':
        options = _parseData(options, data, 1);
        break;

      case 'arearange':
      case 'areasplinerange':
      case 'columnrange':
        options = _parseData(options, data, 2);
        break;

      case 'errorbar':
      case 'scatter':
        options = _parseData(options, data, 2);
        break;

      case 'bubble':
        options = _parseData(options, data, 3);
        break;

      case 'boxplot':
        options = _parseData(options, data, 5);
        break;
    }
    return options;
  };

_parseData = function(options, data, valuesPerPoint){

    if(data.length > 0){

        var _data = data,
            _tableHeight = _data.length,
            _tableWidth = _data[0].length,
            _dataStartsInCol = 0,
            _options = options,
            _vpp = valuesPerPoint,
            _series = [],
            _categories = [],
            _categoriesInFirstColumn = _data[0][0] == "";

            _cleanCell = function(cell,axisType){

                cell = $.trim(cell);                                        // Aaaaaah, such a shame :-)

                if(axisType == 'category'){

                    if (cell === 'null' || cell === '') {
                        return null;
                    }
                    return cell;                                            // when axisType == category, cell needs to be parsed as string
                } else {
                    if (cell === 'null' || cell === '' || isNaN(cell)) {
                        return null;
                    }
                    return parseFloat(cell);                                // when axisType != category, cell needs to be parsed as float
                }
            },

            /*
             * _getColumn -> extracts column (as array) or multiple columns (as array from arrays) from a table
             * axisType -> important when the extracted column is a category-column, otherwise (for numeric column-data) this parameter can/must be empty
             */
            _getColumn = function (table, colNo, vpp, axisType) {
                var _column = table.map(function (row) {

                    var _point = vpp == 1 ? row[colNo] : row.slice(((colNo)*vpp),((colNo)*vpp)+vpp);

                        if(_realTypeOf(_point) == 'array'){
                            return _point.map(function(value){
                                return _cleanCell(value,axisType);
                            });
                        } else {
                            return _cleanCell(_point,axisType);
                        }

                });
                return _column;
            };


        if(_categoriesInFirstColumn){
            _dataStartsInCol = 1;
            _series = _data[0].slice(_dataStartsInCol,_tableWidth);                         // put series-names in _series-array
            _data = _data.slice(1, _tableHeight);                                           // remove series from multi-dimensional data array, they are in _series-array now
                                                                                            // ==> cell{0,0} is gone now
            _series = _vpp == 1 ? _series : _series.filter(function(value,index) {          // only keep series-names from series[colNo * vpp]
                if(index == 0 || index % _vpp == 0){
                    return true;
                }
            });

            _categories = _getColumn(_data,0,1,_options.xAxis.type);                        // get categories from the multi-dimensional data-array, IMPORTANT AXISTYPE-parameter

            _data = _data.map(function(value) {                                             // remove categories from data for easier data-handling, only numeric-data remains in data-array now
                    return value.slice(1,value.length);
            });

            _options.series = _series.map(function (seriesName,index) {                      // convert array with series-names to array of series-objects

                var _column = _getColumn(_data, index,_vpp);                                // get corresponding data for given serie

                _column = _column.map(function(_cell,i){                                    // turn column into array of named points [["category 1", dataPoint],["category 2", anotherDataPoint]]

                    if(_realTypeOf(_cell) == 'array'){                                      // if there are multiple values per datapoint, _cell is an array
                        return [_categories[i]].concat(_cell);
                    } else {
                        return [_categories[i],_cell];                                      // else _cell is a float
                    }

                });
                return {                                                                    // return the serie-object, on to the next series-name...
                    "name": seriesName,
                    "data": _column
                };
            });
        } else {
            // here _dataStartInCol = 0 (as set in variable declaration) because there are no categories
            _series = _data[0].slice(_dataStartsInCol,_tableWidth);
            _data = _data.slice(1, _tableHeight);
            _series = _vpp == 1 ? _series : _series.filter(function(value,index) {
                if(index == 0 || index % _vpp == 0){
                    return true;
                }
            });

           _options.series = _series.map(function (seriesName,index) {                      // TODO if- and else-clause are almost the same -> move to function

                var _column = _getColumn(_data, index,_vpp);

                _column = _column.map(function(_cell,i){
                    return _cell;
                });
                return {
                    "name": seriesName,
                    "data": _column
                };
            });
        }
        return _options;
    }
};


  /*
   * Turn 2d-array into an html-table
   *
   */
  _createTable = function (tableData,categoriesInFirstCol) {

    var table = document.createElement('table'),
        tableHead = document.createElement('thead'),
        tableBody = document.createElement('tbody');

    // todo: check if there are series-names in the first column.
    // we need 2 columns anyhow.

    for (var rowNo = 0, height = tableData.length; rowNo < height; rowNo++){

      var _cellType = rowNo == 0 ? 'th' : 'td';

      var row = document.createElement('tr');

      for (var cellNo = 0, width = tableData[rowNo].length; cellNo < width; cellNo++){
        var cell = document.createElement(_cellType);
        var cellData = tableData[rowNo][cellNo];

        cell.appendChild(document.createTextNode(cellData)); // todo: where to parse dates? e.g. with range-data
        row.appendChild(cell);
      }

      if(rowNo == 0){
        tableHead.appendChild(row);
      } else {
        tableBody.appendChild(row);
      }

    }

    table.appendChild(tableHead);
    table.appendChild(tableBody);

    return table;
  };


  /*
   * Get the type of a javascript object.
   *
   * credits: http://joncom.be/code/realtypeof/
   */
  _realTypeOf = function(v) {
    if (typeof(v) == "object") {
      if (v === null) return "null";
      if (v.constructor == (new Array).constructor) return "array";
      if (v.constructor == (new Date).constructor) return "date";
      if (v.constructor == (new RegExp).constructor) return "regex";
      return "object";
    }
    return typeof(v);
  };

  /*
   * function _transposeData()
   * params:
   * - data: 2d-array
   *
   * credits: http://www.shamasis.net/2010/02/transpose-an-array-in-javascript-and-jquery/
   */
  _transposeData = function(a) {

    // Calculate the width and height of the Array
    var w = a.length ? a.length : 0,
        h = a[0] instanceof Array ? a[0].length : 0;

    // In case it is a zero matrix, no transpose routine needed.
    if(h === 0 || w === 0) { return []; }

    /**
     * @var {Number} i Counter
     * @var {Number} j Counter
     * @var {Array} t Transposed data is stored in this array.
     */
    var i, j, t = [];

    // Loop through every item in the outer array (height)
    for(i=0; i<h; i++) {

      // Insert a new row (array)
      t[i] = [];

      // Loop through every item per item in outer array (width)
      for(j=0; j<w; j++) {

        // Save transposed data.
        t[i][j] = a[j][i];
      }
    }
    return t;
  };

})(jQuery);