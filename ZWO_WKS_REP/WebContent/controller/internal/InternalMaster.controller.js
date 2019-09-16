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
		
	], function (BaseController, formatter, Fragment, Sorter, MessageToast, Dialog, Button, Text, models, JSONModel, MaterialSearchHelp) {
		"use strict";
	return BaseController.extend("zwo.ui.wks_rep.controller.internal.InternalMaster", {

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
		    this.setModel(oViewModel, "InternalView");
		    this.getRouter().getRoute("internal").attachPatternMatched(this._onInternalMasterPatternMatched, this);
		    		
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
			
			var oInternal = oContext.getProperty(oContext.getPath());
			var sItemNo = self._getItemIndex(oInternal);
			
			self.getRouter().navTo("internaldet", {
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
			var oInternalItem = self.getModel().getProperty(sPath);
			var bFlag = oControl.getBindingContext().getProperty("FlagInt");
			var sIntStatus = oControl.getBindingContext().getProperty("IntStatus");
				
			if (self.validateMasterEdit(sIntStatus, self, true)) {
				oInternalItem.FlagIntUpd = true;
				var oDfrdUpd = self.updateInternalItem(oInternalItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {						
						var Ind = self._getItemIndex(oInternalItem);
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
				var oInternal = oContext.getProperty(sPath);
				oInternal.Day = formatter.formatODataDate(self._sDay);
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
							oInternal.IntStatus = iIntLocked1;
							oInternal.FlagLocked = true;
							oInternal.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oInternal.IntStatus = iIntLocked1;
							oInternal.FlagLocked = true;
							oInternal.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oInternal.IntStatus = iIntLocked2;
							oInternal.FlagLocked = true;
							oInternal.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oInternal.IntStatus = "";
							oInternal.FlagInt = false;
							oInternal.FlagLocked = true;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oInternal.IntStatus = "";
							oInternal.FlagInt = false;
							oInternal.FlagLocked = true;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateInternalItem(oInternal, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							var Ind = self._getItemIndex(oInternal);
							self._navToDetItem("masterList", Ind);							
						},
						// Error handler
						function() {
							oInternal.IntStatus = sIntStatus;
							oInternal.FlagInt = bFlag;
					});
				}
				oChkBox.setSelected(false);
			});
			self.getView().byId("copyMBtn").setEnabled(true);
			self.getView().byId("deleteMBtn").setEnabled(true);
		},	
		
		// Add Internal Dialog
		onPressMasterAdd: function(oEvent) {
			var self = this;
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("addInternal"),
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
				WbsElement: "",
				Name: "",
				Price: "0.00",
				Currency: "",
				Quantity: "0.00",
				TotCost: "0.00",
				Unit: "",
				CostCode: "",
				IntStatus: "",
				DeliveryNoteNo: "",
				Origin: "M",
				ForemanNo: oUser.getProperty("/PersonID"), // M,
				Version: "00"
			});

			oModel.setDefaultBindingMode("TwoWay");

			// Opening MasterAdd Dialog 
			var oControl = oEvent.getSource();
			this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
				"zwo.ui.wks_rep.view.internal.fragment.internalMasterAdd",
				oControl);
			this._oMasterAddDialog.setModel(oViewModel, "Form");
			this._oMasterAddDialog.setModel(oModel, "Input");

		},
		
		// Copy Internal dialog
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
	                title: oResource.getText("addInternal"),
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
	            	WbsElement: oContext.getProperty("WbsElement"),
	            	Name: oContext.getProperty("Name"),
	            	Price: oContext.getProperty("Price"),
	            	Currency:"",
	            	Quantity: oContext.getProperty("Quantity"),
	            	TotCost: "0.00",
	            	Unit: oContext.getProperty("Unit"),
	            	CostCode: "",
	            	IntStatus: "",
	            	DeliveryNoteNo: "",
	            	Origin: "M",
	            	ForemanNo: oUser.getProperty("/PersonID"), // M,
					Version: "00"
	            });
	
				oModel.setDefaultBindingMode("TwoWay");
	            
	            // Opening MasterAdd Dialog
	            var oControl = oEvent.getSource();
	            this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
	                "zwo.ui.wks_rep.view.internal.fragment.internalMasterAdd",
	                oControl);
	            this._oMasterAddDialog.setModel(oViewModel, "Form");
	            this._oMasterAddDialog.setModel(oModel, "Input");
            
			}else{
				MessageToast.show(this.getResourceBundle().getText("errorMasterCopy"));
			}

        },
        
        onPressInternalSave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oInput = {};
			oInput = self._oMasterAddDialog.getModel("Input").getData();
			var oInternal = oInput;
			oInternal.Day = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			oInternal.ProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");

			// Checking if all mandatory fields are filled
			if (oInternal.MaterialNo.trim() === "" || oInternal.MaterialDesc.trim() === "" || (oInternal.Price.trim() === "" || oInternal.Price === "0.00") || oInternal.CostCode === ""
				|| oInternal.ForemanNo === ""){
				if(oInternal.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
			
				var aReports = oInScreenModel.getProperty("/Reports");
				if(aReports.length > 0){
					var found = false;
				   for (var i=0; i<aReports.length; i++){
					   if(aReports[i].ForemanNo === oInternal.ForemanNo &&
							   aReports[i].Version === oInternal.Version &&
							   aReports[i].Origin === oInternal.Origin){
						   found = true;
						   break;
					   }
				   }
				   if(found === false){
					  for(var i = -1; i < aReports.length; i++){
						   aReports.pop();
					  }
					
					var oDfrdAdd = self.addInternalItem(oInternal, self);	
				   } 
			   } else {
					var oDfrdAdd = self.addInternalItem(oInternal, self);
			   }
				
				oDfrdAdd.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("successInternalAdd"));
							// Closing dialog window
							self.handleClose();
							
							if(found === false){
								self.getRepVersions(oInternal.ProjectNo, oInternal.Day);
								var oFilter = self.getInScreenFilters();
								var oDfrd = self._bindInternalMasterItem(oFilter);
								var aResults = [];
								var oDfrdMaster = self.getMasterItem(oInternal, aResults);
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
									self.getRepVersions(oInternal.ProjectNo, oInternal.Day);
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
						MessageToast.show(self.getResourceBundle().getText("errorInternalAdd"));
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
		
		// Delete Internaltracting			   
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
			var sScreen = "Int";			
			
			var sVendorNo = "";
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
				Screen: "Int"
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
						self._deleteInternal(aSelItems);
						
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
		
		_deleteInternal: function(aSelItems){
			var self = this;
			
			aSelItems.forEach(function(oItem, itemIndex) {
				var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateMasterDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oItem.getBindingContext().getPath();
					var oInternal = oItem.getBindingContext().getModel().getProperty(sPath);
					var oDfrdDelMaster = self.deleteInternalItem(oInternal, self);
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
				var aInternal = oList.getItems();
				if(aInternal.length !== 0) {
					for(var i = 0; i < aInternal.length; i++) {
						if(oItem.ProjectNo === aInternal[i].getBindingContext().getProperty("ProjectNo") && 
							formatter.formatODataDate(oItem.Day) === formatter.formatODataDate(aInternal[i].getBindingContext().getProperty("Day")) && 
							oItem.Key === aInternal[i].getBindingContext().getProperty("Key")){
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
				
				self.getRouter().navTo("internaldet", {
					Day: sDay,
					ProjectNo: iProjectNo,
					itemNo: index,
					Key: sKey
				}, true);
			} else {
				self.getRouter().navTo("noInternalDet");
			}
		},
		
		_bindInternalMasterItem: function(oFilter) {
			var self = this;
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oView = self.getView("InternalView");
			var oViewModel = self.getModel("InternalView");
			var oModel = self.getModel("InScreenFilters");
			var oDeferred = $.Deferred();

			// Creating key set for ProjectSet entity
			var sInternalPath = oView.getModel().createKey("/ProjectSet", {
				ProjectNo: oModel.getProperty("/ProjectSet/ProjectNo"),
				Day: formatter.formatODataDate(oModel.getProperty("/ProjectSet/Day"))
			});
			
			sInternalPath += "/ProjToInternal";
			
			var oList = self.byId("masterList");
			var oCustomListItem = self.byId("internalList");

			if (oList && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oList.bindItems({
					path: sInternalPath,
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
		
		_onInternalMasterPatternMatched : function(oEvent) {
			
			if(oEvent.getParameter("name") === "internal") {
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
									var oDfrdInternal = self._bindInternalMasterItem(oFilter);
									oDfrdInternal.then(
										//Success handler
										function() {
											self._navToDetItem("masterList", self._sItemNo);
										});
								});
							}else {
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