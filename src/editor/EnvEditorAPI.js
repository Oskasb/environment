"use strict";

define([
	'environment/editor/EnvEditorGui'
], function(
	EnvEditorGui
	) {

	var EnvEditorAPI = function(env) {
		this.dynamicEnvironemnt = env;
	};

	EnvEditorAPI.prototype.getEnvironmentGlobals = function() {
		return this.dynamicEnvironemnt.globals;
	};

	EnvEditorAPI.prototype.fogGlobalsUpdate = function(near, far) {
		this.dynamicEnvironemnt.setFogGlobals(near, far);
	};

	EnvEditorAPI.prototype.baseCycleUpdate = function(stepDuration) {
		this.dynamicEnvironemnt.setDayStepDuration(stepDuration);
	};

	EnvEditorAPI.prototype.openEnvEditor = function() {
		var editorGui = new EnvEditorGui(this);
		editorGui.buildGUI(this, this.dynamicEnvironemnt.globals);
		console.log("Start Environment editor")
	};


	return EnvEditorAPI;

});