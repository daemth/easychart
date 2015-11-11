/*
 Easychart JS v2.2.0 (2015-11-11)

 (c) 2014 - 2015 Thomas O. Daem

 License: www.easychart.org/license
 */

;(function($) {

  var pluginName = 'easychart',
    document = window.document,
    defaults = {
      csvData             : '', // The data in CSV format.
      storedConfig        : {}, // A stored configuration as a flat JSON string.
      unwantedOptions     : 'global, lang, series, labels, navigation, loading, pane, xAxis-plotLines', // These options types should not be taken into account.
      unwantedReturnTypes : 'Mixed, plotOptions-series-states', // These return types should not be taken into account.

      // The default configuration of the panels, panes and options.
      guiConfig           :
      {
        "panels": [
          {
            "panelTitle": "Chart settings",
            "pane": [
              {
                "title": "Chart type and interaction",
                "options": [{"name":"chart.type"},"chart.inverted","chart.zoomType"]
              },
              {
                "title": "Size and margins",
                "options": ["chart.width","chart.height","chart.spacingTop","chart.spacingRight","chart.spacingBottom","chart.spacingLeft"]
              }
            ]
          },
          {
            "panelTitle": "Colors and borders",
            "pane": [
              {
                "title": "default colors",
                "options":["colors"]
              },
              {
                "title": "Chart area",
                "options": ["chart.backgroundColor","chart.borderWidth","chart.borderRadius","chart.borderColor"]
              },
              {
                "title": "Plot area",
                "options": ["chart.plotBackgroundColor","chart.plotBackgroundImage","chart.plotBorderWidth","chart.plotBorderColor"]
              }
            ]
          },
          {
            "panelTitle": "Titles",
            "pane": [
              {
                "title":"Titles",
                "options": ["title.text","subtitle.text","yAxis.title.text","xAxis.title.text"]
              },
              {
                "title":"Title advanced",
                "options": ["title.style"]
              }
            ]
          },
          {
            "panelTitle": "Axes",
            "pane": [
              {
                "title":"Axes setup",
                "options": []
              },
              {
                "title":"X axis",
                "options": [{"name":"xAxis.type","defaults":"category"},"xAxis.min","xAxis.opposite","xAxis.reversed","xAxis.tickInterval","xAxis.labels.format","xAxis.labels.rotation","xAxis.labels.align"]
              },
              {
                "title":"Value axis",
                "options": ["yAxis.type","yAxis.min","yAxis.opposite","yAxis.reversed","yAxis.labels.format","yAxis.labels.rotation"]
              }
            ]
          },
          {
            "panelTitle": "Legend",
            "pane": [
              {
                "title":"General",
                "options": ["legend.enabled","legend.layout"]
              },
              {
                "title":"Placement",
                "options": ["legend.align","legend.verticalAlign"]
              },
              {
                "title":"Color and border",
                "options": []
              }
            ]
          },
          {
            "panelTitle": "Tooltip",
            "pane": [
              {
                "title":"General",
                "options": ["tooltip.headerFormat","tooltip.pointFormat","tooltip.valuePrefix","tooltip.valueSuffix"]
              },
              {
                "title":"Color and border",
                "options": []
              }
            ]
          },
          {
            "panelTitle": "Exporting",
            "pane": [
              {
                "title":"Exporting",
                "options": ["exporting.enabled"]
              }
            ]
          }
        ]
      },
      lang                : {} // An object holding the translations for the chart.
    };

  function Plugin( element, options ) {
    this.element = element;
    this.options = $.extend( {}, defaults, options) ;
    this._defaults = defaults;
    this._name = pluginName;

    this.init();
  }

  Plugin.prototype = {

    init: function () {

      // Easychart object.
      ec = {};

      // All Easychart variables
      ec.unwantedOptions            = this.options.unwantedOptions.split(/[ ,]+/); // These options should not be taken into account.
      ec.unwantedReturnTypes        = this.options.unwantedReturnTypes.split(/[ ,]+/); // These return types should not be taken into account.

      ec.guiConfig                  = this.options.guiConfig;

      ec.optionsObject              = {};     // An object that holds the current configuration.
      ec.optionsString              = '';     // A string to store the different options to create the js.
      ec.optionsStringDepth         = 0;      // Used to keep track of the depth of our object while traversing it.
      ec.storedConfig               = this.options.storedConfig;     // An object that holds values who differ from default values as a flat JSONstring.
      ec.csvData                    = this.options.csvData;     // The CSV data
      ec.csvDataUrl                 = this.options.csvDataUrl ? this.options.csvDataUrl : '';     // The CSV data url
      ec.dataTable                  = []; // CSV data will be transformed in this 2D-array
      ec.chartOptions               = {}; // The final chart options including the csv data.
      ec.lang                       = this.options.lang; // An object holding the translations for the chart.
      ec._containerID               = 'ec-container';
      ec._chartRenderAreaID         = 'ec-chart-render-area';
      ec._dataSeparatorID           = 'ec-data-separator';
      ec._pasteDataID               = 'ec-paste-data';
      ec._pasteDataUrlID            = 'ec-data-url';
      ec._transposeDataButtonID     = 'ec-transpose-data';
      ec._parseCsvDataButtonID      = 'ec-parse-csv-data-button';
      ec._clearUrlDataButtonID      = 'ec-clear-csv-url-button';
      ec._newDataButtonID           = 'ec-new-data-button';
      ec._dataTableID               = 'ec-data-table';
      ec._formID                    = 'ec-configuration-form';

      // Prepare the stored options.
      ec.storedConfig = (ec.storedConfig == null || ec.storedConfig == '' || $.isEmptyObject(ec.storedConfig)) ? {} : JSON.parse(ec.storedConfig);// : this.options.storedTextarea.val().length > 0 ? jQuery.parseJSON(this.options.storedTextarea.val()) : {}; // An object that holds values who differ from default values as a flat JSONstring.

      // Prepare the guiConfig.
      ec.guiConfig = (typeof(ec.guiConfig) == 'object') ? ec.guiConfig : JSON.parse(ec.guiConfig);

      // Build an object with options based on the defined options and the default options.
      ec.optionsObject = this._getDefaultOptions(null, $.extend(true,{},highchartsConfigurationOptions.options));

      // Prepare the CSV data.
      if (ec.csvDataUrl) {
        $('#' + ec._parseUrlDataButtonID);
      }
      if (ec.csvData && typeof ec.csvData == 'string') {
        ec.csvData = JSON.parse(ec.csvData);
        ec.dataTable = ec.csvData;
        ec.csvData = Papa.unparse(ec.csvData);

      }

      $('#' + ec._dataTableID).html(_createTable(ec.dataTable));
      $('#' + ec._newDataButtonID).attr('disabled',false);

      // Print UI after the original textarea.
      $(this.element).html($(this._printPage()));

      this._printConfigPanel(ec.guiConfig, $('#' + ec._containerID + ' div#configPanel'));

      // Update the configurationJS and the textarea with the new data.
      this._buildJSONConfigurationString(ec.optionsObject);


      // Print the chart.
      this._printChart();

      /*
       * UI calulations for optimal width/height
       */
      // TODO: move to a seperate function and on.resize
      var $container = $('#' + ec._containerID + ' .ec-rightCol');
      var $panel = $('#' + ec._containerID + ' #configPanel');
      $('.ec-configTabs, .ec-configPanels', $panel).height($container.height());


      /*
       * Eventlisteners.
       */

      var plugin = this;

      // Listener for data input type toggle
      $('.data-input-types li').click(function() {
        if (!$(this).hasClass('active')) {
          var type = $(this).attr("class");
          $('.data-input-types li.active').removeClass('active');
          $(this).addClass('active');
          $('.data-input > div').removeClass('active')
          $('.data-input-' + type).addClass('active');
        }
      });

      // Listener for 'pasteDataUrl'
      $('#' + ec._pasteDataUrlID).bind('keyup', function(){

        // check if something was keyed in.
        var _data = $(this).val();
        if (_data.length > 0) {
          $('#' + ec._clearUrlDataButtonID).attr('disabled',false);
        }
        else {
          $('#' + ec._clearUrlDataButtonID).attr('disabled',true);
        }
        var _url = $(this).val();
        var _extension = _url.split('.').pop();

        if(_extension == 'csv' && _url.length > 0){
          $('#' + ec._parseUrlDataButtonID).attr('disabled',false);
        }
        else {
          $('#' + ec._parseUrlDataButtonID).attr('disabled',true);
        }
      });

      // Update the chart based on the url data
      $('#' + ec._parseUrlDataButtonID).bind('click', function(){
        var _url = $('#' + ec._pasteDataUrlID).val();
        $.get(_url, function(data) {
          // Store this value.
          var data = Papa.parse(data, {skipEmptyLines: true});
          if (!$.isEmptyObject(data.errors)) {
            alert('There was an error loading the csv file. Please check the url and make sure it is on the same server.');
          }
          ec.dataTable = data.data;

          // Update the chart
          plugin._printChart();

          // Disable the other tabs.
          $('#' + ec._parseUrlDataButtonID).attr('disabled',true);
          $('.data-input-table').addClass('disabled');
          $('.data-input-csv').addClass('disabled');
        })

      });

      // Listener for clear url button.
      $('#' + ec._clearUrlDataButtonID).click(function(e) {
        $('#' + ec._pasteDataUrlID).val('');

        $('#' + ec._parseUrlDataButtonID).attr('disabled',true);
        $('#' + ec._clearUrlDataButtonID).attr('disabled', true);

        $('.data-input-table').removeClass('disabled');
        $('.data-input-csv').removeClass('disabled');

        // We don't overwrite ec.csvData when adding a url, so we can use this data to restore the original chart data.
        ec.dataTable = Papa.parse(ec.csvData, {skipEmptyLines: true}).data;

        // Print the chart.
        plugin._printChart();

      });

      // Listener for 'data-textarea'.
      $('#' + ec._pasteDataID).bind ('blur keyup', function () {

        if ($(this).val().length > 0) {
          // enable the parse table button
          $('#' + ec._parseCsvDataButtonID).attr('disabled',false);

        } else {
          $('#' + ec._parseCsvDataButtonID).attr('disabled',true);
        }
      });


      // listener for button 'parse csv data to table'.
      $('#' + ec._parseCsvDataButtonID).click(function(){

        // Store this value.
        ec.csvData = $('#' + ec._pasteDataID).val();

        // remove any white space character [\r\n\t\f ] at the end of the pasted data
        var _re = /\s+$/;                                                               // https://regex101.com/ --> great project!
        ec.csvData = ec.csvData.replace(_re, '');

        // convert null/NULL-strings to empty strings
        var _re = /\bnull\b/gi;
        ec.csvData = ec.csvData.replace(_re, '');

        // strip comments (// and multi-line)
        var _re = /(.*\/{2}.*\n)|(.*\/\*.*)|(.*\*.*)/g;
        ec.csvData = ec.csvData.replace(_re, '');

        // replace multiple newlines with one newline
        var _re = /\n{2,}/g;
        ec.csvData = ec.csvData.replace(_re, '\n');

        // empty pasteData-field
        $('#' + ec._pasteDataID).val('');

        // csv to array
        ec.dataTable = Papa.parse(ec.csvData, {skipEmptyLines: true}).data;

        // render html table in _dataTableID
        $('#' + ec._dataTableID).html(_createTable(ec.dataTable));

        $(this).attr('disabled',true);
        $('#' + ec._transposeDataButtonID).attr('disabled',false);

        // Show the data table tab
        $('.data-input-types .table').click();

        // Print the chart.
        plugin._printChart();
      });

      // Listener for button 'transpose data'.
      $('#' + ec._transposeDataButtonID).click(function(){
        ec.dataTable = _transposeData(ec.dataTable);

        $('#' + ec._dataTableID).html(_createTable(ec.dataTable));

        // Print the chart
        plugin._printChart();
      });

      // Listener for datatable
      $('#' + ec._dataTableID).click(function(e){

        var _target = e.target;

        if(_target.nodeName == 'TD' || _target.nodeName == 'TH'){

          var _row = e.target.parentNode.rowIndex,
            _col = e.target.cellIndex;

          $(_target).addClass('active-cell');

          var _val = _target.innerHTML;

          // number or string?
          if(_row == 0){
            var _input = '<input type="text" value="'+_val+'" />';
          } else {
            // todo: deze logica kan vervangen worden door te kijken naar het charttype en de coordinaten van de cel.
            var _num = new Number(_val);
            var _input = !isNaN(_num) ? '<input type="number" step="0.01" value="'+_val+'" />' : '<input type="text" value="'+_val+'" />';
          }


          $(_target).html(_input);

          $(_target).find('input').bind('keydown',function(f){
            // when return is pressed
            if (f.which === 13) {
              // apply new value and move one cell down when shift isn't pressed
              if(!f.shiftKey){
                if($(this).closest("tr").is(":last-child")){
                  $(this).blur();
                }
                else {
                  $(this).closest('tr').next().children().eq(_col).trigger('click');
                }
                // apply new value and move one cell up when shift is pressed
              }
              else {
                if($(this).closest("tr").is(":first-child")){
                  $(this).blur();
                }
                else {
                  $(this).closest('tr').prev().children().eq(_col).trigger('click');
                }
              }
            }

            // if escape is pressed: cancel
            if(f.which === 27){
              $(this).val(_val).blur();
            }

            // combinations of shift and alt with up and down arrow keys
            if(f.which === 38 || f.which === 40) {
              if (f.shiftKey && f.altKey) {
                $(this).attr('step', '10');
              }
              else if (f.shiftKey) {
                $(this).attr('step', '1');
              }
              else {
                $(this).attr('step', '0.01');
              }
            }
          });

          $(_target).find('input').focus().select().bind('blur',function(){
            $(this).parent().removeClass('active-cell');

              var _newVal = $.trim($(this).val());

              if(_val != _newVal){
                var _num = new Number(_newVal);

                if(_newVal != '' && !isNaN(_num)){ // if number -> parse as float
                                                   // empty string will be set to null in _parseData()
                  _newVal = parseFloat(_num);
                }

                $(this).parent().html(_newVal);
                ec.dataTable[_row][_col] = _newVal;
                plugin._printChart();
              } else {
                $(this).parent().html(_val);
              }
          });

        }

      });

      // Listener for form:  binds configuration updates when form elements are updated.
      var $form = $('#' + ec._containerID + ' form');
      $('input, select, textarea', $form).not('#' + ec._pasteDataID, '#' + ec._pasteDataUrlID).change(function(e) { // _pasteDataID already has an eventlistener
        // updateConfiguration takes the actual target as parameter,
        // in updateConfiguration the type of this target will be evaluated and based on this type
        // the name of the corresponding property
        // can be found in the id or name-attribute-value

        // For number fields, we reset to the default number when the field is being emptied.
        if ($(this).attr('type') == 'number' && $(this).val() == '') {
          $(this).val($(this).data('default'));
        }

        plugin._updateConfiguration(e);
        plugin._printChart();
      });

      // Listener for the vertical-tabs.
      $('#' + ec._containerID + ' .ec-configTabs li a').click(function(e){
        var _selectedTab = e.target.hash;
        $('#' + ec._containerID).find(' .ec-panel').hide();
        $('#' + ec._containerID).find(_selectedTab).show();
        $('#' + ec._containerID + ' .ec-configTabs a.active').removeClass('active');
        $(this).addClass('active');
        return false;
      });

      // first tab active on initialization
      $('#' + ec._containerID + ' .ec-configTabs li:first a').addClass('active');

      // Set the first tab to the url if it was set
      if (ec.csvDataUrl) {
        $('.data-input-types .url').click();
        $('#' + ec._parseUrlDataButtonID).attr('disabled',true);
        $('.data-input-table').addClass('disabled');
        $('.data-input-csv').addClass('disabled');
        $('#' + ec._clearUrlDataButtonID).attr('disabled',false);
      }

      /*
       * Public functions.
       */

      // Return the csv data.
      this.getCsvData = function () {
        return JSON.stringify(ec.dataTable);
      };

      // Return the csv url.
      this.getCsvUrl = function () {
        return $('#' + ec._pasteDataUrlID).val();
      };

      // Return the options in a format that can be stored in the database.
      this.getStoredValues = function () {
        if ($.isEmptyObject(ec.storedConfig)) {
          return '';
        }
        else {
          return JSON.stringify(ec.storedConfig);
        }
      };

      // Return the full Chart options to be able to print the chart.
      this.getChartOptions = function () {
        if ($.isEmptyObject(ec.chartOptions)) {
          return '';
        }
        else {
          // First we need to remove the renderTo option to avoid circular references
          ec.chartOptions.chart.renderTo = null;
          return JSON.stringify(ec.chartOptions);
        }
      };

      return this;
    },

    /*
     * Clean up.
     */
    _destroy: function () {
      $('#' + ec._containerID).remove();
    },

    /*
     * Print the entire page.
     */
    _printPage: function () {
      var output = '';
      output  = '<div class="ec-container clearfix" id="' + ec._containerID + '">';

      output += '<div class="ec-logo"><span>Easychart</span></div>';
      output += '<form>';
      output += '<div id="configPanel" class="ec-leftCol clearfix"></div>';


      output += '<div class="ec-rightCol">';
      output += '<div class="ec-chart"><div class="chart-wrapper" id="' + ec._chartRenderAreaID + '"></div></div>';

      output += '<fieldset class="ec-dataInput">';
      output += '<legend>Data-input</legend>';

      output += '<ul class="data-input-types">';
      output += '<li class="csv active">CSV input</li>';
      output += '<li class="table ">Data table</li>';
      output += '<li class="url">Url</li>';
      output += '</ul>';

      output += '<div class="data-input">';
      output += '  <div class="data-input-csv active">';
      output += '    <div class="disabled">Clear the URL to add custom csv data.</div>';
      output += '    <div class="enabled">';
      output += '      <div class="form-item form-type-textarea"><textarea id="' + ec._pasteDataID + '" placeholder="paste csv data here" rows="10">' + ec.csvData +'</textarea></div>';

      var parseButtonState = ' disabled="disabled';
      if (ec.csvData != '') {
        parseButtonState = '';
      }
      output += '      <button id="' + ec._parseCsvDataButtonID + '" type="button" ' + parseButtonState + ' class="button ecParseCsvData">parse data</button>';
      output += '    </div>';
      output += '  </div>';
      output += '  <div class="data-input-table">';
      output += '    <div class="disabled">Clear the URL to use the data table.</div>';
      output += '    <div class="enabled">';
      output += '      <div id="' + ec._dataTableID + '"></div>';
      output += '      <button id="' + ec._transposeDataButtonID + '" type="button" disabled="disabled" class="button ecTransposeData">transpose data</button>';
      output += '    </div>';
      output += '  </div>';
      output += '  <div class="data-input-url">';
      output += '    <div class="form-item form-type-text"><input type="text" id="' + ec._pasteDataUrlID + '" placeholder="paste url to csv here" value="' + ec.csvDataUrl + '" /></div>'
      output += '    <p>Enter a link to a csv file on this server.<br />Example: <strong>/my-relative-url/my-file.csv</strong> (relative path, preferable)<br />or http://my-absulute-url/my-file.csv (absolute path)</p>';
      output += '    <button id="' + ec._parseUrlDataButtonID + '" type="button" disabled="disabled" class="button ecParseUrlData">update</button>';
      output += '    <button id="' + ec._clearUrlDataButtonID + '" type="button" disabled="disabled" class="button ecParseUrlData">clear</button>';
      output += '  </div>';

      //output += '  <button id="' + ec._newDataButtonID + '" type="button" disabled="disabled"  class="button ecNewData">enter other data</button>';
      output += '</div>';

        output += '</fieldset>';

        output += '<fieldset class="ec-dataInput">';
        output += '<legend>Highcharts options object</legend>';
        output += '<div class="form-item form-type-textarea"><textarea class="ec-hcOptionsOutput" placeholder="Highcharts object" rows="12"></textarea></div>';
        output += 'copy this Highcharts options-object and try it in <a href="http://jsfiddle.net/thomasrz/jcvsLL4c/" target="_blank">JSFiddle</a>';
        output += '</fieldset>';
        output += '</form>';
      output += '</div>';

      output += '</div>';

      return output;
    },

    /*
     * function _getDefaultOptions()
     * params:
     * - parentId
     * - unnestedList
     */
    _getDefaultOptions: function (parentId,unnestedList) {
      var plugin = this;
      var _parentId = parentId;
      var _unnestedList = unnestedList;
      var _output = {};

      // Limit the unnestedList to the items in guiConfig before we do further processing.
      var _minimalOptions = {};
      var count = 0;
      $.each(ec.guiConfig.panels, function (i, panel) {
          $.each(panel.pane, function (j, pane) {
            $.each(pane.options, function (f, option) {
              function _addOptionToMinimalOptions (option) {
                var fullname = '';
                if (typeof(option) == "object") {
                  fullname = option.name;
                }
                else {
                  fullname = option;
                }
                $.each(_unnestedList, function(g, _obj) {
                  if (_obj.fullname == fullname) {

                    // Add a storedValue based on the defaults in guiConfig.
                    // This might be overwritten later on by the actual stored value.
                    if (typeof(option) == "object" && 'defaults' in option) {
                      _obj.storedValue = option.defaults;
                    }

                    if(!_obj.hasOwnProperty('values')){
                      _obj.values = null;
                    }

                    _minimalOptions[count] = _obj;
                    count++;

                    // Also add the parents, to allow for correct nesting.
                    if (_obj.parent != null) {
                      // TODO: can we avoid this manual replace in an efficient way?
                      var parentName = _obj.parent.replace(/--/g, '.').replace(/-/g, '.');
                      _addOptionToMinimalOptions(parentName)
                    }
                  }
                });
              }
              _addOptionToMinimalOptions(option);
          });
        });
      });

      /*
       * private function _createBranch
       * params:
       * - output, array, the final output
       * - parentId, string of null, the id of the root of the tree.
       * - minimalOptions, array, flat list without hierarchy
       */
      function _createBranch(output, parentName, _minimalOptions) {
        $.each (_minimalOptions, function(i, value) {
          var _obj = value;

          // Don't add items in the unwantedOptions or unwantendReturnTypes strings.
          if (_obj != null && $.inArray(_obj.name, ec.unwantedOptions) == -1 && $.inArray(_obj.returnType, ec.unwantedReturnTypes) == -1 && _obj.parent == parentName) {
            if(ec.storedConfig.hasOwnProperty(_obj.name)){
              _obj.storedValue = ec.storedConfig[_obj.name]; // attention: _obj is a reference to value (= child from _minimalOptions), this means we're adding a property to the _minimalOptions!
            }

            output[_obj.title] = _obj;
            _obj.children = {};

            _createBranch(_obj.children, _obj.name, _minimalOptions);
          }
        });
      }
      _createBranch(_output, _parentId, _minimalOptions);

      return _output;
    },

    /*
     * Return an html-element based upon the return-type of a passed object
     */
    _buildFormElement: function (option) {
      var _output = '';

      // The option can be a string or an object with name and default.
      var optionFullname = '';
      if (typeof option == "object") {
        optionFullname = option.name;
      }
      else {
        optionFullname = option;
      }

      var _stored = '';
      var _ancestors = optionFullname.split('.');
      var _selected = {};

      $.each(ec.optionsObject, function(i,option){
        if(option.title == _ancestors[0]){
          _selected = option;
          for(var j = 1, len = _ancestors.length; j < len; j++) {
            if (_selected.children[_ancestors[j]] != undefined) {
              _selected = _selected.children[_ancestors[j]];
            }
          }
          return false;
        }
      });

      var _object = _selected;

      var _optionName = _object.name;
      var _values = _object.values;
      var _defaults = _object.defaults;
      var _returnType = _object.returnType;
      var _elementType = 'text';
      var _label = _object.title == 'text' ? _object.parent : _object.title;

      // Don't print the default when it is NULL.
      if (_defaults == null) {
        _defaults = '';
      }

      // See if a value was already stored.
      if(_object.hasOwnProperty('storedValue')){
        _stored = _object.storedValue;
      }

      switch(_returnType) {

        case "Number|String":
        case "Number":
          // Fallback to the default value if no stored value was found.
          if (_stored == '') {
            _stored = _defaults;
          }
          _output +=  '<label for=\'' + _optionName + '\'>' + _label + '</label>';
          _output += '<input data-default=\'' + _defaults + '\' type=\'number\' id=\'' + _optionName + '\' name=\'' + _optionName + '\' value=\'' + _stored + '\' />';
          break;

        case "Array<Color>":
          // Fallback to the default value if no stored value was found.
          if (_stored == '') {
            _stored = _defaults;
          }
         _output += '<label for=\'' + _optionName + '\'>' + _label + '</label>';
         _output += '<input type=\'text\' id=\'' + _optionName + '\' name=\'' + _optionName + '\' value=\'' + _stored + '\' />';
         break;

        case "Color":
          // Fallback to the default value if no stored value was found.
          if (_stored == '') {
            _stored = _defaults;
          }
          _output +=  '<label for=\'' + _optionName + '\'>' + _label + '</label>';
          _output += '<input type=\'text\' class=\'color\' id=\'' + _optionName + '\' name=\'' + _optionName + '\' value=\'' + _stored + '\' />';

          break;

        case "Boolean|Object": // For UI reasons, we intentionally leave out the complexity of supporting these Boolean/Objects.
        case "Boolean":

          var checkbox = '<input type="checkbox" id="'+ _optionName + '" name="'+ _optionName + '"';

          // Check the stored value
          if (_stored === true || _stored.toString() === 'true') {
            checkbox += ' checked="checked"';
          }

          // Or check the default value if there was no stored value.
          if (_stored === '' && (_defaults === true || _defaults.toString() === 'true')) {
            checkbox += ' checked="checked"';
          }

          checkbox += ' />';

          var label = '<label for="'+ _optionName +'">'+ _label +'</label>';
          _output += '<div class="checkbox">'+ label + checkbox + '</div>';

          _elementType = 'checkbox';
          break;

        case "Array":
        case "Array<Number>":
        case "Array<Object>":
        case "Array<String>":
        case "Array<String|Number>":
        case "String|Object":
        case "String|Number":
        case "String":
          _output +=  '<label for=\'' + _optionName + '\'>' + _label + '</label>';
          if(_values === null || _values === "")
          {
            // Fallback to the default value if no stored value was found.
            if (_stored == '') {
              _stored = _defaults;
            }
            _output += '<input type=\'text\' id=\'' + _optionName + '\' name=\'' + _optionName + '\' value=\'' + _stored + '\' />';
          }
          else {
            // Transform the string to an array and display as option items in a select-box
            _output += '<select id=\'' + _optionName + '\' name=\'' + _optionName + '\'>';

            // remove square brackets, spaces after commas, single and double quotes and transform to an array
            // otherwise _values like [null, \"x\", \"y\", \"xy\"] can't be transformed to a descent array
            _values = _values.replace(/[\[\]]|\'|\"|\\"|\\'/g, '').replace(/, |, /g, ',').split(',');

            // Set the default as the first option so we can always go back to that.
            if ($.inArray(_defaults, _values) < 0) {
              _output += '<option value=\''+ _defaults +'\' selected=\'selected\'>' + _defaults + '</option>';
            }


            $.each(_values,function(index, value){
              if(_stored == '' && (value == _defaults || value == _defaults.toString())) {
                _output += '<option value=\''+ value +'\' selected=\'selected\'>' + value + '</option>';
              }
              else if(value == _stored || value == _stored.toString()) {
                _output += '<option value=\''+ value +'\' selected=\'selected\'>' + value + '</option>';
              }
              else {
                _output += '<option value=\''+ value +'\'>' + value + '</option>';
              }

            });
            _output += '</select>';
            _elementType = 'select';
          }
          break;

        case "null":
        case "Object":
        case "CSSObject":
        case "Function":
        default:
          if (_stored == '') {
            _stored = _defaults;
          }
          _output +=  '<label for="' + _optionName + '">' + _label + "</label>";
          _output += '<textarea cols="5" id="' + _optionName + '" name="' + _optionName + '">' + _stored + '</textarea>';
          break;
      }

      // Add some help
      var help = '';
      help +=  _object.description;
      help += '<div class="demo">Demo: ' + _object.demo + '</div>';

      if (help != '') {
        help = '<div class="description">' + help + '</div>';
      }

      // Add a wrapper div for easier theming.
      _output = '<div class="form-item form-type-' + _elementType + ' clearfix">' + _output + help + '</div>';

      return _output;
    },

    /*
     * Update the configuration object.
     */
    _updateConfiguration: function (e) {

      // First empty it.
      ec.optionsString = '';

      // Update the options object.
      this._updateObjectProperty(e, ec.optionsObject);

      // Update the json-config-string based upon the updated ec.optionsObject.
      this._buildJSONConfigurationString(ec.optionsObject);
    },

    /*
     * Update one property in the config object.
     */
    _updateObjectProperty: function (e, object) {

      var _propertyName = e.target.name;
      var plugin = this;

      $.each(object, function (i, value) {
        if (value.name != _propertyName) {
          if (!$.isEmptyObject(value.children)) {
            plugin._updateObjectProperty(e, value.children);
          }
        }
        else {
          if(e.type == 'change') {

            var _value = e.target.value;

            if(value.returnType == 'Boolean'){
              _value = e.target.checked;
            }

            if(value.returnType == 'Color' && _value.trim().length > 0){
              _value = "#"+_value;
            }

            // Replace single quotes to avoid formatting issues.
            if(_realTypeOf(_value) != 'boolean' && _realTypeOf(_value) != 'null'){
              _value = _value.replace(/'/g, "\\'");
            }

            value.storedValue = _value;
            ec.storedConfig[_propertyName] = _value;

            return false;
          }
        }
      });

    },

    /*
     * Get one property in a object by its name.
     */
    _getObjectPropertyByName: function (name, object) {
      var output;

      function _getObjectPropertyByNameHelper(_name, _object) {
        $.each(_object, function(i, _obj) {
          if (_obj.name == name) {
            output = _obj;
            return;
          }
          // Check the children, if any.
          if(_obj.isParent && _obj.children != undefined){
            _getObjectPropertyByNameHelper(name, _obj.children);
          }
        });
      }
      _getObjectPropertyByNameHelper(name, object);
      return output;
    },

    /*
     * Convert the optionsObject to a JSON-string.
     */
    _buildJSONConfigurationString: function (list) {
      var plugin = this;
      var _list = list;

      $.each (_list, function (i, object) {

        // These spaces are used for readability, and keep the depth of our object into account.
        var _spaces = new Array(ec.optionsStringDepth + 1).join('  ');
        if (!$.isEmptyObject(object.children)) {
          ec.optionsString += _spaces + object.title + ': {\n';
          ec.optionsStringDepth += 1;

          plugin._buildJSONConfigurationString(object.children);

          // At the end of a child, we need to remove the last comma.
          if (ec.optionsString.substring(ec.optionsString.length, ec.optionsString.length -2) == ',\n') {
            ec.optionsString = ec.optionsString.substring(0, ec.optionsString.length -2) + '\n';
          }
          ec.optionsStringDepth -= 1;
          ec.optionsString += _spaces + '},\n';
        }
        else {

          if(object.hasOwnProperty('storedValue')){

            var _val = object.storedValue;

            var _returnType = object.returnType;
            var _values = object.values;
            var _defaults = object.defaults;

            // no need to put quotes around null
            if(_val === 'null' || _val === "null") {
              _val = null;
            }

            // no need to save this in the configuration string
            if(!(_val === '' && _defaults === null)) {

              // arrays need square brackets around the object
              var _arrayFamily = ['Array', 'Array<Color>', 'Array<Number>', 'Array<Object>', 'Array<String>', 'Array<String|Number>'];
              if($.inArray(_returnType, _arrayFamily) > -1 && _val !== null && _val !== '' && _val != undefined) {
                // some array items need square brackets?...
                if(_returnType == 'Array<Number>' || _returnType == 'Array<Object>') {
                  _val = '[' + _val + ']';
                }
                // others don't
                else
                {
                  _val = _val.replace(/\s/g, ''); // remove spaces
                }
              }
              else if ($.inArray(_returnType, _arrayFamily) > -1 && _val == ''){
                _val = '[]';
              }

              // values of elements with a certain returntype need to be quoted others don't
              if(_returnType != 'CSSObject' && _returnType != 'Number' && _returnType != 'Boolean' && _val !== null && $.inArray(_returnType, _arrayFamily) == -1) {
                _val = '\'' + _val + '\'';
              }

              ec.optionsString += _spaces + object.title + ': ' + _val + ',\n';
            }
          }
        }
      });
    },

    _printConfigPanel: function (guiConfig, container) {
      var _container = container;
      var plugin = this;

      var _tabs = '<ol class="ec-configTabs">';
      var output = '<div class="ec-configPanels">';

      $.each(guiConfig.panels, function(i, value){

        _tabs += '<li><a href="#ec-configPanel-' + i + '">' + value.panelTitle + '</a></li>';

        output += '<div class="ec-panel" id="ec-configPanel-' + i + '">';

        $.each(value.pane, function(j, pane){
          // Don't print the fieldset if there are no children.
          if (pane.options.length > 0) {
            output += '<fieldset class="ec-pane">';
            output += '<legend>' + pane.title + '</legend>';
            output += '<div class="ec-formElementWrapper clearfix">';

            $.each(pane.options, function(k,option){
              if (typeof option !== "undefined") {
                output += plugin._buildFormElement(option);
              } else {
                console.log('This option is not available in the Highcharts Configuration Options.\nhttp://api.highcharts.com/highcharts/option/dump.json');
              }
            });

            output += '</div>';
            output += '</fieldset>';
          }

        });
        output += '</div>';
      });
      output += '</div>';
      _tabs += '</ol>';

      _container.append(_tabs,output);

      // Add colorpicker to color fields.
      var colorInputs = document.getElementsByClassName('color');
      for(var i = 0, len = colorInputs.length; i < len; i++){
        var myPicker = new jscolor.color(document.getElementById(colorInputs[i].id), {});
      }

      // Add openTips.
      $('#' + ec._containerID + ' .description').each(function() {
        new Opentip($(this)[0], $(this).html(), {
          group: 'Easychart',
          fixed: true,
          target: $(this)[0],
          hideDelay: 0.3
        });
      });

      $('body').delegate('.opentip-container', 'mouseenter mouseleave',
        function(event) {
          if (event.type == 'mouseenter') {
            var opentipId = parseInt($(this).attr('id').split('-')[1], 10);
            myOpentip = $.grep(Opentip.tips, function(tip){
              return tip.id === opentipId;
            })[0];

            myOpentip._abortHiding(event);
          }
          else if (event.type == 'mouseleave') {
            myOpentip.hide();
          }
        }
      )
    },

    _renderChart: function() {
      if (!$.isEmptyObject(ec.chartOptions)) {
        $('#' + ec._chartRenderAreaID).highcharts(ec.chartOptions);
        $('textarea.ec-hcOptionsOutput').val(JSON.stringify(ec.chartOptions,null,'  '));
      }
    },

    /*
     * Print the actual chart.
     */
    _printChart: function () {
      // Prepare the options.
      eval('var options = {' +  ec.optionsString + '}');

      //Extend the existing options object with placeholders.
      if (typeof options.xAxis === undefined) {
          options.xAxis = {};
      }

      // Combine options and csvData
      _preprocessHighchartsData(options, ec.dataTable);
      // Add translations.
      options.lang = ec.lang;
      // Store the entire configuration.
      ec.chartOptions = options;

      this._renderChart();
    }
  },


    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
      var args = arguments;

      // Is the first parameter an object (options), or was omitted,
      // instantiate a new instance of the plugin.
      if (options === undefined || typeof options === 'object') {
        return this.each(function () {

          // Only allow the plugin to be instantiated once,
          // so we check that the element has no plugin instantiation yet
          if (!$.data(this, 'plugin_' + pluginName)) {
            // if it has no instance, create a new one,
            // pass options to our plugin constructor,
            // and store the plugin instance
            // in the elements jQuery data object.
            $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
          }
        });

        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
      } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

        // Cache the method call
        // to make it possible
        // to return a value
        var returns;

        this.each(function () {
          var instance = $.data(this, 'plugin_' + pluginName);
          if (instance != null) {
            // Tests that there's already a plugin-instance
            // and checks that the requested public method exists
            if (instance instanceof Plugin && typeof instance[options] === 'function') {
              // Call the method of our plugin instance,
              // and pass it the supplied arguments.
              returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
            }

            var methodName = (options == 'destroy' ? '_destroy' : options);
            if (typeof instance[methodName] === 'function')
              returns = instance[methodName].apply(instance, args);

            // Allow instances to be destroyed via the 'destroy' method
            if (options === 'destroy') {
              $.data(this, 'plugin_' + pluginName, null);
            }
          }
        });

        // If the earlier cached method
        // gives a value back return the value,
        // otherwise return this to preserve chainability.
        return returns !== undefined ? returns : this;
      }
    };

})(jQuery);