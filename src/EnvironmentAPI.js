"use strict";

define([
	'environment/Sky'

],function(
	Sky
	) {
	var waterColorTexturePath = window.resourcePath+'water';

	var EnvironmentAPI = function() {

	};

	EnvironmentAPI.prototype.setupEnvironment = function(goo) {
		this.sky = new Sky(goo);
		this.sky.attachWaterSystem(goo, waterColorTexturePath);
	};

	EnvironmentAPI.prototype.updateCameraFrame = function(tpf, cameraEntity) {
		this.sky.updateCameraFrame(tpf, cameraEntity);
	};

	return EnvironmentAPI;

});