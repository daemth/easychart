(function () {
    var guiConfig = {
        "panels": [
            {
                "panelTitle": "Chart settings",
                "panes"     : [
                    {
                        "title"  : "Chart type and interaction",
                        "options": [{
                            "name"    : "chart.type",
                            "defaults": "column"
                        }, "chart.inverted", "chart.zoomType", "plotOptions.column.stacking", "plotOptions.bar.stacking"]
                    },
                    {
                        "title"  : "Size and margins",
                        "options": [{
                            "name"    : "chart.width",
                            "defaults": "600"
                        }, "chart.height", "chart.spacingTop", "chart.spacingRight", "chart.spacingBottom", "chart.spacingLeft"]
                    }
                ]
            },
            {
                "panelTitle": "Colors and borders",
                "panes"     : [
                    {
                        "title"  : "default colors",
                        "options":[{"name":"colors","defaults":["#3799ba","#57f2a9","#c900a1","#1a9944","#7eeae5","#ed8c71","#899cf4","#e07dc6","#5addb0"]}]
                    },
                    {
                        "title"  : "Chart area",
                        "options": ["chart.backgroundColor", "chart.borderWidth", "chart.borderRadius", "chart.borderColor"]
                    },
                    {
                        "title"  : "Plot area",
                        "options": ["chart.plotBackgroundColor", "chart.plotBackgroundImage", "chart.plotBorderWidth", "chart.plotBorderColor"]
                    }
                ]
            },
            {
                "panelTitle": "Titles",
                "panes"     : [
                    {
                        "title"  : "Titles",
                        "options": ["title.text", "subtitle.text", "yAxis.title.text", "xAxis.title.text"]
                    },
                    {
                        "title"  : "Title advanced",
                        "options": ["title.style"]
                    }
                ]
            },
            {
                "panelTitle": "Axes",
                "panes"     : [
                    {
                        "title"  : "Axes setup",
                        "options": []
                    },
                    {
                        "title"  : "X axis",
                        "options": [{
                            "name"    : "xAxis.type",
                            "defaults": "category"
                        }, "xAxis.min", "xAxis.opposite", "xAxis.reversed", "xAxis.tickInterval", "xAxis.labels.format", "xAxis.labels.rotation", "xAxis.labels.align"]
                    },
                    {
                        "title"  : "Value axis",
                        "options": ["yAxis.type", "yAxis.min", "yAxis.opposite", "yAxis.reversed", "yAxis.labels.format", "yAxis.labels.rotation"]
                    }
                ]
            },
            {
                "panelTitle": "Legend",
                "panes"     : [
                    {
                        "title"  : "General",
                        "options": ["legend.enabled", "legend.layout"]
                    },
                    {
                        "title"  : "Placement",
                        "options": ["legend.align", "legend.verticalAlign"]
                    },
                    {
                        "title"  : "Color and border",
                        "options": []
                    }
                ]
            },
            {
                "panelTitle": "Tooltip",
                "panes"     : [
                    {
                        "title"  : "General",
                        "options": ["tooltip.headerFormat", "tooltip.pointFormat", "tooltip.valuePrefix", "tooltip.valueSuffix"]
                    },
                    {
                        "title"  : "Color and border",
                        "options": []
                    }
                ]
            },
            {
                "panelTitle": "Exporting/Credits",
                "panes"     : [
                    {
                        "title"  : "Exporting",
                        "options": ["exporting.enabled"]
                    },
                    {
                        "title"  : "Credits",
                        "options": [{"name": "credits.enabled", "defaults": "false"}, "credits.text", "credits.href"]
                    }
                ]
            }
        ]
    };
    var that = {};

    that.get = function(){
        return guiConfig;
    }
});