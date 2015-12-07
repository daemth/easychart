(function() {
    var Events, Mediator, mediator;

    Events = require('backbone-events-standalone');

    Mediator = (function() {
        Mediator.prototype.attributes = {};

        function Mediator() {}

        Mediator.prototype.set = function(key, data) {
            return this.attributes[key] = data;
        };

        Mediator.prototype.get = function(key) {
            return this.attributes[key];
        };

        return Mediator;

    })();

    Events.mixin(Mediator.prototype);
    mediator = new Mediator;
    mediator.Mediator = Mediator;
    module.exports = mediator;

})();