/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const raumkernelLib = require('node-raumkernel');

const adapterName = require('./package.json').name.split('.').pop();

class MyLogger extends raumkernelLib.Logger {
    constructor(logObject) {
        super(5, '')
        this._logObject = logObject;
    }

    log(logLevel, log, metadata = null) {
        switch (logLevel) {
            case 0:
                this._logObject.error(log);
                break;
            case 1:
                this._logObject.warn(log);
                break;
            case 2:
                this._logObject.info(log);
                break;
            case 3:
                this._logObject.debug(log);
                break;
            case 4:
                this._logObject.debug(log);
                break;
            case 5:
                this._logObject.silly(log);
                break;
            default:
                this._logObject.info(log);
        }
    }
}

class RaumfeldAdapter extends utils.Adapter {
    constructor(options) {
        super({ ...options, name: adapterName });

        this.on('unload', this._unload);
        this.on('objectChange', this._objectChange);
        this.on('stateChange', this._stateChange);
        this.on('message', this._message);
        this.on('ready', this._ready);

        this._unloaded = false;
    }

    _unload(callback) {
        this._unloaded = true;
        try {
            this.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }

    _objectChange(id, obj) {
        this.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
    }

    async _message(msg) {
        this.log.debug('message recieved - ' + JSON.stringify(msg));
    }

    async _stateChange(id, state) {
        if (!id || !state || state.ack) return;
        //let o = await this.getObjectAsync(id);
    }

    async _ready() {
        this.log.debug('ready');

        this._raumkernel = new raumkernelLib.Raumkernel();
        this._raumkernel.parmLogger(new MyLogger(this.log));
        this._raumkernel.init();

        this._raumkernel.on("deviceListChanged", this._deviceListChanged.bind(this));
        this._raumkernel.on("systemReady", this._systemReady.bind(this));

        this.setState('info.connection', false, true);
        this.setState('info.connection', true, true);
    }

    _deviceListChanged(deviceList) {
        this.log.info(JSON.stringify(deviceList));
    }

    _systemReady(ready) {
        this.log.info(systemReady);
    }
};

if (module && module.parent) {
    module.exports = (options) => new RaumfeldAdapter(options);
} else {
    new RaumfeldAdapter();
} 
