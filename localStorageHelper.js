/**	localStorageHelper
 *	Simple class to build on localStorage Object and ease use of that object along with providing a custom controlled event system.
 *	*/
;(function() {
	var lsAvailable = function() { try { var a = window.localStorage; a.setItem("__storage_test__", "__storage_test__"); a.removeItem("__storage_test__"); return !0; } catch (b) { return !1; } }();
	
	/*------------------------------------------------------------------------*/
	
	function localStorageHelper(debuggingOnOff) {
		//	always return undefined if localStorage not available
		if (!this.available) return void 0;
		
		Object.defineProperties(this, {
			'instance': { get: function() { return this; } }
			
			/*	for debugging	*/
			, 'debugging': { enumerable: false, value: debuggingOnOff?true:false, writable: true }
			, 'info': { value: function() { if (this.debugging && console && console['info']) console.info.apply(window, arguments); } }
			, 'debug': { value: function() { if (this.debugging && console && console['debug']) console.debug.apply(window, arguments); } }
			, 'warn': { value: function() { if (this.debugging && console && console['warn']) console.warn.apply(window, arguments); } }
			, 'error': { value: function() { if (this.debugging && console && console['error']) console.error.apply(window, arguments); } }
			
		});
		
		for (var x in this.methods) definePropertyMethod.call(this, x);
		
		return this;
	}
	
	/*------------------------------------------------------------------------*/
	
	function definePropertyMethod(name) {
		if (!this[name])
			Object.defineProperty(this, name, { value: function() { return this.fire.apply(this, [name].concat(Array.prototype.slice.call(arguments, 0))); } });
		
		if (!this.events[name]) {
			Object.defineProperty(this.events, name, {
				value: {
					'begin': function() { return eventBegin.apply(this, [name].concat(Array.prototype.slice.call(arguments, 0))); }
					, 'end': function() { return eventEnd.apply(this, [name].concat(Array.prototype.slice.call(arguments, 0))); }
				}
			});
			Object.defineProperty(this.events[name].begin, 'callbacks', { value: [] })
			Object.defineProperty(this.events[name].end, 'callbacks', { value: [] })
		}
		return this;
	}
	
	function eventBegin(name) {
		if (this.instance) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (this.events[name] && this.events[name].begin) {
				var cb = this.events[name].begin.callbacks;
				if (cb && cb.length) {
					this.info('Triggering ' + name + "Begin Callbacks:\n\t", cb);
					for (var x in cb) cb[x].apply(this, [new Event(name+'Begin'), arguments]);
				}
			}
		}
		return this;
	}
	
	function eventEnd(name) {
		if (this.instance) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (this.events[name] && this.events[name].end) {
				var cb = this.events[name].end.callbacks;
				if (cb && cb.length) {
					this.info('Triggering ' + name + "End Callbacks:\n\t", cb);
					for (var x in cb) cb[x].apply(this, [new Event(name+'End'), arguments]);
				}
			}
		}
		return this;
	}
	
	/*------------------------------------------------------------------------*/
	
	function methodArrangeArgs() {
		var args = Array.prototype.slice.call(arguments, 0),
			prefix = this.prefix || this.prototype.prefix,
			ret = [];
		for (var i=0;i<args.length;i++) {
			var a = args[i];
			if (typeof a == 'string') {
				var b = prefix + a;
				if (ret.indexOf(b) == -1 && localStorageHelper.prototype.methods.keyExists(b)) ret.push(b);
				if (ret.indexOf(a) == -1 && localStorageHelper.prototype.methods.keyExists(a)) ret.push(a);
			}
			else if (typeof a == 'number') {
				var b = localStorageHelper.prototype.methods.key.call(localStorageHelper, a)
				if (b && ret.indexOf(b) == -1) ret.push(b);
			}
			else if (a instanceof Array) ret = ret.concat(this.arrangeArgs.apply(this, a));
		}
		return ret;
	}
	
	function methodClear() {
		localStorage.clear();
		return this;
	}
	
	function methodFire(name) {
		var ret = null;
		this.trigger(name+'Begin');
		if (this.instance) {
			if (this.methods[name]) {
				var args = Array.prototype.slice.call(arguments, 1);
				this.debug("Firing Method:\t[" + name + "]\tArguments:\t", args);
				var ret = this.methods[name].apply(this, args);
				ret = ret;
			}
		}
		this.trigger(name+'End');
		return ret;
	}
	
	function methodGetItem() {
		var args = localStorageHelper.prototype.arrangeArgs.apply(this, arguments),
			items = null,
			count = 0;
		if (!args.length) {
			if (this.length) {	//	gets localstorage length
				items = {}
				for (var x in localStorage) {
					var y = localStorage[x];
					try { items[x] = JSON.parse(y); } catch(e) { items[x] = y; }
					count++;
				}
			}
		}
		else if (args.length == 1) {
			if (typeof args[0] == 'string') {	//	everything should come back to this if statement!
				var name = args[0].replace(this.prefix, ''),
					item = null;
				if (localStorage[name]) item = function(n) { try { return JSON.parse(n); } catch(e) {} return n; }(localStorage[name]);
				if (item) {
					var isJQuery = item.hasOwnProperty('type') && item.type == 'jQuery';
					item = item.hasOwnProperty('value') ? item['value'] : item;
					
					if (isJQuery && item instanceof Array && window.hasOwnProperty('jQuery')) {
						var col  = jQuery('<div />');
						for (var x in item) col.append(jQuery(item[x]).get());
						item = col.children();
					}
					
					items = item;
				}
			}
		}
		else if (args.length > 1) {
			items = {};
			for (var x in args) {
				var ax = args[x],
				item = localStorageHelper.prototype.methods.getItem.call(localStorageHelper, args[x]);
				if (item != null) items[args[x]] = item;
			}
		}
		
		return items;
	}
	
	/**	localStorageHelper.key([mixed])
	 *	Retrieve key(s) names or index numbers.
	 *
	 *	@example localStorageHelper.key(); // Returns all current keys in localStorage (these are set items)
	 *	@example localStorageHelper.key(1); // Integer argument will attempt to return key name at that index. Else null.
	 *	@example localStorageHelper.key('name'); // String argument will attempt to return key index with that name. Else null.
	 *	@example localStorageHelper.key(0, 2, 3); // Multiple arguments will cause Object return, whereby prop name is your argument and prop value is return.
	 *	@example localStorageHelper.key([0, 'name']) // Passing an array will have the same effect as above.
	 *	*/
	function methodKey() {
		//	do work
		var args = Array.prototype.slice.call(arguments, 0), ret = null;
		if (!args.length) ret = Object.keys(localStorage);
		else if (1 == args.length) {
			var a = args[0];
			if ("number" == typeof a) ret = localStorage.key(a);
			else if ("string" == typeof a && Object.keys(localStorage).indexOf(a) > -1) ret = Object.keys(localStorage).indexOf(a);
			else if (a instanceof Array) ret = localStorageHelper.prototype.methods.key.apply(localStorageHelper, a);
		}
		else {
			for (var a = {}, c = 0; c < args.length; c++) {
				var b = args[c], d = localStorageHelper.prototype.methods.key(b);
				a[b] || (a[b] = d);
			};
			ret = a ? a : null;
		}
		
		//	return value
		return ret;
	}
	
	function methodKeyExists(name) {
		try { return localStorage[name] ? true : false; } catch(e) {}
		return false;
	}
	
	function methodOff(name, callback) {
		
		if (this.instance) {
			if ((name && 'string' == typeof name) && (callback && 'function' == typeof callback)) {
				var rx = new RegExp('^(([a-z]){3,}([A-Z]{1}[a-z]+){0,1})(Begin|End)$'),
					eventKey = name, eventType = 'end';
				if (rx.test(name)) {
					eventKey = name.match(rx)[1];	//	extract keyName
					eventType = name.match(rx)[4].toLowerCase();	//	extract keyType
				}
				if (this.events[eventKey] && this.events[eventKey][eventType].callbacks) {
					var cbs = this.events[eventKey][eventType].callbacks,
						a = callback.toString().replace(/ |\t|\r|\n/ig, "");
					for (var i=0;i<cbs.length;i++) {
						var b = cbs[i].toString().replace(/ |\t|\r|\n/ig, "");
						if (a == b) cbs.splice(i, 1);
					}
				}
			}
		}
		return this;
	}
	
	function methodOn(name, callback) {
		if (this.instance) {
			if ((name && 'string' == typeof name) && (callback && 'function' == typeof callback)) {
				var rx = new RegExp('^(([a-z]){3,}([A-Z]{1}[a-z]+){0,1})(Begin|End)$'),
					eventKey = name, eventType = 'end';
				if (rx.test(name)) {	//	trigger only begin or end event
					eventKey = name.match(rx)[1];	//	extract keyName
					eventType = name.match(rx)[4].toLowerCase();	//	extract keyType
				}
				if (this.events[eventKey]) {
					var cbs = this.events[eventKey][eventType].callbacks,
						a = callback.toString().replace(/ |\t|\r|\n/ig, "");
					if (cbs.indexOf(a) == -1) this.events[eventKey][eventType].callbacks.push(callback);
				}
				this.info(this.events[eventKey]?true:false, [this.events[eventKey], this.events[eventKey][eventType], this.events[eventKey][eventType].callbacks])
			}
		}
		return this;
	}
	
	function methodRealType(toLower) {
		var r = typeof this;
		try {
			if (window.hasOwnProperty('jQuery') && this.constructor && this.constructor == jQuery) r = 'jQuery';
			else r = this.constructor && this.constructor.name ? this.constructor.name : Object.prototype.toString.call(this).slice(8, -1);
		}
		catch(e) { if (this['toString']) r = this.toString().slice(8, -1); }
		return !toLower ? r : r.toLowerCase();
	}
	
	function methodRemoveItem() {
		var args = localStorageHelper.prototype.arrangeArgs.apply(this, arguments);
		if (args.length) for (var i=0;i<args.length;i++) localStorage.removeItem(args[i]);
		return this;
	}
	
	function methodSetItem() {
		var args = Array.prototype.slice.call(arguments, 0), ret = null;
		
		//	create items object to maintain control of passed params for use in storing
		var items = {};
		
		if (args.length > 1) {
			for (var i=0;i<args.length;i++) {
				var ai = args[i],
					t = localStorageHelper.prototype.realType.call(ai);
				console.log([i && localStorageHelper.prototype.realType.call(args[i-1]) == 'String'], t == 'jQuery', typeof ai == 'object')
				if (i && localStorageHelper.prototype.realType.call(args[i-1]) == 'String') {
					items[args[i-1]] = { type: t, value: ai };
				}
				else if (t == 'jQuery') {
					if (window['jQuery'] && ai['selector']) {
						var eles = [];
						for (var x in ai) {
							if (ai[x] && ai[x]['outerHTML'] && typeof ai[x]['outerHTML'] == 'string') eles.push(ai[x].outerHTML.replace(/>(\n|\r|\t)*</g, '><'));
						}
						if (eles.length) items[ai.selector] = { type: t, value: eles };
					}
				}
				else if (typeof ai == 'object') {
					for (var x in ai) {
						if (x && typeof x == 'string') {
							t = localStorageHelper.prototype.realType.call(ai[x]);
							items[x] = { type: t, value: ai[x] };
						}
					}
				}
			}
		}
		else if (localStorageHelper.prototype.realType.call(args[0]) == 'jQuery') {
			var ai = args[0],
				t = localStorageHelper.prototype.realType.call(ai);
			if (window['jQuery'] && ai['selector']) {
				var eles = [];
				for (var x in ai) {
					if (ai[x] && ai[x]['outerHTML'] && typeof ai[x]['outerHTML'] == 'string') eles.push(ai[x].outerHTML.replace(/>(\n|\r|\t)*</g, '><'));
				}
				if (eles.length) items[ai.selector] = { type: t, value: eles };
			}
		}
		//	items ready! let's do this!
		if (items) for (var x in items) localStorage.setItem(this.prefix+x, JSON.stringify(items[x]));
		return this;
	}
	
	function methodTrigger(name) {
		if (this.instance) {
			if (name && typeof name == 'string') {
				var args = Array.prototype.slice.call(arguments, 1),
					rx = new RegExp('^(([a-z]){3,}([A-Z]{1}[a-z]+){0,1})(Begin|End)$'),
					eventKey = name, eventType = 'end';
				if (rx.test(name)) {	//	trigger only begin or end event
					eventKey = name.match(rx)[1];	//	extract keyName
					eventType = name.match(rx)[4].toLowerCase();	//	extract keyType
					//if (this.events[eventKey]) return this.events[eventKey][eventType].apply(this, Array.prototype.slice.call(arguments, 1));
				}
				this.warn("Triggering Event:\t[" + name + "]\tArguments:\t", args);
				if (this.events[eventKey]) return this.events[eventKey][eventType].apply(this, args);
			}
		}
		return null;
	}
	
	/*------------------------------------------------------------------------*/
	
	Object.defineProperty(localStorageHelper, 'available', { enumerable: true, value: lsAvailable, writeable: false })
	
	Object.defineProperties(localStorageHelper.prototype, {
		'available': { enumerable: true, get: function() { return localStorageHelper.available; }, writeable: false }
		, 'arrangeArgs': { value: methodArrangeArgs }
		, 'callbacks': { value: {} }
		, 'events': { value: {} }
		, 'fire': { value: methodFire }
		, 'keys': { get: function() { return Object.keys(localStorage); } }
		, 'length': { get: function() { return this.available ? localStorage.length : null; } }
		, 'methods': { value: {	//	any method added to this list will be assigned events and a callbacks list for events
			'clear': methodClear
			, 'getItem': methodGetItem
			, 'key': methodKey
			, 'keyExists': methodKeyExists
			, 'removeItem': methodRemoveItem
			, 'setItem': methodSetItem
		} }
		, 'off': { value: methodOff }
		, 'on': { value: methodOn }
		, 'prefix': { value: '__lsh__' }
		, 'realType': { value: methodRealType }
		, 'trigger': { value: methodTrigger }
	});
	
	if (!window.hasOwnProperty('localStorageHelper')) window.localStorageHelper = localStorageHelper;
})();