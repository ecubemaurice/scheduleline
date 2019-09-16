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
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/m/Text",
		"zwo/ui/wks_rep/model/models",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Sorter"
		
	], function (BaseController, formatter, Fragment, MessageToast, Dialog, Button, Text, models, JSONModel, Sorter) {
		"use strict";

	return BaseController.extend("zwo.ui.wks_rep.controller.equipment.EquipMaster", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			
			// Creating EquipView model used to set page to busy
		    var oViewModel = new JSONModel({
		    	busy : false,
		    	BusyDelay : 0
		    });
		    this.setModel(oViewModel, "EquipView");
		    this.getRouter().getRoute("equipment").attachPatternMatched(this._onEquipMasterPatternMatched, this);
		    		
		},
		
		onFilterMaster: function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			var filters = [new sap.ui.model.Filter("EquipmentNo", sap.ui.model.FilterOperator.Contains, sQuery),
				new sap.ui.model.Filter("EquipmentName", sap.ui.model.FilterOperator.Contains, sQuery)
			];

			// False will apply an OR logic, if you want AND pass true                        
			var oFilter = new sap.ui.model.Filter(filters, false);

			// update list binding
			var oDetailList = this.getView().byId("masterList");
			var oBinding = oDetailList.getBinding("items");
			oBinding.filter(oFilter);
		},
		
		onSearchMaster: function(oEvent) {

		},
		
		onSortMaster: function(oEvent) {
			var oMasterList = this.getView().byId("masterList");
			var oBinding = oMasterList.getBinding("items");
			var aSorter = oBinding.aSorters;
			var oDescending = false;
			if(aSorter && aSorter.length !== 0) {
				oDescending = aSorter[0].bDescending;
			}
			
			var oSorter = new Sorter("EquipmentName", !oDescending);
			oBinding.sort(oSorter);		
		},
		
		onPressFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bItemPressed = oControl.getPressed();
			var sPath = oControl.getBindingContext().getPath();
			var oEquipItem = self.getModel().getProperty(sPath);
			var bFlag = oControl.getBindingContext().getProperty("FlagInt");
			var sIntStatus = oControl.getBindingContext().getProperty("IntStatus");
				
			if (self.validateMasterEdit(sIntStatus, self, true)) {
				// Updating FlagIntUpd to signal a change in FlagInt status
				oEquipItem.FlagIntUpd = true;
				var oDfrdUpd = self.updateEquipItem(oEquipItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {	
						var Ind = self._getItemIndex(oEquipItem);
						self._navToDetItem("masterList", Ind);							
					},
					// Error handler
					function() {
						self.getModel().setProperty(sPath + "/FlagInt", !bFlag);
					});
			}else {
				self.getModel().setProperty(sPath + "/FlagInt", !bFlag);
			}
		},
		
		onPressMasterLock : function(oEvent) {
			var self = this;
			var aSelItems = self.getSelMasterItems("masterList", self);

			aSelItems.forEach(function(item) {
				var oContext = item.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var bFlag = oContext.getProperty("FlagInt");
				var sPath = oContext.getPath();
				var oEquip = oContext.getProperty(sPath);
				var bLocked = false;
				var oChkBox = item.getContent()[0].getItems()[0].getItems()[0];
				
				if (self.validateMasterEdit(sIntStatus, self, true)) {
					var oStatusModel = self.getModel("statusList");
					var iIntLocked1 = oStatusModel.getProperty("/4/index");
					var iIntLocked2 = "7";
					var iNotInt1 = oStatusModel.getProperty("/0/index");
					var iNotInt2 = "1";
					var iIntError = oStatusModel.getProperty("/2/index");

					switch (sIntStatus) {
						case (iNotInt1): // Lock item and Integration status is Not Modified
							oEquip.IntStatus = iIntLocked1;
							oEquip.FlagLocked = true;
							oEquip.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oEquip.IntStatus = iIntLocked1;
							oEquip.FlagLocked = true;
							oEquip.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oEquip.IntStatus = iIntLocked2;
							oEquip.FlagLocked = true;
							oEquip.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oEquip.IntStatus = "";
							oEquip.FlagInt = false;
							oEquip.FlagLocked = true;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oEquip.IntStatus = "";
							oEquip.FlagInt = false;
							oEquip.FlagLocked = true;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateEquipItem(oEquip, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							var Ind = self._getItemIndex(oEquip);
							self._navToDetItem("masterList", Ind);
						},
						// Error handler
						function() {
							oEquip.IntStatus = sIntStatus;
							oEquip.FlagInt = bFlag;
					});
				}
				if(oChkBox)
				oChkBox.setSelected(false);
			});
			self.getView().byId("copyMBtn").setEnabled(true);
			self.getView().byId("deleteMBtn").setEnabled(true);
		},	
		
		onPressMasterItem: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sDay = formatter.formatODataDate(oContext.getProperty("Day"));
			var iProjectNo = oContext.getProperty("ProjectNo");
			var sKey = oContext.getProperty("Key");
			
			var oEquipmt = oContext.getProperty(oContext.getPath());
			var sItemNo = self._getItemIndex(oEquipmt);
			
			self.getRouter().navTo("equipmentdet", {
				Day: sDay,
				ProjectNo: iProjectNo,
				Key: sKey,
				itemNo: sItemNo
			}, true);
		},
				
		// Add Equipment Dialog
		onPressMasterAdd: function(oEvent) {
			var self = this;
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("addEquip"),
				mode: "add"
			});
			
			var sFuelFlag;
			
			var oUser = this.getModel("user");
			var oCountry = self.getModel("InScreenFilters").getProperty("/ProjectSet/Country");
			
			//Determine whether Fuel Flag must be selected or not depending on the project country
			switch (oCountry) {
	            case "QC":
		           sFuelFlag = "";
		            break;
	            
	            default:
	            	sFuelFlag = "X";
		            break;
            }
			
			var oModel = new JSONModel({
				Day: "",
				ProjectNo: "",
				Key: "",
				FlagLocked: false,
				FlagInt: false,	
				FlagIntUpd: false,
				FlagGang: false,
				EquipmentNo : "",
				EquipmentName : "",
				Mu: "",
				MuName: "",
				ActivityType: "",
				FuelFlag: sFuelFlag,				
				Price: "0.00",
				TotCost: "0.00",
				TotQtyOperated: "0.00",
				Unit: "",
				TotQtyNonOperated: "0.00",
				Status: "",
				Currency: "",
				IntStatus: "",
				Origin: "M",
				ForemanNo: oUser.getProperty("/PersonID"), 
				Version: "00",
				CostCode: ""
			});
			
			oModel.setDefaultBindingMode("TwoWay");

			// Opening MasterAdd Dialog 
			var oControl = oEvent.getSource();
			this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
				"zwo.ui.wks_rep.view.equipment.fragment.equipMasterAdd",
				oControl);
			this._oMasterAddDialog.setModel(oViewModel, "Form");
			this._oMasterAddDialog.setModel(oModel, "Input");

		},
		
		onPressEquipSave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oFuelChkBox = self.byId("idFuelIncluded");
			var oInput =  self._oMasterAddDialog.getModel("Input").getData();
			var oEquip = oInput;
			oEquip.Day = self._sDay;
			oEquip.ProjectNo = self._sProjectNo;
			if(oFuelChkBox)
				oEquip.FuelFlag = oFuelChkBox.getSelected() ? "X" : "";

			
			// Checking if all mandatory fields are filled
			if (oEquip.EquipmentNo.trim() === "" || oEquip.EquipmentName.trim() === "" || oEquip.ActivityType.trim() === "" ||
					(oEquip.Price.trim() === "" || oEquip.Price === "0.00") || ((oEquip.CostCode.trim() === "") && (oEquip.Status === "" || oEquip.Status === "N" || oEquip.Status === "W"))|| oEquip.ForemanNo === "") {
				if(oEquip.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
			
				var aReports = oInScreenModel.getProperty("/Reports");
				if(aReports.length > 0){
					var found = false;
				   for (var i=0; i<aReports.length; i++){
					   if(aReports[i].ForemanNo === oEquip.ForemanNo &&
							   aReports[i].Version === oEquip.Version &&
							   aReports[i].Origin === oEquip.Origin){
						   found = true;
						   break;
					   }
				   }
				   if(found === false){
					  for(var i = -1; i < aReports.length; i++){
						   aReports.pop();
					  }
					
					var oDfrdAdd = self.addEquipItem(oEquip, self);	
				   } 
			   } else {
					var oDfrdAdd = self.addEquipItem(oEquip, self);
			   }
				
				oDfrdAdd.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("successEquipAdd"));
							// Closing dialog window
							self.handleClose();
							
							if(found === false){
								self.getRepVersions(oEquip.ProjectNo, oEquip.Day);
								var oFilter = self.getInScreenFilters();
								var oDfrd = self._bindMasterList(oFilter);
								var aResults = [];
								var oDfrdMaster = self.getMasterItem(oEquip, aResults);
								oDfrdMaster.then(
									// Success handler
									function() {
										var oTable = self.byId("masterList");
										var iInd = oTable.getItems().length - 1;
										self._navToDetItem("masterList", iInd);
										var oProject = self.getOwnerComponent().byId("project");
										var oControl = oProject.byId("selectReport");
										oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
										MessageToast.show(self.getResourceBundle().getText("filterReset"));
									});
							}else {
								if(found !== true){
									self.getRepVersions(oEquip.ProjectNo, oEquip.Day);
								}
								var oTable = self.byId("masterList");
								if(oTable && self._oDfrdListUpd) {
									self._oDfrdListUpd.then(
										// Success handler
										function() {
											var iInd = oTable.getItems().length - 1;
											self._navToDetItem("masterList", iInd);									
										}
									);
								}else {
									self._navToDetItem("masterList", 0);	
								}
							}
					},
					// Error handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("errorEquipAdd"));
					});
			}
		},
		
		handleClose: function() {
			// Closing Dialog fragment
			if (this._oMasterAddDialog) {
				this._oMasterAddDialog.close();
				this._oMasterAddDialog.destroy(true);
				this._oMasterAddDialog = null;
			}
		},
		
		// Delete equipment			   
		onPressMasterDelete: function(oEvent) {
			var self = this;
			var aSelItems = self.getSelMasterItems("masterList", self);
			
			if (aSelItems.length === 0) {
				MessageToast.show(self.getResourceBundle().getText("errorDelete"));
			} else {
				self._openDeleteDialog(aSelItems);
				self.byId("copyMBtn").setEnabled(true);
				self.byId("lockMBtn").setEnabled(true);
			}
		},
		
		// Copy equipment dialog
		onPressMasterCopy : function(oEvent) {
			var self = this;
			var aSelItems = self.getSelMasterItems("masterList", self);
			if(aSelItems.length > 0){
				aSelItems.forEach(function(oItem) {
					var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];				
					oChkBox.setSelected(false);
								
		            var oResource = self.getResourceBundle();
		            var oViewModel = new JSONModel({
		                title: oResource.getText("addEquip"),
		                mode: "add"
		            });
		            
		            var oUser = self.getModel("user");
		            var oContext = oItem.getBindingContext();
		            var oModel = new JSONModel({
		            	Day: "",
		            	ProjectNo: "",
		            	Key: "",
		            	FlagLocked: false,
		            	FlagInt: false,	
		            	FlagIntUpd: false,
		            	FlagGang: oContext.getProperty("FlagGang"),
		            	EquipmentNo : oContext.getProperty("EquipmentNo"),
		            	EquipmentName : oContext.getProperty("EquipmentName"),
		            	Mu: oContext.getProperty("Mu"),
		            	MuName: oContext.getProperty("MuName"),
		            	ActivityType: oContext.getProperty("ActivityType"),
		            	FuelFlag: oContext.getProperty("FuelFlag"),				
		            	Price: oContext.getProperty("Price"),
		            	TotCost: "0.00",
		            	TotQtyOperated: "0.00",
		            	Unit: "",
		            	TotQtyNonOperated: "0.00",
		            	Status: "",
		            	Currency: "",
		            	IntStatus: "",
		            	Origin: "M",
		            	ForemanNo: oUser.getProperty("/PersonID"), 
						Version: "00",
		            	CostCode: ""
		            });
		
					oModel.setDefaultBindingMode("TwoWay");
		            
		            // Opening EquipMasterAdd Dialog
		            var oControl = oEvent.getSource();
		            self._oMasterAddDialog = self.onOpenDialog(self._oMasterAddDialog,
		                "zwo.ui.wks_rep.view.equipment.fragment.equipMasterAdd",
		                oControl);
		            self._oMasterAddDialog.setModel(oViewModel, "Form");
		            self._oMasterAddDialog.setModel(oModel, "Input");
				});
			}else{
				MessageToast.show(self.getResourceBundle().getText("errorMasterCopy"));
			}			
        },
        
        _openDeleteDialog: function(aSelItems){
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
						self._deleteEquip(aSelItems);
						
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
        
        _deleteEquip: function(aSelItems){
			var self = this;
			
			aSelItems.forEach(function(oItem, itemIndex) {
				var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateMasterDelete(sIntStatus, sOrigin, self, true)) {						
					var sPath = oItem.getBindingContext().getPath();
					var oEquip = oItem.getBindingContext().getModel().getProperty(sPath);
					var oDfrdDelMaster = self.deleteEquipItem(oEquip, self);
					oDfrdDelMaster.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteOk"));
							if(self._oDfrdListUpd) {
								self._oDfrdListUpd.then(
									// Success handler
									function() {										
										self._navToDetItem("masterList", 0);									
									});
							}else {
								self._navToDetItem("masterList", 0);	
							}
						},
						// Error handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteError"));
						});					
				}
				oChkBox.setSelected(false);
			});
		},
        
        _getItemIndex: function(oItem) {
			var self = this;
			var index = 0;
			var oList = self.byId("masterList");
			if(oList) {
				var aEquip = oList.getItems();
				if(aEquip.length !== 0) {
					for(var i = 0; i < aEquip.length; i++) {
						if(oItem.ProjectNo === aEquip[i].getBindingContext().getProperty("ProjectNo") && 
							formatter.formatODataDate(oItem.Day) === formatter.formatODataDate(aEquip[i].getBindingContext().getProperty("Day")) && 
							oItem.Key === aEquip[i].getBindingContext().getProperty("Key")) {
							index = i;
							break;
						}
					}
				}
			}
			
			return index;		
		},
		
		_navToDetItem: function(sList, index) {
			var self = this;
			var oList = self.byId(sList);
			var oListItems = oList.getItems();
			if (index.toString() && oListItems.length > 0) {
				var oContext = oListItems[index].getBindingContext();
				var sDay = formatter.formatODataDate(oContext.getProperty("Day"));
				var iProjectNo = oContext.getProperty("ProjectNo");
				var sKey = oContext.getProperty("Key").replace(/[/]/g, ".");

				self.getRouter().navTo("equipmentdet", {
					Day: sDay,
					ProjectNo: iProjectNo,
					Key: sKey,
					itemNo: index
				}, true);
			} else {
				self.getRouter().navTo("noEquipDet");
			}
		},
		
		_onEquipBindingChange: function() {
			
		},
		
		_bindMasterList: function(oFilter) {
			var self = this;
			var oDeferred = $.Deferred();
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("EquipView");
			var oModel = self.getModel();

			// Creating key set for EquipmentDet entity
			var sEquipPath = oModel.createKey("/ProjectSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay
			});
			sEquipPath += "/ProjToEquipment";

			var oTable = self.byId("masterList");
			var oCustomListItem = self.byId("equipList");

			if (oTable && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oTable.bindItems({
					path: sEquipPath,
					template: oItemTemplate,
					filters: aFilters,
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
		
		_onEquipMasterPatternMatched : function(oEvent) {
			if (oEvent.getParameter("name") === "equipment") {
				this._sDay = oEvent.getParameter("arguments").Day;
				this._sProjectNo = oEvent.getParameter("arguments").ProjectNo;
				this._sItemNo = oEvent.getParameter("arguments").itemNo;
				var self = this;
				var oComponent = self.getOwnerComponent();

				oComponent.oWhenMetadataIsLoaded.then(
					// Success handler
					function() {
						var oModel = self.getModel("InScreenFilters");
						if (oModel.getProperty("/ProjectSet/Day")) {
							oComponent.oDfdProject.done(function() {
								var oFilter = self.getInScreenFilters();	
								// Requesting for list of equipment
								var oDfrdEquip = self._bindMasterList(oFilter);
								
								oDfrdEquip.then(
									// Success handler
									function() {
										// Navigating to selected master item
										self._navToDetItem("masterList", self._sItemNo);								
									});
								
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

	}
);