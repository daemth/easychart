# Easychart
**A visual editor for the world's best web charting tool: [Highcharts] (http://www.highcharts.com/)**

## WHAT IS EASYCHART?

Easychart is a graphical user interface, built on top of the stunning Highcharts-javascript library.


## Csv data parsing/structure.
### In order to parse your submitted data correctly it is important to know that:
  - columns contain series, the first cell of a column contains the series-name
  - when using categories, the first column contains the category-names (the first cell of the category-column MUST BE EMPTY)


## Easychart integration
### Highcharts

Easychart is written as a vannila js application, very easy to integrate in your specific project or content management system. In fact, the Easychart-plugin isn't really made for standalone-use, it is made to shine in the backend of content management systems.

We've already built an [**Easychart-module for Drupal**] (https://www.drupal.org/project/easychart) which blends seamlessly with our Easychart-plugin. This module makes it possible to manage your charts in a convenient Drupal-manner. Even more, a chart only needs to be made once and can be reused in other nodes, views, panels... Not enough? It even has *WYSIWYG-integration* so it's possible to add charts through your texteditor.

*The Easychart-plugin and -Drupal-module are free.*

**Attention**
[Highcharts] (http://www.highcharts.com/) is free for personal, school or non-profit projects under the Creative Commons Attribution - Non Commercial 3.0 License.
For commercial and governmental websites and projects, you need to buy a license. (But they're absolutely worth every penny.) See [License and Pricing] (http://shop.highsoft.com/highcharts.html).

With Easychart we hope to make the beauty of Highcharts accessible to almost everyone.
*The people at [Highsoft] (http://www.highcharts.com/about) are (y)our true heroes, credit where credit is due.*
### Handsontable

If [Handsontable] (https://handsontable.com/) is loaded before Easychart, it will use it automatically as data editor. Otherwise it will fallback to a simple editable table.

## support
[![Support](https://supporterhq.com/api/b/457908od976fe6w5ijy7a91kn/Easychart)](https://supporterhq.com/support/457908od976fe6w5ijy7a91kn/Easychart)

## options
You can pass on a options object to the easychart intialiser. The initialiser is best wrapped in a DOMContentLoaded wrapper.
```javascript
document.addEventListener("DOMContentLoaded", function () {
    var options = {};
    new ec(options);
})
```
### options.element
```javascript
var containerNode = document.getElementById('container');
new ec({
    element: containerNode
});
```
### options.templatesTab
Toggles the templates tab [default:true]
```javascript
new ec({
    templatesTab: true
});
```
### options.dataTab
Toggles the data tab [default:true]
```javascript
new ec({
    dataTab: true
});
```
### options.customiseTab
Toggles the customise tab [default:true]
```javascript
new ec({
    customiseTab: true
});
```
### options.chartTab
Toggles the chart tab [default:false]
```javascript
new ec({
    chartTab: true
});
```
### options.debuggerTab
Toggles the debugger tab [default:false]
```javascript
new ec({
    debuggerTab: true
});
```
### options.data
Pass an array with data.
```javascript
var data = [
    [0,1,3],
    [1,5,7]
]
new ec({
    data: data
});
```
### options.dataCSV
Pass a csv string with data.
```javascript
var csvString = '1,2,3'
new ec({
    dataCSV: csvString
});
```
### options.dataUrl
Pass an url to a csv file with data
```javascript
new ec({
    dataUrl:'//dummyurl.com/dummy.csv'
});
```
### options.options
Pass an options object with the customisable attributes for the customise page

```javascript
var opts:[
    {
        "id": "chart",
        "panelTitle": "Chart settings",
        "panes": [
            {
                "title": "Chart type and interaction",
                "options": [
                    {
                        "name": "chart--type",
                        "fullname": "chart.type",
                        "title": "type",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "line",
                        "values": "[\"line\", \"spline\", \"column\", \"bar\", \"area\", \"areaspline\", \"pie\", \"arearange\", \"areasplinerange\", \"boxplot\", \"bubble\", \"columnrange\", \"errorbar\", \"funnel\", \"gauge\", \"heatmap\", \"polygon\", \"pyramid\", \"scatter\", \"solidgauge\", \"treemap\", \"waterfall\"]",
                        "since": "2.1.0",
                        "description": "The default series type for the chart. Can be any of the chart types listed under <a href=\"#plotOptions\">plotOptions</a>.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/type-bar/\" target=\"_blank\">Bar</a>",
                        "deprecated": false
                    }
                ]
            }
        ]
    }
];

new ec({
    options: opts
});
```
example [options](src/js/config/options.json)
disclaimer this file is generated -> [link](#generate-options-file)
### options.optionsUrl
Pass an url to a options json file
```javascript
new ec({
    optionsUrl: 'examplepathto/options.json'
});
```
### options.templates
Pass a array with preconfigured templates for the template page.
```javascript
var templatesArray = [
    {
        "id": "line",
        "type": "Line charts",
        "icon": "line",
        "templates": [
            {
                "id": "basic",
                "icon": "line_basic",
                "title": "Line chart",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            }
        ]
    }
];

new ec({
    templates:templatesObject
});
```
example [templates](src/js/config/templates.js)
### options.config
Load a existing config object
```javascript
new ec({
    data:[['move', 'excersise', 'stand'], [80,65,50]],
    config:{
           "chart": {
               "type": "column",
               "inverted": true,
               "animation": false
           },
           "xAxis": [
               {
                   "type": "category"
               }
           ],
           "plotOptions": {
               "series": {
                   "dataLabels": {
                       "enabled": true
                   }
               }
           }
    }
});
```
### options.presets
Load presets options, a preset has the same structure as options but cannot be overwritten by the user or other config. Is a tool for setting site wide config. e.g. colors
```javascript
new ec({
    presets:{
       "colors": [
            "#ECFF7C",
            "#000000",
            "#FF0000"
        ]
    }
});
```
### options.showLogo
Toggle on and off the logo [default:true]
```javascript
new ec({
    showLogo: false
});
```

## api
### instance.setData
Set the current data object.
```javascript
var instance = new ec();
var data = [
    [0,1,3],
    [1,5,7]
]
instance.setData(data);
```
### instance.getData
Get the current data object.
```javascript
var instance = new ec();

instance.getData();
```
### instance.setDataUrl
Set a data url to a csv file
```javascript
var instance = new ec();
instance.setDataUrl('pathtocsvfile/file.csv')
```
### instance.getDataUrl
Get current data url
```javascript
var instance = new ec();
instance.getDataUrl();
```
### instance.setDataCSV
Set a csv string with data.
```javascript
var csvString = '1,2,3'
var instance = new ec();
instance.setDataCSV(csvString);
```
### instance.setOptions
Set the options with the customisable attributes for the customise page
```javascript
var opts = [
    {
        "id": "chart",
        "panelTitle": "Chart settings",
        "panes": [
            {
                "title": "Chart type and interaction",
                "options": [
                    {
                        "name": "chart--type",
                        "fullname": "chart.type",
                        "title": "type",
                        "parent": "chart",
                        "isParent": false,
                        "returnType": "String",
                        "defaults": "line",
                        "values": "[\"line\", \"spline\", \"column\", \"bar\", \"area\", \"areaspline\", \"pie\", \"arearange\", \"areasplinerange\", \"boxplot\", \"bubble\", \"columnrange\", \"errorbar\", \"funnel\", \"gauge\", \"heatmap\", \"polygon\", \"pyramid\", \"scatter\", \"solidgauge\", \"treemap\", \"waterfall\"]",
                        "since": "2.1.0",
                        "description": "The default series type for the chart. Can be any of the chart types listed under <a href=\"#plotOptions\">plotOptions</a>.",
                        "demo": "<a href=\"http://jsfiddle.net/gh/get/jquery/1.7.2/highslide-software/highcharts.com/tree/master/samples/highcharts/chart/type-bar/\" target=\"_blank\">Bar</a>",
                        "deprecated": false
                    }
                ]
            }
        ]
    }
];
var instance = new ec();
instance.setOptions(opts)
```
### instance.getOptions
Get the current options config.
```javascript
var instance = new ec();
instance.getOptions()
```
### instance.setTemplates
Set an array with preconfigured templates for the template page.
```javascript
var templatesArray = [
    {
        "id": "line",
        "type": "Line charts",
        "icon": "line",
        "templates": [
            {
                "id": "basic",
                "icon": "line_basic",
                "title": "Line chart",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            }
        ]
    }
];
var instance = new ec();
instance.setTemplates(templatesArray);
```
### instance.getTemplates
Get the current template list.
```javascript
var instance = new ec();
instance.getTemplates();
```
### instance.setConfig
Set the current config from code
```javascript
var instance = new ec();
var config =
    {
        "chart": {
            "type": "column",
            "inverted": true,
            "animation": false
        },
        "xAxis": [
            {
                "type": "category"
            }
        ],
        "plotOptions": {
            "series": {
                "dataLabels": {
                    "enabled": true
                }
            }
        }
    };
instance.setConfig(config);
```
### instance.getConfig
Get the current config.
```javascript
var instance = new ec();
instance.getConfig()
```
### instance.setOptionsUrl
```javascript
var instance = new ec();
instance.setOptionsUrl('urltojsonfile.json')
```
### instance.getOptionsUrl
Get the current options url.
```javascript
var instance = new ec();
instance.getOptionsUrl()
```
### instance.setPresets
set the presets for the instance
```javascript
 var presets = {
       "colors": [
            "#ECFF7C",
            "#000000",
            "#FF0000"
        ]
    }

var instance = new ec();
instance.setPreset(preset)
```
### instance.getPresets
Get the current presets.
```javascript
var instance = new ec();
instance.getPresets()
```
## Setup
```javascript
// install dependencies
npm install
// watch and build app
gulp watchify:app
// watch and build render app
gulp watchify:render
// production build the app
gulp build

```

## Generate options file
The project also contains a small nodejs script that merges the [customise](src/js/config/customise.json) with the definitions from the highcharts attributes [dump](src/js/config/dump.json) file.

To run the generator:
```javascript
// install dependencies
npm install
// run generator
npm run genOptions
```
## Builds
### App
App build is used when configuring a chart and is best used in a backend/logged in usecase, since it quite large and has loos dependencies like highlightjs and handsontables.
### Render
Render build is used for converting raw data and configuration to an highcharts graph, this build is best used for displaying graphs build by easychart.
The render build only has a limited set op options and api calls.

options:
*   data
*   dataUrl
*   config
*   presets
*   element

api:
* setData
* setDataUrl
* setConfig
* setPresets

## License
Available under the MIT license.

## Sponsoring
This plugin was initially developed for and partially sponsored by The Government of Flanders: http://overheid.vlaanderen.be. 
