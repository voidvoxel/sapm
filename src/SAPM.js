const { PluginManager } = require('live-plugin-manager');


class SAPM extends PluginManager {
    constructor (options) {
        super(options);
    }
}


module.exports = SAPM;
