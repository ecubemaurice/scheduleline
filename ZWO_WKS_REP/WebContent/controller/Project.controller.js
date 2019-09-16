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
		"sap/ui/model/json/JSONModel"
		
	], function (BaseController, formatter, Fragment, MessageToast, models, JSONModel) {
		"use strict";

	return BaseController.extend("zwo.ui.wks_rep.controller.Project", {

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
		    this.setModel(oViewModel, "ProjectView");		    
		    this.getRouter().getRoute("project").attachPatternMatched(this._onProjectPatternMatched, this);
		    //this.getRouter().attachRouteMatched(this._onProjectPatternMatched, this);		    
		    // Setting models for project header
		    this.setStatusModel();
		    this._setCategoryModel();
		    
			var oMainPage = this.getView().byId("project");			
			if(oMainPage) {
				oMainPage.addEventDelegate({
					"onAfterRendering": this.onMainPageRendered
				}, this);
			}
			
		},
		
		onSelectCategory : function(oEvent) {
			var self = this;		
			// Opening selectCategory popover
			var oControl = oEvent.getSource();
			this._oCategoryFrgmt = this.openSelectionPopover(this._oCategoryFrgmt, 
					"zwo.ui.wks_rep.view.fragment.selectCategory", 
					oControl);			
		},
		
		onNoInputLiveChange : function(oEvent) {
			// Clearing input field
			var oControl = oEvent.getSource();
			oControl.setValue("");			
		},
		
		handleAcceptStatus : function() {
			// Status searchfield
			var oControl = this.getView().byId("selectStatus");
			var self= this;
			var oStatusList = this.byId("statusSelectList");
			var oStatusItems = oStatusList.getSelectedItems();
			var aStatus = [];
						
			oStatusItems.forEach(function(status) {
				var oTmp = {};
				oTmp.Index = status.getBindingContext("statusList").getProperty("index");
				oTmp.Status =  status.getBindingContext("statusList").getProperty("status");	
				// Saving selected status to save in model
				aStatus.push(oTmp);								
			});
			
			//Displaying No of status selected in placeholder
			if(aStatus.length !== 0) { 		
				oControl.setPlaceholder(aStatus.length + " " + self.getResourceBundle().getText("ManyStatusTxt"));						
			} else {
				oControl.setPlaceholder(self.getResourceBundle().getText("statusTxt"));				
			}			
			// Saving selected statuses in model
			self.getModel("InScreenFilters").setProperty("/Status", aStatus);
			
			// Closing Status fragment
			this._oStatusFrgmt.close();
			
			//Initiate filter
			self.onPressFilter();
		},
		
		handleAcceptReport : function() {
			// Report Searchfield
			var oControl = this.getView().byId("selectReport");
			var self= this;
			var oReportList = this.byId("reportSelection");
			var oReportItems = oReportList.getSelectedItems();
			var aReport = [];
						
			oReportItems.forEach(function(report, index) {
				var oTmp = {};
				oTmp.ForemanNo =  report.getBindingContext("reportList").getProperty("ForemanNo");	
				oTmp.Version =  report.getBindingContext("reportList").getProperty("Version");
				oTmp.Origin =  report.getBindingContext("reportList").getProperty("Origin");
				// Saving selected status to save in model
				aReport.push(oTmp);	
			});
			
			//Displaying No of reports selected in placeholder
			if(aReport.length === 1) 				
				oControl.setPlaceholder(aReport.length + " " + self.getResourceBundle().getText("OneReportTxt"));
			else if(aReport.length > 1)
				oControl.setPlaceholder(aReport.length + " " + self.getResourceBundle().getText("ManyReportTxt"));
			else 
				oControl.setPlaceholder(self.getResourceBundle().getText("reportTxt"));
						
			// Saving selected reports in model
			self.getModel("InScreenFilters").setProperty("/Reports", aReport);			
			
			// Closing Report fragment
			this._oReportFrgmt.close();
			
			//Initiate filter
			self.onPressFilter();
		},
		
		handleAcceptCategory : function() {
			// Category search field
			var oControl = this.getView().byId("selectCategory");
			var self= this;
			var oCategoryList = this.byId("categorySelectList");
			var oCategoryItems = oCategoryList.getSelectedItems();
			var aCat = [];
			
			oCategoryItems.forEach(function(category, index) {
				var oTmp = {};
				oTmp =  category.getBindingContext("categoryList").getProperty("category");	
				// Saving selected status to save in model
				aCat.push(oTmp);		
			});
			
			//Displaying No of categories selected in placeholder
			if(aCat.length === 1)
				oControl.setPlaceholder(aCat.length + " " + self.getResourceBundle().getText("OneCategoryTxt"));
			else if(aCat.length === 8)
				oControl.setPlaceholder(self.getResourceBundle().getText("AllCategoryTxt"));
			else if(aCat.length > 1) 				
				oControl.setPlaceholder(aCat.length + " " + self.getResourceBundle().getText("ManyCategoryTxt"));							
			else 
				oControl.setPlaceholder(self.getResourceBundle().getText("AllCategoryTxt"));				
							
			// Saving selected reports in model
			self.getModel("InScreenFilters").setProperty("/Category", aCat);
			
			// Applying filter on icon tab bar
			self._setIcnTabFtr();
			
			// Closing Category fragment
			this._oCategoryFrgmt.close();
		},
		
		handleDeclineCategory : function() {
			// Closing Category fragment
			this._oCategoryFrgmt.close();
		},
				
		onPressFilter : function() {
			var self = this;
			var oModel = self.getModel("InScreenFilters");
			var sDay = formatter.formatODataDate(oModel.getProperty("/ProjectSet/Day"));
			var sProjectNo = oModel.getProperty("/ProjectSet/ProjectNo");
			var aCat = self.getModel("InScreenFilters").getProperty("/Category");
			var oIcnTbBar = self.byId("idIconTabBar");
			
			// Reset to first icon tab filter
			if(oIcnTbBar) {
				if(aCat.length !== 0) {
					oIcnTbBar.setSelectedKey(aCat[0]);
				} else {
					oIcnTbBar.setSelectedKey(self.getResourceBundle().getText("Lab"));
				}							
				oIcnTbBar.rerender();
				var sKey = oIcnTbBar.getSelectedKey();
				self._navToCategory(sKey);
			}
		},
		
		onPressFlagAll: function(oEvent) {
			var self = this;			
			var oControl = oEvent.getSource();
			var oInScreenModel = self.getModel("InScreenFilters");
			var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
			var oResourceBundle = self.getResourceBundle();
			var bFlagInt = false;
			var sIntStatus = "";
			var sRepFilters = "";
			
			var aRep = oInScreenModel.getProperty("/Reports");
			var aStatus = oInScreenModel.getProperty("/Status");
			
			// Setting FlagInt to true to flag all
			if(oControl.getPressed()) {
				oControl.setText(self.getResourceBundle().getText("showUnFlagAllButtonText"));
				bFlagInt = true;
			} else {	// Setting FlagInt to false to unflag all
				oControl.setText(self.getResourceBundle().getText("showFlagAllButtonText"));
				bFlagInt = false;
			}
			
			// Creating custom url parameter to filter by IntStatus
			if(aStatus.length > 0) {
				// Integration Status Not Integrated has two indices 0 and 1
				sIntStatus += aStatus[0].Index;				
				if(aStatus[0].Index === "0") {
					sIntStatus += " and IntStatus = 1 ";
				}
			}
			
			if(aStatus.length > 1) {
				for(var i = 1; i < aStatus.length; i++){
					// Integration Status Not Integrated has two indices 0 and 1
					sIntStatus += (" and IntStatus = " + aStatus[i].Index);
					if(aStatus[i].Index === "0") {
						sIntStatus += " and IntStatus = 1 ";
					}
				}
			}
			
			// Creating custom url parameter to filter by Report filters
			if(aRep.length > 0) {
				sRepFilters += "(Origin eq " + aRep[0].Origin + " and ForemanNo eq " + 
								aRep[0].ForemanNo + " and Version eq " + aRep[0].Version + ")";
			}
			
			if(aRep.length > 1) {
				for(var i = 1; i < aRep.length; i++){					
					sRepFilters += " and (Origin eq " + aRep[i].Origin + " and ForemanNo eq " + 
					aRep[i].ForemanNo + " and Version eq " + aRep[i].Version + ")";
				}
			}
			
			// Getting selected icon tab filters
			var aCatModel = self.getModel("categoryList");
			var aCat = aCatModel.getData();
			var sLabor = aCat[0].selected;
			var sTemp = aCat[1].selected;
			var sEquip = aCat[2].selected;
			var sRental = aCat[3].selected;
			var sMaterial = aCat[4].selected;
			var sSubCon = aCat[5].selected;
			var sInternal = aCat[6].selected;
			var sQty = aCat[7].selected;
			
			var oParam = {
				"Day": sDay,
				"ProjectNo": sProjectNo,
				"FlagInt": bFlagInt,
				"Labor": sLabor,
				"Temporary": sTemp,
				"Equipment": sEquip,
				"Rental": sRental,
				"Material": sMaterial,
				"Subcontracting": sSubCon,
				"Internal": sInternal,
				"Quantity": sQty,
				"IntStatus": sIntStatus,
				"ReptFilter": sRepFilters				
			};			
			
			// Set view to busy state
			self.getModel("ProjectView").setProperty("/busy", true);
			
			var oModel = self.getModel();
			var aResults = [];
			var oHandle = oModel.callFunction("/FlagAll", { 	 
				method:"GET",		
				urlParameters: oParam,
				success: function(oData) {			
					MessageToast.show(self.getResourceBundle().getText("successUpdate"));
					var oIcnTbBar = self.byId("idIconTabBar");
					// Navigating to first selected category
					if(oIcnTbBar) {						
						self._navToCategory(oIcnTbBar.getSelectedKey());
					}
									
					// Set view to not busy state
					self.getModel("ProjectView").setProperty("/busy", false);
				},
				error: function(oError){
					MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
					// Set view to not busy state
					self.getModel("ProjectView").setProperty("/busy", false);
				}
			});
		},
		
		onPressControl : function(oEvent) {
			var self = this;			
			var oControl = oEvent.getSource();
			var oInScreenModel = self.getModel("InScreenFilters");
			var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
			var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
			var oResourceBundle = self.getResourceBundle();
			var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
		
			
			var aCatModel = self.getModel("categoryList");
			var aCat = aCatModel.getData();
			var sLabor = aCat[0].selected;
			var sTemp = aCat[1].selected;
			var sEquip = aCat[2].selected;
			var sRental = aCat[3].selected;
			var sMaterial = aCat[4].selected;
			var sSubCon = aCat[5].selected;
			var sInternal = aCat[6].selected;
			var sQty = aCat[7].selected;
			
			var oParam = {
					Day: sDay,
					ProjectNo: sProjectNo,
					Labor: sLabor,
					Temporary: sTemp,
					Equipment: sEquip,
					Rental: sRental,
					Material: sMaterial,
					Subcontracting: sSubCon,
					Internal: sInternal,
					Quantity: sQty
					
				};			
				
				var oFilter = self.getInScreenFilters();
				var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
				
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
				
				if(aFilters.length !== 0){
					oFilters.push(new sap.ui.model.Filter(aFilters, true));
				}
				
				var oModel = self.getModel();
				// Creating key set for ProjectSet entity
				var sControlPath = oModel.createKey("/ProjectSet", {
					ProjectNo: oParam.ProjectNo,
					Day: oParam.Day
				});
				
				sControlPath += "/ProjToAction";
				
				var aResults = [];
				oModel.read(sControlPath, {
					filters: oFilters,
					success: function(oData) {			
						MessageToast.show(oResourceBundle.getText("controlSuccess"));
						var aResults = oData.results;
						if(aResults.length !== 0){
							self._openControlDialog(oControl, aResults, self);
						}else {
							sap.m.MessageBox.information(
									"No Error Found",
									{
										title: "Data Control",
										styleClass: "customMessage"
									}
								);
						}
						// Set view to not busy state
						self.getModel("ProjectView").setProperty("/busy", false);
					},
					error: function(oError){
						MessageToast.show(oResourceBundle.getText("controlError"));
						// Set view to not busy state
						self.getModel("ProjectView").setProperty("/busy", false);
					}
				});
		},
		
		handleCloseControl: function() {
			//Closing control dialog window
			if(this._oControlDialog)
				this._oControlDialog.close();
		},
		
		onMainPageRendered : function() {
			var self = this;
			this._applyCssITBfilters();
			
			// Instantiating report fragment to be able to read which reports are selected by default
			if(!self._oReportFrgmt) {
				self._oReportFrgmt = sap.ui.xmlfragment(self.getView().getId(), 
						"zwo.ui.wks_rep.view.fragment.ReportPopover", self);
				self.getView().addDependent(self._oReportFrgmt);					
			}				
		},
		
		handleIconTabBarSelect : function(oEvent) {
			var self = this;
			var oControl = oEvent.getSource();
			var sKey = oControl.getSelectedKey();
			self._navToCategory(sKey);
		},
		
		//SR 548154 Project Lock
		onPressPreview : function(oEvent) {
			var self = this;
			var oModel = this.getModel("InScreenFilters");
			var sDay = formatter.formatODataDate(oModel.getProperty("/ProjectSet/Day"));
			var sProjectNo = oModel.getProperty("/ProjectSet/ProjectNo");
			
			var oUnlockModel = self.getModel("UnlockFilters");
			var iProjectNo = oUnlockModel.getProperty("/ProjectNo");
			var sDay = formatter.formatODataDate(oUnlockModel.getProperty("/Day"));
			var timer = oUnlockModel.getProperty("/Timer");

			var oParam = {
				"Day": sDay,
				"ProjectNo": iProjectNo,
				"Lock": false

			};
			
			if(iProjectNo !== "" && sDay !== ""){
				var oModel = self.getModel();
				var aResults = [];
				var oHandle = oModel.callFunction("/LockProject", {
					method: "GET",
					urlParameters: oParam,
					headers: {'Cache-Control': 'no-cache, no-store'}, //SR 561283 Problem: Response kept in cache
					success: function(){
						self.getModel("UnlockFilters").setProperty("/ProjectNo", "");
						self.getModel("UnlockFilters").setProperty("/Day", "");
						self.getRouter().navTo("preview", {
							"Day": sDay,
							"ProjectNo": sProjectNo
						}, true);
					}
				});
				
				clearTimeout(timer);
				document.onload = null;
				document.onmousemove = null;
				document.onmousedown = null; // touchscreen presses
				document.ontouchstart = null;
				document.ontouchmove = null;
				document.onclick = null;     // touchpad clicks
				document.onscroll = null;    // scrolling with arrow keys
				document.onkeypress = null;
				document.onwheel = null;
			}
		},
		//End SR 548154 Project Lock
		
		_openControlDialog: function(oControl, aResults, oController) {
			var oModel = models.createJSONModel(aResults, "TwoWay");
			var self = oController;
			
			self._oControlDialog = this.onOpenDialog(this._oControlDialog,
					"zwo.ui.wks_rep.view.fragment.controlDialog",
	                oControl);
			self._oControlDialog.setModel(oModel, "control");
		},

		_navToCategory : function(sKey) {
			var self = this;
			var oResource = self.getResourceBundle();
			var sPage = "";
			switch(sKey) {
				case(oResource.getText("Lab")):
					sPage = "labor";
					break;
				case(oResource.getText("Temp")):
					sPage = "temporary";
					break;
				case(oResource.getText("Equip")):
					sPage = "equipment";
					break;
				case(oResource.getText("Rent")):
					sPage = "rental";
					break;
				case(oResource.getText("Intern")):
					sPage = "internal";
					break;
				case(oResource.getText("Mat")):
					sPage = "material";
					break;
				case(oResource.getText("SubCon")):
					sPage = "subcontracting";
					break;
				case(oResource.getText("Qty")):
					sPage = "quantity";
					break;
				default:
					sPage = "";
			}
			if(sPage !== "") {
				var oModel = self.getModel("InScreenFilters");
				var sDay = formatter.formatODataDate(oModel.getProperty("/ProjectSet/Day"));
				var sProjectNo = oModel.getProperty("/ProjectSet/ProjectNo");
				self.getRouter().navTo(sPage, {
					"Day": sDay,
					"ProjectNo": sProjectNo,
					"itemNo": "0"
				}, true);
			}
		},
		
		_applyCssITBfilters : function() {
			$("__component0---project--iconTemporary-icon").addClass("myIconTabFilter");
			$("__component0---project--iconRental-icon").addClass("myIconTabFilter");
			$("__component0---project--iconMaterial-icon").addClass("myIconTabFilter");
			$("__component0---project--iconSubcon-icon").addClass("myIconTabFilter");
		},
		
		_getProject : function(sDay, sProjectNo) {
			var self = this;
			var oDeferred = $.Deferred();	
			var oResults = {};	
			var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
			var aSelForemen = self.getModel("InScreenFilters").getProperty("/Foremen");
			var aFilters = [];
			var oFilter = {};
			
			aFilters.push(new sap.ui.model.Filter("Day", oOperatorEQ, sDay));
			aFilters.push(new sap.ui.model.Filter("ProjectNo", oOperatorEQ, sProjectNo));
			
			if(aSelForemen && aSelForemen.length !== 0) {
				var aTmp = [];
				aSelForemen.forEach(function(foreman) {
					aTmp.push(new sap.ui.model.Filter("ForemanNo", oOperatorEQ, foreman.Number));
				});
				aFilters.push(new sap.ui.model.Filter(aTmp, true));
			}
			
			var oFilter = new sap.ui.model.Filter(aFilters, true);
			
			// Setting view to busy state
			//self.getModel("ProjectView").setProperty("/busy", true);
			
			// Requesting for ProjectSet details of selected projects
			self.getModel().read("/ProjectSet",{
				filters : [oFilter],
				success : function(oData) {
					oResults = oData.results;
					
					oResults.forEach(function(result){
						//jQuery.sap.log.error("2 - Day: " + result.Day + " ProjectNo: " + result.ProjectNo);
						if(result.ProjectNo === sProjectNo) {
							// Setting oData results to InScreenFilters model
							self.getModel("InScreenFilters").setProperty("/ProjectSet", result);
							//result.Country = "qc"; // TODO remove 
						}
					});					
											
					// Set view to not busy state
					self.getModel("ProjectView").setProperty("/busy", false);																									
					oDeferred.resolve();										
				},
				error : function(oError) {
					MessageToast.show(self.getResourceBundle().getText("errorGetSelProj") + " " + oError.message);
					// Set view to not busy state
					self.getModel("ProjectView").setProperty("/busy", false);
					oDeferred.reject();
				}
			});					
			
			return oDeferred.promise();
		},
		
		_flagAllLabor : function(oFilter) {
			var self = this;
			var oDeferred = $.Deferred();
			var oView = self.getView();
			var aFilters = (oFilter.aFilters.length !== 0 || (oFilter.oValue1 && oFilter.oValue2)) ? [oFilter] : [];
			var oModel = self.getModel("InScreenFilters");  
			
			// Creating key set for ProjectSet entity
			var sProjPath = oView.getModel().createKey("/ProjectSet", {
				ProjectNo : oModel.getProperty("/ProjectSet/ProjectNo"),
				Day : formatter.formatODataDate(oModel.getProperty("/ProjectSet/Day"))
		    });			
			sProjPath += "/ProjToLabor";
			
			// Setting view to busy state
			//self.getModel("ProjectView").setProperty("/busy", true);
						
			// Requesting for Labor header of selected project
		    oView.getModel().read(sProjPath, {
		    	filters : aFilters,
				success : function(oData) {
				    var oLabors = oData.results;
				    //jQuery.sap.log.error("No of labor header details returned: " + oLabors.length);
				    var aLaborUpd = [];
				    oLabors.forEach(function(labor) {
				    	var oControl = self.byId("flagAllBtn");
				    	// if Flag all button is pressed, update all labor for which Flag indicator is false
				    	if(oControl.getPressed()) {
				    		if(!labor.FlagInt) {
				    			labor.FlagInt = true;
				    			labor.FlagIntUpd = true;
				    			aLaborUpd.push(labor);
				    		}				    			
				    	} else {
				    		// if Flag all button is unpressed, update all labor for which Flag indicator is true
				    		if(labor.FlagInt) {
				    			labor.FlagInt = false;
				    			labor.FlagIntUpd = true;
				    			aLaborUpd.push(labor);
				    		}				    			
				    	}			    					    	
				    });
				    var oDfdLaborUpd = $.Deferred();
				    
				    if(aLaborUpd.length !== 0) {
				    	aLaborUpd.forEach(function(labor) {
				    		oDfdLaborUpd = self.updateLaborItem(labor, self);
				    	});	
				    } else {
				    	oDfdLaborUpd.resolve();
				    }
				    				    
				    oDfdLaborUpd.then(
			    		// Success handler
					    function() {
					    	if(aLaborUpd.length === 0)
					    		MessageToast.show(self.getResourceBundle().getText("noUpdate"));
					    	else
					    		MessageToast.show(self.getResourceBundle().getText("successUpdate"));
					    	// Setting view to idle state
							self.getModel("ProjectView").setProperty("/busy", false);
						    oDeferred.resolve();
					    },				    	
				    	// Error handler
				    	function() {
					    	MessageToast.show(self.getResourceBundle().getText("errorUpdate"));
					    	// Setting view to idle state
							self.getModel("ProjectView").setProperty("/busy", false);
					    	oDeferred.reject();
				    	});
					
				},
				error : function(oError) {
					MessageToast.show(self.getResourceBundle().getText("errorUpdate") + oError.message);
					// Setting view to idle state
					self.getModel("ProjectView").setProperty("/busy", false);
					oDeferred.reject();
				}
		    });
		    return oDeferred.promise();
		},
		
		_setCategoryModel : function() {
			var oResource = this.getResourceBundle();
		    var aCategory = [	
		    		{category : oResource.getText("Lab"), selected : true, icon: "sap-icon://person-placeholder"},
		    		{category : oResource.getText("Temp"), selected : true, icon: "sap-icon://employee"},
		    		{category : oResource.getText("Equip"), selected : true, icon: "sap-icon://inventory"},
		    		{category : oResource.getText("Rent"), selected : true, icon: "sap-icon://shipping-status"},
		    		{category : oResource.getText("Mat"), selected : true, icon: "sap-icon://program-triangles-2"},
		    		{category : oResource.getText("SubCon"), selected : true, icon: "sap-icon://decision"},
		    		{category : oResource.getText("Intern"), selected : true, icon: "sap-icon://example"},	
		    		{category : oResource.getText("Qty"), selected : true, icon: "sap-icon://measure"}
    			];    			
		    
		    var oCatModel = new JSONModel(aCategory);
		    oCatModel.setDefaultBindingMode("TwoWay");
		    this.getView().setModel(oCatModel, "categoryList");		    
		},
		
		_setIcnTabFtr : function() {
			var self = this;
			var aCat = self.getModel("InScreenFilters").getProperty("/Category");
			var oIcnTbBar = self.byId("idIconTabBar");
			var aIcnFilters = oIcnTbBar.getItems();
			var bVisible = false;
			var iFirstIcnFilter = 0;
			//self.getModel("ProjectView").setProperty("/busy", true);
			
			aIcnFilters.forEach(function(icnFilter, index) {
				for(var i = 0; i < aCat.length; i++) {
					if(icnFilter.getKey() === aCat[i]) {
						bVisible = true;
						break;
					}
				}
				icnFilter.setVisible(bVisible);
				bVisible = false;
			});
			oIcnTbBar.setSelectedKey(aCat[0]);			
			oIcnTbBar.rerender();
			self._navToCategory(aCat[0]);
			self.getModel("ProjectView").setProperty("/busy", false);
		},
		
//SR 548154 Project Lock				
		_onProjectPatternMatched : function(oEvent) {
			var oRoute = oEvent.getParameter("name");
			//if(oRoute === "project" || oRoute === "labor") {
			if(oRoute === "project") {
				var sDay = oEvent.getParameter("arguments").Day;
				var sProjectNo = oEvent.getParameter("arguments").ProjectNo;
				var self = this;	
				
				//setting Project Lock
				if(self.getModel("UnlockFilters").getProperty("/ProjectNo") === ""){
					self.getModel("LockFilters").setProperty("/ProjectNo", sProjectNo);
					self.getModel("LockFilters").setProperty("/Day", sDay);
				
				var oDfrdLock = self.projectLock();
				
				oDfrdLock.done(
					// Success handler
					function() {
						var oComponent = self.getOwnerComponent();
						var oView = self.getView();
						var oModel = self.getModel("InScreenFilters");
														
						oComponent.oWhenMetadataIsLoaded.then(
						// Success handler
						function() {
							// Fetching selected project
							oComponent.oDfdProject = self._getProject(sDay, sProjectNo);
																
							self._selectRep();					
							if(self._oReportFrgmt)
								self._oReportFrgmt.rerender();
											
							// Fetching Labor Header data
							oComponent.oDfdProject.done(
								// Success handler
								function() {							
									var oIcnTb = self.byId("idIconTabBar");						   
									var aCat = self.getModel("InScreenFilters").getProperty("/Category");
																
									if(aCat.length !== 0) {
										oIcnTb.setSelectedKey(aCat[0]);
									} else {
										oIcnTb.setSelectedKey(self.getResourceBundle().getText("Lab"));
									}							
									oIcnTb.rerender();
									self._navToCategory(oIcnTb.getSelectedKey());
								});			
								
							oComponent.oUserReady.then(function() {
								//setting timeout
								self.timeOut(self);
							});
						});
					
				});
				}
			}
		}
		
		});

	}
);
//End SR 548154 Project Lock