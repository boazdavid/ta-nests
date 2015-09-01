/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/*global utils */

function assert(cond, message) {
  if (!cond) {
    throw message;
  }
}

function xhr(url, method, headers, body, okCallback, errCallback) {
  [okCallback, errCallback].forEach(function(f) {
    if (typeof(f) !== 'function') {
      throw 'invalid callback function';
    }
  });
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4) {
      if (xmlhttp.status === 200) {
        okCallback(xmlhttp.responseText);
      } else {
        errCallback('{status}-{statusText}\n{responseText}'.formatAll(xmlhttp));
      }
    }
  };
  xmlhttp.open(method, url, true);
  for (var att in headers) {
    xmlhttp.setRequestHeader(att, headers[att]);
  }
  xmlhttp.send(body);
}
if (!('first' in Array.prototype)) {
  Array.prototype.first = function(filter) {
    if (typeof filter === 'function') {
      for (var i = 0; i < this.length; i++) {
        if (filter(this[i])) {
          return this[i];
        }
      }
      return null;
    }
    if (this.length > 0) {
      return this[0];
    }
    return null;
  };
}

String.prototype.formatAll = function(map) {
  var res = this;
  for (var key in map) {
    res = res.replace('{' + key + '}', map[key]);
  }
  return res;
};
Array.prototype.equals = function(array) {
    // if the other array is a falsy value, return
    if (!array)
      return false;

    // compare lengths - can save a lot of time
    if (this.length !== array.length)
      return false;

    for (var i = 0, l = this.length; i < l; i++) {
      // Check if we have nested arrays
      if (this[i] instanceof Array && array[i] instanceof Array) {
        // recurse into the nested arrays
        if (!this[i].equals(array[i]))
          return false;
      } else if (this[i] !== array[i]) {
        // Warning - two different object instances will never be equal: {x:20} != {x:20}
        return false;
      }
    }
    return true;
  };

var utils = {
  entries: function(obj) {
    var arr = [];
    for (var k in obj) {
      arr.push({
        key: k,
        value: obj[k]
      });
    }
    return arr;
  },

  removeItem: function(arr, item) {
    var i = arr.indexOf(item);
    if (i >= 0) {
      arr.splice(i, 1);
      return true;
    }
    return false;
  },

  queryParams: function() {
    var o = {};
    window.location.search.substr(1).split('&').map(function(p) {
      return p.split('=');
    }).forEach(function(a2) {
      o[a2[0]] = a2[1];
    });
    return o;
  }
};
