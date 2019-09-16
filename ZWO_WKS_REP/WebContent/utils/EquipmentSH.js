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
	
	var EquipmentSH = {
			
			initSearchEquip: function(oInput, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText("equipmentNo"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "Equipment",
					descriptionKey: "Equipment",
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
							/*var oBinding = oTable.getBinding("rows");
							oBinding.filter(oFilter);*/
							this.getSHEquipmentStdCSet(oTable, oViewModel, oFilter, oController);
						}
					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Setting Range Key Fields
				var fSetRangeKey = jQuery.proxy(function(oEvt) {
					oValueHelpDialog.setRangeKeyFields([{
						label: oResourceBundle.getText("CostCenter"),
						key: "CostCenter"
					}, {
						label: oResourceBundle.getText("MaintPlant"),
						key: "MaintPlant"
					}, {
						label: oResourceBundle.getText("Equip"),
						key: "Equipment"
					}, {
						label: oResourceBundle.getText("desc"),
						key: "Description"
					}, {
						label: oResourceBundle.getText("Lang"),
						key: "Language"
					}]);
				}, this);

				// Binding initial table selected from search template
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				this.bindSHEquipmentStdCSet(oTable, oViewModel, oController);
				this.setFGrpEquipStdC(oValueHelpDialog, oController);
				fSetRangeKey();
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},

			bindSHEquipmentStdCSet: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();
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
						text: oResourceBundle.getText("MaintPlant"),
						tooltip: oResourceBundle.getText("MaintPlant")
					}),
					template: new sap.m.Text({
						text: {
							path: 'MaintPlant'
						},
						wrapping: false,
						tooltip: {
							path: 'MaintPlant'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "MaintPlant"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Equip"),
						tooltip: oResourceBundle.getText("Equip")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Equipment'
						},
						wrapping: false,
						tooltip: {
							path: 'Equipment'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Equipment"
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
						wrapping: false,
						tooltip: {
							path: 'Description'
						}
					})
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Lang"),
						tooltip: oResourceBundle.getText("Lang")
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
			},
			
			getSHEquipmentStdCSet: function(oTable, oViewModel, oFilter, oController) {
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
				var sPath = "/SHEquipmentStdCSet";
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

			setFGrpEquipStdC: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "CostCenter",
						label: oResourceBundle.getText("CostCenter"),
						control: new sap.m.MultiInput({
							name: "CostCenter"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Plant",
						label: oResourceBundle.getText("MaintPlant"),
						control: new sap.m.MultiInput({
							name: "MaintPlant"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Equipment",
						label: oResourceBundle.getText("Equip"),
						control: new sap.m.MultiInput({
							name: "Equipment"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Description",
						label: oResourceBundle.getText("desc"),
						control: new sap.m.MultiInput({
							name: "Description"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Language",
						label: oResourceBundle.getText("Lang"),
						control: new sap.m.MultiInput({
							name: "Language"
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
						
						if(oItem.getLabel() === oResourceBundle.getText("MaintPlant")){
							this._PlantStdSearchHelp = zwo.ui.wks_rep.utils.SearchHelps.initSearchWithFilter(oInput, oResourceBundle.getText("MaintPlant"), oItem.getName(), oItem.getLabel(), oController);
							if (this._PlantStdSearchHelp) {
								var oTable = this._PlantStdSearchHelp.getTable();
								var oViewModel = this._PlantStdSearchHelp.getModel("VHDialogView");
								this.bindSHPlantStd(oTable, oViewModel, oController);
								this._PlantStdSearchHelp.open();
							}
						} 
						else{
							this._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
							if (this._oConditionSH) {
								this._oConditionSH.open();
							}
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
			
			bindSHPlantStd: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();
				var sDateFormat = self.getModel("user").getProperty("/DateFormat");

				oTable.removeAllColumns();

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
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("SearchTerm2"),
						tooltip: oResourceBundle.getText("SearchTerm2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'SearchTerm2'
						},
						wrapping: false,
						tooltip: {
							path: 'SearchTerm2'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("SearchTerm1"),
						tooltip: oResourceBundle.getText("SearchTerm1")
					}),
					template: new sap.m.Text({
						text: {
							path: 'SearchTerm1'
						},
						wrapping: false,
						tooltip: {
							path: 'SearchTerm1'
						}
					})
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
						text: oResourceBundle.getText("Name2"),
						tooltip: oResourceBundle.getText("Name2")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Name2'
						},
						wrapping: false,
						tooltip: {
							path: 'Name2'
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

				var oModel = self.getModel();
				var sPath = "/SHPlantStdSet";
				oTable.setModel(oModel);
				oTable.bindRows({
					path: sPath
				});
			},
			
			setFGrpPlant: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Name",
						label: oResourceBundle.getText("CompanyName"),
						control: new sap.m.Input({
							name: "Name"
						})
					}),
					
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Plant",
						label: oResourceBundle.getText("Plant"),
						control: new sap.m.Input({
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
				});

				// Adding filter groups to the filter bar
				var oFilterBar = oValueHelpDialog.getFilterBar();
				oFilterBar.removeAllFilterGroupItems();
				aFilterGroups.forEach(function(oItem) {
					oFilterBar.addFilterGroupItem(oItem);
				});
			},
			
			/*Equipment Status Search Help*/
			bindEquipStatusSet: function(oTable, oViewModel, oController) {
				var self = oController;
				var oResourceBundle = oController.getResourceBundle();

				oTable.removeAllColumns();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("status"),
						tooltip: oResourceBundle.getText("status")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Status'
						},
						wrapping: false,
						tooltip: {
							path: 'Status'
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
							path: 'Description'
						},
						wrapping: false,
						tooltip: {
							path: 'Description'
						}
					})
				}));

				var oModel = self.getModel();
				var sPath = "/SHEquipmentStatusSet";
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
			}
	}
	
	return EquipmentSH;
	
});