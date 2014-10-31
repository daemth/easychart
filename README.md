Easychart
==========

The Easychart jQuery plugin provides a GUI to create charts based on the Highcharts library (http://www.highcharts.com/).

Requirements
------------
jQuery 1.4.4: http://jquery.com/download/
Highcharts: http://www.highcharts.com/download
Note that it is possible that you have to buy a license for Highcharts: http://shop.highsoft.com/

Options
-------
These are the available options and their defaults:

csvData             : '' // The data in CSV format.
storedConfig        : {} // A stored configuration as a flat JSON string.
unwantedOptions     : 'global, lang, exporting, series, labels, navigation, loading, pane' // These options types should not be taken into account.
unwantedReturnTypes : 'Function, CSSObject, null' // These return types should not be taken into account.
optionsStep1        : 'chart--type' // The options for step 1 in the configuration form.
optionsStep2        : 'title--text, chart--backgroundColor, subtitle--text, yAxis-title--text' // The options for step 2 in the configuration form.
defaultColors       : null
lang                : {} // An object holding the translations for the chart.

Example
-------
The Easychart plugin can be called on any div.

1. Add this in your javascript file:
    $(document).ready(function() {
      $('#myDiv').easychart();
    });

2. This would be your HTML:
    <div id="myDiv"></div>


License
-------
Available under the MIT license.


Sponsoring
----------
This plugin is sponsored by Bestuurszaken, Vlaamse Overheid: http://www.bestuurszaken.be 

