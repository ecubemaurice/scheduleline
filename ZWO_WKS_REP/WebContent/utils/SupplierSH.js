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
	"zwo/ui/wks_rep/utils/SearchHelps",
	"zwo/ui/wks_rep/utils/MaterialSearchHelp"
], function(formatter, models, MessageToast, JSONModel, ValueHelpDialog, FilterBar, 
			Filter, FilterOperator, SearchHelps, MaterialSearchHelp){
	"use strict";
	
	var SupplierSH = {
			
			initSearchSupplier: function(oInput, oController) {

				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText("Vendor"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "Vendor",
					descriptionKey: "Vendor",
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
								}else if(oInput.getName() === "CompanyCode" && oInput.getValue() === ""){
									aFilters.push(new Filter(oInput.getName(), sOperator, ""));
								}
							});

							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");	
							var oTable = oValueHelpDialog.getTable();
							
							if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHSupplierStdA")){
								this.getSupplierStdASet(oTable, oViewModel, oFilter, oController);
							}else if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHSupplierStdK")){
								this.getSupplierStdKSet(oTable, oViewModel, oFilter, oController);
							}else if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHSupplierStdM")){
								this.getSupplierStdMSet(oTable, oViewModel, oFilter, oController);
							}
						}
					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Adding Selection Search Template
				oValueHelpDialog.oSelectionTitle.setText("Select Search Template");
				oValueHelpDialog.oSelectionTitle.setVisible(true);
				oValueHelpDialog.oSelectionButton.setVisible(true);

				// Setting Range Key Fields
				var fSetRangeKey = jQuery.proxy(function(oEvt) {
					var sTitle = oValueHelpDialog.oSelectionTitle.getText();
					if (sTitle === oResourceBundle.getText("SHSupplierStdA")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("SearchTerm"),
							key: "SearchTerm"
						}, {
							label: oResourceBundle.getText("Country"),
							key: "Country"
						}, {
							label: oResourceBundle.getText("PostalCode"),
							key: "PostalCode"
						}, {
							label: oResourceBundle.getText("City"),
							key: "City"
						}, {
							label: oResourceBundle.getText("Name"),
							key: "Name"
						}, {
							label: oResourceBundle.getText("Vendor"),
							key: "Vendor"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHSupplierStdK")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("SearchTerm"),
							key: "SearchTerm"
						}, {
							label: oResourceBundle.getText("Country"),
							key: "Country"
						}, {
							label: oResourceBundle.getText("PostalCode"),
							key: "PostalCode"
						}, {
							label: oResourceBundle.getText("City"),
							key: "City"
						}, {
							label: oResourceBundle.getText("Name"),
							key: "Name"
						}, {
							label: oResourceBundle.getText("Vendor"),
							key: "Vendor"
						}, {
							label: oResourceBundle.getText("CompanyCode"),
							key: "CompanyCode"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHSupplierStdM")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("Material"),
							key: "Material"
						}, {
							label: oResourceBundle.getText("VendorMaterialNo"),
							key: "VendorMatNo"
						}, {
							label: oResourceBundle.getText("PurchOrganisation"),
							key: "PurchasingOrg"
						}, {
							label: oResourceBundle.getText("Vendor"),
							key: "Vendor"
						}, {
							label: oResourceBundle.getText("PurchasingInfoRec"),
							key: "InfoRecord"
						}, {
							label: oResourceBundle.getText("InfoRecCategory"),
							key: "Infotype"
						}, {
							label: oResourceBundle.getText("Plant"),
							key: "Plant"
						}]);
					}
					//oValueHelpDialog.update();
				}, this);

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
							if (oAnnotation === oResourceBundle.getText("SHSupplierStdA")) {
								// Setting filter group items for table STDA
								this.setSGrpStdA(oValueHelpDialog, oController);
								// Binding SHSupplierStdA table
								this.bindSupplierStdA(oTable, oViewModel, oController);
								//fSetRangeKey();
							} else if (oAnnotation === oResourceBundle.getText("SHSupplierStdK")) {
								// Setting filter group otems for table STDK
								this.setSGrpStdK(oValueHelpDialog, oController);
								// Binding SHSupplierStdK table
								this.bindSupplierStdK(oTable, oViewModel, oController);
								//set value for company code
								this.getDefaultComapanyCode(oValueHelpDialog, oController);
								//fSetRangeKey();
							} else if (oAnnotation === oResourceBundle.getText("SHSupplierStdM")) {
								// Setting filter group otems for table STDM
								this.setSGrpStdM(oValueHelpDialog, oController);
								// Binding SHSupplierStdM table
								this.bindSupplierStdM(oTable, oViewModel, oController);
								//fSetRangeKey();
							}
						}

					}
				}, this);

				// Creating search template list
				var oSearchTemplateList = new sap.m.List({
					mode: sap.m.ListMode.SingleSelectMaster,
					selectionChange: fOnSelectTemplate
				});

				for (var i = 0; i < 3; i++) {
					var sTitle = "Search Template " + i;
					if (i === 0)
						sTitle = oResourceBundle.getText("SHSupplierStdA");
					if (i === 1)
						sTitle = oResourceBundle.getText("SHSupplierStdK");
					if (i === 2)
						sTitle = oResourceBundle.getText("SHSupplierStdM");

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
				this.bindSupplierStdA(oTable, oViewModel, oController);
				this.setSGrpStdA(oValueHelpDialog, oController);
				//fSetRangeKey();

				// Creating popover for search template list
				var oSearchTemplatePopOver = new sap.m.ResponsivePopover({
					placement: sap.m.PlacementType.Bottom,
					showHeader: true,
					title: "Select Search Template",
					contentHeight: "9rem",
					content: [
						oSearchTemplateList
					]
				});

				// Opening popover when pressing search template button
				oValueHelpDialog.oSelectionButton.attachPress(function() {
					oSearchTemplatePopOver.openBy(this);
				});
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			bindSupplierStdA: function(oTable, oViewModel, oController) {
				var oColModel = new sap.ui.model.json.JSONModel();
				var oResourceBundle = oController.getResourceBundle();
				oTable.destroyColumns();
				oTable.unbindRows();
				oTable.destroyExtension();
				
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
						text: oResourceBundle.getText("SearchTerm"),
						tooltip: oResourceBundle.getText("SearchTerm")
					}),
					template: new sap.m.Text({
						text: {
							path: "SearchTerm",
						},
						wrapping: false,
						tooltip: {
							path: 'SearchTerm'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Country"),
						tooltip: oResourceBundle.getText("Country")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Country'
						},
						wrapping: false,
						tooltip: {
							path: 'Country'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Country"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PostalCode"),
						tooltip: oResourceBundle.getText("PostalCode")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PostalCode'
						},
						wrapping: false,
						tooltip: {
							path: 'PostalCode'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PostalCode"
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
					}),
					showSortMenuEntry: true,
					sortProperty: "City"
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
					}),
					showSortMenuEntry: true,
					sortProperty: "Name"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Vendor"),
						tooltip: oResourceBundle.getText("Vendor")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Vendor'
						},
						wrapping: false,
						tooltip: {
							path: 'Vendor'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Vendor"
				}));
			},
			
			getSupplierStdASet : function(oTable, oViewModel, oFilter, oController){
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
				var sPath = "/SHSupplierStdASet";
				oTable.setModel(oModel); 
				oTable.bindRows({
					path: sPath,
					length: maxHits,
					filters: oFilter,
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

			bindSupplierStdK: function(oTable, oViewModel, oController) {
				var oColModel = new sap.ui.model.json.JSONModel();
				var oResourceBundle = oController.getResourceBundle();
				oTable.destroyColumns();
				oTable.unbindRows();
				oTable.destroyExtension();
				
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
						text: oResourceBundle.getText("SearchTerm"),
						tooltip: oResourceBundle.getText("SearchTerm")
					}),
					template: new sap.m.Text({
						text: {
							path: 'SearchTerm'
						},
						wrapping: false,
						tooltip: {
							path: 'SearchTerm'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Country"),
						tooltip: oResourceBundle.getText("Country")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Country'
						},
						wrapping: false,
						tooltip: {
							path: 'Country'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Country"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PostalCode"),
						tooltip: oResourceBundle.getText("PostalCode")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PostalCode'
						},
						wrapping: false,
						tooltip: {
							path: 'PostalCode'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PostalCode"
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
					}),
					showSortMenuEntry: true,
					sortProperty: "City"
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
					}),
					showSortMenuEntry: true,
					sortProperty: "Name"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Vendor"),
						tooltip: oResourceBundle.getText("Vendor")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Vendor'
						},
						wrapping: false,
						tooltip: {
							path: 'Vendor'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Vendor"
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
			},
			
			getSupplierStdKSet : function(oTable, oViewModel, oFilter, oController){
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
				var sPath = "/SHSupplierStdKSet";
				oTable.setModel(oModel); 
				oTable.bindRows({
					path: sPath,
					length: maxHits,
					filters: oFilter,
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
			
			getDefaultComapanyCode: function(oValueHelpDialog, oController){
				var self = oController;
				var oModel = self.getModel();
				
				var oParam = {
					"ParamID": "BUK"
				};
				var aResults = [];
				oModel.callFunction("/GetDefaultParam",{
					method: "GET",
					urlParameters: oParam,
					success: function(oData){
						var aRes = oData.GetDefaultParam;
						if(aRes.Value){
							aResults.push(aRes);
						} 
						var oFilterItem = oValueHelpDialog._oFilterBar._mAdvancedAreaFilter.gp1.items[5];
						var oControl = oFilterItem.control;
						oControl.setValue(aResults[0].Value);
					}
				});
			},

			bindSupplierStdM: function(oTable, oViewModel, oController) {
				var oColModel = new sap.ui.model.json.JSONModel();
				var oResourceBundle = oController.getResourceBundle();
				oTable.destroyColumns();
				oTable.unbindRows();
				oTable.destroyExtension();
				
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
						text: oResourceBundle.getText("Material"),
						tooltip: oResourceBundle.getText("Material")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Material'
						},
						wrapping: false,
						tooltip: {
							path: 'Material'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Material",
					sorted: true
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("VendorMaterialNo"),
						tooltip: oResourceBundle.getText("VendorMaterialNo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'VendorMatNo'
						},
						wrapping: false,
						tooltip: {
							path: 'VendorMatNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "VendorMatNo"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PurchOrganisation"),
						tooltip: oResourceBundle.getText("PurchOrganisation")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchasingOrg'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchasingOrg'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchasingOrg"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Vendor"),
						tooltip: oResourceBundle.getText("Vendor")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Vendor'
						},
						wrapping: false,
						tooltip: {
							path: 'Vendor'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Vendor"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PurchasingInfoRec"),
						tooltip: oResourceBundle.getText("PurchasingInfoRec")
					}),
					template: new sap.m.Text({
						text: {
							path: 'InfoRecord'
						},
						wrapping: false,
						tooltip: {
							path: 'InfoRecord'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("InfoRecCategory"),
						tooltip: oResourceBundle.getText("InfoRecCategory")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Infotype'
						},
						wrapping: false,
						tooltip: {
							path: 'Infotype'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Plant"),
						tooltip: oResourceBundle.getText("Plant")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Plant'
						},
						wrapping: false,
						tooltip: {
							path: 'Plant'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Plant"
				}));
			},
			
			getSupplierStdMSet : function(oTable, oViewModel, oFilter, oController){
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
				var sPath = "/SHSupplierStdMSet";
				oTable.setModel(oModel); 
				oTable.bindRows({
					path: sPath,
					length: maxHits,
					filters: oFilter,
					sorter: new sap.ui.model.Sorter("Material", false),
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

			setSGrpStdA: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				// Creating a filter group for each search field for table SHSupplierStdA
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdA",
						groupName: "gp1",
						name: "SearchTerm",
						label: oResourceBundle.getText("SearchTerm"),
						control: new sap.m.MultiInput({
							name: "SearchTerm"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdA",
						groupName: "gp1",
						name: "Country",
						label: oResourceBundle.getText("Country"),
						control: new sap.m.MultiInput({
							name: "Country"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdA",
						groupName: "gp1",
						name: "PostalCode",
						label: oResourceBundle.getText("PostalCode"),
						control: new sap.m.MultiInput({
							name: "PostalCode"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdA",
						groupName: "gp1",
						name: "City",
						label: oResourceBundle.getText("City"),
						control: new sap.m.MultiInput({
							name: "City"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdA",
						groupName: "gp1",
						name: "Name",
						label: oResourceBundle.getText("Name"),
						control: new sap.m.MultiInput({
							name: "Name"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdA",
						groupName: "gp1",
						name: "Vendor",
						label: oResourceBundle.getText("Vendor"),
						control: new sap.m.MultiInput({
							name: "Vendor"
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
						
						this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
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

			setSGrpStdK: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				// Creating a filter group for each search field for table SHSupplierStdK
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdK",
						groupName: "gp1",
						name: "Country",
						label: oResourceBundle.getText("Country"),
						control: new sap.m.MultiInput({
							name: "Country"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdK",
						groupName: "gp1",
						name: "PostalCode",
						label: oResourceBundle.getText("PostalCode"),
						control: new sap.m.MultiInput({
							name: "PostalCode"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdK",
						groupName: "gp1",
						name: "City",
						label: oResourceBundle.getText("City"),
						control: new sap.m.MultiInput({
							name: "City"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdK",
						groupName: "gp1",
						name: "Name",
						label: oResourceBundle.getText("Name"),
						control: new sap.m.MultiInput({
							name: "Name"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdK",
						groupName: "gp1",
						name: "Vendor",
						label: oResourceBundle.getText("Vendor"),
						control: new sap.m.MultiInput({
							name: "Vendor"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdK",
						groupName: "gp1",
						name: "CompanyCode",
						label: oResourceBundle.getText("CompanyCode2"),
						control: new sap.m.MultiInput({
							name: "CompanyCode"
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
						
						this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
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

			setSGrpStdM: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				// Creating a filter group for each search field for table SHSupplierStdM
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "Material",
						label: oResourceBundle.getText("Material"),
						control: new sap.m.MultiInput({
							name: "Material"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "VendorMatNo",
						label: oResourceBundle.getText("VendorMaterialNo"),
						control: new sap.m.MultiInput({
							name: "VendorMatNo"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "PurchasingOrg",
						label: oResourceBundle.getText("PurchOrganisation"),
						control: new sap.m.MultiInput({
							name: "PurchasingOrg"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "Vendor",
						label: oResourceBundle.getText("Vendor"),
						control: new sap.m.MultiInput({
							name: "Vendor"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "InfoRecord",
						label: oResourceBundle.getText("PurchasingInfoRec"),
						control: new sap.m.MultiInput({
							name: "InfoRecord"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "Infotype",
						label: oResourceBundle.getText("InfoRecCategory"),
						control: new sap.m.MultiInput({
							name: "Infotype"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "Plant",
						label: oResourceBundle.getText("Plant"),
						control: new sap.m.MultiInput({
							name: "Plant"
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
						
						this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (this._oConditionSH) {
							this._oConditionSH.open();
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
	};
	
	
	return SupplierSH;
	
});