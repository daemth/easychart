# Easychart
**A visual editor for the world's best web charting tool: [Highcharts] (http://www.highcharts.com/)**

## Features
* Support for Highcharts 4.2.3
* Built on top of the [Highcharts Configuration Options] (http://api.highcharts.com/highcharts/option/dump.json)
* More chart-types available: 
  * area
  * arearange
  * areaspline
  * areasplinerange
  * bar
  * boxplot
  * bubble
  * column
  * columnrange
  * errorbar
  * funnel
  * gauge
  * line
  * pie
  * scatter
  * spline
  * waterfall
* Brand spanking new UI, customizable through JSON-object. Absolutely awesome!
* In-page help through tooltips for every option in the configuration form
* Copy-paste data from libreoffice/numbers/excel/csv-file and manage in easy-to-use table
* Huge performance improvements
* Inheritance bug solved

![v2 0-preview](https://cloud.githubusercontent.com/assets/3327763/9276906/12817b34-42a7-11e5-8826-c96b6049cb58.png)

## WHAT IS EASYCHART?

Easychart is a graphical user interface, built on top of the stunning Highcharts-javascript library.
 
It was born (somewhere in 2013) out of the need to make it possible for website-editors to embed and configure Highcharts in our websites in a more intuitive way than writing javascript code in the backend. So it has evolved from a sneaky textarea to a simple yet customizable user-interface where one can create a "Highcharts Options Object" (and thus a Highchart-chart) by pasting csv-data and clicking around. 

## Integration 
Easychart is written as a jquery-plugin, very easy to integrate in your specific project or content management system. In fact, the Easychart-plugin isn't really made for standalone-use, it is made to shine in the backend of content management systems.
 
We've already built an [**Easychart-module for Drupal**] (https://www.drupal.org/project/easychart) which blends seamlessly with our Easychart-plugin. This module makes it possible to manage your charts in a convenient Drupal-manner. Even more, a chart only needs to be made once and can be reused in other nodes, views, panels... Not enough? It even has *WYSIWYG-integration* so it's possible to add charts through your texteditor.
 
*The Easychart-plugin and -Drupal-module are free.*
 
**Attention**
[Highcharts] (http://www.highcharts.com/) is free for personal, school or non-profit projects under the Creative Commons Attribution - Non Commercial 3.0 License.
For commercial and governmental websites and projects, you need to buy a license. (But they're absolutely worth every penny.) See [License and Pricing] (http://shop.highsoft.com/highcharts.html). 



With Easychart we hope to make the beauty of Highcharts accessible to almost everyone.
*The people at [Highsoft] (http://www.highcharts.com/about) are (y)our true heroes, credit where credit is due.*

## api
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

## License
Available under the MIT license.


## Sponsoring
This plugin is sponsored by The Flemish Government: http://www.bestuurszaken.be

