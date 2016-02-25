# Easychart
**A visual editor for the world's best web charting tool: [Highcharts] (http://www.highcharts.com/)**

## WHAT IS EASYCHART?

Easychart is a graphical user interface, built on top of the stunning Highcharts-javascript library.
 
It was born (somewhere in 2013) out of the need to make it possible for website-editors to embed and configure Highcharts in our websites in a more intuitive way than writing javascript code in the backend. So it has evolved from a sneaky textarea to a simple yet customizable user-interface where one can create a "Highcharts Options Object" (and thus a Highchart-chart) by pasting csv-data and clicking around. 

## Integration
### HighCharts 

Easychart is written as a vannila js application, very easy to integrate in your specific project or content management system. In fact, the Easychart-plugin isn't really made for standalone-use, it is made to shine in the backend of content management systems.
 
We've already built an [**Easychart-module for Drupal**] (https://www.drupal.org/project/easychart) which blends seamlessly with our Easychart-plugin. This module makes it possible to manage your charts in a convenient Drupal-manner. Even more, a chart only needs to be made once and can be reused in other nodes, views, panels... Not enough? It even has *WYSIWYG-integration* so it's possible to add charts through your texteditor.
 
*The Easychart-plugin and -Drupal-module are free.*
 
**Attention**
[Highcharts] (http://www.highcharts.com/) is free for personal, school or non-profit projects under the Creative Commons Attribution - Non Commercial 3.0 License.
For commercial and governmental websites and projects, you need to buy a license. (But they're absolutely worth every penny.) See [License and Pricing] (http://shop.highsoft.com/highcharts.html). 

With Easychart we hope to make the beauty of Highcharts accessible to almost everyone.
*The people at [Highsoft] (http://www.highcharts.com/about) are (y)our true heroes, credit where credit is due.*
### Handsontables 

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
### options.customise
Toggle on and off the customise tab [default:false]
```javascript
new ec({
    customise: true
});
```
### options.debugger
Toggle on and off the debugger tab [default:false]
```javascript
new ec({
    debugger: true
});
```
### options.data
Pass a data array object with data
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

```javascript
new ec({

});
```
### options.dataUrl

```javascript
new ec({

});
```
### options.options

```javascript
new ec({

});
```
### options.optionsUrl

```javascript
new ec({

});
```
### options.templates

```javascript
new ec({

});
```
### options.config

```javascript
new ec({

});
```
### options.config

```javascript
new ec({

});
```
### options.preset

```javascript
new ec({

});
```
### options.events

```javascript
new ec({

});
```
## api
### instance.setData
```javascript
var instance = new ec();
```
### instance.getData
```javascript
var instance = new ec();
```
### instance.setDataUrl
```javascript
var instance = new ec();
```
### instance.getDataUrl
```javascript
var instance = new ec();
```
### instance.setDataCSV
```javascript
var instance = new ec();
```
### instance.setOptions
```javascript
var instance = new ec();
```
### instance.getOptions
```javascript
var instance = new ec();
```
### instance.setTemplates
```javascript
var instance = new ec();
```
### instance.getTemplates
```javascript
var instance = new ec();
```
### instance.setConfig
```javascript
var instance = new ec();
```
### instance.getConfig
```javascript
var instance = new ec();
```
### instance.setOptionsUrl
```javascript
var instance = new ec();
```
### instance.getOptionsUrl
```javascript
var instance = new ec();
```
### instance.setPreset
```javascript
var instance = new ec();
```
### instance.getPreset
```javascript
var instance = new ec();
```
### instance.on
```javascript
var instance = new ec();
```

## builds
### full
### minimal
Minimal build is used for converting raw data and configuration to an highcharts graph, this build is best used for displaying graphs build by easychart.
The minimal build only has a limited set op options and api calls.


options:
*   data
*   dataUrl
*   config
*   preset
*   element


api:
* setData
* setDataUrl
* setConfig
* setPreset

## License
Available under the MIT license.

## Sponsoring
This plugin is sponsored by The Flemish Government: http://www.bestuurszaken.be

