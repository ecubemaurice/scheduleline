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
sap.ui.define(
    ["sap/ui/core/UIComponent", "sap/ui/Device", "zwo/ui/wks_rep/model/models",
        "zwo/ui/wks_rep/controller/ErrorHandler", "sap/m/MessageToast",
        "zwo/ui/wks_rep/model/formatter"],
    function(UIComponent, Device, models, ErrorHandler, MessageToast, formatter) {
	    "use strict";
	    return UIComponent.extend("zwo.ui.wks_rep.Component", {
	      metadata : {
		      manifest : "json",
	      },
	      init : function() {
		      var self = this;
		      var oLanguage = new sap.ui.model.resource.ResourceModel({
		        bundleUrl : "i18n/i18n.properties",
		        bundleLocale : sap.ui.getCore().getConfiguration().getLanguage()
		      });
		      this.getModel(oLanguage, "i18n");
		      // Creating and setting the
		      // ODataModel
		      var oModel = models.createODataModel({
		        urlParametersForEveryRequest : [""],
		        url : this._getServiceUrl(this.getMetadata().getConfig().serviceUrl),
		        config : {
		          useBatch : false,
		          disableHeadRequestForToken : true,
		          defaultCountMode : true
		        }
		      });
		      // Creating promise for
		      // MetadataLoaded event
		      this._createMetadataPromise(oModel);
		      this.oWhenMetadataIsLoaded.then(
		      // Success handler
		      function() {
			      // Setting the
			      // oDataModel as
			      // component's
			      // default model
			      self.setModel(oModel);
			      self._oErrorHandler = new ErrorHandler(self);
			      // Requesting
			      // for User info
			      self.oUserReady = self._getUser();
		      },
		      // Error handler
		      function() {
			      oModel.destroy();
		      });
		      // Setting the device model
		      this.setModel(models.createDeviceModel(), "device");
		      // Creating and setting the project
		      // filters model
		      var oProjFilters = {
		        selProjects : [],
		        selForemen : [],
		        selDate : ""
		      };
		      this.setModel(models.createJSONModel(oProjFilters, "TwoWay"), "ProjectFilters");
		      // Creating and setting the Input
		      // Screen filters model
		      var oInScreenFilters = {
		        ProjectSet : {},
		        Foremen : [],
		        Reports : [],
		        Status : [],
		        Category : []
		      };
		      this.setModel(models.createJSONModel(oInScreenFilters, "TwoWay"), "InScreenFilters");
		      // Creating and setting a model to
		      // keep aggregated status of
		      // master/consolidated lines
		      var oStatus = {
		        Labor : 0,
		        Temp : 0,
		        Equip : 0,
		        Rent : 0,
		        Mat : 0,
		        SubCon : 0,
		        Intern : 0,
		        Qty : 0
		      };
		      this.setModel(models.createJSONModel(oStatus, "TwoWay"), "CategoryStatus");
		      // Creating and setting the Lock
		      // filters model saving the
		      // projectNo and day to
		      // lock project from project screen
		      // or preview screen
		      var oLockFilters = {
		        ProjectNo : "",
		        Day : "",
		        Timer : "",
		        UserId : ""
		      };
		      this.setModel(models.createJSONModel(oLockFilters, "TwoWay"), "LockFilters");
		      // Creating and setting the Unlock
		      // filters model saving the
		      // projectNo and day to
		      // unlock project from project
		      // screen or preview screen
		      var oUnlockFilters = {
		        ProjectNo : "",
		        Day : "",
		        Timer : "",
		        UserId : ""
		      };
		      this.setModel(models.createJSONModel(oUnlockFilters, "TwoWay"), "UnlockFilters");
		      // call the init function of the
		      // parent
		      UIComponent.prototype.init.apply(this, arguments);
		      // create the views based on the
		      // url/hash
		      this.getRouter().initialize();
	      },
	      /**
	      * The component is destroyed by UI5
	      * automatically. In this method, the
	      * ListSelector and ErrorHandler are
	      * destroyed.
	      * 
	      * @public
	      * @override
	      */
	      destroy : function() {
		      this._oErrorHandler.destroy();
		      // call the base component's destroy
		      // function
		      UIComponent.prototype.destroy.apply(this, arguments);
	      },
	      /**
	      * This method can be called to
	      * determine whether the
	      * sapUiSizeCompact or sapUiSizeCozy
	      * design mode class should be set,
	      * which influences the size appearance
	      * of some controls.
	      * 
	      * @public
	      * @return {string} css class, either
	      *         'sapUiSizeCompact' or
	      *         'sapUiSizeCozy' - or an empty
	      *         string if no css class should
	      *         be set
	      */
	      getContentDensityClass : function() {
		      if (this._sContentDensityClass === undefined) {
			      // check whether FLP has already
			      // set the content density
			      // class; do nothing in this
			      // case
			      if (jQuery(document.body).hasClass("sapUiSizeCozy")
			          || jQuery(document.body).hasClass("sapUiSizeCompact")) {
				      this._sContentDensityClass = "";
			      } else if (!Device.support.touch) { // apply
				      // "compact"
				      // mode
				      // if
				      // touch
				      // is
				      // not
				      // supported
				      this._sContentDensityClass = "sapUiSizeCompact";
			      } else {
				      // "cozy" in case of touch
				      // support; default for most
				      // sap.m controls, but
				      // needed for desktop-first
				      // controls like
				      // sap.ui.table.Table
				      this._sContentDensityClass = "sapUiSizeCozy";
			      }
		      }
		      return this._sContentDensityClass;
	      },
	      onWindowBeforeUnload : function() {
		      var self = this;
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
			        success : function() {
			        }
			      });
		      }
	      },
	      /**
	      * Internal methods
	      */
	      /**
	      * Creates a promise which is resolved
	      * when the metadata is loaded.
	      * 
	      * @param {sap.ui.core.Model}
	      *            oModel the app model
	      * @private
	      */
	      _createMetadataPromise : function(oModel) {
		      this.oWhenMetadataIsLoaded = new Promise(function(fnResolve, fnReject) {
			      oModel.attachEventOnce("metadataLoaded", fnResolve);
			      oModel.attachEventOnce("metadataFailed", fnReject);
		      });
	      },
	      _getServiceUrl : function(sServiceUrl) {
		      // Pour tests en local, prefixer de
		      // "proxy"
		      if (window.location.hostname === "localhost") {
			      return "proxy" + sServiceUrl;
			      // return sServiceUrl;
		      } else {
			      return sServiceUrl;
		      }
	      },
	      _getUser : function() {
		      var self = this;
		      var oDeferredUser = $.Deferred();
		      var oHandle = this.getModel().callFunction(
		          "/SetUser",
		          {
		            method : "GET",
		            urlParameters : {},
		            success : function(oData, reponse) {
			            if (oData.SetUser.DateFormat) {
				            oData.SetUser.DateFormat = oData.SetUser.DateFormat.replace(/J/g, "d").replace(
				                /A/g,
				                "y");
				            oData.SetUser.DateFormat = oData.SetUser.DateFormat.replace(/D/g, "d").replace(
				                /Y/g,
				                "y");
			            }
			            var oModel = models.createJSONModel(oData.SetUser, "OneWay");
			            self.setModel(oModel, "user");
			            oDeferredUser.resolve();
		            },
		            error : function(oError) {
			            MessageToast.show(oError.message);
			            oDeferredUser.reject();
		            }
		          });
		      return oDeferredUser.promise();
	      }
	    });
    });