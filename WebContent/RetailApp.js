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
/* global dojo, define, TradeoffAnalytics, dijit, assert */


define(['dojo/_base/declare', 'dijit/_Widget', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin',
'dojo/text!./RetailApp.html', 'dojox/grid/EnhancedGrid', 'dojo/store/Memory', 'dojo/data/ObjectStore',
'dojo/request', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'dijit/TitlePane', 'dijit/Dialog',
'dojo/store/Memory', 'dijit/form/ComboBox', 'dijit/TooltipDialog', 'retail/FiltersWidget',
'retail/Domain', 'retail/LearnWizard', 'retail/FavoriteWizard'
], function(declare, _Widget, _TemplatedMixin,
    _WidgetsInTemplateMixin, template) {
  return declare('retail.RetailApp', [ _Widget, _TemplatedMixin, _WidgetsInTemplateMixin ], {
    templateString : template,
    widgetsInTemplate : true,

    startup : function() {
      this.inherited(arguments);
      dojo.addClass(dojo.body(), 'retailApp');
    },
    start : function(ops, callback) {
      this.ops = ops;
      dojo.addClass(dojo.body(), ops.cssClass);
      this.taClient = new TradeoffAnalytics({
        dilemmaServiceUrl : 'demo',
        customCssUrl : 'https://ta-cdn.mybluemix.net/v1/modmt/styles/' + ops.theme + '.css',
        // profile: profile,
        errCallback : dojo.hitch(this, this.errorCallback)
      }, this.taPlaceholder);

      this.taClient.start(dojo.hitch(this, function() {
        this.smartButton.set('disabled', false);
        dojo.style(this.smartButton.domNode, 'pointerEvents', 'inherit');
        this.taClient.resize();
        callback && callback();
      }));
    },
    loadDomain : function(callback) {
      var _this = this, ops = this.ops;
      require([ ops.meta.module, ops.data.module ], function() {

        var metaClass = eval(ops.meta.clazz);
        assert(metaClass);
        var meta = new metaClass.prototype.constructor(_this);
        meta.subject = ops.subject;

        var dataProviderClass = eval(ops.data.clazz);
        assert(dataProviderClass);
        var dataProvider = new dataProviderClass.prototype.constructor(ops.data.args);

        dataProvider.getOptions(function(ops) {
          callback(new retail.Domain(meta, ops));
        }, dojo.hitch(_this, _this.errorCallback));
      });
    },
    loadAndBind : function(abbr, callback) {
      this.setBreadCrumbs();
      this.loadDomain(dojo.hitch(this, function(domain) {
        this._bind(domain);
        callback(domain);
      }));
    },
    setBreadCrumbs : function() {
      dojo.empty(this.breadCrumbs);
      dojo.forEach(this.ops.breadCrumbs, function(breadCrumb, i) {
        i && dojo.create('span', { innerHTML : ' &gt; ' }, this.breadCrumbs);
        dojo.create('a', {
          href : breadCrumb.href || 'javascript:void(0)',
          innerHTML : breadCrumb.text
        }, this.breadCrumbs);
      }, this);
    },
    _bind : function(domain) {
      this.inviteTimeout = setTimeout(dojo.hitch(this, this.invite), 40 * 1000);
      this.topContainer.resize();
      this.domain = domain;
      this.filters.bind(domain);

      var store = new dojo.store.Memory({
        data : domain.meta.sortBy
      });
      this.sortBy.set('store', store);
      this.sortBy.set('item', domain.meta.sortBy.filter(function(item) {
        return item.selected;
      })[0]);
      this.sortChanged();

      this.grid.set('structure', [ {
        cells : domain.meta.gridColumns()
      } ]);

      this.connect(domain, 'changed', this.refresh);

      this.refresh();
    },
    loadData : function(dataUrl, callback, errorCallback) {
      dojo.xhrGet({
        url : dataUrl,
        handleAs : 'json',
        load : callback,
        error : errorCallback
      });
    },
    errorCallback : function(err) {
      this.standby.hide();
      console.error(err.message + '\n' + err.responseText);
    },
    refresh : function() {
      var domain = this.domain;
      var objStore = new dojo.store.Memory({
        data : domain.opsIn
      });
      var store = new dojo.data.ObjectStore({
        objectStore : objStore
      });
      this.grid.setStore(store);

      this.statusLine.innerHTML = 'Showing {in} options of {all}'.formatAll({
        'in' : domain.opsIn.length,
        all : domain.allOps.length
      });

      this.optionsLength.innerHTML = domain.opsIn.length;
    },
    sortChanged : function() {
      this.domain.setSortBy(this.sortBy.get('item'));
    },
    clearAllFilters : function() {
      this.filters.resetAll();
    },
    launch : function() {
      this.closeInviteTooltip();
      this.standby.show();
      var _this = this;
      var problem = this.domain.makeProblem(this.domain.opsIn);
      this.taClient.show(problem, function() {
        _this.moovDialog.show();
        _this.moovDialog.resize();
        _this.standby.hide();
      }, dojo.hitch(this, this.done));
    },

    done : function() {
      this.moovDialog.hide();
    },
    waitForInvite : function() {
      var timeout = setTimeout(dojo.hitch(this, function() {
        clearTimeout(this.inviteTimeout);
        this.invite();
      }), 1 * 1000);
      var conn = this.connect(this.smartButton, 'onMouseLeave', function() {
        clearTimeout(timeout);
        this.disconnect(conn);
      });
    },
    invite : function() {
      dijit.popup.open({
        popup : this.inviteTooltip,
        around : this.smartButton.domNode,
        orient : [ 'before-centered' ]
      });
    },
    closeInviteTooltip : function() {
      dijit.popup.close(this.inviteTooltip);
    },
    closePopups : function() {
      this.closeInviteTooltip();
      this.closeFavoriteTooltip();
    },
    learn : function() {
      this.learnWizard.goTo(0);
      this.learnDialog.show();
    },
    closeLearnAndLaunch : function() {
      this.closeLearnDialog();
      this.launch();
    },
    closeLearnDialog : function() {
      this.learnDialog.hide();
    },

    needFavoriteTooltip : function(sol, node) {
      dijit.popup.open({
        popup : this.favoriteTooltip,
        around : node,
        orient : [ 'after-centered' ]
      });
    },
    closeFavoriteTooltip : function() {
      dijit.popup.close(this.favoriteTooltip);
    },
    closeFavoriteAndLaunch : function() {
      this.closeFavoriteTooltip();
      this.launch();
    },
    closeFavoriteAndLearn : function() {
      this.closeFavoriteTooltip();
      this.learn();
    }
  });
});