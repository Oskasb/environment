"use strict";

define([
	'environment/Sky'

],function(
	Sky
	) {
	var waterColorTexturePath = window.resourcePath+'water';

	var EnvironmentAPI = function() {

	};


	EnvironmentAPI.prototype.setEnvironmentTimeOfDay = function(timeOfDay) {
		this.sky.setTimeOfDay(timeOfDay)
	};

	EnvironmentAPI.prototype.setEnvironmentTimeScale = function(timeScale) {
		this.sky.setTimeScale(timeScale)
	};

	EnvironmentAPI.prototype.setupEnvironment = function(goo) {
		this.sky = new Sky(goo);
		this.sky.attachWaterSystem(goo, waterColorTexturePath);
	};

	EnvironmentAPI.prototype.applyEnvironmentData = function(envData) {

		console.log("Applying env data: ", envData);
		this.sky.setEnvData(envData);
	};

	EnvironmentAPI.prototype.updateCameraFrame = function(tpf, cameraEntity) {
		this.sky.updateCameraFrame(tpf, cameraEntity);
	};

	return EnvironmentAPI;

});