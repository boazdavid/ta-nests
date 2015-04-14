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

define([ "dojo/_base/declare", "dijit/_Widget", "dojox/form/RangeSlider", "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels", "dijit/form/CheckBox", "dijit/TitlePane" ], function(declare, _Widget,
    RangeSlider, HorizontalRule, HorizontalRuleLabels, CheckBox, TitlePane) {
  return declare("retail.FiltersWidget", [ _Widget ], {

    bind : function(domain) {
      dojo.empty(this.domNode);
      this.filterWidgets = [];
      this.domain = domain;
      dojo.forEach(this.domain.meta.filters, function(filterDef, i) {
        var first = (i == 0);
        var content = dojo.create("div", {}, this.domNode);
        this.domain.filters[filterDef.name] = [];
        switch (filterDef.type) {
        case "NOMINAL":
          this.filterWidgets.push(this.addNominalFilter(filterDef, content));
          break;
        case "NUMERIC":
          this.filterWidgets.push(this.addNumericFilter(filterDef, content));
          break;
        default:
          console.error("error in filter spec {name}".formatAll(filterDef));
        }
        var tp = new TitlePane({
          title : filterDef.name,
          content : content,
          open : first,
          'class' : 'filterGroup'
        }, dojo.create("div", {}, this.domNode));
        tp.startup();
      }, this);
      
      this.domain.applyFilters();
    },

    addNominalFilter : function(filterDef, groupNode) {
      var map = {};
      dojo.forEach(this.domain.allOps, function(s) {
        var v = filterDef.getter(s);
        if (!map[v]) {
          map[v] = 0;
        }
        map[v]++;
      }, this);
      var possibleValues = [];
      var filter = function(s) {
        var v = filterDef.getter(s);
        return possibleValues.length == 0 || possibleValues.indexOf(v) >= 0;
      };
      this.domain.addFilter(filterDef.name, filter, true);
      var entries = utils.entries(map);
      entries.sort(function(e1, e2) {
        return e2.value - e1.value;
      });
      var showingAllEntries = (entries.length <= filterDef.top) || !(filterDef.top);
      var entriesToShow = showingAllEntries ? entries : entries.slice(0, filterDef.top);

      var boxes = entriesToShow.map(function(entry) {
        var onChange = dojo.hitch(this, function(val) {
          if (val) {
            possibleValues.push(entry.key);
          } else {
            utils.removeItem(possibleValues, entry.key);
          }
          this.domain.applyFilters();
        });

        var filterNode = dojo.create("div", {
          'class' : 'filterItem'
        }, groupNode);

        var cb = new CheckBox({
          checked : false,
          onChange : onChange
        }, dojo.create("input", {
          'class' : 'filterItemKey'
        }, filterNode));
        cb.startup();
        dojo.create("label", {
          'for' : "mycheck",
          innerHTML : entry.key
        }, filterNode);
        dojo.create('span', {
          'class' : 'filterItemValue',
          innerHTML : "  (" + entry.value + ")"
        }, filterNode);
        return cb;
      }, this);

      return {
        reset : function() {
          boxes.forEach(function(cb) {
            cb.set('checked', false);
          });
        }
      };
    },
    addNumericFilter : function(filterDef, groupNode) {
      var node = dojo.create("div", {}, groupNode);
      var vals = this.domain.allOps.map(filterDef.getter);
      var min = Math.min.apply(Math, vals);
      var max = Math.max.apply(Math, vals);
      var low = min, high = max;
      var filter = function(sol) {
        var v = filterDef.getter(sol);
        return v >= low && v <= high;
      };
      this.domain.addFilter(filterDef.name, filter, true);
      var onChange = dojo.hitch(this, function(newVals) {
        low = newVals[0], high = newVals[1];
        this.domain.applyFilters();
      });
      var sliderRules = new HorizontalRule({
        count : filterDef.rules,
        style : {
          height : "5px"
        }
      }, dojo.create("div", {}, node));

      var ruleLabelsArgs = filterDef.labels ? {
        labels : filterDef.labels
      } : {
        count : filterDef.rules,
        minimum : min,
        maximum : max,
        constraints : {
          pattern : "#"
        }
      };
      var sliderRuleLabels = new HorizontalRuleLabels(ruleLabelsArgs, dojo.create("div", {}, node));

      var sliderArgs = {
        minimum : min,
        maximum : max,
        value : [ min, max ],
        intermediateChanges : true,
        onChange : onChange
      };
      if (filterDef.discreteValues) {
        sliderArgs.discreteValues = filterDef.discreteValues;
      }
      var slider = new dojox.form.HorizontalRangeSlider(sliderArgs, node);
      slider.startup();
      sliderRules.startup();
      sliderRuleLabels.startup();

      return {
        reset : function() {
          slider.setValue([ min, max ]);
        }
      };
    },
    resetAll : function() {
      this.filterWidgets.forEach(function(w) {
        w.reset();
      });
    }
  });
});