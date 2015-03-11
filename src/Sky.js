"use strict";

define([
	'environment/Lighting',
	'environment/DynamicEnvironment',
	'environment/DynamicSkysphere',
	'environment/Clouds'
],
	function(
		Lighting,
		DynamicEnvironment,
		DynamicSkysphere,
		Clouds
		) {

		var Sky = function(goo) {
			this.timeScale = 1;
			this.lighting = new Lighting(goo);
			this.lighting.setupMainLight();
			this.environment = new DynamicEnvironment(this.lighting);
			this.skySphere = new DynamicSkysphere(goo);
			this.skySphere.makeSun();
			this.clouds = new Clouds();
			this.clouds.createClouds([0, 1500, 0],[10000, 800, 10000], 8);
		};

		Sky.prototype.setEnvData = function(envData) {
			if (envData.globals) {
				this.environment.setGlobals(envData.globals);
			}

			this.environment.setCycleData(envData.cycles);
		};

		Sky.prototype.attachWaterSystem = function(goo, resourcePath) {
			this.environment.addWater(goo, this.skySphere.skyEntity, resourcePath);
		};

		Sky.prototype.updateEnvironmentTime = function(tpf, camEntity) {
			var source = camEntity.transformComponent.worldTransform;
			this.environment.advanceTime(tpf * this.timeScale);
			var envState = this.environment.getEnvironmentState();
			this.skySphere.setColor(envState.fogColor, envState.ambientLight, envState.skyColor, source.translation.data[1]);
			this.skySphere.setSunColor(envState.sunLight);
			this.updateSun(camEntity, envState);
		};

		Sky.prototype.updateSun = function(camEntity, envState) {
			var source = camEntity.transformComponent.worldTransform;
			//	waterRenderer.waterMaterial.shader.uniforms.sunDirection = [dir[2], dir[0], dir[1]];
			//   var pos = cameraEntity.transformComponent.worldTransform.translation.data;
			this.skySphere.setSunXYZ(source.translation.data[0]-envState.sunDir[2]*10000, source.translation.data[1]-envState.sunDir[1]*10000, source.translation.data[2]-envState.sunDir[0]*10000);
			//	GooEffectController.setSunlightDirection(dir);
		};

		Sky.prototype.repositionSkySphere = function(camEntity) {
			var source = camEntity.transformComponent.worldTransform;
			var target = this.skySphere.skyEntity.transformComponent.worldTransform;
			target.translation.setVector(source.translation);
			target.update();

		};

		Sky.prototype.setTimeScale = function(timeScale) {
			this.timeScale = timeScale;
		};

		Sky.prototype.setTimeOfDay = function(timeOfDay) {
			this.environment.applyTimeOfDayUpdate(timeOfDay);
		};

		Sky.prototype.updateCameraFrame = function(tpf, camEntity) {
			this.updateEnvironmentTime(tpf, camEntity);
			this.repositionSkySphere(camEntity);
			this.clouds.tickClouds();
		};

		return Sky;
	});
