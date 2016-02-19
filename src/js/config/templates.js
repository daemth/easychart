var templates = [
    {
        "id": "line",
        "type": "Line charts",
        "icon": "line",
        "templates": [
            {
                "id": "basic",
                "icon": "area",
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
            },
            {
                "id": "dataLabels",
                "title": "With data labels",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values. Data labels by default displays the Y value.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "spline",
                "title": "Spline",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "spline"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "splineDataLabels",
                "title": "Spline with labels",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "spline"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "splineLogarithmic",
                "title": "Logarithmic",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "spline"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "yAxis": [{
                        "type": "logarithmic"
                    }],
                    "plotOptions": {
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "step",
                "title": "Step line",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "step": "left"
                        }
                    }
                }
            },
            {
                "id": "stepWithLabels",
                "title": "Step line with labels",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "step": "left",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "inverted",
                "title": "Inverted",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "negativeColor",
                "title": "Negative color",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "negativeColor": "#0088FF"
                        }
                    }
                }
            },
            {
                "id": "errorBar",
                "title": "Error bar",
                "desc": "Requires one data column for X values or categories, subsequently one data column for the series' Y values and two columns for the error bar series maximum and minimum.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "series": [
                        {"type": null},
                        {"type": "errorbar"}
                    ]
                }
            },
            {
                "id": "combinationColumn",
                "title": "Combination chart",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "line"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "series": [
                        {"type": null},
                        {"type": "column"}
                    ]
                }
            }
        ]
    },
    {
        "id": "area",
        "type": "Area charts",
        "icon": "area",
        "templates": [
            {
                "id": "basic",
                "title": "Area Chart",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "withLabels",
                "title": "Area with labels",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "stacked",
                "title": "Stacked",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "stacking": "normal"
                        }
                    }
                }
            },
            {
                "id": "stackedWithLabels",
                "title": "Stacked with labels",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "stacking": "normal",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "stackedPercentage",
                "title": "Stacked percentage",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "stacking": "percent"
                        }
                    }
                }
            },
            {
                "id": "inverted",
                "title": "Inverted",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "invertedWithLabels",
                "title": "Inverted with labels",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "stacking": "normal",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "stepLine",
                "title": "Step line",
                "desc": "Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "step": "left"
                        }
                    }
                }
            },
            {
                "id": "negativeColor",
                "title": "Negative color",
                "desc": "Displays negative values with an alternative color. Colors can be set in plotOptions.series.negativeColor. Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "area"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions": {
                        "series": {
                            "negativeColor": "#0088FF",
                            "color": "#FF000000"
                        }
                    }
                }
            },
            {
                "id": "range",
                "title": "Area range",
                "desc": "Requires one data column for X values or categories, subsequently two data column for each arearange series' Y values.",
                "definition": {
                    "chart": {
                        "type": "arearange"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            }
        ]
    },
    {
        "id": "column",
        "type": "Column charts",
        "icon": "column",
        "templates": [
            {
                "id": "basic",
                "title": "Basic",
                "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "withLabels",
                "title": "With labels",
                "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions":{
                        "series":{
                            "dataLabels":{
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "fixedPlacement",
                "title": "Column with fixed placement",
                "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    chart: {
                        type: 'column'
                    },
                    yAxis: [{
                        min: 0,
                        title: {
                            text: 'Employees'
                        }
                    }, {
                        title: {
                            text: 'Profit (millions)'
                        },
                        opposite: true
                    }],
                    tooltip: {
                        shared: true
                    },
                    plotOptions: {
                        column: {
                            grouping: false,
                            shadow: false,
                            borderWidth: 0
                        }
                    },
                    series: [{
                        color: 'rgba(165,170,217,1)',
                        pointPadding: 0.3,
                        pointPlacement: -0.2
                    }, {
                        color: 'rgba(126,86,134,.9)',
                        pointPadding: 0.4,
                        pointPlacement: -0.2
                    }, {
                        color: 'rgba(248,161,63,1)',
                        tooltip: {
                            valuePrefix: '$',
                            valueSuffix: ' M'
                        },
                        pointPadding: 0.3,
                        pointPlacement: 0.2,
                        yAxis: 1
                    }, {
                        color: 'rgba(186,60,61,.9)',
                        tooltip: {
                            valuePrefix: '$',
                            valueSuffix: ' M'
                        },
                        pointPadding: 0.4,
                        pointPlacement: 0.2,
                        yAxis: 1
                    }]
                }
            },
            {
                "id": "3d",
                "title": "Column 3D",
                "description": "Grouped column chart. Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "margin": 75,
                        "options3d": {
                            "enabled": true,
                            "alpha": 15,
                            "beta": 15,
                            "depth": 50,
                            "viewDistance": 15
                        }
                    },
                    "plotOptions": {
                        "column": {
                            "depth": 25
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stacked",
                "title": "Stacked",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "normal"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stackedWithLabels",
                "title": "Stacked with labels",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "normal",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stacked3d",
                "title": "Stacked 3D",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "margin": 75,
                        "options3d": {
                            "enabled": true,
                            "alpha": 15,
                            "beta": 15,
                            "depth": 50,
                            "viewDistance": 15
                        }
                    },
                    "plotOptions": {
                        "column": {
                            "depth": 25
                        },
                        "series": {
                            "stacking": "normal"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stackedPercent",
                "title": "Stacked percent",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "percent"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stackedPercentWithLabels",
                "title": "Stacked percent with labels",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "percent",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "negativeColor",
                "title": "Negative color",
                "desc": "Displays negative values with an alternative color. Colors can be set in plotOptions.series.negativeColor. Requires one column for X values or categories, subsequently one column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions":{
                        "series":{
                            "negativeColor": "#0088FF",
                            "color": "#FF0000"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "multiColor",
                "title": "Multi color",
                "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions":{
                        "series":{
                            "colorByPoint": true
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "logarithmic",
                "title": "Logarithmic",
                "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "yAxis": [{
                        "type": "logarithmic",
                        "minorTickInterval": "auto"
                    }]
                }
            },
            {
                "id": "range",
                "title": "Columnrange",
                "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "columnrange"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "rangeWithLabels",
                "title": "Columnrange with labels",
                "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "columnrange"
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions":{
                        "series":{
                            "dataLabels":{
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "packed",
                "title": "Packed Columns",
                "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "plotOptions": {
                        "series": {
                            "pointPadding": 0,
                            "groupPadding": 0,
                            "borderWidth": 0,
                            "shadow": false
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "errorbar",
                "title": "Error bar",
                "desc": "Requires one data column for X values or categories, subsequently one data column for the series' Y values. and two columns for the error bar series maximum and minimum.",
                "definition": {
                    "chart": {
                        "type": "column"
                    },
                    "series": [
                        {"type": null},
                        {
                            "type": "errorbar",
                            "showInLegend": true
                        }
                    ],
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            }
        ]
    },
    {
        "id": "bar",
        "type": "Bar charts",
        "icon": "bar",
        "templates": [
            {
                "id": "basic",
                "title": "Basic bar",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "barWithNegativeStack",
                "title": "Bar with negative stack",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    chart: {
                        type: 'bar'
                    },
                    xAxis: [{
                        reversed: false,
                        labels: {
                            step: 1
                        }
                    }, { // mirror axis on right side
                        opposite: true,
                        reversed: false,
                        linkedTo: 0,
                        labels: {
                            step: 1
                        }
                    }],
                    yAxis: [{
                        title: {
                            text: null
                        },
                        labels: {
                            formatter: function () {
                                return Math.abs(this.value) + '%';
                            }
                        }
                    }],
                    plotOptions: {
                        series: {
                            stacking: 'normal'
                        }
                    },
                    tooltip: {
                        formatter: function () {
                            return '<b>' + this.series.name + ', age ' + this.point.category + '</b><br/>' +
                                'Population: ' + Highcharts.numberFormat(Math.abs(this.point.y), 0);
                        }
                    }
                }
            },
            {
                "id": "basicWithLabels",
                "title": "Basic with labels",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "plotOptions":{
                        "series":{
                            "dataLabels":{
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "stacked",
                "title": "Stacked bar",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "normal"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stackedWithLabels",
                "title": "Stacked with labels",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "normal",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stackedPercentage",
                "title": "Stacked percentage bar",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "percent"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "stackedPercentageWithLabels",
                "title": "Stacked percentage bar with labels",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "stacking": "percent",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "negativeColor",
                "title": "Negative color",
                "description": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions":{
                        "series":{
                            "negativeColor": "#0088FF",
                            "color": "#FF0000"
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "multiColor",
                "title": "Multi color",
                "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "colorByPoint": true
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "horizontalColumnrange",
                "title": "Horizontal columnrange",
                "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "columnrange",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "logarithmic",
                "title": "Logarithmic",
                "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "yAxis": [{
                        "type": "logarithmic",
                        "minorTickInterval": "auto"
                    }],
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "horizontalColumnrangeWithLabels",
                "title": "Horizontal columnrange with labels",
                "desc": "Requires one data column for X values or categories, subsequently two data columns for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "columnrange",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "packedBars",
                "title": "Packed Bars",
                "desc": "Requires one data column for X values or categories, subsequently one data column for each series' Y values.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "plotOptions": {
                        "series": {
                            "pointPadding": 0,
                            "groupPadding": 0,
                            "borderWidth": 0,
                            "shadow": false
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "errorbar",
                "title": "Error bar",
                "desc": "Requires one data column for X values or categories, subsequently one data column for the series' Y values. and two columns for the error bar series maximum and minimum.",
                "definition": {
                    "chart": {
                        "type": "column",
                        "inverted": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }],
                    "series": [
                        {"type": null},
                        {"type": "errorbar"}
                    ]
                }
            }
        ]
    },
    {
        "id": "scatterAndBubble",
        "type": "Scatter and bubble",
        "icon": "spider",
        "templates": [
            {
                "id": "scatter",
                "title": "Scatter chart",
                "description": "Requires one data column for X values and one for Y values.",
                "definition": {
                    "chart": {
                        "type": "scatter"
                    }
                }
            },
            {
                "id": "bubble",
                "title": "Bubble chart",
                "description": "Requires three data columns: one for X values, one for Y values and one for the size of the bubble (Z value).",
                "definition": {
                    "chart": {
                        "type": "bubble"
                    }
                }
            },
            {
                "id": "scatterWithLine",
                "title": "Scatter with line",
                "description": "Requires one data column for X values and one for Y values.",
                "definition": {
                    "chart": {
                        "type": "scatter"
                    },
                    "plotOptions":{
                        "series":{
                            "lineWidth": 1
                        }
                    }
                }
            },
            {
                "id": "scatterWithLineNoMarker",
                "title": "Scatter with line, no marker",
                "description": "Requires one data column for X values and one for Y values.",
                "definition": {
                    "chart": {
                        "type": "scatter"
                    },
                    "plotOptions":{
                        "series":{
                            "lineWidth": 1,
                            "marker":{
                                "enabled": false
                            }
                        }
                    }
                }
            }
        ]
    },
    {
        "id": "pie",
        "type": "Pie charts",
        "icon": "spider",
        "templates": [
            {
                "id": "basic",
                "title": "Pie chart",
                "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie"
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "3d",
                "title": "3D pie chart",
                "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie",
                        "options3d": {
                            "enabled": true,
                            "alpha": 45,
                            "beta": 0
                        }
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "depth": 35,
                            "cursor": "pointer"
                        },
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "withLegend",
                "title": "Pie chart",
                "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie"
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "cursor": true,
                            "showInLegend": true,
                            "dataLabels": {
                                "enabled": false
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "3dWithLegend",
                "title": "3D pie with legend",
                "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie",
                        "options3d": {
                            "enabled": true,
                            "alpha": 45,
                            "beta": 0
                        }
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "depth": 35,
                            "cursor": "pointer",
                            "showInLegend": true,
                            "dataLabels": {
                                "enabled": false
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "donut",
                "title": "Donut",
                "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie"
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "cursor": true,
                            "innerSize": "60%",
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "donutWithLegend",
                "title": "Donut with legend",
                "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie"
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "cursor": true,
                            "showInLegend": true,
                            "innerSize": "60%",
                            "dataLabels": {
                                "enabled": false
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "3dDonut",
                "title": "3D donut chart",
                "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie",
                        "options3d": {
                            "enabled": true,
                            "alpha": 45,
                            "beta": 0
                        }
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "depth": 35,
                            "innerSize": "60%",
                            "cursor": "pointer"
                        },
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    }
                }
            },
            {
                "id": "3dDonutWithLegend",
                "title": "3D donut chart with legend",
                "description": "Requires two data columns: one for slice names (shown in legend) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie",
                        "options3d": {
                            "enabled": true,
                            "alpha": 45,
                            "beta": 0
                        }
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "depth": 35,
                            "cursor": "pointer",
                            "showInLegend": true,
                            "innerSize": "60%"
                        },
                        "series": {
                            "dataLabels": {
                                "enabled": false
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "semiCircleDonut",
                "title": "Semi circle donut",
                "description": "Requires two data columns: one for slice names (shown in data labels) and one for their values.",
                "definition": {
                    "chart": {
                        "type": "pie"
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": false,
                            "dataLabels": {
                                "distance": -30,
                                "style": {
                                    "fontWeight": "bold",
                                    "color": "white",
                                    "textShadow": "0px 1px 2px black"
                                }
                            },
                            "innerSize": "50%",
                            "startAngle": -90,
                            "endAngle": 90,
                            "center": ["50%", "75%"]
                        },
                        "series": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            }
        ]
    },
    {
        "id": "polar",
        "type": "Polar charts",
        "icon": "bar",
        "templates": [
            {
                "id": "line",
                "title": "Polar line",
                "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
                "definition": {
                    "chart": {
                        "type": "line",
                        "polar": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "spider",
                "title": "Spider line",
                "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
                "definition": {
                    "chart": {
                        "type": "line",
                        "polar": true
                    },
                    "xAxis": [{
                        "type": "category",
                        "tickmarkPlacement": "on",
                        "lineWidth": 0
                    }],
                    "yAxis": [{
                        "lineWidth": 0,
                        "gridLineInterpolation": "polygon"
                    }]
                }
            },
            {
                "id": "area",
                "title": "Polar area",
                "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
                "definition": {
                    "chart": {
                        "type": "area",
                        "polar": true
                    },
                    "xAxis": [{
                        "type": "category"
                    }]
                }
            },
            {
                "id": "spiderArea",
                "title": "Spider area",
                "description": "Requires one column for X values or categories (labels around the perimeter), subsequently one column for each series' Y values (plotted from center and out).",
                "definition": {
                    "chart": {
                        "type": "area",
                        "polar": true
                    },
                    "xAxis": [{
                        "type": "category",
                        "tickmarkPlacement": "on",
                        "lineWidth": 0
                    }],
                    "yAxis": [{
                        "lineWidth": 0,
                        "gridLineInterpolation": "polygon"
                    }]
                }
            },
            {
                "id": "appleWatchIsh",
                "title": "Activity Gauge",
                "description": "",
                "definition": {

                    chart: {
                        type: 'solidgauge',
                        marginTop: 50
                    },

                    tooltip: {
                        borderWidth: 0,
                        backgroundColor: 'none',
                        shadow: false,
                        style: {
                            fontSize: '16px'
                        },
                        positioner: function (labelWidth, labelHeight) {
                            return {
                                x: 200 - labelWidth / 2,
                                y: 180
                            };
                        },
                        pointFormat: '{series.name}<br><span style="font-size:2em; color: {point.color}; font-weight: bold">{point.y}%</span>'
                    },

                    pane: {
                        startAngle: 0,
                        endAngle: 360,
                        background: [{ // Track for Move
                            outerRadius: '112%',
                            innerRadius: '88%',
                            backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.3).get(),
                            borderWidth: 0
                        }, { // Track for Exercise
                            outerRadius: '87%',
                            innerRadius: '63%',
                            backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[1]).setOpacity(0.3).get(),
                            borderWidth: 0
                        }, { // Track for Stand
                            outerRadius: '62%',
                            innerRadius: '38%',
                            backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0.3).get(),
                            borderWidth: 0
                        }]
                    },

                    yAxis: [{
                        min: 0,
                        max: 100,
                        lineWidth: 0,
                        tickPositions: []
                    }],

                    plotOptions: {
                        solidgauge: {
                            borderWidth: '34px',
                            dataLabels: {
                                enabled: false
                            },
                            linecap: 'round',
                            stickyTracking: false
                        }
                    },

                    series: [{
                        borderColor: Highcharts.getOptions().colors[0],
                        data: {
                            color: Highcharts.getOptions().colors[0],
                            radius: '100%',
                            innerRadius: '100%'

                        }
                    }, {

                        borderColor: Highcharts.getOptions().colors[1],
                        data: {
                            color: Highcharts.getOptions().colors[1],
                            radius: '75%',
                            innerRadius: '75%'
                        }
                    }, {
                        borderColor: Highcharts.getOptions().colors[2],
                        data: {
                            color: Highcharts.getOptions().colors[2],
                            radius: '50%',
                            innerRadius: '50%'
                        }
                    }]

                }
            },
            {
                "id": "appleWatch",
                "title": "Activity Gauge (Apple Watch)",
                "description": "",
                "definition": {
                    chart: {
                        type: 'solidgauge',
                        marginTop: 50,
                        backgroundColor: 'black',
                        width:400
                    },
                    //colors: ['#F62366', '#9DFF02', '#0CCDD6'],

                    title: {
                        text: 'Activity',
                        style: {
                            fontSize: '24px',
                            color: 'silver'
                        }
                    },

                    tooltip: {
                        borderWidth: 0,
                        backgroundColor: 'none',
                        shadow: false,
                        style: {
                            fontSize: '16px',
                            color: 'silver'
                        },
                        positioner: function (labelWidth, labelHeight) {
                            return {
                                x: 200 - labelWidth / 2,
                                y: 180
                            };
                        },
                        pointFormat: '{series.name}<br><span style="font-size:2em; color: {point.color}; font-weight: bold">{point.y}%</span>'
                    },

                    pane: {
                        startAngle: 0,
                        endAngle: 360,
                        background: [{ // Track for Move
                            outerRadius: '112%',
                            innerRadius: '88%',
                            backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.3).get(),
                            borderWidth: 0
                        }, { // Track for Exercise
                            outerRadius: '87%',
                            innerRadius: '63%',
                            backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[1]).setOpacity(0.3).get(),
                            borderWidth: 0
                        }, { // Track for Stand
                            outerRadius: '62%',
                            innerRadius: '38%',
                            backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0.3).get(),
                            borderWidth: 0
                        }]
                    },

                    yAxis: [{
                        min: 0,
                        max: 100,
                        lineWidth: 0,
                        tickPositions: []
                    }],

                    plotOptions: {
                        solidgauge: {
                            borderWidth: '34px',
                            dataLabels: {
                                enabled: false
                            },
                            linecap: 'round',
                            stickyTracking: false
                        }
                    },

                    series: [{
                        borderColor: Highcharts.getOptions().colors[0],
                        data: {
                            color: Highcharts.getOptions().colors[0],
                            radius: '100%',
                            innerRadius: '100%'

                        }
                    }, {

                        borderColor: Highcharts.getOptions().colors[1],
                        data: {
                            color: Highcharts.getOptions().colors[1],
                            radius: '75%',
                            innerRadius: '75%'
                        }
                    }, {
                        borderColor: Highcharts.getOptions().colors[2],
                        data: {
                            color: Highcharts.getOptions().colors[2],
                            radius: '50%',
                            innerRadius: '50%'
                        }
                    }]

                }
            }
        ]
    }
];
module.exports = templates;