/*global location */
sap.ui.define([
		"zwo/ui/wks_rep/controller/BaseController",
		"zwo/ui/wks_rep/model/formatter",
		"sap/ui/core/Fragment",
		"sap/ui/model/Sorter",
		"sap/m/MessageToast",
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/m/Text",
		"zwo/ui/wks_rep/model/models",
		"sap/ui/model/json/JSONModel",
		"zwo/ui/wks_rep/utils/MaterialSearchHelp"
		
		], function (BaseController, formatter, Fragment, Sorter, MessageToast, Dialog, Button, Text, models, JSONModel,MaterialSearchHelp) {
		"use strict";

	return BaseController.extend("zwo.ui.wks_rep.controller.rental.RentalMaster", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			
			// Creating DashboardView model used to set page to busy
		    var oViewModel = new JSONModel({
		    	busy : false,
		    	BusyDelay : 0
		    });
		    this.setModel(oViewModel, "RentalView");
		    this.getRouter().getRoute("rental").attachPatternMatched(this._onRentalMasterPatternMatched, this);
		    		
		},
		
		onFilterMaster: function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			var filters = [new sap.ui.model.Filter("MaterialNo", sap.ui.model.FilterOperator.Contains, sQuery),
				new sap.ui.model.Filter("MaterialDesc", sap.ui.model.FilterOperator.Contains, sQuery)
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
			
			var oSorter = new Sorter("MaterialDesc", !oDescending);
			oBinding.sort(oSorter);		
		},
			
		onPressMasterItem: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sDay = formatter.formatODataDate(oContext.getProperty("Day"));
			var iProjectNo = oContext.getProperty("ProjectNo");
			var sKey = oContext.getProperty("Key");
			
			var oRental = oContext.getProperty(oContext.getPath());
			var sItemNo = self._getItemIndex(oRental);

			self.getRouter().navTo("rentaldet", {
				Day: sDay,
				ProjectNo: iProjectNo,
				Key: sKey,
				itemNo: sItemNo
			}, true);
		},
		
		onPressFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bItemPressed = oControl.getPressed();
			var sPath = oControl.getBindingContext().getPath();
			var oRentalItem = self.getModel().getProperty(sPath);
			var bFlag = oControl.getBindingContext().getProperty("FlagInt");
			var sIntStatus = oControl.getBindingContext().getProperty("IntStatus");
				
			if (self.validateMasterEdit(sIntStatus, self, true)) {
				oRentalItem.FlagIntUpd = true;
				var oDfrdUpd = self.updateRentalItem(oRentalItem, self);
				oDfrdUpd.then(
						// Success handler
						function() {	
							var Ind = self._getItemIndex(oRentalItem);
							self._navToDetItem("masterList", Ind);							
						},
						// Error handler
						function() {
							self.getModel().setProperty(sPath + "/FlagInt", !bFlag);
						});
			} else {
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
				var oRental = oContext.getProperty(sPath);
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
							oRental.IntStatus = iIntLocked1;
							oRental.FlagLocked = true;
							oRental.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oRental.IntStatus = iIntLocked1;
							oRental.FlagLocked = true;
							oRental.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oRental.IntStatus = iIntLocked2;
							oRental.FlagLocked = true;
							oRental.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oRental.IntStatus = "";
							oRental.FlagInt = false;
							oRental.FlagLocked = true;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oRental.IntStatus = "";
							oRental.FlagInt = false;
							oRental.FlagLocked = true;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateRentalItem(oRental, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							var Ind = self._getItemIndex(oRental);
							self._navToDetItem("masterList", Ind);						
						},
						// Error handler
						function() {
							oRental.IntStatus = sIntStatus;
							oRental.FlagInt = bFlag;
					});
				}
				oChkBox.setSelected(false);
			});
			self.getView().byId("copyMBtn").setEnabled(true);
			self.getView().byId("deleteMBtn").setEnabled(true);
		},	
				
		// Add Rental Dialog
		onPressMasterAdd: function(oEvent) {
			var self = this;
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("addRental"),
				mode: "add"
			});
			
			var oUser = this.getModel("user");
			var oModel = new JSONModel({
				Day: "",
				ProjectNo: "",
				Key: "",
				FlagLocked: false,
				FlagInt: false,
				MaterialNo: "",
				MaterialDesc: "",
				SupplierNo: "",
				SupplierName: "",
				PurchaseDoc: "",
				Item: "",
				Price: "0.00",
				Currency: "",
				FuelFlag: "",
				TotQtyOperated: "0.000",
				Unit: "",
				TotQtyNonOperated: "0.000",
				VendorMatNo: "",
				Agreement: "",
				AgreementItem: "",
				CostCode: "",
				EquipmentStat: "",
				DeliveryNoteNo: "",
				IntStatus: "",
				Origin: "M",
				ForemanNo: oUser.getProperty("/PersonID"), // M,,
				Version: "00"
			});

			oModel.setDefaultBindingMode("TwoWay");

			// Opening MasterAdd Dialog 
			var oControl = oEvent.getSource();
			this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
				"zwo.ui.wks_rep.view.rental.fragment.rentalMasterAdd",
				oControl);
			this._oMasterAddDialog.setModel(oViewModel, "Form");
			this._oMasterAddDialog.setModel(oModel, "Input");

		},
		
		// Copy Rental dialog
		onPressMasterCopy : function(oEvent) {
			var self = this;
			var aSelItems = self.getSelMasterItems("masterList", self);
			if(aSelItems.length > 0){
				var itemIndex = "";
				var oItem = {};
				aSelItems.forEach(function(item, index) {
					oItem = item;
					itemIndex = index;
					var oChkBox = item.getContent()[0].getItems()[0].getItems()[0];				
					oChkBox.setSelected(false);
				});
				
	            var oResource = this.getResourceBundle();
	            var oViewModel = new JSONModel({
	                title: oResource.getText("addRental"),
	                mode: "add"
	            });
	            
	            var oUser = this.getModel("user");
	            var oContext = oItem.getBindingContext();
	        	var oModel = new JSONModel({
	        		Day: "",
					ProjectNo: "",
					Key: "",
					FlagLocked: false,
					FlagInt: false,
					MaterialNo: oContext.getProperty("MaterialNo"),
					MaterialDesc: oContext.getProperty("MaterialDesc"),
					SupplierNo: oContext.getProperty("SupplierNo"),
					SupplierName: oContext.getProperty("SupplierName"),
					PurchaseDoc: oContext.getProperty("PurchaseDoc"),
					Item: oContext.getProperty("Item"),
					Price: oContext.getProperty("Price"),
					Currency: "",
					FuelFlag: oContext.getProperty("FuelFlag"),
					TotQtyOperated: "0.00",
					Unit: "",
					TotQtyNonOperated: "0.00",
					VendorMatNo: oContext.getProperty("VendorMatNo"),
					Agreement: oContext.getProperty("Agreement"),
					AgreementItem: oContext.getProperty("AgreementItem"),
					CostCode: "",
					IntStatus: "",
					EquipmentStat: "",
					DeliveryNoteNo: "",
					Origin: "M",
					ForemanNo: oUser.getProperty("/PersonID"), 
					Version: "00",
				});
	
				oModel.setDefaultBindingMode("TwoWay");
	            
	            // Opening MasterAdd Dialog
	            var oControl = oEvent.getSource();
	            this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
	                "zwo.ui.wks_rep.view.rental.fragment.rentalMasterAdd",
	                oControl);
	            this._oMasterAddDialog.setModel(oViewModel, "Form");
	            this._oMasterAddDialog.setModel(oModel, "Input");
            
			}else{
				MessageToast.show(this.getResourceBundle().getText("errorMasterCopy"));
			}

        },
        
        onPressRentalSave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oFuelChkBox = self.byId("idFuelIncluded");
			var oInput = {};
			oInput = self._oMasterAddDialog.getModel("Input").getData();
			var oRental = oInput;
			oRental.Day = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			oRental.ProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
			
			if(oFuelChkBox)
				oRental.FuelFlag = oFuelChkBox.getSelected() ? "X" : "";
			

			// Checking if all mandatory fields are filled
			if (oRental.MaterialNo.trim() === "" || oRental.MaterialDesc.trim() === "" || oRental.SupplierNo.trim() === "" || oRental.SupplierName.trim() === "" ||
				(oRental.Price.trim() === "" || oRental.Price === "0.00") || 
				((oRental.CostCode.trim() === "") && (oRental.EquipmentStat === "" || oRental.EquipmentStat === "N" || oRental.EquipmentStat === "W")) || oRental.ForemanNo === "") {
				
				if(oRental.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			}  else {
			
				var aReports = oInScreenModel.getProperty("/Reports");
				if(aReports.length > 0){
					var found = false;
				   for (var i=0; i<aReports.length; i++){
					   if(aReports[i].ForemanNo === oRental.ForemanNo &&
							   aReports[i].Version === oRental.Version &&
							   aReports[i].Origin === oRental.Origin){
						   found = true;
						   break;
					   }
				   }
				   if(found === false){
					  for(var i = -1; i < aReports.length; i++){
						   aReports.pop();
					  }
					
					var oDfrdAdd = self.addRentalItem(oRental, self);	
				   } 
			   } else {
					var oDfrdAdd = self.addRentalItem(oRental, self);
			   }
				
				oDfrdAdd.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("successRentalAdd"));
							// Closing dialog window
							self.handleClose();
							
							if(found === false){
								self.getRepVersions(oRental.ProjectNo, oRental.Day);
								var oFilter = self.getInScreenFilters();
								var oDfrd = self._bindRentalMasterItem(oFilter);
								var aResults = [];
								var oDfrdMaster = self.getMasterItem(oRental, aResults);
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
									self.getRepVersions(oRental.ProjectNo, oRental.Day);
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
						MessageToast.show(self.getResourceBundle().getText("errorRentalAdd"));
					});
			}
			
			self.byId("deleteMBtn").setEnabled(true);
			self.byId("lockMBtn").setEnabled(true);
		},
		
		handleClose: function() {
			// Closing Dialog fragment
			this._oMasterAddDialog.close();
			this._oMasterAddDialog.destroy(true);
			this._oMasterAddDialog = null;
			
			this.byId("deleteMBtn").setEnabled(true);
			this.byId("lockMBtn").setEnabled(true);
		},
		
		// Delete labor			   
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
		
		onRequestMaterialSpec: function(oEvent) {
			var self = this;
			var oInMatNo = oEvent.getSource();
			var sScreen = "Ren";	
						
			var oInputSupNo = self.byId("idSupplierNo");
			var sVendorNo = "";
			if(oInputSupNo)
				sVendorNo = oInputSupNo.getValue();
			
			self._oMaterialSpecSH = MaterialSearchHelp.initSearchMaterialSpec(sVendorNo, sScreen, self);
			if (self._oMaterialSpecSH) {			
				self._oMaterialSpecSH.open();
			}
		},
		
		onSubmitMaterialNo: function(oEvent) {
			var self = this;
			var oInput = oEvent.getSource();
			var sMatNo = oInput.getValue();
			var sMatDesc = self.byId("idMaterialDesc").getValue();

			var oInScreenModel = self.getModel("InScreenFilters");
			var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");

			var oMat = {
				ProjectNo: sProjectNo,
				MaterialNo: sMatNo,
				Screen: "Ren"
			};

			if ((sProjectNo && sMatNo && sMatNo.trim() !== "") && sMatDesc === "") {
				var aMatSet = [];
				var oDfrd = self.getFillMaterialSet(oMat, self, aMatSet);
				oDfrd.then(
					// Success handler
					function() {
						// Setting values of corresponding input fields on screen with results
						var oItem = this._oMasterAddDialog.getModel("Input").getData();											
						oItem.MaterialDesc = aMatSet[0].MaterialDesc;
						oItem.Unit = aMatSet[0].Unit;
						this._oMasterAddDialog.getModel("Input").setData(oItem);
					}.bind(self));
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
						self._deleteRental(aSelItems);
						
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
		
		_deleteRental: function(aSelItems){
			var self = this;
			
			aSelItems.forEach(function(oItem, itemIndex) {
				var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateMasterDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oItem.getBindingContext().getPath();
					var oRental = oItem.getBindingContext().getModel().getProperty(sPath);
					var oDfrdDelMaster = self.deleteRentalItem(oRental, self);
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
				var aRental = oList.getItems();
				if(aRental.length !== 0) {
					for(var i = 0; i < aRental.length; i++) {
						if(oItem.ProjectNo === aRental[i].getBindingContext().getProperty("ProjectNo") && 
							formatter.formatODataDate(oItem.Day) === formatter.formatODataDate(aRental[i].getBindingContext().getProperty("Day")) && 
							oItem.Key === aRental[i].getBindingContext().getProperty("Key")){
							index = i;
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

				self.getRouter().navTo("rentaldet", {
					Day: sDay,
					ProjectNo: iProjectNo,
					Key: sKey,
					itemNo: index
				}, true);
			} else {
				self.getRouter().navTo("noRentalDet");
			}
		},
		
		_bindRentalMasterItem: function(oFilter) {
			var self = this;
			var oDeferred = $.Deferred();
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("RentalView");
			var oModel = self.getModel();
			
			// Creating key set for ProjectSet entity
			var sRentalPath = oModel.createKey("/ProjectSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay
			});
			
			sRentalPath += "/ProjToRental";
			
			var oList = self.byId("masterList");
			var oCustomListItem = self.byId("rentalList");

			if (oList && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oList.bindItems({
					path: sRentalPath,
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
		
		_onRentalMasterPatternMatched : function(oEvent) {
			
			if(oEvent.getParameter("name") === "rental") {
				this._sDay = oEvent.getParameter("arguments").Day;
				this._sProjectNo = oEvent.getParameter("arguments").ProjectNo;
				this._sItemNo = oEvent.getParameter("arguments").itemNo;
				var self = this;
				var oComponent = self.getOwnerComponent();
				
				oComponent.oWhenMetadataIsLoaded.then(
						// Success handler
						function(){
							var oModel = self.getModel("InScreenFilters");
							if(oModel.getProperty("/ProjectSet/Day")){
								oComponent.oDfdProject.done(function(){
									var oFilter = self.getInScreenFilters();
									var oDfrdRental = self._bindRentalMasterItem(oFilter);
									oDfrdRental.then(
										//Success handler
										function() {
											self._navToDetItem("masterList", self._sItemNo);
										});
								});
							}else {
								self.getRouter().navTo("project", {
									Day : self._sDay,
									ProjectNo : self._sProjectNo
								}, true);
							}
						});
			}
		}
		
		});

	}
);