


var waterColorTexturePath = window.resourcePath+'water';

var EnvironmentAPI = function() {

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



var Sky = function(goo) {
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
	this.clouds.tickClouds();
};



var DynamicEnvironment = function(lighting) {
	this.lighting = lighting;

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

	this.setCycleData(EnvData.cycles);
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
	this.stepDuration = (duration / this.environments.length) / this.timeScale;
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



var toRgb = function(color) {
	return 'rgb('+Math.floor(color[0]*255)+','+Math.floor(color[1]*255)+','+Math.floor(color[2]*255)+')';
};

var DynamicSkysphere = function(g00) {
	goo = g00;

	var goo;
	this.goo = goo;
	var canvas;
	var ctx;
	var width = 4;
	var height = 64;
	this.width = width;
	this.height = height;
	var darker = 'darker';
	var lighter = 'lighter';



	var setupCanvas = function(ds) {
		canvas = document.createElement("canvas");
		canvas.id = 'sky_canvas';
		canvas.width  = width;
		canvas.height = height;
		canvas.dataReady = true;
		var texture = new Texture(canvas, null, canvas.width, canvas.height);
		ctx = canvas.getContext('2d');
		ds.ctx = ctx;
		return texture;
	};


	this.tx = setupCanvas(this);

	this.setColor([0.7, 0.8, 1],[0.4,0.3, 0.7],[0.4, 0.6, 1], 1);


	function createSkyEntity(goo, shader, tx) {
		var mapping = Sphere.TextureModes.Linear;

		var skysphere = new Skybox("sphere", [], mapping, 0);

		var meshData = skysphere.meshData;
		var entity = goo.world.createEntity(meshData);
		var material = new Material('skyMat', shader);
		material.setTexture('DIFFUSE_MAP', tx);
		entity.set(new MeshRendererComponent(material));
		material.cullState.enabled = false;
		material.depthState.write = false;
		material.renderQueue = 2;
		//	material.shader.uniforms.color = [0.4, 0, 0]
		entity.transformComponent.transform.rotation.rotateX(Math.PI*0.5);
		entity.transformComponent.transform.scale.mul(900);
		entity.meshRendererComponent.cullMode = 'Never';
		return entity;
	}

	this.skyEntity = createSkyEntity(goo, ShaderLib.textured, this.tx);
	//     var skyEntity = createSkyEntity(goo, ShaderLib.simpleColored, tx)
	ShaderBuilder.SKYSPHERE = this.tx;

	this.skyEntity.addToWorld();


	this.width = width;
	this.height = height;
};

DynamicSkysphere.prototype.setColor = function(fog, ambient, color, elevation) {
	//    ctx.globalCompositeOperation = sourceOver;
	//    ctx.fillStyle = attenuatedFill(color, amount);
	//           console.log(fog, ambient, color)
	//    if (!this.tx) return
	//    console.log(this)

	var evFact = Math.min(elevation*0.00025, 0.099);

	//	document.getElementById("sys_hint").innerHTML = "Elevation:"+elevation+"<br>"+"evFact:"+evFact;

	var grd=this.ctx.createLinearGradient(0,0,0, this.height);
	grd.addColorStop(1, toRgb([ambient[0]*color[0], ambient[1]*color[1], ambient[2]*color[2]]));
	//	grd.addColorStop(0.8+evFact,toRgb([color[0]*(0.5)*(1-evFact)+fog[0]*(0.5)*evFact*evFact, color[1]*0.5*(1-evFact)+fog[1]*(0.5)*evFact*evFact, color[2]*0.5*(1-evFact)+fog[2]*0.5*evFact*evFact]));

	grd.addColorStop(0.627+(evFact), toRgb([color[0]*(1-evFact), color[1]*(1-evFact), color[2]*(1-evFact)]));
	//    grd.addColorStop(0.45,toRgb(ambient));
	grd.addColorStop(0.5,toRgb(fog));
	grd.addColorStop(0.2,toRgb(fog));
	grd.addColorStop(0.1-evFact, toRgb([ambient[0]*color[0], ambient[1]*color[1], ambient[2]*color[2]]));
	this.ctx.fillStyle=grd;
	this.ctx.fillRect(0, 0, this.width, this.height);
	this.tx.setNeedsUpdate();
};

DynamicSkysphere.prototype.makeSun = function() {
	var sphere = new Sphere(25, 25, 220);
	this.sunmat = new Material('SunMaterial', ShaderLib.simpleColored);
	this.sunmat.shader.uniforms.color = [1.0, 1.0, 0.98];
	//	this.sunmat.cullState.enabled = false;
	//	this.sunmat.depthState.write = false;
	this.sunmat.cullState.enabled = false;
	this.sunmat.depthState.write = false;
	this.sunmat.renderQueue = 3;
	//	this.sunmat.renderQueue = 1;
	this.sun = this.goo.world.createEntity(sphere, this.sunmat);
	this.sun.transformComponent.transform.translation.set(0, 10000, 0);
	this.sun.meshRendererComponent.isReflectable = false;
	this.sun.addToWorld();
};

DynamicSkysphere.prototype.setSunColor = function(color) {
	this.sunmat.shader.uniforms.color = [Math.sqrt(color[0]*0.5+0.5), Math.sqrt(color[1]*0.5+0.5), Math.sqrt(color[2]*0.5+0.5)];
};

DynamicSkysphere.prototype.setSunXYZ = function(x, y, z) {
	this.sun.transformComponent.transform.translation.set(x, y, z);
	this.sun.transformComponent.setUpdated();
};



var Water = function(goo, skySphere, resourcePath) {
	this.folderUrl = resourcePath;
	var meshData = Surface.createTessellatedFlat(291500, 291500, 40, 40);

	var material = new Material('water_material', ShaderLib.simple);
	this.waterEntity = goo.world.createEntity(meshData, material);

	this.waterEntity.transformComponent.transform.setRotationXYZ(-Math.PI / 2, 0, 0);

	this.waterEntity.addToWorld();
	this.waterRenderer = this.loadWaterShader(goo, skySphere, material);

	this.waterRenderer.waterMaterial.shader.uniforms.doFog = true;
	this.baseFogNear = 50;
	this.baseFogFar = 20000;

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
};


Water.prototype.loadWaterShader = function(goo, skySphere, material) {

	var waterRenderer = new FlatWaterRenderer({normalsUrl:this.folderUrl+'/waternormals3.png', useRefraction:false});

	goo.renderSystem.preRenderers.push(waterRenderer);

	waterRenderer.setWaterEntity(this.waterEntity);
	waterRenderer.setSkyBox(skySphere);

	waterRenderer.waterMaterial.shader.uniforms.fogColor = [0.5, 0.7, 1];
	waterRenderer.waterMaterial.shader.uniforms.sunDirection = [-0.5,-0.1, 0.23];
	waterRenderer.waterMaterial.shader.uniforms.sunColor = [1, 0.7, 0.2];
	waterRenderer.waterMaterial.shader.uniforms.waterColor = [0, 0, 0.03];
	waterRenderer.waterMaterial.shader.uniforms.sunShininess = 50;
	waterRenderer.waterMaterial.shader.uniforms.sunSpecPower = 0.7;
	waterRenderer.waterMaterial.shader.uniforms.fogStart = 10000;
	waterRenderer.waterMaterial.shader.uniforms.waterScale = 8;
	waterRenderer.waterMaterial.shader.uniforms.distortionMultiplier = 0.04;
	waterRenderer.waterMaterial.shader.uniforms.fogScale = 50000;
	waterRenderer.waterMaterial.shader.uniforms.fresnelPow = 1.3;
	waterRenderer.waterMaterial.shader.uniforms.normalMultiplier = 5;
	waterRenderer.waterMaterial.shader.uniforms.fresnelMultiplier = 0.3;

	return waterRenderer;
};


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


var Clouds = function() {
	this.hitVec = new Vector3();
	this.hitNorm = new Vector3();
	this.clouds = [];
	this.cloudScale = 5;
	this.lastPuffIndex = 0;
	this.cloudBaseHeight = 400;

	this.effectData = {
		"size": [ 1220, 2880 ],
		"gravity": 0,
		"count": 1,
		"lifespan": [3.1, 4.8],
		"opacity":[0.2, 0.7],
		"alpha":"zeroOneZero",
		"growthFactor":[0, 5],
		"growth":"oneToZero",
		"stretch":0,
		"strength":100,
		"spread":1,
		"acceleration":0,
		"rotation":[0,7],
		"spin":"oneToZero",
		"spinspeed":[0,0],
		"sprite":"smokey"
	};

};

Clouds.prototype.makeCloudPuff = function(idx) {

	this.hitVec.set(this.clouds[idx][0]+Math.random()*this.clouds[idx][3], this.clouds[idx][1]+Math.random()*this.clouds[idx][4], this.clouds[idx][2]+Math.random()*this.clouds[idx][5]);
	this.hitNorm.set(38*(Math.random()-0.5), 65*(Math.random()-0.1), 38*(Math.random()-0.5));

	SystemBus.emit('playCloudEffect', {pos:this.hitVec, vel:this.hitNorm, effectData:this.effectData});

};


Clouds.prototype.tickClouds = function() {
	this.lastPuffIndex += 1;
	if (this.lastPuffIndex >= this.clouds.length) {

		this.lastPuffIndex = -1;
		return;
	}
	var idx = Math.floor(Math.random()*this.clouds.length);
	if (Math.random() < 0.05) return;
	this.makeCloudPuff(idx);
};

Clouds.prototype.createClouds = function(pos, size, intensity) {
	this.intensity = intensity;
	var xCount = Math.floor(this.intensity * 15);
	var zCount = Math.floor(this.intensity * 15);

	for (var i = 0; i < xCount; i++) {
		for (var j = 0; j < zCount; j++) {
			var xPos = pos[0]-(size[0]*0.5) + i*(size[0]/xCount) + (2*size[0]/xCount)*(Math.random()-0.5);
			var yPos = this.cloudBaseHeight + pos[1]-(size[1]*0.5) + Math.random()*Math.random()*size[1]*2.3;
			var zPos = pos[2]-(size[2]*0.5) + j*(size[2]/zCount) + (2*size[2]/zCount)*(Math.random()-0.5);
			xPos*=this.cloudScale;
			yPos*=this.cloudScale*0.3;
			zPos*=this.cloudScale;
			this.clouds.push([xPos, yPos, zPos, size[0]/xCount*0.8, size[1]*1.8, size[2]/zCount*0.8]);
		}
	}

	for (i = 0; i < this.clouds.length; i++) {
		this.makeCloudPuff(i);
		this.lastPuffIndex = -1
	}
};



var EnvData = {
	"globals":{
		"baseFogNear": 150,
			"baseFogFar":20000,
			"baseCycleDuration": 1000,
			"startCycleIndex": 0
	},
	"cycles":[
		{
			"name":"predawn",
			"values":{
				"sunLight":    [0.4, 0.3, 0.2],
				"sunDir":      [-0.8, 0.3, 0.2],
				"ambientLight":[0.1, 0.3, 0.8],
				"skyColor":    [0.1, 0.4, 0.6],
				"fogColor":    [0.4, 0.65, 0.74],
				"fogDistance": [0.2, 1.2]
			}

		},
		{
			"name":"dawn",
			"values":{
				"sunLight":    [0.7, 0.5, 0.4],
				"sunDir":      [-0.5, 0.1, -0.2],
				"ambientLight":[0.1, 0.5, 0.8],
				"skyColor":    [0.3, 0.6, 0.8],
				"fogColor":    [0.4, 0.65, 0.81],
				"fogDistance": [0.1, 1.3]
			}
		},
		{
			"name":"morning",
			"values":{
				"sunLight":[0.7, 0.65, 0.5],
				"sunDir":[-0.6, -0.3, -0.3],
				"ambientLight":[0.4, 0.4, 0.7],
				"skyColor":[0.6, 0.6, 0.81],
				"fogColor":[0.68, 0.71, 0.81],
				"fogDistance": [0.1, 1.4]
			}
		},
		{
			"name":"day",
			"values":{
				"sunLight":[0.96, 0.85, 0.6],
				"sunDir":[-0.4, -0.6, -0.4],
				"ambientLight":[0.4, 0.5, 0.8],
				"skyColor":[0.61, 0.68, 0.74],
				"fogColor":[0.69, 0.71, 0.81],
				"fogDistance": [0.3, 1.9]
			}
		},
		{
			"name":"noon",
			"values":{
				"sunLight":[0.96, 0.8, 0.6],
				"sunDir":[-0.2, -0.9, -0.4],
				"ambientLight":[0.3, 0.5, 0.7],
				"skyColor":[0.62, 0.65, 0.75],
				"fogColor":[0.71, 0.72, 0.81],
				"fogDistance": [0.3, 2.8]
			}
		},
		{
			"name": "afternoon",
			"values":{
				"sunLight":[0.9, 0.7, 0.5],
				"sunDir":[-0.2, -0.7, -0.4],
				"ambientLight":[0.3, 0.4, 0.6],
				"skyColor":[0.4, 0.55, 0.78],
				"fogColor":[0.60, 0.68, 0.79],
				"fogDistance": [0.5, 1.7]
			}
		},
		{
			"name":"evening",
			"values":{
				"sunLight":[0.7, 0.6, 0.3],
				"sunDir":[0.4, -0.21, -0.4],
				"ambientLight":[0.7, 0.5, 0.4],
				"skyColor":[0.6, 0.5, 0.4],
				"fogColor":[0.6, 0.5, 0.3],
				"fogDistance": [0.1, 1.1]
			}
		},
		{
			"name":"dusk",
			"values":{
				"sunLight":[0.6, 0.4, 0.4],
				"sunDir":[0.5, 0.5, 0.2],
				"ambientLight":[0.6, 0.4, 0.3],
				"skyColor":[0.5, 0.3, 0.2],
				"fogColor":[0.5, 0.35, 0.3],
				"fogDistance": [0.1, 0.8]
			}
		},
		{
			"name":"night1",
			"values":{
				"sunLight":[0.5, 0.2, 0.4],
				"sunDir":[0.4, -0.3, 0.6],
				"ambientLight":[0.1, 0.1, 0.5],
				"skyColor":[0.1, 0.0, 0.4],
				"fogColor":[0.0, 0.0, 0.1],
				"fogDistance": [0.1, 0.7]
			}
		},
		{
			"name": "night2",
			"values":{
				"sunLight":[0.2, 0.1, 0.2],
				"sunDir":[-0.3, -0.6, 0.8],
				"ambientLight":[0.1, 0.1, 0.4],
				"skyColor":[0.0, 0.1, 0.3],
				"fogColor":[0.0, 0.0, 0.1],
				"fogDistance": [0.1, 0.7]
			}
		}
	]
};
