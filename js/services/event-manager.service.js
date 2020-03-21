'use strict';

import utils from './utils.service.js';


export class EventManager {
    Events = {};
    
    on = (eventName, cbFunc, _id) => {
        if (!this.Events[eventName]) this.Events[eventName] = [];
        if (!_id) _id = utils.getRandomId();
        var disConnectFunc = () => this.off(eventName, _id);
        var funcObj = {cbFunc, _id, off: disConnectFunc};
    
        this.Events[eventName].push(funcObj);
        return disConnectFunc;
    }
    
    off = (eventName, _id) => {
        var idx = this.Events[eventName].find(curr => curr._id === _id);
        if (idx === -1) throw new Error('Something went wrong');
        this.Events[eventName].splice(idx, 1);
    }
    
    emit = (eventName, ...args) => {
        if (!this.Events[eventName]) throw new Error(`${eventName} is not a known event`);
        this.Events[eventName].forEach(curr => {
            // try {
                curr.cbFunc(...args);
            // } catch(err) {
            //     throw new Error(`Something went wrong, couldnt emit '${eventName}': ${err}`);
            // }
        });
    }
}

export class nonDuplicateEventManager {
    Events = {};
    
    on = (eventName, cbFunc) => {
        this.Events[eventName] = cbFunc;
        return () => this.off(eventName);
    }
    
    off = (eventName) => {
        delete this.Events[eventName];
    }
    
    emit = (eventName, ...args) => {
        if (!this.Events[eventName]) throw new Error(`${eventName} is ot a known event`);
        try {
            // console.log(typeof(this.Events[eventName]));
            return this.Events[eventName](...args);
        } catch(err) {
            return new Error('Something went wrong');
        }
    }
}