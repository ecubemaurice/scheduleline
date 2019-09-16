sap.ui.define([
	"sap/ui/model/Sorter"
], function(Sorter) {
	"use strict";
 
	var Formatter = {
		
		/* Format number of reports to integrate text */
		
		getNumRepText : function (iNumRep) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			if(iNumRep)
				var iNumRep = parseInt(iNumRep);
			if(iNumRep > 0)
				return iNumRep + " " + resourceBundle.getText("numReportsIntegrate");
			else
				return resourceBundle.getText("noOfReportsToIntegrate");
		},
		
		/* Format Date to correct display format*/
		formatDisplayDate : function(oDate) {
			if(oDate) {
				var sDatePattern = "MM/dd/yyyy";
				if(this.getView().getModel("user"))
					sDatePattern = this.getModel("user").getProperty("/DateFormat");
				
				var oDateTimeFormat = sap.ui.core.format.DateFormat
						.getDateTimeInstance({
							pattern : sDatePattern,
							UTC : true
						});
				
				return oDateTimeFormat.format(oDate); 
			} else
				return "";
		},
		
		/* Format Date to correct display format*/
		formatDisplayDay : function(oDate) {
			if(oDate) {
				var sDatePattern = "EEEE dd.MM.yyyy";
				/*if(this.getView().getModel("user"))
					sDatePattern = this.getModel("user").getProperty("/DateFormat");*/
				
				var oDateTimeFormat = sap.ui.core.format.DateFormat
						.getDateTimeInstance({
							pattern : sDatePattern,
							UTC : true
						});
				
				return oDateTimeFormat.format(oDate); 
			} else
				return "";
		},
		
		// formatting javascript date format to odata date format
		formatODataDate : function(sDate) {
			if(sDate) {
				var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern : "yyyy-MM-ddThh:mm:ss",
					UTC : true
				});			
				return oDateTimeFormat.format(new Date(sDate));
			} else
				return "";
			
		},	
		
		// converting from string to odata Edm.Time
		formatODataTime : function(sTime) {
			if(sTime) {
				var oTime = new sap.ui.model.odata.type.Time();
				// Passing time object as source type string 
				return oTime.parseValue(sTime, "string");
			}else
				return "";			
		},
		
		// converting Edm.Time to display time HH:mm, ignoring any time zones
		formatDisplayTime : function(oTime) {
			if(oTime) {
				var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "HH:mm",
					UTC : true
				});				
				return timeFormat.format(new Date(oTime.ms));
			}else
				return "";
		},
		
		setIntStatus : function(sStatus) {
			var oResource = this.getResourceBundle();
		
			switch(sStatus){
				case(oResource.getText("NotIntTxt")):
					return "None";
				case(oResource.getText("IntProgress")):
					return "Information";
				case(oResource.getText("IntError")):
					return "Error";
				case(oResource.getText("IntOK")):
					return "Success";
				case(oResource.getText("IntLocked")):
					return "None";
				default: 
					return "None";
			}
		},
		
		setDetStatus : function(sStatus) {
			var oResource = this.getResourceBundle();
			
			switch(sStatus){
				case("0"):
					return "None";
				case("1"):
					return "None";
				case("4"):
					return "Information";
				case("3"):
					return "Error";
				case("2"):
					return "Success";
				case("6"):
					return "None";
				case("7"):
					return "None";
				default: 
					return "None";
			}
		},
		
		formatOrigin : function(sOrigin) {
			if(sOrigin === "X")
				return "P";
			else
				return "M";
		},
		
		checkSelForemen : function(iForemanNo) {
			var self = this;
			var bSelRep = false;
			var aRep = self.getModel("InScreenFilters").getProperty("/Reports");
			aRep.forEach(function(report) {
				if(report.ForemanNo === iForemanNo) {
					bSelRep = true;
				}					
			});						
			return bSelRep;			
		},
		
		getLineCount : function(sList, oController) {
			var iLength = "";
			if(sList) {
				var self = oController;
				var oList = self.byId(sList);				
				if(oList)
					iLength = oList.getItems().length;				
			}
			return iLength;
		},
		
		enableMasterEditBtn : function(sIntStatus) {
			if(sIntStatus) {
				if (!this.validateMasterEdit(sIntStatus, this, false) 
						|| this.isEditItemLocked(sIntStatus, this, false)) {
					return false;
				}else {
					return true;
				}					
			}else {
				return false;
			}		
		},
		
		setMasterStatus: function(sIntStatus) {
			switch(sIntStatus) {
				case("0"):
					return "Warning";
				case("1"):
					return "None";
				case("2"):
					return "Success";
				case("3"):
					return "Error";
				case("4"):
					return "Information";
				case("6"):
					return "None";
				case("7"):
					return "None";
				default: 
					return "None";
			}
		},
		
		setCategoryStatus: function(sIntStatus) {
			switch(sIntStatus) {
			case("0"):
				return "Neutral";
			case("1"):
				return "Negative";
			case("2"):
				return "Positive";
			case("3"):
				return "Critical";
			case("4"):
				return "Default";
			default: 
				return "Neutral";
			}
		},
		
		setEmptyString: function(sValue) {
			if(sValue && sValue === "XX")
				return "";
			else
				return sValue;
		},
		
		setEmptyUnit: function(sPrice, sUnit) {
			if(sUnit === "XX")
				return sPrice;
			else
				return (sPrice + " " + sUnit);
		},
		
		getPreviewEdit: function(sForemanNo) {
			var self = this;
			var oEditModel = self.getView().getModel("EditModel");
			if(oEditModel) {
				var aReports = oEditModel.getData();
				if(aReports.length !== 0) {
					for(var i = 0; i < aReports.length; i++) {
						if(sForemanNo === aReports[i].ForemanNo) {
							
						}
					}
				}
			}
		},
		
		formatWbs : function(sWbs){
			var self = this;
			if(sWbs){
				var iIndex = sWbs.lastIndexOf(".");
				sWbs = sWbs.substring((iIndex + 1));
				return sWbs;
			} else {
				return sWbs;
			}
		}
	}; 
 
	return Formatter;
 
}, true);