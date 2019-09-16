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
		"sap/ui/core/Fragment",
		"sap/m/MessageToast",
		"zwo/ui/wks_rep/model/models",
		"sap/ui/model/json/JSONModel",
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/m/Text"
		
	], function (BaseController, formatter, Fragment, MessageToast, models, JSONModel, Dialog, Button, Text) {
		"use strict";

	return BaseController.extend("zwo.ui.wks_rep.controller.labor.LaborDet", {

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
			this.setModel(oViewModel, "LaborDetView");
			this.getRouter().getRoute("labordet").attachPatternMatched(this._onLaborDetPatternMatched, this);
			
			// Device & Device size specific functions
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(
		    		// Success handler
		    		function(){
		    			var oPage = this.byId("labordet");
		    			if(oPage)
		    				oPage.setShowHeader(this.showDetHeader("orientation", {}));
		    		}.bind(this));
			sap.ui.Device.orientation.attachHandler(this.onOrientationChanged.bind(this));			
			sap.ui.Device.resize.attachHandler(this.onDeviceResized.bind(this));
			
		},
		
		onOrientationChanged: function() {
			var oPage = this.byId("labordet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("orientation", {}));
		},
		
		onDeviceResized: function(mParams) {			
			var oPage = this.byId("labordet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("size", mParams));
		},

		onPressLaborEdit: function(oEvent) {
  			var oContext = this.byId("laborHeaderPnl").getBindingContext();
  			var oControl = oEvent.getSource();
  			var oResource = this.getResourceBundle();
  			var oViewModel = new JSONModel({
  				title: oResource.getText("editPersonnel"),
  				mode: "edit"
  			});

  			var oCountry = this.getModel("InScreenFilters").getProperty("/ProjectSet/Country");
  			if (oCountry === 'QC') {
				var oModel = new JSONModel({
				    Day :  oContext.getProperty("Day"),  
	                ProjectNo : oContext.getProperty("ProjectNo"), 
	                Key: oContext.getProperty("Key"),
	                FlagLocked: oContext.getProperty("FlagLocked"),
	                FlagInt : oContext.getProperty("FlagInt"),  
	                EmployeeNo : oContext.getProperty("EmployeeNo"),  
	                EmployeeName : oContext.getProperty("EmployeeName"),  
	                Price : oContext.getProperty("Price"),  
	                Currency : oContext.getProperty("Currency"),  
	                Mu : oContext.getProperty("Mu"),  
	                MuName : oContext.getProperty("MuName"),  
	                ActivityType : oContext.getProperty("ActivityType"),  
	                Ccq : (oContext.getProperty("Ccq") === 'XX') ? '' : oContext.getProperty("Ccq"),  
	                Rule : (oContext.getProperty("Rule") === 'XX' ? '' : oContext.getProperty("Rule")),  
	                WorkTimeBeg : formatter.formatDisplayTime(oContext.getProperty("WorkTimeBeg")),  
	                WorkTimeEnd : formatter.formatDisplayTime(oContext.getProperty("WorkTimeEnd")), 
	                BreakTimeBeg : formatter.formatDisplayTime(oContext.getProperty("BreakTimeBeg")),  
	                BreakTimeEnd : formatter.formatDisplayTime(oContext.getProperty("BreakTimeEnd")), 
	                TotalCost : oContext.getProperty("TotalCost"), 
	                TotalDayQty : oContext.getProperty("TotalDayQty"),
	                Unit: oContext.getProperty("Unit"),
	                CostCode : oContext.getProperty("CostCode"),
                    IntStatus: oContext.getProperty("IntStatus"), 
                    Origin: oContext.getProperty("Origin"),
                    ForemanNo: oContext.getProperty("ForemanNo"),
                    Version: oContext.getProperty("Version")
				});
			} else {
				var oModel = new JSONModel({
				    Day :  oContext.getProperty("Day"),  
	                ProjectNo : oContext.getProperty("ProjectNo"), 
	                Key: oContext.getProperty("Key"),
	                FlagLocked: oContext.getProperty("FlagLocked"),
	                FlagInt : oContext.getProperty("FlagInt"),  
	                EmployeeNo : oContext.getProperty("EmployeeNo"),  
	                EmployeeName : oContext.getProperty("EmployeeName"),  
	                Price : oContext.getProperty("Price"),  
	                Currency : oContext.getProperty("Currency"),  
	                Mu : oContext.getProperty("Mu"),  
	                MuName : oContext.getProperty("MuName"),  
	                ActivityType : oContext.getProperty("ActivityType"),
	                Ccq : "",  
	                Rule : "",  
	                WorkTimeBeg : formatter.formatODataTime("00:00"),  
	                WorkTimeEnd : formatter.formatODataTime("00:00"), 
	                BreakTimeBeg : formatter.formatODataTime("00:00"),  
	                BreakTimeEnd : formatter.formatODataTime("00:00"), 
	                TotalCost : oContext.getProperty("TotalCost"), 
	                TotalDayQty : oContext.getProperty("TotalDayQty"),
	                Unit: oContext.getProperty("Unit"),
	                CostCode : oContext.getProperty("CostCode"),
	                IntStatus: oContext.getProperty("IntStatus"), 
	                Origin: oContext.getProperty("Origin"),
	                ForemanNo: oContext.getProperty("ForemanNo"),
	                Version: oContext.getProperty("Version")
				});
			}
			oModel.setDefaultBindingMode("TwoWay");

			this._oLaborEditDialog = this.onOpenDialog(this._oLaborEditDialog,
			   "zwo.ui.wks_rep.view.labor.fragment.masterAdd",
			   oControl);
			this._oLaborEditDialog.setModel(oViewModel, "Form");
			this._oLaborEditDialog.setModel(oModel, "Input");
		},
	
		onPressLaborSave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oCountry = oInScreenModel.getProperty("/ProjectSet/Country");
			if(self._oMasterAddDialog){
				var oInput = self._oMasterAddDialog.getModel("Input").getData();
			}else{
				var oInput = self._oLaborEditDialog.getModel("Input").getData();
			}
	
			var oLabor = oInput;
			oLabor.Day = formatter.formatODataDate(self._sDay);
			oLabor.ProjectNo = self._sProjectNo;
			if (oCountry === 'QC') {
				oLabor.WorkTimeBeg = (oLabor.WorkTimeBeg.__edmType) ? oLabor.WorkTimeBeg : formatter.formatODataTime(oInput.WorkTimeBeg);
				oLabor.WorkTimeEnd = (oLabor.WorkTimeEnd.__edmType) ? oLabor.WorkTimeEnd : formatter.formatODataTime(oInput.WorkTimeEnd);
				oLabor.BreakTimeBeg = (oLabor.BreakTimeBeg.__edmType) ? oLabor.BreakTimeBeg : formatter.formatODataTime(oInput.BreakTimeBeg);
				oLabor.BreakTimeEnd = (oLabor.BreakTimeEnd.__edmType) ? oLabor.BreakTimeEnd : formatter.formatODataTime(oInput.BreakTimeEnd);
			}
			// Checking if all mandatory fields are filled
			if (oLabor.EmployeeNo.trim() === "" || oLabor.EmployeeName.trim() === "" || (oLabor.Price.trim() === "" || oLabor.Price === "0.00") || oLabor.Mu.trim() === "" ||
					(self.byId("idActivityType").getRequired() && oLabor.ActivityType.trim() === "") || ((oCountry === "QC") && oLabor.WorkTimeBeg.ms === 0) || 
				((oCountry === "QC") && oLabor.WorkTimeEnd.ms === 0) ||
				(self.byId("idRule").getRequired() && (oCountry === "QC") && oLabor.Rule.trim() === "") ||
				(self.byId("idCCQ").getRequired() && (oCountry === "QC") && oLabor.Ccq.trim() === "")) {
				if(oLabor.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
				if(self._oMasterAddDialog){
					var oDfrdAdd = self.addLaborItem(oLabor, self);
				
				oDfrdAdd.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("successDetAdd"));
							// Closing dialog window
							self._oMasterAddDialog.close();
							self._oMasterAddDialog.destroy(true);
							self._oMasterAddDialog = null;
							
							self.getRouter().navTo("labor", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
					},
					// Error handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("errorLaborAdd"));
					});
				}else{
					var oDfrdUpd = self.updateLaborItem(oLabor, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("successUpdate"));
							
							var oTable = self.byId("costCodeList");
							var oItems = oTable.getItems();
							if(oItems.length === 0){
								var oBonusTable = self.byId("bonusList");
								var oBonusItems = oBonusTable.getItems();
								for (var i = 0; i < oBonusItems.length; i++) {
									var oContext = oBonusItems[i].getBindingContext();
									var oLaborBonus = oContext.getObject();
									oLaborBonus.EmployeeName = oLabor.EmployeeName;
									oLaborBonus.EmployeeNo = oLabor.EmployeeNo;
									oLaborBonus.ActivityType = oLabor.ActivityType;
									self._addBonusLabor(oLaborBonus);
								}

								self._deleteLaborBonus(oBonusItems);
							}
		
							// Closing dialog window
							self._oLaborEditDialog.close();
							
							self.getRouter().navTo("labor", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
						},
						// Error handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
						});
					}
			}
		},
	
	  onPressCostCodeAdd: function(oEvent) {
	     var oControl = oEvent.getSource();
	     var oResource = this.getResourceBundle();
	
	     var oViewModel = new JSONModel({
	           title: oResource.getText("addCostCode"),
	           mode: "add"
	     });
	
	     var oUser = this.getModel("user");
	     var oCountry = this.getModel("InScreenFilters").getProperty("/ProjectSet/Country");
		 var oCostCodeTable = this.byId("costCodeList");
		 var oBonusTable = this.byId("bonusList");
		 var oContext = this.byId("laborHeaderPnl").getBindingContext();
		 
		if(oCostCodeTable.getItems().length === 0 && oBonusTable.getItems().length > 0){
			if (oCountry === 'QC') {
				var oModel = new JSONModel({
					Day: "",
					ProjectNo: "",
					Key: "",
					FlagLocked: false,
					FlagInt: false,
					EmployeeNo : oContext.getProperty("EmployeeNo"),  
	                EmployeeName : oContext.getProperty("EmployeeName"),
					Price: "",
					Currency: "",
					Mu: "",
					MuName: "",
					ActivityType: "",
					Ccq: "",	
					Rule: "",
					WorkTimeBeg: "00:00",
					WorkTimeEnd: "00:00",
					BreakTimeBeg: "00:00",
					BreakTimeEnd: "00:00",
					TotalCost: "0.00",
					TotalDayQty: "0.00",
					Unit: "",
					CostCode: "",
					IntStatus: "",
					Origin: "M",
					ForemanNo: oUser.getProperty("/PersonID"), // M,
					Version: "00"
				});
			} else {
				var oModel = new JSONModel({
					Day: "",
					ProjectNo: "",
					Key: "",
					FlagLocked: false,
					FlagInt: false,
					EmployeeNo : oContext.getProperty("EmployeeNo"),  
	                EmployeeName : oContext.getProperty("EmployeeName"),
					Price: "",
					Currency: "",
					Mu: "",
					MuName: "",
					ActivityType: "",
					TotalCost: "0.00",
					TotalDayQty: "0.00",
					Unit: "",
					CostCode: "",
					IntStatus: "",
					Origin: "M",
					ForemanNo: oUser.getProperty("/PersonID"), // M,
					Version: "00"
				});
			}			
			oModel.setDefaultBindingMode("TwoWay");

			// Opening MasterAdd Dialog 
			var oControl = oEvent.getSource();
			this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
				"zwo.ui.wks_rep.view.labor.fragment.masterAdd",
				oControl);
			this._oMasterAddDialog.setModel(oViewModel, "Form");
			this._oMasterAddDialog.setModel(oModel, "Input");
		}else{
			if (oCountry === 'QC') {
				var oModel = new JSONModel({
					   Day: "",
					   ProjectNo: "",
					   Key: "",
					   InternalNo: "",
					   LineNo: "",
					   ValidationLine: "",
					   FlagInt: false,
					   IntStatus: "",
					   CostCode: "", // M
					   CostCodeDes: "", // M
					   QtyDay: "0.00", //M
					   Td: "0.00",
					   Unit: "",
					   Origin: "M",
					   ForemanNo: oUser.getProperty("/PersonID"), // M
					   ForemanName: oUser.getProperty("/Uname"),
					   Version: "", // M
					   User: "",
					   Date: null,
					   SapDoc: "",
					   FlagComment: "",
					   Comments: ""
				});
			} else {
				var oModel = new JSONModel({
					   Day: "",
					   ProjectNo: "",
					   Key: "",
					   InternalNo: "",
					   LineNo: "",
					   ValidationLine: "",
					   FlagInt: false,
					   IntStatus: "",
					   CostCode: "", // M
					   CostCodeDes: "", // M
					   QtyDay: "0.00", //M
					   Unit: "",
					   Origin: "M",
					   ForemanNo: oUser.getProperty("/PersonID"), // M
					   ForemanName: oUser.getProperty("/Uname"),
					   Version: "", // M
					   User: "",
					   Date: null,
					   SapDoc: "",
					   FlagComment: "",
					   Comments: "",
				});
			}
			oModel.setDefaultBindingMode("TwoWay");
		
					 this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
						   "zwo.ui.wks_rep.view.labor.fragment.CostCodeAdd",
						   oControl);
					 this._oCostCodeAddDialog.setModel(oViewModel, "Form");
					 this._oCostCodeAddDialog.setModel(oModel, "Input");
		}
	  },
	
	  onPressCostCodeEdit: function(oEvent) {
		 var oTable = this.byId("costCodeList");
		 if (oTable.getSelectedItem()) {
			   // Form model
			   var oResource = this.getResourceBundle();
			   var oViewModel = new JSONModel({
					  title: oResource.getText("editCostCode"),
					  mode: "edit"
			   });    
	
			   var aCostCode = [];
			   var oSelItems = oTable.getSelectedItems();
			   var oCountry = this.getModel("InScreenFilters").getProperty("/ProjectSet/Country");
			   if (oCountry === 'QC') {
				for (var i = 0; i < oSelItems.length; i++) {
					var oContext = oSelItems[i].getBindingContext();
					var oCostCode = {
						Day: oContext.getProperty("Day"),
						ProjectNo: oContext.getProperty("ProjectNo"),
						Key: oContext.getProperty("Key"),						
						InternalNo : oContext.getProperty("InternalNo"),
						LineNo : oContext.getProperty("LineNo"),
						ValidationLine : oContext.getProperty("ValidationLine"),
						FlagInt : oContext.getProperty("FlagInt"),
						IntStatus : oContext.getProperty("IntStatus"),
						CostCode : oContext.getProperty("CostCode"),
						CostCodeDes : oContext.getProperty("CostCodeDes"),
						QtyDay : oContext.getProperty("QtyDay"),
						Td : oContext.getProperty("Td"),
						Unit : oContext.getProperty("Unit"),
						Origin : oContext.getProperty("Origin"),
						ForemanNo: oContext.getProperty("ForemanNo"),
						ForemanName: oContext.getProperty("ForemanName"), 
						Version : oContext.getProperty("Version"),
						User: oContext.getProperty("User"),
						Date : oContext.getProperty("Date"),
						SapDoc : oContext.getProperty("SapDoc"),
						FlagComment: oContext.getProperty("FlagComment"),
						Comments: oContext.getProperty("Comments")
					};
					aCostCode.push(oCostCode);
				}
			} else {
				for (var i = 0; i < oSelItems.length; i++) {
					var oContext = oSelItems[i].getBindingContext();
					var oCostCode = {
						Day: oContext.getProperty("Day"),
						ProjectNo: oContext.getProperty("ProjectNo"),
						Key: oContext.getProperty("Key"),
						InternalNo : oContext.getProperty("InternalNo"),
						LineNo : oContext.getProperty("LineNo"),
						ValidationLine : oContext.getProperty("ValidationLine"),
						FlagInt : oContext.getProperty("FlagInt"),
						IntStatus : oContext.getProperty("IntStatus"),
						CostCode : oContext.getProperty("CostCode"),
						CostCodeDes : oContext.getProperty("CostCodeDes"),
						QtyDay : oContext.getProperty("QtyDay"),
						Unit : oContext.getProperty("Unit"),
						Origin : oContext.getProperty("Origin"),
						ForemanNo: oContext.getProperty("ForemanNo"),
						ForemanName: oContext.getProperty("ForemanName"),
						Version : oContext.getProperty("Version"),
						User: oContext.getProperty("User"),
						Date : oContext.getProperty("Date"),
						SapDoc : oContext.getProperty("SapDoc"),
						FlagComment: oContext.getProperty("FlagComment"),
						Comments: oContext.getProperty("Comments")
					};
					aCostCode.push(oCostCode);
				}
			}
			var oModel = new JSONModel(aCostCode);
	
			// Instantiating Dialog fragment
			var oControl = oEvent.getSource();
			this._oCostCodeEditDialog = this.onOpenDialog(this._oCostCodeEditDialog,
				  "zwo.ui.wks_rep.view.labor.fragment.CostCodeEdit",
				  oControl);
	
			// Binding models to fragment
			this._oCostCodeEditDialog.setModel(oViewModel, "Form");
			this._oCostCodeEditDialog.setModel(oModel, "Input");
		} else {
			MessageToast.show(this.getResourceBundle().getText("errorEdit"));
		}
	},
	
	  onPressCostCodeCopy: function(oEvent) {
			 var oTable = this.byId("costCodeList");
			 if (oTable.getSelectedItem()) {
				   // Form model
				   var oResource = this.getResourceBundle();
				   var oViewModel = new JSONModel({
						  title: oResource.getText("addCostCode"),
						  mode: "add"
				   });
	
				   var oUser = this.getModel("user");
				   // Input model
				   var selItem = oTable.getSelectedItem().getBindingContext();
				   var oCountry = this.getModel("InScreenFilters").getProperty("/ProjectSet/Country");
			if (oCountry === 'QC') {
				var oModel = new JSONModel({
					  Day: "",
					  ProjectNo: "",
					  Key: "",
					  InternalNo: "",
					  LineNo: "",
					  ValidationLine: "",
					  FlagInt: false,
					  IntStatus: "",
					  CostCode: selItem.getProperty("CostCode"),
					  CostCodeDes: selItem.getProperty("CostCodeDes"),
					  QtyDay: selItem.getProperty("QtyDay"),
					  Td: selItem.getProperty("Td"),
					  Unit: selItem.getProperty("Unit"),
					  Origin: "M",
					  ForemanNo:  oUser.getProperty("/PersonID"),
					  ForemanName: oUser.getProperty("/Uname"),
					  Version: selItem.getProperty("Version"),
					  User: "",
					  Date: null,
					  SapDoc: "",
					  FlagComment: "",
					  Comments: ""
				});
			} else {
				var oModel = new JSONModel({
					  Day: "",
					  ProjectNo: "",
					  Key: "",
					  InternalNo: "",
					  LineNo: "",
					  ValidationLine: "",
					  FlagInt: false,
					  IntStatus: "",
					  CostCode: selItem.getProperty("CostCode"),
					  CostCodeDes: selItem.getProperty("CostCodeDes"),
					  QtyDay: selItem.getProperty("QtyDay"),
					  Unit: selItem.getProperty("Unit"),
					  Origin: "M",
					  ForemanNo:  oUser.getProperty("/PersonID"),
					  ForemanName: oUser.getProperty("/Uname"),
					  Version: selItem.getProperty("Version"),
					  User: "",
					  Date: null,
					  SapDoc: "",
					  FlagComment: "",
					  Comments: ""
				});
			}
	
		   // Instantiating Dialog fragment
		   var oControl = oEvent.getSource();
		   this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
				  "zwo.ui.wks_rep.view.labor.fragment.CostCodeAdd",
				  oControl);
	
		   // Binding models to fragment
		   this._oCostCodeAddDialog.setModel(oViewModel, "Form");
		   this._oCostCodeAddDialog.setModel(oModel, "Input");
		} else {
		   MessageToast.show(this.getResourceBundle().getText("errorCopy"));
		}
	  },
	
	  handleSaveCostCode: function() {
			var self = this;
			var oInput = {};
			var oInScreenModel = self.getModel("InScreenFilters");
			var oCountry = oInScreenModel.getProperty("/ProjectSet/Country");
	
			if (this._oCostCodeAddDialog) {
			   oInput = self._oCostCodeAddDialog.getModel("Input").getData();
	
			   var oCostCode = oInput;
			   oCostCode.Day = formatter.formatODataDate(self._sDay);
			   oCostCode.ProjectNo = self._sProjectNo;
			   oCostCode.Key = self._sKey;
			   // Setting undefined input fields left unfilled to empty string
			   oCostCode.CostCode = (oInput.CostCode) ? oInput.CostCode : "";
			   oCostCode.CostCodeDes = (oInput.CostCodeDes) ? oInput.CostCodeDes : "";
			   oCostCode.QtyDay = (oInput.QtyDay) ? oInput.QtyDay : "0.00";
			   if (oCountry === "QC") {
				   oCostCode.Td = (oInput.Td) ? oInput.Td : "0.00";
			   }
			   oCostCode.Unit = (oInput.Unit) ? oInput.Unit : "";
			   oCostCode.Origin = (oInput.Origin) ? oInput.Origin : "";
			   oCostCode.ForemanNo = (oInput.ForemanNo) ? oInput.ForemanNo : "";
			   oCostCode.ForemanName = (oInput.ForemanName) ? oInput.ForemanName : "";
			   oCostCode.Version = (oInput.Version) ? oInput.Version : "00";	

			   if(oCountry === "QC" && (parseFloat(oCostCode.Td) > parseFloat(oCostCode.QtyDay))){			//SR 566329 (JPJ, 08/06/2018)
				   MessageToast.show(self.getResourceBundle().getText("tdError"));
			   }else{ 
				   //Check filter for reports and removing it if foreman is not found in filter
				   //reason: cost code does not appear if foreman is not found in filter 
				   var aReports = oInScreenModel.getProperty("/Reports");
				   if(aReports.length > 0){
						var found = false;
					   for (var i=0; i<aReports.length; i++){
						   if(aReports[i].ForemanNo === oCostCode.ForemanNo &&
								   aReports[i].Version === oCostCode.Version &&
								   aReports[i].Origin === oCostCode.Origin){
							   found = true;
							   break;
						   }
					   }
					   if(found === false){
						  for(var i = -1; i < aReports.length; i++){
							   aReports.pop();
						  }
						  var oDfrd = self._addCostCode(oCostCode);
						  oDfrd.then(
								//success handler
								 function(){
									 	//refresh report list
									 	self.getRepVersions(oCostCode.ProjectNo, oCostCode.Day);
										var aResults = [];
										var oDfrdMaster = self.getMasterItem(oCostCode, aResults);
										oDfrdMaster.then(
										//success handler
										function(){
											var oProject = self.getOwnerComponent().byId("project");
											var oControl = oProject.byId("selectReport");
											oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
											var index = self.getMasterItemIndex(oCostCode, aResults);
											self.getRouter().navTo("labor", {
												Day: self._sDay,
												ProjectNo: self._sProjectNo,
												itemNo: index	
											}, true);
											
											MessageToast.show(self.getResourceBundle().getText("filterReset"));
										}
									);
								 });
					   } else{
						   self._addCostCode(oCostCode);
					   }
				   }else {
					   var oDfrd = self._addCostCode(oCostCode);
					   oDfrd.then(
					   function(){
						 //refresh report list
						   self.getRepVersions(oCostCode.ProjectNo, oCostCode.Day);
					   });
				   }
			   }
			}
	
			if (this._oCostCodeEditDialog) {
			   oInput = self._oCostCodeEditDialog.getModel("Input");
			   for (var i = 0; i < oInput.oData.length; i++) {
					  oInput.oData[i].Day = formatter.formatODataDate(self._sDay);
					  var oInputItem = oInput.oData[i];
					  if (oInputItem.CostCode.trim() === "" || oInputItem.ForemanNo.trim() === "" ||
							 (oInputItem.Version.trim() === "" && oInputItem.Origin === "P") || oInputItem.QtyDay.trim() === "") {
							 MessageToast.show(self.getResourceBundle().getText("missingInput"));
							 break;
					  } else {
						  if(oCountry === "QC"){
							   if(parseFloat(oInputItem.Td) <= parseFloat(oInputItem.QtyDay)){		//SR 566329 (JPJ, 08/06/2018)
								   self._updateCostCode(oInputItem);
							   }else{
								   MessageToast.show(self.getResourceBundle().getText("tdError"));
							   }
						   }else{
							   self._updateCostCode(oInputItem);
						   }
					  }
			   }
			   self.getView().byId("cpyDetBtn").setEnabled(true);
			}
		},

		onPressBonusIntPop: function(oEvent) {
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();

			this._oLaborDetFrgmt = this.openSelectionPopover(this._oLaborDetFrgmt,
				"zwo.ui.wks_rep.view.labor.fragment.LaborIntPopover", oControl);
			this._oLaborDetFrgmt.setBindingContext(oContext);
		},

		onPressDetFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bPressed = oControl.getPressed();
			var oContext = oControl.getBindingContext();
			var sIntStatus = oContext.getProperty("IntStatus");
			var sPath = oContext.getPath();

			//if (self.validateItemEdit(sIntStatus, sOrigin, self, true)) {
			if (self.validateItemEdit(sIntStatus, self, true)) {
				var oLaborDetItem = self.getModel().getProperty(sPath);
				var oDfrdUpd = self.updateLaborDetItem(oLaborDetItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						self.getRouter().navTo("labor", {
							Day: self._sDay,
							ProjectNo: self._sProjectNo,
							itemNo: self._sItemNo
						}, true);
					},
					// Error handler
					function() {
						oControl.setPressed(!bPressed);
					});
			} else {
				oControl.setPressed(!bPressed);
			}
		},

		onPressDetLock: function() {
			var self = this;
			var oTable = self.byId("costCodeList");
			var aSelItems = oTable.getSelectedItems();

			aSelItems.forEach(function(item) {
				var oContext = item.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var bFlag = oContext.getProperty("FlagInt");
				var sPath = oContext.getPath();
				var oLaborDetItem = oContext.getProperty(sPath);
				var bLocked = false;

				if (self.validateItemEdit(sIntStatus, self, true)) {
					var oStatusModel = self.getModel("statusList");
					var iIntLocked1 = oStatusModel.getProperty("/4/index");
					var iIntLocked2 = "7";
					var iNotInt1 = oStatusModel.getProperty("/0/index");
					var iNotInt2 = "1";
					var iIntError = oStatusModel.getProperty("/2/index");

					switch (sIntStatus) {
						case (iNotInt1): // Lock item and Integration status is Not Modified
							oLaborDetItem.IntStatus = iIntLocked1;
							oLaborDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oLaborDetItem.IntStatus = iIntLocked1;
							oLaborDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oLaborDetItem.IntStatus = iIntLocked2;
							oLaborDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oLaborDetItem.IntStatus = iNotInt2;
							oLaborDetItem.FlagInt = false;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oLaborDetItem.IntStatus = iIntError;
							oLaborDetItem.FlagInt = false;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateLaborDetItem(oLaborDetItem, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							self.getRouter().navTo("labor", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
						},
						// Error handler
						function() {
							oLaborDetItem.IntStatus = sIntStatus;
							oLaborDetItem.FlagInt = bFlag;
						});
				}
				item.setSelected(false);
			});
			self.getView().byId("cpyDetBtn").setEnabled(true);
			self.getView().byId("editDetBtn").setEnabled(true);
			self.getView().byId("delDetBtn").setEnabled(true);
		},

		onPressDetDelete: function() {
			var self = this;
			var oTable = self.byId("costCodeList");
			var aSelItems = oTable.getSelectedItems();

			if (aSelItems.length === 0) {
				MessageToast.show(self.getResourceBundle().getText("errorDelete"));
			} else {
				self._openDeleteDialog(aSelItems, oTable);
				self.getView().byId("cpyDetBtn").setEnabled(true);
				self.getView().byId("lockDetBtn").setEnabled(true);
				self.getView().byId("editDetBtn").setEnabled(true);
			}
		},

		onPressPapyrusSummary: function(oEvent) {
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();
			
			sPath += "/LaborDetToPapyrus";
			
			this._oLaborPapyrusDetailsDialog = this.onOpenDialog(this._oLaborPapyrusDetailsDialog,
				"zwo.ui.wks_rep.view.labor.fragment.LaborPapyrusPopup", oControl);
			this._oLaborPapyrusDetailsDialog.bindElement(sPath);
		},
		
		handleClosePapyrusSummary: function() {
			this._oLaborPapyrusDetailsDialog.close();
		},

		onSelectBonusItem: function(oEvent) {
			var self = this;
			var oTable = oEvent.getSource();
			var sId = oTable.getId();
			var oSelItems = oTable.getSelectedItems();

			// Disabling button copy if more than 1 item is selected
			if (oSelItems.length > 1) {
				self.getView().byId("cpyBonusBtn").setEnabled(false);
			} else {
				self.getView().byId("cpyBonusBtn").setEnabled(true);
			}

			// Disabling button edit if more than 1 item is selected
			// or if any item has locked status or other status that does not
			// allow an edit
			if (oSelItems.length > 1 || self.isAnySelItemLocked(oSelItems, self) || self.isEditNotAllowed(oSelItems, self)) {
				self.getView().byId("editBonusBtn").setEnabled(false);
			} else {
				self.getView().byId("editBonusBtn").setEnabled(true);
			}

			// Disabling button delete if more than 1 item is selected
			// or if int status does not allow a delete
			//if (oSelItems.length > 1 || self.isDelNotAllowed(oSelItems, self)) {
			if (self.isDelNotAllowed(oSelItems, self)) {
				self.getView().byId("delBonusBtn").setEnabled(false);
			} else {
				self.getView().byId("delBonusBtn").setEnabled(true);
			}

			// Disabling button lock if line status does not allow an edit
			if (self.isEditNotAllowed(oSelItems, self)) {
				self.getView().byId("lockBonusBtn").setEnabled(false);
			} else {
				self.getView().byId("lockBonusBtn").setEnabled(true);
			}
		},

		onPressBonusDelete: function() {
			var self = this;
			var oTable = self.byId("bonusList");
			var aSelItems = oTable.getSelectedItems();

			if (aSelItems.length === 0) {
				MessageToast.show(self.getResourceBundle().getText("errorDelete"));
			} else {
				self._openDeleteDialog(aSelItems, oTable);
				self.getView().byId("cpyBonusBtn").setEnabled(true);
				self.getView().byId("lockBonusBtn").setEnabled(true);
				self.getView().byId("editBonusBtn").setEnabled(true);
			}
		},

		onPressBonusAdd: function(oEvent) {
			var self = this;
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("addBonus"),
				mode: "add"
			});
			
			var oEmpContext = self.byId("laborHeaderPnl").getBindingContext();				
			var sEmployeeNo = oEmpContext.getProperty("EmployeeNo");
			var sEmployeeName = oEmpContext.getProperty("EmployeeName");
			var sActivityType = oEmpContext.getProperty("ActivityType");

			var oModel = new JSONModel({
				ProjectNo: "",
				Day: "0000-00-00T00:00",
				ValidationLine: "",
				IntStatus: "",
				FlagInt: true,
				EmployeeNo: sEmployeeNo,
				EmployeeName: sEmployeeName,
				TypeOfHour: "",
				HoursQty: "0.00",
				Bonus: "",
				BonusQty: "0.00",
				WBSElement: "",
				ActivityType: sActivityType,
				User: "",
				Date: null,
				ForemanNo: ""
			});

			oModel.setDefaultBindingMode("TwoWay");

			//open bonus dialog
			var oControl = oEvent.getSource();
			this._oBonusAddDialog = this.onOpenDialog(this._oBonusAddDialog,
				"zwo.ui.wks_rep.view.labor.fragment.bonusAdd",
				oControl);
			this._oBonusAddDialog.setModel(oViewModel, "Form");
			this._oBonusAddDialog.setModel(oModel, "Input");
		},

		onPressBonusEdit: function(oEvent) {
			var oTable = this.byId("bonusList");
			if (oTable.getSelectedItem()) {
				var oContext = oTable.getSelectedItem().getBindingContext();
				var oControl = oEvent.getSource();
				var oResource = this.getResourceBundle();
				var oViewModel = new JSONModel({
					title: oResource.getText("editBonus"),
					mode: "edit"
				});

				
				var oModel = new JSONModel({
					ProjectNo: oContext.getProperty("ProjectNo"),
					Day: oContext.getProperty("Day"),
					ValidationLine: oContext.getProperty("ValidationLine"),
					IntStatus: oContext.getProperty("IntStatus"),
					FlagInt: oContext.getProperty("FlagInt"),
					EmployeeNo: oContext.getProperty("EmployeeNo"),
					EmployeeName: oContext.getProperty("EmployeeName"),
					TypeOfHour: oContext.getProperty("TypeOfHour"),
					HoursQty: oContext.getProperty("HoursQty"),
					Bonus: oContext.getProperty("Bonus"),
					BonusQty: oContext.getProperty("BonusQty"),
					WBSElement: oContext.getProperty("WBSElement"),
					ActivityType: oContext.getProperty("ActivityType"),
					User: oContext.getProperty("User"),
					Date: oContext.getProperty("Date"),
					ForemanNo: oContext.getProperty("ForemanNo")
				});

				oModel.setDefaultBindingMode("TwoWay");

				var oControl = oEvent.getSource();
				this._oBonusEditDialog = this.onOpenDialog(this._oBonusEditDialog,
					"zwo.ui.wks_rep.view.labor.fragment.bonusAdd",
					oControl);

				this._oBonusEditDialog.setModel(oViewModel, "Form");
				this._oBonusEditDialog.setModel(oModel, "Input");
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorEdit"));
			}
		},

		handleBonusSave: function() {
			var self = this;
			var oInput = {};

			if (this._oBonusAddDialog) {
				oInput = self._oBonusAddDialog.getModel("Input").getData();
			}

			if (this._oBonusEditDialog) {
				oInput = self._oBonusEditDialog.getModel("Input").getData();
			}

			var oLaborBonus = oInput;
			oLaborBonus.ProjectNo = self._sProjectNo;
			oLaborBonus.Day = formatter.formatODataDate(self._sDay);
			oLaborBonus.TypeOfHour = (oInput.TypeOfHour) ? oInput.TypeOfHour : "";
			oLaborBonus.HoursQty = (oInput.HoursQty) ? oInput.HoursQty : "";
			oLaborBonus.Bonus = (oInput.Bonus) ? oInput.Bonus : "";
			oLaborBonus.BonusQty = (oInput.BonusQty) ? oInput.BonusQty : "";
			oLaborBonus.WBSElement = (oInput.WBSElement) ? oInput.WBSElement : "";

			if (this._oBonusAddDialog) {
				self._addBonusLabor(oLaborBonus);

			}

			if (this._oBonusEditDialog) {
				self._updateBonusLabor(oLaborBonus);
			}
		},

		onPressBonusCopy: function(oEvent) {
			var oTable = this.byId("bonusList");
			if (oTable.getSelectedItem()) {
				var oContext = oTable.getSelectedItem().getBindingContext();
				var oControl = oEvent.getSource();
				var oResource = this.getResourceBundle();
				var oViewModel = new JSONModel({
					title: oResource.getText("addBonus"),
					mode: "add"
				});

				var oModel = new JSONModel({
					Day: formatter.formatODataDate(self._sDay),
					ProjectNo: self._sProjectNo,
					ValidationLine: "",
					IntStatus: "",
					FlagInt: true,
					EmployeeNo: oContext.getProperty("EmployeeNo"),
					EmployeeName: oContext.getProperty("EmployeeName"),
					TypeOfHour: oContext.getProperty("TypeOfHour"),
					HoursQty: oContext.getProperty("HoursQty"),
					Bonus: oContext.getProperty("Bonus"),
					BonusQty: oContext.getProperty("BonusQty"),
					WBSElement: oContext.getProperty("WBSElement"),
					ActivityType: oContext.getProperty("ActivityType"),
					User: "",
					Date: null,
					ForemanNo: "",
				});

				oModel.setDefaultBindingMode("TwoWay");

				var oControl = oEvent.getSource();

				this._oBonusAddDialog = this.onOpenDialog(this._oBonusAddDialog,
					"zwo.ui.wks_rep.view.labor.fragment.bonusAdd",
					oControl);

				this._oBonusAddDialog.setModel(oViewModel, "Form");
				this._oBonusAddDialog.setModel(oModel, "Input");
				oTable.getSelectedItem().setSelected(false);
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorCopy"));
			}
		},

		onPressBonusFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bPressed = oControl.getPressed();
			var oContext = oControl.getBindingContext();
			var sIntStatus = oContext.getProperty("IntStatus");
			var sPath = oContext.getPath();

			//if (self.validateBonusItemEdit(sIntStatus, self, true)) {
			if (self.validateItemEdit(sIntStatus, self, true)) {
				var oBonusItem = self.getModel().getProperty(sPath);
				var oDfrdUpd = self.updateLaborBonusItem(oBonusItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						self.getRouter().navTo("labor", {
							Day: self._sDay,
							ProjectNo: self._sProjectNo,
							itemNo: self._sItemNo
						}, true);
					},
					// Error handler
					function() {
						oControl.setPressed(!bPressed);
					});
			} else {
				oControl.setPressed(!bPressed);
			}
		},

		onPressBonusLock: function() {
			var self = this;
			var oTable = self.byId("bonusList");
			var aSelItems = oTable.getSelectedItems();

			aSelItems.forEach(function(item) {
				var oContext = item.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var bFlag = oContext.getProperty("FlagInt");
				var sPath = oContext.getPath();
				var oBonusItem = oContext.getProperty(sPath);
				var bLocked = false;

				//if (self.validateBonusItemEdit(sIntStatus, self, true)) {
				if (self.validateItemEdit(sIntStatus, self, true)) {
					var oStatusModel = self.getModel("statusList");
					var iIntLocked1 = oStatusModel.getProperty("/4/index");
					var iIntLocked2 = "7";
					var iNotInt1 = oStatusModel.getProperty("/0/index");
					var iNotInt2 = "1";
					var iIntError = oStatusModel.getProperty("/2/index");

					switch (sIntStatus) {
						case (iNotInt1): // Lock item and Integration status is Not Modified
							oBonusItem.IntStatus = iIntLocked1;
							oBonusItem.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oBonusItem.IntStatus = iIntLocked1;
							oBonusItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oBonusItem.IntStatus = iIntLocked2;
							oBonusItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oBonusItem.IntStatus = iNotInt2;
							oBonusItem.FlagInt = false;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oBonusItem.IntStatus = iIntError;
							oBonusItem.FlagInt = false;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateLaborBonusItem(oBonusItem, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							self.getRouter().navTo("labor", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
						},
						// Error handler
						function() {
							oBonusItem.IntStatus = sIntStatus;
							oBonusItem.FlagInt = bFlag;
						});
				}
				item.setSelected(false);
			});
			self.getView().byId("cpyBonusBtn").setEnabled(true);
			self.getView().byId("editBonusBtn").setEnabled(true);
			self.getView().byId("delBonusBtn").setEnabled(true);

		},

		handleClose: function() {
			// Closing Dialog fragment
			if (this._oMasterAddDialog) {
				this._oMasterAddDialog.close();
				this._oMasterAddDialog.destroy(true);
				this._oMasterAddDialog = null;
			}
			
			if (this._oLaborEditDialog) {
				this._oLaborEditDialog.close();
				this._oLaborEditDialog.destroy(true);
				this._oLaborEditDialog = null;
			}

			if (this._oCostCodeAddDialog) {
				this._oCostCodeAddDialog.close();
				this._oCostCodeAddDialog.destroy(true);
				this._oCostCodeAddDialog = null;
			}

			if (this._oCostCodeEditDialog) {
				this._oCostCodeEditDialog.close();
				this._oCostCodeEditDialog.destroy(true);
				this._oCostCodeEditDialog = null;
			}

			if (this._oBonusAddDialog) {
				this._oBonusAddDialog.close();
				this._oBonusAddDialog.destroy(true);
				this._oBonusAddDialog = null;
			}
			if (this._oBonusEditDialog) {
				this._oBonusEditDialog.close();
				this._oBonusEditDialog.destroy(true);
				this._oBonusEditDialog = null;
			}
		},

		onSelectAllBonus: function(oEvent) {
			var self = this;
			var oTable = self.byId("bonusList");
			var bAllSelected = oTable.isAllSelectableSelected();

			//Disabling edit, copy and delete btn 
			if(bAllSelected === true){
				self.getView().byId("editBonusBtn").setEnabled(false);
				self.getView().byId("cpyBonusBtn").setEnabled(false);

			} else {
				self.getView().byId("editBonusBtn").setEnabled(true);
				self.getView().byId("cpyBonusBtn").setEnabled(true);

			}
		},
		
		/*onPressSAPDocLink: function(oEvent){
			var self = this;
			var oControl = oEvent.getSource();
			var oSapdoc = oControl.getText();
			var oParam = oSapdoc.split(" ", 2);
			var oTcode = oParam[0];
			var oReport = oParam[1];

			var oHostname = window.location.hostname;
			
			if(oHostname === "sapdevfior01.kherty.local" || oHostname === "sapdevfior01.sap.eurovia.com" || oHostname === "localhost"){
				var sHost = "http://sapdevdb03.sap.eurovia.com:8000";
				var sClient = "120";
			}else if(oHostname === "sapquafior01.kherty.local" || oHostname === "sapquafior01.sap.eurovia.com"){
				var sHost = "http://sapquaas01.sap.eurovia.com:8000";
				var sClient = "410";
			}else if(oHostname === "sapprdfior01.kherty.local" || oHostname === "sapprdfior01.sap.eurovia.com"){
				var sHost = "http://sapprdas04.sap.eurovia.com:8000"
				var sClient = "410";
			}
			
			if(oTcode === "CAT2"){
				var sUrl = sHost + "/sap/bc/gui/sap/its/webgui?sap-client=" + sClient + "&~transaction=*OLR3_ME2XN OLR3_R3_TS_PDOC-EBELN=" + oPurchaseDoc + ";DYNP_OKCODE=MODY";
				window.open(sUrl);
			} else if(oTcode = "KB21N"){
				var sUrl = sHost + "/sap/bc/gui/sap/its/webgui?sap-client=" + sClient + "&~transaction=*KB23N COHEADER-BELNR=" + oReport;
				window.open(sUrl);
			}
		},*/
		
		_addCostCode: function(oCostCode) {
			var self = this;
			var oDeferred = $.Deferred();
			// Checking if mandatory fields are filled
			if (oCostCode.CostCode.trim() === "" || oCostCode.CostCodeDes.trim() === "" || oCostCode.ForemanNo.trim() === "" ||
				oCostCode.ForemanName.trim() === "" || (oCostCode.Version.trim() === "" && oCostCode.Origin === "P") || oCostCode.QtyDay.trim() ===
				"") {

				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {				
				var oDfrdAdd = self.addLaborDetItem(oCostCode, self);
				oDfrdAdd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successDetAdd"));
						// Navigating back to master page to refresh list of master items						
						self.getRouter().navTo("labor", {
							Day: self._sDay,
							ProjectNo: self._sProjectNo,
							itemNo: self._sItemNo
						}, true);
						
						// Closing dialog window
						self.handleClose();
						oDeferred.resolve();
					},
					// Error handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("errorDetAdd"));
						oDeferred.reject();
					});
					return oDeferred.promise();
			}

		},

		_updateCostCode: function(oCostCode) {
			var self = this;
			var oDfrdUpd = self.updateLaborDetItem(oCostCode, self);
			oDfrdUpd.then(
				// Success handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("successUpdate"));
					
					// Navigating back to master page to refresh list of master items						
						self.getRouter().navTo("labor", {
							Day: self._sDay,
							ProjectNo: self._sProjectNo,
							itemNo: self._sItemNo
						}, true);
					// Closing dialog window
					self.handleClose();
				},
				// Error handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			});
		},

		_addBonusLabor: function(oLaborBonus) {
			var self = this;
			// Checking if mandatory fields are filled
			//if (oLaborBonus.TypeOfHour.trim() === "" || oLaborBonus.Bonus.trim() === "") {

			//MessageToast.show(self.getResourceBundle().getText("missingInput"));
			//} else {
			var oDfrdAdd = self.addLaborBonusItem(oLaborBonus, self);
			oDfrdAdd.then(
				//Success handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("successBonusAdd"));
					
					// Navigating back to master page to refresh list of master items						
						self.getRouter().navTo("labor", {
							Day: self._sDay,
							ProjectNo: self._sProjectNo,
							itemNo: self._sItemNo
						}, true);
						
					// Closing dialog window
					self.handleClose();
				},
				// Error handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("errorBonusAdd"));
				});
			//}
			
		},

		_updateBonusLabor: function(oLaborBonus) {
			var self = this;
			var oDfrdUpd = self.updateLaborBonusItem(oLaborBonus, self);
			oDfrdUpd.then(
				// Success handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("successUpdate"));
					// Navigating back to master page to refresh list of master items						
						self.getRouter().navTo("labor", {
							Day: self._sDay,
							ProjectNo: self._sProjectNo,
							itemNo: self._sItemNo
						}, true);
					// Closing dialog window
					self.handleClose();
				},
				// Error handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
				});
		},
		
		_openDeleteDialog: function(aSelItems, oTable){
			var self = this;
			
			// Opening dialog to confirm if item should be deleted
        	var dialog = new Dialog({
				title: "Confirm",
				type: "Message",
				state: "Warning",
				content: new Text({ 
					text: self.getResourceBundle().getText("confirmDelete"),
					textAlign: "Center",
				}),
				beginButton: new Button({
					text: self.getResourceBundle().getText("confirmOk"),
					press: function () {
						if(oTable === self.byId("costCodeList")){
							self._deleteLaborDet(aSelItems);
						}else {
							if(oTable === self.byId("bonusList")){
								self._deleteLaborBonus(aSelItems);
							}
						}
						
						dialog.close();
						dialog.destroy();
					}
				}),
				endButton: new Button({
					text: self.getResourceBundle().getText("confirmCancel"),
					press: function () {
						dialog.close();
						dialog.destroy();
					}
				})
			});						 
			dialog.open();
			
		},
		
		_deleteLaborDet: function(aSelItems){
			var self = this;
			aSelItems.forEach(function(oItem) {
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateItemDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oContext.getPath();
					var oLaborItem = oContext.getProperty(sPath);
					var oDfrdDel = self.deleteLaborDetItem(oLaborItem, self);
					oDfrdDel.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteOk"));
							 var aReports = self.getModel("InScreenFilters").getProperty("/Reports");
							   if(aReports.length > 0){
								 //refresh report list
								 	self.getRepVersions(self._sProjectNo, self._sDay);
									var aResults = [];
									var oDfrdMaster = self.getMasterItem(oLaborItem, aResults);
									oDfrdMaster.then(
									//success handler
									function(){
										var oProject = self.getOwnerComponent().byId("project");
										var oControl = oProject.byId("selectReport");
										oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
										var index = self.getMasterItemIndex(oLaborItem, aResults);
										self.getRouter().navTo("labor", {
											Day: self._sDay,
											ProjectNo: self._sProjectNo,
											itemNo: index	
										}, true);
										
										MessageToast.show(self.getResourceBundle().getText("filterReset"));
									}
								);
							   } else {
								   self.getRepVersions(self._sProjectNo, self._sDay);
							   }
						},
						// Error handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteError"));
						});
				}
				oItem.setSelected(false);
			});
			
		},
		
		_deleteLaborBonus: function(aSelItems){
			var self = this;
			aSelItems.forEach(function(oItem) {
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				if (self.validateItemDelete(sIntStatus, "M", self, true)) {
					var sPath = oContext.getPath();
					var oLaborBonusItem = oContext.getProperty(sPath);
					var oDfrdDelBonus = self.deleteLaborBonusItem(oLaborBonusItem, self);
					oDfrdDelBonus.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteOk"));
						},
						// Error handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteError"));
						});
				}
				oItem.setSelected(false);
			});
			
		},

		_bindLaborItem: function() {
			var self = this;
			var oModel = self.getModel();
			self.setModel(oModel);
			var oViewModel = self.getModel("LaborDetView");			
			
			// Creating key set for ProjectSet entity
			var sLaborPath = oModel.createKey("/LaborSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});
			
			var oPanel = self.byId("laborHeaderPnl");

			if (oPanel) {
				oPanel.bindElement({
					path: sLaborPath,
					events: {
						change: self._onLaborBindingChange.bind(self),
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						}.bind(self),
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}.bind(self)
					}
				});
			}

			// Select by default icon tab filter General
			var oIcnTb = self.byId("idLaborDetIconTabBar");
			if (oIcnTb)
				oIcnTb.setSelectedKey(self.getResourceBundle().getText("tabGeneral"));		

		},

		_onLaborBindingChange: function() {
			var self = this;
			var oFilter = self.getInScreenFilters();
			self._bindDetailList(oFilter);
			self._bindBonusList();
		},

		_bindDetailList: function(oFilter) {
			var self = this;
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("LaborDetView");
			var oModel = self.getModel();

			// Creating key set for LaborDet entity
			var sLaborDetPath = oModel.createKey("/LaborSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});
			sLaborDetPath += "/LaborToDet";

			var oTable = self.byId("costCodeList");
			var oCustomListItem = self.byId("detListTemplate");

			if (oTable && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oTable.bindItems({
					path: sLaborDetPath,
					template: oItemTemplate,
					filters: aFilters,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
							var oIcnTb = self.byId("icnTabDetails");
							if (oIcnTb)
								oIcnTb.setCount(formatter.getLineCount("costCodeList", self));
							
							if(oTable.getItems().length === 1){
								oTable.getItems()[0].setSelected(true);
								oTable.fireSelectionChange();
							} else{
								self.getView().byId("lockDetBtn").setEnabled(true);
					  			self.getView().byId("editDetBtn").setEnabled(true);
					  			self.getView().byId("delDetBtn").setEnabled(true);
							}
						}
					}
				});
			}
		},

		_bindBonusList: function() {
			var self = this;

			var oViewModel = self.getModel("LaborDetView");
			var oModel = self.getModel();

			// Creating key set for LaborBonus entity
			var sBonusPath = oModel.createKey("/ProjectSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay
			});
			sBonusPath += "/ProjToLaborBonus";

			var oTable = self.byId("bonusList");
			var oCustomListItem = self.byId("bonusListTemplate");
			var oEmpContext = self.byId("laborHeaderPnl").getBindingContext();	
			if (oTable && oCustomListItem && oEmpContext) {
				var oItemTemplate = oCustomListItem.clone();							
				var iEmployeeNo = oEmpContext.getProperty("EmployeeNo");
				var oInScreenModel = self.getModel("InScreenFilters");
				var aStatus = oInScreenModel.getProperty("/Status");

				var oFilters = self.getBonusFilters(iEmployeeNo, aStatus);

				oTable.bindItems({
					path: sBonusPath,
					template: oItemTemplate,
					filters: [oFilters],
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
							var oIcnTb = self.byId("icnTabBonus");
							if (oIcnTb)
								oIcnTb.setCount(formatter.getLineCount("bonusList", self));
						}
					}
				});
				
				
			}
		},
		
		_onLaborDetPatternMatched: function(oEvent) {
				var oRoute = oEvent.getParameter("name");
				if (oRoute === "labordet") {
					var self = this;
					self._sDay = oEvent.getParameter("arguments").Day;
					self._sProjectNo = oEvent.getParameter("arguments").ProjectNo;
					self._sKey = oEvent.getParameter("arguments").Key;
					self._sItemNo = oEvent.getParameter("arguments").itemNo;
                   
                   var oComponent = self.getOwnerComponent();

                   oComponent.oWhenMetadataIsLoaded.then(
                          // Success handler
                          function() {
                                 var oModel = self.getModel();
                                 self.setModel(oModel);
                                 oModel = self.getModel("InScreenFilters");
                                 if (oModel.getProperty("/ProjectSet/Day")) {
                                        oComponent.oDfdProject.done(function() {
                                               var oFilter = self.getInScreenFilters();
                                               self._bindLaborItem();
                                               self._bindDetailList(oFilter);
                                               self._bindBonusList();                                                                  
                                        });
                                 } else {
                                        self.getRouter().navTo("project", {
                                               Day: self._sDay,
                                               ProjectNo: self._sProjectNo
                                        }, true);
                                 }

                          });
             }
		}

	});

});

