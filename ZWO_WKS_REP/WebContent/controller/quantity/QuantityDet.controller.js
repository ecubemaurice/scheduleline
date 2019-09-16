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

	return BaseController.extend("zwo.ui.wks_rep.controller.quantity.QuantityDet", {

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
			this.setModel(oViewModel, "QuantityDetView");
			this.getRouter().getRoute("quantitydet").attachPatternMatched(this._onQuantityDetPatternMatched, this);
			
			// Device & Device size specific functions
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(
	    		// Success handler
	    		function(){
	    			var oPage = this.byId("quantitydet");
	    			if(oPage)
	    				oPage.setShowHeader(this.showDetHeader("orientation", {}));
	    		}.bind(this));
			sap.ui.Device.orientation.attachHandler(this.onOrientationChanged.bind(this));			
			sap.ui.Device.resize.attachHandler(this.onDeviceResized.bind(this));
		},
		
		onOrientationChanged: function() {
			var oPage = this.byId("quantitydet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("orientation", {}));
		},
		
		onDeviceResized: function(mParams) {			
			var oPage = this.byId("quantitydet");
			if(oPage)
				oPage.setShowHeader(this.showDetHeader("size", mParams));
		},

		onPressQuantityEdit: function(oEvent) {
  			var oContext = this.byId("quantityHeaderPnl").getBindingContext();
  			var oControl = oEvent.getSource();
  			var oResource = this.getResourceBundle();
  			var oViewModel = new JSONModel({
  				title: oResource.getText("editQuantity"),
  				mode: "edit"
  			});

  			var oModel = new JSONModel({
  				ProjectNo : oContext.getProperty("ProjectNo"),
  				Day :  oContext.getProperty("Day"), 	 
  				Key : oContext.getProperty("Key"),
  				FlagLocked: oContext.getProperty("FlagLocked"),
  				FlagInt: oContext.getProperty("FlagInt"),
  				FlagIntUpd: oContext.getProperty("FlagIntUpd"),
  				IntStatus: oContext.getProperty("IntStatus"),
  				CostCode: oContext.getProperty("CostCode"),
  				CostCodeDes: oContext.getProperty("CostCodeDes"),
  				TotQuantity: oContext.getProperty("TotQuantity"),
  				Unit: oContext.getProperty("Unit"),
  				Origin: oContext.getProperty("Origin"),
  				ForemanNo: oContext.getProperty("ForemanNo"),
  				Version: oContext.getProperty("Version")
  			});
			oModel.setDefaultBindingMode("TwoWay");

			this._oQtyEditDialog = this.onOpenDialog(this._oQtyEditDialog,
			   "zwo.ui.wks_rep.view.quantity.fragment.QuantityMasterAdd",
			   oControl);
			this._oQtyEditDialog.setModel(oViewModel, "Form");
			this._oQtyEditDialog.setModel(oModel, "Input");
		},
	
		onPressQuantitySave: function() {
			var self = this;
			var oInScreenModel = self.getModel("InScreenFilters");
			var oInput = self._oQtyEditDialog.getModel("Input").getData();
			var oQty = oInput;
			oQty.Day = formatter.formatODataDate(self._sDay);
			oQty.ProjectNo = self._sProjectNo;
			// Checking if all mandatory fields are filled
			if (oQty.CostCode.trim() === "") {
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
				var oDfrdUpd = self.updateQuantityItem(oQty, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successUpdate"));
						
						// Closing dialog window
						self._oQtyEditDialog.close();
					},
					// Error handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
					});
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
				var oQuantityDetItem = self.getModel().getProperty(sPath);
				var oDfrdUpd = self.updateQuantityDetItem(oQuantityDetItem, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						self.getRouter().navTo("quantity", {
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
		
		onPressQtyCCLock: function() {
			var self = this;
			var oTable = self.byId("costCodeList");
			var aSelItems = oTable.getSelectedItems();

			aSelItems.forEach(function(item) {
				var oContext = item.getBindingContext();
				var sIntStatus = oContext.getProperty("IntStatus");
				var bFlag = oContext.getProperty("FlagInt");
				var sPath = oContext.getPath();
				var oQuantityDetItem = oContext.getProperty(sPath);
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
							oQuantityDetItem.IntStatus = iIntLocked1;
							oQuantityDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iNotInt2): // Lock item and Integration status is Modified
							oQuantityDetItem.IntStatus = iIntLocked1;
							oQuantityDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntError): // Lock item and Integration status is Error
							oQuantityDetItem.IntStatus = iIntLocked2;
							oQuantityDetItem.FlagInt = false;
							bLocked = true;
							break;
						case (iIntLocked1): // Unlock item and for previous Integration status, Not Modified or Modified
							oQuantityDetItem.IntStatus = iNotInt2;
							oQuantityDetItem.FlagInt = false;
							bLocked = false;
							break;
						case (iIntLocked2): // Unlock item and for previous Integration status, Error
							oQuantityDetItem.IntStatus = iIntError;
							oQuantityDetItem.FlagInt = false;
							bLocked = false;
							break;
					}

					var oDfrdUpd = self.updateQuantityDetItem(oQuantityDetItem, self);
					oDfrdUpd.then(
						// Success handler
						function() {
							self.getRouter().navTo("quantity", {
								Day: self._sDay,
								ProjectNo: self._sProjectNo,
								itemNo: self._sItemNo
							}, true);
						},
						// Error handler
						function() {
							oQuantityDetItem.IntStatus = sIntStatus;
							oQuantityDetItem.FlagInt = bFlag;
						});
				}
				item.setSelected(false);
			});
			self.getView().byId("cpyDetBtn").setEnabled(true);
			self.getView().byId("editDetBtn").setEnabled(true);
			self.getView().byId("delDetBtn").setEnabled(true);
		},
	
		onPressQtyCCAdd: function(oEvent) {
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
		  	   Unit: "",
		  	   Origin: "M",
		  	   ForemanNo: oUser.getProperty("/PersonID"), 
		  	   ForemanName: oUser.getProperty("/Uname"),
		  	   Version: "", 
		  	   User: "",
		  	   Date: null,
		  	   SapDoc: "",
		  	   FlagComment: "",
		  	   CommentsPapyrus: "",
		  	   CommentsManual: ""
		    });
			oModel.setDefaultBindingMode("TwoWay");	
			this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
	               "zwo.ui.wks_rep.view.quantity.fragment.QuantityCostCodeAdd",
	               oControl);
			this._oCostCodeAddDialog.setModel(oViewModel, "Form");
			this._oCostCodeAddDialog.setModel(oModel, "Input");
      },
      
      onPressQtyCCCopy: function(oEvent) {
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
						Unit: selItem.getProperty("Unit"),
						Origin: selItem.getProperty("Origin"),
						ForemanNo: oUser.getProperty("/PersonID"), 
						ForemanName: oUser.getProperty("/Uname"),
						Version: selItem.getProperty("Version"),
						User: "",
						Date: null,
						SapDoc: "",
						FlagComment: "",
						CommentsPapyrus: "",
						CommentsManual: ""
					});

				// Instantiating Dialog fragment
				var oControl = oEvent.getSource();
				this._oCostCodeAddDialog = this.onOpenDialog(this._oCostCodeAddDialog,
						 "zwo.ui.wks_rep.view.quantity.fragment.QuantityCostCodeAdd",
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
			var oInScreenModel = self.getModel("InScreenFilters");
			var oInput = {};
	
			if (this._oCostCodeAddDialog) {
			   oInput = self._oCostCodeAddDialog.getModel("Input").getData();
	
			   var oCostCode = oInput;
			   oCostCode.Day = formatter.formatODataDate(self._sDay);
			   oCostCode.ProjectNo = self._sProjectNo;
			   oCostCode.Key = self._Key;
			   
			   // Setting undefined input fields left unfilled to empty string
			   oCostCode.CostCode = (oInput.CostCode) ? oInput.CostCode : "";
			   oCostCode.CostCodeDes = (oInput.CostCodeDes) ? oInput.CostCodeDes : "";
			   oCostCode.QuantityCC = (oInput.QuantityCC) ? oInput.QuantityCC : "0.000";
			   oCostCode.Unit = (oInput.Unit) ? oInput.Unit : "";
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
											self.getRouter().navTo("quantity", {
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
				   var oCostCode = oInput.oData[i];	
				   
				   // Setting undefined input fields left unfilled to empty string
				   oCostCode.CostCode = (oInput.oData[i].CostCode) ? oInput.oData[i].CostCode : "";
				   oCostCode.CostCodeDes = (oInput.oData[i].CostCodeDes) ? oInput.oData[i].CostCodeDes : "";
				   oCostCode.QuantityCC = (oInput.oData[i].QuantityCC) ? oInput.oData[i].QuantityCC : "0.000";
				   oCostCode.Unit = (oInput.oData[i].Unit) ? oInput.oData[i].Unit : "";
				   oCostCode.Origin = (oInput.oData[i].Origin) ? oInput.oData[i].Origin : "";
				   oCostCode.ForemanNo = (oInput.oData[i].ForemanNo) ? oInput.oData[i].ForemanNo : "";
				   oCostCode.ForemanName = (oInput.oData[i].ForemanName) ? oInput.oData[i].ForemanName : "";
				   oCostCode.Version = (oInput.oData[i].Version) ? oInput.oData[i].Version : "";
				   
				   self._updateCostCode(oCostCode);					  
			   }
			   // Enabling copy button
			   self.getView().byId("cpyDetBtn").setEnabled(true);
			   
			}
		},
		
		onPressQtyCCDelete: function() {
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
		
		onPressQtyCCEdit: function(oEvent) {
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
							Unit: oContext.getProperty("Unit"),
							Origin: oContext.getProperty("Origin"),
							ForemanNo: oContext.getProperty("ForemanNo"), 
							ForemanName: oContext.getProperty("ForemanName"),
							Version: oContext.getProperty("Version"), 
							User: oContext.getProperty("User"),
							Date: oContext.getProperty("Date"),
							SapDoc: oContext.getProperty("SapDoc"),
							FlagComment: oContext.getProperty("FlagComment"),
							CommentsPapyrus: oContext.getProperty("CommentsPapyrus"),
							CommentsManual: oContext.getProperty("CommentsManual")
						};
						aCostCode.push(oCostCode);
					}
				var oModel = new JSONModel(aCostCode);
		
				// Instantiating Dialog fragment
				var oControl = oEvent.getSource();
				this._oCostCodeEditDialog = this.onOpenDialog(this._oCostCodeEditDialog,
						"zwo.ui.wks_rep.view.quantity.fragment.QuantityCostCodeEdit",
					  oControl);
		
				// Binding models to fragment
				this._oCostCodeEditDialog.setModel(oViewModel, "Form");
				this._oCostCodeEditDialog.setModel(oModel, "Input");
			} else {
				MessageToast.show(this.getResourceBundle().getText("errorEdit"));
			}
		},

		handleClose: function() {
			// Closing Dialog fragment
			if (this._oQtyEditDialog) {
				this._oQtyEditDialog.close();
				this._oQtyEditDialog.destroy(true);
				this._oQtyEditDialog = null;
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
		
		onPressCommentDialog: function(oEvent) {
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sMode = "";
			var sCommentsManual = oContext.getProperty("CommentsManual");
			if(sCommentsManual !== "")
				sMode = "view";			
			
			var oViewModel = new JSONModel({
				  mode: sMode
		   }); 

			this._oCommentDialog = this.onOpenDialog(this._oCommentDialog,
				"zwo.ui.wks_rep.view.quantity.fragment.commentQtyDialog", oControl);
			this._oCommentDialog.setBindingContext(oContext);
			this._oCommentDialog.setModel(oViewModel, "Form");
			
		},
		
		onPressEditComment: function(oEvent) {
			var oControl = oEvent.getSource();
			var sText = oControl.getText();
			var oResourceBundle = this.getResourceBundle();
			var oTextArea = this.byId("idCmtTxtArea");
			var oTextCmtManual = this.byId("idCmtTxt");
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();
			var oItem = oContext.getProperty(sPath);
			var oFormModel = this._oCommentDialog.getModel("Form");
			
			if(oTextArea){
				// Adding a new comment
				if(sText === oResourceBundle.getText("addComment")) {
					oFormModel.setProperty("/mode", "edit");
					oControl.setText(oResourceBundle.getText("saveComment"));
					oTextArea.setEditable(true);
				} else if(sText === oResourceBundle.getText("editComment")) {	// Editing an existing comment					
					if(oTextCmtManual) {
						oFormModel.setProperty("/mode", "edit");
						oControl.setText(oResourceBundle.getText("saveComment"));
						oTextArea.setValue(oTextCmtManual.getText());
						oTextCmtManual.setVisible(false);
						oTextArea.setVisible(true);
						oTextArea.setEditable(true);
					}
				} else if(sText === oResourceBundle.getText("saveComment")) {	// Saving a comment				
				
					oItem.CommentsManual = oTextArea.getValue();
					var oDfrdUpd = this.updateQuantityDetItem(oItem, this);
					oDfrdUpd.then(
						// Success handler
						function() {									
							this.handleCloseQtyComment();
						}.bind(this));					
				}
			}			
		},
		
		handleCloseQtyComment: function() {			
			var oFormModel = this._oCommentDialog.getModel("Form");
			//If Quantity icon tab filter
			var oTextArea = this.byId("idCmtTxtArea");
			var oTextCmtManual = this.byId("idCmtTxt");
			
			oFormModel.setProperty("/mode", "view");
			oTextArea.setEditable(false);
			if(oTextArea && oTextArea.getValue() !== "") {				
				oTextArea.setVisible(false);
				oTextCmtManual.setVisible(true);				
			} else if(oTextArea && oTextArea.getValue() === ""){
				oTextArea.setVisible(true);
				oTextCmtManual.setVisible(false);
			}
			
			this._oCommentDialog.close();
			this._oCommentDialog.destroy();
			this._oCommentDialog = null;
		},
		
		onPressPapyrusSummary: function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var oContext = oControl.getBindingContext();
			var sPath = oContext.getPath();
			
			sPath += "/QuantityDetToPapyrus";

			this._oQuantityPapyrusDialog = this.onOpenDialog(this._oQuantityPapyrusDialog,
				"zwo.ui.wks_rep.view.quantity.fragment.QuantityPapyrusPopup", oControl);
				this._oQuantityPapyrusDialog.bindElement(sPath);
		},
		
		handleClosePapyrusSummary: function() {
			this._oQuantityPapyrusDialog.close();
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
							self._deleteQuantityDet(aSelItems);
							
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
	        
	        _deleteQuantityDet: function(aSelItems){
				var self = this;
				aSelItems.forEach(function(oItem) {
					var oContext = oItem.getBindingContext();
					var sIntStatus = oContext.getProperty("IntStatus");
					var sOrigin = oContext.getProperty("Origin");

					if (self.validateItemDelete(sIntStatus, sOrigin, self, true)) {
						var sPath = oContext.getPath();
						var oQuantityItem = oContext.getProperty(sPath);
						var oDfrdDel = self.deleteQuantityDetItem(oQuantityItem, self);
						oDfrdDel.then(
							// Success handler
							function() {
								MessageToast.show(self.getResourceBundle().getText("deleteOk"));
								var aReports = self.getModel("InScreenFilters").getProperty("/Reports");
								   if(aReports.length > 0){
									 //refresh report list
									 	self.getRepVersions(self._sProjectNo, self._sDay);
										var aResults = [];
										var oDfrdMaster = self.getMasterItem(oQuantityItem, aResults);
										oDfrdMaster.then(
										//success handler
										function(){
											var oProject = self.getOwnerComponent().byId("project");
											var oControl = oProject.byId("selectReport");
											oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
											var index = self.getMasterItemIndex(oQuantityItem, aResults);
											self.getRouter().navTo("quantity", {
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
			if (oCostCode.CostCode.trim() === "" || oCostCode.ForemanNo.trim() === "" ||
					 (oCostCode.Version.trim() === "" && oCostCode.Origin === "P") || oCostCode.QuantityCC.trim() === "") {
				MessageToast.show(self.getResourceBundle().getText("missingInput"));
			} else {
				var oDfrdAdd = self.addQuantityDetItem(oCostCode, self);
				oDfrdAdd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successDetAdd"));
						self.getRouter().navTo("quantity", {
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
			
			if (oCostCode.CostCode.trim() === "" || oCostCode.ForemanNo.trim() === "" ||
					 (oCostCode.Version.trim() === "" && oCostCode.Origin === "P") || oCostCode.QuantityCC.trim() === "") {
				MessageToast.show(self.getResourceBundle().getText("missingInput"));					
			} else {
			  var oDfrdUpd = self.updateQuantityDetItem(oCostCode, self);
				oDfrdUpd.then(
					// Success handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("successUpdate"));
						// Re-binding table list
						var oFilter = self.getInScreenFilters();
						self._bindDetailList(oFilter);
						// Closing dialog window
						self.handleClose();
					},
					// Error handler
					function() {
						MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
				});
			}			
			
		},

		_bindQuantityItem: function() {
			var self = this;
			var oModel = self.getModel();
			self.setModel(oModel);
			var oViewModel = self.getModel("QuantityDetView");

			// Creating key set for QuantitySet entity
			var sQuantityPath = oModel.createKey("/QuantitySet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._Key
			});
			
			var oPanel = self.byId("quantityHeaderPnl");

			if (oPanel) {
				oPanel.bindElement({
					path: sQuantityPath,
					events: {

						change: self._onQuantityBindingChange.bind(self),
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			}

			// Select by default icon tab filter General
			var oIcnTb = self.byId("idQuantityDetIconTabBar");
			if (oIcnTb)
				oIcnTb.setSelectedKey(self.getResourceBundle().getText("tabGeneral"));

		},

		_onQuantityBindingChange: function() {
			var self = this;
			var oFilter = self.getInScreenFilters();
			self._bindDetailList(oFilter);
		},


		_bindDetailList: function(oFilter) {
			var self = this;
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oViewModel = self.getModel("QuantityDetView");
			var oModel = self.getModel();

			// Creating key set for QuantityDet entity
			var sQuantityDetPath = oModel.createKey("/QuantitySet", {
				ProjectNo: self._sProjectNo,
				Day: self._sDay,
				Key: self._Key
			});
			sQuantityDetPath += "/QuantityToDet";

			var oTable = self.byId("costCodeList");
			var oCustomListItem = self.byId("detListTemplate");

			if (oTable && oCustomListItem) {
				var oItemTemplate = oCustomListItem.clone();
				oTable.bindItems({
					path: sQuantityDetPath,
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

		_onQuantityDetPatternMatched: function(oEvent) {
			var oRoute = oEvent.getParameter("name");
			if (oRoute === "quantitydet") {
				var self = this;
				self._sDay = oEvent.getParameter("arguments").Day;
				self._sProjectNo = oEvent.getParameter("arguments").ProjectNo;			
				self._sItemNo = oEvent.getParameter("arguments").itemNo;
				self._Key = oEvent.getParameter("arguments").Key;
	           
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
                                   self._bindQuantityItem();
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

});

