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
		"sap/m/Text",
		"sap/m/MessageToast"
	],
	function(BaseController, formatter, models, JSONModel, Dialog, Button, Text, MessageToast) {
		"use strict";

		return BaseController.extend("zwo.ui.wks_rep.controller.Preview", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit: function() {
				// Creating DashboardView model used to set page to busy
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				this.setModel(oViewModel, "PreviewView");
				this.getRouter().getRoute("preview").attachPatternMatched(this._onReportPatternMatched, this);
				
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
				self.byId("selectForeman").setPlaceholder(self.getResourceBundle().getText("dBSelectPlacehdr"));
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
				
				// Saving selected status in model ReportFilters
				var oReportModel = self.getModel("ReportFilters");
				oReportModel.setProperty("/Status", aStatus);

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

			onPressPreviewFilter: function() {
				//this._bindReportItem();
				this._getSynthReports();
				this._bindLaborBonus();
				var oBonusTxt = this.getResourceBundle().getText("bonusOnly");
				var oItems = this.byId("foremanSelectList").getSelectedItems();
				var oLength = oItems.length;
				if(oLength === 1 && oItems[0].getCells()[1].getText() === oBonusTxt){
					this.byId("synthesisBonus").setVisible(true);
					this.byId("previewList").setVisible(false);
				} else if(oLength >= 1 && oItems[oLength - 1].getCells()[1].getText() !== oBonusTxt){
					this.byId("previewList").setVisible(true);
					this.byId("synthesisBonus").setVisible(false);
				} else{
					this.byId("previewList").setVisible(true);
					this.byId("synthesisBonus").setVisible(true);
				}
			},
			/* SR 556069 - JPJ - DD/MM/YYYY */
			//START
			onPressExport : function(){
				/*var self = this;
				var oModel = self.getModel();
				var oFilter = self.getAllReportFilters();
				
				var oExport = oModel.callFunction("/FunctionName",{
					method : "GET",
					urlParameter : oFilter,
					headers: {'Cache-Control': 'no-cache, no-store'},
					success: function(oData){
						var sFilepath = oData.results;
					},
					error: function(oError){}
				});*/
				/*var oHostname = window.location.hostname;
				
				if(oHostname === "sapdevfior01.kherty.local" || oHostname === "sapdevfior01.sap.eurovia.com" || oHostname === "localhost"){
					var sHost = "http://sapdevdb03.sap.eurovia.com:8000";
				}else if(oHostname === "sapquafior01.kherty.local" || oHostname === "sapquafior01.sap.eurovia.com"){
					var sHost = "http://sapquaas01.sap.eurovia.com:8000";
				}else if(oHostname === "sapprdfior01.kherty.local" || oHostname === "sapprdfior01.sap.eurovia.com"){
					var sHost = "http://sapprdas04.sap.eurovia.com:8000"
				}*/
				/*var sUrl = sHost + sFilepath;
				window.open(sUrl)*/
				
			},
			//END
			
			//SR 555223
			onPressPrint: function(){
				var self = this;
				var oResourceBundle = self.getResourceBundle();
				
				// Opening dialog to confirm orientation of print
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
									var css = '@page { size: letter portrait; margin: auto;}' 
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
									document.title = oResourceBundle.getText("previewPageTitle") + " " + self._sProjectNo + " " + formatter.formatDisplayDay(new Date());
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
							document.title = oResourceBundle.getText("previewPageTitle") + " " + self._sProjectNo + " " + formatter.formatDisplayDay(new Date());
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
			
			onPressPreviewLaborEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToLabor.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToLabor/Edit", true);
			},
			
			onPressPreviewLaborSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToLabor.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintLabor = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,
						CostCode: oResult.CostCode,
						QtyDay: oResult.QtyDay,
						Unit: oResult.Unit,
						Comments: oResult.Comment1
					};
					oDfrdUpd = self.updateLaborDetItem(oPrintLabor, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToLabor/Edit", false);
			},
			
			onPressPreviewLaborCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToLabor.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToLabor/Edit", false);
				self._bindLaborBonus();
			},
			
			onPressPreviewBonusEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oModel = oEditButton.getModel("laborBonus");
				var oItem = oModel.getData();
				oItem.forEach(function(oResult){
					oResult.Edit = true;
				});
				oEditButton.getModel("laborBonus").setProperty("/Edit", true);
			},

			onPressPreviewBonusSave : function(oEvent){
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oModel = oSaveButton.getModel("laborBonus");
				var oItem = oModel.getData();
				var oDfrdUpd;
				oItem.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintLaborBonus = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						ValidationLine: oResult.ValidationLine,
						EmployeeNo: oResult.EmployeeNo,
						EmployeeName: oResult.EmployeeName,
						TypeOfHour: oResult.TypeOfHour,
						HoursQty: oResult.HoursQty,
						Bonus: oResult.Bonus,
						BonusQty: oResult.BonusQty,
						WBSElement: oResult.WBSElement,
						ActivityType: oResult.ActivityType,
						ForemanNo: oResult.ForemanNo,
					};
					oDfrdUpd = self.updateLaborBonusItem(oPrintLaborBonus, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._bindLaborBonus();
					});
				
				oSaveButton.getModel("laborBonus").setProperty("/Edit", false);
				
			},

			onPressPreviewBonusCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oModel = oCancelButton.getModel("laborBonus");
				var oItem = oModel.getData();
				oItem.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("laborBonus").setProperty("/Edit", false);
				self._bindLaborBonus();
			},


			
			onPressPreviewTempEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToTemporary.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToTemporary/Edit", true);
			},
			
			onPressPreviewTempSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToTemporary.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintTemp = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,
						CostCode: oResult.CostCode,
						QuantityCC: oResult.QtyOperated,
						UnitCC: oResult.Unit
					};
					oDfrdUpd = self.updateTempDetItem(oPrintTemp, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToTemporary/Edit", false);
			},
			
			onPressPreviewTempCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToTemporary.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToTemporary/Edit", false);
				self._getSynthReports();
			},
			
			onPressPreviewEquipEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToEquipment.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToEquipment/Edit", true);
			},
			
			onPressPreviewEquipSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToEquipment.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintEquip = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,
						CostCode: oResult.CostCode,
						Quantity: oResult.Quantity,
						Status: oResult.Status
					};
					oDfrdUpd = self.updateEquipDetItem(oPrintEquip, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToEquipment/Edit", false);
			},
			
			onPressPreviewEquipCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToEquipment.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToEquipment/Edit", false);
				self._getSynthReports();
			},
			
			onPressPreviewRentalEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToRental.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToRental/Edit", true);
			},
			
			onPressPreviewRentalSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToRental.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintRental = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,					
						CostCode: oResult.CostCode,
						QuantityCC: oResult.QtyOperated,
						EquipmentStat: oResult.Status,
						UnitCC: oResult.Unit
					};
					oDfrdUpd = self.updateRentalDetItem(oPrintRental, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToRental/Edit", false);
			},
			
			onPressPreviewRentalCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToRental.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToRental/Edit", false);
				self._getSynthReports();
			},
			
			onPressPreviewMaterialEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToMaterial.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToMaterial/Edit", true);
			},
			
			onPressPreviewMaterialSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToMaterial.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintMaterial = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,					
						CostCode: oResult.CostCode,
						QuantityCC: oResult.QtyOperated,
						UnitCC: oResult.Unit
					};
					oDfrdUpd = self.updateMaterialDetItem(oPrintMaterial, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToMaterial/Edit", false);
			},
			
			onPressPreviewMaterialCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToMaterial.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToMaterial/Edit", false);
				self._getSynthReports();
			},
			
			onPressPreviewSubConEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToSubContr.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToSubContr/Edit", true);
			},
			
			onPressPreviewSubConSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToSubContr.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintSubCon = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,					
						CostCode: oResult.CostCode,
						QuantityCC: oResult.QtyOperated,
						UnitCC: oResult.Unit
					};
					oDfrdUpd = self.updateSubConDetItem(oPrintSubCon, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToSubContr/Edit", false);
			},
			
			onPressPreviewSubConCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToSubContr.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToSubContr/Edit", false);
				self._getSynthReports();
			},
			
			onPressPreviewInternalEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToInternal.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToInternal/Edit", true);
			},
			
			onPressPreviewInternalSave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToInternal.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintInternal = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						Origin: oResult.Origin,				
						CostCode: oResult.CostCode,
						QuantityCC: oResult.QtyOperated
					};
					oDfrdUpd = self.updateInternalDetItem(oPrintInternal, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToInternal/Edit", false);
			},
			
			onPressPreviewInternalCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToInternal.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToInternal/Edit", false);
				self._getSynthReports();
			},
			
			onPressPreviewQtyEdit : function(oEvent) {				
				var self = this;
				var oEditButton = oEvent.getSource();
				var oContext = oEditButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();				
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToQuantity.results.forEach(function(oResult){
					oResult.Edit = true;					
				});				
				oEditButton.getModel("preview").setProperty(sPath1 + "/PrintingToQuantity/Edit", true);
			},
			
			onPressPreviewQtySave : function(oEvent) {
				var self = this;
				var oSaveButton = oEvent.getSource();
				var oContext = oSaveButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				var oDfrdUpd;
				oItem.PrintingToQuantity.results.forEach(function(oResult) {
					oResult.Edit = false;		
					var oPrintQty = {
						ProjectNo: oResult.ProjectNo,
						Day: oResult.Day,
						Key: oResult.Key,
						InternalNo: oResult.InternalNo,
						LineNo: oResult.LineNo,
						ValidationLine: oResult.ValidationLine,
						ForemanNo: oResult.ForemanNo,
						CostCode: oResult.CostCode,
						CostCodeDes: oResult.CostCodeDesc,
						Unit: oResult.Unit,			
						QuantityCC: oResult.Quantity
					};
					oDfrdUpd = self.updateQuantityDetItem(oPrintQty, self);
				});	
				
				oDfrdUpd.always(	
					function() {
						self._getSynthReports();
					});
				
				oSaveButton.getModel("preview").setProperty(sPath1 + "/PrintingToQuantity/Edit", false);
			},
			
			onPressPreviewQtyCancel : function(oEvent) {
				var self = this;
				var oCancelButton = oEvent.getSource();
				var oContext = oCancelButton.getBindingContext("preview");
				var sPath1 = oContext.getPath();
				var oItem = oContext.getProperty(sPath1);
				oItem.PrintingToQuantity.results.forEach(function(oResult){
					oResult.Edit = false;					
				});	
				oCancelButton.getModel("preview").setProperty(sPath1 + "/PrintingToQuantity/Edit", false);
				self._getSynthReports();
			},
			
			// Obtaining foremen and status filters for a project and day
			_getAllReportFilters: function() {
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

				var oFilter = new sap.ui.model.Filter(aFilters, true);
				return oFilter;
			},
			
			// Obtaining status filters for a specified foreman, project and day			
			_getStatusFilters: function(sForemanNo) {
				var self = this;
				// Report Model
				var oReportModel = self.getModel("ReportFilters");
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
				if(sForemanNo !== "") {
					aFilters.push(new sap.ui.model.Filter("ForemanNo", oOperatorEQ, sForemanNo));
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
						self._bonusFilter();
						oModel.refresh();
						oDeferred.resolve();
					},
					error: function(oError) {
						self._bonusFilter();
						MessageToast.show(self.getResourceBundle().getText("errorGetFrmen"));
						oDeferred.reject();
					}
				});

				return oDeferred.promise();
			},
			
			_bonusFilter: function(){
				var self = this;
				var oForemanList = self.getModel("foremanList");
				var oBonus = self.getModel("laborBonus");
				var oBonusTxt = self.getResourceBundle().getText("bonusOnly");
				var oLength;
				if(oForemanList === undefined){
					oLength = 1;
				}else{
					oLength = oForemanList.oData.length;
				}
				
				if(oBonus.oData.length > 0 && oForemanList.oData[oLength - 1].ForemanName !== oBonusTxt|| oBonus.oData.length > 0 && oLength === 0){
					var oForeman = {
						ProjectNo: "", 
						Day: null, 
						ForemanNo: "00", 
						ForemanName: oBonusTxt
					};
					oForemanList.oData.push(oForeman);
				}
			},

			_bindReportItem: function() {
				var self = this;
				var oViewModel = self.getModel("PreviewView");
				var oDeferred = $.Deferred();
				var sPrintingPath = "/PrintingSet";
				var sExpandPath = "PrintingToLabor,PrintingToRental,PrintingToEquipment,PrintingToMaterial," +
						"PrintingToSubContr,PrintingToInternal,PrintingToTemporary,PrintingToQuantity";
				var oFilter = self._getAllReportFilters();
				var oList = self.byId("previewList");
				var oCustomListItem = self.byId("previewListTemplate");

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
						
			_getRepHeaders: function(aRes) {
				var self = this;
				var oViewModel = self.getModel("PreviewView");
				var oDeferred = $.Deferred();
				var sPrintingPath = "/PrintingSet";
								
				var oFilter = self._getAllReportFilters();
				
				// Requesting for list of summary reports
				self.getModel().read(sPrintingPath, {
					filters: [oFilter],
					/*parameters: {
						expand: sExpandPath
					},*/
					success: function(oData) {
						var aResults = oData.results;
						aResults.forEach(function(oResult) {
							aRes.push(oResult);
						});
						oDeferred.resolve();
					},
					error: function(oError) {						
						oDeferred.reject();
					}
				});				
				
				return oDeferred.promise();
			},
			
			_getExpandSet : function(sPath, sExpand, oFilter, oPrinting, aRes) {
				var self = this;
				var oDeferred = $.Deferred();
				var oModel = self.getModel();
				
				// Creating key set for PrintingSet entity
				var sPrintingSetPath = oModel.createKey(sPath, {
					ProjectNo: oPrinting.ProjectNo,
					Day: oPrinting.Day,
					ForemanNo: oPrinting.ForemanNo,
					Origin: oPrinting.Origin,
					IntStatus: oPrinting.IntStatus
				});
				
				sPrintingSetPath += "/" + sExpand;
				
				self.getModel().read(sPrintingSetPath, {
					filters: [oFilter],
					success: function(oData) {
						oData.results.forEach(function(oResult){
							oResult.Edit = false;
							aRes.push(oResult);
						});
						
						oDeferred.resolve();				
					},
					error: function(oError) {						
						oDeferred.reject();
					}
				});	
				return oDeferred.promise();
			},
			
			_getSynthReports : function() {
				var self = this;
				self._aResults = [];			
				var oViewModel = self.getModel("PreviewView");
				
				oViewModel.setProperty("/busy", true);
				
				var oDfrd = self._getRepHeaders(self._aResults);
				oDfrd.then(function(){
					if(self._aResults.length !== 0) {
						
						var createIterator = jQuery.proxy(function(array) {
							var nextIndex = 0;
						    
						    return {
						       hasNext: function() {
						    	   return nextIndex < array.length ? 
						               {value: nextIndex++, next: true} :
						               {value: -1, next: false};
						       }
						    };
						}, self);
						
						var iterator = createIterator(self._aResults);
						var oRepDfrd = $.Deferred();
						self._getForemanReports(self._aResults, iterator, oRepDfrd);
						oRepDfrd.then(
							// Success handler
							function(){
								var oModel = models.createJSONModel(this._aResults, "TwoWay");
								this.setModel(oModel, "preview");
								this.getModel("PreviewView").setProperty("/busy", false);
							}.bind(this),
							function() {
								this.getModel("PreviewView").setProperty("/busy", false);
							});						
					} else {
						oViewModel.setProperty("/busy", false);
					}
				}.bind(self), 
				function() {
					oViewModel.setProperty("/busy", false);
				});
			},
			
			_getForemanReports: function(aResults, oIterator, oMainDeferred) {
				var self = this;
				
				var oNext = oIterator.hasNext();
				var index = oNext.value;
				var bNext = oNext.next;
				
				if(index !== -1) {
					var oResult = aResults[index];
					
					// PrintingSet path
					var sPrintingPath = "/PrintingSet";
					//Expand paths
					var sExpandLabor = "PrintingToLabor";
					var sExpandRental = "PrintingToRental";
					var sExpandEquip = "PrintingToEquipment";
					var sExpandMaterial = "PrintingToMaterial";
					var sExpandSubContr = "PrintingToSubContr";
					var sExpandInternal = "PrintingToInternal";
					var sExpandTemp = "PrintingToTemporary";
					var sExpandQty = "PrintingToQuantity";
					
					// Obtaining status filters
					var oFilter = self._getStatusFilters(oResult.ForemanNo);
					
					var oPrinting = {
						ProjectNo : oResult.ProjectNo,
						Day : oResult.Day,
						ForemanNo : oResult.ForemanNo,
						Origin : oResult.Origin,
						IntStatus: oResult.IntStatus
					};
					
					// Requesting data for each category for this foreman
					var aLabor = [];
					var oDfrdLabor = self._getExpandSet(sPrintingPath, sExpandLabor, oFilter, oPrinting, aLabor);
					var aRental = [];
					var oDfrdRental = self._getExpandSet(sPrintingPath, sExpandRental, oFilter, oPrinting, aRental);
					var aEquip = [];
					var oDfrdEquip = self._getExpandSet(sPrintingPath, sExpandEquip, oFilter, oPrinting, aEquip);
					var aMaterial = [];
					var oDfrdMaterial = self._getExpandSet(sPrintingPath, sExpandMaterial, oFilter, oPrinting, aMaterial);
					var aSubContr= [];
					var oDfrdSubContr = self._getExpandSet(sPrintingPath, sExpandSubContr, oFilter, oPrinting, aSubContr);
					var aInternal = [];
					var oDfrdInternal = self._getExpandSet(sPrintingPath, sExpandInternal, oFilter, oPrinting, aInternal);
					var aTemp = [];
					var oDfrdTemp = self._getExpandSet(sPrintingPath, sExpandTemp, oFilter, oPrinting, aTemp);
					var aQty = [];
					var oDfrdQty = self._getExpandSet(sPrintingPath, sExpandQty, oFilter, oPrinting, aQty);
					
					jQuery.when(oDfrdLabor, oDfrdRental, oDfrdEquip, oDfrdMaterial, oDfrdSubContr, oDfrdInternal, oDfrdTemp, oDfrdQty).then(
						// Success handler
						function(){
							oResult.PrintingToLabor.results = aLabor;
							oResult.PrintingToLabor.Edit = false;
							oResult.PrintingToRental.results = aRental;
							oResult.PrintingToRental.Edit = false;
							oResult.PrintingToEquipment.results = aEquip;
							oResult.PrintingToEquipment.Edit = false;
							oResult.PrintingToMaterial.results = aMaterial;
							oResult.PrintingToMaterial.Edit = false;
							oResult.PrintingToSubContr.results = aSubContr;
							oResult.PrintingToSubContr.Edit = false;
							oResult.PrintingToInternal.results = aInternal;
							oResult.PrintingToInternal.Edit = false;
							oResult.PrintingToTemporary.results = aTemp;
							oResult.PrintingToTemporary.Edit = false;
							oResult.PrintingToQuantity.results = aQty;
							oResult.PrintingToQuantity.Edit = false;
							
							if(bNext) {
								self._getForemanReports(aResults, oIterator, oMainDeferred);
							}else {
								oMainDeferred.resolve();
							}
							
						}.bind(self),
						// Error handler
						function(){
							jQuery.sap.log.error("Could not fetch data for Foreman: " + oResult.ForemanNo);
							oMainDeferred.reject();
						}.bind(self));
				} else {
					oMainDeferred.resolve();
				}
				
			},
			
			_bindLaborBonus: function() {
				var self = this;
				var oFilter = self._getAllReportFilters();
				var aResults = [];
				var oDfrdBonus = self.getPrintingBonus(aResults, oFilter);
				oDfrdBonus.then(
					//Success handler
					function(){
						aResults.Edit = false;
						var oModel = models.createJSONModel(aResults, "TwoWay");
						self.setModel(oModel, "laborBonus");
					}
				);
				
			},
			
			getPrintingBonus: function(aResults, oFilter){
				var self = this;
				var oDeferred = $.Deferred();
				var oModel = self.getModel();
				
				var sBonusPath = oModel.createKey("/PrintingSet", {
					ProjectNo: self._sProjectNo,
					Day: self._sDay,
					ForemanNo: "",
					Origin: "",
					IntStatus: ""
				});
				sBonusPath += "/PrintingToLaborBonus";		

				oModel.read(sBonusPath, {
					filters: [oFilter],
					success : function(oData) {
					    oData.results.forEach(function(result) {
					    	result.Edit = false;
					    	aResults.push(result);
					    });
					    oDeferred.resolve();
					},
					error : function(oError) {
						oDeferred.reject();
					}
			    });
			    return oDeferred.promise();

			},

//SR 548154 Project Lock
			_onReportPatternMatched: function(oEvent) {
				var oRoute = oEvent.getParameter("name");
				if (oRoute === "preview") {
					var self = this;
					self._sDay = oEvent.getParameter("arguments").Day;
					self._sProjectNo = oEvent.getParameter("arguments").ProjectNo;
					
					//setting Project Lock
					if(self.getModel("UnlockFilters").getProperty("/ProjectNo") === ""){
						self.getModel("LockFilters").setProperty("/ProjectNo", self._sProjectNo);
						self.getModel("LockFilters").setProperty("/Day", self._sDay);
					}
					
					var oDfrdLock = self.projectLock();
					
					oDfrdLock.then(
							// Success handler
							function() {
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
										
										// Setting placeholders on search fields
										self.byId("selectStatus").setPlaceholder(self.getResourceBundle().getText("statusTxt"));
										self.byId("selectForeman").setPlaceholder(self.getResourceBundle().getText("dBSelectPlacehdr"));
										
										// Binding Report Data to report list
										//self._bindReportItem();
										self._bindLaborBonus();
										self._getSynthReports();
										self.byId("previewList").setVisible(true);
										self.byId("synthesisBonus").setVisible(true);
										
										// Fetching foreman list for foreman search field
										self._getForemanList(self._sDay, self._sProjectNo);
										
										oComponent.oUserReady.then(function() {
											//setting timeOut
											self.timeOut(self);
										});
									});
							});
				}
			}

		});
	});
//End SR 548154 Project Lock