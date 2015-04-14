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

define([ "dojo/_base/declare", "retail/OptionsProvider"], function(declare, Provider) {
  return declare("retail.housing.OptionsProvider", [Provider], {

    getOptions : function(callback, errorCallback){
      dojo.xhrGet({
        url : 'housing?'+this.args.query,//'https://www.hudhomestore.com/pages/ListExportToExcel.aspx?zipCode=&city=&county=&sState=PA&fromPrice=0&toPrice=0&fCaseNumber=&bed=0&bath=0&street=&buyerType=0&specialProgram=&Status=0',
        handleAs : "text",
        load : function(txt){
          var node = dojo.create('div');
          dojo.style(node, "display", "none");
          node.innerHTML = txt;
          
          var trs = dojo.query('tr', node);
          
          var tr0 = trs[0];
          var ths = dojo.query('th', tr0);
          var cols = ths.map(function(th){return th.textContent.replace(/\s/g, '_')});
          
          var ops = [];
          for(var i =1; i< trs.length; i++){
            var op ={};
            var tds = dojo.query('td', trs[i]);
            cols.forEach(function(col, j){
              op[col] = tds[j].textContent;
            });
            op.image = 'https://www.hudhomestore.com/pages/ImageShow.aspx?Case=' + op['Property_Case'];
            op.url = 'http://www.hudhomestore.com/Listing/PropertyDetails.aspx?caseNumber='+ op['Property_Case'];
            ops.push(op);
          }
          dojo.destroy(node);
          callback(ops);
        },
        error : errorCallback
      });
    }
  })
});