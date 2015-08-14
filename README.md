#Easychart
The Easychart jQuery plugin provides a GUI to create charts based on the Highcharts library (http://www.highcharts.com/).

##Requirements
jQuery 1.4.4: http://jquery.com/download/

Highcharts: http://www.highcharts.com/download

Note that it is possible that you have to buy a license for Highcharts: http://shop.highsoft.com/

##Options
These are the available options and their defaults:

csvData             : '' // The data in CSV format.

storedConfig        : {} // A stored configuration as a flat JSON string.

unwantedOptions     : 'global, lang, series, labels, navigation, loading, pane, xAxis-plotLines' // These options types should not be taken into account.

unwantedReturnTypes : 'Mixed, plotOptions-series-states' // These return types should not be taken into account.

guiConfig           :     {
                                  "panels": [
                                    {
                                      "panelTitle": "Chart settings",
                                      "pane": [
                                        {
                                          "title": "Chart type and interaction",
                                          "options": [{"name":"chart.type","defaults":"column"},"chart.inverted","chart.zoomType"]
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
                                } // A configuration of the UI and optional default values

lang                : {} // An object holding the translations for the chart.

## Example

The Easychart plugin can be called on any div.

1. Add this in your javascript file:
	```
    $(document).ready(function() {
      $('#myDiv').easychart();
    });
    ```

2. This would be your HTML:
    ```
      <div id="myDiv"></div>
    ```


## License
Available under the MIT license.


## Sponsoring
This plugin is sponsored by Bestuurszaken, Vlaamse Overheid: http://www.bestuurszaken.be 

