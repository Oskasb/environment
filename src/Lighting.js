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

	var goo;
	var tempVec = new Vector3();
	var shadowReso = 128;
	var shadowNear = 3.2;
	var shadowSize = 25;
	var shadowFar = 27;
	var shadowType = "basic";

	var baseFogNear = 50;
	var baseFogFar = 20000;

	var sunBoost = 1.5;
	var ambientBoost = 0.7;

	var lightEntity;
	var dirLight;
	var lightComp;

	ShaderBuilder.USE_FOG = true;
	function setGoo(g00) {
		goo = g00;
	}

	function setBaseFogNearFar(fogNear, fogFar) {
		baseFogNear = fogNear;
		baseFogFar = fogFar;
	}

	function setSunlightColor(color) {
		dirLight.color.setd(color[0]*(1+Math.random()*0.003)*sunBoost, color[1]*(1+Math.random()*0.002)*sunBoost, color[2]*(1+Math.random()*0.005)*sunBoost, 1.0);
	}

	function setAmbientColor(color) {
		ShaderBuilder.GLOBAL_AMBIENT = [color[0]*(1+Math.random()*0.003)*ambientBoost, color[1]*(1+Math.random()*0.002)*ambientBoost, color[2]*(1+Math.random()*0.005)*ambientBoost, 1.0];
	}

	function setFogColor(color) {
		ShaderBuilder.FOG_COLOR = color;
	}

	function scaleFogNearFar(near, far) {
		setFogNearFar(baseFogNear*near, baseFogFar*far);
	}

	function setFogNearFar(near, far) {
		ShaderBuilder.FOG_SETTINGS = [near, far];
		ShaderBuilder.USE_FOG = true;
	}

	function setSunlightDirection(dir) {
		tempVec.set(-dir[2], -dir[1], -dir[0]);
		//    lightEntity.transformComponent.transform.translation.set(dir);
		lightEntity.transformComponent.transform.rotation.lookAt(tempVec, Vector3.UNIT_Y);
		lightEntity.transformComponent.setUpdated();
	}

	var setupMainLight = function() {
		console.log("Setup Main Light");

		lightEntity = goo.world.createEntity('Light1');
		dirLight = new DirectionalLight();
		dirLight.color.setd(1, 0.95, 0.85, 1.0);
		dirLight.specularIntensity = 1;
		dirLight.intensity = 1;

		lightComp = new LightComponent(dirLight);
		lightComp.light.shadowCaster = false;
		lightComp.light.shadowSettings.darkness = 0.9;
		lightComp.light.shadowSettings.near = shadowNear;
		lightComp.light.shadowSettings.far = shadowFar;
		lightComp.light.shadowSettings.size = shadowSize;
		lightComp.light.shadowSettings.shadowType = shadowType;
		lightComp.light.shadowSettings.resolution = [shadowReso,shadowReso];
		console.log("lightComp ---- ",lightComp);
		lightEntity.setComponent(lightComp);

		lightEntity.transformComponent.transform.translation.setd(0, 0, 0);
		lightEntity.transformComponent.transform.lookAt(new Vector3(-0.5,-0.4, 0.43), Vector3.UNIT_Y);
		lightEntity.addToWorld();


		return lightEntity;
	};



	function setEffectParamToValue(effect, param, value) {
		getEffects()[effect].fx[param] = value;
		event.fireEvent(event.list().ANALYTICS_EVENT, {category:"CONFIG_EFFECT", action:effect, labels:JSON.stringify(value), value:0});
	}

	function setSettingParamToValue(effect, param, value) {
		getSettings()[effect].fx[param] = value;
		event.fireEvent(event.list().ANALYTICS_EVENT, {category:"CONFIG_OPTION", action:effect, labels:JSON.stringify(value), value:0});
	}

//	function handleEffectParam(e) {
//		setEffectParamToValue(event.eventArgs(e).effect, event.eventArgs(e).parameter, event.eventArgs(e).value);
//	}

	function getComposers() {
		return goo.renderSystem.composers[0].passes;
	}

	function getEffects() {
		return {
			//    'Shadow Pass':{fx:getShadowPass(), param:"enabled"},
			Shadows:{fx:lightComp.light, param:"shadowCaster"},
			Sepia:{fx:getComposers()[1], param:"enabled"},
			Bloom:{fx:getComposers()[2], param:"enabled"},
			Grain:{fx:getComposers()[3], param:"enabled"},
			Contrast:{fx:getComposers()[4], param:"enabled"},
			'RGB Shift':{fx:getComposers()[5], param:"enabled"},
			Vignette:{fx:getComposers()[6], param:"enabled"},
			Bleach:{fx:getComposers()[7], param:"enabled"}
		}
	}

	var settings = {
		particles: {highDensity:1},
		bullets  : {visible:1},
		water    : {fancy:1},
		nature   : {manyTrees:0}
	};


	function getSettings() {
		return {
			'Dense Particles':  {fx:settings.particles, param:"highDensity"},
			'Visible Bullets':  {fx:settings.bullets,   param:"visible"},
			'Fancy Water':      {fx:settings.water,     param:"fancy"},
			'Lots of Trees':    {fx:settings.nature,    param:"manyTrees"}
		}
	}

	function getSettingParam(setting, param) {
		return settings[setting][param];
	}

	return {
		setGoo:setGoo,
		setBaseFogNearFar:setBaseFogNearFar,
		getEffects:getEffects,
		getSettingParam:getSettingParam,
		getSettings:getSettings,
		setSettingParamToValue:setSettingParamToValue,
		setEffectParamToValue:setEffectParamToValue,
		setSunlightColor:setSunlightColor,
		setSunlightDirection:setSunlightDirection,
		setAmbientColor:setAmbientColor,
		setFogColor:setFogColor,
		scaleFogNearFar:scaleFogNearFar,
		setupMainLight:setupMainLight
	}

});