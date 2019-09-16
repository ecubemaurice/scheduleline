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
	"sap/ui/core/mvc/Controller", 
	"sap/ui/core/routing/History", 
	"zwo/ui/wks_rep/model/formatter", 
	"zwo/ui/wks_rep/model/models", 
	"sap/m/MessageToast", 
	"sap/ui/model/json/JSONModel", 
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog", 
	"sap/ui/comp/filterbar/FilterBar", 
	"sap/ui/model/Filter", 
	"sap/ui/model/FilterOperator", 
	"zwo/ui/wks_rep/utils/SearchHelps", 
	"zwo/ui/wks_rep/utils/MaterialSearchHelp", 
	"zwo/ui/wks_rep/utils/EquipmentSH", 
	"zwo/ui/wks_rep/utils/SupplierSH", 
	"zwo/ui/wks_rep/utils/PurchaseOrdSH"
	], function(Controller, History, formatter, models, MessageToast, JSONModel, ValueHelpDialog, FilterBar, Filter, FilterOperator,
			SearchHelps, MaterialSearchHelp, EquipmentSH, SupplierSH, PurchaseOrdSH) {
	    "use strict";
	    return Controller.extend("zwo.ui.wks_rep.controller.BaseController", {
	        formatter : formatter,
	        /**
	         * Convenience method for accessing the router in every controller of the application.
	         * @public
	         * @returns {sap.ui.core.routing.Router} the router for this component
	         */
	        getRouter : function() {
		        return this.getOwnerComponent().getRouter();
	        },
	        /**
	         * Convenience method for getting the view model by name in every controller of the application.
	         * @public
	         * @param {string} sName the model name
	         * @returns {sap.ui.model.Model} the model instance
	         */
	        getModel : function(sName) {
		        return this.getView().getModel(sName);
	        },
	        /**
	         * Convenience method for setting the view model in every controller of the application.
	         * @public
	         * @param {sap.ui.model.Model} oModel the model instance
	         * @param {string} sName the model name
	         * @returns {sap.ui.mvc.View} the view instance
	         */
	        setModel : function(oModel, sName) {
		        return this.getView().setModel(oModel, sName);
	        },
	        /**
	         * Convenience method for getting the resource bundle.
	         * @public
	         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
	         */
	        getResourceBundle : function() {
		        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
	        },
	        /**
	         * Event handler for navigating back.
	         * It there is a history entry we go one step back in the browser history
	         * If not, it will replace the current entry of the browser history with the master route.
	         * @public
	         */
	        onNavBack : function() {
		        var oHistory = History.getInstance();
		        var sPreviousHash = oHistory.getPreviousHash();
		        if (sPreviousHash !== undefined) {
			        window.history.go(-1);
		        } else {
			        //if no previous history instance, go back to dashboard
			        this.getRouter().navTo("dashboard", {}, true);
		        }
	        },
	        onNavHome : function() {
		        this.getRouter().navTo("dashboard");
	        },
	        metadataLoaded : function() {
		        return this.getOwnerComponent().oWhenMetadataIsLoaded;
	        },
	        userInfoLoaded : function() {
		        return this.getOwnerComponent().oUserReady;
	        },
	        openSelectionPopover : function(oFrgmt, sPath, oControl) {
		        var oView = this.getView();
		        if (!oFrgmt) {
			        oFrgmt = sap.ui.xmlfragment(oView.getId(), sPath, this);
			        oView.addDependent(oFrgmt);
		        }
		        jQuery.sap.delayedCall(0, this, function() {
			        oFrgmt.openBy(oControl);
		        });
		        return oFrgmt;
	        },
	        onOpenDialog : function(oDialog, sPath, oControl) {
		        var oView = this.getView();
		        // create dialog
		        if (!oDialog) {
			        // create dialog via fragment factory
			        oDialog = sap.ui.xmlfragment(oView.getId(), sPath, this);
			        oView.addDependent(oDialog);
		        }
		        jQuery.sap.delayedCall(0, this, function() {
			        oDialog.open(oControl);
		        });
		        return oDialog;
	        },
	        onSelectStatus : function(oEvent) {
		        // Opening selectStatus popover
		        var oControl = oEvent.getSource();
		        this._oStatusFrgmt = this
		            .openSelectionPopover(this._oStatusFrgmt, "zwo.ui.wks_rep.view.fragment.selectStatus", oControl);
	        },
	        handleDeclineStatus : function() {
		        // Closing Status fragment
		        this._oStatusFrgmt.close();
	        },
	        onSelectReport : function(oEvent) {
		        var oSelectReport = oEvent.getSource();
		        var self = this;
		        // Open report popover                 
		        self._oReportFrgmt = self
		            .openSelectionPopover(self._oReportFrgmt, "zwo.ui.wks_rep.view.fragment.ReportPopover", oSelectReport);
		        self._displayRepNum();
	        },
	        handleDeclineReport : function() {
		        // Closing Report fragment
		        this._oReportFrgmt.close();
	        },
	        onPressIntPop : function(oEvent) {
		        var oControl = oEvent.getSource();
		        var oContext = oControl.getBindingContext();
		        var sPath = oContext.getPath();
		        this._oIntPopoverFrgmt = this
		            .openSelectionPopover(this._oIntPopoverFrgmt, "zwo.ui.wks_rep.view.fragment.IntPopover", oControl);
		        this._oIntPopoverFrgmt.setBindingContext(oContext);
	        },
	        onPressCommentDialog : function(oEvent) {
		        var oControl = oEvent.getSource();
		        var oContext = oControl.getBindingContext();
		        var sPath = oContext.getPath();
		        var sOrigin = oContext.getProperty("Origin");
		        this._oCommentDialog = this
		            .onOpenDialog(this._oCommentDialog, "zwo.ui.wks_rep.view.fragment.commentDialog", oControl);
		        this._oCommentDialog.setBindingContext(oContext);
	        },
	        handleCloseComment : function() {
		        this._oCommentDialog.close();
	        },
	        getInScreenFilters : function() {
		        var self = this;
		        var oModel = self.getModel("InScreenFilters");
		        var sDay = "";
		        if (oModel.getProperty("/ProjectSet/Day"))
			        sDay = formatter.formatODataDate(oModel.getProperty("/ProjectSet/Day"));
		        var iProjNum = oModel.getProperty("/ProjectSet/ProjectNo");
		        var aRep = oModel.getProperty("/Reports");
		        var aStatus = oModel.getProperty("/Status");
		        var aFilters = [];
		        // Setting filter operator
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        // Saving reports filters
		        if ((aRep.length !== 0)) {
			        var aTmp = [];
			        aRep.forEach(function(rep) {
				        aTmp.push(new sap.ui.model.Filter("Origin", oOperatorEQ, rep.Origin));
				        aTmp.push(new sap.ui.model.Filter("ForemanNo", oOperatorEQ, rep.ForemanNo));
				        aTmp.push(new sap.ui.model.Filter("Version", oOperatorEQ, rep.Version));
			        });
			        aFilters.push(new sap.ui.model.Filter(aTmp, true));
		        }
		        // Saving status filters
		        if ((aStatus.length !== 0)) {
			        var aTmp = [];
			        aStatus.forEach(function(status) {
				        // IntStatus 0 and 1 map to status "Not Integrated"
				        aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, status.Index));
				        if (status.Index === "0")
					        aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, "1"));
			        });
			        aFilters.push(new sap.ui.model.Filter(aTmp, true));
		        }
		        var oFilter = new sap.ui.model.Filter(aFilters, true);
		        return oFilter;
	        },
	        getRepVersions : function(sProjectNo, sDay) {
		        var self = this;
		        var oComponent = self.getOwnerComponent();
		        var oDeferred = $.Deferred();
		        var sParam1 = "datetime'" + sDay + "'";
		        var sParam2 = "ProjectNo'" + sProjectNo + "'";
		        var oParam = {
		        "Day" : sDay,
		        "ProjectNo" : sProjectNo,
		        "ForemanNo" : ""
		        };
		        var oHandle = self.getModel().callFunction("/GetMtcdForeman", {
		        method : "GET",
		        urlParameters : oParam,
		        success : function(oData, reponse) {
			        //Saving reports which are selected by default to input screen selection model
			        var oRepModel = models.createJSONModel(oData.results, "TwoWay");
			        oComponent.setModel(oRepModel, "reportList");
			        var aSelForemen = self.getModel("InScreenFilters").getProperty("/Foremen");
			        var aTmp = [];
			        oData.results.forEach(function(result) {
				        for (var i = 0; i < aSelForemen.length; i++) {
					        if (result.ForemanNo === aSelForemen[i].Number) {
						        aTmp.push(result);
					        }
				        }
			        });
			        var aSelForemen = self.getModel("InScreenFilters").setProperty("/Reports", aTmp);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorGetRep") + " "
			            + oError.message);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        // Enable/Disable buttons according to integration status when master items are selected
	        onSelectMasterItem : function(oEvent) {
		        var self = this;
		        var oControl = oEvent.getSource();
		        var oSelItems = self.getSelMasterItems("masterList", self);
		        //if more than one item has been selected, disable copy
		        if (oSelItems.length > 1) {
			        self.byId("copyMBtn").setEnabled(false);
		        } else {
			        self.byId("copyMBtn").setEnabled(true);
		        }
		        // if any selected items have been locked or 
		        // if delete is not allowed, disable delete
		        if (self.isAnySelItemLocked(oSelItems, self)
		            || self.isMasterDelNotAllowed(oSelItems, self)) {
			        self.byId("deleteMBtn").setEnabled(false);
		        } else {
			        self.byId("deleteMBtn").setEnabled(true);
		        }
		        // if any selected item has status that does not allow an edit, disable lock
		        if (self.isMasterEditNotAllowed(oSelItems, self)) {
			        self.byId("lockMBtn").setEnabled(false);
		        } else {
			        self.byId("lockMBtn").setEnabled(true);
		        }
	        },
	        onSelectDetItem : function(oEvent) {
		        var self = this;
		        var oTable = self.byId("costCodeList");
		        var oSelItems = oTable.getSelectedItems();
		        var oList = oTable.getItems();
		        // Disabling button copy if more than 1 item is selected
		        if (oSelItems.length > 1) {
			        self.getView().byId("cpyDetBtn").setEnabled(false);
		        } else {
			        self.getView().byId("cpyDetBtn").setEnabled(true);
		        }
		        //Disabling button edit on edit condition
		        if (self.isAnySelItemLocked(oSelItems, self) || self.isEditNotAllowed(oSelItems, self)) {
			        self.getView().byId("editDetBtn").setEnabled(false);
		        } else {
			        self.getView().byId("editDetBtn").setEnabled(true);
		        }
		        // or if int status does not allow a delete
		        if (self.isDelNotAllowed(oSelItems, self))
			        self.getView().byId("delDetBtn").setEnabled(false);
		        else
			        self.getView().byId("delDetBtn").setEnabled(true);
		        // Disabling button lock if line status does not allow an edit
		        if (self.isEditNotAllowed(oSelItems, self)) {
			        self.getView().byId("lockDetBtn").setEnabled(false);
		        } else {
			        self.getView().byId("lockDetBtn").setEnabled(true);
		        }
	        },
	        getSelMasterItems : function(sList, oController) {
		        var self = oController;
		        var oList = self.byId(sList);
		        var oListItems = oList.getItems();
		        var aSelItems = [];
		        oListItems.forEach(function(item) {
			        var oChkBox = item.getContent()[0].getItems()[0].getItems()[0];
			        // Returning selected master items from master list
			        if (oChkBox.getSelected())
				        aSelItems.push(item);
		        });
		        return aSelItems;
	        },
	        onSelectFuelFlag : function(oEvent) {
		        var oChkBox = oEvent.getSource();
		        var oInputModel = oChkBox.getModel("Input");
		        if (oChkBox.getSelected()) {
			        oInputModel.setProperty("/FuelFlag", "X");
		        } else {
			        oInputModel.setProperty("/FuelFlag", "");
		        }
	        },
	        validateMasterItemDelete : function(iStatus, sOrigin, oController, bShow) {
		        var self = oController;
		        var oStatusModel = self.getModel("statusList");
		        var iNotInt1 = oStatusModel.getProperty("/0/index");
		        var iNotInt2 = "1";
		        var bValidated = true;
		        if (bShow) {
			        var aStatus = oStatusModel.getData();
			        var sIntStatus = "";
			        var oResourceBundle = self.getResourceBundle();
			        var sOriginTxt = (sOrigin === "M") ? oResourceBundle.getText("manual")
			            : oResourceBundle.getText("papyrus");
			        aStatus.forEach(function(status) {
				        if (iStatus === status.index)
					        sIntStatus = status.status;
			        });
		        }
		        if ((iStatus === iNotInt1 || iStatus === iNotInt2) && sOrigin === "M") {
			        bValidated = true;
		        } else {
			        bValidated = false;
			        if (bShow) {
				        if (sOrigin === "P")
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteOriginNotAllowed", [sOriginTxt]));
				        else
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteStatusNotAllowed", [sIntStatus]));
			        }
		        }
		        return bValidated;
	        },
	        isAnySelItemLocked : function(aSelItems, oController) {
		        var self = oController;
		        var bLocked = false;
		        for (var i = 0; i < aSelItems.length; i++) {
			        var oContext = (aSelItems[i].getBindingContext() ? aSelItems[i].getBindingContext()
			            : aSelItems[i].getBindingContext("labor"));
			        var sIntStatus = oContext.getProperty("IntStatus");
			        if (self.isEditItemLocked(sIntStatus, self, false)) {
				        bLocked = true;
				        break;
			        }
		        }
		        return bLocked;
	        },
	        isEditNotAllowed : function(aSelItems, oController) {
		        var self = oController;
		        var bNAllowed = false;
		        for (var i = 0; i < aSelItems.length; i++) {
			        var oContext = aSelItems[i].getBindingContext();
			        var sIntStatus = oContext.getProperty("IntStatus");
			        // Returns false if integration status is either IntOk or IntInProgress
			        if (!self.validateItemEdit(sIntStatus, oController, false)) {
				        bNAllowed = true;
				        break;
			        }
		        }
		        return bNAllowed;
	        },
	        isMasterEditNotAllowed : function(aSelItems, oController) {
		        var self = oController;
		        var bNAllowed = false;
		        for (var i = 0; i < aSelItems.length; i++) {
			        var oContext = (aSelItems[i].getBindingContext() ? aSelItems[i].getBindingContext()
			            : aSelItems[i].getBindingContext("labor"));
			        var sIntStatus = oContext.getProperty("IntStatus");
			        // Returns false if integration status is either IntOk or IntInProgress
			        if (!self.validateMasterEdit(sIntStatus, oController, false)) {
				        bNAllowed = true;
				        break;
			        }
		        }
		        return bNAllowed;
	        },
	        isDelNotAllowed : function(aSelItems, oController) {
		        var self = oController;
		        var bNAllowed = false;
		        for (var i = 0; i < aSelItems.length; i++) {
			        var oContext = aSelItems[i].getBindingContext();
			        var sIntStatus = oContext.getProperty("IntStatus");
			        var sOrigin = (oContext.getProperty("Origin")) ? oContext.getProperty("Origin") : "M";
			        if (!self.validateItemDelete(sIntStatus, sOrigin, oController, false)) {
				        bNAllowed = true;
				        break;
			        }
		        }
		        return bNAllowed;
	        },
	        isMasterDelNotAllowed : function(aSelItems, oController) {
		        var self = oController;
		        var bNAllowed = false;
		        for (var i = 0; i < aSelItems.length; i++) {
			        var oContext = (aSelItems[i].getBindingContext() ? aSelItems[i].getBindingContext()
			            : aSelItems[i].getBindingContext("labor"));
			        var sIntStatus = oContext.getProperty("IntStatus");
			        var sOrigin = (oContext.getProperty("Origin")) ? oContext.getProperty("Origin") : "M";
			        if (!self.validateMasterDelete(sIntStatus, sOrigin, oController, false)) {
				        bNAllowed = true;
				        break;
			        }
		        }
		        return bNAllowed;
	        },
	        isEditItemLocked : function(iStatus, oController, bShow) {
		        var self = oController;
		        var oStatusModel = self.getModel("statusList");
		        var iIntLocked1 = oStatusModel.getProperty("/4/index");
		        var iIntLocked2 = "7";
		        var aStatus = oStatusModel.getData();
		        var sIntStatus = "";
		        var bValidated = false;
		        if (bShow) {
			        aStatus.forEach(function(status) {
				        if (iStatus === status.index)
					        sIntStatus = status.status;
			        });
		        }
		        // Checking if item has locked status
		        if (iStatus === iIntLocked1 || iStatus === iIntLocked2) {
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("editStatusNotAllowed", [sIntStatus]));
			        bValidated = true;
		        }
		        return bValidated;
	        },
	        validateItemEdit : function(iStatus, oController, bShow) {
		        var self = oController;
		        var oStatusModel = self.getModel("statusList");
		        var iIntOK = oStatusModel.getProperty("/3/index");
		        var iIntInProg = oStatusModel.getProperty("/1/index");
		        var iIntLocked1 = oStatusModel.getProperty("/4/index");
		        var iIntLocked2 = "7";
		        var aStatus = oStatusModel.getData();
		        var sIntStatus = "";
		        var bValidated = true;
		        if (bShow) {
			        aStatus.forEach(function(status) {
				        if (iStatus === status.index)
					        sIntStatus = status.status;
			        });
		        }
		        // For both Origin = "M" or "P", edit on labor detail item
		        // not allowed on integration status "OK", "In Progress"
		        if (iStatus === iIntOK || iStatus === iIntInProg) {
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("editStatusNotAllowed", [sIntStatus]));
			        bValidated = false;
		        }
		        return bValidated;
	        },
	        validateMasterEdit : function(iStatus, oController, bShow) {
		        var self = oController;
		        var iIntPartial = "0";
		        var iIntOk = "2";
		        var bValidated = true;
		        // Lines with aggregated integration status "partial" or "Ok" cannot be edited
		        if (iStatus === iIntPartial) {
			        bValidated = false;
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("editStatusNotAllowed", ["Partial"]));
		        }
		        if (iStatus === iIntOk) {
			        bValidated = false;
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("editStatusNotAllowed", ["Integration OK"]));
		        }
		        return bValidated;
	        },
	        validateItemDelete : function(iStatus, sOrigin, oController, bShow) {
		        var self = oController;
		        var oStatusModel = self.getModel("statusList");
		        var iNotInt1 = oStatusModel.getProperty("/0/index");
		        var iNotInt2 = "1";
		        var iIntError = "3";
		        var bValidated = true;
		        if (bShow) {
			        var aStatus = oStatusModel.getData();
			        var sIntStatus = "";
			        var oResourceBundle = self.getResourceBundle();
			        var sOriginTxt = (sOrigin === "M") ? oResourceBundle.getText("manual")
			            : oResourceBundle.getText("papyrus");
			        aStatus.forEach(function(status) {
				        if (iStatus === status.index)
					        sIntStatus = status.status;
			        });
		        }
		        if ((iStatus === iNotInt1 || iStatus === iNotInt2 || iStatus === iIntError)
		            && sOrigin === "M") {
			        bValidated = true;
		        } else {
			        bValidated = false;
			        if (bShow) {
				        if (sOrigin === "P")
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteOriginNotAllowed", [sOriginTxt]));
				        else
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteStatusNotAllowed", [sIntStatus]));
			        }
		        }
		        return bValidated;
	        },
	        validateMasterDelete : function(iStatus, sOrigin, oController, bShow) {
		        var self = oController;
		        var iIntPartial = "0";
		        var iIntOk = "2";
		        var iIntError = "3";
		        var bValidated = true;
		        var oResourceBundle = self.getResourceBundle();
		        var sOriginTxt = (sOrigin === "M") ? oResourceBundle.getText("manual")
		            : oResourceBundle.getText("papyrus");
		        if (sOrigin === "M") {
			        // Lines with aggregated integration status "partial" or "Ok" or "Error" cannot be deleted
			        if (iStatus === iIntPartial) {
				        bValidated = false;
				        if (bShow)
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteStatusNotAllowed", ["Partial"]));
			        }
			        if (iStatus === iIntOk) {
				        bValidated = false;
				        if (bShow)
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteStatusNotAllowed", ["Integration OK"]));
			        }
			        /*if (iStatus === iIntError) {
			        	bValidated = false;
			        	if (bShow)
			        		MessageToast.show(self.getResourceBundle().getText("deleteStatusNotAllowed", ["Integration Error"]));
			        }*/
		        } else { // Delete not allowed for lines from origin papyrus
			        bValidated = false;
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("deleteOriginNotAllowed", [sOriginTxt]));
		        }
		        return bValidated;
	        },
	        validateLaborMasterDelete : function(iStatus, sOrigin, aLabor, oController, bShow) {
		        var self = oController;
		        var iIntPartial = "0";
		        var iIntOk = "2";
		        var iIntError = "3";
		        var bValidated = true;
		        var oResourceBundle = self.getResourceBundle();
		        var sOriginTxt = (sOrigin === "M") ? oResourceBundle.getText("manual")
		            : oResourceBundle.getText("papyrus");
		        if (sOrigin === "M") {
			        // Lines with aggregated integration status "partial" or "Ok" or "Error" cannot be deleted
			        if (iStatus === iIntPartial) {
				        bValidated = false;
				        if (bShow)
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteStatusNotAllowed", ["Partial"]));
			        }
			        if (iStatus === iIntOk) {
				        bValidated = false;
				        if (bShow)
					        MessageToast.show(self.getResourceBundle()
					            .getText("deleteStatusNotAllowed", ["Integration OK"]));
			        }
			        /*if (iStatus === iIntError) {
			        	bValidated = false;
			        	if (bShow)
			        		MessageToast.show(self.getResourceBundle().getText("deleteStatusNotAllowed", ["Integration Error"]));
			        }*/
		        } else if (sOrigin === "" && aLabor.length > 0) { // Delete not allowed for lines from origin papyrus
			        bValidated = false;
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("deleteOriginNotAllowed", [sOriginTxt]));
		        } else if (sOrigin === "P") {
			        bValidated = false;
			        if (bShow)
				        MessageToast.show(self.getResourceBundle()
				            .getText("deleteOriginNotAllowed", [sOriginTxt]));
		        }
		        return bValidated;
	        },
	        getLaborDetItem : function(oContext, aLabor) {
		        var self = this;
		        var oDeferred = $.Deferred();
		        var oModel = self.getModel();
		        // Creating key set for LaborDet entity
		        var sLaborDetPath = oModel.createKey("/LaborSet", {
		        ProjectNo : oContext.getProperty("ProjectNo"),
		        Day : oContext.getProperty("Day"),
		        Key : oContext.getProperty("Key")
		        });
		        sLaborDetPath += "/LaborToDet";
		        // Requesting for Labor header of selected project
		        oModel.read(sLaborDetPath, {
		        success : function(oData) {
			        oData.results.forEach(function(result) {
				        aLabor.push(result);
			        });
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        getMasterItem : function(oItem, aResults) {
		        var self = this;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        var sPath = oModel.createKey("/ProjectSet", {
		        ProjectNo : oItem.ProjectNo,
		        Day : oItem.Day
		        });
		        if (self.getModel("LaborView") || self.getModel("LaborDetView")) {
			        sPath += "/ProjToLabor";
		        } else if (self.getModel("TempView") || self.getModel("TempDetView")) {
			        sPath += "/ProjToTemporary";
		        } else if (self.getModel("EquipView") || self.getModel("EquipDetView")) {
			        sPath += "/ProjToEquipment";
		        } else if (self.getModel("RentalView") || self.getModel("RentalDetView")) {
			        sPath += "/ProjToRental";
		        } else if (self.getModel("MaterialView") || self.getModel("MaterialDetView")) {
			        sPath += "/ProjToMaterial";
		        } else if (self.getModel("SubConView") || self.getModel("SubConDetView")) {
			        sPath += "/ProjToSubContr";
		        } else if (self.getModel("InternalView") || self.getModel("InternalDetView")) {
			        sPath += "/ProjToInternal";
		        } else if (self.getModel("QuantityView") || self.getModel("QuantityDetView")) {
			        sPath += "/ProjToQuantity";
		        }
		        //Requesting Master Items
		        oModel.read(sPath, {
			        success : function(oData) {
				        oData.results.forEach(function(result) {
					        aResults.push(result);
				        });
				        oDeferred.resolve();
			        }
		        });
		        return oDeferred.promise();
	        },
	        getMasterItemIndex : function(oItem, aResults) {
		        var self = this;
		        var index = 0;
		        var oList = aResults;
		        if (oList.length !== 0) {
			        for (var i = 0; i < oList.length; i++) {
				        if (oItem.ProjectNo === oList[i].ProjectNo
				            && oList[i].Key.includes(oItem.Key.split(",", 1))) {
					        index = i;
					        break;
				        }
			        }
		        }
		        return index;
	        },
	        onInputChange : function(oEvent) {
		        var oInput = oEvent.getSource();
		        if ((oInput.getValue().trim() === "")
		            && (oInput.getRequired() || oInput.getType() === "Number")) {
			        oInput.setValueState(sap.ui.core.ValueState.Error);
		        } else {
			        oInput.setValueState(sap.ui.core.ValueState.None);
		        }
	        },
	        onAfterInputChanged : function(oEvent) {
		        var oInput = oEvent.getSource();
		        if (oInput.getType() === "Number"
		            && (oInput.getValue().trim() === "" || oInput.getValue().trim() === "0")) {
			        oInput.setValue("0.00");
		        }
		        if (oInput.getId().indexOf("idTD") >= 0) {
			        var oResourceBundle = this.getResourceBundle();
			        var oInputModel;
			        if (this._oCostCodeAddDialog)
				        oInputModel = this._oCostCodeAddDialog.getModel("Input");
			        if (this._oCostCodeEditDialog)
				        oInputModel = this._oCostCodeEditDialog.getModel("Input");
			        var fQty = parseFloat(oInputModel.getProperty("/QtyDay"));
			        var fTd = parseFloat(oInput.getValue());
			        if (fQty !== NaN && fTd !== NaN) {
				        if (fTd > fQty) {
					        oInput.setValueState(sap.ui.core.ValueState.Error);
					        oInput.setValueStateText(oResourceBundle.getText("tdError"));
				        }
			        }
		        }
	        },
	        onMasterListUpdated : function(oEvent) {
		        var oMasterList = this.getView().byId("masterList");
		        if (oEvent.getParameters().reason === "Sort"
		            || oEvent.getParameters().reason === "Filter") {
			        var aItems = oMasterList.getItems();
			        var Ind = this._getItemIndex(aItems[0]);
			        this._navToDetItem("masterList", Ind);
		        }
		        if (oEvent.getParameters().reason === "Refresh") {
			        if (this._oDfrdListUpd) {
				        this._oDfrdListUpd.resolve();
			        }
		        }
	        },
	        onMasterListUpdating : function(oEvent) {
		        var oMasterList = this.getView().byId("masterList");
		        if (oEvent.getParameters().reason === "Refresh") {
			        this._oDfrdListUpd = $.Deferred();
			        return this._oDfrdListUpd.promise();
		        }
	        },
	        setStatusModel : function() {
		        var oResource = this.getResourceBundle();
		        var aStatus = [{
		        index : "0",
		        status : oResource.getText("NotIntTxt")
		        }, {
		        index : "4",
		        status : oResource.getText("IntProgress")
		        }, {
		        index : "3",
		        status : oResource.getText("IntError")
		        }, {
		        index : "2",
		        status : oResource.getText("IntOK")
		        }, {
		        index : "6",
		        status : oResource.getText("IntLocked")
		        }];
		        var oStatusModel = new JSONModel(aStatus);
		        oStatusModel.setDefaultBindingMode("TwoWay");
		        this.getView().setModel(oStatusModel, "statusList");
	        },
	        getBonusFilters : function(iEmployeeNo, aStatus) {
		        var self = this;
		        // Creating employee filter
		        var oEmpFilter = new sap.ui.model.Filter("EmployeeNo", sap.ui.model.FilterOperator.EQ,
		            iEmployeeNo);
		        // Creating Status filter
		        var oStatusFilters = {};
		        if (aStatus.length !== 0) {
			        var aTmp = [];
			        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
			        aStatus.forEach(function(status) {
				        // IntStatus 0 and 1 map to status "Not Integrated"
				        aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, status.Index));
				        if (status.Index === "0")
					        aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, "1"));
			        });
			        oStatusFilters = new sap.ui.model.Filter(aTmp, true);
		        }
		        // Combining employee and status filters
		        var oFilter = {};
		        if (aStatus.length !== 0) {
			        oFilter = new sap.ui.model.Filter([oStatusFilters, oEmpFilter], true);
		        } else
			        oFilter = oEmpFilter;
		        return oFilter;
	        },
	        getLaborBonus : function(sDay, iProjectNo, iEmployeeNo, aResults) {
		        var self = this;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for LaborBonus entity
		        var sBonusPath = oModel.createKey("/ProjectSet", {
		        ProjectNo : iProjectNo,
		        Day : sDay
		        });
		        sBonusPath += "/ProjToLaborBonus";
		        // Get filters for bonus table
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var aStatus = oInScreenModel.getProperty("/Status");
		        var oFilters = self.getBonusFilters(iEmployeeNo, aStatus);
		        oModel.read(sBonusPath, {
		        filters : [oFilters],
		        success : function(oData) {
			        oData.results.forEach(function(result) {
				        aResults.push(result);
			        });
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        _displayRepNum : function() {
		        var self = this;
		        var oControl = this.getView().byId("selectReport");
		        if (oControl) {
			        var oReportItems = self.getModel("InScreenFilters").getProperty("/Reports");
			        //Displaying No of reports selected in placeholder
			        if (oReportItems.length === 1)
				        oControl.setPlaceholder(oReportItems.length + " "
				            + self.getResourceBundle().getText("OneReportTxt"));
			        else if (oReportItems.length > 1)
				        oControl.setPlaceholder(oReportItems.length + " "
				            + self.getResourceBundle().getText("ManyReportTxt"));
			        else
				        oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
		        }
	        },
	        _selectRep : function() {
		        var self = this;
		        // Displaying number of pre-selected reports                     
		        var oTable = self.byId("reportSelection");
		        var aRep = oTable.getItems();
		        var aSelRep = self.getModel("InScreenFilters").getProperty("/Reports");
		        aRep
		            .forEach(function(report) {
			            for (var i = 0; i < aSelRep.length; i++) {
				            if (report.getBindingContext("reportList").getProperty("ForemanNo") === aSelRep[i].ForemanNo
				                && report.getBindingContext("reportList").getProperty("Version") === aSelRep[i].Version
				                && report.getBindingContext("reportList").getProperty("Origin") === aSelRep[i].Origin) {
					            oTable.setSelectedItem(report);
					            break;
				            }
			            }
		            });
		        self._displayRepNum();
	        },
	        /*Request for Labor items, LaborlDet items and LaborBonus items*/
	        addLaborItem : function(oLabor, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sLaborPath = "/LaborSet";
		        if (self.getModel("LaborView"))
			        self.getModel("LaborView").setProperty("/busy", true);
		        if (self.getModel("LaborDetView"))
			        self.getModel("LaborDetView").setProperty("/busy", true);
		        oModel.create(sLaborPath, oLabor, {
		        success : function() {
			        if (self.getModel("LaborView"))
				        self.getModel("LaborView").setProperty("/busy", false);
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("LaborView"))
				        self.getModel("LaborView").setProperty("/busy", false);
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateLaborItem : function(oLabor, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        var sLaborPath = oModel.createKey("/LaborSet", {
		        ProjectNo : oLabor.ProjectNo,
		        Day : oLabor.Day,
		        Key : oLabor.Key
		        });
		        if (self.getModel("LaborView"))
			        self.getModel("LaborView").setProperty("/busy", true);
		        if (self.getModel("LaborDetView"))
			        self.getModel("LaborDetView").setProperty("/busy", true);
		        oModel.update(sLaborPath, oLabor, {
		        success : function() {
			        if (self.getModel("LaborView"))
				        self.getModel("LaborView").setProperty("/busy", false);
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("LaborView"))
				        self.getModel("LaborView").setProperty("/busy", false);
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteLaborItem : function(oLabor, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        var sLaborPath = oModel.createKey("/LaborSet", {
		        ProjectNo : oLabor.ProjectNo,
		        Day : oLabor.Day,
		        Key : oLabor.Key
		        });
		        oModel.remove(sLaborPath, {
		        success : function() {
			        self.getModel("LaborView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("LaborView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addLaborDetItem : function(oLabor, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sLaborDetPath = "/LaborDetSet";
		        self.getModel("LaborDetView").setProperty("/busy", true);
		        oModel.create(sLaborDetPath, oLabor, {
		        success : function() {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        //self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateLaborDetItem : function(oLabor, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for LaborDet entity
		        var sLaborDetPath = oModel.createKey("/LaborDetSet", {
		        ProjectNo : oLabor.ProjectNo,
		        Day : oLabor.Day,
		        InternalNo : oLabor.InternalNo,
		        LineNo : oLabor.LineNo,
		        CostCode : oLabor.CostCode,
		        ValidationLine : oLabor.ValidationLine
		        });
		        if (self.getModel("LaborDetView"))
			        self.getModel("LaborDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sLaborDetPath, oLabor, {
		        success : function() {
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteLaborDetItem : function(oLabor, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for LaborDet entity
		        var sLaborDetPath = oModel.createKey("/LaborDetSet", {
		        ProjectNo : oLabor.ProjectNo,
		        Day : oLabor.Day,
		        InternalNo : oLabor.InternalNo,
		        LineNo : oLabor.LineNo,
		        CostCode : oLabor.CostCode,
		        ValidationLine : oLabor.ValidationLine
		        });
		        self.getModel("LaborDetView").setProperty("/busy", true);
		        oModel.remove(sLaborDetPath, {
		        success : function() {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addLaborBonusItem : function(oLaborBonus, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sLaborBonusPath = "/LaborBonusSet";
		        self.getModel("LaborDetView").setProperty("/busy", true);
		        oModel.create(sLaborBonusPath, oLaborBonus, {
		        success : function() {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        //self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteLaborBonusItem : function(oLaborBonus, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for LaborBonusSet entity
		        var sLaborBonusPath = oModel.createKey("/LaborBonusSet", {
		        ProjectNo : oLaborBonus.ProjectNo,
		        Day : oLaborBonus.Day,
		        ValidationLine : oLaborBonus.ValidationLine,
		        EmployeeNo : oLaborBonus.EmployeeNo,
		        TypeOfHour : oLaborBonus.TypeOfHour,
		        Bonus : oLaborBonus.Bonus
		        });
		        self.getModel("LaborDetView").setProperty("/busy", true);
		        oModel.remove(sLaborBonusPath, {
		        success : function() {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("LaborDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateLaborBonusItem : function(oLaborBonus, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for LaborBonusSet entity
		        var sLaborEditBonusPath = oModel.createKey("/LaborBonusSet", {
		        ProjectNo : oLaborBonus.ProjectNo,
		        Day : oLaborBonus.Day,
		        ValidationLine : oLaborBonus.ValidationLine,
		        EmployeeNo : oLaborBonus.EmployeeNo,
		        TypeOfHour : oLaborBonus.TypeOfHour,
		        Bonus : oLaborBonus.Bonus,
		        });
		        if (self.getModel("LaborDetView"))
			        self.getModel("LaborDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sLaborEditBonusPath, oLaborBonus, {
		        success : function() {
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        if (self.getModel("LaborDetView"))
				        self.getModel("LaborDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /*Request for Rental items and RentalDet items*/
	        addRentalItem : function(oRental, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sRentalPath = "/RentalSet";
		        self.getModel("RentalView").setProperty("/busy", true);
		        oModel.create(sRentalPath, oRental, {
		        success : function() {
			        self.getModel("RentalView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("RentalView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateRentalItem : function(oRental, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        var sRentalPath = oModel.createKey("/RentalSet", {
		        ProjectNo : oRental.ProjectNo,
		        Day : oRental.Day,
		        Key : oRental.Key
		        });
		        if (self.getModel("RentalView"))
			        self.getModel("RentalView").setProperty("/busy", true);
		        if (self.getModel("RentalDetView"))
			        self.getModel("RentalDetView").setProperty("/busy", true);
		        oModel.update(sRentalPath, oRental, {
		        success : function() {
			        if (self.getModel("RentalView"))
				        self.getModel("RentalView").setProperty("/busy", false);
			        if (self.getModel("RentalDetView"))
				        self.getModel("RentalDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("RentalView"))
				        self.getModel("RentalView").setProperty("/busy", false);
			        if (self.getModel("RentalDetView"))
				        self.getModel("RentalDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteRentalItem : function(oRental, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for RentalSet entity
		        var sRentalPath = oModel.createKey("/RentalSet", {
		        ProjectNo : oRental.ProjectNo,
		        Day : oRental.Day,
		        Key : oRental.Key
		        });
		        oModel.remove(sRentalPath, {
		        success : function() {
			        self.getModel("RentalView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("RentalView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addRentalDetItem : function(oRental, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sRentalDetPath = "/RentalDetSet";
		        self.getModel("RentalDetView").setProperty("/busy", true);
		        oModel.create(sRentalDetPath, oRental, {
		        success : function() {
			        self.getModel("RentalDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("RentalDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateRentalDetItem : function(oRental, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for RentalDet entity
		        var sRentalDetPath = oModel.createKey("/RentalDetSet", {
		        ProjectNo : oRental.ProjectNo,
		        Day : oRental.Day,
		        InternalNo : oRental.InternalNo,
		        LineNo : oRental.LineNo,
		        ValidationLine : oRental.ValidationLine,
		        CostCode : oRental.CostCode
		        });
		        if (self.getModel("RentalDetView"))
			        self.getModel("RentalDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sRentalDetPath, oRental, {
		        success : function() {
			        if (self.getModel("RentalDetView"))
				        self.getModel("RentalDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        if (self.getModel("RentalDetView"))
				        self.getModel("RentalDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteRentalDetItem : function(oRental, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for RentalDet entity
		        var sRentalDetPath = oModel.createKey("/RentalDetSet", {
		        ProjectNo : oRental.ProjectNo,
		        Day : oRental.Day,
		        InternalNo : oRental.InternalNo,
		        LineNo : oRental.LineNo,
		        ValidationLine : oRental.ValidationLine,
		        CostCode : oRental.CostCode
		        });
		        self.getModel("RentalDetView").setProperty("/busy", true);
		        oModel.remove(sRentalDetPath, {
		        success : function() {
			        self.getModel("RentalDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("RentalDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for Equipment and Equipment Details
	         **/
	        addEquipItem : function(oEquip, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sEquipPath = "/EquipmentSet";
		        self.getModel("EquipView").setProperty("/busy", true);
		        oModel.create(sEquipPath, oEquip, {
		        success : function() {
			        self.getModel("EquipView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("EquipView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateEquipItem : function(oEquip, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for EquipmentSet entity
		        var sEquipPath = oModel.createKey("/EquipmentSet", {
		        ProjectNo : oEquip.ProjectNo,
		        Day : oEquip.Day,
		        Key : oEquip.Key
		        });
		        if (self.getModel("EquipView"))
			        self.getModel("EquipView").setProperty("/busy", true);
		        if (self.getModel("EquipDetView"))
			        self.getModel("EquipDetView").setProperty("/busy", true);
		        oModel.update(sEquipPath, oEquip, {
		        success : function() {
			        if (self.getModel("EquipView"))
				        self.getModel("EquipView").setProperty("/busy", false);
			        if (self.getModel("EquipDetView"))
				        self.getModel("EquipDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("EquipView"))
				        self.getModel("EquipView").setProperty("/busy", false);
			        if (self.getModel("EquipDetView"))
				        self.getModel("EquipDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteEquipItem : function(oEquip, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for EquipmentSet entity
		        var sEquipPath = oModel.createKey("/EquipmentSet", {
		        ProjectNo : oEquip.ProjectNo,
		        Day : oEquip.Day,
		        Key : oEquip.Key
		        });
		        oModel.remove(sEquipPath, {
		        success : function() {
			        self.getModel("EquipView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("EquipView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addEquipDetItem : function(oEquip, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sEquipDetPath = "/EquipmentDetSet";
		        self.getModel("EquipDetView").setProperty("/busy", true);
		        oModel.create(sEquipDetPath, oEquip, {
		        success : function() {
			        self.getModel("EquipDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("EquipDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateEquipDetItem : function(oEquip, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for EquipmentDet entity
		        var sEquipDetPath = oModel.createKey("/EquipmentDetSet", {
		        ProjectNo : oEquip.ProjectNo,
		        Day : oEquip.Day,
		        InternalNo : oEquip.InternalNo,
		        LineNo : oEquip.LineNo,
		        CostCode : oEquip.CostCode,
		        ValidationLine : oEquip.ValidationLine
		        });
		        if (self.getModel("EquipDetView"))
			        self.getModel("EquipDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sEquipDetPath, oEquip, {
		        success : function() {
			        if (self.getModel("EquipDetView"))
				        self.getModel("EquipDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("EquipDetView"))
				        self.getModel("EquipDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteEquipDetItem : function(oEquip, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for EquipmentDet entity
		        var sEquipDetPath = oModel.createKey("/EquipmentDetSet", {
		        ProjectNo : oEquip.ProjectNo,
		        Day : oEquip.Day,
		        InternalNo : oEquip.InternalNo,
		        LineNo : oEquip.LineNo,
		        CostCode : oEquip.CostCode,
		        ValidationLine : oEquip.ValidationLine
		        });
		        self.getModel("EquipDetView").setProperty("/busy", true);
		        oModel.remove(sEquipDetPath, {
		        success : function() {
			        self.getModel("EquipDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("EquipDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for Subcontracting and Subcontracting Details
	         **/
	        addSubConItem : function(oSubCon, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sSubConPath = "/SubContrSet";
		        self.getModel("SubConView").setProperty("/busy", true);
		        oModel.create(sSubConPath, oSubCon, {
		        success : function() {
			        self.getModel("SubConView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("SubConView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateSubConItem : function(oSubCon, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        var sSubConPath = oModel.createKey("/SubContrSet", {
		        ProjectNo : oSubCon.ProjectNo,
		        Day : oSubCon.Day,
		        Key : oSubCon.Key
		        });
		        if (self.getModel("SubConView"))
			        self.getModel("SubConView").setProperty("/busy", true);
		        if (self.getModel("SubConDetView"))
			        self.getModel("SubConDetView").setProperty("/busy", true);
		        oModel.update(sSubConPath, oSubCon, {
		        success : function() {
			        if (self.getModel("SubConView"))
				        self.getModel("SubConView").setProperty("/busy", false);
			        if (self.getModel("SubConDetView"))
				        self.getModel("SubConDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("SubConView"))
				        self.getModel("SubConView").setProperty("/busy", false);
			        if (self.getModel("SubConDetView"))
				        self.getModel("SubConDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteSubConItem : function(oSubCon, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        var sSubConPath = oModel.createKey("/SubContrSet", {
		        ProjectNo : oSubCon.ProjectNo,
		        Day : oSubCon.Day,
		        Key : oSubCon.Key
		        });
		        oModel.remove(sSubConPath, {
		        success : function() {
			        self.getModel("SubConView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("SubConView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addSubConDetItem : function(oSubCon, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sSubConDetPath = "/SubContrDetSet";
		        self.getModel("SubConDetView").setProperty("/busy", true);
		        oModel.create(sSubConDetPath, oSubCon, {
		        success : function() {
			        self.getModel("SubConDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("SubConDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateSubConDetItem : function(oSubCon, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set forSubContrDet entity
		        var sSubConDetPath = oModel.createKey("/SubContrDetSet", {
		        ProjectNo : oSubCon.ProjectNo,
		        Day : oSubCon.Day,
		        InternalNo : oSubCon.InternalNo,
		        LineNo : oSubCon.LineNo,
		        ValidationLine : oSubCon.ValidationLine,
		        CostCode : oSubCon.CostCode
		        });
		        if (self.getModel("SubConDetView"))
			        self.getModel("SubConDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sSubConDetPath, oSubCon, {
		        success : function() {
			        if (self.getModel("SubConDetView"))
				        self.getModel("SubConDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("SubConDetView"))
				        self.getModel("SubConDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteSubConDetItem : function(oSubCon, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for SubContrDet entity
		        var sSubConDetPath = oModel.createKey("/SubContrDetSet", {
		        ProjectNo : oSubCon.ProjectNo,
		        Day : oSubCon.Day,
		        InternalNo : oSubCon.InternalNo,
		        LineNo : oSubCon.LineNo,
		        ValidationLine : oSubCon.ValidationLine,
		        CostCode : oSubCon.CostCode
		        });
		        self.getModel("SubConDetView").setProperty("/busy", true);
		        oModel.remove(sSubConDetPath, {
		        success : function() {
			        self.getModel("SubConDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("SubConDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for Temporary and Temporary Details
	         **/
	        addTempItem : function(oTemp, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sTempPath = "/TemporarySet";
		        self.getModel("TempView").setProperty("/busy", true);
		        oModel.create(sTempPath, oTemp, {
		        success : function() {
			        self.getModel("TempView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("TempView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateTempItem : function(oTemp, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for TemporarySet entity
		        var sTempPath = oModel.createKey("/TemporarySet", {
		        ProjectNo : oTemp.ProjectNo,
		        Day : oTemp.Day,
		        Key : oTemp.Key
		        });
		        if (self.getModel("TempView"))
			        self.getModel("TempView").setProperty("/busy", true);
		        if (self.getModel("TempDetView"))
			        self.getModel("TempDetView").setProperty("/busy", true);
		        oModel.update(sTempPath, oTemp, {
		        success : function() {
			        if (self.getModel("TempView"))
				        self.getModel("TempView").setProperty("/busy", false);
			        if (self.getModel("TempDetView"))
				        self.getModel("TempDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("TempView"))
				        self.getModel("TempView").setProperty("/busy", false);
			        if (self.getModel("TempDetView"))
				        self.getModel("TempDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteTempItem : function(oTemp, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for ProjectSet entity
		        // Creating key set for TemporarySet entity
		        var sTempPath = oModel.createKey("/TemporarySet", {
		        ProjectNo : oTemp.ProjectNo,
		        Day : oTemp.Day,
		        Key : oTemp.Key
		        });
		        oModel.remove(sTempPath, {
		        success : function() {
			        self.getModel("TempView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("TempView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addTempDetItem : function(oTemp, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sTempDetPath = "/TemporaryDetSet";
		        self.getModel("TempDetView").setProperty("/busy", true);
		        oModel.create(sTempDetPath, oTemp, {
		        success : function() {
			        self.getModel("TempDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("TempDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateTempDetItem : function(oTemp, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for TemporaryDet entity
		        var sTempDetPath = oModel.createKey("/TemporaryDetSet", {
		        ProjectNo : oTemp.ProjectNo,
		        Day : oTemp.Day,
		        InternalNo : oTemp.InternalNo,
		        LineNo : oTemp.LineNo,
		        ValidationLine : oTemp.ValidationLine,
		        CostCode : oTemp.CostCode
		        });
		        if (self.getModel("TempDetView"))
			        self.getModel("TempDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sTempDetPath, oTemp, {
		        success : function() {
			        if (self.getModel("TempDetView"))
				        self.getModel("TempDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("TempDetView"))
				        self.getModel("TempDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteTempDetItem : function(oTemp, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for TemptrDet entity
		        var sTempDetPath = oModel.createKey("/TemporaryDetSet", {
		        ProjectNo : oTemp.ProjectNo,
		        Day : oTemp.Day,
		        InternalNo : oTemp.InternalNo,
		        LineNo : oTemp.LineNo,
		        ValidationLine : oTemp.ValidationLine,
		        CostCode : oTemp.CostCode
		        });
		        self.getModel("TempDetView").setProperty("/busy", true);
		        oModel.remove(sTempDetPath, {
		        success : function() {
			        self.getModel("TempDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("TempDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for Material and Material Details
	         **/
	        addMaterialItem : function(oMaterial, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sMaterialPath = "/MaterialSet";
		        self.getModel("MaterialView").setProperty("/busy", true);
		        oModel.create(sMaterialPath, oMaterial, {
		        success : function() {
			        self.getModel("MaterialView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("MaterialView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateMaterialItem : function(oMaterial, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for MaterialSet entity
		        var sMaterialPath = oModel.createKey("/MaterialSet", {
		        ProjectNo : oMaterial.ProjectNo,
		        Day : oMaterial.Day,
		        Key : oMaterial.Key
		        });
		        if (self.getModel("MaterialView"))
			        self.getModel("MaterialView").setProperty("/busy", true);
		        if (self.getModel("MaterialDetView"))
			        self.getModel("MaterialDetView").setProperty("/busy", true);
		        oModel.update(sMaterialPath, oMaterial, {
		        success : function() {
			        if (self.getModel("MaterialView"))
				        self.getModel("MaterialView").setProperty("/busy", false);
			        if (self.getModel("MaterialDetView"))
				        self.getModel("MaterialDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("MaterialView"))
				        self.getModel("MaterialView").setProperty("/busy", false);
			        if (self.getModel("MaterialDetView"))
				        self.getModel("MaterialDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteMaterialItem : function(oMaterial, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for MaterialSet entity
		        var sMaterialPath = oModel.createKey("/MaterialSet", {
		        ProjectNo : oMaterial.ProjectNo,
		        Day : oMaterial.Day,
		        Key : oMaterial.Key
		        });
		        oModel.remove(sMaterialPath, {
		        success : function() {
			        self.getModel("MaterialView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("MaterialView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addMaterialDetItem : function(oMaterial, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sMaterialDetPath = "/MaterialDetSet";
		        self.getModel("MaterialDetView").setProperty("/busy", true);
		        oModel.create(sMaterialDetPath, oMaterial, {
		        success : function() {
			        self.getModel("MaterialDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("MaterialDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateMaterialDetItem : function(oMaterial, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for MaterialDet entity
		        var sMaterialDetPath = oModel.createKey("/MaterialDetSet", {
		        ProjectNo : oMaterial.ProjectNo,
		        Day : oMaterial.Day,
		        InternalNo : oMaterial.InternalNo,
		        LineNo : oMaterial.LineNo,
		        CostCode : oMaterial.CostCode,
		        ValidationLine : oMaterial.ValidationLine
		        });
		        if (self.getModel("MaterialDetView"))
			        self.getModel("MaterialDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sMaterialDetPath, oMaterial, {
		        success : function() {
			        if (self.getModel("MaterialDetView"))
				        self.getModel("MaterialDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("MaterialDetView"))
				        self.getModel("MaterialDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteMaterialDetItem : function(oMaterial, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for MaterialDet entity
		        var sMaterialDetPath = oModel.createKey("/MaterialDetSet", {
		        ProjectNo : oMaterial.ProjectNo,
		        Day : oMaterial.Day,
		        InternalNo : oMaterial.InternalNo,
		        LineNo : oMaterial.LineNo,
		        CostCode : oMaterial.CostCode,
		        ValidationLine : oMaterial.ValidationLine
		        });
		        self.getModel("MaterialDetView").setProperty("/busy", true);
		        oModel.remove(sMaterialDetPath, {
		        success : function() {
			        self.getModel("MaterialDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("MaterialDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for Internal and Internal Details
	         **/
	        addInternalItem : function(oInternal, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sInternalPath = "/InternalSet";
		        self.getModel("InternalView").setProperty("/busy", true);
		        oModel.create(sInternalPath, oInternal, {
		        success : function() {
			        self.getModel("InternalView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("InternalView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateInternalItem : function(oInternal, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for InternalSet entity
		        var sInternalPath = oModel.createKey("/InternalSet", {
		        ProjectNo : oInternal.ProjectNo,
		        Day : oInternal.Day,
		        Key : oInternal.Key
		        });
		        if (self.getModel("InternalView"))
			        self.getModel("InternalView").setProperty("/busy", true);
		        if (self.getModel("InternalDetView"))
			        self.getModel("InternalDetView").setProperty("/busy", true);
		        oModel.update(sInternalPath, oInternal, {
		        success : function() {
			        if (self.getModel("InternalView"))
				        self.getModel("InternalView").setProperty("/busy", false);
			        if (self.getModel("InternalDetView"))
				        self.getModel("InternalDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("InternalView"))
				        self.getModel("InternalView").setProperty("/busy", false);
			        if (self.getModel("InternalDetView"))
				        self.getModel("InternalDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteInternalItem : function(oInternal, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for InternalSet entity
		        var sInternalPath = oModel.createKey("/InternalSet", {
		        ProjectNo : oInternal.ProjectNo,
		        Day : oInternal.Day,
		        Key : oInternal.Key
		        });
		        oModel.remove(sInternalPath, {
		        success : function() {
			        self.getModel("InternalView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("InternalView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addInternalDetItem : function(oInternal, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sInternalDetPath = "/InternalDetSet";
		        self.getModel("InternalDetView").setProperty("/busy", true);
		        oModel.create(sInternalDetPath, oInternal, {
		        success : function() {
			        self.getModel("InternalDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("InternalDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateInternalDetItem : function(oInternal, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for InternalDet entity
		        var sInternalDetPath = oModel.createKey("/InternalDetSet", {
		        ProjectNo : oInternal.ProjectNo,
		        Day : oInternal.Day,
		        InternalNo : oInternal.InternalNo,
		        LineNo : oInternal.LineNo,
		        ValidationLine : oInternal.ValidationLine,
		        CostCode : oInternal.CostCode
		        });
		        if (self.getModel("InternalDetView"))
			        self.getModel("InternalDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sInternalDetPath, oInternal, {
		        success : function() {
			        if (self.getModel("InternalDetView"))
				        self.getModel("InternalDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("InternalDetView"))
				        self.getModel("InternalDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteInternalDetItem : function(oInternal, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for InternalDet entity
		        var sInternalDetPath = oModel.createKey("/InternalDetSet", {
		        ProjectNo : oInternal.ProjectNo,
		        Day : oInternal.Day,
		        InternalNo : oInternal.InternalNo,
		        LineNo : oInternal.LineNo,
		        ValidationLine : oInternal.ValidationLine,
		        CostCode : oInternal.CostCode
		        });
		        self.getModel("InternalDetView").setProperty("/busy", true);
		        oModel.remove(sInternalDetPath, {
		        success : function() {
			        self.getModel("InternalDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("InternalDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for Quantity and Quantity Details
	         **/
	        addQuantityItem : function(oQuantity, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sQuantityPath = "/QuantitySet";
		        self.getModel("QuantityView").setProperty("/busy", true);
		        oModel.create(sQuantityPath, oQuantity, {
		        success : function() {
			        self.getModel("QuantityView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("QuantityView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateQuantityItem : function(oQuantity, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for QuantitySet entity
		        var sQuantityPath = oModel.createKey("/QuantitySet", {
		        ProjectNo : oQuantity.ProjectNo,
		        Day : oQuantity.Day,
		        Key : oQuantity.Key
		        });
		        if (self.getModel("QuantityView"))
			        self.getModel("QuantityView").setProperty("/busy", true);
		        if (self.getModel("QuantityDetView"))
			        self.getModel("QuantityDetView").setProperty("/busy", true);
		        oModel.update(sQuantityPath, oQuantity, {
		        success : function() {
			        if (self.getModel("QuantityView"))
				        self.getModel("QuantityView").setProperty("/busy", false);
			        if (self.getModel("QuantityDetView"))
				        self.getModel("QuantityDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("QuantityView"))
				        self.getModel("QuantityView").setProperty("/busy", false);
			        if (self.getModel("QuantityDetView"))
				        self.getModel("QuantityDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteQuantityItem : function(oQuantity, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for QuantitySet entity
		        var sQuantityPath = oModel.createKey("/QuantitySet", {
		        ProjectNo : oQuantity.ProjectNo,
		        Day : oQuantity.Day,
		        Key : oQuantity.Key
		        });
		        oModel.remove(sQuantityPath, {
		        success : function() {
			        self.getModel("QuantityView").setProperty("/busy", false);
			        //self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("QuantityView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        addQuantityDetItem : function(oQuantity, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        var sQuantityDetPath = "/QuantityDetSet";
		        self.getModel("QuantityDetView").setProperty("/busy", true);
		        oModel.create(sQuantityDetPath, oQuantity, {
		        success : function() {
			        self.getModel("QuantityDetView").setProperty("/busy", false);
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("QuantityDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        updateQuantityDetItem : function(oQty, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for QuantityDet entity
		        var sQtyDetPath = oModel.createKey("/QuantityDetSet", {
		        ProjectNo : oQty.ProjectNo,
		        Day : oQty.Day,
		        InternalNo : oQty.InternalNo,
		        LineNo : oQty.LineNo,
		        ValidationLine : oQty.ValidationLine,
		        });
		        if (self.getModel("QuantityDetView"))
			        self.getModel("QuantityDetView").setProperty("/busy", true);
		        if (self.getModel("PreviewView"))
			        self.getModel("PreviewView").setProperty("/busy", true);
		        oModel.update(sQtyDetPath, oQty, {
		        success : function() {
			        if (self.getModel("QuantityDetView"))
				        self.getModel("QuantityDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("successUpdate"));
			        self.getModel().refresh();
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self.getModel("QuantityDetView"))
				        self.getModel("QuantityDetView").setProperty("/busy", false);
			        if (self.getModel("PreviewView"))
				        self.getModel("PreviewView").setProperty("/busy", false);
			        MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        deleteQuantityDetItem : function(oQty, oController) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for QantityDet entity
		        var sQuantityDetPath = oModel.createKey("/QuantityDetSet", {
		        ProjectNo : oQty.ProjectNo,
		        Day : oQty.Day,
		        InternalNo : oQty.InternalNo,
		        LineNo : oQty.LineNo,
		        ValidationLine : oQty.ValidationLine,
		        });
		        self.getModel("QuantityDetView").setProperty("/busy", true);
		        oModel.remove(sQuantityDetPath, {
		        success : function() {
			        self.getModel("QuantityDetView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        self.getModel("QuantityDetView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         ******************************************** Match Code views ********************************************
	         **/
	        /** Personnel Consolidated      **/
	        onRequestPersonnel : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        self._EmployeeSearchHelp = SearchHelps.initSearchEmployee(oInput, self);
		        if (self._EmployeeSearchHelp) {
			        self._EmployeeSearchHelp.open();
		        }
	        },
	        onSubmitPersonnel : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        // Getting Employee no
		        var sEmployeeNo = oInput.getValue();
		        // Getting Project Day
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oCountry = oInScreenModel.getProperty("/ProjectSet/Country");
		        var oLabor = {
		        EmployeeNo : sEmployeeNo,
		        ProjectNo : sProjectNo,
		        Day : sDay
		        };
		        if (sDay && sEmployeeNo && sEmployeeNo.trim() !== "") {
			        var aEmployeeSet = [];
			        var oDfrd = self.getFillEmployeeSet(oLabor, self, aEmployeeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oLaborEditDialog) {
					        oInputModel = this._oLaborEditDialog.getModel("Input").getData();
				        }
				        oInputModel.ActivityType = aEmployeeSet[0].ActivityType;
				        oInputModel.EmployeeName = aEmployeeSet[0].EmployeeName;
				        oInputModel.Mu = aEmployeeSet[0].Mu;
				        oInputModel.MuName = aEmployeeSet[0].MuName;
				        oInputModel.Price = aEmployeeSet[0].Price;
				        if (oCountry === "QC") {
					        oInputModel.Ccq = aEmployeeSet[0].Ccq;
					        oInputModel.Rule = aEmployeeSet[0].Rule;
				        }
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oLaborEditDialog) {
					        this._oLaborEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        onSubmitPersonnelTemp : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        // Getting Employee no
		        var sEmployeeNo = oInput.getValue();
		        // Getting Project Day
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oLabor = {
		        EmployeeNo : sEmployeeNo,
		        ProjectNo : sProjectNo,
		        Day : sDay
		        };
		        if (sDay && sEmployeeNo && sEmployeeNo.trim() !== "") {
			        var aEmployeeSet = [];
			        var oDfrd = self.getFillEmployeeSet(oLabor, self, aEmployeeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oTempEditDialog) {
					        oInputModel = this._oTempEditDialog.getModel("Input").getData();
				        }
				        oInputModel.EmployeeName = aEmployeeSet[0].EmployeeName;
				        //oInputModel.Price = aEmployeeSet[0].Price;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oTempEditDialog) {
					        this._oTempEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        onSubmitRecNo : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        // Getting Employee no
		        var sForemanNo = oInput.getValue();
		        // Getting Project Day
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oLabor = {
		        EmployeeNo : sForemanNo,
		        ProjectNo : sProjectNo,
		        Day : sDay
		        };
		        if (sDay && sForemanNo && sForemanNo.trim() !== "") {
			        var aEmployeeSet = [];
			        var oDfrd = self.getFillEmployeeSet(oLabor, self, aEmployeeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        if (this._oCostCodeAddDialog) {
					        // Setting values of corresponding input fields on screen with results
					        var oInputModel = this._oCostCodeAddDialog.getModel("Input").getData();
					        oInputModel.ForemanName = aEmployeeSet[0].EmployeeName;
					        // Setting model with filled values
					        this._oCostCodeAddDialog.getModel("Input").setData(oInputModel);
				        }
				        if (this._oCostCodeEditDialog) {
					        var oInputModel = this._oCostCodeEditDialog.getModel("Input").getData();
					        var oCarousel = this.getView().byId("editCarousel");
					        var oPage = oCarousel.getActivePage();
					        var oIndex = oCarousel._getPageNumber(oPage);
					        oInputModel[oIndex].ForemanName = aEmployeeSet[0].EmployeeName;
					        // Setting model with filled values
					        this._oCostCodeEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillEmployeeSet : function(oLabor, oController, aResults) {
		        var self = oController;
		        var oCountry = self.getModel("InScreenFilters").getProperty("/ProjectSet/Country");
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillEmployeeSet entity
		        var sEmpPath = oModel.createKey("/FillEmployeeSet", {
		        ProjectNo : oLabor.ProjectNo,
		        Day : oLabor.Day,
		        EmployeeNo : oLabor.EmployeeNo
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for employee set
		        oModel.read(sEmpPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.EmployeeNo) {
				        // Saving EmployeeSet in array aResults      
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        //SR 556242
			        if (oCountry === "QC" && aRes.RailCantech === "X" && self._oMasterAddDialog
			            && (self.getModel("LaborView") || self.getModel("LaborDetView"))) {
				        self.byId("idRule").setRequired(false);
				        self.byId("idCCQ").setRequired(false);
				        self.byId("idActivityType").setRequired(false);
			        }
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /** Activity Type Consolidated  **/
	        onRequestEmployeeActivity : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        var sDay = formatter.formatODataDate(self.getModel("InScreenFilters")
		            .getProperty("/ProjectSet/Day"));
		        var sEmployeeNo = oInput.getModel("Input").getProperty("/EmployeeNo");
		        var sScreen = "Labor";
		        if (sDay && sEmployeeNo && sDay !== "" && sEmployeeNo !== "") {
			        // i18n resource bundle
			        var oResourceBundle = this.getResourceBundle();
			        // Initialising value help dialog for activity search                                              
			        self._ActivitySearchHelp = SearchHelps
			            .initSearchActivity(oInput, sDay, sEmployeeNo, sScreen, self);
			        if (self._ActivitySearchHelp) {
				        self._ActivitySearchHelp.open();
			        }
		        }
	        },
	        onRequestEquipActivity : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        var sDay = formatter.formatODataDate(self.getModel("InScreenFilters")
		            .getProperty("/ProjectSet/Day"));
		        var sEquipmentNo = oInput.getModel("Input").getProperty("/EquipmentNo");
		        var sScreen = "Equipment";
		        if (sDay && sEquipmentNo && sDay !== "" && sEquipmentNo !== "") {
			        // i18n resource bundle
			        var oResourceBundle = this.getResourceBundle();
			        // Initialising value help dialog for activity search 
			        self._ActivitySearchHelp = SearchHelps
			            .initSearchActivity(oInput, sDay, sEquipmentNo, sScreen, self);
			        if (self._ActivitySearchHelp) {
				        self._ActivitySearchHelp.open();
			        }
		        }
	        },
	        /** CCQ Consolidated      **/
	        onRequestCCQ : function(oEvent) {
		        var self = this;
		        // i18n resource bundle
		        var oResourceBundle = this.getResourceBundle();
		        // input field
		        var oInput = oEvent.getSource();
		        // Creating single select with simple table value help dialog 
		        // Passing Input field object, title of VHD, key and description key of returned token as parameters
		        self._CcqSearchHelp = SearchHelps.createSingleSelectOnlyVHD(oInput, oResourceBundle
		            .getText("ccq"), "Ccq", "Ccq", self);
		        if (self._CcqSearchHelp) {
			        // Binding SHActivitySet table
			        var oTable = self._CcqSearchHelp.getTable();
			        var oViewModel = self._CcqSearchHelp.getModel("VHDialogView");
			        SearchHelps.bindCcqSet(oTable, oViewModel, self);
			        self._CcqSearchHelp.open();
		        }
	        },
	        /** Rule Consolidated     **/
	        onRequestRule : function(oEvent) {
		        var self = this;
		        // i18n resource bundle
		        var oResourceBundle = this.getResourceBundle();
		        // input field
		        var oInput = oEvent.getSource();
		        // Creating single select with simple table value help dialog
		        // Passing Input field object, title of VHD, key and description key of returned token as parameters
		        self._RuleSearchHelp = SearchHelps.createSingleSelectOnlyVHD(oInput, oResourceBundle
		            .getText("rule"), "Rule", "Rule", self);
		        if (self._RuleSearchHelp) {
			        // Binding SHActivitySet table
			        var oTable = self._RuleSearchHelp.getTable();
			        var oViewModel = self._RuleSearchHelp.getModel("VHDialogView");
			        SearchHelps.bindRuleSet(oTable, oViewModel, self);
			        self._RuleSearchHelp.open();
		        }
	        },
	        /** Equipment Consolidated      **/
	        onRequestEquipNo : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        self._EquipSearchHelp = EquipmentSH.initSearchEquip(oInput, self);
		        if (self._EquipSearchHelp) {
			        self._EquipSearchHelp.open();
		        }
	        },
	        onSubmitEquip : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        // Getting Equipment no
		        var sEquipmentNo = oInput.getValue();
		        // Getting Project Day
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oEquip = {
		        EquipmentNo : sEquipmentNo,
		        ProjectNo : sProjectNo,
		        Day : sDay
		        };
		        if (sDay && sEquipmentNo && sEquipmentNo.trim() !== "") {
			        var aEquipSet = [];
			        var oDfrd = self.getFillEquipSet(oEquip, self, aEquipSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oEquipEditDialog) {
					        oInputModel = this._oEquipEditDialog.getModel("Input").getData();
				        }
				        oInputModel.ActivityType = aEquipSet[0].ActivityType;
				        oInputModel.EquipmentName = aEquipSet[0].EquipmentName;
				        oInputModel.Mu = aEquipSet[0].Mu;
				        oInputModel.MuName = aEquipSet[0].MuName;
				        oInputModel.Price = aEquipSet[0].Price;
				        oInputModel.FuelFlag = aEquipSet[0].FuelFlag;
				        oInputModel.Unit = aEquipSet[0].Unit;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oEquipEditDialog) {
					        this._oEquipEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillEquipSet : function(oEquip, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillEmployeeSet entity
		        var sEquipPath = oModel.createKey("/FillEquipmentSet", {
		        ProjectNo : oEquip.ProjectNo,
		        Day : oEquip.Day,
		        EquipmentNo : oEquip.EquipmentNo
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        if (self._oEquipEditDialog)
			        self._oEquipEditDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for employee set
		        oModel.read(sEquipPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.EquipmentNo) {
				        // Saving EmployeeSet in array aResults      
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        if (self._oEquipEditDialog)
				        self._oEquipEditDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        if (self._oEquipEditDialog)
				        self._oEquipEditDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /** EquipmentStatus details view**/
	        onRequestEquipStatus : function(oEvent) {
		        var self = this;
		        // i18n resource bundle
		        var oResourceBundle = this.getResourceBundle();
		        // input field
		        var oInput = oEvent.getSource();
		        // Creating single select with simple table value help dialog
		        // Passing Input field object, title of VHD, key and description key of returned token as parameters
		        self._EquipStatusSearchHelp = SearchHelps
		            .createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("status"), "Status", "Status", self);
		        if (self._EquipStatusSearchHelp) {
			        // Binding SHActivitySet table
			        var oTable = self._EquipStatusSearchHelp.getTable();
			        var oViewModel = self._EquipStatusSearchHelp.getModel("VHDialogView");
			        EquipmentSH.bindEquipStatusSet(oTable, oViewModel, self);
			        self._EquipStatusSearchHelp.open();
		        }
	        },
	        /**
	         *********************************************** Requests for match codes ***********************************
	         **/
	        /** Match code view for cost code**/
	        onRequestCostCode : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        var oInScreenModel = self.getModel("InScreenFilters");
		        self._CostCodeSearchHelp = SearchHelps.initSearchCostCode(oInput, oInScreenModel, self);
		        if (self._CostCodeSearchHelp) {
			        self._CostCodeSearchHelp.open();
		        }
	        },
	        onSubmitCostCode : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sCostCode = oInput.getValue();
		        // Getting Project Day
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oLaborDet = {
		        ProjectNo : sProjectNo,
		        CostCode : sCostCode
		        };
		        if (sCostCode && sProjectNo.trim() !== "") {
			        var aCostCodeSet = [];
			        var oDfrd = self.getFillCostCodeSet(oLaborDet, self, aCostCodeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        if (this._oCostCodeAddDialog) {
					        // Setting values of corresponding input fields on screen with results
					        var oInputModel = this._oCostCodeAddDialog.getModel("Input").getData();
					        oInputModel.CostCodeDes = aCostCodeSet[0].CostCodeDes;
					        // Setting model with filled values
					        this._oCostCodeAddDialog.getModel("Input").setData(oInputModel);
				        }
				        if (this._oCostCodeEditDialog) {
					        var oInputModel = this._oCostCodeEditDialog.getModel("Input").getData();
					        var oCarousel = this.getView().byId("editCarousel");
					        var oPage = oCarousel.getActivePage();
					        var oIndex = oCarousel._getPageNumber(oPage);
					        oInputModel[oIndex].CostCodeDes = aCostCodeSet[0].CostCodeDes;
					        // Setting model with filled values
					        this._oCostCodeEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        onSubmitCostCodeQty : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sCostCode = oInput.getValue();
		        // Getting Project Day
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oLaborDet = {
		        ProjectNo : sProjectNo,
		        CostCode : sCostCode
		        };
		        if (sCostCode && sProjectNo.trim() !== "") {
			        var aCostCodeSet = [];
			        var oDfrd = self.getFillCostCodeSet(oLaborDet, self, aCostCodeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        if (this._oMasterAddDialog) {
					        // Setting values of corresponding input fields on screen with results
					        var oInputModel = this._oMasterAddDialog.getModel("Input").getData();
					        oInputModel.CostCodeDes = aCostCodeSet[0].CostCodeDes;
					        oInputModel.Unit = aCostCodeSet[0].Unit;
					        // Setting model with filled values
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        }
				        if (this._oQtyEditDialog) {
					        // Setting values of corresponding input fields on screen with results
					        var oInputModel = this._oQtyEditDialog.getModel("Input").getData();
					        oInputModel.CostCodeDes = aCostCodeSet[0].CostCodeDes;
					        oInputModel.Unit = aCostCodeSet[0].Unit;
					        // Setting model with filled values
					        this._oQtyEditDialog.getModel("Input").setData(oInputModel);
				        }
				        if (this._oCostCodeAddDialog) {
					        // Setting values of corresponding input fields on screen with results
					        var oInputModel = this._oCostCodeAddDialog.getModel("Input").getData();
					        oInputModel.CostCodeDes = aCostCodeSet[0].CostCodeDes;
					        oInputModel.Unit = aCostCodeSet[0].Unit;
					        // Setting model with filled values
					        this._oCostCodeAddDialog.getModel("Input").setData(oInputModel);
				        }
				        if (this._oCostCodeEditDialog) {
					        var oInputModel = this._oCostCodeEditDialog.getModel("Input").getData();
					        var oCarousel = this.getView().byId("editCarousel");
					        var oPage = oCarousel.getActivePage();
					        var oIndex = oCarousel._getPageNumber(oPage);
					        oInputModel[oIndex].CostCodeDes = aCostCodeSet[0].CostCodeDes;
					        oInputModel[oIndex].Unit = aCostCodeSet[0].Unit;
					        // Setting model with filled values
					        this._oCostCodeEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        /**
	         * Requests for match codes
	         **/
	        getFillCostCodeSet : function(oLaborDet, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillEmployeeSet entity
		        var sCostCodePath = oModel.createKey("/FillCostCodeSet", {
		        ProjectNo : oLaborDet.ProjectNo,
		        CostCode : oLaborDet.CostCode
		        });
		        // Setting screen to busy state
		        if (this._oCostCodeAddDialog)
			        this._oCostCodeAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for employee set
		        oModel.read(sCostCodePath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.CostCodeDes) {
				        // Saving CostCodeSet in array aResults      
				        aResults.push(aRes);
			        }
			        if (this._oCostCodeAddDialog)
				        this._oCostCodeAddDialog.getModel("Form").setProperty("/busy", false);
			        if (this._oCostCodeEditDialog)
				        this._oCostCodeEditDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /**
	         * Requests for match codes for Bonus View
	         **/
	        /*Activity Type*/
	        onRequestActivityStdN : function(oEvent) {
		        var self = this;
		        var oResourceBundle = this.getResourceBundle();
		        var oInput = oEvent.getSource();
		        var sDateFormat = oInput.getModel("user").getProperty("/DateFormat");
		        self._ActivityBonusSearch = SearchHelps.initActivityBonusSearch(oInput, oResourceBundle
		            .getText("activityType"), "ActivityType", "ActivityType", self);
		        if (self._ActivityBonusSearch) {
			        var oTable = self._ActivityBonusSearch.getTable();
			        var oViewModel = self._ActivityBonusSearch.getModel("VHDialogView");
			        SearchHelps.bindActivityBonusSet(oTable, sDateFormat, oViewModel, self);
			        self._ActivityBonusSearch.open();
		        }
	        },
	        onSubmitActivityType : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sActivityType = oInput.getValue();
		        var sEmployeeNo = oInput.getModel("Input").getProperty("/EmployeeNo");
		        var oActivityType = {
		        EmployeeNo : sEmployeeNo,
		        ActivityType : sActivityType
		        };
		        if (sEmployeeNo && sActivityType && sActivityType.trim() !== "") {
			        var aActivityTypeSet = [];
			        var oDfrd = self.getFillActivityTypeSet(oActivityType, self, aActivityTypeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oLaborEditDialog) {
					        oInputModel = this._oLaborEditDialog.getModel("Input").getData();
				        }
				        oInputModel.Price = aActivityTypeSet[0].Price;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oLaborEditDialog) {
					        this._oLaborEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillActivityTypeSet : function(oActivityType, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillActivityTypeSet entity
		        var sActivityPath = oModel.createKey("/FillActivityTypeSet", {
		        EmployeeNo : oActivityType.EmployeeNo,
		        ActivityType : oActivityType.ActivityType
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for activityType set
		        oModel.read(sActivityPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.ActivityType) {
				        // Saving ActivityTypeSet in array aResults	
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        onSubmitActivityTypeEquip : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sActivityType = oInput.getValue();
		        var sEquipmentNo = oInput.getModel("Input").getProperty("/EquipmentNo");
		        var oActivityType = {
		        EquipmentNo : sEquipmentNo,
		        ActivityType : sActivityType
		        };
		        if (sActivityType && sActivityType.trim() !== "") {
			        var aActivityTypeSet = [];
			        var oDfrd = self.getFillEquipmentPriceSet(oActivityType, self, aActivityTypeSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oEquipEditDialog) {
					        oInputModel = this._oEquipEditDialog.getModel("Input").getData();
				        }
				        oInputModel.Price = aActivityTypeSet[0].Price;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oEquipEditDialog) {
					        this._oEquipEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillEquipmentPriceSet : function(oActivityType, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillActivityTypeSet entity
		        var sActivityPath = oModel.createKey("/FillEquipmentPriceSet", {
		        EquipmentNo : oActivityType.EquipmentNo,
		        ActivityType : oActivityType.ActivityType
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for activityType set
		        oModel.read(sActivityPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.ActivityType) {
				        // Saving ActivityTypeSet in array aResults	
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        //Request Bonus
	        onRequestBonus : function(oEvent) {
		        var self = this;
		        var oResourceBundle = this.getResourceBundle();
		        var oInput = oEvent.getSource();
		        var sDateFormat = oInput.getModel("user").getProperty("/DateFormat");
		        var sEmployeeNo = oInput.getModel("Input").getProperty("/EmployeeNo");
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
		        self._BonusSearch = SearchHelps
		            .initBonusSearch(oInput, sEmployeeNo, sDay, sDateFormat, self);
		        if (self._BonusSearch) {
			        self._BonusSearch.open();
		        }
	        },
	        /*Request Type of Hour*/
	        onRequestTypeOfHour : function(oEvent) {
		        var self = this;
		        var oResourceBundle = this.getResourceBundle();
		        var oInput = oEvent.getSource();
		        var sDay = self._sDay;
		        if (self.getModel("LaborDetView")) {
			        var sEmployeeNo = oInput.getModel("Input").getProperty("/EmployeeNo");
		        }
		        if (self.getModel("PreviewView")) {
			        var oContext = oInput.getBindingContext("preview");
			        var sPath = oContext.getPath();
			        var oItem = oContext.getProperty(sPath);
			        var sEmployeeNo = oItem.EmployeeNo;
		        }
		        var sDateFormat = oInput.getModel("user").getProperty("/DateFormat");
		        self._TypeOfHourSearchHelp = SearchHelps.initTypeOfHourSearch(oInput, oResourceBundle
		            .getText("timePointingCode"), "Type", "Type", self);
		        if (self._TypeOfHourSearchHelp) {
			        var oTable = self._TypeOfHourSearchHelp.getTable();
			        var oViewModel = self._TypeOfHourSearchHelp.getModel("VHDialogView");
			        SearchHelps
			            .bindTypeOfHourSet(oTable, sDateFormat, oViewModel, sDay, sEmployeeNo, self);
			        self._TypeOfHourSearchHelp.open();
		        }
	        },
	        //Request WBS element
	        onRequestWBS : function(oEvent) {
		        var self = this;
		        var oResourceBundle = this.getResourceBundle();
		        var oInput = oEvent.getSource();
		        var sScreen;
		        if (self.getModel("InternalView") || self.getModel("InternalDetView")) {
			        sScreen = "Int";
		        } else {
			        sScreen = "";
		        }
		        self._WBSElementSearchHelp = SearchHelps.initWBSElementSearch(oInput, oResourceBundle
		            .getText("wbsElement"), "WBSElement", "WBSElement", sScreen, self);
		        if (self._WBSElementSearchHelp) {
			        var oTable = self._WBSElementSearchHelp.getTable();
			        var oViewModel = self._WBSElementSearchHelp.getModel("VHDialogView");
			        SearchHelps.bindWBSElementSet(oTable, oViewModel, self);
			        self._WBSElementSearchHelp.open();
		        }
	        },
	        onSubmitWBS : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sWbsElement = oInput.getValue();
		        if (sWbsElement && sWbsElement.trim() !== "") {
			        var aWBSSet = [];
			        var oDfrd = self.getFillWBSNameSet(sWbsElement, self, aWBSSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oInternalEditDialog) {
					        oInputModel = this._oInternalEditDialog.getModel("Input").getData();
				        }
				        oInputModel.Name = aWBSSet[0].Name;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oInternalEditDialog) {
					        this._oInternalEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillWBSNameSet : function(sWbsElement, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillWBSNameSet entity
		        var sWBSPath = oModel.createKey("/FillWBSNameSet", {
			        WbsElement : sWbsElement
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for WBSName set
		        oModel.read(sWBSPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.WbsElement) {
				        // Saving WBSNameSet in array aResults	
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /*Request for Material Standard Search Help*/
	        onRequestMaterialStd : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        self._oMaterialStdSH = MaterialSearchHelp.initSearchMaterialStd(oInput, self);
		        if (self._oMaterialStdSH) {
			        self._oMaterialStdSH.open();
		        }
	        },
	        getFillMaterialSet : function(oItem, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillEmployeeSet entity
		        var sMaterialPath = oModel.createKey("/FillMaterialSet", {
		        ProjectNo : oItem.ProjectNo,
		        MaterialNo : oItem.MaterialNo,
		        Screen : oItem.Screen
		        });
		        // Setting screen to busy state						
		        if (self._oMasterAddDialog) {
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        } else if (self._oRentalEditDialog) {
			        self._oRentalEditDialog.getModel("Form").setProperty("/busy", true);
		        } else if (self._oSubConEditDialog) {
			        self._oSubConEditDialog.getModel("Form").setProperty("/busy", true);
		        } else if (self._oMaterialEditDialog) {
			        self._oMaterialEditDialog.getModel("Form").setProperty("/busy", true);
		        } else if (self._oTempEditDialog) {
			        self._oTempEditDialog.getModel("Form").setProperty("/busy", true);
		        } else if (self._oInternalEditDialog) {
			        self._oInternalEditDialog.getModel("Form").setProperty("/busy", true);
		        }
		        // Fetching data for material set
		        oModel.read(sMaterialPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.ProjectNo) {
				        // Saving CostCodeSet in array aResults      
				        aResults.push(aRes);
			        }
			        if (this._oMasterAddDialog) {
				        this._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oRentalEditDialog) {
				        this._oRentalEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oSubConEditDialog) {
				        this._oSubConEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oMaterialEditDialog) {
				        this._oMaterialEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oTempEditDialog) {
				        this._oTempEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oInternalEditDialog) {
				        this._oInternalEditDialog.getModel("Form").setProperty("/busy", false);
			        }
			        oDeferred.resolve();
		        }.bind(self),
		        error : function(oError) {
			        if (this._oMasterAddDialog) {
				        this._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oRentalEditDialog) {
				        this._oRentalEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oSubConEditDialog) {
				        this._oSubConEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oMaterialEditDialog) {
				        this._oMaterialEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oTempEditDialog) {
				        this._oTempEditDialog.getModel("Form").setProperty("/busy", false);
			        } else if (this._oInternalEditDialog) {
				        this._oInternalEditDialog.getModel("Form").setProperty("/busy", false);
			        }
			        oDeferred.reject();
		        }.bind(self)
		        });
		        return oDeferred.promise();
	        },
	        /** Supplier Consolidated	 **/
	        onRequestSupplier : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        self._SupplierSearchHelp = SupplierSH.initSearchSupplier(oInput, self);
		        if (self._SupplierSearchHelp) {
			        self._SupplierSearchHelp.open();
		        }
	        },
	        onSubmitSupplier : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sSupplierNo = oInput.getValue();
		        var sPurchaseDoc = self.byId("idPurchasingDoc").getValue();
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oSupplier = {
		        ProjectNo : sProjectNo,
		        SupplierNo : sSupplierNo,
		        PurchaseDoc : sPurchaseDoc
		        };
		        if (sProjectNo && sSupplierNo && sSupplierNo.trim() !== "") {
			        var aSupplierSet = [];
			        var oDfrd = self.getFillSupplierSet(oSupplier, self, aSupplierSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oRentalEditDialog) {
					        oInputModel = this._oRentalEditDialog.getModel("Input").getData();
				        } else if (this._oSubConEditDialog) {
					        oInputModel = this._oSubConEditDialog.getModel("Input").getData();
				        } else if (this._oMaterialEditDialog) {
					        oInputModel = this._oMaterialEditDialog.getModel("Input").getData();
				        } else if (this._oTempEditDialog) {
					        oInputModel = this._oTempEditDialog.getModel("Input").getData();
				        }
				        oInputModel.SupplierName = aSupplierSet[0].SupplierName;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oRentalEditDialog) {
					        this._oRentalEditDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oSubConEditDialog) {
					        this._oSubConEditDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oMaterialEditDialog) {
					        this._oMaterialEditDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oTempEditDialog) {
					        this._oTempEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillSupplierSet : function(oSupplier, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillSupplierSet entity
		        var sSupPath = oModel.createKey("/FillSupplierSet", {
		        ProjectNo : oSupplier.ProjectNo,
		        SupplierNo : oSupplier.SupplierNo,
		        PurchaseDoc : oSupplier.PurchaseDoc
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for supplier set
		        oModel.read(sSupPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.SupplierNo) {
				        // Saving SupplierSet in array aResults	
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        /** PurchaseDoc Consolidated **/
	        onRequestPurchaseDoc : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        var oResourceBundle = self.getResourceBundle();
		        var sHeaderTitle = oResourceBundle.getText("PurchaseOrder");
		        self._PurchaseDocSearchHelp = PurchaseOrdSH
		            .initSearchPurchaseDoc(oInput, sHeaderTitle, self);
		        if (self._PurchaseDocSearchHelp) {
			        self._PurchaseDocSearchHelp.open();
		        }
	        },
	        /**Agreement**/
	        onRequestAgreement : function(oEvent) {
		        var self = this;
		        var oInput = oEvent.getSource();
		        var oResourceBundle = self.getResourceBundle();
		        var sHeaderTitle = oResourceBundle.getText("Agreement");
		        self._AgreementSearchHelp = PurchaseOrdSH
		            .initSearchPurchaseDoc(oInput, sHeaderTitle, self);
		        if (self._AgreementSearchHelp) {
			        self._AgreementSearchHelp.open();
		        }
	        },
	        /*Purchase Order Item*/
	        onRequestItem : function(oEvent) {
		        var self = this;
		        var oResourceBundle = this.getResourceBundle();
		        var oInput = oEvent.getSource();
		        var sPurchaseDoc = oInput.getModel("Input").getProperty("/PurchaseDoc");
		        self._ItemSearchHelp = PurchaseOrdSH.initItemSearch(oInput, oResourceBundle
		            .getText("item"), "Item", "Item", self);
		        if (self._ItemSearchHelp) {
			        var oTable = self._ItemSearchHelp.getTable();
			        var oViewModel = self._ItemSearchHelp.getModel("VHDialogView");
			        PurchaseOrdSH.bindItemSet(oTable, sPurchaseDoc, oViewModel, self);
			        self._ItemSearchHelp.open();
		        }
	        },
	        /*Agreement Item*/
	        onRequestAgrmtItem : function(oEvent) {
		        var self = this;
		        var oResourceBundle = this.getResourceBundle();
		        var oInput = oEvent.getSource();
		        var sAgreement = oInput.getModel("Input").getProperty("/Agreement");
		        self._ItemSearchHelp = PurchaseOrdSH.initItemSearch(oInput, oResourceBundle
		            .getText("item"), "Item", "Item", self);
		        if (self._ItemSearchHelp) {
			        var oTable = self._ItemSearchHelp.getTable();
			        var oViewModel = self._ItemSearchHelp.getModel("VHDialogView");
			        PurchaseOrdSH.bindItemSet(oTable, sAgreement, oViewModel, self);
			        self._ItemSearchHelp.open();
		        }
	        },
	        onSubmitItem : function(oEvent) {
		        var self = this;
		        // Multi input field
		        var oInput = oEvent.getSource();
		        var sItem = oInput.getValue();
		        var sPurchaseDoc = self.byId("idPurchasingDoc").getValue();
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        var oRental = {
		        ProjectNo : sProjectNo,
		        PurchaseDoc : sPurchaseDoc,
		        Item : sItem
		        };
		        if (sProjectNo !== "") {
			        var aRentalSet = [];
			        var oDfrd = self.getFillRentalSet(oRental, self, aRentalSet);
			        oDfrd.then(
			        // Success handler
			        function() {
				        // Setting values of corresponding input fields on screen with results
				        var oInputModel;
				        if (this._oMasterAddDialog) {
					        oInputModel = this._oMasterAddDialog.getModel("Input").getData();
				        } else if (this._oRentalEditDialog) {
					        oInputModel = this._oRentalEditDialog.getModel("Input").getData();
				        } else if (this._oSubConEditDialog) {
					        oInputModel = this._oSubConEditDialog.getModel("Input").getData();
				        } else if (this._oMaterialEditDialog) {
					        oInputModel = this._oMaterialEditDialog.getModel("Input").getData();
				        } else if (this._oTempEditDialog) {
					        oInputModel = this._oTempEditDialog.getModel("Input").getData();
				        }
				        oInputModel.MaterialNo = aRentalSet[0].RentalNo;
				        oInputModel.MaterialDesc = aRentalSet[0].RentalName;
				        oInputModel.SupplierNo = aRentalSet[0].SupplierNo;
				        oInputModel.SupplierName = aRentalSet[0].SupplierName;
				        oInputModel.Price = aRentalSet[0].Price;
				        oInputModel.Unit = aRentalSet[0].Unit;
				        oInputModel.Agreement = aRentalSet[0].Agreement;
				        oInputModel.AgreementItem = aRentalSet[0].AgreementItem;
				        oInputModel.VendorMatNo = aRentalSet[0].VendorMatNo;
				        // Setting model with filled values
				        if (this._oMasterAddDialog) {
					        this._oMasterAddDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oRentalEditDialog) {
					        this._oRentalEditDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oSubConEditDialog) {
					        this._oSubConEditDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oMaterialEditDialog) {
					        this._oMaterialEditDialog.getModel("Input").setData(oInputModel);
				        } else if (this._oTempEditDialog) {
					        this._oTempEditDialog.getModel("Input").setData(oInputModel);
				        }
			        }.bind(self),
			        // Error handler
			        function() {
			        });
		        }
	        },
	        getFillRentalSet : function(oRental, oController, aResults) {
		        var self = oController;
		        var oModel = self.getModel();
		        var oDeferred = $.Deferred();
		        // Creating key set for FillSupplierSet entity
		        var sFillRentalPath = oModel.createKey("/FillRentalSet", {
		        ProjectNo : oRental.ProjectNo,
		        PurchaseDoc : oRental.PurchaseDoc,
		        Item : oRental.Item
		        });
		        // Setting screen to busy state
		        if (self._oMasterAddDialog)
			        self._oMasterAddDialog.getModel("Form").setProperty("/busy", true);
		        // Fetching data for supplier set
		        oModel.read(sFillRentalPath, {
		        success : function(oData) {
			        var aRes = oData;
			        // Checking that something is returned in OData results
			        if (aRes.RentalName) {
				        // Saving SupplierSet in array aResults	
				        aResults.push(aRes);
			        }
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        if (self._oMasterAddDialog)
				        self._oMasterAddDialog.getModel("Form").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        onPressIntegrate : function(oEvent) {
		        var oControl = oEvent.getSource();
		        var oResource = this.getResourceBundle();
		        var aIntegrate = [
		        /*{category : oResource.getText("Select"), selected : true},*/
		        {
		        category : oResource.getText("Lab"),
		        selected : true,
		        icon : "sap-icon://person-placeholder"
		        }, {
		        category : oResource.getText("Temp"),
		        selected : true,
		        icon : "sap-icon://employee"
		        }, {
		        category : oResource.getText("Equip"),
		        selected : true,
		        icon : "sap-icon://inventory"
		        }, {
		        category : oResource.getText("Rent"),
		        selected : true,
		        icon : "sap-icon://shipping-status"
		        }, {
		        category : oResource.getText("Mat"),
		        selected : true,
		        icon : "sap-icon://program-triangles-2"
		        }, {
		        category : oResource.getText("SubCon"),
		        selected : true,
		        icon : "sap-icon://decision"
		        }, {
		        category : oResource.getText("Intern"),
		        selected : true,
		        icon : "sap-icon://example"
		        }, {
		        category : oResource.getText("Qty"),
		        selected : true,
		        icon : "sap-icon://measure"
		        }];
		        var oIntegrateModel = new JSONModel(aIntegrate);
		        oIntegrateModel.setDefaultBindingMode("TwoWay");
		        this.getView().setModel(oIntegrateModel, "integrateList");
		        this._oIntegrationDialog = this
		            .onOpenDialog(this._oIntegrationDialog, "zwo.ui.wks_rep.view.fragment.integrationDialog", oControl);
	        },
	        onPressIntControl : function(oEvent) {
		        var self = this;
		        var oControl = oEvent.getSource();
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = "";
		        var sProjectNo = "";
		        var oResourceBundle = self.getResourceBundle();
		        var oProject = self.byId("project");
		        var oPreview = self.byId("preview");
		        if (oProject) {
			        sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			        sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        } else if (oPreview) {
			        sDay = self._sDay;
			        sProjectNo = self._sProjectNo;
		        }
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        var aIntegrateModel = self.getModel("integrateList");
		        var aIntegrate = aIntegrateModel.getData();
		        var sLabor = aIntegrate[0].selected;
		        var sTemp = aIntegrate[1].selected;
		        var sEquip = aIntegrate[2].selected;
		        var sRental = aIntegrate[3].selected;
		        var sMaterial = aIntegrate[4].selected;
		        var sSubCon = aIntegrate[5].selected;
		        var sInternal = aIntegrate[6].selected;
		        var sQty = aIntegrate[7].selected;
		        var oParam = {
		        Day : sDay,
		        ProjectNo : sProjectNo,
		        Labor : sLabor,
		        Temporary : sTemp,
		        Equipment : sEquip,
		        Rental : sRental,
		        Material : sMaterial,
		        Subcontracting : sSubCon,
		        Internal : sInternal,
		        Quantity : sQty
		        };
		        if (oProject) {
			        var oFilter = self.getInScreenFilters();
		        } else if (oPreview) {
			        var oFilter = self.getPreviewFilters();
		        }
		        var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter]
		            : [];
		        var oFilters = [];
		        oFilters.push(new sap.ui.model.Filter("Action", oOperatorEQ, "Ctrl"));
		        oFilters.push(new sap.ui.model.Filter("Lab", oOperatorEQ, oParam.Labor));
		        oFilters.push(new sap.ui.model.Filter("Tem", oOperatorEQ, oParam.Temporary));
		        oFilters.push(new sap.ui.model.Filter("Equ", oOperatorEQ, oParam.Equipment));
		        oFilters.push(new sap.ui.model.Filter("Ren", oOperatorEQ, oParam.Rental));
		        oFilters.push(new sap.ui.model.Filter("Mat", oOperatorEQ, oParam.Material));
		        oFilters.push(new sap.ui.model.Filter("Sub", oOperatorEQ, oParam.Subcontracting));
		        oFilters.push(new sap.ui.model.Filter("Int", oOperatorEQ, oParam.Internal));
		        oFilters.push(new sap.ui.model.Filter("Qua", oOperatorEQ, oParam.Quantity));
		        if (aFilters.length !== 0) {
			        oFilters.push(new sap.ui.model.Filter(aFilters, true));
		        }
		        var oModel = self.getModel();
		        // Creating key set for ProjectSet entity
		        var sControlPath = oModel.createKey("/ProjectSet", {
		        ProjectNo : oParam.ProjectNo,
		        Day : oParam.Day
		        });
		        sControlPath += "/ProjToAction";
		        var aResults = [];
		        oModel.read(sControlPath, {
		        filters : oFilters,
		        success : function(oData) {
			        MessageToast.show(oResourceBundle.getText("controlSuccess"));
			        var aResults = oData.results;
			        if (aResults.length !== 0) {
				        self._openIntControlDialog(oControl, aResults, self);
			        } else {
				        self.onPressConfirmIntegrate();
			        }
		        },
		        error : function(oError) {
			        MessageToast.show(oResourceBundle.getText("controlError"));
		        }
		        });
		        self.handleCloseIntegrate();
	        },
	        onPressConfirmIntegrate : function() {
		        var self = this;
		        var oInScreenModel = self.getModel("InScreenFilters");
		        var sDay = "";
		        var sProjectNo = "";
		        var oResourceBundle = self.getResourceBundle();
		        var oProject = self.byId("project");
		        var oPreview = self.byId("preview");
		        if (oProject) {
			        sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			        sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
		        } else if (oPreview) {
			        sDay = self._sDay;
			        sProjectNo = self._sProjectNo;
		        }
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        var aIntegrateModel = self.getModel("integrateList");
		        var aIntegrate = aIntegrateModel.getData();
		        var sLabor = aIntegrate[0].selected;
		        var sTemp = aIntegrate[1].selected;
		        var sEquip = aIntegrate[2].selected;
		        var sRental = aIntegrate[3].selected;
		        var sMaterial = aIntegrate[4].selected;
		        var sSubCon = aIntegrate[5].selected;
		        var sInternal = aIntegrate[6].selected;
		        var sQty = aIntegrate[7].selected;
		        var oParam = {
		        Day : sDay,
		        ProjectNo : sProjectNo,
		        Labor : sLabor,
		        Temporary : sTemp,
		        Equipment : sEquip,
		        Rental : sRental,
		        Material : sMaterial,
		        Subcontracting : sSubCon,
		        Internal : sInternal,
		        Quantity : sQty
		        };
		        if (oProject) {
			        var oFilter = self.getInScreenFilters();
		        } else if (oPreview) {
			        var oFilter = self.getPreviewFilters();
		        }
		        var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter]
		            : [];
		        var oFilters = [];
		        oFilters.push(new sap.ui.model.Filter("Action", oOperatorEQ, "Int"));
		        oFilters.push(new sap.ui.model.Filter("Lab", oOperatorEQ, oParam.Labor));
		        oFilters.push(new sap.ui.model.Filter("Tem", oOperatorEQ, oParam.Temporary));
		        oFilters.push(new sap.ui.model.Filter("Equ", oOperatorEQ, oParam.Equipment));
		        oFilters.push(new sap.ui.model.Filter("Ren", oOperatorEQ, oParam.Rental));
		        oFilters.push(new sap.ui.model.Filter("Mat", oOperatorEQ, oParam.Material));
		        oFilters.push(new sap.ui.model.Filter("Sub", oOperatorEQ, oParam.Subcontracting));
		        oFilters.push(new sap.ui.model.Filter("Int", oOperatorEQ, oParam.Internal));
		        oFilters.push(new sap.ui.model.Filter("Qua", oOperatorEQ, oParam.Quantity));
		        if (aFilters.length !== 0) {
			        oFilters.push(new sap.ui.model.Filter(aFilters, true));
		        }
		        this.getRouter().navTo("dashboard");
		        var oModel = self.getModel();
		        // Creating key set for ProjectSet entity
		        var sIntegratePath = oModel.createKey("/ProjectSet", {
		        ProjectNo : oParam.ProjectNo,
		        Day : oParam.Day
		        });
		        sIntegratePath += "/ProjToAction";
		        oModel.read(sIntegratePath, {
		        filters : oFilters,
		        success : function(oData) {
			        sap.m.MessageBox.information(oResourceBundle.getText("integrateStart"), {
			        title : "Integration Control",
			        styleClass : "customMessage"
			        });
		        }.bind(this),
		        error : function(oError) {
			        sap.m.MessageBox.information(oResourceBundle.getText("integrateError"), {
			        title : "Integration Control",
			        styleClass : "customMessage"
			        });
		        }.bind(this),
		        });
	        },
	        handleCloseIntegrate : function() {
		        this._oIntegrationDialog.close();
	        },
	        handleCloseIntControl : function() {
		        //Closing control dialog window
		        if (this._oIntControlDialog)
			        this._oIntControlDialog.close();
	        },
	        _openIntControlDialog : function(oControl, aResults, oController) {
		        var oModel = models.createJSONModel(aResults, "TwoWay");
		        var self = oController;
		        self._oIntControlDialog = this
		            .onOpenDialog(this._oIntControlDialog, "zwo.ui.wks_rep.view.fragment.intControlDialog", oControl);
		        self._oIntControlDialog.setModel(oModel, "control");
	        },
	        // Obtaining foremen and status filters for a project and day
	        getPreviewFilters : function() {
		        var self = this;
		        // Report Model
		        var oReportModel = self.getModel("ReportFilters");
		        var aForemen = oReportModel.getProperty("/Foremen");
		        var aStatus = oReportModel.getProperty("/Status");
		        // Filter array
		        var aFilters = [];
		        // Setting filter operator
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        // Foreman filters
		        if (aForemen.length !== 0) {
			        var aTmp = [];
			        aForemen.forEach(function(oForeman) {
				        aTmp.push(new sap.ui.model.Filter("ForemanNo", oOperatorEQ, oForeman.Number));
			        });
			        aFilters.push(new sap.ui.model.Filter(aTmp, true));
		        }
		        // Status filters
		        if ((aStatus.length !== 0)) {
			        var aTmp = [];
			        aStatus.forEach(function(status) {
				        // IntStatus 0 and 1 map to status "Not Integrated"
				        aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, status.Index));
				        if (status.Index === "0")
					        aTmp.push(new sap.ui.model.Filter("IntStatus", oOperatorEQ, "1"));
			        });
			        aFilters.push(new sap.ui.model.Filter(aTmp, true));
		        }
		        var oFilter = new sap.ui.model.Filter(aFilters, true);
		        return oFilter;
	        },
	        showDetHeader : function(sChange, mParams) {
		        var bShow = true;
		        if (sChange === "orientation") {
			        var oDevModel = this.getView().getModel("device");
			        var bPhone = oDevModel.getProperty("/system/phone");
			        var bTablet = oDevModel.getProperty("/system/tablet");
			        var bPortrait = oDevModel.getProperty("/orientation/portrait");
			        if (bPhone || (bTablet && bPortrait)) {
				        bShow = true;
			        } else {
				        bShow = false;
			        }
		        }
		        if (sChange === "size") {
			        if (mParams.width < 900) {
				        bShow = true;
			        } else {
				        bShow = false;
			        }
		        }
		        return bShow;
	        },
	        //Project unlock after a defined time
	        //Project access only once
	        timeOut : function(self) {
		        var oProject = self.byId("project");
		        var oPreview = self.byId("preview");
		        var oDashboard = self.byId("dashboard");
		        var oView;
		        var timer;
		        if (oProject) {
			        oView = oProject;
		        } else if (oPreview) {
			        oView = oPreview;
		        }
		        var timerDuration = "5";
		        if (self.getModel("user").getProperty("/TimerDuration") !== "")
			        timerDuration = self.getModel("user").getProperty("/TimerDuration");
		        if (oProject || oPreview) {
			        document.onload = reset;
			        document.onmousemove = reset;
			        document.onmousedown = reset; // touchscreen presses
			        document.ontouchstart = reset;
			        document.ontouchmove = reset;
			        document.onclick = reset; // touchpad clicks
			        document.onscroll = reset; // scrolling with arrow keys
			        document.onkeypress = reset;
			        document.onwheel = reset;
			        function reset(self) {
				        clearTimeout(timer);
				        //(min * sec * millisec)
				        timer = setTimeout(unlock, (timerDuration * 60 * 1000));
				        oView.getModel("UnlockFilters").setProperty("/Timer", timer);
			        }
			        function clear() {
				        clearTimeout(timer);
				        document.onload = null;
				        document.onmousemove = null;
				        document.onmousedown = null; // touchscreen presses
				        document.ontouchstart = null;
				        document.ontouchmove = null;
				        document.onclick = null; // touchpad clicks
				        document.onscroll = null; // scrolling with arrow keys
				        document.onkeypress = null;
				        document.onwheel = null;
			        }
			        function unlock() {
				        var oUnlockModel = self.getModel("UnlockFilters");
				        var iProjectNo = oUnlockModel.getProperty("/ProjectNo");
				        var sDay = formatter.formatODataDate(oUnlockModel.getProperty("/Day"));
				        var oModel = self.getModel();
				        var oParam = {
				        "Day" : sDay,
				        "ProjectNo" : iProjectNo,
				        "Lock" : false
				        };
				        var oHandle = oModel.callFunction("/LockProject", {
				        method : "GET",
				        urlParameters : oParam,
				        headers : {
					        'Cache-Control' : 'no-cache, no-store'
				        },
				        success : function() {
					        self.getModel("UnlockFilters").setProperty("/ProjectNo", "");
					        self.getModel("UnlockFilters").setProperty("/Day", "");
				        }
				        });
				        clear();
				        self.getRouter().navTo("dashboard");
				        sap.m.MessageBox.information(self.getResourceBundle().getText("unlockMsg"), {
				        title : "Information",
				        styleClass : "customMessage"
				        });
			        }
		        } else if (oDashboard) {
			        timer = self.getModel("UnlockFilters").getProperty("/Timer");
			        clearTimeout(timer);
			        document.onload = null;
			        document.onmousemove = null;
			        document.onmousedown = null; // touchscreen presses
			        document.ontouchstart = null;
			        document.ontouchmove = null;
			        document.onclick = null; // touchpad clicks
			        document.onscroll = null; // scrolling with arrow keys
			        document.onkeypress = null;
			        document.onwheel = null;
		        }
	        },
	        //End SR 548154
	        //Lock project when a user enter a report
	        //SR 548154 Project access only once
	        projectLock : function() {
		        var self = this;
		        var oDeferred = $.Deferred();
		        var oLockModel = self.getModel("LockFilters");
		        var iProjectNo = oLockModel.getProperty("/ProjectNo");
		        var sDay = oLockModel.getProperty("/Day");
		        var oParam = {
		        "Day" : sDay,
		        "ProjectNo" : iProjectNo,
		        "Lock" : true
		        };
		        if (iProjectNo !== "" && sDay !== "") {
			        var oModel = self.getModel();
			        if (oModel !== undefined) {
				        var oHandle = oModel.callFunction("/LockProject", {
				        method : "GET",
				        urlParameters : oParam,
				        headers : {
					        'Cache-Control' : 'no-cache, no-store'
				        }, //SR 561283 Problem: Response kept in cache
				        success : function() {
					        self.getModel("LockFilters").setProperty("/ProjectNo", "");
					        self.getModel("LockFilters").setProperty("/Day", "");
					        self.getModel("UnlockFilters").setProperty("/ProjectNo", iProjectNo);
					        self.getModel("UnlockFilters").setProperty("/Day", sDay);
					        oDeferred.resolve();
				        },
				        error : function(oError) {
					        self.getRouter().navTo("dashboard");
					        self.getModel("ProjectFilters").setProperty("/selDate", sDay);
					        oDeferred.reject();
				        }
				        });
				        return oDeferred.promise();
			        } else {
				        self.getRouter().navTo("dashboard");
			        }
		        }
	        },
	        unlockProject : function() {
		        var self = this;
		        var oResourceBundle = self.getResourceBundle();
		        var oUnlockModel = self.getModel("UnlockFilters");
		        var iProjectNo = oUnlockModel.getProperty("/ProjectNo");
		        var sDay = oUnlockModel.getProperty("/Day");
		        var oParam = {
		        "Day" : sDay,
		        "ProjectNo" : iProjectNo,
		        "Lock" : false
		        };
		        if (iProjectNo !== "" && sDay !== "") {
			        var oModel = self.getModel();
			        var oHandle = oModel.callFunction("/LockProject", {
			        method : "GET",
			        urlParameters : oParam,
			        headers : {
				        'Cache-Control' : 'no-cache, no-store'
			        }, //SR 561283 Problem: Response kept in cache
			        success : function() {
				        self.getModel("UnlockFilters").setProperty("/ProjectNo", "");
				        self.getModel("UnlockFilters").setProperty("/Day", "");
			        }
			        });
		        }
	        },
	        //End SR 548154
	        //SR 551167 hyperlink PO
	        /*onPressPO: function(oEvent){
	        	var self = this;
	        	var oControl = oEvent.getSource();
	        	var oPurchaseDoc = oControl.getText();
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
	        	var sUrl = sHost + "/sap/bc/gui/sap/its/webgui?sap-client=" + sClient + "&~transaction=*OLR3_ME2XN OLR3_R3_TS_PDOC-EBELN=" + oPurchaseDoc + ";DYNP_OKCODE=MODY";
	        	window.open(sUrl);
	        },*/
	        onPressExportPapyrusCmt : function(oEvent) {
		        var oControl = oEvent.getSource();
		        var oResource = this.getResourceBundle();
		        var aExport = [{
		        category : oResource.getText("Lab"),
		        selected : true,
		        icon : "sap-icon://person-placeholder"
		        }, {
		        category : oResource.getText("Temp"),
		        selected : true,
		        icon : "sap-icon://employee"
		        }, {
		        category : oResource.getText("Equip"),
		        selected : true,
		        icon : "sap-icon://inventory"
		        }, {
		        category : oResource.getText("Rent"),
		        selected : true,
		        icon : "sap-icon://shipping-status"
		        }, {
		        category : oResource.getText("Mat"),
		        selected : true,
		        icon : "sap-icon://program-triangles-2"
		        }, {
		        category : oResource.getText("SubCon"),
		        selected : true,
		        icon : "sap-icon://decision"
		        }, {
		        category : oResource.getText("Intern"),
		        selected : true,
		        icon : "sap-icon://example"
		        }, {
		        category : oResource.getText("Qty"),
		        selected : true,
		        icon : "sap-icon://measure"
		        }];
		        var oExportModel = new JSONModel(aExport);
		        oExportModel.setDefaultBindingMode("TwoWay");
		        this.getView().setModel(oExportModel, "exportList");
		        this._oExportDialog = this
		            .onOpenDialog(this._oExportDialog, "zwo.ui.wks_rep.view.fragment.ExportDialog", oControl);
	        },
	        handleCloseExport : function() {
		        if (this._oExportDialog) {
			        this._oExportDialog.close();
		        }
	        }
	        });
    });