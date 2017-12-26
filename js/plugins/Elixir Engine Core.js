/*:
@plugindesc The Elixir Engine
@author Logan Forrests (2017)

@help This plugin does not provide plugin commands.

Copyright (c) 2017 Logan Forrests, MIT/X11 License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
 "use strict";

var ElixirEngine = ElixirEngine || {};

// Auto-create the component keys in object
(function() {
	let elixirComponents = ['data', 'classes', 'windows', 'scenes', 'settings'];

	elixirComponents.forEach(function(component) {
		ElixirEngine[component] = {};
	});

})();

// Assign shortcuts to engine
ElixirEngine = LoganForrestsMV.elixir;

// Auto-unpacking of settings for Elixir Engine Core
/* (function() {
	let parameters = PluginManager.parameters('Elixir Engine Core');
	parameters.forEach(function(value, parameter) {
		ElixirSettings[parameter] = value;
	});
})(); */

ElixirEngine.CoreManager = (function() {

	var _path = 'js/plugins/elixir/';
	var _engine = 'engine.json';

	var getXMLHttpRequest = function(path) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', path);
		xhr.overrideMimeType('application/json');
		return xhr;
	};

	var loadEngine = function() {
		var xhr = getXMLHttpRequest(_path + _engine);
		xhr.onload =  function() {
			if (xhr.status < 400) {
				let engine = JSON.parse(xhr.responseText);
				ElixirEngine.name = engine.name;
				ElixirEngine.version = engine.version;
				ElixirEngine.author = engine.author;
				ElixirEngine.copyright = engine.copyright;
				loadEngineComponents(engine.components);
				loadDataObjects(engine.dataObjects, 0);
			}
		};
		xhr.send();
	};

	var loadEngineComponents = function(components) {
		components.forEach(function(component) {
			let url = _path + component + '.js';
			let script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = url;
			script.async = false;
			document.body.appendChild(script);
		});
	};

	var loadDataObjects = function(dataObjects, index) {
		if (index >= dataObjects.length) {
			// End the call if index is out of bounds
			return;
		}

		ElixirEngine.data = ElixirEngine.data || {};
		let dataObject = dataObjects[index];
		let path = _path + dataObject.path + '.json';
		var xhr = getXMLHttpRequest(path);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status < 400) {
				// Write the JSON to ElixirEngine.data
				let obj = JSON.parse(xhr.responseText);
				ElixirEngine.data[dataObject.name] = obj.data;
				// Automatically load the next data object via recursive call on next dataObjects index
				loadDataObjects(dataObjects, index + 1);
			}
		};
		xhr.send();
	};

	var loadObjects = function() {

	};

	var executeCommand = function(command, args) {

		switch(command) {

		case 'generate':
			let type = args[0];
			let id = parseInt(args[1], 10);
			generateUnit(id, type);
			break;
		default:
			throw new Error('Unknown plugin command ' + command);
			break;
		};
	};

	var generatePlayer = function(playerData) {
		ElixirEngine.Player.makeFrom(playerData);
	};

	var generateUnit = function(id, type) {
		let unit = null;

		switch(type) {
		case 'ally':
			// Generate a random ID
			let uniqueId = -1;
			do {
				uniqueId = Math.randomInt(0xFFFF);
			} while (!!ElixirEngine.Allies.members[uniqueId]);

			unit = new ElixirClass.Ally(uniqueId, ElixirEngine.Player.id);
			unit.makeFrom(ElixirEngine.data.units[id]);
			ElixirEngine.Allies.addMember(unit);
			ElixirEngine.Allies.removeMember(unit);
			break;
		case 'enemy':
			break;
		case 'friend':
			break;
		default:
			return;
		};

	};

	// Revealing
	return {
		loadEngine : loadEngine,
		loadObjects : loadObjects,
		executeCommand : executeCommand,
	};

})();

// Alias functions for RPG Maker MV default scripts
(function() {

	var lf_elixir_140717_window_onload = window.onload;
	window.onload = function() {
		ElixirEngine.CoreManager.loadEngine();
		lf_elixir_140717_window_onload.call(this, arguments);
	};

	var lf_elixir_140717_DataManager_createGameObjects = DataManager.createGameObjects;
	DataManager.createGameObjects = function() {
		lf_elixir_140717_DataManager_createGameObjects.apply(this, arguments);
		ElixirEngine.CoreManager.loadObjects();
	};

	var lf_elixir_150717_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		lf_elixir_150717_Game_Interpreter_pluginCommand.call(this, command, args);
		if (command === 'elixir') {
			let elixir_command = args[0];
			let elixir_args = args.filter(function(arg) {
				return args.indexOf(arg) != 0;
			});
			ElixirEngine.CoreManager.executeCommand(elixir_command, elixir_args);
		}
	};

})();
