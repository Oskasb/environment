"use strict";



define([
	'goo/entities/EntityUtils',
	'goo/renderer/light/DirectionalLight',
	'goo/math/Vector3',
	'goo/entities/components/LightComponent',
	'goo/renderer/shaders/ShaderBuilder'

], function(
	EntityUtils,
	DirectionalLight,
	Vector3,
	LightComponent,
	ShaderBuilder
	) {


	var Lighting = function(goo) {

		this.goo = goo;
		this.tempVec = new Vector3();
		this.shadowReso = 128;
		this.shadowNear = 3.2;
		this.shadowSize = 25;
		this.shadowFar = 27;
		this.shadowType = "basic";
		this.baseFogNear = 50;
		this.baseFogFar = 20000;
		this.sunBoost = 1.5;
		this.ambientBoost = 0.7;
		this.lightEntity;
		this.dirLight;
		this.lightComp;

	};

	ShaderBuilder.USE_FOG = true;

	Lighting.prototype.setBaseFogNearFar = function(fogNear, fogFar) {
		this.baseFogNear = fogNear;
		this.baseFogFar = fogFar;
	};

	Lighting.prototype.setSunlightColor = function(color) {
		this.dirLight.color.setd(color[0]*(1+Math.random()*0.003)*this.sunBoost, color[1]*(1+Math.random()*0.002)*this.sunBoost, color[2]*(1+Math.random()*0.005)*this.sunBoost, 1.0);
	};

	Lighting.prototype.setAmbientColor = function(color) {
		ShaderBuilder.GLOBAL_AMBIENT = [color[0]*(1+Math.random()*0.003)*this.ambientBoost, color[1]*(1+Math.random()*0.002)*this.ambientBoost, color[2]*(1+Math.random()*0.005)*this.ambientBoost, 1.0];
	};

	Lighting.prototype.setFogColor = function(color) {
		ShaderBuilder.FOG_COLOR = color;
	};

	Lighting.prototype.scaleFogNearFar = function(near, far) {
		this.setFogNearFar(this.baseFogNear*near, this.baseFogFar*far);
	};

	Lighting.prototype.setFogNearFar = function(near, far) {
		ShaderBuilder.FOG_SETTINGS = [near, far];
		ShaderBuilder.USE_FOG = true;
	};

	Lighting.prototype.setSunlightDirection = function(dir) {
		this.tempVec.set(-dir[2], -dir[1], -dir[0]);
		//    lightEntity.transformComponent.transform.translation.set(dir);
		this.lightEntity.transformComponent.transform.rotation.lookAt(this.tempVec, Vector3.UNIT_Y);
		this.lightEntity.transformComponent.setUpdated();
	};

	Lighting.prototype.setupMainLight = function() {
		console.log("Setup Main Light");

		this.lightEntity = this.goo.world.createEntity('Light1');
		this.dirLight = new DirectionalLight();
		this.dirLight.color.setd(1, 0.95, 0.85, 1.0);
		this.dirLight.specularIntensity = 1;
		this.dirLight.intensity = 1;

		this.lightComp = new LightComponent(this.dirLight);
		this.lightComp.light.shadowCaster = false;
		this.lightComp.light.shadowSettings.darkness = 0.9;
		this.lightComp.light.shadowSettings.near = this.shadowNear;
		this.lightComp.light.shadowSettings.far = this.shadowFar;
		this.lightComp.light.shadowSettings.size = this.shadowSize;
		this.lightComp.light.shadowSettings.shadowType = this.shadowType;
		this.lightComp.light.shadowSettings.resolution = [this.shadowReso,this.shadowReso];
		console.log("lightComp ---- ",this.lightComp);
		this.lightEntity.setComponent(this.lightComp);

		this.lightEntity.transformComponent.transform.translation.setd(0, 0, 0);
		this.lightEntity.transformComponent.transform.lookAt(new Vector3(-0.5,-0.4, 0.43), Vector3.UNIT_Y);
		this.lightEntity.addToWorld();

		return this.lightEntity;
	};



	return Lighting;

});