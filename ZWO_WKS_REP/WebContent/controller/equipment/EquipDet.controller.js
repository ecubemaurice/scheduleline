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

	return BaseController.extend("zwo.ui.wks_rep.controller.equipment.EquipDet", {

		formatter: formatter,

		/* ========================================================== */
		/* lifecycle methods                                          */
		/* ========================================================== */

		onInit : function () {
			
			// Creating EquipDetView model used to set page to busy
		    var oViewModel = new JSONModel({
		    	busy : false,
		    	BusyDelay : 0
		    });
		    this.setModel(oViewModel, "EquipDetView");
		    this.getRouter().getRoute("equipmentdet").attachPatternMatched(this._onEquipDetPatternMatched, this);
		    
		 // Device & Device size specific functions
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(
	    		// Success handler
	    		function(){
	    			var oPage = this.byId("equipdet");
	    			if(oPage)
	    				oPage.setShowHeader(this.showDetHeader("orientation", {}));
	    		}.bind(this));
		    sap.ui.Device.orientation.attachHandler(this.onOrientationChanged.bind(this));			
			sap.ui.Device.resize.attachHandler(this.onDeviceResized.bind(this));
		    		
		},
		
		onOrientationChanged: function() {
			var oPage = this.byId("equipdet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("orientation", {}));
		},
		
		onDeviceResized: function(mParams) {			
			var oPage = this.byId("equipdet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("size", mParams));
		},
		
		onPressEquipEdit: function(oEvent) {
			var oContext = this.byId("EquipmentHeaderPnl").getBindingContext();
			var oControl = oEvent.getSource();
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("editEquip"),
				mode: "edit"
			});

			// Getting properties of current labor object						
			var oModel = new JSONModel({
				Day: oContext.getProperty("Day"),
				ProjectNo: oContext.getProperty("ProjectNo"),
				Key: oContext.getProperty("Key"),
				FlagLocked: oContext.getProperty("FlagLocked"),
				FlagInt: oContext.getProperty("FlagInt"),	
				FlagIntUpd: oContext.getProperty("FlagIntUpd"),
				FlagGang: oContext.getProperty("FlagGang"),
				EquipmentNo : oContext.getProperty("EquipmentNo"),
				EquipmentName : oContext.getProperty("EquipmentName"),
				Mu: oContext.getProperty("Mu"),
				MuName: oContext.getProperty("MuName"),
				ActivityType: oContext.getProperty("ActivityType"),
				FuelFlag: oContext.getProperty("FuelFlag"),				
				Price: oContext.getProperty("Price"),
				TotCost: oContext.getProperty("TotCost"),
				TotQtyOperated: oContext.getProperty("TotQtyOperated"),
				Unit: oContext.getProperty("Unit"),
				TotQtyNonOperated: oContext.getProperty("TotQtyNonOperated"),
				Status: oContext.getProperty("Status"),
				Currency: oContext.getProperty("Currency"),
				IntStatus: oContext.getProperty("IntStatus"),
				Origin: oContext.getProperty("Origin"),
				ForemanNo: oContext.getProperty("ForemanNo"),
				Version: oContext.getProperty("Version"),
				CostCode : oContext.getProperty("CostCode")
			});

			oModel.setDefaultBindingMode("TwoWay");

			this._oEquipEditDialog = this.onOpenDialog(this._oEquipEditDialog,
				"zwo.ui.wks_rep.view.equipment.fragment.equipMasterAdd",
				oControl);
			this._oEquipEditDialog.setModel(oViewModel, "Form");
			this._oEquipEditDialog.setModel(oModel, "Input");
		},
		
		onPressEquipSave: function() {
			var self = this;
			var oInput =  self._oEquipEditDialog.getModel("Input").getData();
			var oEquip = oInput;
			oEquip.Day = formatter.formatODataDate(self._sDay);
			oEquip.ProjectNo = self._sProjectNo;
			
			// Checking if all mandatory fields are filled
			if (oEquip.EquipmentNo.trim() === "" || oEquip.EquipmentName.trim() === "" || oEquip.ActivityType.trim() === "" ||
					(oEquip.Price.trim() === "" || oEquip.Price === "0.00")) {
				if(oEquip.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
				var oDfrdUpd = self.updateEquipItem(oEquip, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successUpdate"));
						
						self.getRouter().navTo("equipment", {
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
			}
		},
		
		onPressCostCodeAdd: function(oEvent) {
			var oControl = oEvent.getSource();
			var oResource = this.getResourceBundle();

			var oViewModel = new JSONModel({
				title: oResource.getText("addCostCode"),
				mode: "add"
			});
			
			var oEmpContext = this.byId("EquipmentHeaderPnl").getBindingContext();
			
			if(oEmpContext) {

				var oUser = this.getModel("user");
				var oModel = new JSONModel({
					ProjectNo: "",
					Day: "",	
					Key: "",
					InternalNo: "",
					LineNo: "",
					ValidationLine: "",
					FlagInt: false,
					IntStatus: "",
					CostCode: "", // M
					CostCodeDes: "", // M
					Quantity: "0.00", //M
					Status: oEmpContext.getProperty("Status"),
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

				oModel.setDefaultBindingMode("TwoWay");

				this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
					"zwo.ui.wks_rep.view.equipment.fragment.EquipCostCodeAdd",
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
				for (var i = 0; i < oSelItems.length; i++) {
					var oContext = oSelItems[i].getBindingContext();
					
					var oCostCode = {
						ProjectNo: oContext.getProperty("ProjectNo"),
						Day: oContext.getProperty("Day"),	
						Key: oContext.getProperty("Key"),
						InternalNo: oContext.getProperty("InternalNo"),
						LineNo: oContext.getProperty("LineNo"),
						ValidationLine: oContext.getProperty("ValidationLine"),
						FlagInt: oContext.getProperty("FlagInt"),
						IntStatus: oContext.getProperty("IntStatus"),
						CostCode: oContext.getProperty("CostCode"), 
						CostCodeDes: oContext.getProperty("CostCodeDes"), 
						Quantity: oContext.getProperty("Quantity"), 
						Status: oContext.getProperty("Status"),
						Origin: oContext.getProperty("Origin"),
						ForemanNo: oContext.getProperty("ForemanNo"), 
						ForemanName: oContext.getProperty("ForemanName"),
						Version: oContext.getProperty("Version"), 
						User: oContext.getProperty("User"),
						Date: oContext.getProperty("Date"),
						SapDoc: oContext.getProperty("SapDoc"),
						FlagComment: oContext.getProperty("FlagComment"),	
						Comments: oContext.getProperty("Comments")
					};
					aCostCode.push(oCostCode);
				}
				var oModel = new JSONModel(aCostCode);
				
				// Instantiating Dialog fragment
				var oControl = oEvent.getSource();
				this._oCostCodeEditDialog = this.onOpenDialog(this._oCostCodeEditDialog,
					"zwo.ui.wks_rep.view.equipment.fragment.EquipCostCodeEdit",
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
				var oContext = oTable.getSelectedItem().getBindingContext();
				var oEmpContext = this.byId("EquipmentHeaderPnl").getBindingContext();
				
				if(oContext && oEmpContext) {
					var oModel = new JSONModel({
						ProjectNo: "",
						Day: "",	
						Key: "",
						InternalNo: "",
						LineNo: "",
						ValidationLine: "",
						FlagInt: false,
						IntStatus: "",
						CostCode: oContext.getProperty("CostCode"), // M
						CostCodeDes: oContext.getProperty("CostCodeDes"), // M
						Quantity: oContext.getProperty("Quantity"), //M
						Status: oEmpContext.getProperty("Status"),
						Origin: "M",
						ForemanNo: oUser.getProperty("/PersonID"), // M
						ForemanName: oUser.getProperty("/Uname"),
						Version: oContext.getProperty("Version"), // M
						User: "",
						Date: null,
						SapDoc: "",
						FlagComment: "",	
						Comments: ""
					});

					// Instantiating Dialog fragment
					var oControl = oEvent.getSource();
					this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
						"zwo.ui.wks_rep.view.equipment.fragment.EquipCostCodeAdd",
						oControl);

					// Binding models to fragment
					this._oCostCodeAddDialog.setModel(oViewModel, "Form");
					this._oCostCodeAddDialog.setModel(oModel, "Input");
				}
				
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorCopy"));
			}
		},
		
		handleSaveCostCode: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oInput = {};

			if (this._oCostCodeAddDialog) {
				oInput = self._oCostCodeAddDialog.getModel("Input").getData();

				var oCostCode = oInput;
				oCostCode.Day = formatter.formatODataDate(self._sDay);
				oCostCode.ProjectNo = self._sProjectNo;
				oCostCode.Key = self._sKey;
				
				// Setting undefined input fields left unfilled to empty string
				oCostCode.Quantity = (oInput.Quantity) ? oInput.Quantity : "0.00";
				//oCostCode.Unit = (oInput.Unit) ? oInput.Unit : "";
				oCostCode.Origin = (oInput.Origin) ? oInput.Origin : "";
				oCostCode.ForemanNo = (oInput.ForemanNo) ? oInput.ForemanNo : "";
				oCostCode.ForemanName = (oInput.ForemanName) ? oInput.ForemanName : "";
				oCostCode.Version = (oInput.Version) ? oInput.Version : "00";
				
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
											self.getRouter().navTo("equipment", {
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

			if (this._oCostCodeEditDialog) {
				oInput = self._oCostCodeEditDialog.getModel("Input");
				for (var i = 0; i < oInput.oData.length; i++) {
					// Enabling copy button
					self.getView().byId("cpyDetBtn").setEnabled(true);
					
					// Formatting date
					oInput.oData[i].Day = formatter.formatODataDate(self._sDay);
					var oCostCode = oInput.oData[i];
					
					// Setting undefined input fields left unfilled to empty string
					oCostCode.Quantity = (oInput.oData[i].Quantity) ? oInput.oData[i].Quantity : "0.00";
					//oCostCode.Unit = (oInput.oData[i].Unit) ? oInput.oData[i].Unit : "";
					oCostCode.Origin = (oInput.oData[i].Origin) ? oInput.oData[i].Origin : "";
					oCostCode.ForemanNo = (oInput.oData[i].ForemanNo) ? oInput.oData[i].ForemanNo : "";
					oCostCode.ForemanName = (oInput.oData[i].ForemanName) ? oInput.oData[i].ForemanName : "";
					oCostCode.Version = (oInput.oData[i].Version) ? oInput.oData[i].Version : "";
					
					self._updateCostCode(oCostCode);					
				}
				
				
			}
		},
		
		onPressDetFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bPressed = oControl.getPressed();
			var oContext = oControl.getBindingContext();
			var sIntStatus = oContext.getProperty("IntStatus");
			var sPath = oContext.getPath();

			if (self.validateItemEdit(sIntStatus, self, true)) {
				var oEquipDetItem = self.getModel().getProperty(sPath);
				var oDfrdUpd = self.updateEquipDetItem(oEquipDetItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						self.getRouter().navTo("equipment", {
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
				var oEquipDetItem = oContext.getProperty(sPath);
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
							oEquipDetItem.IntStatus = iIntLocked1;
							oEquipDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oEquipDetItem.IntStatus = iIntLocked1;
							oEquipDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oEquipDetItem.IntStatus = iIntLocked2;
							oEquipDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oEquipDetItem.IntStatus = iNotInt2;
							oEquipDetItem.FlagInt = false;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oEquipDetItem.IntStatus = iIntError;
							oEquipDetItem.FlagInt = false;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateEquipDetItem(oEquipDetItem, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							self.getRouter().navTo("equipment", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
						},
						// Error handler
						function() {
							oEquipDetItem.IntStatus = sIntStatus;
							oEquipDetItem.FlagInt = bFlag;
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
				self._openDeleteDialog(aSelItems);
				self.getView().byId("cpyDetBtn").setEnabled(true);
				self.getView().byId("lockDetBtn").setEnabled(true);
				self.getView().byId("editDetBtn").setEnabled(true);
			}
		},
			
		handleClose: function() {
			// Closing Dialog fragment
			if (this._oEquipEditDialog) {
				this._oEquipEditDialog.close();
				this._oEquipEditDialog.destroy(true);
				this._oEquipEditDialog = null;
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
		},
		
		onPressPapyrusSummary: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();
			
			sPath += "/EquipmentDetToPapyrus";

			this._oEquipPapyrusDialog = this.onOpenDialog(this._oEquipPapyrusDialog,
				"zwo.ui.wks_rep.view.equipment.fragment.EquipPapyrusPopup", oControl);
				this._oEquipPapyrusDialog.bindElement(sPath);
		},
		
		handleClosePapyrusSummary: function() {
			this._oEquipPapyrusDialog.close();
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
							self._deleteEquipDet(aSelItems);
							
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
	        
	        _deleteEquipDet: function(aSelItems){
				var self = this;
				aSelItems.forEach(function(oItem) {
					var oContext = oItem.getBindingContext();
					var sIntStatus = oContext.getProperty("IntStatus");
					var sOrigin = oContext.getProperty("Origin");

					if (self.validateItemDelete(sIntStatus, sOrigin, self, true)) {
						var sPath = oContext.getPath();
						var oEquipItem = oContext.getProperty(sPath);
						var oDfrdDel = self.deleteEquipDetItem(oEquipItem, self);
						oDfrdDel.then(
							// Success handler
							function() {
								MessageToast.show(self.getResourceBundle().getText("deleteOk"));
								var aReports = self.getModel("InScreenFilters").getProperty("/Reports");
								   if(aReports.length > 0){
									 //refresh report list
									 	self.getRepVersions(self._sProjectNo, self._sDay);
										var aResults = [];
										var oDfrdMaster = self.getMasterItem(oEquipItem, aResults);
										oDfrdMaster.then(
										//success handler
										function(){
											var oProject = self.getOwnerComponent().byId("project");
											var oControl = oProject.byId("selectReport");
											oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
											var index = self.getMasterItemIndex(oEquipItem, aResults);
											self.getRouter().navTo("equipment", {
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
		
		_addCostCode: function(oCostCode) {
			var self = this;
			var oDeferred = $.Deferred();
			// Checking if mandatory fields are filled
			if (((oCostCode.CostCode.trim() === "") && (oCostCode.Status === "" || oCostCode.Status === "N" || oCostCode.Status === "W")) || 
					oCostCode.ForemanNo.trim() === "" || (oCostCode.Version.trim() === "" && oCostCode.Origin === "P") 
					|| oCostCode.Quantity.trim() === "") {
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
				var oDfrdAdd = self.addEquipDetItem(oCostCode, self);
				oDfrdAdd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successDetAdd"));
						// Navigating back to master page to refresh list of master items						
						self.getRouter().navTo("equipment", {
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
			if(((oCostCode.CostCode.trim() === "") && (oCostCode.Status === "" || oCostCode.Status === "N" || oCostCode.Status === "W")) 
					|| oCostCode.ForemanNo.trim() === "" || (oCostCode.Version.trim() === "" && oCostCode.Origin === "P") 
					|| oCostCode.Quantity.trim() === "") { 
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
				var oDfrdUpd = self.updateEquipDetItem(oCostCode, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successUpdate"));
						// Navigating back to master page to refresh list of master items						
						self.getRouter().navTo("equipment", {
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
			}			
		},
				
		_bindEquipItem: function() {
			var self = this;
			var oModel = self.getModel();
			var oViewModel = self.getModel("EquipDetView");

			// Creating key set for EquipmentSet entity
			var sEquipPath = oModel.createKey("/EquipmentSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});

			var oPanel = self.byId("EquipmentHeaderPnl");
			if (oPanel) {
				oPanel.bindElement({
					path: sEquipPath,
					events: {
						change: self._onEquipBindingChange.bind(self),
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			}
		},
		
		_onEquipBindingChange : function() {
			var self = this;
			var oFilter = self.getInScreenFilters();
			self._bindDetailList(oFilter);
		},
		
		_bindDetailList: function(oFilter) {
			var self = this;
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("EquipDetView");
			var oModel = self.getModel();

			// Creating key set for EquipmentSet entity
			var sEquipDetPath = oModel.createKey("/EquipmentSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});
			sEquipDetPath += "/EquipmentToDet";

			var oTable = self.byId("costCodeList");
			var oCustomListItem = self.byId("detListTemplate");

			if (oTable && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oTable.bindItems({
					path: sEquipDetPath,
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
		
		_onEquipDetPatternMatched : function(oEvent) {
			var oRoute = oEvent.getParameter("name");
			if (oRoute === "equipmentdet") {
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
								self._bindEquipItem();								
								self._bindDetailList(oFilter);											
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