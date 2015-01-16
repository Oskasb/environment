"use strict";

define([
	'goo/math/Vector3',
	'goo/entities/SystemBus'

],function(
	Vector3,
	SystemBus
) {

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

	return Clouds;

    });
