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
	"zwo/ui/wks_rep/model/formatter",
	"zwo/ui/wks_rep/model/models",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/comp/filterbar/FilterBar",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"zwo/ui/wks_rep/utils/MaterialSearchHelp",
	"zwo/ui/wks_rep/utils/EquipmentSH"
], function(formatter, models, MessageToast, JSONModel, ValueHelpDialog, 
			FilterBar, Filter, FilterOperator, MaterialSearchHelp, EquipmentSH){
	"use strict";
	
	var SearchHelps = {
			
			/*Common Search Help*/
			/** Initialising a value help dialog with single select and select from table only configuration **/
			createSingleSelectOnlyVHD: function(oInput, sTitle, sKey, sDescKey, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					title: sTitle,
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: sKey,
					descriptionKey: sDescKey,
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Binding SHActivitySet table
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},
			
			initSetConditions: function(oInput, sName, sLabel, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				
				var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
					basicSearchText: "", 
					title: oResourceBundle.getText("multiselect"), 
					supportRanges: true,
					supportRangesOnly: true, 
					key: sName,				
					descriptionKey: sLabel,
					stretch: sap.ui.Device.system.phone, 
					ok: function(oControlEvent) {
						var aTokens = oControlEvent.getParameter("tokens");
						oInput.setTokens(aTokens);
						oValueHelpDialog.close();
					},
					cancel: function(oControlEvent) {
						oValueHelpDialog.close();
					},
					afterClose: function() {
						oValueHelpDialog.destroy();
					}
				});
				
				oValueHelpDialog.setRangeKeyFields([{label: sLabel, key: sName}]); 
				oValueHelpDialog.setTokens(oInput.getTokens());
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}
				
				return oValueHelpDialog;
			},
			
			initSearchWithFilter: function(oInput, sTitle, sKey, sDescKey, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: sTitle,
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: sKey,
					descriptionKey: sDescKey,
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: false,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aFilters = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aFilters.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}
							});

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oTable = oValueHelpDialog.getTable();
							var oBinding = oTable.getBinding("rows");
							oBinding.filter(oFilter);
						}
					}
				});

				oValueHelpDialog.setFilterBar(oFilterBar);
				
				if(sDescKey === oResourceBundle.getText("PersonnelArea2")){
					this.setFGrpPersonnelArea(oValueHelpDialog, oController);
				} else if (sDescKey === oResourceBundle.getText("CompanyCode2")){
					this.setFGrpCmpCode(oValueHelpDialog, oController);
				} else if (sDescKey === oResourceBundle.getText("MaintPlant")){
					EquipmentSH.setFGrpPlant(oValueHelpDialog, oController);
				}
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},
			
			
			/*Default Binding*/
			bindTableRows: function(sPath, oTable, oViewModel, oFilter, oController) {
				var self = oController;
				var oModel = self.getModel();	
							
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
			
			/*Search help for Personnel*/
			initSearchEmployee: function(oInput, oController) {
				// Saving user date format
				var sDateFormat = oInput.getModel("user").getProperty("/DateFormat");

				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText("PersonnelNo2"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "PersonnelNo",
					descriptionKey: "PersonnelNo",
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: true,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aFilters = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aFilters.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}else if(oInput && oInput.getTokens().length !== 0) {
									var aTokens = oInput.getTokens();
									aTokens.forEach(function(oToken){
										var oTokenData = oToken.data().range;
										if(oTokenData.exclude) {
											aFilters.push(new Filter(oInput.getName(), "NE", oTokenData.value1));
										}else {
											if(oTokenData.operation === "BT") {
												aFilters.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1, oTokenData.value2));
											}else {
												aFilters.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1));
											}
										}
									});
								}
							});

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");	
							var oTable = oValueHelpDialog.getTable();
							
							if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHPersonnelStd9")){
								this.getPersonnelStd9Set(oTable, oViewModel, oFilter, oController);
							}else {
								this.getPersonnelStdNSet(oTable, oViewModel, oFilter, oController);
							}
						}

					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Adding Selection Search Template
				oValueHelpDialog.oSelectionTitle.setText("Select Search Template");
				oValueHelpDialog.oSelectionTitle.setVisible(true);
				oValueHelpDialog.oSelectionButton.setVisible(true);		

				// Event handler for event onSelectionChange for search template list
				var fOnSelectTemplate = jQuery.proxy(function(oEvt) {
					var oSource = oEvt.getParameter("listItem");
					oSearchTemplatePopOver.close();
					if (oSource) {
						var oAnnotation = oSource.data("_annotation");
						if (oAnnotation) {
							oValueHelpDialog.oSelectionTitle.setText(oAnnotation);
							oValueHelpDialog.oSelectionTitle.setTooltip(oAnnotation);
							var oTable = oValueHelpDialog.getTable();
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");
							if (oAnnotation === oResourceBundle.getText("SHPersonnelStdN")) {
								// Setting filter group items for table STDN
								this.setFGrpStdN(oValueHelpDialog, oController);
								// Binding SHPersonnelStdN table
								this.bindPersonnelStdN(oTable, sDateFormat, oViewModel, oController);
							} else if (oAnnotation === oResourceBundle.getText("SHPersonnelStd9")) {
								// Setting filter group items for table STD9
								this.setFGrpStd9(oValueHelpDialog, oController);
								// Binding SHPersonnelStd9 table
								this.bindPersonnelStd9(oTable, sDateFormat, oViewModel, oController);
							}
						}
					}
				}, this);

				// Creating search template list
				var oSearchTemplateList = new sap.m.List({
					mode: sap.m.ListMode.SingleSelectMaster,
					selectionChange: fOnSelectTemplate
				});

				for (var i = 0; i < 2; i++) {
					var sTitle = "Search Template " + i;
					if (i === 0)
						sTitle = oResourceBundle.getText("SHPersonnelStd9");
					if (i === 1)
						sTitle = oResourceBundle.getText("SHPersonnelStdN");

					var oItem = new sap.m.StandardListItem({
						title: sTitle
					});
					oItem.data("_annotation", sTitle);
					oSearchTemplateList.addItem(oItem);
				}
				oSearchTemplateList.setSelectedItem(oSearchTemplateList.getItems()[0]);
				oValueHelpDialog.oSelectionTitle.setText(oSearchTemplateList.getItems()[0].getTitle());
				oValueHelpDialog.oSelectionTitle.setTooltip(oSearchTemplateList.getItems()[0].getTitle());

				// Binding initial table selected from search template
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				this.setFGrpStd9(oValueHelpDialog, oController);
				this.bindPersonnelStd9(oTable, sDateFormat, oViewModel, oController);

				// Creating popover for search template list
				var oSearchTemplatePopOver = new sap.m.ResponsivePopover({
					placement: sap.m.PlacementType.Bottom,
					showHeader: true,
					title: "Select Search Template",
					contentHeight: "6rem",
					content: [
						oSearchTemplateList
					]
				});

				// Opening popover when pressing search template button
				oValueHelpDialog.oSelectionButton.attachPress(function() {
					oSearchTemplatePopOver.openBy(this);
				});
				
				// Increasing height and setting compact size for PCs and tablets
				oValueHelpDialog.setContentHeight("550px");
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}
				
				return oValueHelpDialog;
			},
			
			bindPersonnelStd9: function(oTable, sDateFormat, oViewModel, oController) {
				var oResourceBundle = oController.getResourceBundle();
				oTable.destroyColumns();
				oTable.unbindRows();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PersonnelArea"),
						tooltip: oResourceBundle.getText("PersonnelArea")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PersonnelArea'
						},
						wrapping: false,
						tooltip: {
							path: 'PersonnelArea'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PersonnelArea"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PersSubarea"),
						tooltip: oResourceBundle.getText("PersSubarea")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PersSubarea'
						},
						wrapping: false,
						tooltip: {
							path: 'PersSubarea'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PersSubarea"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EEGroup"),
						tooltip: oResourceBundle.getText("EEGroup")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EEGroup'
						},
						wrapping: false,
						tooltip: {
							path: 'EEGroup'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "EEGroup"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EESubgroup"),
						tooltip: oResourceBundle.getText("EESubgroup")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EESubgroup'
						},
						wrapping: false,
						tooltip: {
							path: 'EESubgroup'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "EESubgroup"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PayrollArea"),
						tooltip: oResourceBundle.getText("PayrollArea")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PayrollArea'
						},
						wrapping: false,
						tooltip: {
							path: 'PayrollArea'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PayrollArea"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CompanyCode"),
						tooltip: oResourceBundle.getText("CompanyCode")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CompanyCode'
						},
						wrapping: false,
						tooltip: {
							path: 'CompanyCode'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "CompanyCode"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CostCenter"),
						tooltip: oResourceBundle.getText("CostCenter")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CostCenter'
						},
						wrapping: false,
						tooltip: {
							path: 'CostCenter'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "CostCenter"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("OrgUnit"),
						tooltip: oResourceBundle.getText("OrgUnit")
					}),
					template: new sap.m.Text({
						text: {
							path: 'OrgUnit'
						},
						wrapping: false,
						tooltip: {
							path: 'OrgUnit'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "OrgUnit"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Job"),
						tooltip: oResourceBundle.getText("Job")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Job'
						},
						wrapping: false,
						tooltip: {
							path: 'Job'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Job"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("OrgKey"),
						tooltip: oResourceBundle.getText("OrgKey")
					}),
					template: new sap.m.Text({
						text: {
							path: 'OrgKey'
						},
						wrapping: false,
						tooltip: {
							path: 'OrgKey'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "OrgKey"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Group"),
						tooltip: oResourceBundle.getText("Group")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Group'
						},
						wrapping: false,
						tooltip: {
							path: 'Group'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Group"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("TimeAdmin"),
						tooltip: oResourceBundle.getText("TimeAdmin")
					}),
					template: new sap.m.Text({
						text: {
							path: 'TimeAdmin'
						},
						wrapping: false,
						tooltip: {
							path: 'TimeAdmin'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "TimeAdmin"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PersonnelNo"),
						tooltip: oResourceBundle.getText("PersonnelNo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PersonnelNo'
						},
						wrapping: false,
						tooltip: {
							path: 'PersonnelNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PersonnelNo"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EmplApplName"),
						tooltip: oResourceBundle.getText("EmplApplName")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EmplApplName'
						},
						wrapping: false,
						tooltip: {
							path: 'EmplApplName'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "EmplApplName"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Employment"),
						tooltip: oResourceBundle.getText("Employment")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Employment'
						},
						wrapping: false,
						tooltip: {
							path: 'Employment'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Employment"
				}));
			},
			
			getPersonnelStd9Set: function(oTable, oViewModel, oFilter, oController) {
				var self = oController;
				oTable.setThreshold(9999);
				
				var oModel = self.getModel();
				var sPath = "/SHPersonnelStd9Set";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
			
			setFGrpStd9: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "PersonnelArea",
						label: oResourceBundle.getText("PersonnelArea2"),
						control: new sap.m.MultiInput({
							name: "PersonnelArea"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "PersSubarea",
						label: oResourceBundle.getText("PersSubarea2"),
						control: new sap.m.MultiInput({
							name: "PersSubarea"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "EEGroup",
						label: oResourceBundle.getText("EEGroup2"),
						control: new sap.m.MultiInput({
							name: "EEGroup"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "EESubgroup",
						label: oResourceBundle.getText("EESubgroup2"),
						control: new sap.m.MultiInput({
							name: "EESubgroup"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "PayrollArea",
						label: oResourceBundle.getText("PayrollArea2"),
						control: new sap.m.MultiInput({
							name: "PayrollArea"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CompanyCode",
						label: oResourceBundle.getText("CompanyCode2"),
						control: new sap.m.MultiInput({
							name: "CompanyCode"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CostCenter",
						label: oResourceBundle.getText("CostCenter2"),
						control: new sap.m.MultiInput({
							name: "CostCenter"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "OrgUnit",
						label: oResourceBundle.getText("OrgUnit2"),
						control: new sap.m.MultiInput({
							name: "OrgUnit"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Job",
						label: oResourceBundle.getText("Job2"),
						control: new sap.m.MultiInput({
							name: "Job"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Group",
						label: oResourceBundle.getText("Group2"),
						control: new sap.m.MultiInput({
							name: "Group"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "TimeAdmin",
						label: oResourceBundle.getText("TimeAdmin2"),
						control: new sap.m.MultiInput({
							name: "TimeAdmin"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "EmplApplName",
						label: oResourceBundle.getText("EmplApplName2"),
						control: new sap.m.MultiInput({
							name: "EmplApplName"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Employment",
						label: oResourceBundle.getText("Employment2"),
						control: new sap.m.MultiInput({
							name: "Employment",
							value: "3"
						})
					})
				];

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHMInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
					oControl.attachValueHelpRequest(function(oEvent) {
						var oInput = oEvent.getSource();
						
						if(oItem.getLabel() === oResourceBundle.getText("PersonnelArea2")){
							this._PAreaStdSearchHelp = this.initSearchWithFilter(oInput, oResourceBundle.getText("PersonnelArea2"), oItem.getName(), oItem.getLabel(), oController);
							if (this._PAreaStdSearchHelp) {
								var oTable = this._PAreaStdSearchHelp.getTable();
								var oViewModel = this._PAreaStdSearchHelp.getModel("VHDialogView");
								this.bindSHPersonnelAreaStd(oTable, oViewModel, oController);
								this._PAreaStdSearchHelp.open();
							}
						} else if(oItem.getLabel() === oResourceBundle.getText("EEGroup2")){
							this._EmpGroupStdSearchHelp = this.createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("EEGroup2"), oItem.getName(), oItem.getLabel(), oController);
							if (this._EmpGroupStdSearchHelp) {
								var oTable = this._EmpGroupStdSearchHelp.getTable();
								var oViewModel = this._EmpGroupStdSearchHelp.getModel("VHDialogView");
								this.bindSHEmpGroupStd(oTable, oViewModel, oController);
								this._EmpGroupStdSearchHelp.open();
							}
						}else if(oItem.getLabel() === oResourceBundle.getText("CompanyCode2")){
							this._CmpCodeStdSearchHelp = this.initSearchWithFilter(oInput, oResourceBundle.getText("CompanyCode2"), oItem.getName(), oItem.getLabel(), oController);
							if (this._CmpCodeStdSearchHelp) {
								var oTable = this._CmpCodeStdSearchHelp.getTable();
								var oViewModel = this._CmpCodeStdSearchHelp.getModel("VHDialogView");
								this.bindSHCompanyCodeStd(oTable, oViewModel, oController);
								this._CmpCodeStdSearchHelp.open();
							}
						}else if(oItem.getLabel() === oResourceBundle.getText("Employment2")){
							this._SHEmploymentStatStdSearchHelp = this.createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("Employment2"), oItem.getName(), oItem.getLabel(), oController);
							if (this._SHEmploymentStatStdSearchHelp) {
								var oTable = this._SHEmploymentStatStdSearchHelp.getTable();
								var oViewModel = this._SHEmploymentStatStdSearchHelp.getModel("VHDialogView");
								this.bindSHEmploymentStatStd(oTable, oViewModel, oController);
								this._SHEmploymentStatStdSearchHelp.open();
							}
						}
						else{
							this._oConditionSH = this.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
							if (this._oConditionSH) {
								this._oConditionSH.open();
							}
						}
					}.bind(this));
				}.bind(this));

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				oFilterBar.destroyFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
				
				oValueHelpDialog.rerender();
			},

			bindPersonnelStdN: function(oTable, sDateFormat, oViewModel, oController) {
				var oResourceBundle = oController.getResourceBundle();

				oTable.destroyColumns();
				oTable.unbindRows();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("LastName"),
						tooltip: oResourceBundle.getText("LastName")
					}),
					template: new sap.m.Text({
						text: {
							path: 'LastName'
						},
						wrapping: false,
						tooltip: {
							path: 'LastName'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "LastName"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("FirstName"),
						tooltip: oResourceBundle.getText("FirstName")
					}),
					template: new sap.m.Text({
						text: {
							path: 'FirstName'
						},
						wrapping: false,
						tooltip: {
							path: 'FirstName'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "FirstName"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Title"),
						tooltip: oResourceBundle.getText("Title")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Title'
						},
						wrapping: false,
						tooltip: {
							path: 'Title'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Title"
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PersonnelNo"),
						tooltip: oResourceBundle.getText("PersonnelNo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PersonnelNo'
						},
						wrapping: false,
						tooltip: {
							path: 'PersonnelNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PersonnelNo"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EndDate"),
						tooltip: oResourceBundle.getText("EndDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EndDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;
									
									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "EndDate"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ValidFrom"),
						tooltip: oResourceBundle.getText("ValidFrom")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ValidFrom',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "ValidFrom"
				}));
			},
			
			getPersonnelStdNSet: function(oTable, oViewModel, oFilter, oController){
				var self = oController;
				var oModel = self.getModel();
				var sPath = "/SHPersonnelStdNSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
			
			setFGrpStdN: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
							
				// Creating a filter group for each search field for table SHPersonnelStdN
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdN",
						groupName: "gp1",
						name: "FirstName",
						label: oResourceBundle.getText("FirstName"),
						control: new sap.m.MultiInput({
							name: "FirstName"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdN",
						groupName: "gp1",
						name: "LastName",
						label: oResourceBundle.getText("LastName"),
						control: new sap.m.MultiInput({
							name: "LastName"
						})
					})
				];
				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHMInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
					oControl.attachValueHelpRequest(function(oEvent) {
						var oInput = oEvent.getSource();
						
						this._oConditionSH = this.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
						}
					}.bind(this));
				}.bind());

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				oFilterBar.destroyFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
				
				oValueHelpDialog.rerender();
			},
			
			setFGrpPersonnelArea: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "PersonnelArea",
						label: oResourceBundle.getText("PersonnelArea2"),
						control: new sap.m.Input({
							name: "PersonnelArea"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Name",
						label: oResourceBundle.getText("PersonnelTextArea"),
						control: new sap.m.Input({
							name: "Name"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CompanyCode",
						label: oResourceBundle.getText("CompanyCode2"),
						control: new sap.m.Input({
							name: "CompanyCode"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CtryGrouping",
						label: oResourceBundle.getText("CtryGrouping"),
						control: new sap.m.Input({
							name: "CtryGrouping"
						})
					})
				];

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
				});

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},
			
			bindSHPersonnelAreaStd: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();
				var sDateFormat = self.getModel("user").getProperty("/DateFormat");

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PersonnelArea2"),
						tooltip: oResourceBundle.getText("PersonnelArea2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PersonnelArea'
						},
						wrapping: false,
						tooltip: {
							path: 'PersonnelArea'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Name"),
						tooltip: oResourceBundle.getText("Name")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Name'
						},
						wrapping: false,
						tooltip: {
							path: 'Name'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("StartDate"),
						tooltip: oResourceBundle.getText("StartDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'StartDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EndDate"),
						tooltip: oResourceBundle.getText("EndDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EndDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CompanyCode2"),
						tooltip: oResourceBundle.getText("CompanyCode2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CompanyCode'
						},
						wrapping: false,
						tooltip: {
							path: 'CompanyCode'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CtryGrouping"),
						tooltip: oResourceBundle.getText("CtryGrouping")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CtryGrouping'
						},
						wrapping: false,
						tooltip: {
							path: 'CtryGrouping'
						}
					})
				}));

				var oModel = self.getModel();
				var sPath = "/SHPersonnelAreaStdSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath
				});
			},
			
			bindSHEmpGroupStd: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();
				var sDateFormat = self.getModel("user").getProperty("/DateFormat");

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EEGroup2"),
						tooltip: oResourceBundle.getText("EEGroup2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EEGroup'
						},
						wrapping: false,
						tooltip: {
							path: 'EEGroup'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Name"),
						tooltip: oResourceBundle.getText("Name")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Name'
						},
						wrapping: false,
						tooltip: {
							path: 'Name'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("StartDate"),
						tooltip: oResourceBundle.getText("StartDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'StartDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EndDate"),
						tooltip: oResourceBundle.getText("EndDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EndDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					})
				}));

				var oModel = self.getModel();
				var sPath = "/SHEmpGroupStdSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath
				});
			},
			
			bindSHEmploymentStatStd: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Language"),
						tooltip: oResourceBundle.getText("Language")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Language'
						},
						wrapping: false,
						tooltip: {
							path: 'Language'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("StatusNo"),
						tooltip: oResourceBundle.getText("StatusNo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'StatusNo'
						},
						wrapping: false,
						tooltip: {
							path: 'StatusNo'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("status"),
						tooltip: oResourceBundle.getText("status")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Employment'
						},
						wrapping: false,
						tooltip: {
							path: 'Employment'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Text"),
						tooltip: oResourceBundle.getText("Text")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Text'
						},
						wrapping: false,
						tooltip: {
							path: 'Text'
						}
					})
				}));
				
				var sOperator = sap.ui.model.FilterOperator.EQ;
				var language = navigator.language;
				var aFilters = [];
				aFilters = [new Filter([
					new Filter("Language", sOperator, language),
					new Filter("StatusNo", sOperator, "2")
				], true)];
				
				var oModel = self.getModel();
				var sPath = "/SHEmploymentStatStdSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: aFilters
				});
			},
			
			setFGrpCmpCode: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CompanyName",
						label: oResourceBundle.getText("CompanyName"),
						control: new sap.m.Input({
							name: "CompanyName"
						})
					})
				];

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
				});

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},
			
			bindSHCompanyCodeStd: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CompanyCode2"),
						tooltip: oResourceBundle.getText("CompanyCode2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CompanyCode'
						},
						wrapping: false,
						tooltip: {
							path: 'CompanyCode'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CompanyName"),
						tooltip: oResourceBundle.getText("CompanyName")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CompanyName'
						},
						wrapping: false,
						tooltip: {
							path: 'CompanyName'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("City"),
						tooltip: oResourceBundle.getText("City")
					}),
					template: new sap.m.Text({
						text: {
							path: 'City'
						},
						wrapping: false,
						tooltip: {
							path: 'City'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Currency2"),
						tooltip: oResourceBundle.getText("Currency2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Currency'
						},
						wrapping: false,
						tooltip: {
							path: 'Currency'
						}
					})
				}));

				var oModel = self.getModel();
				var sPath = "/SHCompanyCodeStdSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath
				});
			},

			
			/*Search help for Cost code*/
			initSearchCostCode: function(oInput, oInScreenModel, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText("costCode"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "CostCode",
					descriptionKey: "CostCode",
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: false,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aTmp = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aTmp.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}
							});
							
							var aFilters = [];
							
							if(aTmp.length !== 0){
								aFilters.push(new Filter(aTmp, true));
							}
							
							// Additional entity filters
							var self = oController;
							var iProjectNo;

							// If from report screen
							if (oInScreenModel.getProperty("/ProjectSet/ProjectNo")) {
								iProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
							} else { // If from preview screen
								iProjectNo = self._sProjectNo;
							}
							
							var aTmp2 = [];
							aTmp2.push(new Filter("ProjectNo", FilterOperator.EQ, iProjectNo));

							aFilters.push(new Filter(aTmp2, true));

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, false) : [];
							var sPath = "/SHCostCodeSet";
							var oTable = oValueHelpDialog.getTable();
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");
							this.bindTableRows(sPath, oTable, oViewModel, oFilter, oController);
						}
					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Setting Range Key Fields
				var fSetRangeKey = jQuery.proxy(function(oEvt) {
					oValueHelpDialog.setRangeKeyFields([{
						label: oResourceBundle.getText("costCode"),
						key: "CostCode"
					}, {
						label: oResourceBundle.getText("wbsElement"),
						key: "WBSElement"
					}, {
						label: oResourceBundle.getText("costCodeDesc"),
						key: "Desc"
					}]);
				}, this);

				// Binding initial table selected from search template
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				SearchHelps.bindCostCodeSet(oTable, oViewModel, oController);
				SearchHelps.setFGrpCostCode(oValueHelpDialog, oController);
				fSetRangeKey();
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			setFGrpCostCode: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CostCode",
						label: oResourceBundle.getText("costCode"),
						control: new sap.m.Input({
							name: "CostCode"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "WBSElement",
						label: oResourceBundle.getText("wbsElement"),
						control: new sap.m.Input({
							name: "WBSElement"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Desc",
						label: oResourceBundle.getText("costCodeDesc"),
						control: new sap.m.Input({
							name: "Desc"
						})
					})
				];

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
				});

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},
			
			bindCostCodeSet: function(oTable, oViewModel, oController) {

				var oResourceBundle = oController.getResourceBundle();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("costCode"),
						tooltip: oResourceBundle.getText("costCode")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CostCode'
						},
						wrapping: false,
						tooltip: {
							path: 'CostCode'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("wbsElement"),
						tooltip: oResourceBundle.getText("wbsElement")
					}),
					template: new sap.m.Text({
						text: {
							path: 'WBSElement'
						},
						wrapping: false,
						tooltip: {
							path: 'WBSElement'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("costCodeDesc"),
						tooltip: oResourceBundle.getText("costCodeDesc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Desc'
						},
						wrapping: false,
						tooltip: {
							path: 'Desc'
						}
					})
				}));

				var self = oController;
				var oFilterModel = self.getModel("InScreenFilters");
				var iProjectNo;

				// If from report screen
				if (oFilterModel.getProperty("/ProjectSet/ProjectNo")) {
					iProjectNo = oFilterModel.getProperty("/ProjectSet/ProjectNo");
				} else { // If from preview screen
					iProjectNo = self._sProjectNo;
				}

				var oFilter = new Filter("ProjectNo", FilterOperator.EQ, iProjectNo);
				
				var sPath = "/SHCostCodeSet";
				
				var oModel = self.getModel();
				this.bindTableRows(sPath, oTable, oViewModel, oFilter, oController);

			},

			
			/*Search help for bonus*/
			/** Initialising a value help dialog with single select and select from table only configuration **/
			initBonusSearch: function(oInput, sEmployeeNo, sDay, sDateFormat, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					title: oResourceBundle.getText("primePointingCode"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "WageType",
					descriptionKey: "WageType",
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: false,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aTmp = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aTmp.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}
							});

							var aFilters = [];
							
							if(aTmp.length !== 0){
								aFilters.push(new Filter(aTmp, true));
							}
							
							// Additional entity filters
							var aTmp2 = [];
							
							aTmp2.push(new Filter("EmployeeNo", FilterOperator.EQ, sEmployeeNo));
							aTmp2.push(new Filter("Day", FilterOperator.EQ, sDay));

							aFilters.push(new Filter(aTmp2, true));

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, false) : [];
							var sPath = "/SHBonusSet";
							var oTable = oValueHelpDialog.getTable();
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");
							this.bindTableRows(sPath, oTable, oViewModel, oFilter, oController);
						}

					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				SearchHelps.bindBonusSet(oTable, sDateFormat, oViewModel, sEmployeeNo, oController);
				SearchHelps.setFGrpBonus(oValueHelpDialog, oController);
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			setFGrpBonus: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHBonus
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Bonus",
						groupName: "gp1",
						name: "WageType",
						label: oResourceBundle.getText("WageType"),
						control: new sap.m.Input({
							name: "WageType"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Bonus",
						groupName: "gp1",
						name: "Desc",
						label: oResourceBundle.getText("desc"),
						control: new sap.m.Input({
							name: "Desc"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Bonus",
						groupName: "gp1",
						name: "StartDate",
						label: oResourceBundle.getText("StartDate"),
						control: new sap.m.Input({
							name: "StartDate"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Bonus",
						groupName: "gp1",
						name: "EndDate",
						label: oResourceBundle.getText("EndDate"),
						control: new sap.m.Input({
							name: "EndDate"
						})
					})
				];
				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
				});

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},

			bindBonusSet: function(oTable, sDateFormat, oViewModel, sEmployeeNo, oController) {

				var oResourceBundle = oController.getResourceBundle();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("WageType"),
						tooltip: oResourceBundle.getText("WageType")
					}),
					template: new sap.m.Text({
						text: {
							path: 'WageType'
						},
						wrapping: false,
						tooltip: {
							path: 'WageType'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc"),
						tooltip: oResourceBundle.getText("desc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Desc'
						},
						wrapping: false,
						tooltip: {
							path: 'Desc'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("StartDate"),
						tooltip: oResourceBundle.getText("StartDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'StartDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
										pattern: "yyyyMMdd"
									}).parse(oDate);

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDateFormat);
								} else
									return "";
							}
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EndDate"),
						tooltip: oResourceBundle.getText("EndDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EndDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
										pattern: "yyyyMMdd"
									}).parse(oDate);

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDateFormat);
								} else
									return "";
							}
						}
					})
				}));

				var self = oController;
				var oInScreenModel = self.getModel("InScreenFilters");
				var sDay = formatter.formatODataDate(oInScreenModel.getProperty("/ProjectSet/Day"));
				var aFilters = [new Filter("EmployeeNo", FilterOperator.EQ, sEmployeeNo),
					new Filter("Day", FilterOperator.EQ, sDay),
				];

				var oModel = self.getModel();
				var sPath = "/SHBonusSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: aFilters,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});

			},
			
			/*Search Help for Activity Type*/
			initSearchActivity: function(oInput, sDay, sNo, sScreen, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText("activityType"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "ActivityType",
					descriptionKey: "ActivityType",
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: false,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aTmp = [];
							// Filters entered by user
							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aTmp.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}else if(oInput && oInput.getTokens().length !== 0) {
									var aTokens = oInput.getTokens();
									aTokens.forEach(function(oToken){
										var oTokenData = oToken.data().range;
										if(oTokenData.exclude) {
											aTmp.push(new Filter(oInput.getName(), "NE", oTokenData.value1));
										}else {
											if(oTokenData.operation === "BT") {
												aTmp.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1, oTokenData.value2));
											}else {
												aTmp.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1));
											}
										}
									});
								}
							});
							
							var aFilters = [];
							
							if(aTmp.length !== 0){
								aFilters.push(new Filter(aTmp, true));
							}
							
							// Additional entity filters
							var aTmp2 = [];
							aTmp2.push(new Filter("Day", FilterOperator.EQ, sDay));
							aTmp2.push(new Filter("EmployeeNo", FilterOperator.EQ, sNo));

							aFilters.push(new Filter(aTmp2, true));

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, false) : [];
							var sPath = "/SHActivitySet";
							var oTable = oValueHelpDialog.getTable();
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");
							this.bindTableRows(sPath, oTable, oViewModel, oFilter, oController);
						}
					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Setting Range Key Fields
				var fSetRangeKey = jQuery.proxy(function(oEvt) {
					oValueHelpDialog.setRangeKeyFields([{
						label: oResourceBundle.getText("activityType"),
						key: "ActivityType"
					}, {
						label: oResourceBundle.getText("CostCenter"),
						key: "CostCenter"
					}, {
						label: oResourceBundle.getText("desc"),
						key: "Desc"
					}]);
				}, this);

				// Binding initial table selected from search template
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				this.bindActivitySet(oTable, oViewModel, sDay, sNo, sScreen, oController);
				this.setFGrpActivity(oValueHelpDialog, oController);
				fSetRangeKey();
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			bindActivitySet: function(oTable, oViewModel, sDay, sNo, sScreen, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("activityType"),
						tooltip: oResourceBundle.getText("activityType")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ActivityType'
						},
						wrapping: false,
						tooltip: {
							path: 'ActivityType'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("CostCenter"),
						tooltip: oResourceBundle.getText("CostCenter")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CostCenter'
						},
						wrapping: false,
						tooltip: {
							path: 'CostCenter'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc"),
						tooltip: oResourceBundle.getText("desc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Desc'
						},
						wrapping: false,
						tooltip: {
							path: 'Desc'
						}
					})
				}));

				var oModel = self.getModel();
				var aFilters = [];
				if(sScreen === "Labor"){
					aFilters = [new Filter([
						new Filter("Day", FilterOperator.EQ, sDay),
						new Filter("EmployeeNo", FilterOperator.EQ, sNo)
					], true)];
				}else if(sScreen === "Equipment"){
					aFilters = [new Filter([
						new Filter("Day", FilterOperator.EQ, sDay),
						new Filter("EquipmentNo", FilterOperator.EQ, sNo)
					], true)];
				}			
				var sPath = "/SHActivitySet";
				
				this.bindTableRows(sPath, oTable, oViewModel, aFilters, oController);
			},

			setFGrpActivity: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "ActivityType",
						label: oResourceBundle.getText("activityType"),
						control: new sap.m.MultiInput({
							name: "ActivityType"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CostCenter",
						label: oResourceBundle.getText("CostCenter"),
						control: new sap.m.MultiInput({
							name: "CostCenter"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Desc",
						label: oResourceBundle.getText("desc"),
						control: new sap.m.MultiInput({
							name: "Desc"
						})
					})
				];

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
					
					oControl.attachValueHelpRequest(function(oEvent) {
						var oInput = oEvent.getSource();
						
						this._oConditionSH = this.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
						}
					}.bind(this));
				}.bind(this));

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},
			
			/*Search helps for Type of Hour*/
			/** Initialising a value help dialog with single select and select from table only configuration **/
			initTypeOfHourSearch: function(oInput, sTitle, sKey, sDescKey, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: sTitle,
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: sKey,
					descriptionKey: sDescKey,
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: false,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aFilters = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aFilters.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}
							});

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oTable = oValueHelpDialog.getTable();
							var oBinding = oTable.getBinding("rows");
							oBinding.filter(oFilter);
						}

					}
				});

				oValueHelpDialog.setFilterBar(oFilterBar);
				this.setFGrpTypeOfHour(oValueHelpDialog, oController);
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			setFGrpTypeOfHour: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHWBSElementStdK
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "TPC",
						groupName: "gp1",
						name: "PersonnelSubareaGrp",
						label: oResourceBundle.getText("PSGrouping"),
						control: new sap.m.Input({
							name: "PersonnelSubareaGrp"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "TPC",
						groupName: "gp1",
						name: "Type",
						label: oResourceBundle.getText("Type"),
						control: new sap.m.Input({
							name: "Type"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "TPC",
						groupName: "gp1",
						name: "Desc",
						label: oResourceBundle.getText("desc"),
						control: new sap.m.Input({
							name: "Desc"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "TPC",
						groupName: "gp1",
						name: "StartDate",
						label: oResourceBundle.getText("StartDate"),
						control: new sap.m.Input({
							name: "StartDate"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "TPC",
						groupName: "gp1",
						name: "EndDate",
						label: oResourceBundle.getText("EndDate"),
						control: new sap.m.Input({
							name: "EndDate"
						})
					})
				];
				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
				});

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},

			bindTypeOfHourSet: function(oTable, sDateFormat, oViewModel, sDay, sEmployeeNo, oController) {

				var oResourceBundle = oController.getResourceBundle();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PSGrouping"),
						tooltip: oResourceBundle.getText("PSGrouping")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PersonnelSubareaGrp'
						},
						wrapping: false,
						tooltip: {
							path: 'PersonnelSubareaGrp'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Type"),
						tooltip: oResourceBundle.getText("Type")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Type'
						},
						wrapping: false,
						tooltip: {
							path: 'Type'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc"),
						tooltip: oResourceBundle.getText("desc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Desc'
						},
						wrapping: false,
						tooltip: {
							path: 'Desc'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("StartDate"),
						tooltip: oResourceBundle.getText("StartDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'StartDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";

									else
										sDatePattern = sDateFormat;

									var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
										pattern: "yyyyMMdd"
									}).parse(oDate);

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDateFormat);
								} else
									return "";
							}
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("EndDate"),
						tooltip: oResourceBundle.getText("EndDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'EndDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";

									else
										sDatePattern = sDateFormat;

									var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
										pattern: "yyyyMMdd"
									}).parse(oDate);

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDateFormat);
								} else
									return "";
							}
						}
					})
				}));

				var self = oController;
				var oModel = self.getModel();
				var aFilters = [new Filter([
					new Filter("EmployeeNo", FilterOperator.EQ, sEmployeeNo),
					new Filter("Day", FilterOperator.EQ, sDay)
				], true)];
				var sPath = "/SHTypeOfHourSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: aFilters,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});

			},

			
			/*Search helps for Activity Types Bonus*/
			/** Initialising a value help dialog with single select and select from table only configuration **/
			initActivityBonusSearch: function(oInput, sTitle, sKey, sDescKey, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: sTitle,
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: sKey,
					descriptionKey: sDescKey,
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: true,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aFilters = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aFilters.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}else if(oInput && oInput.getTokens().length !== 0) {
									var aTokens = oInput.getTokens();
									aTokens.forEach(function(oToken){
										var oTokenData = oToken.data().range;
										if(oTokenData.exclude) {
											aFilters.push(new Filter(oInput.getName(), "NE", oTokenData.value1));
										}else {
											if(oTokenData.operation === "BT") {
												aFilters.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1, oTokenData.value2));
											}else {
												aFilters.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1));
											}
										}
									});
								}
							});

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");
							var oTable = oValueHelpDialog.getTable();
							this.getActivityStdNSet(oTable, oViewModel, oFilter, oController);
						}
					}.bind(this)
				});

				oValueHelpDialog.setRangeKeyFields([{
					label: oResourceBundle.getText("activityType"),
					key: "ActivityType"
				}, {
					label: oResourceBundle.getText("ControllingArea"),
					key: "COArea"
				}, {
					label: oResourceBundle.getText("ShortText"),
					key: "ShortText"
				}, {
					label: oResourceBundle.getText("Language"),
					key: "Language"
				}, {
					label: oResourceBundle.getText("ValidFrom"),
					key: "ValidFrom"
				}, {
					label: oResourceBundle.getText("ValidTo"),
					key: "ValidTo"
				}]);

				oValueHelpDialog.setFilterBar(oFilterBar);

				this.setFGrpActivityBonusStdN(oValueHelpDialog, oController);
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			setFGrpActivityBonusStdN: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHActivityStdN
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdN",
						groupName: "gp1",
						name: "ActivityType",
						label: oResourceBundle.getText("activityType"),
						control: new sap.m.MultiInput({
							name: "ActivityType"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdN",
						groupName: "gp1",
						name: "COArea",
						label: oResourceBundle.getText("ControllingArea"),
						control: new sap.m.MultiInput({
							name: "COArea"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdN",
						groupName: "gp1",
						name: "ShortText",
						label: oResourceBundle.getText("ShortText"),
						control: new sap.m.MultiInput({
							name: "ShortText"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdN",
						groupName: "gp1",
						name: "Language",
						label: oResourceBundle.getText("Language"),
						control: new sap.m.MultiInput({
							name: "Language"
						})
					})
				];
				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
					oControl.attachValueHelpRequest(function(oEvent) {
						var oInput = oEvent.getSource();
						
						this._oConditionSH = this.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
						}
					}.bind(this));
				}.bind(this));

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},

			bindActivityBonusSet: function(oTable, sDateFormat, oViewModel, oController) {

				var oResourceBundle = oController.getResourceBundle();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("activityType"),
						tooltip: oResourceBundle.getText("activityType")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ActivityType'
						},
						wrapping: false,
						tooltip: {
							path: 'ActivityType'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "ActivityType"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ControllingArea"),
						tooltip: oResourceBundle.getText("ControllingArea")
					}),
					template: new sap.m.Text({
						text: {
							path: 'COArea'
						},
						wrapping: false,
						tooltip: {
							path: 'COArea'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ShortText"),
						tooltip: oResourceBundle.getText("ShortText")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ShortText'
						},
						wrapping: false,
						tooltip: {
							path: 'ShortText'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Language"),
						tooltip: oResourceBundle.getText("Language")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Language'
						},
						wrapping: false,
						tooltip: {
							path: 'Language'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ValidFrom"),
						tooltip: oResourceBundle.getText("ValidFrom")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ValidFrom',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "ValidFrom"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ValidTo"),
						tooltip: oResourceBundle.getText("ValidTo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ValidTo',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "MM/dd/yyyy";
									else
										sDatePattern = sDateFormat;

									var oDateTimeFormat = sap.ui.core.format.DateFormat
										.getDateTimeInstance({
											pattern: sDatePattern
										});

									return oDateTimeFormat.format(oDate);
								} else
									return "";
							}
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "ValidTo"
				}));
			},
			
			getActivityStdNSet : function(oTable, oViewModel, oFilter, oController){
				var self = oController;
				var oModel = self.getModel();
				var sPath = "/SHActivityStdNSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
			
			/*Search help for WBS element*/
			/** Initialising a value help dialog with single select and select from table only configuration **/
			initWBSElementSearch: function(oInput, sTitle, sKey, sDescKey, sScreen, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: sTitle,
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: sKey,
					descriptionKey: sDescKey,
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						// Getting selected token
						if (aTokens[0]) // There's only one because table is single select
							oInput.setValue(aTokens[0].getKey());
						oValueHelpDialog.close();
					}.bind(oInput),

					cancel: function(oControlEvent) { // Event handler cancel
						oValueHelpDialog.close();
					},

					afterClose: function() { // Event handler afterClose
						oValueHelpDialog.destroy();
					}
				});

				// Creating model for view state of dialog component
				var oViewModel = new JSONModel({
					busy: false,
					BusyDelay: 0
				});
				oValueHelpDialog.setModel(oViewModel, "VHDialogView");

				// Adding a filter bar to the value help dialog
				var oFilterBar = new FilterBar({
					advancedMode: true,
					filterBarExpanded: true,
					showGoOnFB: !sap.ui.Device.system.phone,
					search: function(oControlEvent) {
						if (arguments[0] && arguments[0].mParameters) {
							var aInputs = arguments[0].mParameters.selectionSet;
							var sOperator = sap.ui.model.FilterOperator.Contains;
							var aFilters = [];

							aInputs.forEach(function(oInput) {
								if (oInput && oInput.getValue() !== "") {
									aFilters.push(new Filter(oInput.getName(), sOperator, oInput.getValue()));
								}else if(oInput && oInput.getTokens().length !== 0) {
									var aTokens = oInput.getTokens();
									aTokens.forEach(function(oToken){
										var oTokenData = oToken.data().range;
										if(oTokenData.exclude) {
											aFilters.push(new Filter(oInput.getName(), "NE", oTokenData.value1));
										}else {
											if(oTokenData.operation === "BT") {
												aFilters.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1, oTokenData.value2));
											}else {
												aFilters.push(new Filter(oInput.getName(), oTokenData.operation, oTokenData.value1));
											}
										}
									});
								}
							});
							
							aFilters.push(new Filter("Screen", FilterOperator.EQ, sScreen));

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");
							var oTable = oValueHelpDialog.getTable();
							this.getWBSElementStdKSet(oTable, oViewModel, oFilter, oController);
						}

					}.bind(this)
				});
				
				oValueHelpDialog.setRangeKeyFields([{
					label: oResourceBundle.getText("wbsElement"),
					key: "WBSElement"
				}, {
					label: oResourceBundle.getText("ShortID"),
					key: "ShortID"
				}, {
					label: oResourceBundle.getText("desc"),
					key: "Description"
				}]);

				oValueHelpDialog.setFilterBar(oFilterBar);
				this.setFGrpWBSElement(oValueHelpDialog, oController);
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			setFGrpWBSElement: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHWBSElementStdK
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "WBSElement",
						groupName: "gp1",
						name: "ShortID",
						label: oResourceBundle.getText("ShortID"),
						control: new sap.m.MultiInput({
							name: "ShortID"
						})
					}),
					
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "WBSElement",
						groupName: "gp1",
						name: "WBSElement",
						label: oResourceBundle.getText("wbsElement"),
						control: new sap.m.MultiInput({
							name: "WBSElement"
						})
					}),
					
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "WBSElement",
						groupName: "gp1",
						name: "Description",
						label: oResourceBundle.getText("desc"),
						control: new sap.m.MultiInput({
							name: "Description"
						})
					})
				];
				
				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
					
					oControl.attachValueHelpRequest(function(oEvent) {
						var oInput = oEvent.getSource();
						
						this._oConditionSH = this.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
						}
					}.bind(this));
				}.bind(this));

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},

			bindWBSElementSet: function(oTable, oViewModel, oController) {
				
				var oResourceBundle = oController.getResourceBundle();
				
				oTable.addExtension(new sap.m.Toolbar({
		            content: [
		            	new sap.m.ToolbarSpacer({
		            		width: ""
		            	}),
		            	new sap.m.Label({
		            		text: oResourceBundle.getText("MaxHits")
		            	}),
		            	new sap.m.Input({
		            		type: "Number",
		                    value: "500",
		                    width: "100px"
		                })
		            ]
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ShortID"),
						tooltip: oResourceBundle.getText("ShortID")
					}),
					template: new sap.m.Text({
						text: {
							path: 'ShortID'
						},
						wrapping: false,
						tooltip: {
							path: 'ShortID'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("wbsElement"),
						tooltip: oResourceBundle.getText("wbsElement")
					}),
					template: new sap.m.Text({
						text: {
							path: 'WBSElement'
						},
						wrapping: false,
						tooltip: {
							path: 'WBSElement'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "WBSElement"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc"),
						tooltip: oResourceBundle.getText("desc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Description'
						},
						wrapping: true,
						tooltip: {
							path: 'Description'
						}
					})
				}));
			},
			
			getWBSElementStdKSet : function(oTable, oViewModel, oFilter, oController){
				var self = oController;
				var oExtension = oTable.getExtension();
				var oContent = oExtension[0].getContent();
				var maxHits;
				
				if(oContent[2].getValue() === ""){
					maxHits = 9999;
				} else {
					maxHits = parseInt(oContent[2].getValue());
				}
				
				oTable.setThreshold(maxHits);
				var oModel = self.getModel();
				var sPath = "/SHWBSElementStdKSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					length: maxHits,
					filters: oFilter,
					sorter: new sap.ui.model.Sorter("ShortID", false),
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function(oEvent) {
							oViewModel.setProperty("/busy", false);
							var oSource = oEvent.getSource(); 
						    oSource.bClientOperation = true;               //Set Client Operation to true 
						    oSource.sOperationMode = "Client"; 
						}
					}
				});
			},
			
			/*Search Help for CCQ*/
			
			bindCcqSet: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("ccq"),
						tooltip: oResourceBundle.getText("ccq")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Ccq'
						},
						wrapping: false,
						tooltip: {
							path: 'Ccq'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc"),
						tooltip: oResourceBundle.getText("desc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Desc'
						},
						wrapping: false,
						tooltip: {
							path: 'Desc'
						}
					})
				}));

				var oModel = self.getModel();
				var sPath = "/SHCCQSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
			
			/*Search Help for Rule*/
			bindRuleSet: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("rule"),
						tooltip: oResourceBundle.getText("rule")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Rule'
						},
						wrapping: false,
						tooltip: {
							path: 'Rule'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc"),
						tooltip: oResourceBundle.getText("desc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Desc'
						},
						wrapping: false,
						tooltip: {
							path: 'Desc'
						}
					})
				}));

				var oModel = self.getModel();
				var sPath = "/SHRuleSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					events: {
						dataRequested: function() {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
			
			/*Material Group for Search Help*/
			/*Refer to MaterialSearchHelp.js*/
			bindMatFilterList: function(oParam, oCBox, oItemTemplate, aResults, oController) {
				var self = oController;
				var oDeferred = $.Deferred();
				
				// Fetching filter option list				
				var oDfrdList = MaterialSearchHelp.getMatFilterList(oParam, aResults, self);
				
				oDfrdList.then(
					// Success handler
					function() {
						// Creating model for results
						var oListModel = new JSONModel(aResults);
						oListModel.setDefaultBindingMode("OneWay");
						oCBox.setModel(oListModel);
						// Binding model to combo box
						oCBox.bindItems("/", oItemTemplate);
						
						oDeferred.resolve();
					}.bind(this),
					// Error handler
					function(){
						oDeferred.reject();
					});
					
				return oDeferred.promise();
			}
	};
	
	return SearchHelps;
}, true);
