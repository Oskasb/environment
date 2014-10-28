"use strict";

define([
	'goo/renderer/Material',
	'goo/shapes/Sphere',
	'goo/entities/EntityUtils',
	'goo/renderer/shaders/ShaderLib',
	'goo/util/Skybox',
	'goo/renderer/shaders/ShaderBuilder',
	'goo/renderer/Shader',
	'goo/renderer/MeshData',
	'goo/entities/components/MeshRendererComponent',
	'goo/renderer/TextureCreator',
	'goo/renderer/Texture'
], function(
	Material,
	Sphere,
	EntityUtils,
	ShaderLib,
	Skybox,
	ShaderBuilder,
	Shader,
	MeshData,
	MeshRendererComponent,
	TextureCreator,
	Texture
	) {

	var goo;
	var canvas;
	var ctx;
	var width = 4;
	var height = 64;
	var darker = 'darker';
//    var sourceOver = 'source-over';
	var lighter = 'lighter';

//    var attenuatedFill = function(color, attenuation) {
//        return 'rgba('+Math.floor(color[0]*255)+','+Math.floor(color[1]*255)+','+Math.floor(color[2]*255)+','+attenuation+')';
//    };

	var toRgb = function(color) {
		return 'rgb('+Math.floor(color[0]*255)+','+Math.floor(color[1]*255)+','+Math.floor(color[2]*255)+')';
	};

	var setupCanvas = function() {
		canvas = document.createElement("canvas");
		canvas.id = 'sky_canvas';
		canvas.width  = width;
		canvas.height = height;
		canvas.dataReady = true;
		var texture = new Texture(canvas, null, canvas.width, canvas.height);
		ctx = canvas.getContext('2d');
	//	document.body.appendChild(canvas);
		return texture;
	};


	function createSkyEntity(goo, shader, tx) {
		var mapping = Sphere.TextureModes.Linear;

		var skysphere = new Skybox("sphere", [], mapping, 0);

		var meshData = skysphere.meshData;
		var entity = goo.world.createEntity(meshData);
        console.log("sky entity: ", entity);
		var material = new Material('skyMat', shader);

        console.log("Material: ", material)
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

	var DynamicSkysphere = function(g00) {
		goo = g00;
		this.tx = setupCanvas();
                console.log("canvas tx: ", this.tx)
		//    this.tx = new TextureCreator().loadTexture2D('./resources/images/skytest.png',  {
		//	    wrapS: 'EdgeClamp',
		//	    wrapT: 'EdgeClamp'
		//    })

		this.setColor([0.7, 0.8, 1],[0.4,0.3, 0.7],[0.4, 0.6, 1], 1);
		this.skyEntity = createSkyEntity(goo, ShaderLib.textured, this.tx);
		//     var skyEntity = createSkyEntity(goo, ShaderLib.simpleColored, tx)
		ShaderBuilder.SKYSPHERE = this.tx;

		this.skyEntity.addToWorld();
	};

	DynamicSkysphere.prototype.setColor = function(fog, ambient, color, elevation) {
		//    ctx.globalCompositeOperation = sourceOver;
		//    ctx.fillStyle = attenuatedFill(color, amount);
		//           console.log(fog, ambient, color)
		//    if (!this.tx) return
		//    console.log(this)

		var evFact = Math.min(elevation*0.00025, 0.099);

	//	document.getElementById("sys_hint").innerHTML = "Elevation:"+elevation+"<br>"+"evFact:"+evFact;

		var grd=ctx.createLinearGradient(0,0,0,height);
		grd.addColorStop(1, toRgb([ambient[0]*color[0], ambient[1]*color[1], ambient[2]*color[2]]));
	//	grd.addColorStop(0.8+evFact,toRgb([color[0]*(0.5)*(1-evFact)+fog[0]*(0.5)*evFact*evFact, color[1]*0.5*(1-evFact)+fog[1]*(0.5)*evFact*evFact, color[2]*0.5*(1-evFact)+fog[2]*0.5*evFact*evFact]));

		grd.addColorStop(0.627+(evFact), toRgb([color[0]*(1-evFact), color[1]*(1-evFact), color[2]*(1-evFact)]));
     		//    grd.addColorStop(0.45,toRgb(ambient));
		grd.addColorStop(0.5,toRgb(fog));
		grd.addColorStop(0.2,toRgb(fog));
		grd.addColorStop(0.1-evFact, toRgb([ambient[0]*color[0], ambient[1]*color[1], ambient[2]*color[2]]));
		ctx.fillStyle=grd;
		ctx.fillRect(0, 0, width, height);
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
		this.sun = goo.world.createEntity(sphere, this.sunmat);
		console.log("Add Sun:", this.sun)
		this.sun.transformComponent.transform.translation.set(0, 10000, 0);
		this.sun.meshRendererComponent.isReflectable = false;
		this.sun.addToWorld();
	};

	DynamicSkysphere.prototype.setSunColor = function(color) {
		this.sunmat.shader.uniforms.color = [Math.sqrt(color[0]*0.5+0.5), Math.sqrt(color[1]*0.5+0.5), Math.sqrt(color[2]*0.5+0.5)];
	};

	DynamicSkysphere.prototype.setSunXYZ = function(x, y, z) {


		this.sun.transformComponent.transform.translation.set(x, y, z);
		//	this.sun.transformComponent.transform.translation.set(0, 100, 0);
		this.sun.transformComponent.setUpdated();
	};

	return DynamicSkysphere;
});