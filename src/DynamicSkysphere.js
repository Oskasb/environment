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

	return DynamicSkysphere;
});