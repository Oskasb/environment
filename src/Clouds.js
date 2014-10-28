"use strict";

define([
	"application/EventManager",
	'goo/math/Vector3',
	'goo/entities/SystemBus'

],function(
	event,
	Vector3,
	SystemBus
) {

	var hitVec = new Vector3();
	var hitNorm = new Vector3();

        var clouds = [];
        var lastPuffIndex = 0;
        var cloudBaseHeight = 400;
		var cloudScale = 5;

        var createClouds = function(pos, size, intensity) {
            var xCount = Math.floor(intensity * 15);
            var zCount = Math.floor(intensity * 15);

            for (var i = 0; i < xCount; i++) {
                for (var j = 0; j < zCount; j++) {
                    var xPos = pos[0]-(size[0]*0.5) + i*(size[0]/xCount) + (2*size[0]/xCount)*(Math.random()-0.5);
                    var yPos = cloudBaseHeight + pos[1]-(size[1]*0.5) + Math.random()*Math.random()*size[1]*2.3;
                    var zPos = pos[2]-(size[2]*0.5) + j*(size[2]/zCount) + (2*size[2]/zCount)*(Math.random()-0.5);
					xPos*=cloudScale;
					yPos*=cloudScale*0.3;
					zPos*=cloudScale;
                    clouds.push([xPos, yPos, zPos, size[0]/xCount*0.8, size[1]*1.8, size[2]/zCount*0.8]);
                }
            }

			for (var i = 0; i < clouds.length; i++) {
				makeCloudPuff(i);
				lastPuffIndex = -1
			}
        };

        var handleSpawnClouds = function(e) {
            createClouds(event.eventArgs(e).pos, event.eventArgs(e).size, event.eventArgs(e).intensity)
        };

        var makeCloudPuff = function(idx) {

        //    event.fireEvent(event.list().PUFF_CLOUD_VAPOR, {pos:[clouds[idx][0]+Math.random()*clouds[idx][3], clouds[idx][1]+Math.random()*clouds[idx][4], clouds[idx][2]+Math.random()*clouds[idx][5]], count:1, dir:[38*(Math.random()-0.5), 65*(Math.random()-0.1), 38*(Math.random()-0.5)]});

			hitVec.set(clouds[idx][0]+Math.random()*clouds[idx][3], clouds[idx][1]+Math.random()*clouds[idx][4], clouds[idx][2]+Math.random()*clouds[idx][5]);
			hitNorm.set(38*(Math.random()-0.5), 65*(Math.random()-0.1), 38*(Math.random()-0.5));
			var effectData = {};
			SystemBus.emit('playCloudEffect', {effectName:'white_cloud_puff', pos:hitVec, vel:hitNorm, effectData:effectData});

		};

        var renderTick = function() {
        //    if (Math.random() < 0.8) return;
            lastPuffIndex += 1;
            if (lastPuffIndex >= clouds.length) {
                lastPuffIndex = -1;
                return;
            }
			var idx = Math.floor(Math.random()*clouds.length);

            makeCloudPuff(idx);
        };


	return {
		tickClouds:renderTick,
		createClouds:createClouds
	}
    });
