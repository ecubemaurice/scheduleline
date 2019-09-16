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
	"sap/ui/unified/Calendar", 
	"sap/ui/unified/DateTypeRange", 
	"zwo/ui/wks_rep/model/models", 
	"sap/ui/model/json/JSONModel", 
	"sap/viz/ui5/api/env/Format",
	"sap/viz/ui5/format/ChartFormatter"
	], function(BaseController, formatter, Fragment, MessageToast, Calendar, DateTypeRange, models, JSONModel, Format, ChartFormatter) {
	    "use strict";
	    return BaseController.extend("zwo.ui.wks_rep.controller.Dashboard", {
	        formatter : formatter,
	        /* =========================================================== */
	        /* lifecycle methods                                           */
	        /* =========================================================== */
	        onInit : function() {
		        // Create DashboardView model used to set page to busy
		        var oViewModel = new JSONModel({
		        busy : false,
		        BusyDelay : 0
		        });
		        this.setModel(oViewModel, "DashboardView");
		        this.getRouter().getRoute("dashboard")
		            .attachPatternMatched(this._onDashboardMatched, this);
		        this.displayDate();
		        this.validateDate();
	        },
	        specialDate : function() {
		        var self = this;
		        var oView = self.getView("DashboardView");
		        var oDP = oView.byId("selectProjectDate");
		        var oProject = self._getSelectedProj();
		        var sDatePattern = "MM/dd/yyyy";
		        if (self.getModel("user"))
			        sDatePattern = self.getModel("user").getProperty("/DateFormat");
		        var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			        pattern : sDatePattern
		        });
		        var aDates = [];
		        var oDfrdDate = self.getSpecialDate(oProject, aDates);
		        oDfrdDate.then(function() {
			        for (var i = 0; i < aDates.length; i++) {
				        var aDate = aDates[i].Day;
				        // timezoneOffset is in hours convert to milliseconds
				        var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
				        if (TZOffsetMs > 0) {
					        var aDateStr = oDateTimeFormat.format(new Date(aDate.getTime() + TZOffsetMs));
					        //parse back the strings into date object back to Time Zone
					        aDate = new Date(oDateTimeFormat.parse(aDateStr).getTime());
				        }
				        oDP.addSpecialDate(new DateTypeRange({
				        startDate : aDate,
				        type : sap.ui.unified.CalendarDayType.Type03
				        //check type
				        }));
			        }
		        });
	        },
	        getSpecialDate : function(oProject, aDates) {
		        var oView = this.getView("DashboardView");
		        var oDP = oView.byId("selectProjectDate");
		        var oDeferred = $.Deferred();
		        var oSelDate = oDP.getDateValue();
		        //creating key
		        var sCalendarPath = oView.getModel().createKey("/ProjectSet", {
		        Day : oSelDate,
		        ProjectNo : oProject.ProjectNo
		        });
		        sCalendarPath += "/ProjToCalendar";
		        oView.getModel().read(sCalendarPath, {
		        success : function(oData) {
			        oData.results.forEach(function(result) {
				        aDates.push(result);
			        });
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        displayDate : function() {
		        var self = this;
		        var sDatePattern = "MM/dd/yyyy";
		        if (self.getModel("user"))
			        sDatePattern = self.getModel("user").getProperty("/DateFormat");
		        var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			        pattern : sDatePattern
		        });
		        var oNow = new Date(); // today's date
		        // timezoneOffset is in hours convert to milliseconds
		        var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
		        if (TZOffsetMs > 0) {
			        var aDateStr = oDateTimeFormat.format(new Date(oNow.getTime() + TZOffsetMs));
			        //parse back the strings into date object back to Time Zone
			        var oNow = new Date(oDateTimeFormat.parse(aDateStr).getTime());
		        }
		        var nMS = 1000 * 60 * 60 * 24; //milliseconds in a day	
		        var oSubsDays;
		        if (oNow.getDay() === 1) {
			        oSubsDays = 3;
		        } else if (oNow.getDay() === 0) {
			        oSubsDays = 2;
		        } else {
			        oSubsDays = 1;
		        }
		        var oDate = new Date(oNow.getTime() - (nMS * oSubsDays));
		        var oPrevDate = oDateTimeFormat.format(oDate);
		        this.byId("selectProjectDate").setValue(oPrevDate);
		        oPrevDate = formatter.formatODataDate(oDate);
		        this.getOwnerComponent().getModel("ProjectFilters").setProperty("/selDate", oPrevDate);
	        },
	        handleDateChange : function(oEvent) {
		        var oDP = oEvent.oSource;
		        var sValue = oEvent.getParameter("value");
		        var bValid = oEvent.getParameter("valid");
		        if (bValid && (sValue !== "")) {
			        oDP.setValueState(sap.ui.core.ValueState.None);
			        this.getModel("ProjectFilters").setProperty("/selDate", sValue);
			        this._getProjects();
		        } else {
			        oDP.setValueState(sap.ui.core.ValueState.Error);
		        }
	        },
	        validateDate : function() {
		        sap.ui.getCore().attachParseError(function(oEvent) {
			        var oElement = oEvent.getParameter("element");
			        if (oElement.setValueState) {
				        oElement.setValueState(sap.ui.core.ValueState.Error);
			        }
		        });
		        sap.ui.getCore().attachValidationSuccess(function(oEvent) {
			        var oElement = oEvent.getParameter("element");
			        if (oElement.setValueState) {
				        oElement.setValueState(sap.ui.core.ValueState.None);
			        }
		        });
	        },
	        onSearchProject : function(oEvent) {
		        var self = this;
		        var oModel = this.getModel();
		        var oSearchField = oEvent.getSource();
		        var sSearchTxt = oSearchField.getValue();
		        var oProject = {
			        "Text" : sSearchTxt
		        };
		        // Set view to busy state
		        self.getModel("DashboardView").setProperty("/busy", true);
		        var oHandle = oModel
		            .callFunction("/GetMtcdProject", {
		            method : "GET",
		            urlParameters : oProject,
		            success : function(oData, reponse) {
			            var oModel = models.createJSONModel(oData.results, "TwoWay");
			            self.setModel(oModel, "projectDesc");
			            // Open search popover
			            self._oSearchProjFrgmt = self
			                .openSelectionPopover(self._oSearchProjFrgmt, "zwo.ui.wks_rep.view.fragment.searchPopover", oSearchField);
			            // Set view to not busy state
			            self.getModel("DashboardView").setProperty("/busy", false);
		            },
		            error : function(oError) {
			            MessageToast.show(self.getResourceBundle().getText("errorGetProj") + " "
			                + oError.message);
			            // Set view to not busy state
			            self.getModel("DashboardView").setProperty("/busy", false);
		            }
		            });
	        },
	        onSuggestProject : function(oEvent) {
		        var oSearchField = oEvent.getSource();
		        var value = oSearchField.getValue();
		        var filters = [];
		        // Applying filter to Name and Number fields
		        if (value) {
			        filters = [new sap.ui.model.Filter([new sap.ui.model.Filter("Name",
			            function(sProjName) {
				            return (sProjName || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
			            }), new sap.ui.model.Filter("Number", function(sProjNum) {
				        return (sProjNum || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
			        })], false)];
		        }
		        if (this._oSearchProjFrgmt) {
			        var oResultList = this._oSearchProjFrgmt.getModel("projectDesc").getData();
			        if (oResultList.length !== 0) {
				        // Applying filter
				        this.byId("resultList").getBinding("items").filter(filters);
				        oSearchField.suggest();
			        }
		        }
	        },
	        onSearchPopoverOpened : function() {
		        // Set focus on search input field
		        var oSearchField = this.byId("searchProjField");
		        oSearchField.focus();
	        },
	        handleAcceptSearch : function(oEvent) {
		        var self = this;
		        var oResultList = this.byId("resultList");
		        var oSelProjects = oResultList.getSelectedItems();
		        var oProjSelModel = self.getModel("ProjectFilters");
		        var aSelProj = oProjSelModel.getProperty("/selProjects");
		        oSelProjects.forEach(function(oProj, index) {
			        var oTmp = {};
			        oTmp.Name = oProj.getBindingContext("projectDesc").getProperty("Name");
			        oTmp.Number = oProj.getBindingContext("projectDesc").getProperty("Number");
			        // Saving selected project to save in model
			        aSelProj.push(oTmp);
		        });
		        if (aSelProj.length !== 0) {
			        // Saving selected projects in model
			        oProjSelModel.setProperty("/selProjects", aSelProj);
			        // Requesting for selected projects
			        self._getProjects();
		        }
		        // Closing search popover
		        this._oSearchProjFrgmt.close();
	        },
	        handleDeclineSearch : function() {
		        this._oSearchProjFrgmt.close();
	        },
	        onSelectForeman : function(oEvent) {
		        var self = this;
		        var oSelectForemanList = oEvent.getSource();
		        // Opening select foreman popover
		        self._oSelectForFrgmt = self
		            .openSelectionPopover(self._oSelectForFrgmt, "zwo.ui.wks_rep.view.fragment.selectPopover", oSelectForemanList);
		        // Pre-selecting foremen previously selected
		        self._selectForemenChkBox();
	        },
	        onSuggestForeman : function(oEvent) {
		        var oSelectForemanList = oEvent.getSource();
		        var value = oSelectForemanList.getValue();
		        var filters = [];
		        // Applying filter to Name and PersonNo fields
		        if (value) {
			        filters = [new sap.ui.model.Filter([new sap.ui.model.Filter("ForemanNo",
			            function(sForemanNo) {
				            return (sForemanNo || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
			            }), new sap.ui.model.Filter("ForemanName", function(sForemanName) {
				        return (sForemanName || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
			        })], false)];
		        }
		        if (this._oSelectForFrgmt) {
			        var oResultForemanList = this._oSelectForFrgmt.getModel("foremanList").getData();
			        if (oResultForemanList.length !== 0) {
				        // Applying filter
				        this.byId("foremanSelectList").getBinding("items").filter(filters);
				        oSelectForemanList.suggest();
			        }
		        }
	        },
	        handleAcceptForemen : function(oEvent) {
		        var self = this;
		        var oResultForemanList = self.byId("foremanSelectList");
		        var oSelForemen = oResultForemanList.getSelectedItems();
		        var aSelForemen = [];
		        oSelForemen.forEach(function(oForeman, index) {
			        var oTmp = {};
			        oTmp.Name = oForeman.getBindingContext("foremanList").getProperty("ForemanName");
			        oTmp.Number = oForeman.getBindingContext("foremanList").getProperty("ForemanNo");
			        // Saving selected foreman to save in model
			        aSelForemen.push(oTmp);
		        });
		        // Obtaining details of selected project
		        var oProject = self._getSelectedProj();
		        if (oProject) {
			        // Saving selected foreman in project filter model
			        self._setSelForemen(oProject.ProjectNo, oProject.Day, aSelForemen);
			        // Displaying number of foremen in search field placeholder
			        self._displayNumForemen();
			        // Requesting for selected project with foreman filter
			        var oDeferredGet = self
			            ._getFilteredProj(oProject.ProjectNo, oProject.Day, oProject.ProjectIndex);
			        oDeferredGet.then(
			        //Success handler
			        function() {
				        /*var oProjList = self.getModel("ProjectSet").getData();
				        self._drawCharts(oProjList);*/
				        // Disabling select foreman field
				        //self.byId("selectForemanList").setEnabled(false);
			        },
			        // Error handler
			        function() {
				        MessageToast.show(self.getResourceBundle().getText("errorFiltrFrmen"));
				        // Disabling select foreman field
				        self.byId("selectForemanList").setEnabled(false);
			        });
		        }
		        // Closing select foreman popover
		        this._oSelectForFrgmt.close();
	        },
	        handleDeclineForemen : function() {
		        var oForemanList = this.byId("foremanSelectList");
		        var aSelForemen = oForemanList.getSelectedItems();
		        aSelForemen.forEach(function(oForeman) {
			        oForeman.setSelected(false);
		        });
		        this._oSelectForFrgmt.close();
	        },
	        handleCheckProj : function(oEvent) {
		        var self = this;
		        var oControl = oEvent.getSource();
		        var oProjSelModel = self.getModel("ProjectFilters");
		        // if Project Checkbox is selected
		        if (oControl.getSelected()) {
			        // Disabling unselected projects
			        self._disableUnSelectedCB();
			        // Displaying number of foremen in search field placeholder
			        self._displayNumForemen();
			        // Keeping previously selected projects with their foreman filters
			        var aProjForemen = oProjSelModel.getProperty("/selForemen");
			        // Getting ProjectSet data of selected project
			        var oContext = oEvent.getSource().getBindingContext("ProjectSet");
			        var sPath = oContext.getPath();
			        var oProjSetSelected = oContext.getProperty(sPath + "/");
			        var oProjDetails = {
			        ProjectIndex : parseInt(sPath.substring(1)),
			        ProjectNo : oProjSetSelected.ProjectNo,
			        ProjectName : oProjSetSelected.ProjectName,
			        Day : oProjSetSelected.Day,
			        foremen : []
			        };
			        // Saving selected project in ProjectFilters model and initializing its foreman filters 
			        self._initSelForemen(oProjDetails);
			        // Requesting foremen list for project selected to be displayed in dropdown list
			        self._getProjForemen(oProjSetSelected);
			        self.specialDate();
		        } else {
			        // Re-enablind all projects
			        self._enableAllCB();
			        // Disabling select foreman field if project is unselected
			        self.byId("selectForemanList").setEnabled(false);
			        //Displaying No of foremen selected in placeholder
			        self.byId("selectForemanList").setPlaceholder(self.getResourceBundle()
			            .getText("dBSelectPlacehdr"));
			        //Displaying placeholder for report date still in need to be integrated in calendar
			        self.byId("selectProjectDate").destroySpecialDates();
		        }
	        },
	        onRenderChart : function(oEvent) {
		        var self = this;
		        var oVizFrame = oEvent.getSource();
		        var sLegendTitle = self.getResourceBundle().getText("legendTitle");
		        var formatterInstance = ChartFormatter.getInstance();
		        Format.numericFormatter(formatterInstance);
		        formatterInstance.registerCustomFormatter("percent", function(value) {
			        var percentFormat = sap.ui.core.format.NumberFormat.getPercentInstance({
			        style : 'standard',
			        maxFractionDigits : 1
			        });
			        return percentFormat.format(value);
		        });
		        oVizFrame.setVizProperties({
		        title : {
			        visible : false
		        },
		        plotArea : {
		        dataLabel : {
		        visible : true,
		        formatString : "percent",
		        },
		        radius : "0.34",
		        innerRadiusRatio : "0.65",
		        colorPalette : ['#DFDFDF', '#6D93BA', '#E20026', '#26A000', '#807C7C']
		        },
		        legendGroup : {
			        layout : {
			        position : "bottom",
			        maxWidth : "0.25",
			        height : "90px",
			        }
		        },
		        legend : {
			        title : {
			        visible : true,
			        text : sLegendTitle
			        }
		        },
		        general : {
			        layout : {
				        padding : "10"
			        }
		        },
		        interaction : {
			        noninteractiveMode : true
		        }
		        });
	        },
	        //SR 548154 Project Lock
	        onDisplaySynthesis : function(oEvent) {
		        var self = this;
		        var oContext = oEvent.getSource().getBindingContext("ProjectSet");
		        var iProjectNo = oContext.getProperty("ProjectNo");
		        var sDay = oContext.getProperty("Day");
		        var oDfrdRep = self.getRepVersions(iProjectNo, sDay);
		        oDfrdRep.done(function() {
			        self.getRouter().navTo("preview", {
			        "Day" : sDay,
			        "ProjectNo" : iProjectNo
			        }, true);
		        });
	        },
	        //End SR 548154 Project Lock
	        onDisplayPapyrusSynthesis : function(oEvent) {
		        var self = this;
		        var oContext = oEvent.getSource().getBindingContext("ProjectSet");
		        var iProjectNo = oContext.getProperty("ProjectNo");
		        var sDay = oContext.getProperty("Day");
		        var oDfrdRep = self.getRepVersions(iProjectNo, sDay);
		        oDfrdRep.done(function() {
			        self.getRouter().navTo("papyrus", {
			        "Day" : sDay,
			        "ProjectNo" : iProjectNo,
			        }, true);
		        });
	        },
	        onNavBack : function(oEvent) {
		        this.onNavBack();
	        },
	        onPressFav : function(oEvent) {
		        var self = this;
		        var oControl = oEvent.getSource();
		        var oContext = oControl.getBindingContext("ProjectSet");
		        var sPath = oContext.getPath();
		        var oProj = oContext.getProperty(sPath + "/");
		        var oModel = self.getModel();
		        var oUpdProj = {
		        Day : oProj.Day,
		        ExistingData : oProj.ExistingData,
		        FlagFavorite : oProj.FlagFavorite,
		        ForemanNo : oProj.ForemanNo,
		        NumReports : oProj.NumReports,
		        ProjectName : oProj.ProjectName,
		        ProjectNo : oProj.ProjectNo,
		        StatError : oProj.StatError,
		        StatInProg : oProj.StatInProg,
		        StatLock : oProj.StatLock,
		        StatNonInteg : oProj.StatNonInteg,
		        StatOk : oProj.StatOk,
		        TotalCost : oProj.TotalCost
		        };
		        self.getModel("DashboardView").setProperty("/busy", true);
		        // Add as favourite
		        if (oControl.getPressed()) {
			        oModel.create("/ProjectSet", oUpdProj, {
			        success : function(oData) {
				        MessageToast.show(self.getResourceBundle().getText("successAddFav"));
				        self.getModel("DashboardView").setProperty("/busy", false);
			        },
			        error : function(oError) {
				        MessageToast.show(self.getResourceBundle().getText("errorAddFav"));
				        jQuery.sap.log.error(oError.message);
				        self.getModel("DashboardView").setProperty("/busy", false);
			        }
			        });
			        // Delete as favourite	
		        } else {
			        var sDate = self.getModel("ProjectFilters").getProperty("/selDate");
			        var sUri = "/ProjectSet(Day=datetime'" + sDate + "',ProjectNo='" + oUpdProj.ProjectNo
			            + "')";
			        oModel.remove(sUri, {
			        success : function(oData) {
				        MessageToast.show(self.getResourceBundle().getText("successDelFav"));
				        self.getModel("DashboardView").setProperty("/busy", false);
			        },
			        error : function(oError) {
				        MessageToast.show(self.getResourceBundle().getText("errorDelFav"));
				        jQuery.sap.log.error(oError.message);
				        self.getModel("DashboardView").setProperty("/busy", false);
			        }
			        });
		        }
	        },
	        //SR 548154 Project Lock
	        onPressProject : function(oEvent) {
		        var self = this;
		        var oContext = oEvent.getSource().getBindingContext("ProjectSet");
		        var iProjectNo = oContext.getProperty("ProjectNo");
		        var sDay = oContext.getProperty("Day");
		        // Passing selected foremen array to Input screen filters model
		        var aSelForemen = self._getSelForemen(iProjectNo, sDay);
		        if (aSelForemen && aSelForemen.length > 0) {
			        self.getModel("InScreenFilters").setProperty("/Foremen", aSelForemen);
		        } else {
			        self.getModel("InScreenFilters").setProperty("/Foremen", []);
		        }
		        // Fetching reports of selected foremen for project
		        var oDfrdRep = self.getRepVersions(iProjectNo, sDay);
		        oDfrdRep.done(function() {
			        self.getRouter().navTo("project", {
			        "Day" : sDay,
			        "ProjectNo" : iProjectNo
			        }, true);
		        });
	        },
	        //End SR 548154 Project Lock
	        _getProjects : function() {
		        var self = this;
		        var oDeferred = $.Deferred();
		        var oResults = {};
		        var oFilter = self._getProjFilters();
		        var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter]
		            : [];
		        // Setting view to busy state
		        self.getModel("DashboardView").setProperty("/busy", true);
		        // Requesting for ProjectSet details of selected projects
		        self.getModel().read("/ProjectSet", {
		        filters : aFilters,
		        success : function(oData) {
			        oResults = oData.results;
			        oResults = self._createChartData(oResults);
			        // Setting oData results to ProjectSet model
			        var oModel = self.getModel("ProjectSet");
			        if (!oModel) {
				        oModel = models.createJSONModel(oResults, "TwoWay");
				        self.setModel(oModel, "ProjectSet");
			        } else {
				        oModel.setData(oResults);
			        }
			        /*self._drawCharts(oResults);*/
			        // Set view to not busy state
			        self.getModel("DashboardView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorGetSelProj") + " "
			            + oError.message);
			        // Set view to not busy state
			        self.getModel("DashboardView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        _getFilteredProj : function(iProjNum, sDay, index) {
		        var self = this;
		        var oDeferred = $.Deferred();
		        var sPath = "/" + index + "/";
		        // Getting foremen filters
		        var oFilter = self._getForemanFilters(iProjNum, sDay);
		        var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter]
		            : [];
		        // Setting view to busy state
		        self.getModel("DashboardView").setProperty("/busy", true);
		        self.getModel().read("/ProjectSet", {
		        filters : aFilters,
		        success : function(oData) {
			        var oResults = self._createChartData(oData.results);
			        // Setting oData results to ProjectSet model
			        var oModel = self.getModel("ProjectSet");
			        if (!oModel) {
				        oModel = models.createJSONModel(oResults, "TwoWay");
				        self.setModel(oModel, "ProjectSet");
			        } else {
				        // Saving returned filtered project, 
				        // ignoring other returned favorite projects
				        var iProjNo = oModel.getProperty(sPath + "ProjectNo");
				        oResults.forEach(function(proj) {
					        if (proj.ProjectNo === iProjNo) {
						        // Adding a property for the state of the checkbox 
						        proj.Selected = true;
						        proj.Enabled = true;
						        oModel.setProperty(sPath, proj);
					        }
				        });
			        }
			        // Set view to not busy state
			        self.getModel("DashboardView").setProperty("/busy", false);
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorGetSelProj") + " "
			            + oError.message);
			        // Set view to not busy state
			        self.getModel("DashboardView").setProperty("/busy", false);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        _getProjForemen : function(oProject) {
		        var self = this;
		        var oModel = this.getModel();
		        var oDeferred = $.Deferred();
		        var oFilter = {};
		        var aFilters = [];
		        // Getting data from ProjectFilters model
		        var oProjSelModel = this.getModel("ProjectFilters");
		        var sSelDate = oProjSelModel.getData().selDate;
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        // Creating date filter
		        if (sSelDate) {
			        var oDate = new Date(sSelDate);
			        aFilters.push(new sap.ui.model.Filter("Day", oOperatorEQ, oDate));
		        }
		        // Creating project filter
		        if (oProject.ProjectNo) {
			        aFilters.push(new sap.ui.model.Filter("ProjectNo", oOperatorEQ, oProject.ProjectNo));
		        }
		        oFilter = new sap.ui.model.Filter(aFilters, true);
		        self.getModel().read("/ProjectForemanSet", {
		        filters : [oFilter],
		        success : function(oData) {
			        var oModel = models.createJSONModel(oData.results, "TwoWay");
			        self.setModel(oModel, "foremanList");
			        //jQuery.sap.log.error("No of Foremen returned: " + oData.results.length);
			        if (oData.results.length > 0) {
				        self.byId("selectForemanList").setEnabled(true);
			        } else {
				        MessageToast.show(self.getResourceBundle().getText("noForemenTxt"));
				        self.byId("selectForemanList").setEnabled(false);
			        }
			        oDeferred.resolve();
		        },
		        error : function(oError) {
			        MessageToast.show(self.getResourceBundle().getText("errorGetFrmen") + " "
			            + oError.message);
			        oDeferred.reject();
		        }
		        });
		        return oDeferred.promise();
	        },
	        _getProjFilters : function() {
		        // Getting data from model
		        var oProjSelModel = this.getModel("ProjectFilters");
		        var aSelProj = oProjSelModel.getData().selProjects;
		        var oSelForemen = oProjSelModel.getData().selForemen;
		        var sSelDate = oProjSelModel.getData().selDate;
		        var aFilters = [];
		        // Setting filter operator
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        // Saving date filter
		        if (sSelDate) {
			        aFilters.push(new sap.ui.model.Filter("Day", oOperatorEQ, sSelDate));
		        }
		        // Saving project filters
		        if ((aSelProj.length !== 0)) {
			        var aTmp = [];
			        aSelProj.forEach(function(oProj) {
				        aTmp.push(new sap.ui.model.Filter("ProjectNo", oOperatorEQ, oProj.Number));
			        });
			        aFilters.push(new sap.ui.model.Filter(aTmp, false));
		        }
		        var oFilter = new sap.ui.model.Filter(aFilters, true);
		        return oFilter;
	        },
	        _getForemanFilters : function(iProjNum, sDay) {
		        // Getting data from model
		        var oProjSelModel = this.getModel("ProjectFilters");
		        var aSelForemen = this._getSelForemen(iProjNum, sDay);
		        var sSelDate = oProjSelModel.getData().selDate;
		        var aFilters = [];
		        // Setting filter operator
		        var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		        // Date filter
		        if (sSelDate) {
			        var oDate = new Date(sSelDate);
			        aFilters.push(new sap.ui.model.Filter("Day", oOperatorEQ, oDate));
		        }
		        // Project filter
		        if (iProjNum) {
			        aFilters.push(new sap.ui.model.Filter("ProjectNo", oOperatorEQ, iProjNum));
		        }
		        // Foremen filters
		        if (aSelForemen && (aSelForemen.length !== 0)) {
			        var aTmp = [];
			        aSelForemen.forEach(function(oForeman) {
				        aTmp.push(new sap.ui.model.Filter("ForemanNo", oOperatorEQ, oForeman.Number));
			        });
			        aFilters.push(new sap.ui.model.Filter(aTmp, false));
		        }
		        var oFilter = new sap.ui.model.Filter(aFilters, true);
		        return oFilter;
	        },
	        _createChartData : function(oData) {
		        var aStats = [];
		        var self = this;
		        // Creating array of Status vs NumReports for chart data
		        oData.forEach(function(data) {
			        aStats.push({
			        "Status" : self.getResourceBundle().getText("notIntegrated"),
			        "NumReports" : data.StatNonInteg
			        });
			        aStats.push({
			        "Status" : self.getResourceBundle().getText("inProgress"),
			        "NumReports" : data.StatInProg
			        });
			        aStats.push({
			        "Status" : self.getResourceBundle().getText("error"),
			        "NumReports" : data.StatError
			        });
			        aStats.push({
			        "Status" : self.getResourceBundle().getText("ok"),
			        "NumReports" : data.StatOk
			        });
			        aStats.push({
			        "Status" : self.getResourceBundle().getText("lock"),
			        "NumReports" : data.StatLock
			        });
			        data.Day = formatter.formatODataDate(data.Day);
			        data.Integrations = aStats;
			        // Adding a property for the state of the checkbox 
			        data.Selected = false;
			        data.Enabled = true;
			        aStats = [];
		        });
		        return oData;
	        },
	        _disableUnSelectedCB : function() {
		        var self = this;
		        var oModel = self.getModel("ProjectSet");
		        var aProjects = oModel.getData();
		        aProjects.forEach(function(oProj) {
			        if (oProj.Selected) {
				        oProj.Enabled = true;
			        } else {
				        oProj.Enabled = false;
			        }
		        });
	        },
	        _enableAllCB : function() {
		        var self = this;
		        var oModel = self.getModel("ProjectSet");
		        var aProjects = oModel.getData();
		        aProjects.forEach(function(oProj) {
			        oProj.Enabled = true;
		        });
	        },
	        _getSelectedProj : function() {
		        var self = this;
		        var oProjModel = self.getModel("ProjectSet");
		        var aProjects = oProjModel.getData();
		        var oFiltersModel = self.getModel("ProjectFilters");
		        var aForemen = oFiltersModel.getProperty("/selForemen");
		        // Checking property Selected in ProjectSet model for each project and returning the
		        // corresponding project in ProjectFilters model for which Selected is true
		        for (var i = 0; i < aProjects.length; i++) {
			        if (aProjects[i].Selected) {
				        for (var j = 0; j < aForemen.length; j++) {
					        if (aForemen[j].ProjectNo === aProjects[i].ProjectNo
					            && aForemen[j].Day.toString() === aProjects[i].Day.toString()) {
						        return aForemen[j];
					        }
				        }
			        }
		        }
	        },
	        _initSelForemen : function(oProj) {
		        var self = this;
		        var oFiltersModel = self.getModel("ProjectFilters");
		        var aProjForeman = oFiltersModel.getProperty("/selForemen");
		        var bFound = false;
		        for (var i = 0; i < aProjForeman.length; i++) {
			        if (aProjForeman[i].ProjectNo === oProj.ProjectNo
			            && aProjForeman[i].Day.toString() === oProj.Day.toString()) {
				        bFound = true;
				        break;
			        }
		        }
		        // If project has not already been entered in array selForemen, push the project
		        if (!bFound) {
			        // Note that order of project in array selForemen does not reflect order in ProjectSet model
			        // Position of project can be obtained in ProjectIndex property
			        aProjForeman.push(oProj);
		        }
		        oFiltersModel.setProperty("/selForemen", aProjForeman);
	        },
	        _setSelForemen : function(iProjNum, sDay, aForemen) {
		        var self = this;
		        var oFiltersModel = self.getModel("ProjectFilters");
		        var aProjForemen = oFiltersModel.getProperty("/selForemen");
		        for (var i = 0; i < aProjForemen.length; i++) {
			        if (aProjForemen[i].ProjectNo === iProjNum
			            && aProjForemen[i].Day.toString() === sDay.toString()) {
				        aProjForemen[i].foremen = aForemen;
				        break;
			        }
		        }
	        },
	        _getSelForemen : function(iProjNum, sDay) {
		        var self = this;
		        var oFiltersModel = self.getModel("ProjectFilters");
		        var aProjForemen = oFiltersModel.getProperty("/selForemen");
		        for (var i = 0; i < aProjForemen.length; i++) {
			        if (aProjForemen[i].ProjectNo === iProjNum
			            && aProjForemen[i].Day.toString() === sDay.toString()) {
				        return aProjForemen[i].foremen;
			        }
		        }
	        },
	        _selectForemenChkBox : function() {
		        var self = this;
		        var oTable = self.byId("foremanSelectList");
		        if (oTable) {
			        // Obtaining list of all foremen displayed in dropdown list
			        var aForemen = oTable.getItems();
			        // Obtaining selected project
			        var oProject = self._getSelectedProj();
			        if (oProject) {
				        // Obtaining selected foremen
				        var aSelForemen = self._getSelForemen(oProject.ProjectNo, oProject.Day);
				        if (aSelForemen && aSelForemen.length !== 0) {
					        // Selecting checkbox of selected foremen for selected project
					        aForemen
					            .forEach(function(oForeman) {
						            for (var i = 0; i < aSelForemen.length; i++) {
							            if (oForeman.getBindingContext("foremanList").getProperty("ForemanNo") === aSelForemen[i].Number) {
								            oForeman.setSelected(true);
							            }
						            }
					            });
				        }
			        }
		        }
	        },
	        _displayNumForemen : function() {
		        var self = this;
		        var oProjModel = self.getModel("ProjectFilters");
		        var oProject = self._getSelectedProj();
		        if (oProject) {
			        var aForemen = self._getSelForemen(oProject.ProjectNo, oProject.Day);
			        var oSearchField = self.byId("selectForemanList");
			        //Displaying No of foremen selected in placeholder
			        if (aForemen.length === 0) {
				        oSearchField.setPlaceholder(self.getResourceBundle().getText("dBSelectPlacehdr"));
			        } else if (aForemen.length === 1) {
				        oSearchField.setPlaceholder(aForemen.length + " "
				            + self.getResourceBundle().getText("OneForemanTxt"));
			        } else {
				        oSearchField.setPlaceholder(aForemen.length + " "
				            + self.getResourceBundle().getText("ManyForemenTxt"));
			        }
		        }
	        },
	        //SR 548154 Project Lock
	        _onDashboardMatched : function(oEvent) {
		        if (oEvent.getParameter("name") === "dashboard") {
			        var self = this;
			        var oComponent = self.getOwnerComponent();
			        // Disable foreman search field
			        self.byId("selectForemanList").setEnabled(false);
			        // Setting placeholder of foreman search field
			        var oSearchField = self.byId("selectForemanList");
			        oSearchField.setPlaceholder(self.getResourceBundle().getText("dBSelectPlacehdr"));
			        oComponent.oWhenMetadataIsLoaded.then(
			        // Success handler
			        function() {
				        oComponent.oUserReady
				            .then(function() {
					            // Displaying date in user-specified format
					            if (!oComponent.getModel("ProjectFilters").getProperty("/selDate")) {
						            self.displayDate();
					            }
					            // Requesting for favorite and selected projects
					            self._getProjects();
					            // Setting placeholder of foreman search field
					            var oSearchField = self.byId("selectForemanList");
					            oSearchField.setPlaceholder(self.getResourceBundle()
					                .getText("dBSelectPlacehdr"));
					            //Unlock Project
					            if (self.getModel("UnlockFilters").getProperty("/ProjectNo")) {
						            self.unlockProject();
						            self.timeOut(self);
					            }
				            });
			        }.bind(oComponent));
		        }
	        }
	        });
    });
//End SR 548154 Project Lock
