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

	return BaseController.extend("zwo.ui.wks_rep.controller.material.MaterialDet", {

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
		    this.setModel(oViewModel, "MaterialDetView");
		    this.getRouter().getRoute("materialdet").attachPatternMatched(this._onMaterialDetPatternMatched, this);
		    
		 // Device & Device size specific functions
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(
	    		// Success handler
	    		function(){
	    			var oPage = this.byId("materialdet");
	    			if(oPage)
	    				oPage.setShowHeader(this.showDetHeader("orientation", {}));
	    		}.bind(this));
		    sap.ui.Device.orientation.attachHandler(this.onOrientationChanged.bind(this));			
			sap.ui.Device.resize.attachHandler(this.onDeviceResized.bind(this));
		},
		
		onOrientationChanged: function() {
			var oPage = this.byId("materialdet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("orientation", {}));
		},
		
		onDeviceResized: function(mParams) {			
			var oPage = this.byId("materialdet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("size", mParams));
		},
		
		onPressMaterialEdit: function(oEvent) {
			var oContext = this.byId("MaterialHeaderPnl").getBindingContext();
			var oControl = oEvent.getSource();
			var oResource = this.getResourceBundle();
			var oViewModel = new JSONModel({
				title: oResource.getText("editMaterial"),
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
				SupplierNo: oContext.getProperty("SupplierNo"),
				SupplierName: oContext.getProperty("SupplierName"),
				PurchaseDoc: oContext.getProperty("PurchaseDoc"),
				Item: oContext.getProperty("Item"),
				Price: oContext.getProperty("Price"),
				Currency: oContext.getProperty("Currency"),
				Quantity: oContext.getProperty("Quantity"),	
				TotCost: oContext.getProperty("TotCost"),
				Unit: oContext.getProperty("Unit"),
				VendorMatNo: oContext.getProperty("VendorMatNo"),
				Agreement: oContext.getProperty("Agreement"),
				AgreementItem: oContext.getProperty("AgreementItem"),
				IntStatus: oContext.getProperty("IntStatus"),
				Origin: oContext.getProperty("Origin"),
				DeliveryNoteNo: oContext.getProperty("DeliveryNoteNo"),
				ForemanNo: oContext.getProperty("ForemanNo"),
				Version: oContext.getProperty("Version")
			});

			oModel.setDefaultBindingMode("TwoWay");

			this._oMaterialEditDialog = this.onOpenDialog(this._oMaterialEditDialog,
				"zwo.ui.wks_rep.view.material.fragment.MaterialMasterAdd",
				oControl);
			this._oMaterialEditDialog.setModel(oViewModel, "Form");
			this._oMaterialEditDialog.setModel(oModel, "Input");
		},
		
		onPressMaterialSave: function() {
			var self = this;
			var oInput =  self._oMaterialEditDialog.getModel("Input").getData();
			var oMaterial = oInput;
			oMaterial.Day = formatter.formatODataDate(self._sDay);
			oMaterial.ProjectNo = self._sProjectNo;
			
			// Checking if all mandatory fields are filled
			if (oMaterial.MaterialNo.trim() === "" || oMaterial.MaterialDesc.trim() === "" || oMaterial.SupplierNo.trim() === "" || oMaterial.SupplierName.trim() === "" ||
					(oMaterial.Price.trim() === "" || oMaterial.Price === "0.00")) {
				if(oMaterial.Price === "0.00"){
					MessageToast.show(self.getResourceBundle().getText("missingPrice"));
				} else{
					MessageToast.show(self.getResourceBundle().getText("missingInput"));
				}
			} else {
				var oDfrdAdd = self.updateMaterialItem(oMaterial, self);
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
		
		onPressMaterialCCAdd: function(oEvent) {
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
				UnitCC: "",
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
				"zwo.ui.wks_rep.view.material.fragment.MaterialCostCodeAdd",
				oControl);
			this._oCostCodeAddDialog.setModel(oViewModel, "Form");
			this._oCostCodeAddDialog.setModel(oModel, "Input");
		},
		
		onPressMaterialCCCopy: function(oEvent) {
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
					UnitCC: selItem.getProperty("UnitCC"),
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
					"zwo.ui.wks_rep.view.material.fragment.MaterialCostCodeAdd",
					oControl);

				// Binding models to fragment
				this._oCostCodeAddDialog.setModel(oViewModel, "Form");
				this._oCostCodeAddDialog.setModel(oModel, "Input");
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorCopy"));
			}
		},
		
		onPressMaterialCCEdit: function(oEvent) {
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
						QuantityCC: oContext.getProperty("QuantityCC"), 
						UnitCC: oContext.getProperty("UnitCC"),
						DeliveryNoteNo: oContext.getProperty("DeliveryNoteNo"),
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
					"zwo.ui.wks_rep.view.material.fragment.MaterialCostCodeEdit",
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
				oCostCode.UnitCC = (oInput.UnitCC) ? oInput.UnitCC : "";
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
										self.getRouter().navTo("material", {
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
						self._updateMaterialCostCode(oInputItem);
					}
				}
			}
			
			self.getView().byId("cpyDetBtn").setEnabled(true);
		},
		
		// Delete material
		onPressMaterialCCDelete : function(oEvent) {
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
			if(this._oMaterialEditDialog){
				this._oMaterialEditDialog.close();
				this._oMaterialEditDialog.destroy(true);
				this._oMaterialEditDialog = null;
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
		
		onPressMaterialDetFlag: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var bPressed = oControl.getPressed();
			var oContext = oControl.getBindingContext();
			var sIntStatus = oContext.getProperty("IntStatus");
			var sPath = oContext.getPath();

			if (self.validateItemEdit(sIntStatus, self, true)) {
				var oMaterialDetItem = self.getModel().getProperty(sPath);
				oMaterialDetItem.Day = formatter.formatODataDate(self._sDay);
				var oDfrdUpd = self.updateMaterialDetItem(oMaterialDetItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						self.getRouter().navTo("material", {
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
		
		onPressMaterialCCLock : function(oEvent) {
			var self = this;
  			var oTable = self.byId("costCodeList");
  			var aSelItems = oTable.getSelectedItems();
  			
  			aSelItems.forEach(function(item) {
  				var oContext = item.getBindingContext();
  				var sIntStatus = oContext.getProperty("IntStatus");
  				var bFlag = oContext.getProperty("FlagInt");
  				var sPath = oContext.getPath();
  				var oMaterialDetItem = oContext.getProperty(sPath);
  				oMaterialDetItem.Day = formatter.formatODataDate(self._sDay);
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
  							oMaterialDetItem.IntStatus = iIntLocked1;
  							oMaterialDetItem.FlagInt = false;
  							bLocked = true;
  							break;
  						case (iNotInt2): // Lock item and Integration status is Modified
  							oMaterialDetItem.IntStatus = iIntLocked1;
							oMaterialDetItem.FlagInt = false;
  							bLocked = true;
  							break;
  						case (iIntError): // Lock item and Integration status is Error
  							oMaterialDetItem.IntStatus = iIntLocked2;
							oMaterialDetItem.FlagInt = false;
  							bLocked = true;
  							break;
  						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
  							oMaterialDetItem.IntStatus = iNotInt1;
							oMaterialDetItem.FlagInt = false;
  							bLocked = false;
  							break;
  						case (iIntLocked2): // Unlock item and for previous Integration status, Error
  							oMaterialDetItem.IntStatus = iIntError;
							oMaterialDetItem.FlagInt = false;
  							bLocked = false;
  							break;
  					}

  					var oDfrdUpd = self.updateMaterialDetItem(oMaterialDetItem, self);
  					oDfrdUpd.then(
  						// Success handler
  						function() {
  							self.getRouter().navTo("material", {
  								Day: self._sDay,
  								ProjectNo: self._sProjectNo,
  								itemNo: self._sItemNo
  							}, true);
  						},
  						// Error handler
  						function() {
  							oMaterialDetItem.IntStatus = sIntStatus;
  							oMaterialDetItem.FlagInt = bFlag;
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
						var oItem = this._oMaterialEditDialog.getModel("Input").getData();											
						oItem.MaterialDesc = aMatSet[0].MaterialDesc;
						oItem.Unit = aMatSet[0].Unit;
						this._oMaterialEditDialog.getModel("Input").setData(oItem);
					}.bind(self));
			}
		},
		
		onPressPapyrusSummary: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();
			
			sPath += "/MaterialDetToPapyrus";

			this._oMaterialPapyrusDialog = this.onOpenDialog(this._oMaterialPapyrusDialog,
				"zwo.ui.wks_rep.view.material.fragment.MaterialPapyrusPopup", oControl);
				this._oMaterialPapyrusDialog.bindElement(sPath);
		},
		
		handleClosePapyrusSummary: function() {
			this._oMaterialPapyrusDialog.close();
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
						self._deleteMaterialDet(aSelItems);
						
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
		
		_deleteMaterialDet: function(aSelItems){
			var self = this;
			aSelItems.forEach(function(oItem) {
				var oContext = oItem.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var sOrigin = oContext.getProperty("Origin");

				if (self.validateItemDelete(sIntStatus, sOrigin, self, true)) {
					var sPath = oContext.getPath();
					var oMaterialItem = oContext.getProperty(sPath);
					var oDfrdDel = self.deleteMaterialDetItem(oMaterialItem, self);
					oDfrdDel.then(
						// Success handler
						function() {
							MessageToast.show(self.getResourceBundle().getText("deleteOk"));
							var aReports = self.getModel("InScreenFilters").getProperty("/Reports");
							   if(aReports.length > 0){
								 //refresh report list
								 	self.getRepVersions(self._sProjectNo, self._sDay);
									var aResults = [];
									var oDfrdMaster = self.getMasterItem(oMaterialItem, aResults);
									oDfrdMaster.then(
									//success handler
									function(){
										var oProject = self.getOwnerComponent().byId("project");
										var oControl = oProject.byId("selectReport");
										oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
										var index = self.getMasterItemIndex(oMaterialItem, aResults);
										self.getRouter().navTo("material", {
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
					(oCostCode.Version.trim() === "" && oCostCode.Origin === "P") === "") {
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
				var oDfrdAdd = self.addMaterialDetItem(oCostCode, self);
				oDfrdAdd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successDetAdd"));
						
						// Navigating back to master page to refresh list of master items
						self.getRouter().navTo("material", {
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
		
		_updateMaterialCostCode: function(oCostCode) {
			var self = this;
			var oDfrdUpd = self.updateMaterialDetItem(oCostCode, self);
			oDfrdUpd.then(
				// Success handler
				function() {
					MessageToast.show(self.getResourceBundle().getText("successUpdate"));
					
					// Navigating back to master page to refresh list of master items
					self.getRouter().navTo("material", {
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
		
		_onMaterialBindingChange : function() {
			var self = this;
			var oFilter = self.getInScreenFilters();
			self._bindDetailList(oFilter);
		},	
		
		_bindMaterialItem: function() {
			var self = this;
			var oModel = self.getModel();
			var oViewModel = self.getModel("MaterialDetView");

			// Creating key set for Material entity
			var sMaterialPath = oModel.createKey("/MaterialSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});

			var oPanel = self.byId("MaterialHeaderPnl");
			if (oPanel) {
				oPanel.bindElement({
					path: sMaterialPath,
					events: {
						change: self._onMaterialBindingChange.bind(self),
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
		
		
		_bindDetailList: function(oFilter) {
			var self = this;
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("MaterialDetView");
			var oModel = self.getModel();

			// Creating key set for MaterialDet entity
			var sMaterialDetPath = oModel.createKey("/MaterialSet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._sKey
			});
			sMaterialDetPath += "/MaterialToDet";

			var oTable = self.byId("costCodeList");
			var oCustomListItem = self.byId("detListTemplate");

			if (oTable && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oTable.bindItems({
					path: sMaterialDetPath,
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
		
		_onMaterialDetPatternMatched : function(oEvent) {
			var oRoute = oEvent.getParameter("name");
			if (oRoute === "materialdet") {
				var self = this;
				self._sDay = oEvent.getParameter("arguments").Day;
				self._sProjectNo = oEvent.getParameter("arguments").ProjectNo;
				self._sItemNo = oEvent.getParameter("arguments").itemNo;
				self._sKey = oEvent.getParameter("arguments").Key;
				
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
								self._bindMaterialItem();								
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