"use strict";

define([
	'goo/renderer/Material',
	'goo/geometrypack/Surface',
	'goo/entities/EntityUtils',

	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/TextureCreator',
	'goo/addons/waterpack/FlatWaterRenderer'
],
	function(
		Material,
		Surface,
		EntityUtils,

		ShaderLib,
		TextureCreator,
		FlatWaterRenderer
		) {


		var Water = function(goo, skySphere, resourcePath) {
			this.folderUrl = resourcePath;
			var meshData = Surface.createTessellatedFlat(129000, 129000, 40, 40);

			var material = new Material('water_material', ShaderLib.simple);
			this.waterEntity = goo.world.createEntity(meshData, material);

			this.waterEntity.transformComponent.transform.setRotationXYZ(-Math.PI / 2, 0, 0);

			this.waterEntity.addToWorld();
			this.waterRenderer = this.loadWaterShader(goo, skySphere, material);

            this.waterRenderer.waterMaterial.shader.uniforms.doFog = true;
			this.baseFogNear = 50;
			this.baseFogFar = 20000;

		};

		Water.prototype.setWaterPosition = function(posVec3) {
			this.waterEntity.transformComponent.transform.translation.setDirect(posVec3.x, 0, posVec3.z);
			this.waterEntity.transformComponent.setUpdated();
		};

		Water.prototype.setBaseFogNearFat = function(near, far) {
			this.baseFogNear = near;
			this.baseFogFar = far;
		};

        Water.prototype.updateWaterEnvironment = function(sunColor, sunDir, fogColor, fogDistance) {
            this.waterRenderer.waterMaterial.shader.uniforms.sunColor[0] = sunColor[0];
            this.waterRenderer.waterMaterial.shader.uniforms.sunColor[1] = sunColor[1];
            this.waterRenderer.waterMaterial.shader.uniforms.sunColor[2] = sunColor[2];
            this.waterRenderer.waterMaterial.shader.uniforms.sunDirection[0] = sunDir[2];
            this.waterRenderer.waterMaterial.shader.uniforms.sunDirection[1] = sunDir[0];
            this.waterRenderer.waterMaterial.shader.uniforms.sunDirection[2] = sunDir[1];
            this.waterRenderer.waterMaterial.shader.uniforms.fogColor[0] = fogColor[0];
            this.waterRenderer.waterMaterial.shader.uniforms.fogColor[1] = fogColor[1];
            this.waterRenderer.waterMaterial.shader.uniforms.fogColor[2] = fogColor[2];
            this.waterRenderer.waterMaterial.shader.uniforms.fogStart = this.baseFogNear * fogDistance[0];
            this.waterRenderer.waterMaterial.shader.uniforms.fogScale = this.baseFogFar * fogDistance[1];


			this.setWaterPosition(this.waterRenderer.waterCamera.translation)

        };


        Water.prototype.loadWaterShader = function(goo, skySphere, material) {

			var waterRenderer = new FlatWaterRenderer({normalsUrl:this.folderUrl+'/waternormals3.png', useRefraction:false});

			goo.renderSystem.preRenderers.push(waterRenderer);

			waterRenderer.setWaterEntity(this.waterEntity);
			waterRenderer.setSkyBox(skySphere);

			waterRenderer.waterMaterial.shader.uniforms.fogColor = [0.5, 0.7, 1];
			waterRenderer.waterMaterial.shader.uniforms.sunDirection = [-0.5,-0.1, 0.23];
			waterRenderer.waterMaterial.shader.uniforms.sunColor = [1, 0.7, 0.2];
			waterRenderer.waterMaterial.shader.uniforms.waterColor = [0.01, 0.01, 0.02];
			waterRenderer.waterMaterial.shader.uniforms.sunShininess = 50;
			waterRenderer.waterMaterial.shader.uniforms.sunSpecPower = 0.7;
			waterRenderer.waterMaterial.shader.uniforms.fogStart = 10000;
			waterRenderer.waterMaterial.shader.uniforms.waterScale = 1;
			waterRenderer.waterMaterial.shader.uniforms.distortionMultiplier = 0.34;
			waterRenderer.waterMaterial.shader.uniforms.fogScale = 50000;
			waterRenderer.waterMaterial.shader.uniforms.fresnelPow = 4.95;
			waterRenderer.waterMaterial.shader.uniforms.normalMultiplier = 0.75;
			waterRenderer.waterMaterial.shader.uniforms.fresnelMultiplier = 1.03;
			waterRenderer.waterMaterial.shader.uniforms.timeMultiplier = 0.3;

			return waterRenderer;
		};


		return Water;
	});
