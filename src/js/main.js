var _ = require("lodash");
window.cloneDeep = function(src) {
    if(typeof src !== 'undefined'){
        return JSON.parse(JSON.stringify(src));
    } else {
        return src;
    }
};

var Delegator = require("dom-delegator");
var del = Delegator();
var dataService = require('./services/data');
// dev data
dataService.set([
    ["","test","lowpoint","highpoint"  ],
    ["experiment 1","50","48","51"  ],
    ["experiment 2","50","68","73"  ],
    ["experiment 3","50","92","110"  ],
    ["experiment 4","50","128","136"  ],
    ["experiment 5","50","140","150"  ],
    ["experiment 6","50","171","179"  ],
    ["experiment 7","50","135","143"  ],
    ["experiment 8","50","142","149"  ],
    ["experiment 9","50","204","220"  ],
    ["experiment 10","50","189","199"  ]
]);
require('./route.js');

