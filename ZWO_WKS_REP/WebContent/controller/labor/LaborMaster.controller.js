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

sap.ui
        .define(
                [ "zwo/ui/wks_rep/controller/BaseController",
                        "zwo/ui/wks_rep/model/formatter",
                        "sap/ui/core/Fragment", "sap/m/MessageToast",
                        "zwo/ui/wks_rep/model/models",
                        "sap/ui/model/json/JSONModel", "sap/ui/model/Filter",
                        "sap/ui/model/FilterOperator", "sap/ui/model/Sorter",
                        "sap/m/Dialog", "sap/m/Button", "sap/m/Text",
                        "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
                        "sap/ui/comp/filterbar/FilterBar"

                ],
                function(BaseController, formatter, Fragment, MessageToast,
                        models, JSONModel, Filter, FilterOperator, Sorter,
                        Dialog, Button, Text, ValueHelpDialog, FilterBar) {
	                "use strict";
	                
	                return BaseController
	                        .extend(
	                                "zwo.ui.wks_rep.controller.labor.LaborMaster",
	                                {
	                                    
	                                    formatter : formatter,
	                                    
	                                    /* =========================================================== */
	                                    /* lifecycle methods */
	                                    /* =========================================================== */

	                                    onInit : function() {
		                                    
		                                    // Creating DashboardView model used
		                                    // to set page to busy
		                                    var oViewModel = new JSONModel({
		                                        busy : false,
		                                        BusyDelay : 0
		                                    });
		                                    this.setModel(oViewModel,
		                                            "LaborView");
		                                    
		                                    this
		                                            .getRouter()
		                                            .getRoute("labor")
		                                            .attachPatternMatched(
		                                                    this._onLaborPatternMatched,
		                                                    this);
		                                    
	                                    },
	                                    
	                                    onFilterMaster : function(oEvent) {
		                                    var sQuery = oEvent
		                                            .getParameter("query");
		                                    var filters = [
		                                            new sap.ui.model.Filter(
		                                                    "EmployeeNo",
		                                                    sap.ui.model.FilterOperator.Contains,
		                                                    sQuery),
		                                            new sap.ui.model.Filter(
		                                                    "EmployeeName",
		                                                    sap.ui.model.FilterOperator.Contains,
		                                                    sQuery) ];
		                                    
		                                    // False will apply an OR logic, if
		                                    // you want AND pass true
		                                    var oFilter = new sap.ui.model.Filter(
		                                            filters, false);
		                                    
		                                    // update list binding
		                                    var oDetailList = this.getView()
		                                            .byId("masterList");
		                                    var oBinding = oDetailList
		                                            .getBinding("items");
		                                    oBinding.filter(oFilter);
	                                    },
	                                    
	                                    onSearchMaster : function(oEvent) {
		                                    
	                                    },
	                                    
	                                    onSortMaster : function(oEvent) {
		                                    var oMasterList = this.getView()
		                                            .byId("masterList");
		                                    var oBinding = oMasterList
		                                            .getBinding("items");
		                                    var aSorter = oBinding.aSorters;
		                                    var oDescending = false;
		                                    if (aSorter && aSorter.length !== 0) {
			                                    oDescending = aSorter[0].bDescending;
		                                    }
		                                    
		                                    var oSorter = new Sorter(
		                                            "EmployeeName",
		                                            !oDescending);
		                                    oBinding.sort(oSorter);
	                                    },
	                                    
	                                    onPressFlag : function(oEvent) {
		                                    var self = this;
		                                    var oControl = oEvent.getSource();
		                                    var bItemPressed = oControl
		                                            .getPressed();
		                                    var sPath = oControl
		                                            .getBindingContext()
		                                            .getPath();
		                                    var oLaborItem = self.getModel()
		                                            .getProperty(sPath);
		                                    var bFlag = oControl
		                                            .getBindingContext()
		                                            .getProperty("FlagInt");
		                                    var sIntStatus = oControl
		                                            .getBindingContext()
		                                            .getProperty("IntStatus");
		                                    
		                                    if (self.validateMasterEdit(
		                                            sIntStatus, self, true)) {
			                                    // Updating FlagIntUpd to signal
			                                    // a change in FlagInt status
			                                    oLaborItem.FlagIntUpd = true;
			                                    var oDfrdUpd = self
			                                            .updateLaborItem(
			                                                    oLaborItem,
			                                                    self);
			                                    oDfrdUpd
			                                            .then(
			                                                    // Success
			                                                    // handler
			                                                    function() {
				                                                    var Ind = self
				                                                            ._getItemIndex(oLaborItem);
				                                                    self
				                                                            ._navToDetItem(
				                                                                    "masterList",
				                                                                    Ind);
			                                                    },
			                                                    // Error handler
			                                                    function() {
				                                                    self
				                                                            .getModel()
				                                                            .setProperty(
				                                                                    sPath
				                                                                            + "/FlagInt",
				                                                                    !bFlag);
			                                                    });
		                                    } else {
			                                    self.getModel().setProperty(
			                                            sPath + "/FlagInt",
			                                            !bFlag);
		                                    }
	                                    },
	                                    
	                                    onPressMasterLock : function(oEvent) {
		                                    var self = this;
		                                    var aSelItems = self
		                                            .getSelMasterItems(
		                                                    "masterList", self);
		                                    
		                                    aSelItems
		                                            .forEach(function(item) {
			                                            var oContext = item
			                                                    .getBindingContext();
			                                            var sIntStatus = oContext
			                                                    .getProperty("IntStatus");
			                                            var bFlag = oContext
			                                                    .getProperty("FlagInt");
			                                            var sPath = oContext
			                                                    .getPath();
			                                            var oLabor = oContext
			                                                    .getProperty(sPath);
			                                            var bLocked = false;
			                                            var oChkBox = item
			                                                    .getContent()[0]
			                                                    .getItems()[0]
			                                                    .getItems()[0];
			                                            
			                                            if (self
			                                                    .validateMasterEdit(
			                                                            sIntStatus,
			                                                            self,
			                                                            true)) {
				                                            var oStatusModel = self
				                                                    .getModel("statusList");
				                                            var iIntLocked1 = oStatusModel
				                                                    .getProperty("/4/index");
				                                            var iIntLocked2 = "7";
				                                            var iNotInt1 = oStatusModel
				                                                    .getProperty("/0/index");
				                                            var iNotInt2 = "1";
				                                            var iIntError = oStatusModel
				                                                    .getProperty("/2/index");
				                                            
				                                            switch (sIntStatus) {
					                                            case (iNotInt1): // Lock
						                                            // item
						                                            // and
						                                            // Integration
						                                            // status
						                                            // is
						                                            // Not
						                                            // Modified
						                                            oLabor.IntStatus = iIntLocked1;
						                                            oLabor.FlagLocked = true;
						                                            oLabor.FlagInt = false;
						                                            bLocked = true;
						                                            break;
					                                            case (iNotInt2): // Lock
						                                            // item
						                                            // and
						                                            // Integration
						                                            // status
						                                            // is
						                                            // Modified
						                                            oLabor.IntStatus = iIntLocked1;
						                                            oLabor.FlagLocked = true;
						                                            oLabor.FlagInt = false;
						                                            bLocked = true;
						                                            break;
					                                            case (iIntError): // Lock
						                                            // item
						                                            // and
						                                            // Integration
						                                            // status
						                                            // is
						                                            // Error
						                                            oLabor.IntStatus = iIntLocked2;
						                                            oLabor.FlagLocked = true;
						                                            oLabor.FlagInt = false;
						                                            bLocked = true;
						                                            break;
					                                            case (iIntLocked1): // Unlock
						                                            // item
						                                            // and
						                                            // for
						                                            // previous
						                                            // Integration
						                                            // status,
						                                            // Not
						                                            // Modified
						                                            // or
						                                            // Modified
						                                            oLabor.IntStatus = "";
						                                            oLabor.FlagInt = false;
						                                            oLabor.FlagLocked = true;
						                                            bLocked = false;
						                                            break;
					                                            case (iIntLocked2): // Unlock
						                                            // item
						                                            // and
						                                            // for
						                                            // previous
						                                            // Integration
						                                            // status,
						                                            // Error
						                                            oLabor.IntStatus = "";
						                                            oLabor.FlagInt = false;
						                                            oLabor.FlagLocked = true;
						                                            bLocked = false;
						                                            break;
				                                            }
				                                            
				                                            var oDfrdUpd = self
				                                                    .updateLaborItem(
				                                                            oLabor,
				                                                            self);
				                                            oDfrdUpd
				                                                    .then(
				                                                            // Success
				                                                            // handler
				                                                            function() {
					                                                            var Ind = self
					                                                                    ._getItemIndex(oLabor);
					                                                            self
					                                                                    ._navToDetItem(
					                                                                            "masterList",
					                                                                            Ind);
				                                                            },
				                                                            // Error
				                                                            // handler
				                                                            function() {
					                                                            oLabor.IntStatus = sIntStatus;
					                                                            oLabor.FlagInt = bFlag;
				                                                            });
			                                            }
			                                            if (oChkBox)
				                                            oChkBox
				                                                    .setSelected(false);
		                                            });
		                                    self.getView().byId("copyMBtn")
		                                            .setEnabled(true);
		                                    self.getView().byId("deleteMBtn")
		                                            .setEnabled(true);
	                                    },
	                                    
	                                    onPressMasterItem : function(oEvent) {
		                                    var self = this;
		                                    var oCountry = this
		                                            .getModel("InScreenFilters")
		                                            .getProperty(
		                                                    "/ProjectSet/Country");
		                                    var oControl = oEvent.getSource();
		                                    var oContext = oControl
		                                            .getBindingContext();
		                                    var sDay = formatter
		                                            .formatODataDate(oContext
		                                                    .getProperty("Day"));
		                                    var iProjectNo = oContext
		                                            .getProperty("ProjectNo");
		                                    var sKey = oContext
		                                            .getProperty("Key");
		                                    
		                                    var oLabor = oContext
		                                            .getProperty(oContext
		                                                    .getPath());
		                                    var sItemNo = self
		                                            ._getItemIndex(oLabor);
		                                    
		                                    self.getRouter().navTo("labordet",
		                                            {
		                                                Day : sDay,
		                                                ProjectNo : iProjectNo,
		                                                Key : sKey,
		                                                itemNo : sItemNo
		                                            }, true);
	                                    },
	                                    
	                                    // Add Labor Dialog
	                                    onPressMasterAdd : function(oEvent) {
		                                    var self = this;
		                                    var oResource = this
		                                            .getResourceBundle();
		                                    var oViewModel = new JSONModel(
		                                            {
		                                                title : oResource
		                                                        .getText("addPersonnel"),
		                                                mode : "add",
		                                                busy : false,
		                                                BusyDelay : 0
		                                            });
		                                    
		                                    var oUser = this.getModel("user");
		                                    var oCountry = self
		                                            .getModel("InScreenFilters")
		                                            .getProperty(
		                                                    "/ProjectSet/Country");
		                                    if (oCountry === 'QC') {
			                                    var oModel = new JSONModel(
			                                            {
			                                                Day : "",
			                                                ProjectNo : "",
			                                                Key : "",
			                                                FlagLocked : false,
			                                                FlagInt : false,
			                                                EmployeeNo : "",
			                                                EmployeeName : "",
			                                                Price : "",
			                                                Currency : "",
			                                                Mu : "",
			                                                MuName : "",
			                                                ActivityType : "",
			                                                Ccq : "",
			                                                Rule : "",
			                                                WorkTimeBeg : "00:00",
			                                                WorkTimeEnd : "00:00",
			                                                BreakTimeBeg : "00:00",
			                                                BreakTimeEnd : "00:00",
			                                                TotalCost : "0.00",
			                                                TotalDayQty : "0.00",
			                                                Unit : "",
			                                                CostCode : "",
			                                                IntStatus : "",
			                                                Origin : "M",
			                                                ForemanNo : oUser
			                                                        .getProperty("/PersonID"), // M,
			                                                Version : "00"
			                                            });
		                                    } else {
			                                    var oModel = new JSONModel(
			                                            {
			                                                Day : "",
			                                                ProjectNo : "",
			                                                Key : "",
			                                                FlagLocked : false,
			                                                FlagInt : false,
			                                                EmployeeNo : "",
			                                                EmployeeName : "",
			                                                Price : "",
			                                                Currency : "",
			                                                Mu : "",
			                                                MuName : "",
			                                                ActivityType : "",
			                                                TotalCost : "0.00",
			                                                TotalDayQty : "0.00",
			                                                Unit : "",
			                                                CostCode : "",
			                                                IntStatus : "",
			                                                Origin : "M",
			                                                ForemanNo : oUser
			                                                        .getProperty("/PersonID"), // M,
			                                                Version : "00"
			                                            });
		                                    }
		                                    oModel
		                                            .setDefaultBindingMode("TwoWay");
		                                    
		                                    // Opening MasterAdd Dialog
		                                    var oControl = oEvent.getSource();
		                                    this._oMasterAddDialog = this
		                                            .onOpenDialog(
		                                                    this._oMasterAddDialog,
		                                                    "zwo.ui.wks_rep.view.labor.fragment.masterAdd",
		                                                    oControl);
		                                    this._oMasterAddDialog.setModel(
		                                            oViewModel, "Form");
		                                    this._oMasterAddDialog.setModel(
		                                            oModel, "Input");
		                                    
	                                    },
	                                    
	                                    onPressLaborSave : function() {
		                                    var self = this;
		                                    var oInScreenModel = self
		                                            .getModel("InScreenFilters");
		                                    var oCountry = oInScreenModel
		                                            .getProperty("/ProjectSet/Country");
		                                    // var oInput =
		                                    // self._oMasterAddDialog.getModel("Input").getData();
		                                    var oInput = {};
		                                    oInput = self._oMasterAddDialog
		                                            .getModel("Input")
		                                            .getData();
		                                    var oLabor = oInput;
		                                    oLabor.Day = formatter
		                                            .formatODataDate(oInScreenModel
		                                                    .getProperty("/ProjectSet/Day"));
		                                    oLabor.ProjectNo = oInScreenModel
		                                            .getProperty("/ProjectSet/ProjectNo");
		                                    if (oCountry === "QC") {
			                                    oLabor.WorkTimeBeg = (oLabor.WorkTimeBeg.__edmType) ? oLabor.WorkTimeBeg
			                                            : formatter
			                                                    .formatODataTime(oInput.WorkTimeBeg);
			                                    oLabor.WorkTimeEnd = (oLabor.WorkTimeEnd.__edmType) ? oLabor.WorkTimeEnd
			                                            : formatter
			                                                    .formatODataTime(oInput.WorkTimeEnd);
			                                    oLabor.BreakTimeBeg = (oLabor.BreakTimeBeg.__edmType) ? oLabor.BreakTimeBeg
			                                            : formatter
			                                                    .formatODataTime(oInput.BreakTimeBeg);
			                                    oLabor.BreakTimeEnd = (oLabor.BreakTimeEnd.__edmType) ? oLabor.BreakTimeEnd
			                                            : formatter
			                                                    .formatODataTime(oInput.BreakTimeEnd);
		                                    }
		                                    // Checking if all mandatory fields
		                                    // are filled
		                                    if (oLabor.EmployeeNo.trim() === ""
		                                            || oLabor.EmployeeName
		                                                    .trim() === ""
		                                            || (oLabor.Price.trim() === "" || oLabor.Price === "0.00")
		                                            || oLabor.Mu.trim() === ""
		                                            || (self.byId(
		                                                    "idActivityType")
		                                                    .getRequired() && oLabor.ActivityType
		                                                    .trim() === "")
		                                            || ((oCountry === "QC") && oLabor.WorkTimeBeg.ms === 0)
		                                            || ((oCountry === "QC") && oLabor.WorkTimeEnd.ms === 0)
		                                            || oLabor.CostCode === ""
		                                            || oLabor.ForemanNo === ""
		                                            || (self.byId("idRule")
		                                                    .getRequired()
		                                                    && (oCountry === "QC") && oLabor.Rule
		                                                    .trim() === "")
		                                            || (self.byId("idCCQ")
		                                                    .getRequired()
		                                                    && (oCountry === "QC") && oLabor.Ccq
		                                                    .trim() === "")) {
			                                    if (oLabor.Price === "0.00") {
				                                    MessageToast
				                                            .show(self
				                                                    .getResourceBundle()
				                                                    .getText(
				                                                            "missingPrice"));
			                                    } else {
				                                    MessageToast
				                                            .show(self
				                                                    .getResourceBundle()
				                                                    .getText(
				                                                            "missingInput"));
			                                    }
		                                    } else {
			                                    
			                                    var aReports = oInScreenModel
			                                            .getProperty("/Reports");
			                                    if (aReports.length > 0) {
				                                    var found = false;
				                                    for (var i = 0; i < aReports.length; i++) {
					                                    if (aReports[i].ForemanNo === oLabor.ForemanNo
					                                            && aReports[i].Version === oLabor.Version
					                                            && aReports[i].Origin === oLabor.Origin) {
						                                    found = true;
						                                    break;
					                                    }
				                                    }
				                                    if (found === false) {
					                                    for (var i = -1; i < aReports.length; i++) {
						                                    aReports.pop();
					                                    }
					                                    
					                                    var oDfrdAdd = self
					                                            .addLaborItem(
					                                                    oLabor,
					                                                    self);
				                                    }
			                                    } else {
				                                    var oDfrdAdd = self
				                                            .addLaborItem(
				                                                    oLabor,
				                                                    self);
			                                    }
			                                    
			                                    oDfrdAdd
			                                            .then(
			                                                    // Success
			                                                    // handler
			                                                    function() {
				                                                    MessageToast
				                                                            .show(self
				                                                                    .getResourceBundle()
				                                                                    .getText(
				                                                                            "successLaborAdd"));
				                                                    // Closing
				                                                    // dialog
				                                                    // window
				                                                    self
				                                                            .handleClose();
				                                                    
				                                                    if (found === false) {
					                                                    self
					                                                            .getRepVersions(
					                                                                    oLabor.ProjectNo,
					                                                                    oLabor.Day);
					                                                    var oFilter = self
					                                                            .getInScreenFilters();
					                                                    var oDfrd = self
					                                                            ._bindMasterListItem(oFilter);
					                                                    var aResults = [];
					                                                    var oDfrdMaster = self
					                                                            .getMasterItem(
					                                                                    oLabor,
					                                                                    aResults);
					                                                    oDfrdMaster
					                                                            .then(
					                                                            // Success
					                                                            // handler
					                                                            function() {
						                                                            var oTable = self
						                                                                    .byId("masterList");
						                                                            var iInd = oTable
						                                                                    .getItems().length - 1;
						                                                            self
						                                                                    ._navToDetItem(
						                                                                            "masterList",
						                                                                            iInd);
						                                                            var oProject = self
						                                                                    .getOwnerComponent()
						                                                                    .byId(
						                                                                            "project");
						                                                            var oControl = oProject
						                                                                    .byId("selectReport");
						                                                            oControl
						                                                                    .setPlaceholder(self
						                                                                            .getResourceBundle()
						                                                                            .getText(
						                                                                                    "reportTxt"));
						                                                            MessageToast
						                                                                    .show(self
						                                                                            .getResourceBundle()
						                                                                            .getText(
						                                                                                    "filterReset"));
					                                                            });
				                                                    } else {
					                                                    if (found !== true) {
						                                                    self
						                                                            .getRepVersions(
						                                                                    oLabor.ProjectNo,
						                                                                    oLabor.Day);
					                                                    }
					                                                    var oTable = self
					                                                            .byId("masterList");
					                                                    if (oTable
					                                                            && self._oDfrdListUpd) {
						                                                    self._oDfrdListUpd
						                                                            .then(
						                                                            // Success
						                                                            // handler
						                                                            function() {
							                                                            var iInd = oTable
							                                                                    .getItems().length - 1;
							                                                            self
							                                                                    ._navToDetItem(
							                                                                            "masterList",
							                                                                            iInd);
						                                                            });
					                                                    } else {
						                                                    self
						                                                            ._navToDetItem(
						                                                                    "masterList",
						                                                                    0);
					                                                    }
				                                                    }
			                                                    },
			                                                    // Error handler
			                                                    function() {
				                                                    MessageToast
				                                                            .show(self
				                                                                    .getResourceBundle()
				                                                                    .getText(
				                                                                            "errorLaborAdd"));
			                                                    });
		                                    }
	                                    },
	                                    
	                                    handleClose : function() {
		                                    // Closing Dialog fragment
		                                    if (this._oMasterAddDialog) {
			                                    this._oMasterAddDialog.close();
			                                    this._oMasterAddDialog
			                                            .destroy(true);
			                                    this._oMasterAddDialog = null;
		                                    }
	                                    },
	                                    
	                                    // Delete labor
	                                    onPressMasterDelete : function(oEvent) {
		                                    var self = this;
		                                    var aSelItems = self
		                                            .getSelMasterItems(
		                                                    "masterList", self);
		                                    
		                                    if (aSelItems.length === 0) {
			                                    MessageToast
			                                            .show(self
			                                                    .getResourceBundle()
			                                                    .getText(
			                                                            "errorDelete"));
		                                    } else {
			                                    self
			                                            ._deleteLaborMaster(aSelItems);
			                                    self.byId("copyMBtn")
			                                            .setEnabled(true);
			                                    self.byId("lockMBtn")
			                                            .setEnabled(true);
		                                    }
	                                    },
	                                    
	                                    // Copy labor dialog
	                                    onPressMasterCopy : function(oEvent) {
		                                    var self = this;
		                                    var aSelItems = self
		                                            .getSelMasterItems(
		                                                    "masterList", self);
		                                    if (aSelItems.length > 0) {
			                                    aSelItems
			                                            .forEach(function(
			                                                    oItem,
			                                                    itemIndex) {
				                                            var oChkBox = oItem
				                                                    .getContent()[0]
				                                                    .getItems()[0]
				                                                    .getItems()[0];
				                                            oChkBox
				                                                    .setSelected(false);
				                                            
				                                            var oResource = this
				                                                    .getResourceBundle();
				                                            var oViewModel = new JSONModel(
				                                                    {
				                                                        title : oResource
				                                                                .getText("addPersonnel"),
				                                                        mode : "add"
				                                                    });
				                                            
				                                            var oUser = this
				                                                    .getModel("user");
				                                            var oContext = oItem
				                                                    .getBindingContext();
				                                            var oCountry = self
				                                                    .getModel(
				                                                            "InScreenFilters")
				                                                    .getProperty(
				                                                            "/ProjectSet/Country");
				                                            if (oCountry === 'QC') {
					                                            var oModel = new JSONModel(
					                                                    {
					                                                        Day : "",
					                                                        ProjectNo : "",
					                                                        Key : "",
					                                                        FlagLocked : false,
					                                                        FlagInt : false,
					                                                        EmployeeNo : oContext
					                                                                .getProperty("EmployeeNo"),
					                                                        EmployeeName : oContext
					                                                                .getProperty("EmployeeName"),
					                                                        Price : oContext
					                                                                .getProperty("Price"),
					                                                        Currency : "",
					                                                        Mu : oContext
					                                                                .getProperty("Mu"),
					                                                        MuName : oContext
					                                                                .getProperty("MuName"),
					                                                        ActivityType : oContext
					                                                                .getProperty("ActivityType"),
					                                                        Ccq : (oContext
					                                                                .getProperty("Ccq") === 'XX') ? ''
					                                                                : oContext
					                                                                        .getProperty("Ccq"),
					                                                        Rule : (oContext
					                                                                .getProperty("Rule") === 'XX') ? ''
					                                                                : oContext
					                                                                        .getProperty("Rule"),
					                                                        WorkTimeBeg : formatter
					                                                                .formatDisplayTime(oContext
					                                                                        .getProperty("WorkTimeBeg")),
					                                                        WorkTimeEnd : formatter
					                                                                .formatDisplayTime(oContext
					                                                                        .getProperty("WorkTimeEnd")),
					                                                        BreakTimeBeg : formatter
					                                                                .formatDisplayTime(oContext
					                                                                        .getProperty("BreakTimeBeg")),
					                                                        BreakTimeEnd : formatter
					                                                                .formatDisplayTime(oContext
					                                                                        .getProperty("BreakTimeEnd")),
					                                                        TotalCost : "0.00",
					                                                        TotalDayQty : "0.00",
					                                                        Unit : "",
					                                                        CostCode : oContext
					                                                                .getProperty("CostCode"),
					                                                        IntStatus : "",
					                                                        Origin : "",
					                                                        ForemanNo : oUser
					                                                                .getProperty("/PersonID"), // M,
					                                                        Version : "",
					                                                    });
				                                            } else {
					                                            var oModel = new JSONModel(
					                                                    {
					                                                        Day : "",
					                                                        ProjectNo : "",
					                                                        Key : "",
					                                                        FlagLocked : false,
					                                                        FlagInt : false,
					                                                        EmployeeNo : oContext
					                                                                .getProperty("EmployeeNo"),
					                                                        EmployeeName : oContext
					                                                                .getProperty("EmployeeName"),
					                                                        Price : oContext
					                                                                .getProperty("Price"),
					                                                        Currency : "",
					                                                        Mu : oContext
					                                                                .getProperty("Mu"),
					                                                        MuName : oContext
					                                                                .getProperty("MuName"),
					                                                        ActivityType : oContext
					                                                                .getProperty("ActivityType"),
					                                                        TotalCost : "0.00",
					                                                        TotalDayQty : "0.00",
					                                                        Unit : "",
					                                                        CostCode : oContext
					                                                                .getProperty("CostCode"),
					                                                        IntStatus : "",
					                                                        Origin : "",
					                                                        ForemanNo : oUser
					                                                                .getProperty("/PersonID"), // M,
					                                                        Version : "",
					                                                    });
				                                            }
				                                            oModel
				                                                    .setDefaultBindingMode("TwoWay");
				                                            
				                                            // Opening MasterAdd
				                                            // Dialog
				                                            var oControl = oEvent
				                                                    .getSource();
				                                            this._oMasterAddDialog = this
				                                                    .onOpenDialog(
				                                                            this._oMasterAddDialog,
				                                                            "zwo.ui.wks_rep.view.labor.fragment.masterAdd",
				                                                            oControl);
				                                            this._oMasterAddDialog
				                                                    .setModel(
				                                                            oViewModel,
				                                                            "Form");
				                                            this._oMasterAddDialog
				                                                    .setModel(
				                                                            oModel,
				                                                            "Input");
			                                            }.bind(this));
		                                    } else {
			                                    MessageToast
			                                            .show(this
			                                                    .getResourceBundle()
			                                                    .getText(
			                                                            "errorMasterCopy"));
		                                    }
	                                    },
	                                    
	                                    handlePressOk : function(oEvent) {
		                                    var oDialog = oEvent.getSource();
		                                    oDialog.close();
	                                    },
	                                    
	                                    handlePressCancel : function(oEvent) {
		                                    var oDialog = oEvent.getSource();
		                                    oDialog.close();
	                                    },
	                                    
	                                    _openDeleteDialog : function(oItem,
	                                            aLabor, aResults) {
		                                    var self = this;
		                                    // Opening dialog to confirm if
		                                    // labor should be deleted
		                                    var dialog = new Dialog(
		                                            {
		                                                title : "Confirm",
		                                                type : "Message",
		                                                state : "Warning",
		                                                content : new Text(
		                                                        {
		                                                            text : self
		                                                                    .getResourceBundle()
		                                                                    .getText(
		                                                                            "confirmLaborDelete"),
		                                                            textAlign : "Center"
		                                                        }),
		                                                beginButton : new Button(
		                                                        {
		                                                            text : self
		                                                                    .getResourceBundle()
		                                                                    .getText(
		                                                                            "confirmOk"),
		                                                            press : function() {
			                                                            if (aLabor.length > 0) {
				                                                            self
				                                                                    ._deleteLabor(oItem);
			                                                            } else {
				                                                            for (var i = 0; i < aResults.length; i++) {
					                                                            
					                                                            var oLaborBonus = aResults[i];
					                                                            
					                                                            var oDfrdDelBonus = self
					                                                                    ._deleteMasterBonus(
					                                                                            oLaborBonus,
					                                                                            self);
					                                                            oDfrdDelBonus
					                                                                    .then(
					                                                                            // Success
					                                                                            // handler
					                                                                            function() {
						                                                                            MessageToast
						                                                                                    .show(self
						                                                                                            .getResourceBundle()
						                                                                                            .getText(
						                                                                                                    "deleteOk"));
						                                                                            if (self._oDfrdListUpd) {
							                                                                            self._oDfrdListUpd
							                                                                                    .then(
							                                                                                    // Success
							                                                                                    // handler
							                                                                                    function() {
								                                                                                    self
								                                                                                            ._navToDetItem(
								                                                                                                    "masterList",
								                                                                                                    0);
							                                                                                    });
						                                                                            } else {
							                                                                            self
							                                                                                    ._navToDetItem(
							                                                                                            "masterList",
							                                                                                            0);
						                                                                            }
					                                                                            },
					                                                                            // Error
					                                                                            // handler
					                                                                            function() {
						                                                                            MessageToast
						                                                                                    .show(self
						                                                                                            .getResourceBundle()
						                                                                                            .getText(
						                                                                                                    "deleteError"));
					                                                                            });
				                                                            }
			                                                            }
			                                                            dialog
			                                                                    .close();
			                                                            dialog
			                                                                    .destroy();
		                                                            }
		                                                        }),
		                                                endButton : new Button(
		                                                        {
		                                                            text : self
		                                                                    .getResourceBundle()
		                                                                    .getText(
		                                                                            "confirmCancel"),
		                                                            press : function() {
			                                                            dialog
			                                                                    .close();
			                                                            dialog
			                                                                    .destroy();
		                                                            }
		                                                        })
		                                            });
		                                    dialog.open();
	                                    },
	                                    
	                                    _deleteLaborMaster : function(aSelItems) {
		                                    var self = this;
		                                    
		                                    // Opening dialog to confirm if item
		                                    // should be deleted
		                                    var dialog = new Dialog(
		                                            {
		                                                title : "Confirm",
		                                                type : "Message",
		                                                state : "Warning",
		                                                content : new Text(
		                                                        {
		                                                            text : self
		                                                                    .getResourceBundle()
		                                                                    .getText(
		                                                                            "confirmDelete"),
		                                                            textAlign : "Center",
		                                                        }),
		                                                beginButton : new Button(
		                                                        {
		                                                            text : self
		                                                                    .getResourceBundle()
		                                                                    .getText(
		                                                                            "confirmOk"),
		                                                            press : function() {
			                                                            self
			                                                                    ._deleteLaborItem(aSelItems);
			                                                            
			                                                            dialog
			                                                                    .close();
			                                                            dialog
			                                                                    .destroy();
		                                                            }
		                                                        }),
		                                                endButton : new Button(
		                                                        {
		                                                            text : self
		                                                                    .getResourceBundle()
		                                                                    .getText(
		                                                                            "confirmCancel"),
		                                                            press : function() {
			                                                            dialog
			                                                                    .close();
			                                                            dialog
			                                                                    .destroy();
		                                                            }
		                                                        })
		                                            });
		                                    dialog.open();
		                                    
	                                    },
	                                    
	                                    _deleteLaborItem : function(aSelItems) {
		                                    var self = this;
		                                    aSelItems
		                                            .forEach(function(oItem,
		                                                    itemIndex) {
			                                            var oChkBox = oItem
			                                                    .getContent()[0]
			                                                    .getItems()[0]
			                                                    .getItems()[0];
			                                            var oContext = oItem
			                                                    .getBindingContext();
			                                            var sIntStatus = oContext
			                                                    .getProperty("IntStatus");
			                                            var sOrigin = oContext
			                                                    .getProperty("Origin");
			                                            var aLabor = [];
			                                            var oDfrdGetLabor = self
			                                                    .getLaborDetItem(
			                                                            oContext,
			                                                            aLabor);
			                                            
			                                            oDfrdGetLabor
			                                                    .then(function() {
				                                                    if (self
				                                                            .validateLaborMasterDelete(
				                                                                    sIntStatus,
				                                                                    sOrigin,
				                                                                    aLabor,
				                                                                    self,
				                                                                    true)) {
					                                                    var aResults = [];
					                                                    var sDay = oContext
					                                                            .getProperty("Day");
					                                                    var iProjectNo = oContext
					                                                            .getProperty("ProjectNo");
					                                                    var iEmployeeNo = oContext
					                                                            .getProperty("EmployeeNo");
					                                                    var oDfrdGet = self
					                                                            .getLaborBonus(
					                                                                    sDay,
					                                                                    iProjectNo,
					                                                                    iEmployeeNo,
					                                                                    aResults);
					                                                    oDfrdGet
					                                                            .then(
					                                                                    // Success
					                                                                    // handler
					                                                                    function() {
						                                                                    // If
						                                                                    // employee
						                                                                    // has
						                                                                    // no
						                                                                    // bonus
						                                                                    // data,
						                                                                    // delete
						                                                                    // labor
						                                                                    // line
						                                                                    if (aResults.length === 0) {
							                                                                    self
							                                                                            ._deleteLabor(oItem);
						                                                                    } else { // else
							                                                                    // prompt
							                                                                    // user
							                                                                    // to
							                                                                    // confirm
							                                                                    // delete
							                                                                    // action
							                                                                    self
							                                                                            ._openDeleteDialog(
							                                                                                    oItem,
							                                                                                    aLabor,
							                                                                                    aResults);
						                                                                    }
					                                                                    },
					                                                                    // Error
					                                                                    // handler
					                                                                    function() {
						                                                                    MessageToast
						                                                                            .show(self
						                                                                                    .getResourceBundle()
						                                                                                    .getText(
						                                                                                            "getBonusError"));
					                                                                    });
					                                                    
				                                                    }
			                                                    });
			                                            oChkBox
			                                                    .setSelected(false);
		                                            });
	                                    },
	                                    
	                                    _deleteLabor : function(oItem) {
		                                    // Deleting labor item
		                                    var self = this;
		                                    
		                                    var sPath = oItem
		                                            .getBindingContext()
		                                            .getPath();
		                                    var oLabor = oItem
		                                            .getBindingContext()
		                                            .getModel().getProperty(
		                                                    sPath);
		                                    var oDfrdDelMaster = self
		                                            .deleteLaborItem(oLabor,
		                                                    self);
		                                    oDfrdDelMaster
		                                            .then(
		                                                    // Success handler
		                                                    function() {
			                                                    MessageToast
			                                                            .show(self
			                                                                    .getResourceBundle()
			                                                                    .getText(
			                                                                            "deleteOk"));
			                                                    if (self._oDfrdListUpd) {
				                                                    self._oDfrdListUpd
				                                                            .then(
				                                                            // Success
				                                                            // handler
				                                                            function() {
					                                                            self
					                                                                    ._navToDetItem(
					                                                                            "masterList",
					                                                                            0);
				                                                            });
			                                                    } else {
				                                                    self
				                                                            ._navToDetItem(
				                                                                    "masterList",
				                                                                    0);
			                                                    }
		                                                    },
		                                                    // Error handler
		                                                    function() {
			                                                    MessageToast
			                                                            .show(self
			                                                                    .getResourceBundle()
			                                                                    .getText(
			                                                                            "deleteError"));
		                                                    });
	                                    },
	                                    
	                                    _deleteMasterBonus : function(
	                                            oLaborBonus, oController) {
		                                    var self = oController;
		                                    var oModel = self.getModel();
		                                    var oDeferred = $.Deferred();
		                                    
		                                    // Creating key set for
		                                    // LaborBonusSet entity
		                                    var sLaborBonusPath = oModel
		                                            .createKey(
		                                                    "/LaborBonusSet",
		                                                    {
		                                                        ProjectNo : oLaborBonus.ProjectNo,
		                                                        Day : oLaborBonus.Day,
		                                                        ValidationLine : oLaborBonus.ValidationLine,
		                                                        EmployeeNo : oLaborBonus.EmployeeNo,
		                                                        TypeOfHour : oLaborBonus.TypeOfHour,
		                                                        Bonus : oLaborBonus.Bonus
		                                                    });
		                                    
		                                    self.getModel("LaborView")
		                                            .setProperty("/busy", true);
		                                    
		                                    oModel.remove(sLaborBonusPath, {
		                                        success : function() {
			                                        self.getModel("LaborView")
			                                                .setProperty(
			                                                        "/busy",
			                                                        false);
			                                        oModel.refresh();
			                                        oDeferred.resolve();
		                                        },
		                                        error : function(oError) {
			                                        self.getModel("LaborView")
			                                                .setProperty(
			                                                        "/busy",
			                                                        false);
			                                        oDeferred.reject();
		                                        }
		                                    });
		                                    return oDeferred.promise();
	                                    },
	                                    
	                                    _navToDetItem : function(sList, index) {
		                                    var self = this;
		                                    var oInScreenModel = self
		                                            .getModel("InScreenFilters");
		                                    var oCountry = oInScreenModel
		                                            .getProperty("/ProjectSet/Country");
		                                    var oList = self.byId(sList);
		                                    var oListItems = oList.getItems();
		                                    if (index.toString()
		                                            && oListItems.length > 0) {
			                                    var oContext = oListItems[index]
			                                            .getBindingContext();
			                                    var sDay = formatter
			                                            .formatODataDate(oContext
			                                                    .getProperty("Day"));
			                                    var iProjectNo = oContext
			                                            .getProperty("ProjectNo");
			                                    var sKey = oContext
			                                            .getProperty("Key")
			                                            .replace(/[/]/g, ".");
			                                    
			                                    self
			                                            .getRouter()
			                                            .navTo(
			                                                    "labordet",
			                                                    {
			                                                        Day : sDay,
			                                                        ProjectNo : iProjectNo,
			                                                        Key : sKey,
			                                                        itemNo : index
			                                                    }, true);
		                                    } else {
			                                    self.getRouter().navTo(
			                                            "noLaborDet");
		                                    }
	                                    },
	                                    
	                                    _getItemIndex : function(oItem) {
		                                    var self = this;
		                                    var index = 0;
		                                    var oList = self.byId("masterList");
		                                    if (oList) {
			                                    var aLabor = oList.getItems();
			                                    var oInScreenModel = self
			                                            .getModel("InScreenFilters");
			                                    var oCountry = oInScreenModel
			                                            .getProperty("/ProjectSet/Country");
			                                    if (aLabor.length !== 0) {
				                                    for (var i = 0; i < aLabor.length; i++) {
					                                    if (oItem.ProjectNo === aLabor[i]
					                                            .getBindingContext()
					                                            .getProperty(
					                                                    "ProjectNo")
					                                            && formatter
					                                                    .formatODataDate(oItem.Day) === formatter
					                                                    .formatODataDate(aLabor[i]
					                                                            .getBindingContext()
					                                                            .getProperty(
					                                                                    "Day"))
					                                            && oItem.Key === aLabor[i]
					                                                    .getBindingContext()
					                                                    .getProperty(
					                                                            "Key")) {
						                                    index = i;
						                                    break;
					                                    }
				                                    }
			                                    }
		                                    }
		                                    
		                                    return index;
	                                    },
	                                    
	                                    _bindMasterListItem : function(oFilter) {
		                                    var self = this;
		                                    var oDeferred = $.Deferred();
		                                    var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [ oFilter ]
		                                            : [];
		                                    var oViewModel = self
		                                            .getModel("LaborView");
		                                    var oModel = self.getModel();
		                                    var oInScreenModel = self
		                                            .getModel("InScreenFilters");
		                                    
		                                    // Creating key set for ProjectSet
		                                    // entity
		                                    var sLaborPath = oModel
		                                            .createKey(
		                                                    "/ProjectSet",
		                                                    {
		                                                        ProjectNo : oInScreenModel
		                                                                .getProperty("/ProjectSet/ProjectNo"),
		                                                        Day : formatter
		                                                                .formatODataDate(oInScreenModel
		                                                                        .getProperty("/ProjectSet/Day"))
		                                                    });
		                                    sLaborPath += "/ProjToLabor";
		                                    
		                                    var oList = self.byId("masterList");
		                                    var oCustomListItem = self
		                                            .byId("laborList");
		                                    
		                                    if (oList && oCustomListItem) {
			                                    var oItemTemplate = oCustomListItem
			                                            .clone();
			                                    oList
			                                            .bindItems({
			                                                path : sLaborPath,
			                                                template : oItemTemplate,
			                                                filters : aFilters,
			                                                events : {
			                                                    dataRequested : function() {
				                                                    oViewModel
				                                                            .setProperty(
				                                                                    "/busy",
				                                                                    true);
				                                                    oDeferred = $
				                                                            .Deferred();
			                                                    },
			                                                    dataReceived : function() {
				                                                    oViewModel
				                                                            .setProperty(
				                                                                    "/busy",
				                                                                    false);
				                                                    oDeferred
				                                                            .resolve();
			                                                    }
			                                                }
			                                            });
		                                    }
		                                    
		                                    return oDeferred.promise();
		                                    
	                                    },
	                                    
	                                    _onLaborPatternMatched : function(
	                                            oEvent) {
		                                    
		                                    if (oEvent.getParameter("name") === "labor") {
			                                    var sDay = oEvent
			                                            .getParameter("arguments").Day;
			                                    var sProjectNo = oEvent
			                                            .getParameter("arguments").ProjectNo;
			                                    this._sItemNo = oEvent
			                                            .getParameter("arguments").itemNo;
			                                    var self = this;
			                                    var oComponent = self
			                                            .getOwnerComponent();
			                                    
			                                    oComponent.oWhenMetadataIsLoaded
			                                            .then(
			                                            // Success handler
			                                            function() {
				                                            var oModel = self
				                                                    .getModel("InScreenFilters");
				                                            if (oModel
				                                                    .getProperty("/ProjectSet/Day")) {
					                                            oComponent.oDfdProject
					                                                    .done(function() {
						                                                    var oFilter = self
						                                                            .getInScreenFilters();
						                                                    var oDfrdLabor = self
						                                                            ._bindMasterListItem(oFilter);
						                                                    oDfrdLabor
						                                                            .then(
						                                                            // Success
						                                                            // handler
						                                                            function() {
							                                                            self
							                                                                    ._navToDetItem(
							                                                                            "masterList",
							                                                                            self._sItemNo);
						                                                            });
					                                                    });
				                                            } else {
					                                            self
					                                                    .getRouter()
					                                                    .navTo(
					                                                            "project",
					                                                            {
					                                                                Day : sDay,
					                                                                ProjectNo : sProjectNo
					                                                            },
					                                                            true);
				                                            }
			                                            });
		                                    }
	                                    }
	                                
	                                });
	                
                });
