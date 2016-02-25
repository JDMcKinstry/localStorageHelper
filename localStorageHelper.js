if (Object['defineProperty'] && !window.hasOwnProperty('localStorageHelper')) {
	Object.defineProperty(Window.prototype, 'localStorageHelper', {
		value: function() {
			//	variable for this class
			var $this = this;
			//	set whether if localstorage is isAvailable
			this.isAvailable = function() {
				try { return 'localStorage' in window && window['localStorage'] !== null; }
				catch (e) { return !1 }
			}();
			
			//	check if LS is even available, if not, throw error and process callback method if provided
			if (!this.isAvailable) {
				var msg = "[localStorage] is unavailble!";
				if (arguments.length && typeof arguments[0] == "function") arguments[0].apply($this, [{ isAvailable: this.isAvailable, Error: msg }]);
				throw new Error(msg);
			}
			
			//	simply creates a ticket/key by which to later associate each specific call to this class
			$this.ticket = function(){for(var c=10, a=(Math.random()*eval("1e"+~~(50*Math.random()+50))).toString(36).split(""),b=3;b<a.length;b++)b==~~(Math.random()*b)+1&&a[b].match(/[a-z]/)&&(a[b]=a[b].toUpperCase());a=a.join("");a=a.substr(~~(Math.random()*~~(a.length/3)),~~(Math.random()*(a.length-~~(a.length/3*2)+1))+~~(a.length/3*2));return c?a.substr(a,c):a}();
			$this.ticket = 'lsh_' + $this.ticket;
			
			//	HELPERS
			this.keyExists = function(key) { return this.isAvailable && key !== void 0 && localStorage.key(key); }
			this.keyAtIndex = function(i) { return this.isAvailable ? localStorage.key(i) : void 0; }
			//	returns an array of keys
			this.getKeys = function() {
				if (!this.isAvailable) return void 0; 
				var k = []; 
				for (var i=0;i<localStorage.length;i++) k.push(localStorage.key(i)); 
				return k;
			}
			//	returns array of values
			this.getValues = function() {
				if (!this.isAvailable) return void 0; 
				var v = []; 
				for (var i=0;i<localStorage.length;i++) v.push(this.get(localStorage.key(i))); 
				return v;
			}
			//	(un)serialize	//	credit to http://phpjs.org/ for the following 2 methods
			this.serialize = function(a){var b,d,c,f=c="",h=0;b=function(b){for(var e=0,a=0,d=b.length,c="",a=0;a<d;a++)c=b.charCodeAt(a),e=128>c?e+1:2048>c?e+2:e+3;return e};var k=function(a){var b,d,c=typeof a;if("object"===c&&!a)return"null";if("object"===c){if(!a.constructor)return"object";a=a.constructor.toString();(b=a.match(/(\w+)\(/))&&(a=b[1].toLowerCase());b=["boolean","number","string","array"];for(d in b)if(a===b[d]){c=b[d];break}}return c},g=k(a);switch(g){case "function":b="";break;case "boolean":b="b:"+(a?"1":"0");break;case "number":b=(Math.round(a)===a?"i":"d")+":"+a;break;case "string":b="s:"+b(a)+':"'+a+'"';break;case "array":case "object":b="a";for(d in a)a.hasOwnProperty(d)&&(c=k(a[d]),"function"!==c&&(c=d.match(/^[0-9]+$/)?parseInt(d,10):d,f+=this.serialize(c)+this.serialize(a[d]),h++));b+=":"+h+":{"+f+"}";break;default:b="N"}"object"!==g&&"array"!==g&&(b+=";");return b};
			this.unserialize = function(p){var q=this;error=function(e,f,h,a){throw new q.window[e](f,h,a);};read_until=function(e,f,h){for(var a=2,b=[],g=e.slice(f,f+1);g!=h;)a+f>e.length&&error("Error","Invalid"),b.push(g),g=e.slice(f+(a-1),f+a),a+=1;return[b.length,b.join("")]};read_chrs=function(e,f,h){var a,b,g;g=[];for(a=0;a<h;a++)b=e.slice(f+(a-1),f+a),g.push(b),b=b.charCodeAt(0),b=128>b||160<=b&&255>=b||-1!=[338,339,352,353,376,402,8211,8212,8216,8217,8218,8220,8221,8222,8224,8225,8226,8230,8240,8364,8482].indexOf(b)?0:2048>b?1:2,h-=b;return[g.length,g.join("")]};_unserialize=function(e,f){var h,a,b,g,d,c,k,m,l;d=0;var n=function(a){return a};f||(f=0);h=e.slice(f,f+1).toLowerCase();a=f+2;switch(h){case "i":n=function(a){return parseInt(a,10)};c=read_until(e,a,";");d=c[0];c=c[1];a+=d+1;break;case "b":n=function(a){return 0!==parseInt(a,10)};c=read_until(e,a,";");d=c[0];c=c[1];a+=d+1;break;case "d":n=function(a){return parseFloat(a)};c=read_until(e,a,";");d=c[0];c=c[1];a+=d+1;break;case "n":c=null;break;case "s":c=read_until(e,a,":");d=c[0];b=c[1];a+=d+2;c=read_chrs(e,a+1,parseInt(b,10));d=c[0];c=c[1];a+=d+2;d!=parseInt(b,10)&&d!=c.length&&error("SyntaxError","String length mismatch");break;case "a":c={};b=read_until(e,a,":");d=b[0];b=b[1];a+=d+2;d=parseInt(b,10);g=!0;for(b=0;b<d;b++)k=_unserialize(e,a),m=k[1],k=k[2],a+=m,l=_unserialize(e,a),m=l[1],l=l[2],a+=m,k!==b&&(g=!1),c[k]=l;if(g){g=Array(d);for(b=0;b<d;b++)g[b]=c[b];c=g}a+=1;break;default:error("SyntaxError","Unknown / Unhandled data type(s): "+h)}return[h,a-f,n(c)]};return _unserialize(p+"",0)[2]};
			
			//	get/set/remove/clear local storage item(s) and fire get event
			this.get = function(key) {
				if (this.isAvailable) {
					if (typeof key === "number") key = this.keyAtIndex(key);
					if (this.keyExists(key)) {
						var val;
						try { return val = JSON.parse(localStorage.getItem(key)); }
						catch(err) { return val = localStorage.getItem(key); }
						finally { this.onGet.fire(key, val); }
					}
					else if (key === void 0) { // if no key provided, then assume "get all" and return Object of all items in localStorage
						var a = {};
						try {
							for (var i=0;i<localStorage.length;i++) if (this.keyAtIndex(i)) a[this.keyAtIndex(i)] = this.get(this.keyAtIndex(i));
							return a;
						}
						finally { this.onGet.fire(key, a); }
					}
				}
				return void 0;
			}
			this.set = function(key, value) {
				if (this.isAvailable) this.onSet.fire(key, value, function() {
					try {
						try { localStorage.setItem(key, JSON.stringify(value)); }
						catch(err) { localStorage.setItem(key, value); }
						return true;
					}
					catch(err) {}
					return false;
				}());
				return $this;
			}
			this.remove = function(key) {
				if (this.isAvailable && this.keyExists(key)) this.onRemove.fire(key, this.get(key), function() {
					try { localStorage.removeItem(key); return true; }
					catch(err) { return false; }
				}());
				return $this;
			}
			this.clear = function() {
				if (this.isAvailable) this.onClear.fire(null, null, function() {
					try { localStorage.clear(); return true; }
					catch(err) { return false; }
				}());
				return $this;
			}
			
			//	EVENTS
			function setEvent(eType) {
				var eventName = "on" + (eType.charAt(0).toUpperCase() + eType.slice(1)),
					ret = function(handler) {
						if (typeof handler == "function") {
							var $handlers = this[eventName].handlers,
								strHandler = handler.toString().replace(/ |\t|\r|\n/ig, '');
							for (var x in $handlers) if (strHandler == $handlers[x].toString().replace(/ |\t|\r|\n/ig, '')) return this[eventName];
							$handlers.push(handler);
						}
						return this[eventName];
					}
				ret.fire = function(k, v, s) {
					var $handlers = this.handlers,
						args = { eventType: eType };
					if (k !== undefined && k !== null) args.key = k
					if (v !== undefined && v !== null) args.value = v
					if (s !== undefined && s !== null) args.success = s
					args.url = window.location.toString();
					for (var x in $handlers) $handlers[x].apply($this, [args])
				}
				ret.handlers = [];
				return ret;
			}
			this.on = function(a, b) {
				a = "on" + (a.charAt(0).toUpperCase() + a.slice(1));
				this.hasOwnProperty(a) && this[a].apply($this, [b]);
				return $this;
			};
			this.off = function(a, b) {
				a = "on" + (a.charAt(0).toUpperCase() + a.slice(1));
				if (this.hasOwnProperty(a) && "function" == typeof b) {
					var c = this[a].handlers,
						e = b.toString().replace(/ |\t|\r|\n/ig, ""),
						d;
					for (d in c)
						if (e == c[d].toString().replace(/ |\t|\r|\n/ig, "")) {
							c.splice(d, 1);
							break;
						}
				}
				return $this;
			};
			
			this.onGet = setEvent.apply(this, ['get']);
			this.onSet = setEvent.apply(this, ['set']);
			this.onRemove = setEvent.apply(this, ['remove']);
			this.onClear = setEvent.apply(this, ['clear']);
			
			//	Final summary
			
			return $this;
		}
	});
}
