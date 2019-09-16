sap.ui.define([
		"sap/ui/core/util/MockServer"
	], function (MockServer) {
		"use strict";
		var oMockServer,
			_sAppModulePath = "zwo/ui/wks_rep/",
			_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata";

		return {

			/**
			 * Initializes the mock server.
			 * You can configure the delay with the URL parameter "serverDelay".
			 * The local mock data in this folder is returned instead of the real data for testing.
			 * @public
			 */
			init : function () {
				var oUriParameters = jQuery.sap.getUriParameters(),
					sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
					sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
					sEntity = "ProductSet",
					sErrorParam = oUriParameters.get("errorType"),
					iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
					oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
					oMainDataSource = oManifest["sap.app"].dataSources.mainService,
					sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + oMainDataSource.settings.localUri.replace(".xml", ""), ".xml"),
					// ensure there is a trailing slash
					sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/";

				oMockServer = new MockServer({
					rootUri : sMockServerUrl
				});

				// configure mock server with a delay of 1s
				MockServer.config({
					autoRespond : true,
					autoRespondAfter : (oUriParameters.get("serverDelay") || 1000)
				});

				// load local mock data
				oMockServer.simulate(sMetadataUrl, {
					sMockdataBaseUrl : sJsonFilesUrl,
					bGenerateMissingMockData : true
				});
				
				var fnCustom = function(oEvent) {
					var oXhr = oEvent.getParameter("oXhr");
					if (oXhr && oXhr.url.indexOf("$filter") > -1) {
						oXhr.url = oXhr.url.substring(0, oXhr.url.indexOf("$filter"));
					}
				};
				oMockServer.attachBefore("GET", fnCustom, "ProjectSet");
				oMockServer.attachBefore("GET", fnCustom, "LaborSet");
				oMockServer.attachBefore("GET", fnCustom, "LaborDetSet");
				oMockServer.attachBefore("GET", fnCustom, "LaborBonusSet");
				oMockServer.attachBefore("GET", fnCustom, "ProjectForemanSet");
								
				var aReq = oMockServer.getRequests();
				aReq.push({
				        method: "GET",
				        path: new RegExp("SetUser(.*)"), 
				        response: function(oXhr) {
				        	jQuery.sap.log.error("Incoming request for SetUser");	
						    var oResponse = jQuery.sap.sjax({
						    	url : "../localService/mockdata/SetUser.json",
						    	async: false
						    });
						    oXhr.respondJSON(200, {}, oResponse.data);
						    return true;
				        }
				});
				aReq.push({
				        method: "GET",
				        path: new RegExp("GetMtcdProject(.*)"), 
				        response: function(oXhr) {
				        	jQuery.sap.log.error("Incoming request for SetUser");	
						    var oResponse = jQuery.sap.sjax({
						    	url : "../localService/mockdata/GetMtcdProject.json",
						    	async: false
						    });
						    oXhr.respondJSON(200, {}, oResponse.data);
						    return true;
				        }
				});
				aReq.push({
				        method: "GET",
				        path: new RegExp("GetMtcdForeman(.*)"), 
				        response: function(oXhr) {
				        	jQuery.sap.log.error("Incoming request for SetUser");	
						    var oResponse = jQuery.sap.sjax({
						    	url : "../localService/mockdata/GetMtcdForeman.json",
						    	async: false
						    });
						    oXhr.respondJSON(200, {}, oResponse.data);
						    return true;
				        }
				});
				oMockServer.setRequests(aReq);

				var aRequests = oMockServer.getRequests(),
					fnResponse = function (iErrCode, sMessage, aRequest) {
						aRequest.response = function(oXhr){
							oXhr.respond(iErrCode, {"Content-Type": "text/plain;charset=utf-8"}, sMessage);
						};
					};

				// handling the metadata error test
				if (oUriParameters.get("metadataError")) {
					aRequests.forEach( function ( aEntry ) {
						if (aEntry.path.toString().indexOf("$metadata") > -1) {
							fnResponse(500, "metadata Error", aEntry);
						}
					});
				}

				// Handling request errors
				if (sErrorParam) {
					aRequests.forEach( function ( aEntry ) {
						if (aEntry.path.toString().indexOf(sEntity) > -1) {
							fnResponse(iErrorCode, sErrorParam, aEntry);
						}
					});
				}
				oMockServer.start();

				jQuery.sap.log.info("Running the app with mock data");
			},

			/**
			 * @public returns the mockserver of the app, should be used in integration tests
			 * @returns {sap.ui.core.util.MockServer} the mockserver instance
			 */
			getMockServer : function () {
				return oMockServer;
			}
		};

	}
);

/*sap.ui.define([
	"sap/ui/core/util/MockServer"
], function (MockServer) {
	"use strict";
 
	return {
 
		init: function () {
			
			// create
			var oMockServer = new MockServer({
				rootUri: "/"
			});
			// simulate against the metadata and mock data
			oMockServer.simulate("../localService/metadata.xml", {
				sMockdataBaseUrl: "../localService/mockdata",
				bGenerateMissingMockData: true
			});
			// start
			oMockServer.start();
			jQuery.sap.log.info("Running the app with mock data");			
 
			// create
			var oMockServer = new MockServer({
				rootUri: "/proxy/sap/opu/odata/sap/ZPSGW00549_ZCPJD1_SRV/"
			});
			var oMockServer = new MockServer({
				rootUri: "/"
			});
 
			var oUriParameters = jQuery.sap.getUriParameters();
 
			// configure mock server with a delay
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: oUriParameters.get("serverDelay") || 1000
			});
 
			// simulate
			var sPath = jQuery.sap.getModulePath("zwo.ui.wks_rep.localService");
			//oMockServer.simulate(sPath + "/metadata.xml", sPath + "/mockdata");
			oMockServer.simulate("../localService/metadata.xml", {
				sMockdataBaseUrl: "../localService/mockdata",
				bGenerateMissingMockData: true
			});
 
			// start
			oMockServer.start();
			jQuery.sap.log.error("Running the app with mock data");
		}
	};
 
});*/