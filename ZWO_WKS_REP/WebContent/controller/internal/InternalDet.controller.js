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
		"sap/m/Text",
		"zwo/ui/wks_rep/utils/MaterialSearchHelp"
		
	], function (BaseController, formatter, Fragment, MessageToast, models, JSONModel, Dialog, Button, Text, MaterialSearchHelp) {
		"use strict";

	return BaseController.extend("zwo.ui.wks_rep.controller.internal.InternalDet", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			
			// Creating EquipDetView model used to set page to busy
		    var oViewModel = new JSONModel({
		    	busy : false,
		    	BusyDelay : 0
		    });
		    this.setModel(oViewModel, "InternalDetView");
		    this.getRouter().getRoute("internaldet").attachPatternMatched(this._onInternalDetPatternMatched, this);
		    
		 // Device & Device size specific functions
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(
	    		// Success handler
	    		function(){
	    			var oPage = this.byId("internaldet");
	    			if(oPage)
	    				oPage.setShowHeader(this.showDetHeader("orientation", {}));
	    		}.bind(this));
		    sap.ui.Device.orientation.attachHandler(this.onOrientationChanged.bind(this));			
			sap.ui.Device.resize.attachHandler(this.onDeviceResized.bind(this));
		},
		
		onOrientationChanged: function() {
			var oPage = this.byId("internaldet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("orientation", {}));
		},
		
		onDeviceResized: function(mParams) {			
			var oPage = this.byId("internaldet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("size", mParams));
		},
		
		onPressInternalEdit: function(oEvent) {
			var oContext = this.byId("InternalHeaderPnl").getBindingContext();
			var oControl = oEvent.getSource();
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("editInternal"),
				mode: "edit"
			});
			
			var oModel = new JSONModel({
				ProjectNo: oContext.getProperty("ProjectNo"),
				Day: oContext.getProperty("Day"),	
				Key: oContext.getProperty("Key"),
				FlagLocked: oContext.getProperty("FlagLocked"),
				FlagInt: oContext.getProperty("FlagInt"),
				FlagIntUpd: oContext.getProperty("FlagIntUpd"),
				MaterialNo: oContext.getProperty("MaterialNo"),
				MaterialDesc: oContext.getProperty("MaterialDesc"),
				WbsElement: oContext.getProperty("WbsElement"),
				Name: oContext.getProperty("Name"),
				Price: oContext.getProperty("Price"),
				Currency: oContext.getProperty("Currency"),
				Quantity: oContext.getProperty("Quantity"),	
				TotCost: oContext.getProperty("TotCost"),
				Unit: oContext.getProperty("Unit"),
				IntStatus: oContext.getProperty("IntStatus"),
				Origin: oContext.getProperty("Origin"),
				DeliveryNoteNo: oContext.getProperty("DeliveryNoteNo"),
				ForemanNo: oContext.getProperty("ForemanNo"),
				Version: oContext.getProperty("Version")
			});

			oModel.setDefaultBindingMode("TwoWay");

			this._oInternalEditDialog = this.onOpenDialog(this._oInternalEditDialog,
				"zwo.ui.wks_rep.view.internal.fragment.internalMasterAdd",
				oControl);
			this._oInternalEditDialog.setModel(oViewModel, "Form");
			this._oInternalEditDialog.setModel(oModel, "Input");
		},
		
		onPressInternalSave: function() {
			var self = this;
			var oInput =  self._oInternalEditDialog.getModel("Input").getData();
			var oInternal = oInput;
			oInternal.Day = formatter.formatODataDate(self._sDay);
			oInternal.ProjectNo = self._sProjectNo;
			
			// Checking if all mandatory fields are filled
			if (oInternal.MaterialNo.trim() === "" || oInternal.MaterialDesc.trim() === "" || (oInternal.Price.trim() === "" || oInternal.Price === "0.00")) {
				if(oInternal.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
				var oDfrdAdd = self.updateInternalItem(oInternal, self);
				oDfrdAdd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successUpdate"));
						// Closing dialog window
						self.handleClose();
					},
					// Error handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
					});
			}
		},
		
		onPressInternalCCAdd: function(oEvent) {
			var oControl = oEvent.getSource();
			var oResource = this.getResourceBundle();

			var oViewModel = new JSONModel({
				title: oResource.getText("addCostCode"),
				mode: "add"
			});
			
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
				CostCode: "",
				CostCodeDes: "",
				QuantityCC: "0.000",
				DeliveryNoteNo: "",
				Origin: "M",
				ForemanNo: oUser.getProperty("/PersonID"),
				ForemanName: oUser.getProperty("/Uname"),
				Version: "",
				User: "",
				Date: null,
				SapDoc: "",
				FlagComment: "",
				Comments: ""
			});

			oModel.setDefaultBindingMode("TwoWay");

			this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
				"zwo.ui.wks_rep.view.internal.fragment.InternalCostCodeAdd",
				oControl);
			this._oCostCodeAddDialog.setModel(oViewModel, "Form");
			this._oCostCodeAddDialog.setModel(oModel, "Input");
		},
		
		onPressInternalCCCopy: function(oEvent) {
			var oTable = this.byId("costCodeList");
			if (oTable.getSelectedItem()) {
				// Form model
				var oResource = this.getResourceBundle();
				var oViewModel = new JSONModel({
					title: oResource.getText("copyCostCode"),
					mode: "add"
				});

				// Input model
				var selItem = oTable.getSelectedItem().getBindingContext();
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
					CostCode: selItem.getProperty("CostCode"),
					CostCodeDes: selItem.getProperty("CostCodeDes"),
					QuantityCC: selItem.getProperty("QuantityCC"),
					DeliveryNoteNo: selItem.getProperty("DeliveryNoteNo"),
					Origin: "M",
					ForemanNo: oUser.getProperty("/PersonID"), 
					ForemanName: oUser.getProperty("/Uname"),
					Version: selItem.getProperty("Version"),
					User: "",
					Date: null,
					SapDoc: "",
					FlagComment: "",
					Comments: ""
				});

				// Instantiating Dialog fragment
				var oControl = oEvent.getSource();
				this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
					"zwo.ui.wks_rep.view.internal.fragment.InternalCostCodeAdd",
					oControl);

				// Binding models to fragment
				this._oCostCodeAddDialog.setModel(oViewModel, "Form");
				this._oCostCodeAddDialog.setModel(oModel, "Input");
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorCopy"));
			}
		},
		
		onPressInternalCCEdit: function(oEvent) {
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
					/*var sPath = oContext.getPath();
					var oCostCode = oContext.getProperty(sPath);*/
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
						QuantityCC: oContext.getProperty("QuantityCC"),
						DeliveryNoteNo: oContext.getProperty("DeliveryNoteNo"),
						Origin: oContext.getProperty("Origin"),
						ForemanNo: oContext.getProperty("ForemanNo"),
						ForemanName: oContext.getProperty("ForemanName"),
						Version: oContext.getProperty("Version"), 
						User: oContext.getProperty("User"),
						Date: oContext.getProperty("Date"),
						FlagComment: oContext.getProperty("FlagComment"),
						SapDoc: oContext.getProperty("SapDoc"),
						Comments: oContext.getProperty("Comments")
					};
					aCostCode.push(oCostCode);
				}
				var oModel = new JSONModel(aCostCode);
				
				// Instantiating Dialog fragment
				var oControl = oEvent.getSource();
				this._oCostCodeEditDialog = this.onOpenDialog(this._oCostCodeEditDialog,
					"zwo.ui.wks_rep.view.internal.fragment.InternalCostCodeEdit",
					oControl);

				// Binding models to fragment
				this._oCostCodeEditDialog.setModel(oViewModel, "Form");
				this._oCostCodeEditDialog.setModel(oModel, "Input");
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorEdit"));
			}
		},
		
		handleSaveCostCode: function(){
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
				oCostCode.CostCode = (oInput.CostCode) ? oInput.CostCode : "";
				oCostCode.CostCodeDes = (oInput.CostCodeDes) ? oInput.CostCodeDes : "";
				oCostCode.QuantityCC = (oInput.QuantityCC) ? oInput.QuantityCC : "";
				oCostCode.DeliveryNoteNo = (oInput.DeliveryNoteNo) ? oInput.DeliveryNoteNo : "";
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
											self.getRouter().navTo("internal", {
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
					oInput.oData[i].Day = formatter.formatODataDate(self._sDay);
					var oInputItem = oInput.oData[i];
					if (oInputItem.CostCode.trim() === "" || oInputItem.QuantityCC.trim() === "" || oInputItem.ForemanNo.trim() === "" ||
						(oInputItem.Version.trim() === "" && oInputItem.Origin === "P")) {
						MessageToast.show(self.getResourceBundle().getText("missingInput"));
						break;
					} else {
						self._updateInternalCostCode(oInputItem);
					}
				}
			}
			
			self.getView().byId("cpyDetBtn").setEnabled(true);
		},
		
		// Delete Internaltracting
		onPressInternalCCDelete : function(oEvent) {
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
		
		handleClose: function(){
			if(this._oInternalEditDialog){
				this._oInternalEditDialog.close();
				this._oInternalEditDialog.destroy(true);
				this._oInternalEditDialog = null;
			}
			
			if(this._oCostCodeAddDialog){
				this._oCostCodeAddDialog.close();
				this._oCostCodeAddDialog.destroy(true);
				this._oCostCodeAddDialog = null;
			}
			
			if(this._oCostCodeEditDialog){
				this._oCostCodeEditDialog.close();
				this._oCostCodeEditDialog.destroy(true);
				this._oCostCodeEditDialog = null;
			}
		},
		
		onPressInternalDetFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bPressed = oControl.getPressed();
			var oContext = oControl.getBindingContext();
			var sIntStatus = oContext.getProperty("IntStatus");
			var sPath = oContext.getPath();

			if (self.validateItemEdit(sIntStatus, self, true)) {
				var oInternalDetItem = self.getModel().getProperty(sPath);
				oInternalDetItem.Day = formatter.formatODataDate(self._sDay);
				var oDfrdUpd = self.updateInternalDetItem(oInternalDetItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						self.getRouter().navTo("internal", {
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
		
		onPressInternalCCLock : function(oEvent) {
			var self = this;
  			var oTable = self.byId("costCodeList");
  			var aSelItems = oTable.getSelectedItems();
  			
  			aSelItems.forEach(function(item) {
  				var oContext = item.getBindingContext();
  				var sIntStatus = oContext.getProperty("IntStatus");
  				var bFlag = oContext.getProperty("FlagInt");
  				var sPath = oContext.getPath();
  				var oInternalDetItem = oContext.getProperty(sPath);
  				oInternalDetItem.Day = formatter.formatODataDate(self._sDay);
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
  							oInternalDetItem.IntStatus = iIntLocked1;
  							oInternalDetItem.FlagInt = false;
  							bLocked = true;
  							break;
  						case (iNotInt2): // Lock item and Integration status is Modified
  							oInternalDetItem.IntStatus = iIntLocked1;
  							oInternalDetItem.FlagInt = false;
  							bLocked = true;
  							break;
  						case (iIntError): // Lock item and Integration status is Error
  							oInternalDetItem.IntStatus = iIntLocked2;
  							oInternalDetItem.FlagInt = false;
  							bLocked = true;
  							break;
  						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
  							oInternalDetItem.IntStatus = iNotInt1;
  							oInternalDetItem.FlagInt = false;
  							bLocked = false;
  							break;
  						case (iIntLocked2): // Unlock item and for previous Integration status, Error
  							oInternalDetItem.IntStatus = iIntError;
  							oInternalDetItem.FlagInt = false;
  							bLocked = false;
  							break;
  					}

  					var oDfrdUpd = self.updateInternalDetItem(oInternalDetItem, self);
  					oDfrdUpd.then(
  						// Success handler
  						function() {
							self.getRouter().navTo("internal", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
						},
  						// Error handler
  						function() {
  							oInternalDetItem.IntStatus = sIntStatus;
  							oInternalDetItem.FlagInt = bFlag;
  						});
  				}
  				item.setSelected(false);
  			});
  			self.getView().byId("cpyDetBtn").setEnabled(true);
  			self.getView().byId("editDetBtn").setEnabled(true);
  			self.getView().byId("delDetBtn").setEnabled(true);
		
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
						var oItem = this._oInternalEditDialog.getModel("Input").getData();											
						oItem.MaterialDesc = aMatSet[0].MaterialDesc;
						this._oInternalEditDialog.getModel("Input").setData(oItem);
					}.bind(self));
			}
		},
		
		onPressPapyrusSummary: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();
			
			sPath += "/InternalDetToPapyrus";

			this._oInternalPapyrusDialog = this.onOpenDialog(this._oInternalPapyrusDialog,
				"zwo.ui.wks_rep.view.internal.fragment.InternalPapyrusPopup", oControl);
				this._oInternalPapyrusDialog.bindElement(sPath);
		},
		
		handleClosePapyrusSummary: function() {
			this._oInternalPapyrusDialog.close();
		},
		
		onPressStck: function(oEvent) {
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();

			this._oStkPopoverFrgmt = this.openSelectionPopover(this._oStkPopoverFrgmt,
				"zwo.ui.wks_rep.view.internal.fragment.RemainingStk", oControl);
			this._oStkPopoverFrgmt.setBindingContext(oContext);
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
						self._deleteInternalDet(aSelItems);
						
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
		
		_deleteInternalDet: function(aSelItems){
			var self = this;
			aSelItems.forEach(function(oItem) {
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateItemDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oContext.getPath();
					var oInternalItem = oContext.getProperty(sPath);
					var oDfrdDel = self.deleteInternalDetItem(oInternalItem, self);
					oDfrdDel.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteOk"));
							var aReports = self.getModel("InScreenFilters").getProperty("/Reports");
							   if(aReports.length > 0){
								 //refresh report list
								 	self.getRepVersions(self._sProjectNo, self._sDay);
									var aResults = [];
									var oDfrdMaster = self.getMasterItem(oInternalItem, aResults);
									oDfrdMaster.then(
									//success handler
									function(){
										var oProject = self.getOwnerComponent().byId("project");
										var oControl = oProject.byId("selectReport");
										oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
										var index = self.getMasterItemIndex(oInternalItem, aResults);
										self.getRouter().navTo("internal", {
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
			if (oCostCode.CostCode.trim() === "" || oCostCode.QuantityCC.trim() === "" || oCostCode.ForemanNo.trim() === "" ||
			  (oCostCode.Version.trim() === "" && oCostCode.Origin === "P") === "") 
			{
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
				var oDfrdAdd = self.addInternalDetItem(oCostCode, self);
				oDfrdAdd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successDetAdd"));
						
						// Navigating back to master page to refresh list of master items
						self.getRouter().navTo("internal", {
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
		
		_updateInternalCostCode: function(oCostCode) {
			var self = this;
			var oDfrdUpd = self.updateInternalDetItem(oCostCode, self);
			oDfrdUpd.then(
				// Success handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("successUpdate"));
					// Navigating back to master page to refresh list of master items
					self.getRouter().navTo("internal", {
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
		
		_onInternalBindingChange : function() {
			var self = this;
			var oFilter = self.getInScreenFilters();
			self._bindDetailList(oFilter);
		},	
		
		_bindInternalItem: function() {
			var self = this;
			var oModel = self.getModel();
			var oViewModel = self.getModel("InternalDetView");
			//var oDeferred = $.Deferred();

			// Creating key set for InternalSet entity
			var sInternalPath = oModel.createKey("/InternalSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});

			var oPanel = self.byId("InternalHeaderPnl");
			if (oPanel) {
				oPanel.bindElement({
					path: sInternalPath,
					events: {
						change: self._onInternalBindingChange.bind(self),
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
		
		_onInternalDetBindingChange: function() {
			// Unselect all checkboxes
			var oChkBox = this.byId("costCodeChk");
			if(oChkBox) {
				oChkBox.setSelected(true);
				oChkBox.setSelected(false);
			}
		},
		
		_bindDetailList: function(oFilter) {
			var self = this;
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("InternalDetView");
			var oModel = self.getModel();

			// Creating key set for InternalDet entity
			var sInternalDetPath = oModel.createKey("/InternalSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});
			sInternalDetPath += "/InternalToDet";

			var oTable = self.byId("costCodeList");
			var oCustomListItem = self.byId("detListTemplate");

			if (oTable && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oTable.bindItems({
					path: sInternalDetPath,
					template: oItemTemplate,
					filters: aFilters,
					events: {
						change: self._onInternalDetBindingChange.bind(self),
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
		
		_onInternalDetPatternMatched : function(oEvent) {
			var oRoute = oEvent.getParameter("name");
			if (oRoute === "internaldet") {
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
								self._bindInternalItem();								
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