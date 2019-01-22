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
        this.on('stateChange', this._stateChange);
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

    async _stateChange(id, state) {
        if (!id || !state || state.ack) return;

        let o = await this.getObjectAsync(id);
        if (o.native.parameter) {
            this.log.info('state change - ' + o.native.parameter + ' - deviceUdn ' + o.native.deviceUdn + ' - value ' + state.val);
            switch (o.native.parameter) {
                case 'stop':
                    let mediaRenderer = raumkernel.managerDisposer.deviceManager.getVirtualMediaRenderer(o.native.deviceUdn);
                    await mediaRenderer.stop();
                    break;
            }
        }
    }

    async _ready() {
        this.log.debug('ready');

        this.setState('info.connection', false, true);

        this._raumkernel = new raumkernelLib.Raumkernel();
        this._raumkernel.parmLogger(new MyLogger(this.log));
        this._raumkernel.init();

        this._raumkernel.on("deviceListChanged", this._deviceListChanged.bind(this));
        //this._raumkernel.on("systemReady", this._systemReady.bind(this));
        this._raumkernel.on("mediaRendererRaumfeldAdded", this._mediaRendererRaumfeldAdded.bind(this));
        this._raumkernel.on("mediaRendererRaumfeldVirtualAdded", this._mediaRendererRaumfeldVirtualAdded.bind(this));
        this._raumkernel.on("mediaServerRaumfeldAdded", this._mediaServerRaumfeldAdded.bind(this));
        this._raumkernel.on("rendererStateChanged", this._rendererStateChanged.bind(this));

        this.setState('info.connection', true, true);
    }

    _deviceListChanged(deviceList) {
        this.log.info(JSON.stringify(deviceList));
    }

    _systemReady(ready) {
        this.log.info(ready);
    }

    async _mediaRendererRaumfeldAdded(deviceUdn, device) {
        let promises = [];
        let name = deviceUdn;
        if (name.startsWith('uuid:'))
            name = name.substring(5);
        promises.push(this.setObjectNotExistsAsync('devices.renderer.' + name + '.info.name', { type: 'state', common: { name: 'name', type: 'string', role: 'info', read: true, write: false }, native: {} }));
        promises.push(this.setObjectNotExistsAsync('devices.renderer.' + name + '.control.stop', { type: 'state', common: { name: 'stop', type: 'boolean', role: 'button', read: false, write: true }, native: { deviceUdn: deviceUdn, parameter: 'stop' } }));
        await Promise.all(promises);
        promises = [];
        promises.push(this.setStateAsync('devices.renderer.' + name + '.info.name', device.name(), true));
        await Promise.all(promises);
    }

    async _mediaRendererRaumfeldVirtualAdded(deviceUdn, device) {
        let promises = [];
        let name = deviceUdn;
        if (name.startsWith('uuid:'))
            name = name.substring(5);
        promises.push(this.setObjectNotExistsAsync('devices.virtual.' + name + '.info.name', { type: 'state', common: { name: 'name', type: 'string', role: 'info', read: true, write: false }, native: {} }));
        promises.push(this.setObjectNotExistsAsync('devices.virtual.' + name + '.control.stop', { type: 'state', common: { name: 'stop', type: 'boolean', role: 'button', read: false, write: true }, native: { deviceUdn: deviceUdn, parameter: 'stop' } }));
        await Promise.all(promises);
        promises = [];
        promises.push(this.setStateAsync('devices.virtual.' + name + '.info.name', device.name(), true));
        await Promise.all(promises);
    }

    async _mediaServerRaumfeldAdded(deviceUdn, device) {
        let promises = [];
        let name = deviceUdn;
        if (name.startsWith('uuid:'))
            name = name.substring(5);
        promises.push(this.setObjectNotExistsAsync('devices.server.' + name + '.info.name', { type: 'state', common: { name: 'name', type: 'string', role: 'info', read: true, write: false }, native: {} }));
        promises.push(this.setObjectNotExistsAsync('devices.server.' + name + '.control.stop', { type: 'state', common: { name: 'stop', type: 'boolean', role: 'button', read: false, write: true }, native: { deviceUdn: deviceUdn, parameter: 'stop' } }));
        await Promise.all(promises);
        promises = [];
        promises.push(this.setStateAsync('devices.server.' + name + '.info.name', device.name(), true));
        await Promise.all(promises);
    }

    _rendererStateChanged(mediaRenderer, rendererState) {
        this.log.silly("_rendererStateChanged - mediaRenderer - " + JSON.stringify(mediaRenderer));
        this.log.silly("_rendererStateChanged - rendererState - " + JSON.stringify(rendererState));
    }
};

if (module && module.parent) {
    module.exports = (options) => new RaumfeldAdapter(options);
} else {
    new RaumfeldAdapter();
} 
