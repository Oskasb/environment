"use strict";

define([
	'environment/editor/EnvEditorAPI',
	'goo/entities/SystemBus',
    'goo/math/Vector3',
	'environment/Water',
	'environment/EnvironmentData'
], function(
	EnvEditorAPI,
	SystemBus,
    Vector3,
    Water,
    EnvironmentData
    ) {



    var DynamicEnvironment = function(lighting) {
		this.lighting = lighting;
	    this.waterSettings = EnvironmentData.waterSettings;


	    this.stepDuration;
	    this.stepProgress;
	    this.cycleIndex;
	    this.envState = {
		    sunLight     : new Vector3(),
		    sunDir       : new Vector3(),
		    ambientLight : new Vector3(),
		    skyColor     : new Vector3(),
		    fogColor     : new Vector3(),
		    fogDistance  : new Vector3()
	    };

	    this.tempVec = new Vector3();
	    this.environments = EnvironmentData.cycles;
	    this.globals = EnvironmentData.globals;
	    this.lastUpdate = 0;


		this.lighting.setBaseFogNearFar(this.globals.baseFogNear, this.globals.baseFogFar);

	    this.cycleIndex = this.globals.startCycleIndex;
	    this.setDayStepDuration(this.globals.baseCycleDuration);

	    this.stepProgress = 0;

	    this.paused = false;

	    var enablePauseEnv = function(env) {
		    document.getElementById("time_pause").addEventListener('click', function() {
			    env.togglePauseTime();
		    }, false);
	    };

	//    enablePauseEnv(this);


	    var includeEnvEditor = function(env) {
		    var envEditorAPI = new EnvEditorAPI(env);
		    var enableEditButton = function(editorAPI) {
			    document.getElementById("EditEnvironment").addEventListener('click', function() {
				    editorAPI.openEnvEditor();
			    }, false);
		    };

		    enableEditButton(envEditorAPI);
	    };

	//    includeEnvEditor(this);


	    this.setCycleData(EnvironmentData.cycles);
		this.addEnvEffects();
    };

	DynamicEnvironment.prototype.setCycleData = function(envCycleData) {
		this.environments = envCycleData;
	};


	DynamicEnvironment.prototype.setGlobals = function(globals) {
		for (var key in globals) {
			this.globals[key] = globals[key];
		}
		this.setDayStepDuration(this.globals.baseCycleDuration);
	};

	DynamicEnvironment.prototype.playWaterEffect = function(pos, vel, effectData) {
		var brt = Math.random()*0.16;
		effectData.color0 = [
			this.envState.skyColor.data[0]*0.5+this.envState.sunLight.data[0]*0.5 + Math.random()*0.04+brt,
			this.envState.skyColor.data[1]*0.5+this.envState.sunLight.data[1]*0.5 + Math.random()*0.04+brt,
			this.envState.skyColor.data[2]*0.5+this.envState.sunLight.data[2]*0.5 + Math.random()*0.04+brt
		];

		effectData.color1 = effectData.color0;
		effectData.opacity = [0.8, 0.4];

		SystemBus.emit('playParticles', {simulatorId:"StandardParticle", pos:pos, vel:vel, effectData:effectData});
	};

	DynamicEnvironment.prototype.playCloudEffect = function(pos, vel, effectData) {

		effectData.color0 = [
			this.envState.skyColor.data[0]*0.5+this.envState.sunLight.data[0]*0.6 + Math.random()*0.1,
			this.envState.skyColor.data[1]*0.5+this.envState.sunLight.data[1]*0.6 + Math.random()*0.1,
			this.envState.skyColor.data[2]*0.5+this.envState.sunLight.data[2]*0.6 + Math.random()*0.1
		];

		effectData.color1 = effectData.color0;
		effectData.opacity = [0.1, 0.2];

		SystemBus.emit('playParticles', {simulatorId:"StandardParticle", pos:pos, vel:vel, effectData:effectData});
	};

	DynamicEnvironment.prototype.playVaporEffect = function(pos, vel, effectData) {

		effectData.color0 = [
			Math.sqrt(this.envState.skyColor.data[0]*0.5+this.envState.sunLight.data[0]*0.5 + Math.random()*0.1),
			Math.sqrt(this.envState.skyColor.data[1]*0.5+this.envState.sunLight.data[1]*0.5 + Math.random()*0.1),
			Math.sqrt(this.envState.skyColor.data[2]*0.5+this.envState.sunLight.data[2]*0.5 + Math.random()*0.1)
		];

		effectData.color1 = effectData.color0;
		effectData.opacity = [0.1, 0.4];
		SystemBus.emit('playParticles', {simulatorId:"StandardParticle", pos:pos, vel:vel, effectData:effectData});
	};

	DynamicEnvironment.prototype.addEnvEffects = function() {

		var updateWaterFx = function(args) {
			this.playWaterEffect(args.pos, args.vel, args.effectData);
		}.bind(this);

		var updateCloudFx = function(args) {
			this.playCloudEffect(args.pos, args.vel, args.effectData);
		}.bind(this);

		var updateVaporFx = function(args) {
			this.playVaporEffect(args.pos, args.vel, args.effectData);
		}.bind(this);

		SystemBus.addListener('playWaterEffect', updateWaterFx);
		SystemBus.addListener('playCloudEffect', updateCloudFx);
		SystemBus.addListener('playVaporEffect', updateVaporFx);
	};


	DynamicEnvironment.prototype.addWater = function(goo, skySphere, resourcePath) {
		this.water = new Water(goo, skySphere, resourcePath);
	};

	DynamicEnvironment.prototype.setFogGlobals = function(near, far) {
		this.globals.baseFogNear = near;
		this.globals.baseFogFar  = far;
		this.lighting.setBaseFogNearFar(this.globals.baseFogNear, this.globals.baseFogFar);
		this.water.setBaseFogNearFat(this.globals.baseFogNear*4, this.globals.baseFogFar*48);
	};

	DynamicEnvironment.prototype.setDayStepDuration = function(duration) {
		this.stepDuration = duration / this.environments.length;
	};


	DynamicEnvironment.prototype.togglePauseTime = function() {
		this.paused = !this.paused;
		console.log("Pause env time: ", this.paused)
	};

    DynamicEnvironment.prototype.getEnvironmentState = function() {
        return {fogColor:this.envState.fogColor.data, sunLight:this.envState.sunLight.data, ambientLight:this.envState.ambientLight.data, sunDir:this.envState.sunDir.data, skyColor:this.envState.skyColor.data, fogDistance:this.envState.fogDistance.data};
    };

    DynamicEnvironment.prototype.stepCycle = function() {
	    this.cycleIndex += 1;
	    this.stepProgress = 0;
        if (this.cycleIndex == this.environments.length) this.cycleIndex = 0;
    };

	DynamicEnvironment.prototype.applyEnvStateToColors = function() {
		var frameState = this.getEnvironmentState();
		this.lighting.setAmbientColor([this.envState.ambientLight.data[0], this.envState.ambientLight.data[1], this.envState.ambientLight.data[2]]);
		this.lighting.scaleFogNearFar(this.envState.fogDistance[0], this.envState.fogDistance[1]);
		this.lighting.setFogColor([frameState.fogColor[0],frameState.fogColor[1],frameState.fogColor[2]]);
		this.lighting.setSunlightDirection(this.envState.sunDir.data);
		this.lighting.setSunlightColor(this.envState.sunLight.data);
        this.water.updateWaterEnvironment(frameState.sunLight, frameState.sunDir, frameState.fogColor, frameState.fogDistance)

	};


    DynamicEnvironment.prototype.advanceTime = function(time) {
	    if (this.paused) return;
	    this.lastUpdate -= time;
	    this.stepProgress += time;

	//    document.getElementById("time_hint").innerHTML = "Cycle: "+this.environments[cycleIndex].name+" ("+cycleIndex+"/"+(this.environments.length-1)+") Progress:"+Math.round(stepProgress);
	    this.stepFraction = time / this.stepDuration;
        if (this.stepProgress >= this.stepDuration) this.stepCycle();

    //    var nextIndex = cycleIndex+1;
    //   if (nextIndex >= environments.length) nextIndex = 0;

        for (var index in this.environments[this.cycleIndex].values) {
	        this.tempVec.set(this.environments[this.cycleIndex].values[index]);
	        this.envState[index].lerp(this.tempVec, this.stepFraction);
        }

		if (this.lastUpdate > 0) return;
	    this.lastUpdate = 0.4;
	    this.applyEnvStateToColors();
    };

    return DynamicEnvironment;

});