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

define([ "dojo/_base/declare", "dijit/_Widget", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./ProductBrief.html"], function(
    declare, widget, templated, widgetInTemplated, template) {
  return declare("retail.housing.ProductBrief", [ widget, templated, widgetInTemplated ], {
    templateString : template,
    widgetsInTemplate : true,
    
    startup : function() {
      this.inherited(arguments);
      this.connect(this.sol, "changed", this.refresh);
      this.productPrice.innerHTML = '$'+ Number(this.sol.Price).toLocaleString();
      this.refresh();
    },
    refresh: function(){
      if(this._started){
        if (this.sol.favorite) {
          dojo.removeClass(this.favoriteDiv, "dominated");
        }else{
          dojo.addClass(this.favoriteDiv, "dominated");
        }
      }
    },
    why : function(e) {
      this.app.needFavoriteTooltip(this.sol, this.favoriteDiv);
    }
  });
});
