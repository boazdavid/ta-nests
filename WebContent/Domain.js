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

define([ "dojo/_base/declare" ], function(declare) {
  return declare("retail.Domain", [], {

    constructor : function(meta, options) {
      this.meta = meta;
      this.filters = {};
      this.allOps = options;
      this.opsIn = options;

      dojo.forEach(this.allOps, function(op) {
        op.changed = function() {
        };
      });
      this.analyzeFrontier(this.opsIn);
    },

    // var selectedSortOp = meta.sortBy.filter(function(op){return
    // op.selected;})[0];
    addFilter : function(name, filter, quite) {
      this.filters[name].push(filter);
      this.applyFilters(quite);
    },
    applyFilters : function(quite) {
      var oldOpsIn = this.opsIn.slice();
      this._doFilters();
      if (!(quite || oldOpsIn.equals(this.opsIn))) {
        this.analyzeFrontier(this.opsIn);
        this.sort();
        this.changed();
      }
    },
    _doFilters : function() {
      this.opsIn = dojo.filter(this.allOps, function(op) {
        for ( var facet in this.filters) {
          if (!this.filters[facet].some(function(facetValFilter) {
            return facetValFilter(op);
          })) {
            return false;
          }
        }
        return true;
      }, this);
    },
    setSortBy : function(op) {
      var oldOpsIn = this.opsIn.slice();
      this.sortBy = op;
      this.sort();
      if (!oldOpsIn.equals(this.opsIn)) {
        this.changed();
      }
    },
    // sortBy : selectedSortOp,
    sort : function() {
      if (this.sortBy) {
        var sortAttKey = this.sortBy.attribute;
        var sortAtt = this.meta.attributes.first(function(a) {
          return a.key == sortAttKey;
        });
        var comparer = undefined;
        if (sortAtt.type == "NUMERIC") {
          comparer = function(a, b) {
            var va = a[sortAttKey], vb = b[sortAttKey];
            return va - vb;
          }
        } else {
          comparer = function(a, b) {
            var va = a[sortAttKey], vb = b[sortAttKey];
            return va < vb ? -1 : vb < va ? 1 : 0;
          }
        }
        this.opsIn.sort(comparer);
        if (this.sortBy.direction == "Descending") {
          this.opsIn.reverse();
        }
      }
    },
    // enrich the data and meta objects with frontier information
    analyzeFrontier : function(options, callback) {
      if (!options) {
        return;
      }
      if (options.length <= 1) {
        options.forEach(function(op) {
          op.favorite = true;
          op.changed();
        });
        callback && callback();
      } else {
        var meta = this.meta;
        var dilemmaUrl = "demo?generate_visualization=false";
        function afterDilemma(response) {
          var respObj = JSON.parse(response);
          options.forEach(function(op) {
            var ref = respObj.resolution.solutions.first(function(ref) {
              return meta.keyFunction(op) == ref.solution_ref
            });
            op.favorite = (ref.status == "FRONT");
            op.changed();
          });
          callback && callback();
        }

        xhr(dilemmaUrl, "POST", {}, JSON.stringify(this.makeProblem(options)), afterDilemma, function(e) {
          throw e;
        });
      }
    },
    makeProblem : function(options) {
      this.meta.attributes.forEach(function(col) {
        if (!col.name) {
          col.fullName = col.key;
        }
      });
      var numAtts = this.meta.attributes.filter(function(att) {
        return att.type === "NUMERIC";
      });
      var objCols = dojo.map(numAtts, function(att) {
        return {
          is_objective : att.isObjective || (this.sortBy && (this.sortBy.attribute == att.key)),
          goal : att.goal,
          key : att.key,
          full_name : att.name || att.key,
          type : att.type
        };
      }, this);
      return {
        subject : this.meta.subject,
        columns : objCols,
        options : dojo.map(options, function(op) {
          var values = {};
          numAtts.forEach(function(col) {
            values[col.key] = parseFloat(op[col.key]);
          });
          return {
            key : this.meta.keyFunction(op),
            name : this.meta.nameFunction(op),
            description_html : this.meta.descriptionFunction(op),
            // app_data : op,
            values : values
          }
        }, this)
      };
    },
    changed : function() {/* event */
    }
  })
});
