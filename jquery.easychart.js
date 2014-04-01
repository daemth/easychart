;(function($) {

  var pluginName = 'easychart',
    document = window.document,
    defaults = {
      csvData             : '', // The data in CSV format.
      storedConfig        : {}, // A stored configuration as a flat JSON string.
      unwantedOptions     : 'global, lang, exporting, series, labels, navigation, loading, pane', // These options types should not be taken into account.
      unwantedReturnTypes : 'Function, CSSObject, null', // These return types should not be taken into account.
      optionsStep1        : 'chart--type', // The options for step 1 in the configuration form.
      optionsStep2        : 'title--text, chart--backgroundColor, subtitle--text, yAxis-title--text', // The options for step 2 in the configuration form.
      defaultColors       : null,
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

      // Easy Chart object.
      ec = {};

      // All Easy Chart variables
      ec.unwantedOptions            = this.options.unwantedOptions.split(/[ ,]+/); // These options should not be taken into account.
      ec.unwantedReturnTypes        = this.options.unwantedReturnTypes.split(/[ ,]+/); // These return types should not be taken into account.
      ec.optionsStep1               = this.options.optionsStep1.split(/[ ,]+/); // The options for step 1 in the configuration form.
      ec.optionsStep2               = this.options.optionsStep2.split(/[ ,]+/); // The options for step 2 in the configuration form.
      ec.defaultColors              = this.options.defaultColors;
      ec.unnestedOptions            = {};     // http://api.highcharts.com/highcharts/option/dump.json
      ec.optionsObject              = {};     // An object that holds the current configuration.
      ec.optionsString              = '';     // A string to store the different options to create the js.
      ec.optionsStringDepth         = 0;      // Used to keep track of the depth of our object while traversing it.
      ec.csvCategoriesInFirstRow    = true;   // if headers present in first row of csv-data, categories can be derived
      ec.csvSeriesNameInFirstColumn = true;
      ec.defaultDataSeparator       = ';';
      ec.dataSeparator              = ';';
      ec.autoFindSeparator          = true;
      ec.storedConfig               = this.options.storedConfig;     // An object that holds values who differ from default values as a flat JSONstring.
      ec.csvData                    = this.options.csvData;     // The CSV data
      ec.chartOptions               = {}; // The final chart options including the csv data.
      ec.dataSeparators             = [{
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
      ec.lang                        = this.options.lang, // An object holding the translations for the chart.
      ec._containerID                = 'ec-container',
      ec._chartRenderAreaID          = 'ec-chart-render-area',
      ec._dataSeparatorID            = 'ec-data-separator',
      ec._pasteDataID                = 'ec-paste-data',
      ec._pasteDataUrlID             = 'ec-data-url',
      ec._categoriesInFirstRowID     = 'ec-categories-in-first-row',
      ec._seriesNameInFirstColumnID  = 'ec-series-name-in-first-column-id',
      ec._transposeDataButtonID      = 'ec-transpose-data',
      ec._formID                     = 'ec-configuration-form',
      ec._autoFindSeparatorID        = 'ec-auto-find-separator';

      // Prepare the stored options.
      ec.storedConfig = (ec.storedConfig == null || ec.storedConfig == '' || $.isEmptyObject(ec.storedConfig)) ? {} : JSON.parse(ec.storedConfig);// : this.options.storedTextarea.val().length > 0 ? jQuery.parseJSON(this.options.storedTextarea.val()) : {}; // An object that holds values who differ from default values as a flat JSONstring.

      // Build a tree with options based on the defined options and the default options.
      ec.unnestedOptions = $.extend(true,{},highchartsConfigurationOptions.Options.options);
      ec.optionsObject = this._growTree(null, ec.unnestedOptions);

      // Print UI after the original textarea.
      $(this.element).html(this._printPage());

      // Print step 1.
      this._printPartialConfigForm(ec.optionsObject, $('#' + ec._containerID + ' form#step1'), ec.optionsStep1);

      // Print step 2.
      this._printPartialConfigForm(ec.optionsObject, $('#' + ec._containerID + ' form#step2'), ec.optionsStep2);

      // Print the advanced configuration form.
      this._printAdvancedConfigForm(ec.optionsObject, $('#'+ ec._formID));

      // Update the configurationJS and the textarea with the new data.
      this._buildJSONConfigurationString(ec.optionsObject);

      // Try to find the default data separator.
      this._getDataSeparator(ec.csvData);

      // Print the chart.
      this._printChart();



      /*
       * Eventlisteners.
       */

      var plugin = this;
      // Listener for select 'separator'.
      $('#' + ec._dataSeparatorID).change(function(){
        var _value = $(this).val();
        if (ec.dataSeparators[_value]) {
          ec.dataSeparator = ec.dataSeparators[_value].value;
          plugin._printChart();
        }
      });

      // Listener for checkbox 'auto find separator'.
      $('#' + ec._autoFindSeparatorID).change(function(){

        ec.autoFindSeparator = $(this).is(':checked');
        var $separator = $('#' + ec._dataSeparatorID);
        $separator.parent('.form-item').toggle();

        if (ec.autoFindSeparator) {
          $separator.find('>option:selected').attr('selected',false);
          plugin._getDataSeparator(ec.csvData);
          plugin._printChart();
        }
      });

      // Listener for 'pasteDataUrl'
      $('#' + ec._pasteDataUrlID).blur(function(){

        var _url = $(this).val();
        var _extension = _url.split('.').pop();

        if(_extension = 'csv' && _url.length > 0){
          $.get(_url, function(data) {
            $('#' + ec._pasteDataID).val(data);
          });
        }
      });

      // Listener for 'data-textarea'.
      $('#' + ec._pasteDataID).bind ('blur keyup', function (e) {
        var _data = $(this).val();
        if (_data.length > 0 && _data != ec.csvData) {
          ec.csvData = $.trim(_data);

          if (ec.autoFindSeparator) {
            plugin._getDataSeparator(ec.csvData);
          }
          // Print the chart.
          plugin._printChart();
        }
      });

      // Listener for checkbox 'categories in first row'.
      $('#' + ec._categoriesInFirstRowID).click(function(){
        ec.csvCategoriesInFirstRow = $(this).is(':checked');
        plugin._printChart();
      });

      // Listener for checkbox 'series name in first column'.
      $('#' + ec._seriesNameInFirstColumnID).click(function(){
        ec.csvSeriesNameInFirstColumn = $(this).is(':checked');
        plugin._printChart();
      });

      // Listener for button 'transpose data'.
      $('#' + ec._transposeDataButtonID).click(function(){
        $('#' + ec._pasteDataID).val(plugin._transposeData(ec.csvData));
        ec.csvData = $('#' + ec._pasteDataID).val();
        plugin._printChart();
      });

      // Listener for form:  binds configuration updates when form elements are updated.
      var $form = $('#' + ec._containerID + ' form');
      $('input, select, textarea', $form).change(function(e) {
        // updateConfiguration takes the actual target as parameter, in updateConfiguration the type of this target will be evaluated and based on this type the name of the corresponding property
        // can be found in the id or name-attribute-value
        plugin._updateConfiguration(e);
        plugin._printChart();
      });

      /*
       * Scrolling behavior for charts.
       */
      // For performance reasons, we store as much information as possible upfront.
      var $container = $('#' + ec._containerID);
      var $chart = $('#' + ec._chartRenderAreaID);
      var chartHeight = $chart.outerHeight();
      var containerHeight = $container.outerHeight();
      var sidebarHigherThanChart = $('.aside', $container).height() > chartHeight;

      // Helper function to calculate some flexible heights.
      function containerSizes() {
        sidebarHigherThanChart = $('.aside', $container).height() > chartHeight; // Update this variable for the scrolling behavior.
        containerHeight = $container.outerHeight(); // Update this variable for the scrolling behavior.
      }

      // Make the chart sticky when scrolling in the chart container.
      $container.scroll(function() {

        if (sidebarHigherThanChart) { // Only take action if the sidebar is higher than the chart.
          var chartPosition   = $chart.position();

          if (chartPosition.top < 0) {
            $chart.css('marginTop', Math.abs(chartPosition.top) + $container.position().top);
          }
          else {
            $chart.css('marginTop', 0);
          }
        }
      });

      // Make steps collapsible.
      $('#' + ec._containerID + ' .step h3').css('cursor', 'pointer').click(function(e) {
        var $content = $(this).siblings('.step-content');
        if ($content.is(':visible')) {
          $content.hide(0, function() {
            containerSizes();
          });
        }
        else {
          $content.fadeIn('fast', function () {
            containerSizes();
          });
        }
      });

      // Previous/Next buttons
      $('#' + ec._containerID + ' .action.next').click(function(){
        $(this).parents('.step-content').hide().parent('.step').next('.step').find('.step-content').fadeIn('fast', function () {
          containerSizes();
        });
      });
      $('#' + ec._containerID + ' .action.prev').click(function(){
        $(this).parents('.step-content').hide().parent('.step').prev('.step').find('.step-content').fadeIn('fast', function () {
          containerSizes();
        });
      });

      // Collapsible fieldsets
      $('#' + ec._containerID + ' fieldset legend').click(function() {
        $(this).parent().find(".fieldset-content").slideToggle();
      });


      /*
       * Public functions.
       */

      // Return the csv data.
      this.getCsvData = function () {
        return $('#' + ec._pasteDataID).val();
      }

      // Return the options in a format that can be stored in the database.
      this.getStoredValues = function () {
        if ($.isEmptyObject(ec.storedConfig)) {
          return '';
        }
        else {
          return JSON.stringify(ec.storedConfig);
        }
      }

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
      }

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

      output += '<div class="aside">';

      output += '<div class="step step1">';
      output += '<h3>Step 1: Chart type</h3>';
      output += '<div class="step-content open clearfix">';
      output += '<form id="step1"></form>';
      output += '<a class="button action next">Next</a>';
      output += '</div>';
      output += '</div>';

      output += '<div class="step step2">';
      output += '<h3>Step 2: Basic options</h3>';
      output += '<div class="step-content clearfix">';
      output += '<form id="step2"></form>';
      output += '<a class="button action prev">Previous</a>';
      output += '<a class="button action next">Next</a>';
      output += '</div>';
      output += '</div>';

      output += '<div class="step step3">';
      output += '<h3>Step 3: Data</h3>';
      output += '<div class="step-content clearfix">';
      output += '<div class="form-item form-type-text"><input type="text" id="' + ec._pasteDataUrlID + '" placeholder="paste url to csv here" /></div>'
      output += '<div class="form-item form-type-textarea"><textarea id="' + ec._pasteDataID + '" placeholder="paste csv data here" rows="10">' + ec.csvData +'</textarea></div>';
      output += '<div class="form-item form-type-checkbox"><input id="' + ec._categoriesInFirstRowID + '" class="ecHeadersInFirstRow" type="checkbox" checked="checked" /><label for="' + ec._categoriesInFirstRowID + '">Show categories in first row</label></div>';
      output += '<div class="form-item form-type-checkbox"><input id="' + ec._seriesNameInFirstColumnID + '" class="ecSeriesNameInFirstColumn" type="checkbox" checked="checked" /><label for="' + ec._seriesNameInFirstColumnID + '">Show series name in first column</label></div>';
      output += '<div class="form-item form-type-checkbox"><input id="' + ec._autoFindSeparatorID + '" type="checkbox" checked="checked" /><label for="' + ec._autoFindSeparatorID + '">Auto find separator</label></div>';
      output += '<div class="form-item form-type-select hidden">';
      output += '<select id="' + ec._dataSeparatorID + '" class="ecDataSeparator">';
      output += '<option>Select data separator</option>';
      $.each(ec.dataSeparators, function (i, option) {
        output += '<option value="' + i + '">' + option.name + '</option>';
      });
      output += '</select>';
      output += '</div>';
      output += '<a id="' + ec._transposeDataButtonID + '"class="button ecTransposeData">transpose data</a>';
      output += '<div class="action-wrapper">';
      output += '<a class="button action prev">Previous</a>';
      output += '<a class="button action next">Finish</a>';
      output += '</div>';
      output += '</div>';
      output += '</div>';
      output += '<div class="step"><h3>Step 4: Advanced configuration</h3><div class="step-content clearfix"><form id="' + ec._formID + '"></form></div></div>';
      output += '</div>'; // class"aside"
      output += '<div class="chart"><div class="chart-wrapper" id="' + ec._chartRenderAreaID + '"></div></div>';
      output += '</div>';

      return output;
    },

    /*
     * function getDataSeparator()
     * params:
     * - data: csv-data
     */
    _getDataSeparator: function (data){
      if(data.length < 1){return false;}
      var _data = data;
      var _lines = _data.split('\n');
      var _firstLine = _lines[0];

      var _biggest = 0;
      var _indexMostOccuringSeparator = 0;

      for (var i = 0; i < ec.dataSeparators.length; i++) {
        var _search = eval('/[^' + ec.dataSeparators[i].value + ']/g');
        var _count = _firstLine.replace(_search, "").length;

        if (_count > _biggest) {
          _indexMostOccuringSeparator = i;
          _biggest = _count;
        }
      }
      var $dataSeparator = $('#' + ec._dataSeparatorID);
      // Todo: is attr the same as prop in older jquery versions?
      $dataSeparator.find('option:selected').attr('selected', false);
      if(_biggest > 0) {
        ec.dataSeparator = ec.dataSeparators[_indexMostOccuringSeparator].value;
        $dataSeparator.find('option:selected').attr('selected', false);
        $dataSeparator.find('option[value=\'' + _indexMostOccuringSeparator + '\']').attr('selected', true);
      }
      else {
      }
    },

    /*
     * function transposeData()
     * params:
     * - data: csv-data
     */
      _transposeData: function (data) {
      if(ec.dataSeparator){
        var _lines = data.split('\n');
        var _linesCount = _lines.length;
        var _itemsCount = _lines[0].split(ec.dataSeparator).length;
        var _transposedData = '';
        for(var i = 0; i < _itemsCount; i++){
          var _newLine = [];
          for(var j = 0; j < _linesCount; j++) {
            var _items = _lines[j].split(ec.dataSeparator);
            _newLine.push(_items[i]);
          }
          _transposedData += _newLine.join(ec.dataSeparator) + '\n';
        }
        _transposedData = _transposedData.substring(0, _transposedData.length - 1);
        return _transposedData;
      }
      else {
        alert('Please select a separator before transposing data');
        return data;
      }
    },

    /*
     * function growTree()
     * params:
     * - parentId
     * - unnestedList
     */

    _growTree: function (parentId,unnestedList) {
      var _parentId = parentId;
      var _unnestedList = unnestedList;
      var _output = {};
      /*
       * private function _createBranch
       * params:
       * - output, array, hier komt de uiteindelijke output, deze wordt geretourneerd door growTree()
       * - parentId, string of null, het id van de root van de boom
       * - unnestedList, array, de platte lijst zonder hiërarchie
       */

      function _createBranch(output, parentId, unnestedList) {
        $.each (unnestedList, function(i, value) {
          var _obj = value; // copy by reference of an object (child) from the "working copy" of the unnested options list, created in init()

          // Add default colors.
          if (_obj != null && _obj.name == 'colors' && _obj.parent == parentId && ec.defaultColors != null) {
            _obj.storedValue = ec.defaultColors;
          }

          // Don't add items in the unwantedOptions or unwantendReturnTypes strings.
          if (_obj != null && $.inArray(_obj.name, ec.unwantedOptions) == -1 && $.inArray(_obj.returnType, ec.unwantedReturnTypes) == -1 && _obj.parent == parentId) {

            // als in storedValues een waarde zit voor dit object, dan wordt dit meteen toegevoegd aan het geneste object ook... todo storedValues worden nu wel op 2 plaatsen bijgehouden...
            if(ec.storedConfig.hasOwnProperty(_obj.name)){
              _obj.storedValue = ec.storedConfig[_obj.name]; // attention: _obj is a reference to value (= child from unnestedlist), this means we're adding a property to the unnestedlist!
            }

            output[_obj.name] = _obj;
            _obj.children = {};
            _createBranch(_obj.children, _obj.name, unnestedList);
          }
        });
      }
      _createBranch(_output, _parentId, _unnestedList);
      return _output;
    },

    /*
     * Return an html-element based upon the return-type of a passed object
     */
    _buildFormElement: function (object, showLabel, fullLabel) {

      var plugin = this;

      var _output = '';
      var _label = '';
      var _val = '';

      var _object = object;
      var _optionName = _object.name;
      var _values = _object.values;
      var _description = _object.description;
      var _defaults = _object.defaults;
      var _returnType = _object.returnType;
      var _children = _object.children;
      var _elementType = 'text';

      if(showLabel === undefined || showLabel) {
        // Check if we need to print the long version of the label.
        if(fullLabel === undefined) {
          _label = plugin._capitaliseFirstLetter(_object.title);
        }
        else {
          _label = plugin._capitaliseFirstLetter(_object.fullname.replace(/\./g, ' '));
        }
      }

      // Don't print the default when it is NULL.
      if (_defaults == null) {
        _defaults = '';
      }

      if(_object.hasOwnProperty('storedValue')){
        _val = _object.storedValue;

        // Overwrite default-value with stored value to mark the right element as checked or selected later in this function.
        _defaults = _val;
      }

      switch(_returnType) {
        /*
         TODO: handle these options.
         case "":
         case "Function":
         case "Mixed":
         case "plotOptions.series.states":
         case "CSSObject":
         case "null":
         _output += "*";
         break;
         */
        case "Boolean|Object":
        case "Boolean":
          _output += '<label>' + _label + '</label>';

          // Provide the array of possible values.
          _values = ['true', 'false'];
          $.each(_values,function(index,value) {
            var radio = '<input type="radio" value="'+ value +'" id="'+ _optionName + '-' + index +'" name="'+ _optionName + '"';

            if (value == _defaults || value == _defaults.toString()) {
              radio += ' checked="checked"';
            }
            radio += ' />';

            var label = '<label for="'+ _optionName + '-' + index +'">'+ plugin._capitaliseFirstLetter(value) +'</label>';
            _output += '<div class="radio">'+ radio + label + '</div>';
          });
          _elementType = 'radio';
          break;

        case "Array":
        case "Array<Color>":
        case "Array<Number>":
        case "Array<Object>":
        case "Array<String>":
        case "Array<String|Number>":
        case "String|Object":
        case "String|Number":
        case "String":
        case "Number|String":
        case "Number":
        case "Colo": // typo in the highcharts api-ref
        case "Color":
          _output +=  '<label for=\'' + _optionName + '\'>' + _label + '</label>';
          if(_values === null || _values === "")
          {
            _output += '<input type=\'text\' id=\'' + _optionName + '\' name=\'' + _optionName + '\' value=\'' + _defaults + '\' />';
          }
          else {
            // Transform the string to an array and display as option items in a select-box
            _output += '<select id=\'' + _optionName + '\' name=\'' + _optionName + '\'>';

            // remove square brackets, spaces after commas, single and double quotes and transform to an array
            // otherwise _values like [null, \"x\", \"y\", \"xy\"] can't be transformed to a descent array
            _values = _values.replace(/[\[\]]|\'|\"|\\"|\\'/g, '').replace(/, |, /g, ',').split(',');

            $.each(_values,function(index,value){
              if(value == _defaults || value == _defaults.toString())
              {
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
        default:
          _output +=  '<label for=\'' + _optionName + '\'>' + _label + '</label>';
          _output += '<textarea id=\'' + _optionName + '\' name=\'' + _optionName + '\'>' + _defaults + '</textarea>';
          break;
      }

      // Add a wrapper div for easier theming.
      _output = '<div class="form-item form-type-' + _elementType + ' clearfix">' + _output + '</div>';
      return _output;
    },


    /*
     * Print the list of configuration options.
     */
    _printAdvancedConfigForm: function (list, container) {
      var plugin = this;

      $.each (list, function (i, value) {
        // Don't print items that already appeared in the other steps.
        if (!($.inArray(value.name, ec.optionsStep1) >= 0 || $.inArray(value.name, ec.optionsStep2) > 0)) {
          var li = $('<div></div>');

          if (!$.isEmptyObject(value.children)) {
            var ol = $('<fieldset class="collapsed"></fieldset>');
            ol.append('<legend>' + plugin._capitaliseFirstLetter(value.title) + '</legend>');
            ol.append('<div class="fieldset-content"></div>');
            li.append(ol);
            plugin._printAdvancedConfigForm(value.children, $('.fieldset-content', ol));
          }
          // We still want to wrap items with no parent in a fieldset
          else if ($.isEmptyObject(value.children) && value.parent == null) {
            var ol = $('<fieldset class="collapsed"></fieldset>');
            ol.append('<legend>' + plugin._capitaliseFirstLetter(value.title) + '</legend>');
            ol.append('<div class="fieldset-content">' + plugin._buildFormElement(value, false) + '</div>');
            li.append(ol);
          }
          else {
            li.append(plugin._buildFormElement(value));
          }
          container.append(li);
        }
      });
    },

    /*
     * Update the configuration object.
     */
    _updateConfiguration: function (e) {

      var _optionName  = e.target.name;

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

            if(plugin._RealTypeOf(_value) != 'boolean' && plugin._RealTypeOf(_value) != 'null'){
              _value = _value.replace(/[\[\]]|\'|\"|\\"|\\'/g, '');
            }
            var _default = value.defaults;

            if(_value != _default) {
              value.storedValue = _value;
              ec.storedConfig[_propertyName] = _value;
            }
            else {
              delete value.storedValue;
              delete ec.storedConfig[_propertyName];
            }

            return false;
          }
        }
      });
    },

    /*
     * Convert the optionsObject to a JSON-string.
     */
    _buildJSONConfigurationString: function (list) {

      var plugin = this;
      $.each (list, function (i, object) {
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

            // empty string to null if it's original _values === null
            if(_val === '' && _defaults === null) {
              return false; // no need to save this in the configuration string
            }

            // no need to put quotes around null
            if(_val === 'null' || _val === "null") {
              _val = null;
            }

            // arrays need square brackets around the object
            var _arrayFamily = ['Array', 'Array<Color>', 'Array<Number>', 'Array<Object>', 'Array<String>', 'Array<String|Number>'];
            if($.inArray(_returnType, _arrayFamily) > -1 && _val !== null && _val !== '' && _val != undefined)
            {
              // some array items don't need quotes...
              if(_returnType == 'Array<Number>' || _returnType == 'Array<Object>') {
                _val = '[' + _val + ']';
              }
              // others do
              else
              {
                _val = _val.replace(/\s/g, ''); // remove spaces
                _val = '[\'' + _val.replace(/\,/g, '\',\'') + '\']'; // put array between square-brackets en put quotes around each item
              }
            }

            // values of elements with a certain returntype need to be quoted others don't
            if(_returnType != 'Number' && _returnType != 'Boolean' && _val !== null && $.inArray(_returnType, _arrayFamily) == -1) {
              _val = '\'' + _val + '\'';
            }

            ec.optionsString += _spaces + object.title + ': ' + _val + ',\n';
          }
        }
      });
    },

    /*
     * Print the list of configuration options.
     *
     */
    _printPartialConfigForm: function (list, container, options) {
      var _options = options;
      var _container = container;

      var plugin = this;

      $.each (list, function (i, value) {
        if (!$.isEmptyObject(value.children)) {
          plugin._printPartialConfigForm(value.children, _container, _options);
        }
        else {
          if ($.inArray(value.name, _options) >= 0 ) {
            container.append(plugin._buildFormElement(value, true, true));
          }
        }
      });
    },

    /*
     * Combine the series and the configuration to the chart.
     */
    _preprocessChart: function () {

      if (ec.optionsString != null && ec.csvData) {
        // We start with the options.
        eval('var options = {' +  ec.optionsString + '}');

        // Extend the existing options object with placeholders.
        if (ec.csvCategoriesInFirstRow) {
          options.xAxis = {};
          options.xAxis.categories = [];
        }
        options.series = [];

        // Get the CSV data
        var data = ec.csvData;

        // Split the lines
        var lines = data.split('\n');

        // Iterate over the lines and add categories or series
        $.each(lines, function(lineNo, line) {
          var items = line.split(ec.dataSeparator);

          // header line containes categories
          if (lineNo == 0 && ec.csvCategoriesInFirstRow) {
            $.each(items, function(itemNo, item) {
              if (itemNo > 0) options.xAxis.categories.push(item);
            });
          }

          // the rest of the lines contain data with their name in the first position
          else {
            var series = {
              data: []
            };
            $.each(items, function(itemNo, item) {
              if (ec.csvSeriesNameInFirstColumn && itemNo == 0) {
                series.name = item;
              }
              else {
                series.data.push(parseFloat(item));
              }
            });

            options.series.push(series);
          }
        });

        // Add translations.
        options.lang = ec.lang;

        // Store the entire configuration.
        ec.chartOptions = options;
      }
    },

    /*
     * Print the actual chart.
     */
    _printChart: function () {
      this._preprocessChart();
      if (!$.isEmptyObject(ec.chartOptions)) {
        $('#' + ec._chartRenderAreaID).highcharts(ec.chartOptions);
      }
    },

    /*
     * Get the type of a javascript object.
     */
    _RealTypeOf: function(v) {
      if (typeof(v) == "object") {
        if (v === null) return "null";
        if (v.constructor == (new Array).constructor) return "array";
        if (v.constructor == (new Date).constructor) return "date";
        if (v.constructor == (new RegExp).constructor) return "regex";
        return "object";
      }
      return typeof(v);
    },

    /*
     * Capitalise the first letter in a string.
     */
    _capitaliseFirstLetter: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
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
