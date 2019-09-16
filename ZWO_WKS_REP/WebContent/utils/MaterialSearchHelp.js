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
	"zwo/ui/wks_rep/utils/SearchHelps"
], function(formatter, models, MessageToast, JSONModel, ValueHelpDialog, FilterBar, Filter, FilterOperator, SearchHelps){
	"use strict";
	
	var MatSearchHelp = {
			
			/** Match code for Material No   **/
			initSearchMaterialSpec: function(sVendorNo, sScreen, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var sProjectNum = "";
				var oInScreenModel = oController.getModel("InScreenFilters");
				if(oInScreenModel)
					sProjectNum = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
				//var sVendorNo = (oInputFields.oInputSupNo && oInputFields.oInputSupNo.getValue()) ? oInputFields.oInputSupNo.getValue() : "";
				var oMatSetParam = {
					ProjectNo : sProjectNum,
					SearchTab : "",
					Screen : sScreen,
					VendorNo : sVendorNo,
					MaterialGroup : "",
					MaterialNo : "",
					Description : "",
					VendorMatNo : ""
				};
				
				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText(sScreen),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "MaterialNo",
					descriptionKey: "MaterialNo",
					stretch: sap.ui.Device.system.phone,
					busy: "{VHDialogView>/busy}",
					busyIndicatorDelay: "{VHDialogView>/BusyDelay}",

					ok: function(oControlEvent) { // Event handler ok
						var aTokens = oControlEvent.getParameter("tokens");
						var oDialog;
						// Obtaining model of Add or Edit current dialog window
						if(this._oMasterAddDialog)
							oDialog = this._oMasterAddDialog;
						if(this._oTempEditDialog)
							oDialog = this._oTempEditDialog;
						if(this._oRentalEditDialog)
							oDialog = this._oRentalEditDialog;
						if(this._oSubConEditDialog)
							oDialog = this._oSubConEditDialog;
						if(this._oMaterialEditDialog)
							oDialog = this._oMaterialEditDialog;
						if(this._oInternalEditDialog)
							oDialog = this._oInternalEditDialog;
						
						var oInputModel = oDialog.getModel("Input");
						var oInput = oInputModel.getData();
						
						// Getting selected token
						if (aTokens[0]) { // There's only one because table is single select
							var oTokenData = aTokens[0].getAggregation("customData")[0].getValue();	
							oInputModel.setProperty("/MaterialNo", aTokens[0].getKey());
							
							if(oInput.hasOwnProperty("MaterialDesc"))
								oInputModel.setProperty("/MaterialDesc", oTokenData.Description);
							
							if(oInput.hasOwnProperty("SupplierNo") && oTokenData.VendorNo !== "")
								oInputModel.setProperty("/SupplierNo", oTokenData.VendorNo);
							
							if(oInput.hasOwnProperty("SupplierName") && oTokenData.Vendor !== "" )
								oInputModel.setProperty("/SupplierName", oTokenData.Vendor);
						
							if(oInput.hasOwnProperty("Price"))
								oInputModel.setProperty("/Price", oTokenData.Price.trim());
							
							if(oInput.hasOwnProperty("VendorMatNo"))
								oInputModel.setProperty("/VendorMatNo", oTokenData.VendorMatNo);
							
							if(oInput.hasOwnProperty("Currency"))
								oInputModel.setProperty("/Currency", oTokenData.Currency);
							
							/*if(oInput.hasOwnProperty("Unit"))
								oInputModel.setProperty("/Unit", oTokenData.Unit);*/
							
							// Filling in Agreement & AgreementItem OR PurchaseDoc & PurchaseDocItem 
							// input fields depending on search tab						
							if(oInput.hasOwnProperty("Agreement") && oTokenData.SearchTab === "SB") {
								oInputModel.setProperty("/Agreement", oTokenData.PurchaseDoc);
								if(oInput.hasOwnProperty("PurchaseDoc"))
									oInputModel.setProperty("/PurchaseDoc", "");
							}
													
							if(oInput.hasOwnProperty("AgreementItem") && oTokenData.SearchTab === "SB") {
								oInputModel.setProperty("/AgreementItem", oTokenData.PurchaseDocItem);
								if(oInput.hasOwnProperty("Item"))
									oInputModel.setProperty("/Item", "");
							}
							
							if(oInput.hasOwnProperty("PurchaseDoc") && oTokenData.SearchTab === "PO") {
								oInputModel.setProperty("/PurchaseDoc", oTokenData.PurchaseDoc);
								if(oInput.hasOwnProperty("Agreement"))
									oInputModel.setProperty("/Agreement", "");
							}
															
							if(oInput.hasOwnProperty("Item") && oTokenData.SearchTab === "PO") {
								oInputModel.setProperty("/Item", oTokenData.PurchaseDocItem);
								if(oInput.hasOwnProperty("AgreementItem"))
									oInputModel.setProperty("/AgreementItem", "");
							}
							
							var oInputMatDesc = this.byId("idMaterialDesc");
							if(oInputMatDesc) {
								if(oTokenData.SearchTab === "PO") {								
									oInputMatDesc.setEditable(false);
								}else {
									oInputMatDesc.setEditable(true);
								}
							}
							
						}						
						oValueHelpDialog.close();
					}.bind(oController),

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
							var aControls = arguments[0].mParameters.selectionSet;
							var sOperator1 = sap.ui.model.FilterOperator.Contains;
							var sOperator2 = sap.ui.model.FilterOperator.EQ;
							var aFilters = [];
							// Obtaining filters to fetch data for MaterialSet table						
							aFilters.push(new Filter("ProjectNo", FilterOperator.EQ, oMatSetParam.ProjectNo));
							aFilters.push(new Filter("SearchTab", FilterOperator.EQ, oMatSetParam.SearchTab));
							aFilters.push(new Filter("Screen", FilterOperator.EQ, oMatSetParam.Screen));
							
							// Filters from input fields						
							aControls.forEach(function(oControl) {
								// Getting value if control is an input field
								if (oControl && oControl.getId().indexOf("input") > 0) {
									if(oControl.getName() === "MaterialNo") {
										if(oControl.getValue() !== "") {
											aFilters.push(new Filter(oControl.getName(), sOperator2, oControl.getValue()));
										}										
									}else {									
										// Filters for text input or for token inputs
										if (oControl && oControl.getValue() !== "") {
											aFilters.push(new Filter(oControl.getName(), sOperator1, oControl.getValue()));
										}else if(oControl && oControl.getTokens().length !== 0) {
											var aTokens = oControl.getTokens();
											aTokens.forEach(function(oToken){
												var oTokenData = oToken.data().range;
												if(oTokenData.exclude) {
													aFilters.push(new Filter(oControl.getName(), "NE", oTokenData.value1));
												}else {
													if(oTokenData.operation === "BT") {
														aFilters.push(new Filter(oControl.getName(), oTokenData.operation, oTokenData.value1, oTokenData.value2));
													}else {
														aFilters.push(new Filter(oControl.getName(), oTokenData.operation, oTokenData.value1));
													}
												}
											});
										}
									}								
								}
								
								if (oControl && (oControl.getId().indexOf("box") > 0) && oControl.getSelectedItem()) {
									// In entity SHMatFilterOptSet property is Vendor
									// In entity SHMaterialSet same property is VendorNo
									if(oControl.getName() === "Vendor") {
										aFilters.push(new Filter("VendorNo", sOperator2, oControl.getSelectedKey()));
									}else {
										aFilters.push(new Filter(oControl.getName(), sOperator2, oControl.getSelectedKey()));
									}
									
								}
							});
						
							// False will apply an OR logic, if you want AND pass true
							var oFilter = (aFilters.length !== 0) ? new Filter(aFilters, true) : [];	
							
							var oViewModel = oValueHelpDialog.getModel("VHDialogView");						
							var oTable = oValueHelpDialog.getTable();
							this.getMaterialSet(oTable, oViewModel, oFilter, oController);
						}
					}.bind(this)
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Adding Selection Search Template
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
							if (oAnnotation === oResourceBundle.getText("SB")) {
								// Setting filter group items for Search By template
								oMatSetParam.SearchTab = "SB";							
								this.setFGrpMaterialSB(oValueHelpDialog, oMatSetParam, oController);
								this.bindMaterialSB(oTable, oViewModel, oMatSetParam, oController);							
							} else if (oAnnotation === oResourceBundle.getText("PO")) {
								// Setting filter group otems for Purchase Orders template
								oMatSetParam.SearchTab = "PO";
								this.setFGrpMaterialPO(oValueHelpDialog, oMatSetParam, oController);							
								this.bindMaterialPO(oTable, oViewModel, oMatSetParam, oController);
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
						sTitle = oResourceBundle.getText("SB");
					if (i === 1)
						sTitle = oResourceBundle.getText("PO");

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
				this.setFGrpMaterialSB(oValueHelpDialog, oMatSetParam, oController);
				oMatSetParam.SearchTab = "SB";
				this.bindMaterialSB(oTable, oViewModel, oMatSetParam, oController);
				
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
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},
			
			setFGrpMaterialSB: function(oValueHelpDialog, oMatSetParam, oController) {
				var self = oController;
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oInScreenModel = oController.getModel("InScreenFilters");
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				if(oInScreenModel) {
					var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
					var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
									
					var oItemTemplate = new sap.ui.core.ListItem({key:"{Key}", text:"{Key} {Text}"});
					var sPath = "/SHMatFilterOptSet";
									
					// Creating a filter group for each search field for search template SB
					var aFilterGroups = [];				
					aFilterGroups = [
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp1",
							name: "Vendor",
							label: oResourceBundle.getText("vendor"),
							control: new sap.m.ComboBox({
								name: "Vendor"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp1", 
							name: "MaterialGroup",
							label: oResourceBundle.getText("MatGroup"),
							control: new sap.m.ComboBox({
								name: "MaterialGroup"
							})
						}),	
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp2", 
							name: "MaterialNo",
							label: oResourceBundle.getText("materialNo"),
							control: new sap.m.Input({
								name: "MaterialNo",
								valueHelpRequest: self.onRequestMaterialStd.bind(self),
								showValueHelp: true							
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp2", 
							name: "Description",
							label: oResourceBundle.getText("materialDesc"),
							control: new sap.m.MultiInput({
								name: "Description"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp2", 
							name: "VendorMatNo",
							label: oResourceBundle.getText("vendorMatNo"),
							control: new sap.m.MultiInput({
								name: "VendorMatNo"
							})
						})
					];
					
					// Filter parameters for requests to fetch data for drop-down lists
					var oParam = {
							ProjectNo : sProjectNo,
							Screen : oMatSetParam.Screen,
							SearchTab : "SB",
							PopField : "Vendor",
							VendorNo : oMatSetParam.VendorNo
					};
					
					var oVendorCbBox = this.getFGrpItemControl("Vendor", aFilterGroups);
					var oMatGroupCbBox = this.getFGrpItemControl("MaterialGroup", aFilterGroups, oController);
					
					var aVendors = [];
					var aMatGroups = [];
					// Binding vendor drop-down list for rental screen and for SearchBy tab
					var oDfrdVendor = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oVendorCbBox, oItemTemplate, aVendors, oController);								
					
					oDfrdVendor.then(
						// Success handler
						function() {
							// Setting default selected item on Vendor drop down list
							if(aVendors.length > 0) {
								var sSelectedKey = "";
								if(oParam.VendorNo !== "") {
									sSelectedKey = oParam.VendorNo; 
								}else {
									sSelectedKey = aVendors[0].Key;
									oParam.VendorNo = sSelectedKey;
								}
								oVendorCbBox.setSelectedKey(sSelectedKey);
							}
													
							// Binding material group drop-down list for rental screen and for SearchBy tab
							oParam.PopField = "Material Group";
							//this.bindMatGroupList(oParam, oMatGroupCbBox, oItemTemplate);
							zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMatGroupCbBox, oItemTemplate, aMatGroups, oController);
						}.bind(self));
							
					var fOnSelectVendor = jQuery.proxy(function(oEvent) {
						var oVendorControl = oEvent.getSource();												
						if(oVendorControl.getSelectedItem()) {
							oParam.VendorNo = oVendorControl.getSelectedKey();
							oParam.PopField = "Material Group";
							aMatGroups = [];
							var oDfrdMatGrp = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMatGroupCbBox, oItemTemplate, aMatGroups, oController);
							oDfrdMatGrp.then(
								// Success handler
								function() {
									oValueHelpDialog.getFilterBar().search();
								});
						}					
					}, self);
					
					var fOnSelectMatGrp = jQuery.proxy(function(oEvent) {
						oValueHelpDialog.getFilterBar().search();					
					}, self);
							
					// Accessing each input control and applying methods addStyleClass and submit
					aFilterGroups.forEach(function(oItem) {
						var oControl = oItem.getControl();
						if(oControl.getName() === "Vendor") {
							// Adding selectionChange event to each ComboBox control
							oControl.attachSelectionChange(fOnSelectVendor);
						}
											
						if(oControl.getName() === "MaterialGroup") {
							// Adding selectionChange event to each ComboBox control
							oControl.attachSelectionChange(fOnSelectMatGrp);
						}
						
						// Adding submit event and CSS class to each input control
						if(oControl.getId().indexOf("input") > 0){
							
							oControl.attachSubmit(function() {
								oValueHelpDialog.getFilterBar().search();
							});
							
							if(oControl.getName() === "Description" || oControl.getName() === "VendorMatNo") {
								
								oControl.attachValueHelpRequest(function(oEvent) {
									var oInput = oEvent.getSource();
									var sLabel = oInput.getParent().getLabel().mProperties.text;
									oController._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oInput.getName(), sLabel, oController);
									if (oController._oConditionSH) {
										oController._oConditionSH.open();
									}
								}.bind(oController));
							}
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
					
				}
				
			},
			
			getFGrpItemControl: function(sNamePopField, aFilterGroups) {
				var oItemControl;
				// if aFilterGroup[i].getControl() is directly accessed, it returns null. 
				// To access combo box control, foreach loop is used on aFilterGroups
				aFilterGroups.forEach(function(oItem){
					var oControl = oItem.getControl();
					if(oControl.getName() === sNamePopField) {
						oItemControl = oControl;
					}
				});
				return oItemControl;
			},
					
			getMatFilterList: function(oParam, aResults, oController) {
				var self = oController;
				var oModel = self.getModel();
				var oDeferred = $.Deferred();
				var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
				var sPath = "/SHMatFilterOptSet";
				var aFilters = [];
				
				if(oParam.SearchTab === "SB") {
					aFilters = [
						new sap.ui.model.Filter("ProjectNo", oOperatorEQ, oParam.ProjectNo),
						new sap.ui.model.Filter("Screen", oOperatorEQ, oParam.Screen),
						new sap.ui.model.Filter("SearchTab", oOperatorEQ, oParam.SearchTab),
						new sap.ui.model.Filter("PopField", oOperatorEQ, oParam.PopField),
						new sap.ui.model.Filter("Vendor", oOperatorEQ, oParam.VendorNo)
					];
				}else if(oParam.SearchTab === "PO") {
					aFilters = [
						new sap.ui.model.Filter("ProjectNo", oOperatorEQ, oParam.ProjectNo),
						new sap.ui.model.Filter("Screen", oOperatorEQ, oParam.Screen),
						new sap.ui.model.Filter("SearchTab", oOperatorEQ, oParam.SearchTab),
						new sap.ui.model.Filter("PopField", oOperatorEQ, oParam.PopField),
						new sap.ui.model.Filter("Mu", oOperatorEQ, oParam.Mu),
						new sap.ui.model.Filter("Job", oOperatorEQ, oParam.Job),
						new sap.ui.model.Filter("Vendor", oOperatorEQ, oParam.VendorNo)
					];
				}
				
				var oFilterVendor = new sap.ui.model.Filter(aFilters, true);
				
				oModel.read(sPath, {
					filters: [oFilterVendor],
					success: function(oData) {	
						oData.results.forEach(function(oResult) {
							aResults.push(oResult);
						});
						oDeferred.resolve();
					},
					error: function(oError) {
						oDeferred.reject();
					}
				});
				
				return oDeferred.promise();
			},
			
			bindMaterialSB: function(oTable, oViewModel, oParam, oController) {
				var oResourceBundle = oController.getResourceBundle();
				
				oTable.removeAllColumns();
				oTable.unbindRows();
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("materialNo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'MaterialNo'
						},
						wrapping: false,
						tooltip: {
							path: 'MaterialNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "MaterialNo"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc")
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
						text: oResourceBundle.getText("vendorMatNo")
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
						text: oResourceBundle.getText("unit")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Unit'
						},
						wrapping: false,
						tooltip: {
							path: 'Unit'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Unit"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Price")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Price'
						},
						wrapping: false,
						tooltip: {
							path: 'Price'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Price"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("vendor")
					}),
					template: new sap.m.Text({
						text: {
							path: 'VendorNo'
						},
						wrapping: false,
						tooltip: {
							path: 'VendorNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "VendorNo"
				}));
				// Backend returns values for Agreement & AgreementItem in properties PurchaseDoc & PurchaseDocItem in entity SHMaterial
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("agreement")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchaseDoc'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchaseDoc'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchaseDoc"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("agreementItem")
					}),
					template: new sap.m.Text({
						text: {
							path: 'PurchaseDocItem'
						},
						wrapping: false,
						tooltip: {
							path: 'PurchaseDocItem'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "PurchaseDocItem"
				}));
				
			},
			
			setFGrpMaterialPO: function(oValueHelpDialog, oMatSetParam, oController) {
				var self = oController;
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				var oInScreenModel = oController.getModel("InScreenFilters");
				var oModel = oController.getModel();
				oValueHelpDialog.getFilterBar().setModel(oModel);
				
				if(oInScreenModel) {
					var sProjectNo = oInScreenModel.getProperty("/ProjectSet/ProjectNo");
					var oOperatorEQ = sap.ui.model.FilterOperator.EQ;
									
					var oItemTemplate = new sap.ui.core.ListItem({key:"{Key}", text:"{Key} {Text}"});
					var sPath = "/SHMatFilterOptSet";
									
					// Creating a filter group for each search field for search template SB
					var aFilterGroups = [];
									
					aFilterGroups = [
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp1",
							name: "Mu",
							label: oResourceBundle.getText("Mu"),
							control: new sap.m.ComboBox({
								name: "Mu"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp1", 
							name: "Job",
							label: oResourceBundle.getText("Job"),
							control: new sap.m.ComboBox({
								name: "Job"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp1",
							name: "VendorPO",
							label: oResourceBundle.getText("vendor"),
							control: new sap.m.ComboBox({
								name: "Vendor"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp1", 
							name: "MaterialGroupPO",
							label: oResourceBundle.getText("MatGroup"),
							control: new sap.m.ComboBox({
								name: "MaterialGroup"
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp2", 
							name: "MaterialNoPO",
							label: oResourceBundle.getText("materialNo"),
							control: new sap.m.Input({
								name: "MaterialNo",
								valueHelpRequest: oController.onRequestMaterialStd.bind(oController),
								showValueHelp: true							
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupName: "gp2", 
							name: "DescriptionPO",
							label: oResourceBundle.getText("desig"),
							control: new sap.m.MultiInput({
								name: "Description"
							})
						})
					];
					
					// Filter parameters for requests to fetch data for drop-down lists
					var oParam = {
							ProjectNo : sProjectNo,
							Screen : oMatSetParam.Screen,
							SearchTab : "PO",
							PopField : "Mu",
							Mu : "",
							Job : "",
							VendorNo : ""
					};
					
					// On initialising search tab, bind all drop down lists
					var oMuCbBox = this.getFGrpItemControl("Mu", aFilterGroups);
					var oJobCbBox = this.getFGrpItemControl("Job", aFilterGroups);
					var oVendorCbBox = this.getFGrpItemControl("Vendor", aFilterGroups);
					var oMatGrpCbBox = this.getFGrpItemControl("MaterialGroup", aFilterGroups);
					var aMu = [];
					var aJobs = [];
					var aVendors = [];
					var aMatGroups = [];
					
					// Binding mu drop-down list for specified screen and for specified SearchTab
					var oDfrdMu = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMuCbBox, oItemTemplate, aMu, oController);
					
					var oDfrdJob;
					oDfrdMu.then(
						// Success handler
						function(){
							// Setting default selected item on drop down list
							if(aMu.length > 0) {
								var sSelectedKey = aMu[0].Key;							
								oMuCbBox.setSelectedKey(sSelectedKey);
								oParam.Mu = sSelectedKey;
							}						
							oParam.PopField = "Job";
							// Binding mu drop-down list for specified screen and for specified SearchTab
							oDfrdJob = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oJobCbBox, oItemTemplate, aJobs, oController);
							
							var oDfrdVendor;
							oDfrdJob.then(
								// Success handler
								function() {
									// Setting default selected item on drop down list
									if(aJobs.length > 0) {
										var sSelectedKey = aJobs[0].Key;							
										oJobCbBox.setSelectedKey(sSelectedKey);
										oParam.Job = sSelectedKey;
									}						
									oParam.PopField = "Vendor";
									// Binding material group drop-down list for rental screen and for SearchBy tab
									oDfrdVendor = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oVendorCbBox, oItemTemplate, aVendors, oController);
									
									var oDfrdMatGroup;
									oDfrdVendor.then(
										// Success handler
										function() {
											if(aVendors.length > 0) {
												var sSelectedKey = aVendors[0].Key;	
												oParam.VendorNo = sSelectedKey;
											}						
											oParam.PopField = "Material Group";
											// Binding material group drop-down list for rental screen and for SearchBy tab
											oDfrdMatGroup = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMatGrpCbBox, oItemTemplate, aMatGroups, oController);
										}.bind(this));
									
								}.bind(this));
							
						}.bind(self));
					
					var fOnSelectMu = jQuery.proxy(function(oEvent) {
						var oMuCbBox = oEvent.getSource();												
						if(oMuCbBox.getSelectedItem()) {
							oParam.Mu = oMuCbBox.getSelectedKey();
							oParam.Job = "";
							oParam.VendorNo = "";
							oParam.PopField = "Job";
							aJobs = [];
							aVendors = [];
							aMatGroups = [];
							var oDfrdJob = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMuCbBox, oItemTemplate, aJobs, oController);
							
							oDfrdJob.then(
								// Success handler
								function() {
									// Setting default selected item on drop down list
									if(aJobs.length > 0) {
										var sSelectedKey = aJobs[0].Key;							
										oJobCbBox.setSelectedKey(sSelectedKey);
										oParam.Job = sSelectedKey;
									}						
									oParam.PopField = "Vendor";
									// Binding material group drop-down list for rental screen and for SearchBy tab
									var oDfrdVendor = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oVendorCbBox, oItemTemplate, aVendors, oController);
									
									oDfrdVendor.then(
										// Success handler
										function() {																
											if(aVendors.length > 0) {
												var sSelectedKey = aVendors[0].Key;	
												oParam.VendorNo = sSelectedKey;
											}
											oParam.PopField = "Material Group";
											// Binding material group drop-down list for rental screen and for SearchBy tab
											var oDfrdMatGroup = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMatGrpCbBox, oItemTemplate, aMatGroups, oController);
											oDfrdMatGroup.then(
												// Success handler
												function() {
													oValueHelpDialog.getFilterBar().search();
												});
										}.bind(this));
									
								}.bind(this));
						}
					}, self);
					
					var fOnSelectJob = jQuery.proxy(function(oEvent) {
						var oJobCbBox = oEvent.getSource();												
						if(oJobCbBox.getSelectedItem()) {
							oParam.Job = oJobCbBox.getSelectedKey();
							oParam.Mu = "";
							oParam.VendorNo = "";
							oParam.PopField = "Vendor";
							aVendors = [];
							aMatGroups = [];
						
							var oDfrdVendor = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oVendorCbBox, oItemTemplate, aVendors, oController);
							oDfrdVendor.then(
								// Success handler
								function() {																
									if(aVendors.length > 0) {
										var sSelectedKey = aVendors[0].Key;	
										oParam.VendorNo = sSelectedKey;
									}
									oParam.PopField = "Material Group";							
									var oDfrdMatGroup = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMatGrpCbBox, oItemTemplate, aMatGroups, oController);
									
									oDfrdMatGroup.then(
										// Success handler
										function() {
											oValueHelpDialog.getFilterBar().search();
										});
								}.bind(this));
						}
					}, self);
					
					var fOnSelectVendor = jQuery.proxy(function(oEvent) {
						var oVendorCbBox = oEvent.getSource();												
						if(oVendorCbBox.getSelectedItem()) {
							oParam.VendorNo = oVendorCbBox.getSelectedKey();
							oParam.Job = "";
							oParam.Mu = "";
							oParam.PopField = "Material Group";
							aMatGroups = [];
									
							var oDfrdMatGroup = zwo.ui.wks_rep.utils.SearchHelps.bindMatFilterList(oParam, oMatGrpCbBox, oItemTemplate, aMatGroups, oController);
							
							oDfrdMatGroup.then(
								// Success handler
								function() {
									oValueHelpDialog.getFilterBar().search();
								});							
						}
					}, self);
					
					var fOnSelectMatGrp = jQuery.proxy(function(oEvent) {
						oValueHelpDialog.getFilterBar().search();
					}, self);
							
					// Accessing each input control and applying methods addStyleClass and submit
					aFilterGroups.forEach(function(oItem) {
						var oControl = oItem.getControl();											
						if(oControl.getName() === "Mu") {
							// Adding selectionChange event to each ComboBox control
							oControl.attachSelectionChange(fOnSelectMu);
						}
											
						if(oControl.getName() === "Job") {
							// Adding selectionChange event to each ComboBox control
							oControl.attachSelectionChange(fOnSelectJob);
						}
						
						if(oControl.getName() === "Vendor") {
							// Adding selectionChange event to each ComboBox control
							oControl.attachSelectionChange(fOnSelectVendor);
						}
						
						if(oControl.getName() === "MaterialGroup") {
							// Adding selectionChange event to each ComboBox control
							oControl.attachSelectionChange(fOnSelectMatGrp);
						}
						
						// Adding submit event and CSS class to each input control
						if(oControl.getId().indexOf("input") > 0){
							
							oControl.attachSubmit(function() {
								oValueHelpDialog.getFilterBar().search();
							});
							
							if(oControl.getName() === "Description") {
								oControl.attachValueHelpRequest(function(oEvent) {
									var oInput = oEvent.getSource();
									var sLabel = oInput.getParent().getLabel().mProperties.text; 
									oController._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oControl.getName(), sLabel, oController);
									if (oController._oConditionSH) {
										oController._oConditionSH.open();
									}
								}.bind(oController));
							}
						}
						
						//oControl.addStyleClass("customVHMultiInput");
						
					}.bind(this));

					// Adding filter groups to the filter bar
					var oFilterBar = oValueHelpDialog.getFilterBar();
					oFilterBar.removeAllFilterGroupItems();
					oFilterBar.destroyFilterGroupItems();
					aFilterGroups.forEach(function(oItem) {
						oFilterBar.addFilterGroupItem(oItem);
					});					
					oValueHelpDialog.rerender();
				}
			},
			
			bindMaterialPO: function(oTable, oViewModel, oParam, oController) {
				var oResourceBundle = oController.getResourceBundle();
				
				oTable.removeAllColumns();
				oTable.unbindRows();
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("materialNo")
					}),
					template: new sap.m.Text({
						text: {
							path: 'MaterialNo'
						},
						wrapping: false,
						tooltip: {
							path: 'MaterialNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "MaterialNo"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("desc")
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
						text: oResourceBundle.getText("unit")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Unit'
						},
						wrapping: false,
						tooltip: {
							path: 'Unit'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Unit"
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Price")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Price'
						},
						wrapping: false,
						tooltip: {
							path: 'Price'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "Price"
				}));

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("vendor")
					}),
					template: new sap.m.Text({
						text: {
							path: 'VendorNo'
						},
						wrapping: false,
						tooltip: {
							path: 'VendorNo'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "VendorNo"
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("costCode")
					}),
					template: new sap.m.Text({
						text: {
							path: 'CostCode'
						},
						wrapping: false,
						tooltip: {
							path: 'CostCode'
						}
					}),
					showSortMenuEntry: true,
					sortProperty: "CostCode"
				}));

				
			},
			
			getMaterialSet: function(oTable, oViewModel, oFilter, oController) {
				var self = oController;
				var oModel = self.getModel();	
							
				oTable.setModel(oModel);
				var sPath = "/SHMaterialSet";
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
			
			initSearchMaterialStd: function(oInput, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();

				// Instantiating ValueHelpDialog control with initial settings for search and filter 
				var oValueHelpDialog = new ValueHelpDialog({
					basicSearchText: "",
					title: oResourceBundle.getText("Mat"),
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					key: "Material",
					descriptionKey: "Material",
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
							var oTable = oValueHelpDialog.getTable();
							var oBinding = oTable.getBinding("rows");
							oBinding.filter(oFilter);
						}

					}
				});

				oValueHelpDialog.setFilterBar(oFilterBar);

				// Setting Range Key Fields for range filters
				var fSetRangeKey = jQuery.proxy(function(oEvt) {
					// Setting new range key fields
					oValueHelpDialog.setRangeKeyFields([
		                {label: oResourceBundle.getText("materialDesc"), key: "Description"}, 
		                {label : oResourceBundle.getText("Lang"), key:"Language"},
		                {label: oResourceBundle.getText("Mat"), key: "Material"}, 
		                {label : oResourceBundle.getText("Plant"), key:"Plant"}
	            	]);				
				}, this);

				// Binding initial table selected from search template
				var oTable = oValueHelpDialog.getTable();
				var oViewModel = oValueHelpDialog.getModel("VHDialogView");
				this.bindMaterialStdW(oTable,oViewModel, oController);
				this.setFGrpMaterialStdW(oValueHelpDialog, oController);
				//fSetRangeKey();
				
				// Setting dialog window to compact size for PCs and tablets
				if(sap.ui.Device.system.desktop || sap.ui.Device.system.tablet) {
					oValueHelpDialog.addStyleClass("sapUiSizeCompact");
				}

				return oValueHelpDialog;
			},
			
			bindMaterialStdW: function(oTable, oViewModel, oController) {
				var oResourceBundle = oController.getResourceBundle();

				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("materialDesc")
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
						text: oResourceBundle.getText("Lang")
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
						text: oResourceBundle.getText("Mat")
					}),
					template: new sap.m.Text({
						text: {
							path: 'Material'
						},
						wrapping: false,
						tooltip: {
							path: 'Material'
						}
					})
				}));
				
				oTable.addColumn(new sap.ui.table.Column({
					label: new sap.m.Label({
						text: oResourceBundle.getText("Plant")
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

				var self = oController;
				var oModel = self.getModel();			
				oTable.setModel(oModel);
				var sPath = "/SHMaterialStdWSet";
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
			
			setFGrpMaterialStdW: function(oValueHelpDialog, oController) {
				// i18n resource bundle
				var oResourceBundle = oController.getResourceBundle();
				// Creating a filter group for each search field for table SHPersonnelStd9
				var aFilterGroups = [
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Description",
						label: oResourceBundle.getText("materialDesc"),
						control: new sap.m.MultiInput({
							name: "Description"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp1",
						name: "Language",
						label: oResourceBundle.getText("Lang"),
						control: new sap.m.MultiInput({
							name: "Language"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
						name: "Material",
						label: oResourceBundle.getText("Mat"),
						control: new sap.m.MultiInput({
							name: "Material"
						})
					}),
					new sap.ui.comp.filterbar.FilterGroupItem({
						groupName: "gp2",
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
					oControl.attachSubmit(function() {
						oValueHelpDialog.getFilterBar().search();
					});
					
					oControl.attachValueHelpRequest(function(oEvent) {
						var oInput = oEvent.getSource();
						
						oController._oConditionSH = zwo.ui.wks_rep.utils.SearchHelps.initSetConditions(oInput, oItem.getName(), oItem.getLabel(), oController);
						if (oController._oConditionSH) {
							oController._oConditionSH.open();
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
	};
	return MatSearchHelp;
});