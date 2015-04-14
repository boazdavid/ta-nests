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

define([
    "dojo/_base/declare",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
    "dojo/text!./LearnWizard.html",
	"dojo/_base/fx"
], function(declare, widget, templated, widgetInTemplated, template, fx){
	return declare("retail.LearnWizard", [widget, templated, widgetInTemplated], {
		  templateString: template,
		  widgetsInTemplate: true,
		  currentStepIndex:0,
		  steps:["step0", "step1", "step2"],
		  
		  startup:function(){
			  this.goTo(0);
		  },
		  goTo: function(index){
			  var oldStep = this.steps[this.currentStepIndex];
			  fx.fadeOut({node:this[oldStep], duration:1000}).play();
			  
			  var newStep = this.steps[index];
			  fx.fadeIn({node:this[newStep], duration:1000}).play();
			  
			  var links = dojo.query('.step', this.stepLinks);
			  dojo.removeClass(links[this.currentStepIndex], "current");
			  dojo.addClass(links[index], "current");
			  
			  dojo.toggleClass(this.next, 'disabled', index==this.steps.length-1);
			  dojo.toggleClass(this.next, 'current', index<this.steps.length-1);
			  
			  dojo.toggleClass(this.previous, 'disabled', index ==0);
			  dojo.toggleClass(this.previous, 'current', index !=0);
			  
			  this.currentStepIndex = index;
		  },
		  goNext: function(){
			  this.goTo(this.currentStepIndex+1);
		  },
		  goPrev: function(){
			  this.goTo(this.currentStepIndex-1);
		  },
		  launch: function(){
		   //event
		  },
      closeMe: function(){
      //event
      }
      
	});
});