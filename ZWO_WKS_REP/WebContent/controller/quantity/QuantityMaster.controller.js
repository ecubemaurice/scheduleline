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
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/comp/filterbar/FilterBar"

], function(BaseController, formatter, Fragment, MessageToast, models, JSONModel,
	Filter, FilterOperator, Sorter, Dialog, Button, Text, ValueHelpDialog, FilterBar) {
	"use strict";

	return BaseController.extend("zwo.ui.wks_rep.controller.quantity.QuantityMaster", {

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
			this.setModel(oViewModel, "QuantityView");

			this.getRouter().getRoute("quantity").attachPatternMatched(this._onQuantityPatternMatched, this);

		},

		onFilterMaster: function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			var filters = [new sap.ui.model.Filter("CostCode", sap.ui.model.FilterOperator.Contains, sQuery),
				new sap.ui.model.Filter("CostCodeDes", sap.ui.model.FilterOperator.Contains, sQuery)
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
			
			var oSorter = new Sorter("CostCodeDes", !oDescending);
			oBinding.sort(oSorter);		
		},
		
		onPressMasterItem: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sDay = formatter.formatODataDate(oContext.getProperty("Day"));
			var iProjectNo = oContext.getProperty("ProjectNo");
			var sKey = oContext.getProperty("Key");

			var oQuantity = oContext.getProperty(oContext.getPath());
			var sItemNo = self._getItemIndex(oQuantity);
			
			self.getRouter().navTo("quantitydet", {
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
			var oQuantityItem = self.getModel().getProperty(sPath);
			var bFlag = oControl.getBindingContext().getProperty("FlagInt");
			var sIntStatus = oControl.getBindingContext().getProperty("IntStatus");
				
			if (self.validateMasterEdit(sIntStatus, self, true)) {
				// Updating FlagIntUpd to signal a change in FlagInt status
				oQuantityItem.FlagIntUpd = true;
				var oDfrdUpd = self.updateQuantityItem(oQuantityItem, self);
				oDfrdUpd.then(
						// Success handler
						function() {	
							var Ind = self._getItemIndex(oQuantityItem);
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
				var oQuantity = oContext.getProperty(sPath);
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
							oQuantity.IntStatus = iIntLocked1;
							oQuantity.FlagLocked = true;
							oQuantity.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oQuantity.IntStatus = iIntLocked1;
							oQuantity.FlagLocked = true;
							oQuantity.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oQuantity.IntStatus = iIntLocked2;
							oQuantity.FlagLocked = true;
							oQuantity.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oQuantity.IntStatus = "";
							oQuantity.FlagInt = false;
							oQuantity.FlagLocked = true;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oQuantity.IntStatus = "";
							oQuantity.FlagInt = false;
							oQuantity.FlagLocked = true;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateQuantityItem(oQuantity, self);
					oDfrdUpd.then(
							// Success handler
							function() {
								var Ind = self._getItemIndex(oQuantity);
								self._navToDetItem("masterList", Ind);						
							},
							// Error handler
							function() {
								oQuantity.IntStatus = sIntStatus;
								oQuantity.FlagInt = bFlag;
						});
				}						
				//if(oChkBox)
				oChkBox.setSelected(false);
			});
			self.getView().byId("copyMBtn").setEnabled(true);
			self.getView().byId("deleteMBtn").setEnabled(true);
		},	
	
		// Add Quantity Dialog
		onPressMasterAdd: function(oEvent) {
			var self = this;
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("addQuantity"),
				mode: "add",
				busy: false,
				BusyDelay: 0
			});
			
			var oUser = this.getModel("user");
			var oModel = new JSONModel({
				ProjectNo: "",
				Day: "",
				Key: "",
				FlagLocked: false,
				FlagInt: false,
				FlagIntUpd: false,
				IntStatus: "",
				CostCode: "",
				CostCodeDes: "",
				TotQuantity: "0.00",
				Unit:"",
				Origin: "M",
				ForemanNo: oUser.getProperty("/PersonID"), 
				Version: "00"	
			});
			oModel.setDefaultBindingMode("TwoWay");

			// Opening MasterAdd Dialog 
			var oControl = oEvent.getSource();
			this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
				"zwo.ui.wks_rep.view.quantity.fragment.QuantityMasterAdd",
				oControl);
			this._oMasterAddDialog.setModel(oViewModel, "Form");
			this._oMasterAddDialog.setModel(oModel, "Input");

		},

		onPressQuantitySave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oInput = {};
			oInput = self._oMasterAddDialog.getModel("Input").getData();
			var oQuantity = oInput;
			oQuantity.Day = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			oQuantity.ProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
			
			// Checking if all mandatory fields are filled
			if (oQuantity.CostCode === "" || oQuantity.ForemanNo === "") {
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
			
				var aReports = oInScreenModel.getProperty("/Reports");
				if(aReports.length > 0){
					var found = false;
				   for (var i=0; i<aReports.length; i++){
					   if(aReports[i].ForemanNo === oQuantity.ForemanNo &&
							   aReports[i].Version === oQuantity.Version &&
							   aReports[i].Origin === oQuantity.Origin){
						   found = true;
						   break;
					   }
				   }
				   if(found === false){
					  for(var i = -1; i < aReports.length; i++){
						   aReports.pop();
					  }
					
					var oDfrdAdd = self.addQuantityItem(oQuantity, self);	
				   } 
			   } else {
					var oDfrdAdd = self.addQuantityItem(oQuantity, self);
			   }
				
					oDfrdAdd.then(
							// Success handler
							function() {
								MessageToast.show(self.getResourceBundle().getText("successQuantityAdd"));
								// Closing dialog window
								self.handleClose();
								
								if(found === false){
									self.getRepVersions(oQuantity.ProjectNo, oQuantity.Day);
									var oFilter = self.getInScreenFilters();
									var oDfrd = self._bindQuantityMasterListItem(oFilter);
									var aResults = [];
									var oDfrdMaster = self.getMasterItem(oQuantity, aResults);
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
										self.getRepVersions(oQuantity.ProjectNo, oQuantity.Day);
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
							MessageToast.show(self.getResourceBundle().getText("errorQuantityAdd"));
						});
			}
		},
		
		// Copy quantity dialog
		onPressMasterCopy : function(oEvent) {
			var self = this;
			var aSelItems = self.getSelMasterItems("masterList", self);
			if(aSelItems.length > 0){
				aSelItems.forEach(function(oItem, itemIndex) {
					var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];				
					oChkBox.setSelected(false);
								
		            var oResource = this.getResourceBundle();
		            var oViewModel = new JSONModel({
		                title: oResource.getText("addQuantity"),
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
						IntStatus: "",
						CostCode: oContext.getProperty("CostCode"),
						CostCodeDes: oContext.getProperty("CostCodeDes"),
						TotQuantity: oContext.getProperty("TotQuantity"),
						Unit: oContext.getProperty("Unit"),
						Origin: "M",
						ForemanNo: oUser.getProperty("/PersonID"), 
						Version: "00"
					});
						
					oModel.setDefaultBindingMode("TwoWay");
		            
		            // Opening MasterAdd Dialog
		            var oControl = oEvent.getSource();
		            this._oMasterAddDialog = this.onOpenDialog(this._oMasterAddDialog,
		                "zwo.ui.wks_rep.view.quantity.fragment.QuantityMasterAdd",
		                oControl);
		            this._oMasterAddDialog.setModel(oViewModel, "Form");
		            this._oMasterAddDialog.setModel(oModel, "Input");
				}.bind(this));
			}else{
				MessageToast.show(this.getResourceBundle().getText("errorMasterCopy"));
			}
        },
		
		// Delete quantity		   
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

		handleClose: function() {
			// Closing Dialog fragment
			if (this._oMasterAddDialog) {
				this._oMasterAddDialog.close();
				this._oMasterAddDialog.destroy(true);
				this._oMasterAddDialog = null;
			}
		},
		
        handlePressOk: function(oEvent) {
        	var oDialog = oEvent.getSource();
        	oDialog.close();
        },
        
        handlePressCancel: function(oEvent) {
        	var oDialog = oEvent.getSource();
        	oDialog.close();
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
						self._deleteQuantity(aSelItems);
						
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
        
        _deleteQuantity: function(aSelItems){
			var self = this;
			
			aSelItems.forEach(function(oItem, itemIndex) {
				var oChkBox = oItem.getContent()[0].getItems()[0].getItems()[0];
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateMasterDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oItem.getBindingContext().getPath();
					var oQuantity = oItem.getBindingContext().getModel().getProperty(sPath);
					var oDfrdDelMaster = self.deleteQuantityItem(oQuantity, self);
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
				var aQuantity = oList.getItems();
				if(aQuantity.length !== 0) {
					for(var i = 0; i < aQuantity.length; i++) {
						if(oItem.ProjectNo === aQuantity[i].getBindingContext().getProperty("ProjectNo") && 
							formatter.formatODataDate(oItem.Day) === formatter.formatODataDate(aQuantity[i].getBindingContext().getProperty("Day")) &&
							oItem.Key === aQuantity[i].getBindingContext().getProperty("Key")){
							index = i;
						}
					}
				}
			}
			
			return index;		
		},
		
		_navToDetItem: function(sList, index) {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oCountry = oInScreenModel.getProperty("/ProjectSet/Country");
			var oList = self.byId(sList);
			var oListItems = oList.getItems();
			if (index.toString() && oListItems.length > 0) {
				var oContext = oListItems[index].getBindingContext();
				var sDay = formatter.formatODataDate(oContext.getProperty("Day"));
				var iProjectNo = oContext.getProperty("ProjectNo");
				var sKey = oContext.getProperty("Key");
				
				self.getRouter().navTo("quantitydet", {
					ProjectNo: iProjectNo,
					Day: sDay,
					itemNo: index,
					Key: sKey
				}, true);
			} else {
				self.getRouter().navTo("noQuantityDet");
			}
		},
		
		_bindQuantityMasterListItem: function(oFilter) {
			var self = this;
			var oDeferred = $.Deferred();
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("QuantityView");
			var oModel = self.getModel();
			var oInScreenModel = self.getModel("InScreenFilters");

			// Creating key set for ProjectSet entity
			var sQuantityPath = oModel.createKey("/ProjectSet", {
				ProjectNo: oInScreenModel.getProperty("/ProjectSet/ProjectNo"),
				Day: formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"))
			});
			sQuantityPath += "/ProjToQuantity";

			var oList = self.byId("masterList");
			var oCustomListItem = self.byId("quantityList");

			if (oList && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oList.bindItems({
					path: sQuantityPath,
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

		_onQuantityPatternMatched: function(oEvent) {

			if (oEvent.getParameter("name") === "quantity") {
				var sDay = oEvent.getParameter("arguments").Day;
				var sProjectNo = oEvent.getParameter("arguments").ProjectNo;
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
								var oDfrdQuantity = self._bindQuantityMasterListItem(oFilter);
								oDfrdQuantity.then(
									// Success handler
									function() {
										self._navToDetItem("masterList", self._sItemNo);
									});
							});
						} else {
							self.getRouter().navTo("project", {
								Day: sDay,
								ProjectNo: sProjectNo
							}, true);
						}
					});
			}
		}

	});

});



