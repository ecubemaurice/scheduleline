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
	
	var PurchaseOrdSH = {
			initSearchPurchaseDoc: function(oInput, sHeaderTitle, oController) {

				// Saving user date format
				var sDateFormat = oInput.getModel("user").getProperty("/DateFormat");

				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: sHeaderTitle,
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "PurchasingDoc",
					descriptionKey: "PurchasingDoc",
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
								try{
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
								} catch(error){
									try{
										if(oInput && oInput.getSelected()){
											aFilters.push(new Filter(oInput.getName(), sOperator, oInput.getSelected()));
										}
									} catch(error){}
								}
							});


							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");	
							var oTable = oValueHelpDialog.getTable();
							
							if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHPurchaseOrdStdL") ||
								oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHAgreementStdL") ){
								this.getPurchaseOrdStdLSet(oTable, oViewModel, oFilter, oController);
							}else if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHPurchaseOrdStdM") ||
							oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHAgreementStdM") ){
								this.getPurchaseOrdStdMSet(oTable, oViewModel, oFilter, oController);
							}else if (oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHPurchaseOrdStdP") ||
							oValueHelpDialog.oSelectionTitle.getText() === oResourceBundle.getText("SHAgreementStdP") ){
								this.getPurchaseOrdStdPSet(oTable, oViewModel, oFilter, oController);
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
					if (sTitle === oResourceBundle.getText("SHPurchaseOrdStdL")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("Vendor"),
							key: "Vendor"
						}, {
							label: oResourceBundle.getText("PurchOrganisation"),
							key: "PurchasingOrg"
						}, {
							label: oResourceBundle.getText("PurchasingGroup"),
							key: "PurchGroup"
						}, {
							label: oResourceBundle.getText("DocumentDate"),
							key: "DocumentDate"
						}, {
							label: oResourceBundle.getText("PurchDocCategory"),
							key: "DocCategory"
						}, {
							label: oResourceBundle.getText("OrderType"),
							key: "OrderType"
						}, {
							label: oResourceBundle.getText("purchasingDoc"),
							key: "PurchasingDoc"
						}, {
							label: oResourceBundle.getText("poWithStock"),
							key: "POStock"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHPurchaseOrdStdM")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("Material"),
							key: "Material"
						}, {
							label: oResourceBundle.getText("Plant"),
							key: "Plant"
						}, {
							label: oResourceBundle.getText("PurchDocCategory"),
							key: "DocCategory"
						}, {
							label: oResourceBundle.getText("OrderType"),
							key: "OrderType"
						}, {
							label: oResourceBundle.getText("purchasingDoc"),
							key: "PurchasingDoc"
						}, {
							label: oResourceBundle.getText("Item"),
							key: "Item"
						}, {
							label: oResourceBundle.getText("poWithStock"),
							key: "POStock"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHPurchaseOrdStdP")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("wbsElement"),
							key: "WBSElement"
						}, {
							label: oResourceBundle.getText("PurchDocCategory"),
							key: "DocCategory"
						}, {
							label: oResourceBundle.getText("PurchOrganisation"),
							key: "PurchasingOrg"
						}, {
							label: oResourceBundle.getText("purchasingDoc"),
							key: "PurchasingDoc"
						}, {
							label: oResourceBundle.getText("Item"),
							key: "Item"
						}, {
							label: oResourceBundle.getText("SeqNoAccAss"),
							key: "SeqNoAccAss"
						}, {
							label: oResourceBundle.getText("poWithStock"),
							key: "POStock"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHAgreementStdL")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("Vendor"),
							key: "Vendor"
						}, {
							label: oResourceBundle.getText("PurchOrganisation"),
							key: "PurchasingOrg"
						}, {
							label: oResourceBundle.getText("PurchasingGroup"),
							key: "PurchGroup"
						}, {
							label: oResourceBundle.getText("DocumentDate"),
							key: "DocumentDate"
						}, {
							label: oResourceBundle.getText("PurchDocCategory"),
							key: "DocCategory"
						}, {
							label: oResourceBundle.getText("OrderType"),
							key: "OrderType"
						}, {
							label: oResourceBundle.getText("purchasingDoc"),
							key: "PurchasingDoc"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHAgreementStdM")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("Material"),
							key: "Material"
						}, {
							label: oResourceBundle.getText("Plant"),
							key: "Plant"
						}, {
							label: oResourceBundle.getText("PurchDocCategory"),
							key: "DocCategory"
						}, {
							label: oResourceBundle.getText("OrderType"),
							key: "OrderType"
						}, {
							label: oResourceBundle.getText("purchasingDoc"),
							key: "PurchasingDoc"
						}, {
							label: oResourceBundle.getText("Item"),
							key: "Item"
						}]);
					} else if (sTitle === oResourceBundle.getText("SHAgreementStdP")) {
						// Clearing Range Key Fields
						oValueHelpDialog.setRangeKeyFields([]);
						// Setting new range key fields
						oValueHelpDialog.setRangeKeyFields([{
							label: oResourceBundle.getText("wbsElement"),
							key: "WBSElement"
						}, {
							label: oResourceBundle.getText("PurchDocCategory"),
							key: "DocCategory"
						}, {
							label: oResourceBundle.getText("PurchOrganisation"),
							key: "PurchasingOrg"
						}, {
							label: oResourceBundle.getText("purchasingDoc"),
							key: "PurchasingDoc"
						}, {
							label: oResourceBundle.getText("Item"),
							key: "Item"
						}, {
							label: oResourceBundle.getText("SeqNoAccAss"),
							key: "SeqNoAccAss"
						}]);
					}
					oValueHelpDialog.update();
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
							if (oAnnotation === oResourceBundle.getText("SHPurchaseOrdStdL") || 
									oAnnotation === oResourceBundle.getText("SHAgreementStdL")) {
								// Setting filter group items for table STDL
								this.setPGrpStdL(oValueHelpDialog, sHeaderTitle, oController);
								// Binding SHPurchaseOrdStdL table
								this.bindPurchaseOrdStdL(oTable, sDateFormat, oViewModel, oController);
								//fSetRangeKey();
							} else if (oAnnotation === oResourceBundle.getText("SHPurchaseOrdStdM") || 
									oAnnotation === oResourceBundle.getText("SHAgreementStdM")) {
								// Setting filter group otems for table STDM
								this.setPGrpStdM(oValueHelpDialog, sHeaderTitle, oController);
								// Binding SHPurchaseOrdStdM table
								this.bindPurchaseOrdStdM(oTable, oViewModel, oController);
								//fSetRangeKey();
							} else if (oAnnotation === oResourceBundle.getText("SHPurchaseOrdStdP") || 
									oAnnotation === oResourceBundle.getText("SHAgreementStdP")) {
								// Setting filter group otems for table STDP
								this.setPGrpStdP(oValueHelpDialog, sHeaderTitle, oController);
								// Binding SHPurchaseOrdStdP table
								this.bindPurchaseOrdStdP(oTable, oViewModel, oController);
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
					if(sHeaderTitle === oResourceBundle.getText("PurchaseOrder")){
						if (i === 0)
							sTitle = oResourceBundle.getText("SHPurchaseOrdStdL");
						if (i === 1)
							sTitle = oResourceBundle.getText("SHPurchaseOrdStdM");
						if (i === 2)
							sTitle = oResourceBundle.getText("SHPurchaseOrdStdP");
					} else if(sHeaderTitle === oResourceBundle.getText("Agreement")){
						if (i === 0)
							sTitle = oResourceBundle.getText("SHAgreementStdL");
						if (i === 1)
							sTitle = oResourceBundle.getText("SHAgreementStdM");
						if (i === 2)
							sTitle = oResourceBundle.getText("SHAgreementStdP");
					}

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
				this.bindPurchaseOrdStdL(oTable, sDateFormat, oViewModel, oController);
				this.setPGrpStdL(oValueHelpDialog, sHeaderTitle, oController);
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

			bindPurchaseOrdStdL: function(oTable, sDateFormat, oViewModel, oController) {
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
						text: oResourceBundle.getText("PurchasingGroup"),
						tooltip: oResourceBundle.getText("PurchasingGroup")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchGroup'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchGroup'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchGroup"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("DocumentDate"),
						tooltip: oResourceBundle.getText("DocumentDate")
					}),
					template: new sap.m.Text({
						text: {
							path: 'DocumentDate',
							formatter: function(oDate) {
								if (oDate) {
									var sDatePattern = "";
									if (!sDateFormat)
										sDatePattern = "dd.MM.yyyy";
									else
										sDatePattern = sDateFormat;

									if (this.getModel("user"))
										sDatePattern = this.getModel("user").getProperty("/DateFormat");

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
					sortProperty: "DocumentDate"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PurchDocCategory"),
						tooltip: oResourceBundle.getText("PurchDocCategory")
					}),
					template: new sap.m.Text({
						text: {
							path: 'DocCategory'
						},
						wrapping: false,
						tooltip: {
							path: 'DocCategory'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "DocCategory"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("OrderType"),
						tooltip: oResourceBundle.getText("OrderType")
					}),
					template: new sap.m.Text({
						text: {
							path: 'OrderType'
						},
						wrapping: false,
						tooltip: {
							path: 'OrderType'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "OrderType"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("purchasingDoc"),
						tooltip: oResourceBundle.getText("purchasingDoc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchasingDoc'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchasingDoc'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchasingDoc"
				}));
			},
			
			getPurchaseOrdStdLSet: function(oTable, oViewModel, oFilter, oController){
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
				var sPath = "/SHPurchaseOrdStdLSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					length: maxHits,
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

			bindPurchaseOrdStdM: function(oTable, oViewModel, oController) {
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
					sortProperty: "Material"
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

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PurchDocCategory"),
						tooltip: oResourceBundle.getText("PurchDocCategory")
					}),
					template: new sap.m.Text({
						text: {
							path: 'DocCategory'
						},
						wrapping: false,
						tooltip: {
							path: 'DocCategory'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "DocCategory"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("OrderType"),
						tooltip: oResourceBundle.getText("OrderType")
					}),
					template: new sap.m.Text({
						text: {
							path: 'OrderType'
						},
						wrapping: false,
						tooltip: {
							path: 'OrderType'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "OrderType"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("purchasingDoc"),
						tooltip: oResourceBundle.getText("purchasingDoc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchasingDoc'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchasingDoc'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchasingDoc"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Item"),
						tooltip: oResourceBundle.getText("Item")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Item'
						},
						wrapping: false,
						tooltip: {
							path: 'Item'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Item"
				}));
			},
			
			getPurchaseOrdStdMSet : function(oTable, oViewModel, oFilter, oController){
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
				var sPath = "/SHPurchaseOrdStdMSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					length: maxHits,
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

			bindPurchaseOrdStdP: function(oTable, oViewModel, oController) {
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
						text: oResourceBundle.getText("PurchDocCategory"),
						tooltip: oResourceBundle.getText("PurchDocCategory")
					}),
					template: new sap.m.Text({
						text: {
							path: 'DocCategory'
						},
						wrapping: false,
						tooltip: {
							path: 'DocCategory'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "DocCategory"
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
						text: oResourceBundle.getText("purchasingDoc"),
						tooltip: oResourceBundle.getText("purchasingDoc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchasingDoc'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchasingDoc'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchasingDoc"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Item"),
						tooltip: oResourceBundle.getText("Item")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Item'
						},
						wrapping: false,
						tooltip: {
							path: 'Item'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Item"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("SeqNoAccAss"),
						tooltip: oResourceBundle.getText("SeqNoAccAss")
					}),
					template: new sap.m.Text({
						text: {
							path: 'SeqNoAccAss'
						},
						wrapping: false,
						tooltip: {
							path: 'SeqNoAccAss'
						}
					})
				}));
			},
			
			getPurchaseOrdStdPSet : function(oTable, oViewModel, oFilter, oController){
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
				var sPath = "/SHPurchaseOrdStdPSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath,
					filters: oFilter,
					length: maxHits,
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

			setPGrpStdL: function(oValueHelpDialog, sHeaderTitle, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				if(sHeaderTitle === oResourceBundle.getText("PurchaseOrder")){
					// Creating a filter group for each search field for table SHPGrpL
					var aFilterGroups = [
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "Vendor",
							label: oResourceBundle.getText("Vendor"),
							control: new sap.m.MultiInput({
								name: "Vendor"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "PurchasingOrg",
							label: oResourceBundle.getText("PurchOrganisation"),
							control: new sap.m.MultiInput({
								name: "PurchasingOrg"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "PurchGroup",
							label: oResourceBundle.getText("PurchasingGroup"),
							control: new sap.m.MultiInput({
								name: "PurchGroup"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "DocumentDate",
							label: oResourceBundle.getText("DocumentDate"),
							control: new sap.m.MultiInput({
								name: "DocumentDate"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "Code",
							label: oResourceBundle.getText("PurchDocCategory"),
							control: new sap.m.MultiInput({
								name: "DocCategory"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "OrderType",
							label: oResourceBundle.getText("OrderType"),
							control: new sap.m.MultiInput({
								name: "OrderType"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "PurchasingDoc",
							label: oResourceBundle.getText("purchasingDoc"),
							control: new sap.m.MultiInput({
								name: "PurchasingDoc"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "POStock",
							label: oResourceBundle.getText("poWithStock"),
							control: new sap.m.CheckBox({
								name: "poWithStock" //TODO check name with backend
							})
						})
					];
				} else if(sHeaderTitle === oResourceBundle.getText("Agreement")){
					// Creating a filter group for each search field for table SHPGrpL
					var aFilterGroups = [
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "Vendor",
							label: oResourceBundle.getText("Vendor"),
							control: new sap.m.MultiInput({
								name: "Vendor"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "PurchasingOrg",
							label: oResourceBundle.getText("PurchOrganisation"),
							control: new sap.m.MultiInput({
								name: "PurchasingOrg"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "PurchGroup",
							label: oResourceBundle.getText("PurchasingGroup"),
							control: new sap.m.MultiInput({
								name: "PurchGroup"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "DocumentDate",
							label: oResourceBundle.getText("DocumentDate"),
							control: new sap.m.MultiInput({
								name: "DocumentDate"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "Code",
							label: oResourceBundle.getText("PurchDocCategory"),
							control: new sap.m.MultiInput({
								name: "DocCategory",
								value: "K",
								editable: false
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "OrderType",
							label: oResourceBundle.getText("OrderType"),
							control: new sap.m.MultiInput({
								name: "OrderType"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdL",
							groupName: "gp1",
							name: "PurchasingDoc",
							label: oResourceBundle.getText("purchasingDoc"),
							control: new sap.m.MultiInput({
								name: "PurchasingDoc"
							})
						})
					];
				}

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					if(oControl.getProperty("name") !== "poWithStock"){
						oControl.attachSubmit(function() {
							oValueHelpDialog.getFilterBar().search();
						});
					}else {
						oControl.attachSelect(function(){
							oValueHelpDialog.getFilterBar().search();
						});
					}
					if(oControl.getProperty("name") !== "poWithStock"){
						oControl.attachValueHelpRequest(function(oEvent) {
							var oInput = oEvent.getSource();
							
							if(oItem.getLabel() === oResourceBundle.getText("Vendor")){
								oController.onRequestSupplier(oEvent);
							} else if(oItem.getLabel() === oResourceBundle.getText("PurchasingGroup")){
								this._PurchGroupStdSearchHelp = zwo.ui.wks_rep.utils.SearchHelps.createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("PurchasingGroup"), oItem.getName(), oItem.getLabel(), oController);
								if (this._PurchGroupStdSearchHelp) {
									var oTable = this._PurchGroupStdSearchHelp.getTable();
									var oViewModel = this._PurchGroupStdSearchHelp.getModel("VHDialogView");
									this.bindSHPurchGroupStd(oTable, oViewModel, oController);
									this._PurchGroupStdSearchHelp.open();
								}
							} else if(oItem.getLabel() === oResourceBundle.getText("PurchDocCategory")){
								this._FixedValuesSearchHelp = zwo.ui.wks_rep.utils.SearchHelps.createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("PurchDocCategory"), oItem.getName(), oItem.getLabel(), oController);
								if (this._FixedValuesSearchHelp) {
									var oTable = this._FixedValuesSearchHelp.getTable();
									var oViewModel = this._FixedValuesSearchHelp.getModel("VHDialogView");
									this.bindSHFixedValues(oTable, oViewModel, oController);
									this._FixedValuesSearchHelp.open();
								}
							} else {
								this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
								if (this._oConditionSH) {
									this._oConditionSH.open();
								}
							}
						}.bind(this));
					}
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

			setPGrpStdM: function(oValueHelpDialog, sHeaderTitle, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				if(sHeaderTitle === oResourceBundle.getText("PurchaseOrder")){
				// Creating a filter group for each search field for table SHSupplierStdA
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
						name: "Plant",
						label: oResourceBundle.getText("Plant"),
						control: new sap.m.MultiInput({
							name: "Plant"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "Code",
						label: oResourceBundle.getText("PurchDocCategory"),
						control: new sap.m.MultiInput({
							name: "DocCategory"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "OrderType",
						label: oResourceBundle.getText("OrderType"),
						control: new sap.m.MultiInput({
							name: "OrderType"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "PurchasingDoc",
						label: oResourceBundle.getText("purchasingDoc"),
						control: new sap.m.MultiInput({
							name: "PurchasingDoc"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "Item",
						label: oResourceBundle.getText("Item"),
						control: new sap.m.MultiInput({
							name: "Item"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdM",
						groupName: "gp1",
						name: "POStock",
						label: oResourceBundle.getText("poWithStock"),
						control: new sap.m.CheckBox({
							name: "poWithStock"
						})
					})
				];
				} else if(sHeaderTitle === oResourceBundle.getText("Agreement")){
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
							name: "Plant",
							label: oResourceBundle.getText("Plant"),
							control: new sap.m.MultiInput({
								name: "Plant"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdM",
							groupName: "gp1",
							name: "Code",
							label: oResourceBundle.getText("PurchDocCategory"),
							control: new sap.m.MultiInput({
								name: "DocCategory",
								value: "K",
								editable: false
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdM",
							groupName: "gp1",
							name: "OrderType",
							label: oResourceBundle.getText("OrderType"),
							control: new sap.m.MultiInput({
								name: "OrderType"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdM",
							groupName: "gp1",
							name: "PurchasingDoc",
							label: oResourceBundle.getText("purchasingDoc"),
							control: new sap.m.MultiInput({
								name: "PurchasingDoc"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdM",
							groupName: "gp1",
							name: "Item",
							label: oResourceBundle.getText("Item"),
							control: new sap.m.MultiInput({
								name: "Item"
							})
						})
					];
				}

				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					//oControl.addStyleClass("customVHInput");
					if(oControl.getProperty("name") !== "poWithStock"){
						oControl.attachSubmit(function() {
							oValueHelpDialog.getFilterBar().search();
						});
					}else {
						oControl.attachSelect(function(){
							oValueHelpDialog.getFilterBar().search();
						});
					}
					if(oControl.getProperty("name") !== "poWithStock"){
						oControl.attachValueHelpRequest(function(oEvent) {
							var oInput = oEvent.getSource();
							
							if(oItem.getLabel() === oResourceBundle.getText("PurchDocCategory")){
								this._FixedValuesSearchHelp = zwo.ui.wks_rep.utils.SearchHelps.createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("PurchDocCategory"), oItem.getName(), oItem.getLabel(), oController);
								if (this._FixedValuesSearchHelp) {
									var oTable = this._FixedValuesSearchHelp.getTable();
									var oViewModel = this._FixedValuesSearchHelp.getModel("VHDialogView");
									this.bindSHFixedValues(oTable, oViewModel, oController);
									this._FixedValuesSearchHelp.open();
								}
							} else {
								this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
								if (this._oConditionSH) {
									this._oConditionSH.open();
								}
							}
						}.bind(this));
					}
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

			setPGrpStdP: function(oValueHelpDialog, sHeaderTitle, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				if(sHeaderTitle === oResourceBundle.getText("PurchaseOrder")){
				// Creating a filter group for each search field for table SHSupplierStdA
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "WBSElement",
						label: oResourceBundle.getText("wbsElement"),
						control: new sap.m.MultiInput({
							name: "WBSElement"
						})
					}), 
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "Code",
						label: oResourceBundle.getText("PurchDocCategory"),
						control: new sap.m.MultiInput({
							name: "DocCategory"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "PurchasingOrg",
						label: oResourceBundle.getText("PurchOrganisation"),
						control: new sap.m.MultiInput({
							name: "PurchasingOrg"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "PurchasingDoc",
						label: oResourceBundle.getText("purchasingDoc"),
						control: new sap.m.MultiInput({
							name: "PurchasingDoc"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "Item",
						label: oResourceBundle.getText("Item"),
						control: new sap.m.MultiInput({
							name: "Item"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "SeqNoAccAss",
						label: oResourceBundle.getText("SeqNoAccAss"),
						control: new sap.m.MultiInput({
							name: "SeqNoAccAss"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "StdP",
						groupName: "gp1",
						name: "POStock",
						label: oResourceBundle.getText("poWithStock"),
						control: new sap.m.CheckBox({
							name: "poWithStock"
						})
					})
				];
				} else if(sHeaderTitle === oResourceBundle.getText("Agreement")){
					var aFilterGroups = [
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdP",
							groupName: "gp1",
							name: "WBSElement",
							label: oResourceBundle.getText("wbsElement"),
							control: new sap.m.MultiInput({
								name: "WBSElement"
							})
						}), 
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdP",
							groupName: "gp1",
							name: "Code",
							label: oResourceBundle.getText("PurchDocCategory"),
							control: new sap.m.MultiInput({
								name: "DocCategory",
								value: "K",
								editable: false
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdP",
							groupName: "gp1",
							name: "PurchasingOrg",
							label: oResourceBundle.getText("PurchOrganisation"),
							control: new sap.m.MultiInput({
								name: "PurchasingOrg"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdP",
							groupName: "gp1",
							name: "PurchasingDoc",
							label: oResourceBundle.getText("purchasingDoc"),
							control: new sap.m.MultiInput({
								name: "PurchasingDoc"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdP",
							groupName: "gp1",
							name: "Item",
							label: oResourceBundle.getText("Item"),
							control: new sap.m.MultiInput({
								name: "Item"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "StdP",
							groupName: "gp1",
							name: "SeqNoAccAss",
							label: oResourceBundle.getText("SeqNoAccAss"),
							control: new sap.m.MultiInput({
								name: "SeqNoAccAss"
							})
						})
					];
				}
				// Accessing each input control and applying methods addStyleClass and submit
				aFilterGroups.forEach(function(oItem) {
					var oControl = oItem.getControl();
					if(oControl.getProperty("name") !== "poWithStock"){
						oControl.attachSubmit(function() {
							oValueHelpDialog.getFilterBar().search();
						});
					}else {
						oControl.attachSelect(function(){
							oValueHelpDialog.getFilterBar().search();
						});
					}
					if(oControl.getProperty("name") !== "poWithStock"){
						oControl.attachValueHelpRequest(function(oEvent) {
							var oInput = oEvent.getSource();
							
							if(oItem.getLabel() === oResourceBundle.getText("wbsElement")){
								oController.onRequestWBS(oEvent);
							} else if(oItem.getLabel() === oResourceBundle.getText("PurchDocCategory")){
								this._FixedValuesSearchHelp = zwo.ui.wks_rep.utils.SearchHelps.createSingleSelectOnlyVHD(oInput, oResourceBundle.getText("PurchDocCategory"), oItem.getName(), oItem.getLabel(), oController);
								if (this._FixedValuesSearchHelp) {
									var oTable = this._FixedValuesSearchHelp.getTable();
									var oViewModel = this._FixedValuesSearchHelp.getModel("VHDialogView");
									this.bindSHFixedValues(oTable, oViewModel, oController);
									this._FixedValuesSearchHelp.open();
								}
							} else {
								this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
								if (this._oConditionSH) {
									this._oConditionSH.open();
								}
							}
						}.bind(this));
					}
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
			
			bindSHPurchGroupStd: function(oTable, oViewModel, oController) {
				var oColModel = new sap.ui.model.json.JSONModel();
				var oResourceBundle = oController.getResourceBundle();
				oTable.removeAllColumns();


				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PurchasingGroup"),
						tooltip: oResourceBundle.getText("PurchasingGroup")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchGroup'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchGroup'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Description"),
						tooltip: oResourceBundle.getText("Description")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Description'
						},
						wrapping: false,
						tooltip: {
							path: 'Description'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Telephone"),
						tooltip: oResourceBundle.getText("Telephone")
					}),
					template: new sap.m.Text({
						text: {
							path: 'TelNoPurchGp'
						},
						wrapping: false,
						tooltip: {
							path: 'TelNoPurchGp'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("FaxNumber"),
						tooltip: oResourceBundle.getText("FaxNumber")
					}),
					template: new sap.m.Text({
						text: {
							path: 'FaxNumber'
						},
						wrapping: false,
						tooltip: {
							path: 'FaxNumber'
						}
					})
				}));

				var self = oController;
				var oModel = self.getModel();
				var sPath = "/ShPurchGroupStdSet";
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
			
			bindSHFixedValues: function(oTable, oViewModel, oController) {
				var oColModel = new sap.ui.model.json.JSONModel();
				var oResourceBundle = oController.getResourceBundle();
				oTable.removeAllColumns();
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("PurchDocCategory"),
						tooltip: oResourceBundle.getText("PurchDocCategory")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Code'
						},
						wrapping: false,
						tooltip: {
							path: 'Code'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Description"),
						tooltip: oResourceBundle.getText("Description")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Description'
						},
						wrapping: false,
						tooltip: {
							path: 'Description'
						}
					})
				}));

				
				var sPopField = "Purch Doc Category";
				
				var oFilter = new Filter("PopField", FilterOperator.EQ, sPopField);

				var self = oController;
				var oModel = self.getModel();
				var sPath = "/SHFixedValuesSet";
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
			
			/*Search help for Item*/
			/** Initialising a value help dialog with single select and select from table only configuration **/
			initItemSearch: function(oInput, sTitle, sKey, sDescKey, oController) {
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
							var sOperator1 = sap.ui.model.FilterOperator.Contains;
							var sOperator2 = sap.ui.model.FilterOperator.EQ;
							var aFilters = [];

							aInputs.forEach(function(oInput) {
								if(oInput.getType() === "Number") {
									if(oInput && oInput.getValue() !== "") {
										var iNum = parseFloat(oInput.getValue());
										if(iNum && iNum !== NaN){
											aFilters.push(new Filter(oInput.getName(), sOperator2, iNum));
										}
									}								
								}else {
									if (oInput && oInput.getValue() !== "") {
										aFilters.push(new Filter(oInput.getName(), sOperator1, oInput.getValue()));
									}								
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

				oValueHelpDialog.setRangeKeyFields([{
					label: oResourceBundle.getText("purchasingDoc"),
					key: "PurchaseDoc"
				}, {
					label: oResourceBundle.getText("item"),
					key: "Item"
				}, {
					label: oResourceBundle.getText("ShortText"),
					key: "Desc"
				}, {
					label: oResourceBundle.getText("Price"),
					key: "Price"
				}, {
					label: oResourceBundle.getText("quantity"),
					key: "Qty"
				}]);

				oValueHelpDialog.setFilterBar(oFilterBar);
				this.setFGrpItem(oValueHelpDialog, oController);
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			setFGrpItem: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHItem
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Item",
						groupName: "gp1",
						name: "PurchaseDoc",
						label: oResourceBundle.getText("purchasingDoc"),
						control: new sap.m.Input({
							name: "PurchaseDoc"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Item",
						groupName: "gp1",
						name: "Item",
						label: oResourceBundle.getText("item"),
						control: new sap.m.Input({
							name: "Item"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Item",
						groupName: "gp1",
						name: "Desc",
						label: oResourceBundle.getText("ShortText"),
						control: new sap.m.Input({
							name: "Desc"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Item",
						groupName: "gp1",
						name: "Price",
						label: oResourceBundle.getText("Price"),
						control: new sap.m.Input({
							name: "Price",
							type: "Number"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Item",
						groupName: "gp1",
						name: "Qty",
						label: oResourceBundle.getText("quantity"),
						control: new sap.m.Input({
							name: "Qty",
							type: "Number"
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

			bindItemSet: function(oTable, sPurchaseDoc, oViewModel, oController) {

				var oResourceBundle = oController.getResourceBundle();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("purchasingDoc"),
						tooltip: oResourceBundle.getText("purchasingDoc")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchaseDoc'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchaseDoc'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("item"),
						tooltip: oResourceBundle.getText("item")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Item'
						},
						wrapping: false,
						tooltip: {
							path: 'Item'
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
						text: oResourceBundle.getText("Price"),
						tooltip: oResourceBundle.getText("Price")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Price'
						},
						wrapping: false,
						tooltip: {
							path: 'Price'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("quantity"),
						tooltip: oResourceBundle.getText("quantity")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Qty'
						},
						wrapping: false,
						tooltip: {
							path: 'Qty'
						}
					})
				}));

				var self = oController;
				var oModel = self.getModel();
				var oFilter = new Filter("PurchaseDoc", FilterOperator.EQ, sPurchaseDoc);
				var sPath = "/SHItemSet";
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

			}
	};
	
	return PurchaseOrdSH;
	
});
