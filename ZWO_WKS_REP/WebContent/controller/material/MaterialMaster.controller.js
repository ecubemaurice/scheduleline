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

	return BaseController.extend("zwo.ui.wks_rep.controller.material.MaterialMaster", {

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
		    this.setModel(oViewModel, "MaterialView");
		    this.getRouter().getRoute("material").attachPatternMatched(this._onMaterialMasterPatternMatched, this);
		    		
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
			
			var oMaterial = oContext.getProperty(oContext.getPath());
			var sItemNo = self._getItemIndex(oMaterial);

			self.getRouter().navTo("materialdet", {
				Day: sDay,
				ProjectNo: iProjectNo,
				itemNo: sItemNo,
				Key: sKey
			}, true);
		},
		
		onPressFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bItemPressed = oControl.getPressed();
			var sPath = oControl.getBindingContext().getPath();
			var oMaterialItem = self.getModel().getProperty(sPath);
			oMaterialItem.Day = formatter.formatODataDate(self._sDay);
			var bFlag = oControl.getBindingContext().getProperty("FlagInt");
			var sIntStatus = oControl.getBindingContext().getProperty("IntStatus");
				
			if (self.validateMasterEdit(sIntStatus, self, true)) {
				oMaterialItem.FlagIntUpd = true;
				var oDfrdUpd = self.updateMaterialItem(oMaterialItem, self);
				oDfrdUpd.then(
						// Success handler
						function() {	
							var Ind = self._getItemIndex(oMaterialItem);
							self._navToDetItem("masterList", Ind);							
						},
						// Error handler
						function() {
							self.getModel().setProperty(sPath + "/FlagInt", !bFlag);
						});
			} else {
				oControl.setPressed(!bItemPressed);
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
				var oMaterial = oContext.getProperty(sPath);
				oMaterial.Day = formatter.formatODataDate(self._sDay);
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
							oMaterial.IntStatus = iIntLocked1;
							oMaterial.FlagLocked = true;
							oMaterial.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oMaterial.IntStatus = iIntLocked1;
							oMaterial.FlagLocked = true;
							oMaterial.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oMaterial.IntStatus = iIntLocked2;
							oMaterial.FlagLocked = true;
							oMaterial.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oMaterial.IntStatus = "";
							oMaterial.FlagInt = false;
							oMaterial.FlagLocked = true;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oMaterial.IntStatus = "";
							oMaterial.FlagInt = false;
							oMaterial.FlagLocked = true;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateMaterialItem(oMaterial, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							var Ind = self._getItemIndex(oMaterial);
							self._navToDetItem("masterList", Ind);						
						},
						// Error handler
						function() {
							oMaterial.IntStatus = sIntStatus;
							oMaterial.FlagInt = bFlag;
					});
				}
				oChkBox.setSelected(false);
			});
			self.getView().byId("copyMBtn").setEnabled(true);
			self.getView().byId("deleteMBtn").setEnabled(true);
		},	
				
		// Add Material Dialog
		onPressMasterAdd: function(oEvent) {
			var self = this;
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("addMaterial"),
				mode: "add"
			});
			
			var oUser = this.getModel("user");
			var oModel = new JSONModel({
				ProjectNo: "",
				Day: "",	
				Key: "",
				FlagLocked: false,
				FlagInt: false,
				FlagIntUpd: false,
				MaterialNo: "",
				MaterialDesc: "",
				SupplierNo: "",
				SupplierName: "",
				PurchaseDoc: "",
				Item: "",
				Price: "0.00",
				Currency: "",
				Quantity: "0.00",
				TotCost: "0.00",
				Unit: "",
				VendorMatNo: "",
				Agreement: "",
				AgreementItem: "",
				CostCode: "",
				IntStatus: "",
				DeliveryNoteNo: "",
				Origin: "M",
				ForemanNo: oUser.getProperty("/PersonID"), 
				Version: "00"
			});

			oModel.setDefaultBindingMode("TwoWay");

			// Opening MasterAdd Dialog 
			var oControl = oEvent.getSource();
			this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
				"zwo.ui.wks_rep.view.material.fragment.MaterialMasterAdd",
				oControl);
			this._oMasterAddDialog.setModel(oViewModel, "Form");
			this._oMasterAddDialog.setModel(oModel, "Input");

		},
		
		// Copy Material dialog
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
	                title: oResource.getText("addMaterial"),
	                mode: "add"
	            });
	            
	            var oUser = this.getModel("user");
	            var oContext = oItem.getBindingContext();
	        	var oModel = new JSONModel({
	            	ProjectNo: "",
	        		Day: "",
	            	Key: "",
					FlagLocked: false,
					FlagInt: false,
	            	FlagIntUpd: false,
					MaterialNo: oContext.getProperty("MaterialNo"),
					MaterialDesc: oContext.getProperty("MaterialDesc"),
					SupplierNo: oContext.getProperty("SupplierNo"),
					SupplierName: oContext.getProperty("SupplierName"),
					PurchaseDoc: oContext.getProperty("PurchaseDoc"),
					Item: oContext.getProperty("Item"),
					Price: oContext.getProperty("Price"),
					Currency: "",
	            	Quantity: oContext.getProperty("Quantity"),
	            	TotCost: "0.00",
					Unit: "",
					VendorMatNo: oContext.getProperty("VendorMatNo"),
					Agreement: oContext.getProperty("Agreement"),
					AgreementItem: oContext.getProperty("AgreementItem"),
					CostCode: "",
					IntStatus: "",
					DeliveryNoteNo: "",
					Origin: "M",
					ForemanNo: oUser.getProperty("/PersonID"), 
					Version: "00"
				});
	
				oModel.setDefaultBindingMode("TwoWay");
	            
	            // Opening MasterAdd Dialog
	            var oControl = oEvent.getSource();
	            this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
	                "zwo.ui.wks_rep.view.material.fragment.MaterialMasterAdd",
	                oControl);
	            this._oMasterAddDialog.setModel(oViewModel, "Form");
	            this._oMasterAddDialog.setModel(oModel, "Input");
            
			}else{
				MessageToast.show(this.getResourceBundle().getText("errorMasterCopy"));
			}

        },
        
        onPressMaterialSave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			//var oFuelChkBox = self.byId("idFuelIncluded");
			var oInput = {};
			oInput = self._oMasterAddDialog.getModel("Input").getData();
			var oMaterial = oInput;
			oMaterial.Day = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			oMaterial.ProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");

			// Checking if all mandatory fields are filled
			if (oMaterial.MaterialNo.trim() === "" || oMaterial.MaterialDesc.trim() === "" || oMaterial.SupplierNo.trim() === "" || oMaterial.SupplierName.trim() === "" ||
					(oMaterial.Price.trim() === "" || oMaterial.Price === "0.00") || oMaterial.CostCode === "" || oMaterial.ForemanNo === "") {
				if(oMaterial.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
			
				var aReports = oInScreenModel.getProperty("/Reports");
				if(aReports.length > 0){
					var found = false;
				   for (var i=0; i<aReports.length; i++){
					   if(aReports[i].ForemanNo === oMaterial.ForemanNo &&
							   aReports[i].Version === oMaterial.Version &&
							   aReports[i].Origin === oMaterial.Origin){
						   found = true;
						   break;
					   }
				   }
				   if(found === false){
					  for(var i = -1; i < aReports.length; i++){
						   aReports.pop();
					  }
					
					var oDfrdAdd = self.addMaterialItem(oMaterial, self);	
				   } 
			   } else {
					var oDfrdAdd = self.addMaterialItem(oMaterial, self);
			   }
				
				oDfrdAdd.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("successMaterialAdd"));
							// Closing dialog window
							self.handleClose();
							
							if(found === false){
								self.getRepVersions(oMaterial.ProjectNo, oMaterial.Day);
								var oFilter = self.getInScreenFilters();
								var oDfrd = self._bindMaterialMasterItem(oFilter);
								var aResults = [];
								var oDfrdMaster = self.getMasterItem(oMaterial, aResults);
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
									self.getRepVersions(oMaterial.ProjectNo, oMaterial.Day);
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
						MessageToast.show(self.getResourceBundle().getText("errorMaterialAdd"));
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
		
		// Delete material		   
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
			var sScreen = "Mat";			
			
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
				Screen: "Mat"
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
						self._deleteMaterial(aSelItems);
						
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
		
		_deleteMaterial: function(aSelItems){
			var self = this;
			
			aSelItems.forEach(function(oItem, itemIndex) {
				var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateMasterDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oItem.getBindingContext().getPath();
					var oMaterial = oItem.getBindingContext().getModel().getProperty(sPath);
					var oDfrdDelMaster = self.deleteMaterialItem(oMaterial, self);
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
				var aMaterial = oList.getItems();
				if(aMaterial.length !== 0) {
					for(var i = 0; i < aMaterial.length; i++) {
						if(oItem.ProjectNo === aMaterial[i].getBindingContext().getProperty("ProjectNo") && 
							formatter.formatODataDate(oItem.Day) === formatter.formatODataDate(aMaterial[i].getBindingContext().getProperty("Day")) &&
							oItem.Key === aMaterial[i].getBindingContext().getProperty("Key")) {
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
				var sKey = oContext.getProperty("Key");

				self.getRouter().navTo("materialdet", {
					Day: sDay,
					ProjectNo: iProjectNo,
					itemNo: index,
					Key: sKey
				}, true);
			} else {
				self.getRouter().navTo("noMaterialDet");
			}
		},
		
		_bindMaterialMasterItem: function(oFilter) {
			var self = this;
			var oDeferred = $.Deferred();
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("MaterialView");
			var oModel = self.getModel();
			
			// Creating key set for ProjectSet entity
			var sMaterialPath = oModel.createKey("/ProjectSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay
			});
			
			sMaterialPath += "/ProjToMaterial";
			
			var oList = self.byId("masterList");
			var oCustomListItem = self.byId("materialList");

			if (oList && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oList.bindItems({
					path: sMaterialPath,
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
		
		_onMaterialMasterPatternMatched : function(oEvent) {
			
			if(oEvent.getParameter("name") === "material") {
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
									var oDfrdMaterial = self._bindMaterialMasterItem(oFilter);
									oDfrdMaterial.then(
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