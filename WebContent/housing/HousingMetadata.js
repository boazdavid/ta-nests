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

define([ "dojo/_base/declare", "retail/Metadata", "retail/housing/ProductDetails", "retail/housing/ProductBrief" ], function(declare, Metadata) {
	return declare("retail.housing.HousingMetadata", [Metadata], {

		keyFunction : function(op) {
			return op.Property_Case;
		},
		descriptionFunction : function(op) {
			return "<img style='max-height: 200px;' src='https://www.hudhomestore.com/pages/ImageShow.aspx?Case={Property_Case}'/>".formatAll(op);
		},
		nameFunction : function(op) {
			return'{Address} {City}  {State} {Zip_Code}  {County}'.formatAll(op);
		},

		attributes : [ {
			key : "Property_Case",
			type : "TEXT",
			comperable : false
		}, {
			key : "Address",
			type : "TEXT",
			comperable : false
		}, {
			key : "City",
			type : "TEXT",
			comperable : false,
			name : "Product Id"
		}, {
			key : "State",
			type : "TEXT",
			comperable : false
		}, {
			key : "Zip_Code",
			type : "TEXT",
			comperable : false
		}, {
			key : "County",
			type : "TEXT",
			comperable : false
		}, {
			key : "Price",
			name : "Price",
			type : "NUMERIC",
			isObjective : true,
			goal : "MIN",
			comperable : true
		}, {
			key : "Bed",
			type : "NUMERIC",
			isObjective : true,
      goal : "MAX",
			comperable : true
		}, {
			key : "Bath",
			type : "NUMERIC",
      goal : "MAX",
			comperable : true
		}, {
			key : "Square_Footage",
			name: "Square Footage",
			type : "NUMERIC",
			isObjective : true,
      goal : "MAX",
			comperable : true
		}, {
			key : "Year_Built",
      name: "Year Built",
			type : "NUMERIC",
			isObjective : true,
			goal : "MAX",
			comperable : true
		}, {
			key : "FHA_Financing",
			name : "FHA Financing",
			type : "TEXT",
			comperable : true
		}, {
			key : "List_Date",
			name: "List Date",
			type : "TEXT",
			comperable : true
		}, {
			key : "Bid_Open_Date",
			type : "TEXT",
			comperable : true
		}, {
			key : "Listing_Period",
			type : "TEXT",
			comperable : true
		}, {
			key : "Status",
			type : "TEXT",
			comperable : true
		} ],

		filters : [ {
			name : "FHA Financing",
			getter : function(sol) {
				return sol.FHA_Financing;
			},
			type : "NOMINAL"
		// top: 5
		}, {
			name : "Price (USD)",
			getter : function(sol) {
				return Number(sol.Price);
			},
			type : "NUMERIC",
			rules : 3
		}, {
			name : "Bed",
			getter : function(sol) {
				return Number(sol.Bed);
			},
			type : "NUMERIC",
			rules : 5,
			discreteValues : 5
		}, {
			name : "Bath",
			getter : function(sol) {
				return sol.Bath;
			},
			type : "NUMERIC",
			rules : 5
		}, {
			name : "Square Footage",
			getter : function(sol) {
				return sol.Square_Footage;
			},
			type : "NUMERIC",
			rules : 5
		}, {
			name : "Year Built",
			getter : function(sol) {
				return sol.Year_Built;
			},
			type : "NUMERIC",
			rules : 5
		} ],

		gridColumns : function() {
			var app = this.app;
			return [ {
				field : "id",
				name : "Image",
				width : "250px",
				formatter : function(item, rowIndex, cell) {
					var sol = cell.grid.getItem(rowIndex);
					var w = new retail.housing.ProductBrief({
						sol : sol,
						app : app
					});
					w._destroyOnRemove = true;
					w.startup();
					return w;
				}
			}, {
				field : "id",
				name : "Descr",
				width : "auto",
				formatter : function(item, rowIndex, cell) {
					var sol = cell.grid.getItem(rowIndex);
					var w = new retail.housing.ProductDetails({
						sol : sol,
						app : app
					});
					w._destroyOnRemove = true;
					w.startup();
					return w;
				}
			} ]
		},

		sortBy : [ {
			label : "Price: Low to High",
			attribute : "Price",
			direction : "Ascending",
			selected : true
		}, {
			label : "Price: High to Low",
			attribute : "Price",
			direction : "Descending"
		}, {
			label : "Square Footage: High to Low",
			attribute : "Square_Footage",
			direction : "Descending"
		}, {
			label : "Bed",
			attribute : "Bed",
			direction : "Descending"
		}, {
      label : "Bath",
      attribute : "Bath",
      direction : "Descending"
    }
		// defaultSortAtt : "price",
		// defaultSortDirection: "Ascending"//Descending
		]
	})
});