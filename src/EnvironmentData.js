"use strict";

define(function() {

	var cycles = [
		{
			name:'predawn',
			values:{
				sunLight:    [0.4, 0.3, 0.2],
				sunDir:      [-0.8, 0.3, 0.2],
				ambientLight:[0.1, 0.3, 0.8],
				skyColor:    [0.1, 0.4, 0.6],
				fogColor:    [0.4, 0.65, 0.74],
				fogDistance: [0.2, 1.2]
			}

		},
		{//
			name:'dawn',
			values:{
				sunLight:    [0.7, 0.5, 0.4],
				sunDir:      [-0.5, 0.1, -0.2],
				ambientLight:[0.1, 0.5, 0.8],
				skyColor:    [0.3, 0.6, 0.8],
				fogColor:    [0.4, 0.65, 0.81],
				fogDistance: [0.1, 1.3]
			}
		},
		{ //
			name:'morning',
			values:{
				sunLight:[0.7, 0.65, 0.5],
				sunDir:[-0.6, -0.3, -0.3],
				ambientLight:[0.4, 0.4, 0.7],
				skyColor:[0.6, 0.6, 0.81],
				fogColor:[0.68, 0.71, 0.81],
				fogDistance: [0.1, 1.4]
			}
		},
		{ //
			name:'day',
			values:{
				sunLight:[0.96, 0.85, 0.6],
				sunDir:[-0.4, -0.6, -0.4],
				ambientLight:[0.4, 0.5, 0.8],
				skyColor:[0.61, 0.68, 0.74],
				fogColor:[0.69, 0.71, 0.81],
				fogDistance: [0.3, 1.9]
			}
		},
		{ //
			name:'noon',
			values:{
				sunLight:[0.96, 0.8, 0.6],
				sunDir:[-0.2, -0.9, -0.4],
				ambientLight:[0.3, 0.5, 0.7],
				skyColor:[0.62, 0.65, 0.75],
				fogColor:[0.71, 0.72, 0.81],
				fogDistance: [0.3, 2.8]
			}
		},
		{ //
			name: 'afternoon',
			values:{
				sunLight:[0.9, 0.7, 0.5],
				sunDir:[-0.2, -0.7, -0.4],
				ambientLight:[0.3, 0.4, 0.6],
				skyColor:[0.4, 0.55, 0.78],
				fogColor:[0.60, 0.68, 0.79],
				fogDistance: [0.5, 1.7]
			}
		},
		{ //
			name:'evening',
			values:{
				sunLight:[0.7, 0.6, 0.3],
				sunDir:[0.4, -0.21, -0.4],
				ambientLight:[0.7, 0.5, 0.4],
				skyColor:[0.6, 0.5, 0.4],
				fogColor:[0.6, 0.5, 0.3],
				fogDistance: [0.1, 1.1]
			}
		},
		{ //
			name:'dusk',
			values:{
				sunLight:[0.6, 0.4, 0.4],
				sunDir:[0.5, 0.5, 0.2],
				ambientLight:[0.6, 0.4, 0.3],
				skyColor:[0.5, 0.3, 0.2],
				fogColor:[0.5, 0.35, 0.3],
				fogDistance: [0.1, 0.8]
			}
		},
		{ //
			name:'night1',
			values:{
				sunLight:[0.5, 0.2, 0.4],
				sunDir:[0.4, -0.3, 0.6],
				ambientLight:[0.1, 0.1, 0.5],
				skyColor:[0.1, 0.0, 0.4],
				fogColor:[0.0, 0.0, 0.1],
				fogDistance: [0.1, 0.7]
			}
		},
		{ //
			name: 'night2',
			values:{
				sunLight:[0.2, 0.1, 0.2],
				sunDir:[-0.3, -0.6, 0.8],
				ambientLight:[0.1, 0.1, 0.4],
				skyColor:[0.0, 0.1, 0.3],
				fogColor:[0.0, 0.0, 0.1],
				fogDistance: [0.1, 0.7]
			}
		}
	];

	var globals = {
		baseFogNear: 150,
		baseFogFar:20000,
		baseCycleDuration: 10000,
		startCycleIndex: 0
	};

	return {
		globals:globals,
		cycles:cycles
	};

});
