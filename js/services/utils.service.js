'use strict';

export default {
    getQuerysStr,
    saveToSessionStorage,
    loadFromSessionStorage,
    clearSessionStorage,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    getRandomId,
    copy
}


///////////////EXPORTED_FUNCTIONS///////////////
///////////////EXPORTED_FUNCTIONS///////////////
///////////////EXPORTED_FUNCTIONS///////////////


export function getQuerysStr(filterBy = {}) {
    var queryStr = '?'
    for (var key in filterBy) {
        queryStr += `${key}=${filterBy[key]}&`;
    }
    return queryStr.slice(0, queryStr.length-1);
} 


export function saveToSessionStorage(key, value) {
    sessionStorage[key] = JSON.stringify(value);
}
export function loadFromSessionStorage(key) {
    var data = sessionStorage[key];
    if (!data) return false;
    return JSON.parse(sessionStorage[key]);
}
export function clearSessionStorage() {
    sessionStorage.clear()
}


export function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
export function loadFromLocalStorage(key) {
    let data = JSON.parse(localStorage.getItem(key));
    if (data) return data;
    else return false;
}
export function clearLocalStorage() {
    localStorage.clear();
}


export function getRandomId() {
    var pt1 = Date.now().toString(16);
    var pt2 = getRandomInt(1000, 9999).toString(16);
    var pt3 = getRandomInt(1000, 9999).toString(16);
    return `${pt3}-${pt1}-${pt2}`.toUpperCase();
}


export function getRandomInt(num1, num2) {
    var max = (num1 >= num2)? num1+1 : num2+1;
    var min = (num1 <= num2)? num1 : num2;
    return (Math.floor(Math.random()*(max - min)) + min);
}

export function copy(obj) {
    if (typeof(obj) !== 'object') throw new Error(`copy function expects an object but got ${typeof(obj)}`);
    return JSON.parse(JSON.stringify(obj));
}



///////////////PROTOTYPES///////////////
///////////////PROTOTYPES///////////////
///////////////PROTOTYPES///////////////

(() => {
    Array.prototype.random = function(startIdx = 0, endIdx = this.length-1) {
        return this[getRandomInt(startIdx, endIdx)]
    }
    Array.prototype.shuffle = function() {
        var copy = this.slice();
        var shuffled = [];
        for (let i = 0; i < this.length; i++) {
            shuffled.push(copy.splice(getRandomInt(0, copy.length-1), 1)[0]);
        }
        return shuffled;
    }

    String.prototype.random = function(startIdx = 0, endIdx = this.length-1) {
        return this[getRandomInt(startIdx, endIdx)]
    }
    String.prototype.shuffle = function() {
        var copy = this.split('');
        var shuffled = [];
        for (let i = 0; i < this.length; i++) {
            shuffled.push(copy.splice(getRandomInt(0, copy.length-1), 1)[0]);
        }
        return shuffled.join('');
    }
    String.prototype.multiReplace = function(searchValue, replaceValue) {
        var str = this;
        var counter = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === searchValue[counter]) counter++
            else counter = 0;
            if (counter === searchValue.length) {
                str = str.substring(0, i-counter+1)+replaceValue+str.substring(i+1);
                counter = 0;
            }
        }
        return str;
    }
})()