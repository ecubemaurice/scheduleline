sap.ui.define([ "sap/ui/model/json/JSONModel", 
				"sap/ui/Device", 
				"sap/ui/model/odata/v2/ODataModel" ], 
function(JSONModel, Device, ODataModel) {
    "use strict";
    
    function extendMetadataUrlParameters(aUrlParametersToAdd, oMetadataUrlParams, sServiceUrl) {
    	var oExtensionObject = {}, oServiceUri = new URI(sServiceUrl);

    	aUrlParametersToAdd.forEach(function(sUrlParam) {
    	    var sLanguage, oUrlParameters, sParameterValue;

    	    if (sUrlParam === "sap-language") {
    	    	//oMetadataUrlParams["sap-language"] = "FR";
    	    } else {
    	    	oUrlParameters = jQuery.sap.getUriParameters();
    	    	sParameterValue = oUrlParameters.get(sUrlParam);
    	    	if (sParameterValue) {
    	    		oMetadataUrlParams[sUrlParam] = sParameterValue;
    	    		oServiceUri.addSearch(sUrlParam, sParameterValue);
    	    	} else {
    	    		if (sUrlParam === "sap-ui-language") {
    	    			//oMetadataUrlParams[sUrlParam] = "FR";
    	    			//oServiceUri.addSearch(sUrlParam, "FR");
    	    		} else if (sUrlParam === "sap-client") {
    	    			//oMetadataUrlParams[sUrlParam] = "001";
    	    			//oServiceUri.addSearch(sUrlParam, "001");
    	    		} else if (sUrlParam === "sap-ui-appcache") {
    	    			//oMetadataUrlParams[sUrlParam] = "false";
    	    			//oServiceUri.addSearch(sUrlParam, "false");
    	    		}
    	    	}
    	    }
    	});
    	jQuery.extend(oMetadataUrlParams, oExtensionObject);
    	return oServiceUri.toString();
  	}

    return {
		/**
		 * 
		 * @param {object}
		 *                oOptions a map which contains the following parameter
		 *                properties
		 * @param {string}
		 *                oOptions.url see
		 *                {@link sap.ui.model.odata.v2.ODataModel#constructor.sServiceUrl}.
		 * @param {object}
		 *                [oOptions.urlParametersForEveryRequest] If the
		 *                parameter is present in the URL or in case of language
		 *                the UShell can provide it, it is added to the odata
		 *                models metadataUrlParams
		 *                {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters.metadataUrlParams},
		 *                and to the service url. If you provided a value in the
		 *                config.metadataUrlParams this value will be
		 *                overwritten by the value in the url.
		 * 
		 * Example: the app is started with the url query, and the user has an
		 * us language set in the launchpad:
		 * 
		 * ?sap-server=serverValue&sap-host=hostValue
		 * 
		 * The createODataModel looks like this.
		 * 
		 * models.createODataModel({ urlParametersToPassOn: [ "sap-server",
		 * "sap-language", "anotherValue" ], url : "my/Url" });
		 * 
		 * then the config will have the following metadataUrlParams:
		 * 
		 * metadataUrlParams: { // retrieved from the url "sap-server" :
		 * "serverValue" // language is added from the launchpad "sap-language" :
		 * "us" // anotherValue is not present in the url and will not be added }
		 * 
		 * @param {object}
		 *                [oOptions.config] see
		 *                {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters}
		 *                it is the exact same object, the metadataUrlParams are
		 *                enriched by the oOptions.urlParametersToPassOn
		 * @returns {sap.ui.model.odata.v2.ODataModel}
		 */
		createODataModel : function(oOptions) {
		    var aUrlParametersForEveryRequest, oConfig, sUrl;
	
		    oOptions = oOptions || {};
	
		    if (!oOptions.url) {
		    	jQuery.sap.log.error("Please provide a service url to create an ODataModel");
		    	return null;
		    }
	
		    // create a copied instance since we modify the config
		    oConfig = jQuery.extend(true, {}, oOptions.config);
	
		    aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest || [];
		    oConfig.metadataUrlParams = oConfig.metadataUrlParams || {};
		    oConfig.defaultBindingMode = sap.ui.model.BindingMode.TwoWay;
		    sUrl = extendMetadataUrlParameters(aUrlParametersForEveryRequest, oConfig.metadataUrlParams, oOptions.url);
	
		    return this._createODataModel(sUrl, oConfig);
		},
	
		_createODataModel : function(sUrl, oConfig) {
		    var oModel = new ODataModel(sUrl, oConfig);
		    oModel.setSizeLimit(1000);
		    return oModel;
		},
	
		createDeviceModel : function() {
		    var oModel = new JSONModel(Device);
		    oModel.setDefaultBindingMode("OneWay");
		    return oModel;
		},
	
		createJSONModel : function(oData, sBindingMode) {
		    var oModel = new JSONModel(oData);
		    oModel.setSizeLimit(1000);
		    oModel.setDefaultBindingMode(sBindingMode);
		    return oModel;
		}
		
		
    };

});