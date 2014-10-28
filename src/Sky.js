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
			Lighting.setGoo(goo);
			Lighting.setupMainLight();
			this.environment = new DynamicEnvironment();
			this.skySphere = new DynamicSkysphere(goo);
			this.skySphere.makeSun();
			Clouds.createClouds([0, 1000, 0],[10000, 3000, 10000], 8);
		};

		Sky.prototype.attachWaterSystem = function(goo, resourcePath) {
			this.environment.addWater(goo, this.skySphere.skyEntity, resourcePath);
		};

		Sky.prototype.updateEnvironmentTime = function(tpf, camEntity) {
			var source = camEntity.transformComponent.worldTransform;
			this.environment.advanceTime(tpf*0.1);
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
			target.translation.setv(source.translation);
			target.update();

		};

		Sky.prototype.updateCameraFrame = function(tpf, camEntity) {
			this.updateEnvironmentTime(tpf, camEntity);
			this.repositionSkySphere(camEntity);
			Clouds.tickClouds();
		};

		return Sky;
	});
