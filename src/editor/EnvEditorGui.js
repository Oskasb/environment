"use strict";

define([

], function(

	) {

	var EnvEditorGUI = function(editorAPI) {
		this.editorAPI = editorAPI;
	};



	EnvEditorGUI.prototype.startEditOfConfig = function(terrainConfigurator) {
		this.buildGUI(terrainConfigurator);
	};

	EnvEditorGUI.prototype.addTextureControls = function(txFolder, texture) {
		if (!texture.image) return;
		var txEditSettings = {
			edit: false,
			img: texture.image.currentSrc,
			repeatX: texture.repeat[0],
			repeatY: texture.repeat[1],
			offsetX: 0.01,
			offsetY: 0.01
		};

		var editTx = txFolder.add(txEditSettings, 'edit');
		editTx.onFinishChange(function(value) {
			console.log("Tx edit end: ", texture, txEditSettings);
			texture.repeat[0] = txEditSettings.repeatX;
			texture.repeat[1] = txEditSettings.repeatY;
			texture.offset[0] = txEditSettings.offsetX;
			texture.offset[1] = txEditSettings.offsetY;
			texture.setNeedsUpdate();
		});

		var scaleX = txFolder.add(txEditSettings, 'repeatX', 0.1, 10);
		var scaleY = txFolder.add(txEditSettings, 'repeatY', 0.1, 10);
		var offsetX = txFolder.add(txEditSettings, 'offsetX', 0, 1);
		var offsetY = txFolder.add(txEditSettings, 'offsetY', 0, 1);

		scaleX.onValueChange = function(value) {
			texture.repeat[0] = value;
			texture.setNeedsUpdate();
			console.log("Tx edit: ", texture)
		};

		scaleY.onFinishChange = function(value) {
			texture.repeat[1] = value;
			texture.setNeedsUpdate();
		};


	};

	EnvEditorGUI.prototype.removeEditorGui = function() {
		try {
			if (this.gui)
				this.gui.destroy();
		} catch (u) {
			console.log("dat.gui crashed");
			window.document.body.removeChild(this.gui.domElement);
		}
		delete this.gui;
	};

	EnvEditorGUI.prototype.buildGUI = function(envEditor, envData) {

		this.gui = new dat.GUI();

		window.document.body.appendChild(this.gui.domElement);
		this.gui.domElement.style.zIndex = "10000";
		this.gui.domElement.style.position = "absolute";
		this.gui.domElement.style.top = "0px";
		this.gui.domElement.style.right = "300px";

		var _this = this;
		this.guiFolders = [];

	//	var terrainEditSettings = terrainConfigurator.getTerrainEditSettings();
	//	var terrainConfigData = terrainConfigurator.getTerrainConfigData();

		var envFolder = this.gui.addFolder('Environemnt');

		var envEditSettings = {
			edit: false,
			fogNear: envData.baseFogNear,
			fogFar: envData.baseFogFar,
			baseCycleDuration: envData.baseCycleDuration
		};

		var fogNearCtrl = envFolder.add(envEditSettings, 'fogNear', 1, 2000);
		var fogFarCtrl =  envFolder.add(envEditSettings, 'fogFar',  1000, 30000);
		var cycleTimeCtrl =  envFolder.add(envEditSettings, 'baseCycleDuration',  200, 40000);

		fogNearCtrl.onChange(function(value) {
			console.log("Fog Near Change", value, envEditSettings.fogNear);
			envEditor.fogGlobalsUpdate(envEditSettings.fogNear, envEditSettings.fogFar)
		});

		fogFarCtrl.onChange(function(value) {
			console.log("Fog Near Change", value, envEditSettings.fogNear);
			envEditor.fogGlobalsUpdate(envEditSettings.fogNear, envEditSettings.fogFar)
		});

		cycleTimeCtrl.onChange(function(value) {
			console.log("Day Duration Change", value, envEditSettings.baseCycleDuration);
			envEditor.baseCycleUpdate(envEditSettings.baseCycleDuration)
		});

		var gameControlFns = {
			'Save': function() {
				console.log("Save environemnt data here...")
			}
		};

		envFolder.add(gameControlFns, 'Save');

	};

	return EnvEditorGUI;
});
