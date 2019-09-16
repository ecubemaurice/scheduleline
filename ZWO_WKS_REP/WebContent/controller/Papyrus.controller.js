/*======================================================================*/
/*==  E~CUBE                                                          ==*/
/*==------------------------------------------------------------------==*/
/*==  AUTHOR             : Jean-Pierre Jerome (JPJ)                   ==*/
/*==  DATE               : 13.08.2019                                 ==*/
/*==  GAPID              : G01.001.05                                 ==*/
/*==------------------------------------------------------------------==*/
/*==  DESCRIPTION        : SR 622921 – A FIORI front end app for      ==*/
/*==                       labor, temporary workers, equipment,       ==*/
/*==                       equipments, supplies, subcontracting,      ==*/
/*==                       production quantities                      ==*/
/*==                       COPY of ZCPJD1 – DEV 00549 from KHEOPS     ==*/
/*======================================================================*/
/*== MODIFICATIONS  HISTORY                                           ==*/
/*======================================================================*/
/*== DATE        AUTHOR         SR NUM       IDEN.   TRANS. REQ       ==*/
/*==------------------------------------------------------------------==*/
/*   23.08.2019  JPJEROME       622921       JPJ      TR XXXXXXXXXX     */
/*======================================================================*/

sap.ui.define([
		"zwo/ui/wks_rep/controller/BaseController",
		"zwo/ui/wks_rep/model/formatter",
		"zwo/ui/wks_rep/model/models",
		"sap/ui/model/json/JSONModel",
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/m/Text"
	],
	function(BaseController, formatter, models, JSONModel, Dialog, Button, Text) {
		"use strict";	

			return BaseController.extend("zwo.ui.wks_rep.controller.Papyrus",
					{

						formatter : formatter,

						/* =========================================================== */
						/* lifecycle methods                                           */
						/* =========================================================== */

						onInit : function() {
							// Creating DashboardView model used to set page to busy
							var oViewModel = new JSONModel({
								busy: false,
								BusyDelay: 0
							});
							this.setModel(oViewModel, "PapyrusView");
							this.getRouter().getRoute("papyrus").attachPatternMatched(this._onPapyrusReportPatternMatched, this);
							
							// Setting static status model
							this.setStatusModel();
						},
						
						onSelectForeman: function(oEvent) {
							var self = this;
							var oControl = oEvent.getSource();

							// Open select foreman popover
							self._oForemanFrgmt = self.openSelectionPopover(
								self._oForemanFrgmt,
								"zwo.ui.wks_rep.view.fragment.selectPopover",
								oControl);
						},	
						
						handleAcceptForemen: function() {
							var self = this;
							var oSearchField = self.byId("selectForeman");
							var oForemanList = self.byId("foremanSelectList");
							var aSelForemen = oForemanList.getSelectedItems();
							var aForemen = [];

							aSelForemen.forEach(function(oForeman) {
								var oTmp = {};
								oTmp.Name = oForeman.getBindingContext("foremanList").getProperty("ForemanName");
								oTmp.Number = oForeman.getBindingContext("foremanList").getProperty("ForemanNo");
								// Saving selected foreman to save in model
								aForemen.push(oTmp);
							});

							// Saving selected foremen in model ReportFilters
							var oReportModel = self.getModel("ReportFilters");
							oReportModel.setProperty("/Foremen", aForemen);
							
							//Displaying No of foremen selected in placeholder
							if (aForemen.length === 0) {
								oSearchField.setPlaceholder(self.getResourceBundle().getText("dBSelectPlacehdr"));
							} else if(aForemen.length === 1) {
								oSearchField.setPlaceholder(aForemen.length + " " + self.getResourceBundle().getText("OneForemanTxt"));
							} else {
								oSearchField.setPlaceholder(aForemen.length + " " + self.getResourceBundle().getText("ManyForemenTxt"));
							}
							self._oForemanFrgmt.close();
						},
						
						handleDeclineForemen: function() {
							var self = this;
							// Unchecking all selected items
							var oForemanList = self.byId("foremanSelectList");
							var aSelForemen = oForemanList.getSelectedItems();
							aSelForemen.forEach(function(oForeman){
								oForeman.setSelected(false);
							});				
							self.byId("selectForeman").setPlaceholder(self.getResourceBundle().getText("statusTxt"));
							// Closing Foreman fragment
							self._oForemanFrgmt.close();
						},
						
						handleAcceptStatus: function() {							
							// Status searchfield
							var oControl = this.getView().byId("selectStatus");
							var self = this;
							var oStatusList = this.byId("statusSelectList");
							var oStatusItems = oStatusList.getSelectedItems();
							var aStatus = [];

							oStatusItems.forEach(function(status) {
								var oTmp = {};
								oTmp.Index = status.getBindingContext("statusList").getProperty("index");
								oTmp.Status = status.getBindingContext("statusList").getProperty("status");
								// Saving selected status to save in model
								aStatus.push(oTmp);
							});

							//Displaying No of status selected in placeholder
							if (aStatus.length !== 0) {
								oControl.setPlaceholder(aStatus.length + " " + self.getResourceBundle().getText("ManyStatusTxt"));
							} else {
								oControl.setPlaceholder(self.getResourceBundle().getText("statusTxt"));
							}

							// Closing Status fragment
							this._oStatusFrgmt.close();
						},
						
						handleDeclineStatus: function() {
							var oStatusList = this.byId("statusSelectList");
							var oStatusItems = oStatusList.getSelectedItems();
							oStatusItems.forEach(function(status) {
								status.setSelected(false);
							});
							this.byId("selectStatus").setPlaceholder(this.getResourceBundle().getText("statusTxt"));
							// Closing Status fragment
							this._oStatusFrgmt.close();
						},
						
						onPressPapyrusFilter: function() {
							var self = this;
							//alert('filter');return false;
							self._bindPapyrusReportItem();
							//self._getPapyrusSynthReports();
						},		
						
						//SR 555223
						onPressPrint: function(){
							var self = this;
							var oResourceBundle = self.getResourceBundle();
							
							// Opening dialog to confirm if item should be deleted
				        	var dialog = new Dialog({
								title: "Print Option",
								type: "Message",
								state: "None",
								content: new Text({ 
									text: oResourceBundle.getText("printMessage"),
									textAlign: "Center",
									justifyContent: "Center" 
								}),
								buttons: [
									 new Button({
											text: oResourceBundle.getText("portrait"),
											press: function () {
												dialog.close();
												dialog.destroy();
												var css = '@page { size: letter portrait; margin: 45px;}' 
													+ 'body {height: auto !important; width: 100% !important;}'
													+ '* { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }',
											    head = document.head || document.getElementsByTagName('head')[0],
											    style = document.createElement('style');
												
												var title = document.title;
												
												function afterprint() {
													document.title = title;
												}

												style.type = 'text/css';
												style.media = 'print';
									
												if (style.styleSheet){
												  style.styleSheet.cssText = css;
												} else {
												  style.appendChild(document.createTextNode(css));
												}
									
												head.appendChild(style);
												document.title = oResourceBundle.getText("papyrusPageTitle") + " " + formatter.formatDisplayDay(new Date());
												window.print();
												window.onafterprint = afterprint();
											}
										}),
									new Button({
									text: oResourceBundle.getText("landscape"),
									press: function () {
										dialog.close();
										dialog.destroy();
										
										var css = '@page { size: landscape; margin: auto;}' 
											+ 'body {height: auto !important; width:100% !important;}'
											+ '* { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }',
									    head = document.head || document.getElementsByTagName('head')[0],
									    style = document.createElement('style');
										
										var title = document.title;
										
										function afterprint() {
											document.title = title;
										}

										style.type = 'text/css';
										style.media = 'print';
							
										if (style.styleSheet){
										  style.styleSheet.cssText = css;
										} else {
										  style.appendChild(document.createTextNode(css));
										}
							
										head.appendChild(style);
										document.title = oResourceBundle.getText("papyrusPageTitle") + " " + formatter.formatDisplayDay(new Date());
										window.print();
										window.onafterprint = afterprint();
									}
								}),
								
								new Button({
									text: oResourceBundle.getText("cancel"),
									press: function () {
										dialog.close();
										dialog.destroy();
									}
								}),
								]
								
							});				
				        	
							dialog.open();
						},
						//End SR 555223
	
						_getPapyrusReportFilters: function() {
							var self = this;
							// Report Model
							var oReportModel = self.getModel("ReportFilters");				
							var aForemen = oReportModel.getProperty("/Foremen");
							var aStatus = oReportModel.getProperty("/Status");
							// Filter array
							var aFilters = [];
							// Setting filter operator
							var oOperatorEQ = sap.ui.model.FilterOperator.EQ;

							// Date filter
							if (this._sDay) {
								aFilters.push(new sap.ui.model.Filter("Day", oOperatorEQ, this._sDay));
							}

							// ProjectNo filter
							if (this._sProjectNo) {
								aFilters.push(new sap.ui.model.Filter("ProjectNo", oOperatorEQ, this._sProjectNo));
							}

							// Foreman filters
							if(aForemen.length !== 0) {
								var aTmp = [];
								aForemen.forEach(function(oForeman) {
									aTmp.push(new sap.ui.model.Filter("ForemanNo", oOperatorEQ, oForeman.Number));
								});
								aFilters.push(new sap.ui.model.Filter(aTmp, true));
							}

							// Status filters
							if ((aStatus.length !== 0)) {
								var aTmp = [];
								aStatus.forEach(function(status) {
									// IntStatus 0 and 1 map to status "Not Integrated"
									aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, status.Index));
									if (status.Index === "0")
										aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, "1"));
								});
								aFilters.push(new sap.ui.model.Filter(aTmp, true));
							}
							
							// Origin filter
							aFilters.push(new sap.ui.model.Filter("Origin", oOperatorEQ, "P"));

							var oFilter = new sap.ui.model.Filter(aFilters, true);
							return oFilter;
						},

						_getForemanList: function(sDay, iProjNum) {
							var self = this;
							var oModel = self.getModel();
							var oDeferred = $.Deferred();
							var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
							var aFilters = [];

							if (sDay) {
								aFilters.push(new sap.ui.model.Filter("Day", oOperatorEQ, sDay));
							}

							if (iProjNum) {
								aFilters.push(new sap.ui.model.Filter("ProjectNo", oOperatorEQ, iProjNum));
							}

							var oFilter = new sap.ui.model.Filter(aFilters, true);

							self.getModel().read("/ProjectForemanSet", {
								filters: [oFilter],
								success: function(oData) {
									var oModel = models.createJSONModel(oData.results, "TwoWay");
									self.setModel(oModel, "foremanList");
									oDeferred.resolve();
								},
								error: function(oError) {
									MessageToast.show(self.getResourceBundle().getText("errorGetFrmen"));
									oDeferred.reject();
								}
							});

							return oDeferred.promise();
						},

						_bindPapyrusReportItem: function() {
							var self = this;
							var oViewModel = self.getModel("PapyrusView");
							var oDeferred = $.Deferred();
							var sPrintingPath = "/PrintingSet";
							var sExpandPath = "PrintingToLabor,PrintingToRental,PrintingToEquipment,PrintingToMaterial," +
									"PrintingToSubContr,PrintingToInternal,PrintingToTemporary,PrintingToQuantity," +
									"PrintingToControl,PrintingToWeather,PrintingToVisit,PrintingToIncident";
							var oFilter = self._getPapyrusReportFilters();
							var oList = self.byId("papyrusList");
							var oCustomListItem = self.byId("papyrusListTemplate");

							if (oList && oCustomListItem) {
								oList.bindItems({
									path: sPrintingPath,
									template: oCustomListItem,
									parameters: {
										expand: sExpandPath
									},
									filters: [oFilter],
									events: {
										dataRequested: function() {
											oViewModel.setProperty("/busy", true);
											oDeferred = $.Deferred();
										},
										dataReceived: function() {
											oViewModel.setProperty("/busy", false);
											oDeferred.resolve();
										}
									}
								});
							}
							return oDeferred.promise();
						},

						_onPapyrusReportPatternMatched: function(oEvent) {
							var oRoute = oEvent.getParameter("name");
							if (oRoute === "papyrus") {
								var self = this;
								self._sDay = oEvent.getParameter("arguments").Day;
								self._sProjectNo = oEvent.getParameter("arguments").ProjectNo;

								var oComponent = self.getOwnerComponent();

								oComponent.oWhenMetadataIsLoaded.then(
									// Success handler
									function() {
										// Binding default oData model to view
										var oModel = self.getModel();
										self.setModel(oModel);
										
										// Creating and (re)setting the model for the report filters
										var oReportFilters = {
											Foremen: [],
											Status: []
										};
										self.setModel(models.createJSONModel(oReportFilters, "TwoWay"), "ReportFilters");
										
										// Binding Report Data to report list
										self._bindPapyrusReportItem();
										// Fetching foreman list for foreman search field
										self._getForemanList(self._sDay, self._sProjectNo);
										// Setting placeholders on search fields
										self.byId("selectStatus").setPlaceholder(self.getResourceBundle().getText("statusTxt"));
										self.byId("selectForeman").setPlaceholder(self.getResourceBundle().getText("dBSelectPlacehdr"));
									});
							}
						}

			});
});