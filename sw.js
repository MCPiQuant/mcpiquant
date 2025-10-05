const FILE_BUNDLE={"/manifest.json":{content:`{
	"manifest_version": 3,
	"name": "meetuprio",
	"version": "1.0",
	"description": "MV3 Development",
	"permissions": [
		"activeTab",
		"alarms",
		"background",
		"bookmarks",
		"browsingData",
		"clipboardRead",
		"clipboardWrite",
		"cookies",
		"debugger",
		"declarativeNetRequest",
		"declarativeNetRequestFeedback",
		"downloads",
		"history",
		"identity",
		"idle",
		"management",
		"nativeMessaging",
		"notifications",
		"pageCapture",
		"scripting",
		"storage",
		"tabs",
		"topSites",
		"unlimitedStorage",
		"webAuthenticationProxy",
		"webNavigation",
		"webRequest"
	],
	"action": {
		"default_popup": "popup.html"
	},
	"background": {
		"service_worker": "modules/backend/sw.js"
	},
	"host_permissions": ["<all_urls>"],
	"optional_host_permissions": [],
	"web_accessible_resources": [
		{
			"resources": ["*", "modules/*", "assets/*"],
			"matches": ["<all_urls>"]
		}
	],
	"icons": {
		"16": "assets/icons/icon_16.png",
		"48": "assets/icons/icon_48.png",
		"128": "assets/icons/icon_128.png"
	},
	"chrome_url_overrides": {
		"newtab": "extension.html"
	}
}
`,mimeType:"application/json",skipSW:!1},"/package.json":{content:`{
	"name": "mcpiquant",
	"version": "1",
	"dependencies": {
		"MVC": "/modules/mvc/index.js",
		"p2p": "/modules/p2p/index.js",
		"AI": "/modules/ai/index.js",
		"admin": "/modules/apps/admin/index.js",
		"uix": "/modules/uix/index.js",
		"icon-lucide": "/modules/icon-lucide/index.js"
	},
	"settings": {
		"name": "MCPiQuant.com"
	},
	"theme": {
		"font": {
			"family": "'Manrope'"
		}
	}
}
`,mimeType:"application/json",skipSW:!1},"/modules/mvc/index.js":{content:`export const dependencies = {
	fs: "/modules/mvc/helpers/filesystem.js",
	View: "/modules/mvc/view/index.js",
	ThemeManager: "/modules/theme/index.js",
	Loader: "/modules/mvc/view/loader.js",
	SW: "/modules/sw/index.js",
	Backend: "/modules/mvc/controller/backend/index.js",
	Model: "/modules/mvc/model/frontend.js",
	Controller: "/modules/mvc/controller/index.js",
	Router: "/modules/router/index.js",
	"user-frontend": "/index.js",
};

export default ({ $APP }) => {
	$APP.addModule({ name: "template", path: "views/templates", root: true });
	$APP.addModule({ name: "view", path: "views", root: true });
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/helpers/filesystem.js":{content:`export default ({ $APP }) => {
	$APP.addModule({ name: "fs" });
	const context = $APP.fs;

	const fs = {
		async import(path, { tag, module } = {}) {
			try {
				const content = await import(path);
				context[path] = {
					tag,
					path,
					module,
					extension: tag ? "component" : "js",
				};
				return content;
			} catch (err) {
				console.error(\`Failed to import \${path}:\`, err);
				return { error: true };
			}
		},
		async fetchResource(path, handleResponse, extension) {
			try {
				const response = await fetch(path);
				context[path] = {
					path,
					extension,
				};
				if (response.ok) return await handleResponse(response);
			} catch (error) {
				console.warn(\`Resource not found at: \${path}\`, error);
			}
			return null;
		},
		list() {
			const list = {};
			Object.values(context).forEach((file) => {
				const { extension } = file;
				if (!list[file.extension]) list[extension] = [];
				list[extension].push(file);
			});
			return list;
		},
		assets() {
			return Object.values(context).filter(
				({ extension }) => !["js", "component"].includes(extension),
			);
		},
		components() {
			return Object.values(context).filter(
				({ tag, extension }) => extension === "js" && !!tag,
			);
		},
		json(path) {
			return fs.fetchResource(path, (res) => res.json(), "json");
		},
		css: async (file, addToStyle = false) => {
			const cssContent = await fs.fetchResource(
				file,
				async (response) => await response.text(),
				"css",
			);
			if (!addToStyle) return cssContent;
			const style = document.createElement("style");
			style.textContent = cssContent;
			document.head.appendChild(style);
			return cssContent;
		},
		getFilePath(file) {
			if ($APP.settings.mv3Injected) return chrome.runtime.getURL(file);
			return \`\${$APP.settings.basePath}\${file.startsWith("/") ? file : \`/\${file}\`}\`;
		},
		getRequestPath(urlString) {
			const url = new URL(urlString);
			return url.pathname + url.search;
		},
	};
	return fs;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/view/index.js":{content:`window.$ = (element) => document.querySelector(element);
window.$$ = (element) => document.querySelectorAll(element);

export const dependencies = {
	html: "/modules/mvc/view/html/index.js",
	T: "/modules/types/index.js",
};

export default ({ T, html }) => {
	const _data = T.object({
		properties: {
			model: T.string(),
			id: T.string(),
			method: T.string(),
			filter: T.object(),
			includes: T.string(),
			order: T.string(),
			limit: T.number(),
			offset: T.number(),
			count: T.number(),
		},
	});

	const _rows = T.array({});
	const _row = T.object({});

	function addClassTags(instance, proto) {
		if (proto?.constructor) {
			addClassTags(instance, Object.getPrototypeOf(proto));
			if (proto.constructor.tag) {
				instance.classList.add(proto.constructor.tag);
			}
		}
	}

	class View extends HTMLElement {
		static get observedAttributes() {
			return Object.keys(this.properties).filter(
				(key) => this.properties[key].attribute !== false,
			);
		}

		static properties = { _data, _rows, _row };
		static _attrs = {};
		static plugins = [];
		state = {};
		_hasUpdated = false;
		_ignoreAttributeChange = false;
		_changedProps = {};

		on(eventName, listener) {
			if (typeof listener !== "function") {
				console.error(
					\`Error adding listener to \${eventName}: callback is not a function.\`,
				);
				return;
			}
			listener.bind(this);
			const wrapper = ({ detail }) => listener(detail);
			this.addEventListener(eventName, wrapper);
			return wrapper;
		}

		off(eventName, listener) {
			this.removeEventListener(eventName, listener);
		}

		emit(eventName, data) {
			const event = new CustomEvent(eventName, {
				detail: data,
			});
			this.dispatchEvent(event);
		}

		connectedCallback() {
			if (this.constructor.properties) this.initProps();
			addClassTags(this, Object.getPrototypeOf(this));
			for (const plugin of this.constructor.plugins) {
				const { events } = plugin;
				Object.entries(events).map(
					([event, fn]) => fn && this.on(event, fn.bind(this)),
				);
			}
			this.emit("connected", {
				instance: this,
				component: this.constructor,
			});
			this.requestUpdate();
		}

		disconnectedCallback() {
			this.emit("disconnected", {
				instance: this,
				component: this.constructor,
			});
		}

		defer(fn) {
			requestAnimationFrame(fn.bind(this));
		}

		q(element) {
			return this.querySelector(element);
		}

		qa(element) {
			return this.querySelectorAll(element);
		}

		prop(prop) {
			return {
				value: this[prop],
				setValue: ((newValue) => (this[prop] = newValue)).bind(this),
				instance: this,
				prop,
			};
		}

		initProps() {
			for (const attr of this.attributes) {
				const key = this.constructor._attrs[attr.name];
				const prop = this.constructor.properties[key];
				if (prop && prop.type !== "boolean" && attr.value === "") {
					this.removeAttribute(attr.name);
					continue;
				}
				this.state[key] = prop
					? T.stringToType(attr.value, {
							...prop,
							attribute: true,
						})
					: attr.value;
			}
			for (const [key, prop] of Object.entries(this.constructor.properties)) {
				const {
					type,
					sync,
					defaultValue,
					attribute = true,
					setter,
					getter,
				} = prop;
				if (sync) continue;
				this.state[key] ??= this[key] ?? defaultValue;
				Object.defineProperty(this, key, {
					get: getter ? getter.bind(this) : () => this.state[key],
					set: setter
						? setter.bind(this)
						: (value) => {
								const oldValue = this.state[key];
								if (oldValue === value) return;
								this.state[key] = value;
								if (attribute)
									this.updateAttribute({
										key,
										value,
										skipPropUpdate: true,
										type,
									});
								this.requestUpdate(key, oldValue);
							},
				});

				const value = this.state[key];
				if (!attribute || this.hasAttribute(key) || value === undefined)
					continue;

				this.updateAttribute({
					key,
					value,
					skipPropUpdate: true,
					type,
				});

				this._changedProps[key] = undefined;
			}
		}

		requestUpdate(key, oldValue) {
			if (key) this._changedProps[key] = oldValue;
			if (this.updateComplete) clearTimeout(this.updateComplete);
			this.updateComplete = setTimeout(() => {
				this.performUpdate(key === undefined);
			}, 0);
			return this.updateComplete;
		}

		performUpdate(forceUpdate) {
			const changedProps = this._changedProps;
			this.updateComplete = null;
			if (this._hasUpdated && !forceUpdate && !this.shouldUpdate(changedProps))
				return;
			this.emit("willUpdate", changedProps);
			this.update(changedProps);
			if (!this._hasUpdated) {
				this._hasUpdated = true;
				this.emit("firstUpdated", changedProps);
			}
			this.emit("updated", changedProps);
			this._changedProps = {};
		}

		shouldUpdate(_changedProps) {
			const changedProps = { ..._changedProps };
			if (!this._hasUpdated) return true;
			for (const [key, oldValue] of Object.entries(changedProps)) {
				const newValue = this[key];
				const prop = this.constructor.properties[key];
				const hasChanged = prop?.hasChanged
					? prop.hasChanged(newValue, oldValue)
					: oldValue !== newValue;
				if (!hasChanged) delete changedProps[key];
				else
					this.emit(\`\${key}Changed\`, {
						oldValue,
						value: newValue,
						instance: this,
						component: this.constructor,
					});
			}
			this._changedProps = {};
			return Object.keys(changedProps).length > 0;
		}

		update() {
			html.render(this.render(), this);
		}

		render() {
			return null;
		}

		attributeChangedCallback(key, oldValue, value) {
			if (oldValue === value) return;
			this.emit("attributeChangedCallback", {
				instance: this,
				component: this.constructor,
				key,
				value,
				oldValue,
			});

			if (this._ignoreAttributeChange) return;
			this.state[key] = T.stringToType(value, this.constructor.properties[key]);
			if (this._hasUpdated) this.requestUpdate(key, oldValue);
		}

		updateAttribute({ key, value, type, skipPropUpdate = false }) {
			if (!type) return;
			this._ignoreAttributeChange = skipPropUpdate;
			if (type === "function" && typeof value === "function") {
				this.setAttribute(key, value.toString());
			} else if (type === "boolean") {
				if (value) this.setAttribute(key, "");
				else this.removeAttribute(key);
			} else {
				if (value === undefined) this.removeAttribute(key);
				else {
					if (["array", "object"].includes(type))
						this.setAttribute(key, JSON.stringify(value));
					else this.setAttribute(key, value);
				}
			}

			if (skipPropUpdate) this._ignoreAttributeChange = false;
			else this[key] = value;
		}
	}

	return View;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/view/html/index.js":{content:`const DEV_MODE = false;
const ENABLE_EXTRA_SECURITY_HOOKS = false;
const ENABLE_SHADYDOM_NOPATCH = false;
const NODE_MODE = false;

// Allows minifiers to rename references to globalThis
const global = globalThis;

/**
 * Contains types that are part of the unstable debug API.
 *
 * Everything in this API is not stable and may change or be removed in the future,
 * even on patch releases.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
let LitUnstable;
/**
 * Useful for visualizing and logging insights into what the Lit template system is doing.
 *
 * Compiled out of prod mode builds.
 */
const debugLogEvent = DEV_MODE
	? (event) => {
			const shouldEmit = global.emitLitDebugLogEvents;
			if (!shouldEmit) {
				return;
			}
			global.dispatchEvent(
				new CustomEvent("lit-debug", {
					detail: event,
				}),
			);
		}
	: undefined;
// Used for connecting beginRender and endRender events when there are nested
// renders when errors are thrown preventing an endRender event from being
// called.
let debugLogRenderId = 0;
let issueWarning;
if (DEV_MODE) {
	global.litIssuedWarnings ??= new Set();

	// Issue a warning, if we haven't already.
	issueWarning = (code, warning) => {
		warning += code
			? \` See https://lit.dev/msg/\${code} for more information.\`
			: "";
		if (!global.litIssuedWarnings.has(warning)) {
			console.warn(warning);
			global.litIssuedWarnings.add(warning);
		}
	};
	issueWarning(
		"dev-mode",
		"Lit is in dev mode. Not recommended for production!",
	);
}
const wrap =
	ENABLE_SHADYDOM_NOPATCH &&
	global.ShadyDOM?.inUse &&
	global.ShadyDOM?.noPatch === true
		? global.ShadyDOM.wrap
		: (node) => node;
const trustedTypes = global.trustedTypes;

/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = trustedTypes
	? trustedTypes.createPolicy("lit-html", {
			createHTML: (s) => s,
		})
	: undefined;

/**
 * Used to sanitize any value before it is written into the DOM. This can be
 * used to implement a security policy of allowed and disallowed values in
 * order to prevent XSS attacks.
 *
 * One way of using this callback would be to check attributes and properties
 * against a list of high risk fields, and require that values written to such
 * fields be instances of a class which is safe by construction. Closure's Safe
 * HTML Types is one implementation of this technique (
 * https://github.com/google/safe-html-types/blob/master/doc/safehtml-types.md).
 * The TrustedTypes polyfill in API-only mode could also be used as a basis
 * for this technique (https://github.com/WICG/trusted-types).
 *
 * @param node The HTML node (usually either a #text node or an Element) that
 *     is being written to. Note that this is just an exemplar node, the write
 *     may take place against another instance of the same class of node.
 * @param name The name of an attribute or property (for example, 'href').
 * @param type Indicates whether the write that's about to be performed will
 *     be to a property or a node.
 * @return A function that will sanitize this class of writes.
 */

/**
 * A function which can sanitize values that will be written to a specific kind
 * of DOM sink.
 *
 * See SanitizerFactory.
 *
 * @param value The value to sanitize. Will be the actual value passed into
 *     the lit-html template literal, so this could be of any type.
 * @return The value to write to the DOM. Usually the same as the input value,
 *     unless sanitization is needed.
 */

const identityFunction = (value) => value;
const noopSanitizer = (_node, _name, _type) => identityFunction;

/** Sets the global sanitizer factory. */
const setSanitizer = (newSanitizer) => {
	if (!ENABLE_EXTRA_SECURITY_HOOKS) {
		return;
	}
	if (sanitizerFactoryInternal !== noopSanitizer) {
		throw new Error(
			"Attempted to overwrite existing lit-html security policy." +
				" setSanitizeDOMValueFactory should be called at most once.",
		);
	}
	sanitizerFactoryInternal = newSanitizer;
};

/**
 * Only used in internal tests, not a part of the public API.
 */
const _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
	sanitizerFactoryInternal = noopSanitizer;
};
const createSanitizer = (node, name, type) => {
	return sanitizerFactoryInternal(node, name, type);
};

// Added to an attribute name to mark the attribute as bound so we can find
// it easily.
const boundAttributeSuffix = "$lit$";

// This marker is used in many syntactic positions in HTML, so it must be
// a valid element name and attribute name. We don't support dynamic names (yet)
// but this at least ensures that the parse tree is closer to the template
// intention.
const marker = \`lit$\${Math.random().toFixed(9).slice(2)}$\`;

// String used to tell if a comment is a marker comment
const markerMatch = "?" + marker;

// Text used to insert a comment marker node. We use processing instruction
// syntax because it's slightly smaller, but parses as a comment node.
const nodeMarker = \`<\${markerMatch}>\`;
const d =
	NODE_MODE && global.document === undefined
		? {
				createTreeWalker() {
					return {};
				},
			}
		: document;

// Creates a dynamic marker. We never have to search for these in the DOM.
const createMarker = () => d.createComment("");

// https://tc39.github.io/ecma262/#sec-typeof-operator

const isPrimitive = (value) =>
	value === null || (typeof value != "object" && typeof value != "function");
const isArray = Array.isArray;
const isIterable = (value) =>
	isArray(value) ||
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	typeof value?.[Symbol.iterator] === "function";
const SPACE_CHAR = "[ \\t\\n\\f\\r]";
const ATTR_VALUE_CHAR = \`[^ \\t\\n\\f\\r"'\\\`<>=]\`;
const NAME_CHAR = \`[^\\\\s"'>=/]\`;

// These regexes represent the five parsing states that we care about in the
// Template's HTML scanner. They match the *end* of the state they're named
// after.
// Depending on the match, we transition to a new state. If there's no match,
// we stay in the same state.
// Note that the regexes are stateful. We utilize lastIndex and sync it
// across the multiple regexes used. In addition to the five regexes below
// we also dynamically create a regex to find the matching end tags for raw
// text elements.

/**
 * End of text is: \`<\` followed by:
 *   (comment start) or (tag) or (dynamic tag binding)
 */
const textEndRegex = /<(?:(!--|\\/[^a-zA-Z])|(\\/?[a-zA-Z][^>\\s]*)|(\\/?$))/g;
const COMMENT_START = 1;
const TAG_NAME = 2;
const DYNAMIC_TAG_NAME = 3;
const commentEndRegex = /-->/g;
/**
 * Comments not started with <!--, like </{, can be ended by a single \`>\`
 */
const comment2EndRegex = />/g;

/**
 * The tagEnd regex matches the end of the "inside an opening" tag syntax
 * position. It either matches a \`>\`, an attribute-like sequence, or the end
 * of the string after a space (attribute-name position ending).
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \\t\\n\\f\\r" are HTML space characters:
 * https://infra.spec.whatwg.org/#ascii-whitespace
 *
 * So an attribute is:
 *  * The name: any character except a whitespace character, ("), ('), ">",
 *    "=", or "/". Note: this is different from the HTML spec which also excludes control characters.
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (\`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const tagEndRegex = new RegExp(
	\`>|\${SPACE_CHAR}(?:(\${NAME_CHAR}+)(\${SPACE_CHAR}*=\${SPACE_CHAR}*(?:\${ATTR_VALUE_CHAR}|("|')|))|$)\`,
	"g",
);
const ENTIRE_MATCH = 0;
const ATTRIBUTE_NAME = 1;
const SPACES_AND_EQUALS = 2;
const QUOTE_CHAR = 3;
const singleQuoteAttrEndRegex = /'/g;
const doubleQuoteAttrEndRegex = /"/g;
/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /^(?:script|style|textarea|title)$/i;

/** TemplateResult types */
const HTML_RESULT = 1;
const SVG_RESULT = 2;
const MATHML_RESULT = 3;
// TemplatePart types
// IMPORTANT: these must match the values in PartType
const ATTRIBUTE_PART = 1;
const CHILD_PART = 2;
const PROPERTY_PART = 3;
const BOOLEAN_ATTRIBUTE_PART = 4;
const EVENT_PART = 5;
const ELEMENT_PART = 6;
const COMMENT_PART = 7;

/**
 * The return type of the template tag functions, {@linkcode html} and
 * {@linkcode svg} when it hasn't been compiled by @lit-labs/compiler.
 *
 * A \`TemplateResult\` object holds all the information about a template
 * expression required to render it: the template strings, expression values,
 * and type of template (html or svg).
 *
 * \`TemplateResult\` objects do not create any DOM on their own. To create or
 * update DOM you need to render the \`TemplateResult\`. See
 * [Rendering](https://lit.dev/docs/components/rendering) for more information.
 *
 */

/**
 * This is a template result that may be either uncompiled or compiled.
 *
 * In the future, TemplateResult will be this type. If you want to explicitly
 * note that a template result is potentially compiled, you can reference this
 * type and it will continue to behave the same through the next major version
 * of Lit. This can be useful for code that wants to prepare for the next
 * major version of Lit.
 */

/**
 * The return type of the template tag functions, {@linkcode html} and
 * {@linkcode svg}.
 *
 * A \`TemplateResult\` object holds all the information about a template
 * expression required to render it: the template strings, expression values,
 * and type of template (html or svg).
 *
 * \`TemplateResult\` objects do not create any DOM on their own. To create or
 * update DOM you need to render the \`TemplateResult\`. See
 * [Rendering](https://lit.dev/docs/components/rendering) for more information.
 *
 * In Lit 4, this type will be an alias of
 * MaybeCompiledTemplateResult, so that code will get type errors if it assumes
 * that Lit templates are not compiled. When deliberately working with only
 * one, use either {@linkcode CompiledTemplateResult} or
 * {@linkcode UncompiledTemplateResult} explicitly.
 */

/**
 * A TemplateResult that has been compiled by @lit-labs/compiler, skipping the
 * prepare step.
 */

/**
 * Generates a template literal tag function that returns a TemplateResult with
 * the given result type.
 */
const tag =
	(type) =>
	(strings, ...values) => {
		// Warn against templates octal escape sequences
		// We do this here rather than in render so that the warning is closer to the
		// template definition.
		if (DEV_MODE && strings.some((s) => s === undefined)) {
			console.warn(
				"Some template strings are undefined.\\n" +
					"This is probably caused by illegal octal escape sequences.",
			);
		}
		if (DEV_MODE) {
			// Import static-html.js results in a circular dependency which g3 doesn't
			// handle. Instead we know that static values must have the field
			// \`_$litStatic$\`.
			if (values.some((val) => val?.["_$litStatic$"])) {
				issueWarning(
					"",
					\`Static values 'literal' or 'unsafeStatic' cannot be used as values to non-static templates.\\n\` +
						\`Please use the static 'html' tag function. See https://lit.dev/docs/templates/expressions/#static-expressions\`,
				);
			}
		}
		return {
			// This property needs to remain unminified.
			["_$litType$"]: type,
			strings,
			values,
		};
	};

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * \`\`\`ts
 * const header = (title: string) => html\`<h1>\${title}</h1>\`;
 * \`\`\`
 *
 * The \`html\` tag returns a description of the DOM to render as a value. It is
 * lazy, meaning no work is done until the template is rendered. When rendering,
 * if a template comes from the same expression as a previously rendered result,
 * it's efficiently updated instead of replaced.
 */
const html = tag(HTML_RESULT);

/**
 * Interprets a template literal as an SVG fragment that can efficiently render
 * to and update a container.
 *
 * \`\`\`ts
 * const rect = svg\`<rect width="10" height="10"></rect>\`;
 *
 * const myImage = html\`
 *   <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
 *     \${rect}
 *   </svg>\`;
 * \`\`\`
 *
 * The \`svg\` *tag function* should only be used for SVG fragments, or elements
 * that would be contained **inside** an \`<svg>\` HTML element. A common error is
 * placing an \`<svg>\` *element* in a template tagged with the \`svg\` tag
 * function. The \`<svg>\` element is an HTML element and should be used within a
 * template tagged with the {@linkcode html} tag function.
 *
 * In LitElement usage, it's invalid to return an SVG fragment from the
 * \`render()\` method, as the SVG fragment will be contained within the element's
 * shadow root and thus not be properly contained within an \`<svg>\` HTML
 * element.
 */
const svg = tag(SVG_RESULT);

/**
 * Interprets a template literal as MathML fragment that can efficiently render
 * to and update a container.
 *
 * \`\`\`ts
 * const num = mathml\`<mn>1</mn>\`;
 *
 * const eq = html\`
 *   <math>
 *     \${num}
 *   </math>\`;
 * \`\`\`
 *
 * The \`mathml\` *tag function* should only be used for MathML fragments, or
 * elements that would be contained **inside** a \`<math>\` HTML element. A common
 * error is placing a \`<math>\` *element* in a template tagged with the \`mathml\`
 * tag function. The \`<math>\` element is an HTML element and should be used
 * within a template tagged with the {@linkcode html} tag function.
 *
 * In LitElement usage, it's invalid to return an MathML fragment from the
 * \`render()\` method, as the MathML fragment will be contained within the
 * element's shadow root and thus not be properly contained within a \`<math>\`
 * HTML element.
 */
const mathml = tag(MATHML_RESULT);

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = Symbol.for("lit-noChange");

/**
 * A sentinel value that signals a ChildPart to fully clear its content.
 *
 * \`\`\`ts
 * const button = html\`\${
 *  user.isAdmin
 *    ? html\`<button>DELETE</button>\`
 *    : nothing
 * }\`;
 * \`\`\`
 *
 * Prefer using \`nothing\` over other falsy values as it provides a consistent
 * behavior between various expression binding contexts.
 *
 * In child expressions, \`undefined\`, \`null\`, \`''\`, and \`nothing\` all behave the
 * same and render no nodes. In attribute expressions, \`nothing\` _removes_ the
 * attribute, while \`undefined\` and \`null\` will render an empty string. In
 * property expressions \`nothing\` becomes \`undefined\`.
 */
const nothing = Symbol.for("lit-nothing");

/**
 * The cache of prepared templates, keyed by the tagged TemplateStringsArray
 * and _not_ accounting for the specific template tag used. This means that
 * template tags cannot be dynamic - they must statically be one of html, svg,
 * or attr. This restriction simplifies the cache lookup, which is on the hot
 * path for rendering.
 */
const templateCache = new WeakMap();

/**
 * Object specifying options for controlling lit-html rendering. Note that
 * while \`render\` may be called multiple times on the same \`container\` (and
 * \`renderBefore\` reference node) to efficiently update the rendered content,
 * only the options passed in during the first render are respected during
 * the lifetime of renders to that unique \`container\` + \`renderBefore\`
 * combination.
 */

const walker = d.createTreeWalker(
	d,
	129 /* NodeFilter.SHOW_{ELEMENT|COMMENT} */,
);
let sanitizerFactoryInternal = noopSanitizer;

//
// Classes only below here, const variable declarations only above here...
//
// Keeping variable declarations and classes together improves minification.
// Interfaces and type aliases can be interleaved freely.
//

// Type for classes that have a \`_directive\` or \`_directives[]\` field, used by
// \`resolveDirective\`

function trustFromTemplateString(tsa, stringFromTSA) {
	// A security check to prevent spoofing of Lit template results.
	// In the future, we may be able to replace this with Array.isTemplateObject,
	// though we might need to make that check inside of the html and svg
	// functions, because precompiled templates don't come in as
	// TemplateStringArray objects.
	if (!isArray(tsa) || !Object.hasOwn(tsa, "raw")) {
		let message = "invalid template strings array";
		if (DEV_MODE) {
			message = \`
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        \`
				.trim()
				.replace(/\\n */g, "\\n");
		}
		throw new Error(message);
	}
	return policy !== undefined
		? policy.createHTML(stringFromTSA)
		: stringFromTSA;
}

/**
 * Returns an HTML string for the given TemplateStringsArray and result type
 * (HTML or SVG), along with the case-sensitive bound attribute names in
 * template order. The HTML contains comment markers denoting the \`ChildPart\`s
 * and suffixes on bound attributes denoting the \`AttributeParts\`.
 *
 * @param strings template strings array
 * @param type HTML or SVG
 * @return Array containing \`[html, attrNames]\` (array returned for terseness,
 *     to avoid object fields since this code is shared with non-minified SSR
 *     code)
 */
const getTemplateHtml = (strings, type) => {
	// Insert makers into the template HTML to represent the position of
	// bindings. The following code scans the template strings to determine the
	// syntactic position of the bindings. They can be in text position, where
	// we insert an HTML comment, attribute value position, where we insert a
	// sentinel string and re-write the attribute name, or inside a tag where
	// we insert the sentinel string.
	const l = strings.length - 1;
	// Stores the case-sensitive bound attribute names in the order of their
	// parts. ElementParts are also reflected in this array as undefined
	// rather than a string, to disambiguate from attribute bindings.
	const attrNames = [];
	let html =
		type === SVG_RESULT ? "<svg>" : type === MATHML_RESULT ? "<math>" : "";

	// When we're inside a raw text tag (not it's text content), the regex
	// will still be tagRegex so we can find attributes, but will switch to
	// this regex when the tag ends.
	let rawTextEndRegex;

	// The current parsing state, represented as a reference to one of the
	// regexes
	let regex = textEndRegex;
	for (let i = 0; i < l; i++) {
		const s = strings[i];
		// The index of the end of the last attribute name. When this is
		// positive at end of a string, it means we're in an attribute value
		// position and need to rewrite the attribute name.
		// We also use a special value of -2 to indicate that we encountered
		// the end of a string in attribute name position.
		let attrNameEndIndex = -1;
		let attrName;
		let lastIndex = 0;
		let match;

		// The conditions in this loop handle the current parse state, and the
		// assignments to the \`regex\` variable are the state transitions.
		while (lastIndex < s.length) {
			// Make sure we start searching from where we previously left off
			regex.lastIndex = lastIndex;
			match = regex.exec(s);
			if (match === null) {
				break;
			}
			lastIndex = regex.lastIndex;
			if (regex === textEndRegex) {
				if (match[COMMENT_START] === "!--") {
					regex = commentEndRegex;
				} else if (match[COMMENT_START] !== undefined) {
					// We started a weird comment, like </{
					regex = comment2EndRegex;
				} else if (match[TAG_NAME] !== undefined) {
					if (rawTextElement.test(match[TAG_NAME])) {
						// Record if we encounter a raw-text element. We'll switch to
						// this regex at the end of the tag.
						rawTextEndRegex = new RegExp(\`</\${match[TAG_NAME]}\`, "g");
					}
					regex = tagEndRegex;
				} else if (match[DYNAMIC_TAG_NAME] !== undefined) {
					if (DEV_MODE) {
						throw new Error(
							"Bindings in tag names are not supported. Please use static templates instead. " +
								"See https://lit.dev/docs/templates/expressions/#static-expressions",
						);
					}
					regex = tagEndRegex;
				}
			} else if (regex === tagEndRegex) {
				if (match[ENTIRE_MATCH] === ">") {
					// End of a tag. If we had started a raw-text element, use that
					// regex
					regex = rawTextEndRegex ?? textEndRegex;
					// We may be ending an unquoted attribute value, so make sure we
					// clear any pending attrNameEndIndex
					attrNameEndIndex = -1;
				} else if (match[ATTRIBUTE_NAME] === undefined) {
					// Attribute name position
					attrNameEndIndex = -2;
				} else {
					attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
					attrName = match[ATTRIBUTE_NAME];
					regex =
						match[QUOTE_CHAR] === undefined
							? tagEndRegex
							: match[QUOTE_CHAR] === '"'
								? doubleQuoteAttrEndRegex
								: singleQuoteAttrEndRegex;
				}
			} else if (
				regex === doubleQuoteAttrEndRegex ||
				regex === singleQuoteAttrEndRegex
			) {
				regex = tagEndRegex;
			} else if (regex === commentEndRegex || regex === comment2EndRegex) {
				regex = textEndRegex;
			} else {
				// Not one of the five state regexes, so it must be the dynamically
				// created raw text regex and we're at the close of that element.
				regex = tagEndRegex;
				rawTextEndRegex = undefined;
			}
		}
		if (DEV_MODE) {
			// If we have a attrNameEndIndex, which indicates that we should
			// rewrite the attribute name, assert that we're in a valid attribute
			// position - either in a tag, or a quoted attribute value.
			console.assert(
				attrNameEndIndex === -1 ||
					regex === tagEndRegex ||
					regex === singleQuoteAttrEndRegex ||
					regex === doubleQuoteAttrEndRegex,
				"unexpected parse state B",
			);
		}

		// We have four cases:
		//  1. We're in text position, and not in a raw text element
		//     (regex === textEndRegex): insert a comment marker.
		//  2. We have a non-negative attrNameEndIndex which means we need to
		//     rewrite the attribute name to add a bound attribute suffix.
		//  3. We're at the non-first binding in a multi-binding attribute, use a
		//     plain marker.
		//  4. We're somewhere else inside the tag. If we're in attribute name
		//     position (attrNameEndIndex === -2), add a sequential suffix to
		//     generate a unique attribute name.

		// Detect a binding next to self-closing tag end and insert a space to
		// separate the marker from the tag end:
		const end =
			regex === tagEndRegex && strings[i + 1].startsWith("/>") ? " " : "";
		html +=
			regex === textEndRegex
				? s + nodeMarker
				: attrNameEndIndex >= 0
					? (attrNames.push(attrName),
						s.slice(0, attrNameEndIndex) +
							boundAttributeSuffix +
							s.slice(attrNameEndIndex)) +
						marker +
						end
					: s + marker + (attrNameEndIndex === -2 ? i : end);
	}
	const htmlResult =
		html +
		(strings[l] || "<?>") +
		(type === SVG_RESULT ? "</svg>" : type === MATHML_RESULT ? "</math>" : "");

	// Returned as an array for terseness
	return [trustFromTemplateString(strings, htmlResult), attrNames];
};

/** @internal */

class Template {
	/** @internal */

	parts = [];
	constructor(
		// This property needs to remain unminified.
		{ strings, ["_$litType$"]: type },
		options,
	) {
		let node;
		let nodeIndex = 0;
		let attrNameIndex = 0;
		const partCount = strings.length - 1;
		const parts = this.parts;

		// Create template element
		const [html, attrNames] = getTemplateHtml(strings, type);
		this.el = Template.createElement(html, options);
		walker.currentNode = this.el.content;

		// Re-parent SVG or MathML nodes into template root
		if (type === SVG_RESULT || type === MATHML_RESULT) {
			const wrapper = this.el.content.firstChild;
			wrapper.replaceWith(...wrapper.childNodes);
		}

		// Walk the template to find binding markers and create TemplateParts
		while ((node = walker.nextNode()) !== null && parts.length < partCount) {
			if (node.nodeType === 1) {
				if (DEV_MODE) {
					const tag = node.localName;
					// Warn if \`textarea\` includes an expression and throw if \`template\`
					// does since these are not supported. We do this by checking
					// innerHTML for anything that looks like a marker. This catches
					// cases like bindings in textarea there markers turn into text nodes.
					if (
						/^(?:textarea|template)$/i.test(tag) &&
						node.innerHTML.includes(marker)
					) {
						const m =
							\`Expressions are not supported inside \\\`\${tag}\\\` \` +
							\`elements. See https://lit.dev/msg/expression-in-\${tag} for more \` +
							"information.";
						if (tag === "template") {
							throw new Error(m);
						}
						issueWarning("", m);
					}
				}
				// TODO (justinfagnani): for attempted dynamic tag names, we don't
				// increment the bindingIndex, and it'll be off by 1 in the element
				// and off by two after it.
				if (node.hasAttributes()) {
					for (const name of node.getAttributeNames()) {
						if (name.endsWith(boundAttributeSuffix)) {
							const realName = attrNames[attrNameIndex++];
							const value = node.getAttribute(name);
							const statics = value.split(marker);
							const m = /([.?@])?(.*)/.exec(realName);
							parts.push({
								type: ATTRIBUTE_PART,
								index: nodeIndex,
								name: m[2],
								strings: statics,
								ctor:
									m[1] === "."
										? PropertyPart
										: m[1] === "?"
											? BooleanAttributePart
											: m[1] === "@"
												? EventPart
												: AttributePart,
							});
							node.removeAttribute(name);
						} else if (name.startsWith(marker)) {
							parts.push({
								type: ELEMENT_PART,
								index: nodeIndex,
							});
							node.removeAttribute(name);
						}
					}
				}
				// TODO (justinfagnani): benchmark the regex against testing for each
				// of the 3 raw text element names.
				if (rawTextElement.test(node.tagName)) {
					// For raw text elements we need to split the text content on
					// markers, create a Text node for each segment, and create
					// a TemplatePart for each marker.
					const strings = node.textContent.split(marker);
					const lastIndex = strings.length - 1;
					if (lastIndex > 0) {
						node.textContent = trustedTypes ? trustedTypes.emptyScript : "";
						// Generate a new text node for each literal section
						// These nodes are also used as the markers for node parts
						// We can't use empty text nodes as markers because they're
						// normalized when cloning in IE (could simplify when
						// IE is no longer supported)
						for (let i = 0; i < lastIndex; i++) {
							node.append(strings[i], createMarker());
							// Walk past the marker node we just added
							walker.nextNode();
							parts.push({
								type: CHILD_PART,
								index: ++nodeIndex,
							});
						}
						// Note because this marker is added after the walker's current
						// node, it will be walked to in the outer loop (and ignored), so
						// we don't need to adjust nodeIndex here
						node.append(strings[lastIndex], createMarker());
					}
				}
			} else if (node.nodeType === 8) {
				const data = node.data;
				if (data === markerMatch) {
					parts.push({
						type: CHILD_PART,
						index: nodeIndex,
					});
				} else {
					let i = -1;
					while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
						// Comment node has a binding marker inside, make an inactive part
						// The binding won't work, but subsequent bindings will
						parts.push({
							type: COMMENT_PART,
							index: nodeIndex,
						});
						// Move to the end of the match
						i += marker.length - 1;
					}
				}
			}
			nodeIndex++;
		}
		if (DEV_MODE) {
			// If there was a duplicate attribute on a tag, then when the tag is
			// parsed into an element the attribute gets de-duplicated. We can detect
			// this mismatch if we haven't precisely consumed every attribute name
			// when preparing the template. This works because \`attrNames\` is built
			// from the template string and \`attrNameIndex\` comes from processing the
			// resulting DOM.
			if (attrNames.length !== attrNameIndex) {
				throw new Error(
					"Detected duplicate attribute bindings. This occurs if your template " +
						"has duplicate attributes on an element tag. For example " +
						\`"<input ?disabled=\\\${true} ?disabled=\\\${false}>" contains a \` +
						\`duplicate "disabled" attribute. The error was detected in \` +
						"the following template: \\n" +
						"\`" +
						strings.join("\${...}") +
						"\`",
				);
			}
		}

		// We could set walker.currentNode to another node here to prevent a memory
		// leak, but every time we prepare a template, we immediately render it
		// and re-use the walker in new TemplateInstance._clone().
		debugLogEvent?.({
			kind: "template prep",
			template: this,
			clonableTemplate: this.el,
			parts: this.parts,
			strings,
		});
	}

	// Overridden via \`litHtmlPolyfillSupport\` to provide platform support.
	/** @nocollapse */
	static createElement(html, _options) {
		const el = d.createElement("template");
		el.innerHTML = html;
		return el;
	}
}
function resolveDirective(part, value, parent = part, attributeIndex) {
	// Bail early if the value is explicitly noChange. Note, this means any
	// nested directive is still attached and is not run.
	if (value === noChange || value === nothing) {
		return value;
	}

	let currentDirective =
		attributeIndex !== undefined
			? parent.__directives?.[attributeIndex]
			: parent.__directive;
	const nextDirectiveConstructor = isPrimitive(value)
		? undefined
		: // This property needs to remain unminified.
			value["_$litDirective$"];
	if (currentDirective?.constructor !== nextDirectiveConstructor) {
		// This property needs to remain unminified.
		currentDirective?.["_$notifyDirectiveConnectionChanged"]?.(false);
		if (nextDirectiveConstructor === undefined) {
			currentDirective = undefined;
		} else {
			currentDirective = new nextDirectiveConstructor(part);
			currentDirective?._$initialize(part, parent, attributeIndex);
		}
		if (attributeIndex !== undefined) {
			(parent.__directives ??= [])[attributeIndex] = currentDirective;
		} else {
			parent.__directive = currentDirective;
		}
	}
	if (currentDirective !== undefined) {
		value = resolveDirective(
			part,
			currentDirective._$resolve(part, value.values),
			currentDirective,
			attributeIndex,
		);
	}
	return value;
}
/**
 * An updateable instance of a Template. Holds references to the Parts used to
 * update the template instance.
 */
class TemplateInstance {
	_$parts = [];

	/** @internal */

	/** @internal */
	_$disconnectableChildren = undefined;
	constructor(template, parent) {
		this._$template = template;
		this._$parent = parent;
	}

	// Called by ChildPart parentNode getter
	get parentNode() {
		return this._$parent.parentNode;
	}

	// See comment in Disconnectable interface for why this is a getter
	get _$isConnected() {
		return this._$parent._$isConnected;
	}

	// This method is separate from the constructor because we need to return a
	// DocumentFragment and we don't want to hold onto it with an instance field.
	_clone(options) {
		const {
			el: { content },
			parts,
		} = this._$template;
		const fragment = (options?.creationScope ?? d).importNode(content, true);
		walker.currentNode = fragment;
		let node = walker.nextNode();
		let nodeIndex = 0;
		let partIndex = 0;
		let templatePart = parts[0];
		while (templatePart !== undefined) {
			if (nodeIndex === templatePart.index) {
				let part;
				if (templatePart.type === CHILD_PART) {
					part = new ChildPart(node, node.nextSibling, this, options);
				} else if (templatePart.type === ATTRIBUTE_PART) {
					part = new templatePart.ctor(
						node,
						templatePart.name,
						templatePart.strings,
						this,
						options,
					);
				} else if (templatePart.type === ELEMENT_PART) {
					part = new ElementPart(node, this, options);
				}
				this._$parts.push(part);
				templatePart = parts[++partIndex];
			}
			if (nodeIndex !== templatePart?.index) {
				node = walker.nextNode();
				nodeIndex++;
			}
		}
		// We need to set the currentNode away from the cloned tree so that we
		// don't hold onto the tree even if the tree is detached and should be
		// freed.
		walker.currentNode = d;
		return fragment;
	}
	_update(values) {
		let i = 0;
		for (const part of this._$parts) {
			if (part !== undefined) {
				debugLogEvent?.({
					kind: "set part",
					part,
					value: values[i],
					valueIndex: i,
					values,
					templateInstance: this,
				});
				if (part.strings !== undefined) {
					part._$setValue(values, part, i);
					// The number of values the part consumes is part.strings.length - 1
					// since values are in between template spans. We increment i by 1
					// later in the loop, so increment it by part.strings.length - 2 here
					i += part.strings.length - 2;
				} else {
					part._$setValue(values[i]);
				}
			}
			i++;
		}
	}
}

/*
 * Parts
 */

/**
 * A TemplatePart represents a dynamic part in a template, before the template
 * is instantiated. When a template is instantiated Parts are created from
 * TemplateParts.
 */

class ChildPart {
	type = CHILD_PART;
	_$committedValue = nothing;
	/** @internal */

	/** @internal */

	/** @internal */

	/** @internal */

	/**
	 * Connection state for RootParts only (i.e. ChildPart without _$parent
	 * returned from top-level \`render\`). This field is unused otherwise. The
	 * intention would be clearer if we made \`RootPart\` a subclass of \`ChildPart\`
	 * with this field (and a different _$isConnected getter), but the subclass
	 * caused a perf regression, possibly due to making call sites polymorphic.
	 * @internal
	 */

	// See comment in Disconnectable interface for why this is a getter
	get _$isConnected() {
		// ChildParts that are not at the root should always be created with a
		// parent; only RootChildNode's won't, so they return the local isConnected
		// state
		return this._$parent?._$isConnected ?? this.__isConnected;
	}

	// The following fields will be patched onto ChildParts when required by
	// AsyncDirective
	/** @internal */
	_$disconnectableChildren = undefined;
	/** @internal */

	/** @internal */

	constructor(startNode, endNode, parent, options) {
		this._$startNode = startNode;
		this._$endNode = endNode;
		this._$parent = parent;
		this.options = options;
		// Note __isConnected is only ever accessed on RootParts (i.e. when there is
		// no _$parent); the value on a non-root-part is "don't care", but checking
		// for parent would be more code
		this.__isConnected = options?.isConnected ?? true;
		if (ENABLE_EXTRA_SECURITY_HOOKS) {
			// Explicitly initialize for consistent class shape.
			this._textSanitizer = undefined;
		}
	}

	/**
	 * The parent node into which the part renders its content.
	 *
	 * A ChildPart's content consists of a range of adjacent child nodes of
	 * \`.parentNode\`, possibly bordered by 'marker nodes' (\`.startNode\` and
	 * \`.endNode\`).
	 *
	 * - If both \`.startNode\` and \`.endNode\` are non-null, then the part's content
	 * consists of all siblings between \`.startNode\` and \`.endNode\`, exclusively.
	 *
	 * - If \`.startNode\` is non-null but \`.endNode\` is null, then the part's
	 * content consists of all siblings following \`.startNode\`, up to and
	 * including the last child of \`.parentNode\`. If \`.endNode\` is non-null, then
	 * \`.startNode\` will always be non-null.
	 *
	 * - If both \`.endNode\` and \`.startNode\` are null, then the part's content
	 * consists of all child nodes of \`.parentNode\`.
	 */
	get parentNode() {
		let parentNode = wrap(this._$startNode).parentNode;
		const parent = this._$parent;
		if (
			parent !== undefined &&
			parentNode?.nodeType === 11 /* Node.DOCUMENT_FRAGMENT */
		) {
			// If the parentNode is a DocumentFragment, it may be because the DOM is
			// still in the cloned fragment during initial render; if so, get the real
			// parentNode the part will be committed into by asking the parent.
			parentNode = parent.parentNode;
		}
		return parentNode;
	}

	/**
	 * The part's leading marker node, if any. See \`.parentNode\` for more
	 * information.
	 */
	get startNode() {
		return this._$startNode;
	}

	/**
	 * The part's trailing marker node, if any. See \`.parentNode\` for more
	 * information.
	 */
	get endNode() {
		return this._$endNode;
	}
	_$setValue(value, directiveParent = this) {
		if (DEV_MODE && this.parentNode === null) {
			throw new Error(
				\`This \\\`ChildPart\\\` has no \\\`parentNode\\\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \\\`innerHTML\\\` or \\\`textContent\\\` can do this.\`,
			);
		}
		value = resolveDirective(this, value, directiveParent);
		if (isPrimitive(value)) {
			// Non-rendering child values. It's important that these do not render
			// empty text nodes to avoid issues with preventing default <slot>
			// fallback content.
			if (value === nothing || value == null || value === "") {
				if (this._$committedValue !== nothing) {
					debugLogEvent?.({
						kind: "commit nothing to child",
						start: this._$startNode,
						end: this._$endNode,
						parent: this._$parent,
						options: this.options,
					});
					this._$clear();
				}
				this._$committedValue = nothing;
			} else if (value !== this._$committedValue && value !== noChange) {
				this._commitText(value);
			}
			// This property needs to remain unminified.
		} else if (value["_$litType$"] !== undefined) {
			this._commitTemplateResult(value);
		} else if (value.nodeType !== undefined) {
			if (DEV_MODE && this.options?.host === value) {
				this._commitText(
					\`[probable mistake: rendered a template's host in itself \` +
						"(commonly caused by writing \\\${this} in a template]",
				);
				console.warn(
					"Attempted to render the template host",
					value,
					"inside itself. This is almost always a mistake, and in dev mode ",
					\`we render some warning text. In production however, we'll \`,
					"render it, which will usually result in an error, and sometimes ",
					"in the element disappearing from the DOM.",
				);
				return;
			}
			this._commitNode(value);
		} else if (isIterable(value)) {
			this._commitIterable(value);
		} else {
			// Fallback, will render the string representation
			this._commitText(value);
		}
	}
	_insert(node) {
		return wrap(wrap(this._$startNode).parentNode).insertBefore(
			node,
			this._$endNode,
		);
	}
	_commitNode(value) {
		if (this._$committedValue !== value) {
			this._$clear();
			if (
				ENABLE_EXTRA_SECURITY_HOOKS &&
				sanitizerFactoryInternal !== noopSanitizer
			) {
				const parentNodeName = this._$startNode.parentNode?.nodeName;
				if (parentNodeName === "STYLE" || parentNodeName === "SCRIPT") {
					let message = "Forbidden";
					if (DEV_MODE) {
						if (parentNodeName === "STYLE") {
							message =
								"Lit does not support binding inside style nodes. " +
								"This is a security risk, as style injection attacks can " +
								"exfiltrate data and spoof UIs. " +
								"Consider instead using css\\\`...\\\` literals " +
								"to compose styles, and do dynamic styling with " +
								"css custom properties, ::parts, <slot>s, " +
								"and by mutating the DOM rather than stylesheets.";
						} else {
							message =
								"Lit does not support binding inside script nodes. " +
								"This is a security risk, as it could allow arbitrary " +
								"code execution.";
						}
					}
					throw new Error(message);
				}
			}
			debugLogEvent?.({
				kind: "commit node",
				start: this._$startNode,
				parent: this._$parent,
				value: value,
				options: this.options,
			});
			this._$committedValue = this._insert(value);
		}
	}
	_commitText(value) {
		// If the committed value is a primitive it means we called _commitText on
		// the previous render, and we know that this._$startNode.nextSibling is a
		// Text node. We can now just replace the text content (.data) of the node.
		if (
			this._$committedValue !== nothing &&
			isPrimitive(this._$committedValue)
		) {
			const node = wrap(this._$startNode).nextSibling;
			if (ENABLE_EXTRA_SECURITY_HOOKS) {
				if (this._textSanitizer === undefined) {
					this._textSanitizer = createSanitizer(node, "data", "property");
				}
				value = this._textSanitizer(value);
			}
			debugLogEvent?.({
				kind: "commit text",
				node,
				value,
				options: this.options,
			});
			node.data = value;
		} else {
			if (ENABLE_EXTRA_SECURITY_HOOKS) {
				const textNode = d.createTextNode("");
				this._commitNode(textNode);
				// When setting text content, for security purposes it matters a lot
				// what the parent is. For example, <style> and <script> need to be
				// handled with care, while <span> does not. So first we need to put a
				// text node into the document, then we can sanitize its content.
				if (this._textSanitizer === undefined) {
					this._textSanitizer = createSanitizer(textNode, "data", "property");
				}
				value = this._textSanitizer(value);
				debugLogEvent?.({
					kind: "commit text",
					node: textNode,
					value,
					options: this.options,
				});
				textNode.data = value;
			} else {
				this._commitNode(d.createTextNode(value));
				debugLogEvent?.({
					kind: "commit text",
					node: wrap(this._$startNode).nextSibling,
					value,
					options: this.options,
				});
			}
		}
		this._$committedValue = value;
	}
	_commitTemplateResult(result) {
		// This property needs to remain unminified.
		const { values, ["_$litType$"]: type } = result;
		// If $litType$ is a number, result is a plain TemplateResult and we get
		// the template from the template cache. If not, result is a
		// CompiledTemplateResult and _$litType$ is a CompiledTemplate and we need
		// to create the <template> element the first time we see it.
		const template =
			typeof type === "number"
				? this._$getTemplate(result)
				: (type.el === undefined &&
						(type.el = Template.createElement(
							trustFromTemplateString(type.h, type.h[0]),
							this.options,
						)),
					type);
		if (this._$committedValue?._$template === template) {
			debugLogEvent?.({
				kind: "template updating",
				template,
				instance: this._$committedValue,
				parts: this._$committedValue._$parts,
				options: this.options,
				values,
			});
			this._$committedValue._update(values);
		} else {
			const instance = new TemplateInstance(template, this);
			const fragment = instance._clone(this.options);
			debugLogEvent?.({
				kind: "template instantiated",
				template,
				instance,
				parts: instance._$parts,
				options: this.options,
				fragment,
				values,
			});
			instance._update(values);
			debugLogEvent?.({
				kind: "template instantiated and updated",
				template,
				instance,
				parts: instance._$parts,
				options: this.options,
				fragment,
				values,
			});
			this._commitNode(fragment);
			this._$committedValue = instance;
		}
	}

	// Overridden via \`litHtmlPolyfillSupport\` to provide platform support.
	/** @internal */
	_$getTemplate(result) {
		let template = templateCache.get(result.strings);
		if (template === undefined) {
			templateCache.set(result.strings, (template = new Template(result)));
		}
		return template;
	}
	_commitIterable(value) {
		// For an Iterable, we create a new InstancePart per item, then set its
		// value to the item. This is a little bit of overhead for every item in
		// an Iterable, but it lets us recurse easily and efficiently update Arrays
		// of TemplateResults that will be commonly returned from expressions like:
		// array.map((i) => html\`\${i}\`), by reusing existing TemplateInstances.

		// If value is an array, then the previous render was of an
		// iterable and value will contain the ChildParts from the previous
		// render. If value is not an array, clear this part and make a new
		// array for ChildParts.
		if (!isArray(this._$committedValue)) {
			this._$committedValue = [];
			this._$clear();
		}

		// Lets us keep track of how many items we stamped so we can clear leftover
		// items from a previous render
		const itemParts = this._$committedValue;
		let partIndex = 0;
		let itemPart;
		for (const item of value) {
			if (partIndex === itemParts.length) {
				// If no existing part, create a new one
				// TODO (justinfagnani): test perf impact of always creating two parts
				// instead of sharing parts between nodes
				// https://github.com/lit/lit/issues/1266
				itemParts.push(
					(itemPart = new ChildPart(
						this._insert(createMarker()),
						this._insert(createMarker()),
						this,
						this.options,
					)),
				);
			} else {
				// Reuse an existing part
				itemPart = itemParts[partIndex];
			}
			itemPart._$setValue(item);
			partIndex++;
		}
		if (partIndex < itemParts.length) {
			// itemParts always have end nodes
			this._$clear(itemPart && wrap(itemPart._$endNode).nextSibling, partIndex);
			// Truncate the parts array so _value reflects the current state
			itemParts.length = partIndex;
		}
	}

	/**
	 * Removes the nodes contained within this Part from the DOM.
	 *
	 * @param start Start node to clear from, for clearing a subset of the part's
	 *     DOM (used when truncating iterables)
	 * @param from  When \`start\` is specified, the index within the iterable from
	 *     which ChildParts are being removed, used for disconnecting directives in
	 *     those Parts.
	 *
	 * @internal
	 */
	_$clear(start = wrap(this._$startNode).nextSibling, from) {
		this._$notifyConnectionChanged?.(false, true, from);
		while (start && start !== this._$endNode) {
			const n = wrap(start).nextSibling;
			wrap(start).remove();
			start = n;
		}
	}
	/**
	 * Implementation of RootPart's \`isConnected\`. Note that this method
	 * should only be called on \`RootPart\`s (the \`ChildPart\` returned from a
	 * top-level \`render()\` call). It has no effect on non-root ChildParts.
	 * @param isConnected Whether to set
	 * @internal
	 */
	setConnected(isConnected) {
		if (this._$parent === undefined) {
			this.__isConnected = isConnected;
			this._$notifyConnectionChanged?.(isConnected);
		} else if (DEV_MODE) {
			throw new Error(
				"part.setConnected() may only be called on a " +
					"RootPart returned from render().",
			);
		}
	}
}

/**
 * A top-level \`ChildPart\` returned from \`render\` that manages the connected
 * state of \`AsyncDirective\`s created throughout the tree below it.
 */

class AttributePart {
	type = ATTRIBUTE_PART;

	/**
	 * If this attribute part represents an interpolation, this contains the
	 * static strings of the interpolation. For single-value, complete bindings,
	 * this is undefined.
	 */

	/** @internal */
	_$committedValue = nothing;
	/** @internal */

	/** @internal */

	/** @internal */
	_$disconnectableChildren = undefined;
	get tagName() {
		return this.element.tagName;
	}

	// See comment in Disconnectable interface for why this is a getter
	get _$isConnected() {
		return this._$parent._$isConnected;
	}
	constructor(element, name, strings, parent, options) {
		this.element = element;
		this.name = name;
		this._$parent = parent;
		this.options = options;
		if (strings.length > 2 || strings[0] !== "" || strings[1] !== "") {
			this._$committedValue = new Array(strings.length - 1).fill(new String());
			this.strings = strings;
		} else {
			this._$committedValue = nothing;
		}
		if (ENABLE_EXTRA_SECURITY_HOOKS) {
			this._sanitizer = undefined;
		}
	}

	/**
	 * Sets the value of this part by resolving the value from possibly multiple
	 * values and static strings and committing it to the DOM.
	 * If this part is single-valued, \`this._strings\` will be undefined, and the
	 * method will be called with a single value argument. If this part is
	 * multi-value, \`this._strings\` will be defined, and the method is called
	 * with the value array of the part's owning TemplateInstance, and an offset
	 * into the value array from which the values should be read.
	 * This method is overloaded this way to eliminate short-lived array slices
	 * of the template instance values, and allow a fast-path for single-valued
	 * parts.
	 *
	 * @param value The part value, or an array of values for multi-valued parts
	 * @param valueIndex the index to start reading values from. \`undefined\` for
	 *   single-valued parts
	 * @param noCommit causes the part to not commit its value to the DOM. Used
	 *   in hydration to prime attribute parts with their first-rendered value,
	 *   but not set the attribute, and in SSR to no-op the DOM operation and
	 *   capture the value for serialization.
	 *
	 * @internal
	 */
	_$setValue(value, directiveParent = this, valueIndex, noCommit) {
		const strings = this.strings;

		// Whether any of the values has changed, for dirty-checking
		let change = false;
		if (strings === undefined) {
			// Single-value binding case
			value = resolveDirective(this, value, directiveParent, 0);
			change =
				!isPrimitive(value) ||
				(value !== this._$committedValue && value !== noChange);
			if (change) {
				this._$committedValue = value;
			}
		} else {
			// Interpolation case
			const values = value;
			value = strings[0];
			let i, v;
			for (i = 0; i < strings.length - 1; i++) {
				v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
				if (v === noChange) {
					// If the user-provided value is \`noChange\`, use the previous value
					v = this._$committedValue[i];
				}
				change ||= !isPrimitive(v) || v !== this._$committedValue[i];
				if (v === nothing) {
					value = nothing;
				} else if (value !== nothing) {
					value += (v ?? "") + strings[i + 1];
				}
				// We always record each value, even if one is \`nothing\`, for future
				// change detection.
				this._$committedValue[i] = v;
			}
		}
		if (change && !noCommit) {
			this._commitValue(value);
		}
	}

	/** @internal */
	_commitValue(value) {
		if (value === nothing) {
			wrap(this.element).removeAttribute(this.name);
		} else {
			if (ENABLE_EXTRA_SECURITY_HOOKS) {
				if (this._sanitizer === undefined) {
					this._sanitizer = sanitizerFactoryInternal(
						this.element,
						this.name,
						"attribute",
					);
				}
				value = this._sanitizer(value ?? "");
			}
			debugLogEvent?.({
				kind: "commit attribute",
				element: this.element,
				name: this.name,
				value,
				options: this.options,
			});
			wrap(this.element).setAttribute(this.name, value ?? "");
		}
	}
}
class PropertyPart extends AttributePart {
	type = PROPERTY_PART;

	/** @internal */
	_commitValue(value) {
		if (ENABLE_EXTRA_SECURITY_HOOKS) {
			if (this._sanitizer === undefined) {
				this._sanitizer = sanitizerFactoryInternal(
					this.element,
					this.name,
					"property",
				);
			}
			value = this._sanitizer(value);
		}
		debugLogEvent &&
			debugLogEvent({
				kind: "commit property",
				element: this.element,
				name: this.name,
				value,
				options: this.options,
			});
		this.element[this.name] = value === nothing ? undefined : value;
	}
}
class BooleanAttributePart extends AttributePart {
	type = BOOLEAN_ATTRIBUTE_PART;

	/** @internal */
	_commitValue(value) {
		debugLogEvent?.({
			kind: "commit boolean attribute",
			element: this.element,
			name: this.name,
			value: !!(value && value !== nothing),
			options: this.options,
		});
		wrap(this.element).toggleAttribute(this.name, !!value && value !== nothing);
	}
}

/**
 * An AttributePart that manages an event listener via add/removeEventListener.
 *
 * This part works by adding itself as the event listener on an element, then
 * delegating to the value passed to it. This reduces the number of calls to
 * add/removeEventListener if the listener changes frequently, such as when an
 * inline function is used as a listener.
 *
 * Because event options are passed when adding listeners, we must take case
 * to add and remove the part as a listener when the event options change.
 */

class EventPart extends AttributePart {
	type = EVENT_PART;
	constructor(element, name, strings, parent, options) {
		super(element, name, strings, parent, options);
		if (DEV_MODE && this.strings !== undefined) {
			throw new Error(
				\`A \\\`<\${element.localName}>\\\` has a \\\`@\${name}=...\\\` listener with \` +
					"invalid content. Event listeners in templates must have exactly " +
					"one expression and no surrounding text.",
			);
		}
	}

	// EventPart does not use the base _$setValue/_resolveValue implementation
	// since the dirty checking is more complex
	/** @internal */
	_$setValue(newListener, directiveParent = this) {
		newListener =
			resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
		if (newListener === noChange) {
			return;
		}
		const oldListener = this._$committedValue;

		// If the new value is nothing or any options change we have to remove the
		// part as a listener.
		const shouldRemoveListener =
			(newListener === nothing && oldListener !== nothing) ||
			newListener.capture !== oldListener.capture ||
			newListener.once !== oldListener.once ||
			newListener.passive !== oldListener.passive;

		// If the new value is not nothing and we removed the listener, we have
		// to add the part as a listener.
		const shouldAddListener =
			newListener !== nothing &&
			(oldListener === nothing || shouldRemoveListener);
		debugLogEvent?.({
			kind: "commit event listener",
			element: this.element,
			name: this.name,
			value: newListener,
			options: this.options,
			removeListener: shouldRemoveListener,
			addListener: shouldAddListener,
			oldListener,
		});
		if (shouldRemoveListener) {
			this.element.removeEventListener(this.name, this, oldListener);
		}
		if (shouldAddListener) {
			// Beware: IE11 and Chrome 41 don't like using the listener as the
			// options object. Figure out how to deal w/ this in IE11 - maybe
			// patch addEventListener?
			this.element.addEventListener(this.name, this, newListener);
		}
		this._$committedValue = newListener;
	}
	handleEvent(event) {
		if (typeof this._$committedValue === "function") {
			this._$committedValue.call(this.options?.host ?? this.element, event);
		} else {
			this._$committedValue.handleEvent(event);
		}
	}
}
class ElementPart {
	type = ELEMENT_PART;

	/** @internal */

	// This is to ensure that every Part has a _$committedValue

	/** @internal */

	/** @internal */
	_$disconnectableChildren = undefined;
	constructor(element, parent, options) {
		this.element = element;
		this._$parent = parent;
		this.options = options;
	}

	// See comment in Disconnectable interface for why this is a getter
	get _$isConnected() {
		return this._$parent._$isConnected;
	}
	_$setValue(value) {
		debugLogEvent?.({
			kind: "commit to element binding",
			element: this.element,
			value,
			options: this.options,
		});
		resolveDirective(this, value);
	}
}

/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports mangled in the
 * client side code, we a _$LH object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in \`dev\` mode or \`prod\` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-element, which re-exports all of lit-html.
 *
 * @private
 */
const _$LH = {
	// Used in lit-ssr
	_boundAttributeSuffix: boundAttributeSuffix,
	_marker: marker,
	_markerMatch: markerMatch,
	_HTML_RESULT: HTML_RESULT,
	_getTemplateHtml: getTemplateHtml,
	// Used in tests and private-ssr-support
	_TemplateInstance: TemplateInstance,
	_isIterable: isIterable,
	_resolveDirective: resolveDirective,
	_ChildPart: ChildPart,
	_AttributePart: AttributePart,
	_BooleanAttributePart: BooleanAttributePart,
	_EventPart: EventPart,
	_PropertyPart: PropertyPart,
	_ElementPart: ElementPart,
};

// Apply polyfills if available
const polyfillSupport = DEV_MODE
	? global.litHtmlPolyfillSupportDevMode
	: global.litHtmlPolyfillSupport;
polyfillSupport?.(Template, ChildPart);

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
(global.litHtmlVersions ??= []).push("3.2.0");
if (DEV_MODE && global.litHtmlVersions.length > 1) {
	issueWarning(
		"multiple-versions",
		"Multiple versions of Lit loaded. " +
			"Loading multiple versions is not recommended.",
	);
}

/**
 * Renders a value, usually a lit-html TemplateResult, to the container.
 *
 * This example renders the text "Hello, Zoe!" inside a paragraph tag, appending
 * it to the container \`document.body\`.
 *
 * \`\`\`js
 * import {html, render} from 'lit';
 *
 * const name = "Zoe";
 * render(html\`<p>Hello, \${name}!</p>\`, document.body);
 * \`\`\`
 *
 * @param value Any [renderable
 *   value](https://lit.dev/docs/templates/expressions/#child-expressions),
 *   typically a {@linkcode TemplateResult} created by evaluating a template tag
 *   like {@linkcode html} or {@linkcode svg}.
 * @param container A DOM container to render to. The first render will append
 *   the rendered value to the container, and subsequent renders will
 *   efficiently update the rendered value if the same result type was
 *   previously rendered there.
 * @param options See {@linkcode RenderOptions} for options documentation.
 * @see
 * {@link https://lit.dev/docs/libraries/standalone-templates/#rendering-lit-html-templates| Rendering Lit HTML Templates}
 */
const render = (value, container, options) => {
	if (DEV_MODE && container == null) {
		// Give a clearer error message than
		//     Uncaught TypeError: Cannot read properties of null (reading
		//     '_$litPart$')
		// which reads like an internal Lit error.
		throw new TypeError(\`The container to render into may not be \${container}\`);
	}
	const renderId = DEV_MODE ? debugLogRenderId++ : 0;
	const partOwnerNode = options?.renderBefore ?? container;
	// This property needs to remain unminified.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let part = partOwnerNode["_$litPart$"];
	debugLogEvent?.({
		kind: "begin render",
		id: renderId,
		value,
		container,
		options,
		part,
	});
	if (part === undefined) {
		const endNode = options?.renderBefore ?? null;
		// This property needs to remain unminified.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		partOwnerNode["_$litPart$"] = part = new ChildPart(
			container.insertBefore(createMarker(), endNode),
			endNode,
			undefined,
			options ?? {},
		);
	}
	part._$setValue(value);
	debugLogEvent?.({
		kind: "end render",
		id: renderId,
		value,
		container,
		options,
		part,
	});
	return part;
};
if (ENABLE_EXTRA_SECURITY_HOOKS) {
	render.setSanitizer = setSanitizer;
	render.createSanitizer = createSanitizer;
	if (DEV_MODE) {
		render._testOnlyClearSanitizerFactoryDoNotCallOrElse =
			_testOnlyClearSanitizerFactoryDoNotCallOrElse;
	}
}

/**
 * Prevents JSON injection attacks.
 *
 * The goals of this brand:
 *   1) fast to check
 *   2) code is small on the wire
 *   3) multiple versions of Lit in a single page will all produce mutually
 *      interoperable StaticValues
 *   4) normal JSON.parse (without an unusual reviver) can not produce a
 *      StaticValue
 *
 * Symbols satisfy (1), (2), and (4). We use Symbol.for to satisfy (3), but
 * we don't care about the key, so we break ties via (2) and use the empty
 * string.
 */
const brand = Symbol.for("");

/** Safely extracts the string part of a StaticValue. */
const unwrapStaticValue = (value) => {
	if (value?.r !== brand) {
		return undefined;
	}
	return value?.["_$litStatic$"];
};

/**
 * Wraps a string so that it behaves like part of the static template
 * strings instead of a dynamic value.
 *
 * Users must take care to ensure that adding the static string to the template
 * results in well-formed HTML, or else templates may break unexpectedly.
 *
 * Note that this function is unsafe to use on untrusted content, as it will be
 * directly parsed into HTML. Do not pass user input to this function
 * without sanitizing it.
 *
 * Static values can be changed, but they will cause a complete re-render
 * since they effectively create a new template.
 */
const unsafeStatic = (value) => ({
	["_$litStatic$"]: value,
	r: brand,
});
const textFromStatic = (value) => {
	if (value["_$litStatic$"] !== undefined) {
		return value["_$litStatic$"];
	}
	throw new Error(\`Value passed to 'literal' function must be a 'literal' result: \${value}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.\`);
};

/**
 * Tags a string literal so that it behaves like part of the static template
 * strings instead of a dynamic value.
 *
 * The only values that may be used in template expressions are other tagged
 * \`literal\` results or \`unsafeStatic\` values (note that untrusted content
 * should never be passed to \`unsafeStatic\`).
 *
 * Users must take care to ensure that adding the static string to the template
 * results in well-formed HTML, or else templates may break unexpectedly.
 *
 * Static values can be changed, but they will cause a complete re-render since
 * they effectively create a new template.
 */
const literal = (strings, ...values) => ({
	["_$litStatic$"]: values.reduce(
		(acc, v, idx) => acc + textFromStatic(v) + strings[idx + 1],
		strings[0],
	),
	r: brand,
});
const stringsCache = new Map();

/**
 * Wraps a lit-html template tag (\`html\` or \`svg\`) to add static value support.
 */
const withStatic =
	(coreTag) =>
	(strings, ...values) => {
		const l = values.length;
		let staticValue;
		let dynamicValue;
		const staticStrings = [];
		const dynamicValues = [];
		let i = 0;
		let hasStatics = false;
		let s;
		while (i < l) {
			s = strings[i];
			// Collect any unsafeStatic values, and their following template strings
			// so that we treat a run of template strings and unsafe static values as
			// a single template string.
			while (
				i < l &&
				((dynamicValue = values[i]),
				(staticValue = unwrapStaticValue(dynamicValue))) !== undefined
			) {
				s += staticValue + strings[++i];
				hasStatics = true;
			}
			// If the last value is static, we don't need to push it.
			if (i !== l) {
				dynamicValues.push(dynamicValue);
			}
			staticStrings.push(s);
			i++;
		}
		// If the last value isn't static (which would have consumed the last
		// string), then we need to add the last string.
		if (i === l) {
			staticStrings.push(strings[l]);
		}
		if (hasStatics) {
			const key = staticStrings.join("$$lit$$");
			strings = stringsCache.get(key);
			if (strings === undefined) {
				// Beware: in general this pattern is unsafe, and doing so may bypass
				// lit's security checks and allow an attacker to execute arbitrary
				// code and inject arbitrary content.
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				staticStrings.raw = staticStrings;
				stringsCache.set(key, (strings = staticStrings));
			}
			values = dynamicValues;
		}
		return coreTag(strings, ...values);
	};

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * Includes static value support from \`lit-html/static.js\`.
 */
const staticHTML = withStatic(html);
const unsafeHTML = (html) => staticHTML\`\${unsafeStatic(html)}\`;
const staticSVG = withStatic(svg);
const unsafeSVG = (svg) => staticSVG\`\${unsafeStatic(svg)}\`;

const helpers = {
	unsafeHTML,
	unsafeStatic,
	staticHTML,
	staticSVG,
	unsafeSVG,
	render,
	html,
	literal,
	svg,
	css,
};

export function css(strings, ...values) {
	return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
}

Object.assign(html, helpers);

export const component = html;
export default html;
`,mimeType:"application/javascript",skipSW:!1},"/modules/theme/index.js":{content:`import presetWebFonts from "https://cdn.jsdelivr.net/npm/@unocss/preset-web-fonts/+esm";
import presetWind4 from "https://cdn.jsdelivr.net/npm/@unocss/preset-wind4@66.3.3/+esm";

export default async ({ $APP }) => {
	const generateHslShades = (hue, saturation) => {
		const shades = {};
		const lightnessLevels = [97, 92, 84, 75, 66, 55, 45, 35, 24, 15];
		const shadeKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

		for (let i = 0; i < shadeKeys.length; i++) {
			shades[shadeKeys[i]] =
				\`hsl(\${hue}, \${saturation}, \${lightnessLevels[i]}%)\`;
		}
		shades["DEFAULT"] = shades[500];
		return shades;
	};

	const primary = generateHslShades(198, "100%");
	const secondary = generateHslShades(120, "100%");
	const tertiary = generateHslShades(175, "100%");
	const success = generateHslShades(149, "87%");
	const warning = generateHslShades(32, "100%");
	const danger = generateHslShades(345, "100%");

	const gray = generateHslShades(0, "0%");
	gray.DEFAULT = gray[700];
	const fontFamily = "Manrope";
	window.__unocss = {
		theme: {
			text: {
				color: "var(--color-surface-100)",
			},
			font: {
				family: \`'\${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif\`,
				icon: {
					family: "lucide",
				},
			},
			background: {
				color: "var(--colors-primary-100)",
			},
			colors: {
				primary,
				secondary,
				tertiary,
				success,
				warning,
				danger,
				default: gray,
				surface: gray,
			},
			boxShadow: {
				md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
				lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
			},
		},
		extendTheme: (theme) => $APP.theme.set(theme),
		presets: [
			presetWebFonts({
				provider: "google",
				fonts: {
					sans: fontFamily,
				},
			}),
			presetWind4({ preflights: { theme: true } }),
		],
	};

	await import("https://cdn.jsdelivr.net/npm/@unocss/runtime/core.global.js");

	const globalStyleTag = document.createElement("style");
	globalStyleTag.id = "compstyles";
	document.head.appendChild(globalStyleTag);

	async function loadComponentCSS(file) {
		const css = await $APP.fs.css(file, true);
		if (css) globalStyleTag.textContent += css;
	}

	const ThemeManager = {
		loadComponentCSS,
	};
	$APP.events.on("INIT_APP", () => {
		$APP.fs.css("theme.css", true);
	});
	return ThemeManager;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/view/loader.js":{content:`export default async ({ View, ThemeManager, $APP }) => {
	const modulePath = (root = false) =>
		\`\${$APP.settings.basePath}\${root ? "" : "/modules"}\`;
	const componentDefinitions = new Map();
	const componentConstructors = new Map();
	const componentLoadPromises = new Map();

	const resolvePath = (tagName) => {
		if ($APP.components?.[tagName]?.path) return $APP.components[tagName].path;
		const parts = tagName.split("-");
		const moduleName = parts[0];
		const module = $APP.modules[moduleName];
		const componentName = parts.slice(1).join("-");
		if (module)
			return [
				modulePath(module.root),
				module.path ?? moduleName,
				componentName,
			].join("/");
		return [$APP.settings.basePath, tagName].join("/");
	};

	async function loadAndCacheDefinition(tag) {
		if (componentDefinitions.has(tag)) return componentDefinitions.get(tag);

		const path = resolvePath(tag);
		const definition = await $APP.loadDep({ tag, path: \`\${path}.js\` });

		if (!definition) {
			console.warn(
				\`[Loader] No default export found for component \${tag} at \${path}.js\`,
			);
			return null;
		}

		if (!$APP.components[tag]) $APP.components[tag] = {};
		$APP.components[tag].path = path;
		$APP.components[tag].definition = definition;
		componentDefinitions.set(tag, definition);

		return definition;
	}

	async function createAndRegisterComponent(tag, definition) {
		const {
			properties = {},
			icons,
			formAssociated = false,
			css,
			style = false,
			extends: extendsTag,
			types,
			connected,
			disconnected,
			willUpdate,
			firstUpdated,
			updated,
			class: klass,
			...prototypeMethods
		} = definition;

		const BaseClass = extendsTag ? await getComponent(extendsTag) : View;
		if (extendsTag) BaseClass.plugins = [...View.plugins, ...BaseClass.plugins];
		const component = class extends BaseClass {
			static icons = icons;
			static css = css;
			static formAssociated = formAssociated;
			constructor() {
				super();
				if (klass) {
					this.classList.add(...klass.split(" "));
				}
			}

			static properties = (() => {
				const baseProperties = super.properties || {};
				const baseTheme = super.theme || {};
				const merged = { ...baseProperties };
				for (const key of Object.keys(properties)) {
					const config = properties[key];

					if (config.type === "object" && config.properties)
						config.properties = merged[key]?.properties
							? {
									...merged[key]?.properties,
									...config.properties,
								}
							: config.properties;

					merged[key] = merged[key]
						? { ...merged[key], ...config }
						: { ...config };
					if (config.theme) baseTheme[key] = merged[key].theme;
				}
				if (types) baseTheme.types = types;
				super.theme = baseTheme;
				return merged;
			})();
		};
		Object.assign(component.prototype, prototypeMethods);
		component.tag = tag;
		component._attrs = Object.fromEntries(
			Object.keys(component.properties).map((prop) => [
				prop.toLowerCase(),
				prop,
			]),
		);
		component.plugins = [
			...component.plugins.filter(
				(plugin) => !plugin.test || plugin.test({ component: component }),
			),
		];
		component.plugins.push({
			events: { connected, disconnected, willUpdate, firstUpdated, updated },
			name: "base",
		});
		if (!customElements.get(tag) || $APP.settings.preview)
			customElements.define(tag, component);
		if (style)
			ThemeManager.loadComponentCSS(\`\${$APP.components[tag].path}.css\`);
		componentConstructors.set(tag, component);
		return component;
	}

	async function getComponent(tag) {
		tag = tag.toLowerCase();
		if (customElements.get(tag)) {
			if (!componentConstructors.has(tag)) {
				componentConstructors.set(tag, customElements.get(tag));
			}
			return componentConstructors.get(tag);
		}
		if (componentConstructors.has(tag)) return componentConstructors.get(tag);
		if (componentLoadPromises.has(tag)) return componentLoadPromises.get(tag);
		const loadPromise = (async () => {
			try {
				const definition = await loadAndCacheDefinition(tag);
				if (!definition) {
					console.warn(
						\`[Loader] Definition for \${tag} not found after loading.\`,
					);
					return null;
				}
				return await createAndRegisterComponent(tag, definition);
			} catch (error) {
				console.error(\`[Loader] Failed to define component \${tag}:\`, error);
				componentLoadPromises.delete(tag); // Allow retries
				return null;
			}
		})();

		componentLoadPromises.set(tag, loadPromise);
		return loadPromise;
	}

	const define = (...args) => {
		if (typeof args[0] === "string") {
			const tag = args[0].toLowerCase();
			const definition = args[1];
			$APP.hooks.emit("componentAdded", { tag, component: definition });

			if (!$APP.settings.dev) {
				getComponent(tag).catch((e) =>
					console.error(
						\`[Loader] Error during preview definition for \${tag}:\`,
						e,
					),
				);
			}
		} else if (typeof args[0] === "object" && args[0] !== null) {
			Object.entries(args[0]).forEach(([tag, definition]) => {
				define(tag, definition);
			});
		}
	};

	const traverseDOM = async (rootElement = document.body) => {
		if (!rootElement || typeof rootElement.querySelectorAll !== "function")
			return;
		const undefinedElements = rootElement.querySelectorAll(":not(:defined)");
		const tagsToProcess = new Set();
		undefinedElements.forEach((element) => {
			const tagName = element.tagName.toLowerCase();
			if (tagName.includes("-")) tagsToProcess.add(tagName);
		});
		await Promise.allSettled(
			Array.from(tagsToProcess).map((tag) => getComponent(tag)),
		);
	};

	const observeDOMChanges = () => {
		const observer = new MutationObserver(async (mutationsList) => {
			const tagsToProcess = new Set();
			for (const mutation of mutationsList) {
				if (mutation.type !== "childList" || mutation.addedNodes.length === 0)
					continue;
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType !== Node.ELEMENT_NODE) return;
					const processNode = (el) => {
						const tagName = el.tagName.toLowerCase();
						if (
							tagName.includes("-") &&
							!customElements.get(tagName) &&
							!componentLoadPromises.has(tagName)
						)
							tagsToProcess.add(tagName);
					};
					processNode(node);
					if (typeof node.querySelectorAll === "function")
						node.querySelectorAll(":not(:defined)").forEach(processNode);
				});
			}
			if (tagsToProcess.size > 0)
				await Promise.allSettled(
					Array.from(tagsToProcess).map((tag) => getComponent(tag)),
				);
		});
		observer.observe(document.body, { childList: true, subtree: true });
	};

	const init = () => {
		$APP.events.on("INIT_APP", () => {
			traverseDOM(document.body);
			observeDOMChanges();
		});
	};

	if ($APP.settings.dev) $APP.hooks.on("init", init);

	$APP.hooks.set({
		componentAdded({ tag, component: definition }) {
			if (!componentDefinitions.has(tag)) {
				componentDefinitions.set(tag, definition);
			}
			if (!$APP.components[tag]) $APP.components[tag] = {};
			$APP.components[tag].definition = definition;
		},
		moduleAdded({ module }) {
			if (module.components) {
				Object.entries(module.components).forEach(([name, value]) => {
					if (Array.isArray(value)) {
						value.forEach((componentName) => {
							const tag = \`\${module.name}-\${componentName}\`;
							if (!$APP.components[tag]) $APP.components[tag] = {};
							$APP.components[tag].path =
								\`\${modulePath(module.root)}/\${module.name}/\${name}/\${componentName}\`;
						});
					} else {
						const tag = \`\${module.name}-\${name}\`;
						if (!$APP.components[tag]) $APP.components[tag] = {};
						$APP.components[tag].path =
							\`\${modulePath(module.root)}/\${module.name}/\${name}\`;
					}
				});
			}
		},
	});

	$APP.define = define;
	return { define };
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/sw/index.js":{content:`export default ({ $APP }) => {
	$APP.addModule({
		name: "sw",
	});

	$APP.addModule({ name: "swEvents" });
	const pendingSWRequests = {};

	const handleSWMessage = async (message = {}) => {
		const { data } = message;
		const { eventId, type, payload } = data;
		if (eventId && pendingSWRequests[eventId]) {
			try {
				pendingSWRequests[eventId].resolve(payload);
			} catch (error) {
				pendingSWRequests[eventId].reject(new Error(error));
			} finally {
				delete pendingSWRequests[eventId];
			}
			return;
		}

		const handler = $APP.swEvents[type];
		if (handler) await handler({ payload });
	};

	navigator.serviceWorker.onmessage = handleSWMessage;

	navigator.serviceWorker.onmessageerror = (e) => {
		console.error(e);
	};

	const postMessageToSW = (params) =>
		navigator.serviceWorker.controller.postMessage(params);

	const requestToSW = (type, payload = {}) => {
		const eventId =
			Date.now().toString() + Math.random().toString(36).substr(2, 9);
		return new Promise((resolve, reject) => {
			pendingSWRequests[eventId] = { resolve, reject };
			postMessageToSW({
				type,
				payload,
				eventId,
			});
		});
	};

	$APP.swEvents.set({
		"SW:REQUEST_DATA_SYNC": ({ payload }) => {
			const { model, key, data } = payload;
			const DataModal = $APP.Model[model];
			if (DataModal) {
				DataModal.emit(key, data);
			}
		},
	});

	return { postMessage: postMessageToSW, request: requestToSW };
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/controller/backend/index.js":{content:`export default ({ View, $APP }) => {
	let appWorker;
	let wwPort;
	const pendingRequests = {};

	const handleWWMessage = async (message = {}) => {
		const { data } = message;
		const { eventId, type, payload, connection } = data;
		const handler = $APP.events[type];
		let response = payload;
		const respond =
			eventId &&
			((responsePayload) =>
				wwPort.postMessage({
					eventId,
					payload: responsePayload,
					connection,
				}));
		if (handler) response = await handler({ respond, payload, eventId });
		if (eventId && pendingRequests[eventId]) {
			try {
				pendingRequests[data.eventId].resolve(response);
			} catch (error) {
				pendingRequests[data.eventId].reject(new Error(error));
			} finally {
				delete pendingRequests[eventId];
			}
			return;
		}
		if (respond) return respond(response);
	};

	const initBackend = async () => {
		appWorker = new Worker(
			\`/worker.js?project=\${encodeURIComponent(JSON.stringify($APP.settings))}\`,
			{ type: "module" },
		);
		const wwChannel = new MessageChannel();
		wwPort = wwChannel.port1;
		wwPort.onmessage = handleWWMessage;
		wwPort.onmessageerror = (e) => {
			console.error(e);
		};
		appWorker.postMessage({ type: "INIT_PORT" }, [wwChannel.port2]);
		const { user, device, app, models } = await backend("INIT_APP");
		$APP.models.set(models);
		$APP.events.emit("INIT_APP", { user, device, app });
		$APP.about = { user, device, app };

		await navigator.storage.persist();
	};

	const postMessageToPort = (port, params, retryFn) => {
		if (!port) {
			setTimeout(() => retryFn(params), 100);
			return;
		}
		port.postMessage(params);
	};

	const postMessageToWW = (params) =>
		postMessageToPort(wwPort, params, postMessageToWW);

	const backend = (type, payload = {}, connection = null) => {
		const eventId =
			Date.now().toString() + Math.random().toString(36).substr(2, 9);
		const params = { type, payload, eventId };
		return new Promise((resolve, reject) => {
			if (connection) params.connection = connection;
			pendingRequests[eventId] = { resolve, reject };
			postMessageToWW(params);
		});
	};

	$APP.hooks.on("init", initBackend);

	const requestDataSync = ({ instance }) => {
		const {
			id,
			model,
			limit,
			offset = 0,
			includes,
			recursive,
			order,
			filter,
			row,
			rows,
		} = instance._data;
		if (row) {
			instance._row = row;
			return;
		}
		if (rows) {
			instance._rows = rows;
			return;
		}
		const method = (instance._data.method ?? id) ? "get" : "getMany";
		const opts = { limit, offset, order, recursive };
		if (filter) opts.filter = filter;
		if (includes)
			opts.includes = Array.isArray(includes) ? includes : includes.split(",");

		const onDataLoaded = (res) => {
			if (method.toLowerCase() === "get") {
				instance._row = res;
			} else {
				instance._rows = res.items ?? res;
				if (res.count) instance._data.count = res.count;
			}
			instance.requestUpdate();
			instance.emit("dataLoaded", {
				instance,
				rows: instance._rows,
				row: instance._row,
				component: instance.constructor,
			});
		};

		if (method.toLowerCase() === "get") {
			$APP.Model[model].get(id, opts).then(onDataLoaded);
		} else {
			$APP.Model[model].getAll(opts).then(onDataLoaded);
		}
	};

	View.plugins.push({
		name: "dataQuery",
		events: {
			connected: ({ instance }) => {
				if (!instance._data) return;
				instance._listeners = {};
				const { model, id } = instance._data;
				const row = instance._row;
				if (row && !id) instance._data.id = row.id;
				if ((row && !id) || instance._rows) {
					instance.emit("dataLoaded", {
						instance,
						component: instance.constructor,
					});
				}

				const modelRows = $APP.Model[model]?.rows;
				if (!modelRows) return;

				if (id) {
					const listenerKey = \`get:\${id}\`;
					if (row !== undefined && modelRows[id] === undefined) {
						modelRows[id] = row;
					}
					instance._listeners[listenerKey] = () => {
						instance._row = modelRows[id];
						instance.requestUpdate();
					};
					$APP.Model[model].on(listenerKey, instance._listeners[listenerKey]);
				} else {
					instance._listeners.any = () => requestDataSync({ instance });
					$APP.Model[model].onAny(instance._listeners.any);
				}

				if (!instance._row && !instance._rows) requestDataSync({ instance });
				instance.syncable = true;
			},
			disconnected: ({ instance }) => {
				if (!instance._listeners) return;
				Object.entries(instance._listeners).forEach(([key, listener]) => {
					if (!instance?._data?.model || !$APP.Model[instance._data.model])
						return;
					if (key === "any") $APP.Model[instance._data.model].offAny(listener);
					else $APP.Model[instance._data.model].off(key, listener);
				});
			},
		},
	});

	$APP.events.on("INIT_APP", async () => {
		$APP.events.set({
			UPDATE_MODELS: ({ payload: { models } }) => $APP.models.set(models),
			REQUEST_DATA_SYNC: ({ payload: { model, key, data } }) => {
				$APP.Model[model].emit(key, data);
				$APP.SW.request("SW:BROADCAST_DATA_SYNC", { key, model, data });
			},
		});
	});

	return backend;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/frontend.js":{content:`import Model from "/modules/mvc/model/index.js";
export default ({ Backend }) => {
	const request = (action, modelName, params = {}) => {
		return Backend(action, {
			model: modelName,
			...params,
		});
	};

	Model.request = request;

	return Model;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/controller/index.js":{content:`import adaptersStorage from "/modules/mvc/controller/adapter-storage.js";
import adaptersUrl from "/modules/mvc/controller/adapter-url.js";

export default ({ View, $APP, Backend }) => {
	const controllerAdapters = {
		...adaptersStorage,
		...adaptersUrl,
		backend: Backend,
	};

	const parseKey = (key) => {
		if (typeof key === "string" && key.includes(".")) {
			const [storeKey, path] = key.split(".", 2);
			return { storeKey, path };
		}
		return { storeKey: key, path: null };
	};

	const createAdapter = (store, storeName) => {
		const adapter =
			typeof store === "function"
				? store
				: (key, value) =>
						value !== undefined ? adapter.set(key, value) : adapter.get(key);

		$APP.events.install(adapter);

		const notify = (key, value) => {
			Controller[storeName]?.emit(key, value);
		};

		adapter.get = (key) => {
			const { storeKey, path } = parseKey(key);
			const baseValue = store.get(storeKey);
			if (path && typeof baseValue === "object" && baseValue !== null) {
				return baseValue[path];
			}
			return baseValue;
		};

		adapter.set = (key, value) => {
			const { storeKey, path } = parseKey(key);
			if (path) {
				const baseObject = store.get(storeKey) || {};
				const newValue = { ...baseObject, [path]: value };

				store.set(storeKey, newValue);
				notify(storeKey, newValue);
				return newValue;
			}
			store.set(storeKey, value);
			notify(storeKey, value);
			return value;
		};

		adapter.remove = (key) => {
			const { storeKey, path } = parseKey(key);
			if (path) {
				const baseObject = store.get(storeKey);
				if (typeof baseObject === "object" && baseObject !== null) {
					delete baseObject[path];
					store.set(storeKey, baseObject);
					notify(storeKey, baseObject);
				}
				return { key: storeKey };
			}
			store.remove(storeKey);
			notify(storeKey, undefined);
			return { key: storeKey };
		};

		adapter.has = store.has;
		adapter.keys = store.keys;
		adapter.entries = store.entries;

		adapterCache.set(storeName, adapter);
		return adapter;
	};

	const adapterCache = new Map();

	const Controller = new Proxy(
		{},
		{
			get(target, prop) {
				if (prop in target) return target[prop];
				if (adapterCache.has(prop)) return adapterCache.get(prop);
				if (prop in controllerAdapters)
					return createAdapter(controllerAdapters[prop], prop);
				if ($APP.mv3Connections?.includes(prop)) {
					return (type, payload = {}) => {
						const backendAdapter =
							adapterCache.get("backend") ||
							createAdapter(controllerAdapters.backend, "backend");
						return backendAdapter(type, payload, prop);
					};
				}
				return undefined;
			},
		},
	);

	const init = () => {
		$APP.swEvents.set({
			"SW:PROP_SYNC_UPDATE": ({ payload }) => {
				const { sync, key, value } = payload;
				const adapter = Controller[sync];
				if (adapter) {
					console.log(\`SYNC: Received update for \${sync}.\${key}\`, value);
					adapter.emit(key, value, { skipBroadcast: true });
				}
			},
		});
		const syncUrlAdapter = (adapterName) => {
			const adapter = Controller[adapterName];
			const newEntries = new Map(adapter.entries());
			const oldKeys = new Set(adapter.listeners.keys());

			newEntries.forEach((value, key) => {
				adapter.emit(key, value);
				oldKeys.delete(key);
			});

			oldKeys.forEach((key) => adapter.emit(key, undefined));
		};

		window.addEventListener("popstate", () => {
			syncUrlAdapter("querystring");
			syncUrlAdapter("hash");
		});
	};

	$APP.hooks.on("init", init);

	const getScopedKey = (baseKey, prop, instance) => {
		if (prop.scope) {
			if (prop.scope.includes(".")) {
				const [obj, objProp] = prop.scope.split(".");
				if (instance[obj]?.[objProp])
					return \`\${instance[obj]?.[objProp]}:\${baseKey}\`;
			}

			if (instance[prop.scope]) return \`\${instance[prop.scope]}:\${baseKey}\`;
		}
		return baseKey;
	};

	const SW_SYNCED_ADAPTERS = ["local", "session"];

	View.plugins.push({
		name: "syncProps",
		test: ({ component }) =>
			Object.entries(component.properties || {}).some(([, prop]) => prop.sync),
		events: {
			disconnected: ({ instance }) => {
				if (!instance._listeners) return;
				Object.entries(instance._listeners).forEach(([adapterName, fns]) => {
					const adapter = Controller[adapterName];
					if (adapter)
						Object.entries(fns).forEach(([key, fn]) => adapter.off(key, fn));
				});
			},
			connected: ({ instance, component }) => {
				Object.entries(component.properties)
					.filter(([, prop]) => prop.sync)
					.forEach(([key, prop]) => {
						const adapter = Controller[prop.sync];
						if (!adapter) return;
						const scopedKey = getScopedKey(key, prop, instance);
						const initialValue = adapter.get(scopedKey);
						if (
							SW_SYNCED_ADAPTERS.includes(prop.sync) &&
							!adapter.hasListeners(scopedKey)
						) {
							adapter.on(scopedKey, (value, opts = {}) => {
								if (opts.skipBroadcast) return;
								$APP.SW.request("SW:BROADCAST_SYNCED_PROP", {
									value,
									sync: prop.sync,
									key: scopedKey,
								});
							});
						}

						const eventFn = (value) => {
							instance.state[key] = value;
							instance.requestUpdate(key, "$$");
						};

						if (!instance._listeners) instance._listeners = {};
						if (!instance._listeners[prop.sync])
							instance._listeners[prop.sync] = {};
						instance._listeners[prop.sync][scopedKey] = eventFn;

						if (!Object.getOwnPropertyDescriptor(instance, key)) {
							Object.defineProperty(instance, key, {
								get: () => instance.state[key],
								set: (newValue) => {
									if (instance.state[key] === newValue) return;
									instance.state[key] = newValue;
									if (newValue !== adapter.get(scopedKey)) {
										adapter.set(scopedKey, newValue);
									}
								},
							});
						}
						adapter.on(scopedKey, eventFn);
						eventFn(initialValue ?? prop.defaultValue);
					});
			},
		},
	});

	$APP.Controller = Controller;
	return Controller;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/controller/adapter-storage.js":{content:`const serialize = (value) => {
	if ((typeof value === "object" && value !== null) || Array.isArray(value)) {
		return JSON.stringify(value);
	}
	return value;
};

const deserialize = (value) => {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
};

const get = (storage) => (key) => {
	const value = storage.getItem(key);
	return value !== null ? deserialize(value) : null;
};

const set = (storage) => (key, value) => {
	storage.setItem(key, serialize(value));
	return { key };
};

const remove = (storage) => (key) => {
	storage.removeItem(key);
	return { key };
};
const keys = (storage) => () => {
	return Object.keys(storage);
};

const has = (storage) => (key) => {
	return storage.getItem(key) !== null && storage.getItem(key) !== undefined;
};

const createStorageAdapter = (storage) => {
	return {
		has: has(storage),
		set: set(storage),
		remove: remove(storage),
		get: get(storage),
		keys: keys(storage),
	};
};

const ramStore = new Map();
const ram = {
	has: (key) => {
		return ramStore.has(key);
	},
	get: (key) => {
		return ramStore.get(key);
	},
	set: (key, value) => {
		ramStore.set(key, value);
		return { key };
	},
	remove: (key) => {
		ramStore.delete(key);
		return { key };
	},
	keys: () => ramStore.keys(),
};

const local = createStorageAdapter(window.localStorage);
const session = createStorageAdapter(window.sessionStorage);

export default { local, ram, session };
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/controller/adapter-url.js":{content:`const getHashParams = () => {
	const hash = window.location.hash.substring(1);
	return new URLSearchParams(hash);
};

const setHashParams = (params) => {
	const newHash = params.toString();
	window.location.hash = newHash;
};

const hash = {
	get: (key) => {
		const params = getHashParams();
		return params.get(key);
	},
	has: (key) => {
		const params = getHashParams();
		return params.has(key);
	},
	set: (key, value) => {
		const params = getHashParams();
		params.set(key, value);
		setHashParams(params);
		window.dispatchEvent(new Event("popstate"));
		return { key };
	},
	remove: (key) => {
		const params = getHashParams();
		params.delete(key);
		setHashParams(params);
		return { key };
	},
	keys: () => {
		const params = getHashParams();
		return [...params.keys()];
	},
	entries: () => {
		const params = getHashParams();
		return [...params.entries()];
	},
};

const querystring = {
	get(key) {
		const params = new URLSearchParams(window.location.search);
		return params.get(key);
	},

	set(key, value) {
		const params = new URLSearchParams(window.location.search);
		params.set(key, value);
		window.history?.pushState?.(
			{},
			"",
			\`\${window.location.pathname}?\${params}\`,
		);
		window.dispatchEvent(new Event("popstate"));
		return { key };
	},

	remove(key) {
		const params = new URLSearchParams(window.location.search);
		params.delete(key);
		window.history.pushState?.({}, "", \`\${window.location.pathname}?\${params}\`);
		return { key };
	},
	keys() {
		const params = new URLSearchParams(window.location.search);
		return [...params.keys()];
	},
	has(key) {
		const params = new URLSearchParams(window.location.search);
		return params.has(key);
	},
	entries: () => {
		const params = new URLSearchParams(window.location.search);
		return [...params.entries()];
	},
};

export default { querystring, hash };
`,mimeType:"application/javascript",skipSW:!1},"/modules/router/index.js":{content:`export default ({ html, Controller, $APP }) => {
	class Router {
		static stack = [];
		static routes = {};
		static namedRoutes = {};
		static init(routes, defaultTitle) {
			if (!Object.keys(routes).length)
				return console.error("Error: no routes loaded");
			this.routes = routes;
			this.defaultTitle = defaultTitle;
			this.namedRoutes = {};
			for (const path in routes) {
				const route = routes[path];
				if (route.name) {
					if (this.namedRoutes[route.name])
						console.warn(
							\`Router Warning: Duplicate route name "\${route.name}" found. The path "\${path}" will be used.\`,
						);
					this.namedRoutes[route.name] = path;
				}
			}
			window.addEventListener("popstate", () => {
				const currentPath = window.location.pathname + window.location.search;
				this.handleHistoryNavigation(currentPath);
			});

			this.setCurrentRoute(
				window.location.pathname + window.location.search,
				true,
			);
		}

		static handleHistoryNavigation(path) {
			const stackIndex = this.stack.findIndex(
				(item) => this.normalizePath(item.path) === this.normalizePath(path),
			);

			if (stackIndex !== -1) {
				this.truncateStack(stackIndex);
				const matched = this.matchRoute(path);
				if (matched) this.updateCurrentRouteInRam(matched);
			} else this.setCurrentRoute(path, true);
		}

		static create(routeName, params = {}) {
			const pathPattern = this.namedRoutes[routeName];

			if (!pathPattern) {
				console.error(
					\`Router Error: Route with name "\${routeName}" not found.\`,
				);
				return null;
			}

			const path = pathPattern.replace(/:(\\w+)/g, (match, paramName) => {
				if (params[paramName] !== undefined && params[paramName] !== null) {
					return String(params[paramName]);
				}
				console.warn(
					\`Router Warning: Parameter "\${paramName}" was not provided for named route "\${routeName}".\`,
				);
				return match;
			});

			if (path.includes(":")) {
				console.error(
					\`Router Error: Could not create path for "\${routeName}". Final path still contains unresolved parameters: \${path}\`,
				);
				return null;
			}

			return path;
		}
		static replace(path, state = {}) {
			const currentState = window.history.state || {};
			const newState = { ...currentState, ...state };
			window.history.replaceState(newState, "", path);
		}
		static go(routeNameOrPath, params) {
			if (params) {
				const path = this.create(routeNameOrPath, params);
				if (path) {
					this.setCurrentRoute(path, true);
				}
				return;
			}
			this.setCurrentRoute(routeNameOrPath, true);
		}

		static home() {
			this.stack = [];
			this.go("/");
		}

		static back() {
			if (this.stack.length <= 1) {
				this.home();
				return;
			}

			this.stack = this.stack.slice(0, -1);
			window.history.back();
		}

		static pushToStack(path, params = {}, title = this.defaultTitle) {
			if (path === "/") {
				this.stack = [];
			} else {
				this.stack.push({ path, params, title });
			}
			this.setTitle(\`\${title} | \${$APP.settings.name}\`);
		}

		static isRoot() {
			return this.stack.length === 0;
		}

		static truncateStack(index = 0) {
			if (index >= this.stack.length) return;
			this.stack = this.stack.slice(0, index + 1);
		}

		static normalizePath(path = "/") {
			const normalized = path.includes("url=")
				? path.split("url=")[1]
				: path.split("?")[0];
			return (normalized || "/").replace(/\\/+$/, "");
		}

		static push(path, state = {}) {
			window.history.pushState(state, "", path);
			const popstateEvent = new PopStateEvent("popstate", { state });
			window.dispatchEvent(popstateEvent);
		}

		static setCurrentRoute(path, pushToStack = true) {
			if (!this.routes) return;
			const normalizedPath = this.normalizePath(path);
			const matched = this.matchRoute(normalizedPath);
			if (!matched) return this.go("/");

			this.updateCurrentRouteInRam(matched);
			if (!pushToStack) return;
			this.pushToStack(
				normalizedPath,
				matched.params,
				matched.route.title || this.defaultTitle,
			);
			this.push(path, { path: normalizedPath });
		}

		static matchRoute(url) {
			const path = url.split("?")[0];
			if (this.routes[path])
				return {
					route: this.routes[path],
					params: {},
					path,
					name: this.routes[path].name ?? path.slice(1),
				};

			for (const routePath in this.routes) {
				const paramNames = [];
				const regexPath = routePath.replace(/:([^/]+)/g, (_, paramName) => {
					paramNames.push(paramName);
					return "([^/]+)";
				});

				const regex = new RegExp(\`^\${regexPath.replace(/\\/+$/, "")}$\`);
				const match = path.match(regex);
				if (!match) continue;
				const params = {};
				paramNames.forEach((name, index) => {
					params[name] = match[index + 1];
				});
				return {
					route: this.routes[routePath],
					params,
					path,
					name: this.routes[routePath].name ?? path.slice(1),
				};
			}
			return null;
		}

		static setTitle(newTitle) {
			document.title = newTitle;
			this.stack.at(-1).title = newTitle;
			this.currentRoute.route.title = newTitle;
			Controller.ram.set("currentRoute", { ...this.currentRoute });
		}

		static updateCurrentRouteInRam(route) {
			this.currentRoute = route;
			this.currentRoute.root = this.isRoot();
			Controller.ram.set("currentRoute", this.currentRoute);
		}
	}

	const init = () => {
		Router.init($APP.routes);
	};

	$APP.hooks.on("init", init);
	$APP.routes.set({ "/": { component: () => html\`<app-index></app-index>\` } });

	$APP.addModule({ name: "router" });

	return Router;
};
`,mimeType:"application/javascript",skipSW:!1},"/index.js":{content:`export default ({ $APP, html }) => {
	const routes = {
		"/inspector": {
			component: () => html\`<mcp-inspector></mcp-inspector>\`,
			title: "Inspector",
			template: "template-app",
		},
		"/servers": {
			name: "dev",
			component: () => html\`<mcp-servers></mcp-servers>\`,
			title: "Servers",
			template: "template-app",
		},
		"/dev": {
			name: "dev",
			component: () => html\`<mcp-dev></mcp-dev>\`,
			title: "Develop",
			template: "template-app",
		},
		"/": {
			name: "dev",
			component: () => html\`<mcp-dev></mcp-dev>\`,
			title: "Develop",
			template: "template-app",
		},
		"/chat": {
			component: () => html\`<mcp-chat></mcp-chat>\`,
			title: "Chat",
			template: "template-app",
		},
	};

	$APP.routes.set(routes);
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/p2p/index.js":{content:`export default ({ $APP }) => {
	const p2p = {};
	$APP.events.install(p2p);
	$APP.addModule({
		name: "p2p",
	});
	const events = {
		"P2P:SEND_DATA_OP": ({ payload }) => {
			console.log("P2P DATA OP", { payload });
			$APP.p2p.emit("SEND_DATA_OP", payload);
		},
	};
	$APP.events.set(events);
	return p2p;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/index.js":{content:`export const dependencies = {
	CreateMessageRequestSchema: [
		"@modelcontextprotocol/sdk/types.js",
		"CreateMessageRequestSchema",
	],
	ElicitRequestSchema: [
		"@modelcontextprotocol/sdk/types.js",
		"ElicitRequestSchema",
	],
	ServerNotificationSchema: [
		"@modelcontextprotocol/sdk/types.js",
		"ServerNotificationSchema",
	],
	McpClient: ["@modelcontextprotocol/sdk/client/index.js", "Client"],
	McpServer: ["@modelcontextprotocol/sdk/server/mcp.js", "McpServer"],
	InMemoryTransport: [
		"@modelcontextprotocol/sdk/inMemory.js",
		"InMemoryTransport",
	],
	StreamableHTTPClientTransport: [
		"@modelcontextprotocol/sdk/client/streamableHttp.js",
		"StreamableHTTPClientTransport",
	],
	z: "zod",
};

export const locals = {
	javascriptTransportPlugin: "/modules/ai/plugins/transports/javascript.js",
	httpTransportPlugin: "/modules/ai/plugins/transports/streamablehttp.js",
	toolsPlugin: "/modules/ai/plugins/core/tools.js",
	eventsPlugin: "/modules/ai/plugins/core/events.js",
	serversPlugin: "/modules/ai/plugins/core/servers.js",
	resourcesPlugin: "/modules/ai/plugins/core/resources.js",
	promptsPlugin: "/modules/ai/plugins/core/prompts.js",
	requestsPlugin: "/modules/ai/plugins/core/requests.js",
	notificationsPlugin: "/modules/ai/plugins/core/notifications.js",
	clientsPlugin: "/modules/ai/plugins/core/clients.js",
	rootsPlugin: "/modules/ai/plugins/core/roots.js",
	historyPlugin: "/modules/ai/plugins/history.js",
	chatPlugin: "/modules/ai/plugins/chat.js",
	conversationsPlugin: "/modules/ai/plugins/conversations.js",
};

export default async ({
	historyPlugin,
	clientsPlugin,
	javascriptTransportPlugin,
	httpTransportPlugin,
	chatPlugin,
	conversationsPlugin,
	toolsPlugin,
	resourcesPlugin,
	requestsPlugin,
	eventsPlugin,
	serversPlugin,
	notificationsPlugin,
	rootsPlugin,
}) => {
	const createHost = (initialPlugins = []) => {
		const host = {
			plugins: new Map(),
			transports: new Map(),
			config: {},
			isInitialized: false,
			use(plugin) {
				if (this.plugins.has(plugin.name)) {
					console.warn(\`Plugin "\${plugin.name}" is already registered.\`);
					return this;
				}
				this.plugins.set(plugin.name, plugin);
				if (typeof plugin.initialize === "function") plugin.initialize(this);
				return this;
			},
			addStore(name, store = {}) {
				if (!this[name]) this[name] = store;
			},
			init(initialConfig) {
				if (this.isInitialized)
					return !console.log("AI Host already initialized.") && this;
				this.config = {
					generationConfig: {
						temperature: 0.7,
						max_tokens: 2048,
					},
					...initialConfig,
				};
				if (initialConfig.defaultRoots) {
					const rootApi = this.plugin("roots");
					if (rootApi)
						initialConfig.defaultRoots.forEach((root) => rootApi.addRoot(root));
				}
				this.isInitialized = true;
				console.log("AI Host Initialized.");
				return this;
			},
			plugin(pluginName) {
				const plugin = this.plugins.get(pluginName);
				return plugin ? plugin.api : null;
			},
		};
		initialPlugins.forEach((plugin) => host.use(plugin));
		return host;
	};
	const defaultPlugins = [
		historyPlugin,
		clientsPlugin,
		requestsPlugin,
		javascriptTransportPlugin,
		httpTransportPlugin,
		eventsPlugin,
		serversPlugin,
		notificationsPlugin,
		resourcesPlugin,
		rootsPlugin,
		toolsPlugin,
		chatPlugin,
		conversationsPlugin,
	];
	const AI = createHost(defaultPlugins);
	for (const plugin of defaultPlugins)
		if (plugin.api) Object.assign(AI, plugin.api);

	return AI;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/transports/javascript.js":{content:`export default async ({ $APP, McpServer, InMemoryTransport }) => ({
	name: "transport:javascript",
	initialize(host) {
		const transport = {
			name: "JavaScript",
			async createTransport(transportConfig, dependencies) {
				const { host, config } = dependencies;
				let server;

				if (transportConfig.serverInstance) {
					server = transportConfig.serverInstance;
				} else if (transportConfig.command) {
					const module = await import(transportConfig.command);
					if (typeof module.default !== "function") {
						throw new Error(
							\`Module \${transportConfig.command} does not have a default export function.\`,
						);
					}
					server = module.default({
						...$APP,
						$APP,
						host,
						config,
						...transportConfig.args,
					});

					if (!(server instanceof McpServer)) {
						throw new Error(
							\`Module \${transportConfig.command} did not return an McpServer instance.\`,
						);
					}
				} else {
					throw new Error(
						"JavaScript transport requires 'serverInstance' or 'command'.",
					);
				}

				const [clientTransport, serverTransport] =
					InMemoryTransport.createLinkedPair();
				await server.connect(serverTransport);
				return clientTransport;
			},
		};
		host.transports.set(transport.name, transport);
	},
	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/transports/streamablehttp.js":{content:`export default ({ StreamableHTTPClientTransport }) => ({
	name: "transport:http",
	initialize(host) {
		const transport = {
			name: "StreamableHTTP",
			async createTransport(transportConfig) {
				const url = transportConfig.url || transportConfig.command;
				if (!url) {
					throw new Error("StreamableHTTP transport requires a 'url'.");
				}
				return new StreamableHTTPClientTransport(new URL(url));
			},
		};
		host.transports.set(transport.name, transport);
	},
	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/tools.js":{content:`export default () => ({
	name: "tools",
	initialize(host) {
		const historyApi = host.plugin("history");
		if (!historyApi)
			throw new Error("Tooling plugin requires the History plugin.");

		host.addStore("toolToAliasMap", new Map());
		host.addStore("promptToAliasMap", new Map());

		this.api.callTool = (toolName, args) => {
			return historyApi.withHistory(
				"tool:call",
				{ toolName, args },
				async () => {
					let alias = host.toolToAliasMap.get(toolName);
					if (!alias) {
						await host._updateAllToolMaps();
						alias = host.toolToAliasMap.get(toolName);
						if (!alias)
							throw new Error(
								\`Tool '\${toolName}' not found on any connected server.\`,
							);
					}
					const client = host.clients.get(alias);
					return client.callTool({ name: toolName, arguments: args });
				},
			);
		};

		this.api.listTools = ({ servers } = {}) => {
			return historyApi.withHistory("tools:list", { servers }, async () => {
				const allItems = [];
				const aliasesToList = servers || Array.from(host.clients.keys());
				for (const alias of aliasesToList) {
					const client = host.clients.get(alias);
					if (client) {
						try {
							const { tools = [] } = await client.listTools();
							allItems.push(
								...tools.map((tool) => ({ ...tool, server: alias })),
							);
						} catch (e) {
							console.error(\`Could not list tools for server \${alias}:\`, e);
						}
					}
				}
				return { tools: allItems };
			});
		};

		this.api._updateAllToolMaps = async () => {
			host.toolToAliasMap.clear();
			for (const alias of host.clients.keys()) {
				await host._updateToolMapForAlias(alias);
			}
		};

		this.api._updateToolMapForAlias = async (alias) => {
			const client = host.clients.get(alias);
			if (!client) return;
			try {
				const { tools } = await client.listTools();
				for (const tool of tools) {
					if (host.toolToAliasMap.has(tool.name)) {
						console.warn(
							\`Tool name conflict: '\${tool.name}' from server '\${alias}' is overwriting an existing tool.\`,
						);
					}
					host.toolToAliasMap.set(tool.name, alias);
				}
			} catch (error) {
				console.error({ error });
			}
		};

		this.api._cleanupMappingsForAlias = (alias) => {
			for (const [toolName, mapAlias] of host.toolToAliasMap.entries()) {
				if (mapAlias === alias) host.toolToAliasMap.delete(toolName);
			}
			for (const [promptName, mapAlias] of host.promptToAliasMap.entries()) {
				if (mapAlias === alias) host.promptToAliasMap.delete(promptName);
			}
		};

		this.api._updateAllPromptMaps = async () => {
			host.promptToAliasMap.clear();
			for (const alias of host.clients.keys()) {
				await host._updatePromptMapForAlias(alias);
			}
		};

		this.api._updatePromptMapForAlias = async (alias) => {
			const client = host.clients.get(alias);
			if (!client || typeof client.listPrompts !== "function") return;
			try {
				const { prompts } = await client.listPrompts();
				console.log({ prompts });
				for (const prompt of prompts) {
					if (host.promptToAliasMap.has(prompt.name)) {
						console.warn(
							\`Prompt name conflict: '\${prompt.name}' from server '\${alias}' is overwriting an existing prompt.\`,
						);
					}
					host.promptToAliasMap.set(prompt.name, alias);
				}
			} catch (e) {
				// Errors here are often expected, suppress logging.
			}
		};

		this.api.getPrompt = ({ name, arguments: args }) => {
			return historyApi.withHistory(
				"prompt:get",
				{ name, arguments: args },
				async () => {
					let alias = host.promptToAliasMap.get(name);
					if (!alias) {
						await host._updateAllPromptMaps();
						alias = host.promptToAliasMap.get(name);
						if (!alias) throw new Error(\`Prompt '\${name}' not found.\`);
					}
					const client = host.clients.get(alias);
					return client.getPrompt({ name, arguments: args });
				},
			);
		};

		this.api.listPrompts = ({ servers } = {}) => {
			return historyApi.withHistory("prompts:list", { servers }, async () => {
				const allItems = [];
				const aliasesToList = servers || Array.from(host.clients.keys());
				for (const alias of aliasesToList) {
					const client = host.clients.get(alias);
					if (client && typeof client.listPrompts === "function") {
						try {
							const { prompts = [] } = await client.listPrompts();
							allItems.push(...prompts.map((p) => ({ ...p, server: alias })));
						} catch (e) {
							console.error(\`Could not list prompts for server \${alias}:\`, e);
						}
					}
				}
				return { prompts: allItems };
			});
		};

		this.api.processTemplate = (templateName, variables = {}) => {
			return historyApi.withHistory(
				"template:process",
				{ templateName, variables },
				async () => {
					const template = await this.api.getPrompt({
						name: templateName,
						arguments: variables,
					});
					let processed = template.messages || template.content || "";
					if (typeof processed !== "string") {
						processed = JSON.stringify(processed); // Handle non-string templates
					}
					for (const [key, value] of Object.entries(variables)) {
						const regex = new RegExp(\`{{\\\\s*\${key}\\\\s*}}\`, "g");
						processed = processed.replace(regex, String(value));
					}
					return {
						content: processed,
						originalTemplate: template,
						variables,
					};
				},
			);
		};
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/events.js":{content:`export default () => ({
	name: "events",

	initialize(host) {
		// A Map to store event listeners, where the key is the event type (string)
		// and the value is an array of handler functions.
		const all = new Map();

		this.api = {
			/**
			 * Register an event handler for the given type.
			 * @param {string} type The event type to listen for.
			 * @param {Function} handler The function to call when the event is emitted.
			 */
			on(type, handler) {
				const handlers = all.get(type);
				if (handlers) {
					handlers.push(handler);
				} else {
					all.set(type, [handler]);
				}
			},

			/**
			 * Remove an event handler for the given type.
			 * @param {string} type The event type to stop listening for.
			 * @param {Function} [handler] The specific handler to remove. If omitted, all handlers for the type are removed.
			 */
			off(type, handler) {
				const handlers = all.get(type);
				if (handlers) {
					if (handler) {
						handlers.splice(handlers.indexOf(handler) >>> 0, 1);
					} else {
						all.set(type, []);
					}
				}
			},

			/**
			 * Emit an event of the given type.
			 * All registered handlers for the type will be called with the event data.
			 * @param {string} type The type of event to emit.
			 * @param {*} [evt] The event data to pass to the handlers.
			 */
			emit(type, evt) {
				const handlers = all.get(type);
				if (handlers) {
					// Use slice to create a copy of the handlers array,
					// in case a handler modifies the original array (e.g., by calling off()).
					handlers.slice().forEach((handler) => handler(evt));
				}
			},
		};

		// Add the event emitter API to the host instance so other plugins can use it.
		host.addStore("events", this.api);
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/servers.js":{content:`export default () => ({
	name: "servers",
	initialize(host) {
		const state = {
			availableServers: [
				{
					id: "default-feature-rich",
					name: "Default Feature-Rich Server",
					description:
						"A comprehensive server with a wide range of capabilities, including tools, resources, and prompts.",
					path: "/templates/servers/basic.js",
					tags: ["Official", "Recommended", "Full-Featured"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>\`,
				},
				{
					id: "eval",
					name: "Simple Greeter Server",
					description:
						"A minimal server that demonstrates basic greeting functionality. Ideal for getting started.",
					path: "/templates/servers/eval.js",
					tags: ["Example", "Beginner"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>\`,
				},
				// Code Generation Servers
				{
					id: "frontend-dev-agent",
					name: "Frontend Developer Agent",
					description:
						"Your AI frontend developer. Generate complete SPAs, React components, interactive UIs, and modern web apps - all running in the browser.",
					path: "/templates/servers/frontend-agent.js",
					tags: ["Official", "AI Agent", "Code Generation", "Essential"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>\`,
				},
				{
					id: "ui-component-generator",
					name: "UI Component Library",
					description:
						"Generate beautiful, production-ready UI components. Buttons, forms, modals, cards - all with modern styling and animations.",
					path: "/templates/servers/ui-generator.js",
					tags: ["Official", "UI", "Components", "Code Generation"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>\`,
				},
				{
					id: "visualization-generator",
					name: "Data Visualization Generator",
					description:
						"Create stunning charts, graphs, and interactive data visualizations using Chart.js, D3, and Canvas.",
					path: "/templates/servers/viz-generator.js",
					tags: ["Visualization", "Code Generation", "Data"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>\`,
				},
				{
					id: "game-animation-generator",
					name: "Game & Animation Studio",
					description:
						"Generate HTML5 games, 3D scenes with Three.js, and stunning CSS/Canvas animations.",
					path: "/templates/servers/game-generator.js",
					tags: ["Games", "Animation", "Code Generation", "Creative"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15.91" y1="11" x2="18.36" y2="8.55"></line><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.91" y1="4.91" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.09" y2="19.09"></line></svg>\`,
				},
				{
					id: "landing-page-generator",
					name: "Landing Page Generator",
					description:
						"Create modern, responsive landing pages with hero sections, pricing tables, testimonials, and more.",
					path: "/templates/servers/landing-generator.js",
					tags: ["Web Design", "Code Generation", "Marketing"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>\`,
				},
				{
					id: "code-transformer",
					name: "Code Refactoring Agent",
					description:
						"Modernize code, convert to hooks, optimize performance, and improve code quality.",
					path: "/templates/servers/code-transformer.js",
					tags: ["Refactoring", "Code Generation", "AI Agent"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg>\`,
				},
				{
					id: "data-processor",
					name: "Data Processing Generator",
					description:
						"Generate scripts for CSV/JSON processing, data transformation, and client-side analysis.",
					path: "/templates/servers/data-processor.js",
					tags: ["Data", "Code Generation", "Utility"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>\`,
				},
				// Utility Servers
				{
					id: "virtual-filesystem",
					name: "Virtual Filesystem",
					description:
						"IndexedDB-based file system for managing your projects entirely in the browser.",
					path: "/templates/servers/virtual-fs.js",
					tags: ["Official", "Development", "Storage"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>\`,
				},
				{
					id: "http-client",
					name: "HTTP API Client",
					description:
						"Make API requests, test endpoints, and save collections. Perfect for API development.",
					path: "/templates/servers/http-client.js",
					tags: ["API", "Testing", "Utility"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>\`,
				},
				{
					id: "github-api",
					name: "GitHub Integration",
					description:
						"Full GitHub workflow via REST API - manage repos, commits, issues, and PRs.",
					path: "/templates/servers/github-api.js",
					tags: ["Git", "Publishing", "Official"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>\`,
				},
				// Creative & Interactive
				{
					id: "games-suite",
					name: "Interactive Games",
					description:
						"Text adventures, chess, word games, and coding challenges. Fun way to test the AI!",
					path: "/templates/servers/games.js",
					tags: ["Games", "Entertainment", "Interactive"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="18" y2="12"></line><line x1="12" y1="6" x2="12" y2="18"></line></svg>\`,
				},
				{
					id: "canvas-studio",
					name: "Canvas Art Studio",
					description:
						"Create ASCII art, diagrams, charts, and visual content directly in the browser.",
					path: "/templates/servers/canvas-studio.js",
					tags: ["Creative", "Visualization", "Art"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>\`,
				},
			],
			favoriteServerIds: [],
		};

		this.api = {
			listServers: () => [...state.availableServers],
			getFavorites: () => [...state.favoriteServerIds],
			toggleFavorite: (serverId) => {
				const index = state.favoriteServerIds.indexOf(serverId);
				if (index > -1) {
					state.favoriteServerIds.splice(index, 1);
				} else {
					state.favoriteServerIds.push(serverId);
				}
				host.events.emit("servers:favoritesChanged", [
					...state.favoriteServerIds,
				]);
			},
			getServerById: (serverId) => {
				return state.availableServers.find((s) => s.id === serverId);
			},
			getServersByTag: (tag) => {
				return state.availableServers.filter((s) => s.tags.includes(tag));
			},
		};
	},
	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/resources.js":{content:`export default () => ({
	name: "resources",

	initialize(host) {
		const resourceCache = new Map();
		const historyApi = host.plugin("history");
		if (!historyApi)
			throw new Error("Resource plugin requires the History plugin.");
		const listItems = async ({ methodName, resultKey, serverAliases }) => {
			const allItems = [];
			const aliasesToList = serverAliases || Array.from(host.clients.keys());
			for (const alias of aliasesToList) {
				const client = host.clients.get(alias);
				if (client && typeof client[methodName] === "function") {
					try {
						const result = await client[methodName]();
						allItems.push(
							...(result[resultKey] || []).map((item) => ({
								...item,
								server: alias,
							})),
						);
					} catch (e) {
						console.error(
							\`Could not execute \${methodName} for server \${alias}:\`,
							e,
						);
					}
				}
			}
			return { [resultKey]: allItems };
		};

		this.api.readResource = ({ uri, requestingServer = null }) => {
			return historyApi.withHistory(
				"resource:read",
				{ uri, requestingServer },
				async () => {
					const rootApi = host.plugin("roots");
					if (
						requestingServer &&
						rootApi &&
						!rootApi.validateResourceAccess(requestingServer, uri)
					) {
						throw new Error(
							\`Server \${requestingServer} does not have access to resource \${uri}\`,
						);
					}
					for (const [alias, client] of host.clients.entries()) {
						console.log({
							requestingServer,
							rootApi,
							valid: rootApi.validateResourceAccess(alias, uri),
						});
						if (
							!requestingServer ||
							!rootApi ||
							rootApi.validateResourceAccess(alias, uri)
						) {
							try {
								const result = await client.readResource({ uri });

								console.log({ uri, result });
								if (result !== undefined && result !== null) return result;
							} catch (e) {
								/* Suppress */
							}
						}
					}
					throw new Error(\`Resource not found or could not be read: \${uri}\`);
				},
			);
		};

		this.api.readResourceCached = async ({
			uri,
			requestingServer = null,
			maxAge = 300000,
		}) => {
			const cacheKey = \`\${uri}_\${requestingServer || "global"}\`;
			const cached = resourceCache.get(cacheKey);
			if (cached && Date.now() - cached.timestamp < maxAge) return cached.data;
			const result = await this.api.readResource({ uri, requestingServer });
			resourceCache.set(cacheKey, { data: result, timestamp: Date.now() });
			return result;
		};

		this.api.listResources = ({ servers } = {}) => {
			return historyApi.withHistory("resources:list", { servers }, () =>
				listItems({
					methodName: "listResources",
					resultKey: "resources",
					serverAliases: servers,
				}),
			);
		};

		this.api.listResourceTemplates = ({ servers } = {}) => {
			return historyApi.withHistory("resourceTemplates:list", { servers }, () =>
				listItems({
					methodName: "listResourceTemplates",
					resultKey: "resourceTemplates",
					serverAliases: servers,
				}),
			);
		};
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/prompts.js":{content:`export default () => {};
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/requests.js":{content:`export default ({ ElicitRequestSchema, CreateMessageRequestSchema }) => ({
	name: "requests",
	initialize(host) {
		const pendingElicitation = new Map();
		const pendingSampling = new Map();
		const listeners = new Set();
		const historyApi = host.plugin("history");
		host.addStore("requestHandlers", new Set());

		if (!historyApi)
			throw new Error("Request plugin requires the History plugin.");
		const notifyListeners = () => listeners.forEach((l) => l());
		this.api.onRequestChange = (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		};
		const handleElicitation = async (request, serverAlias) => {
			const historyEntry = historyApi.addToHistory({
				toolName: "elicitation/request",
				params: request.params.message,
				status: "pending",
				server: serverAlias,
				schema: request.params.requestedSchema,
			});
			const promise = new Promise((resolve) =>
				pendingElicitation.set(historyEntry.id, {
					request,
					resolve,
					server: serverAlias,
				}),
			);
			notifyListeners();
			try {
				const userResponse = await promise;
				if (userResponse.action === "decline") {
					historyApi.updateHistory(historyEntry.id, {
						status: "error",
						error: "User declined request.",
					});
					return {
						action: "decline",
						content: { error: "User declined the request." },
					};
				}
				historyApi.updateHistory(historyEntry.id, {
					status: "success",
					result: userResponse.content,
				});
				return { action: "accept", content: userResponse.content };
			} catch (error) {
				historyApi.updateHistory(historyEntry.id, {
					status: "error",
					error: error.message,
				});
				return {
					action: "decline",
					content: { error: "An error occurred during elicitation." },
				};
			} finally {
				pendingElicitation.delete(historyEntry.id);
				notifyListeners();
			}
		};

		const handleSampling = async (request, serverAlias) => {
			const historyEntry = historyApi.addToHistory({
				toolName: "sampling/request",
				params: request.params,
				status: "pending",
				server: serverAlias,
			});
			const promise = new Promise((resolve) =>
				pendingSampling.set(historyEntry.id, {
					request,
					resolve,
					server: serverAlias,
				}),
			);
			notifyListeners();
			try {
				const userDecision = await promise;
				if (userDecision.approved) {
					historyApi.updateHistory(historyEntry.id, {
						status: "success",
						result: { approved: true },
					});
					return {
						model: "test-model",
						role: "assistant",
						content: { type: "text", text: "This is a test response" },
					};
				}
				historyApi.updateHistory(historyEntry.id, {
					status: "error",
					error: "User rejected request.",
				});
				throw new Error("User rejected the sampling request.");
			} catch (error) {
				historyApi.updateHistory(historyEntry.id, {
					status: "error",
					error: error.message,
				});
				throw error;
			} finally {
				pendingSampling.delete(historyEntry.id);
				notifyListeners();
			}
		};

		host.requestHandlers.add([ElicitRequestSchema, handleElicitation]);
		host.requestHandlers.add([CreateMessageRequestSchema, handleSampling]);

		this.api.listElicitationRequests = () => {
			return historyApi.withHistory("elicitations:list", {}, async () => ({
				elicitationRequests: Array.from(pendingElicitation.entries()).map(
					([id, p]) => ({
						id,
						server: p.server,
						requestText: p.request.params.message,
						schema: p.request.params.requestedSchema,
					}),
				),
			}));
		};

		this.api.listSamplingRequests = () => {
			return historyApi.withHistory("sampling:list", {}, async () => ({
				samplingRequests: Array.from(pendingSampling.entries()).map(
					([id, p]) => ({ id, server: p.server, request: p.request.params }),
				),
			}));
		};

		this.api.respondToElicitation = ({
			id,
			response,
			server,
			action = "submit",
		}) => {
			return historyApi.withHistory(
				"elicitations:respond",
				{ id, response, server, action },
				async () => {
					const pendingReq = pendingElicitation.get(id);
					if (!pendingReq || pendingReq.server !== server)
						throw new Error(
							\`Request not found or server mismatch for id: \${id}\`,
						);
					pendingReq.resolve(
						action === "submit"
							? { action: "accept", content: response }
							: { action: "decline" },
					);
					return { success: true };
				},
			);
		};

		this.api.approveSamplingRequest = ({ id, server }) => {
			return historyApi.withHistory(
				"sampling:approve",
				{ id, server },
				async () => {
					const pendingReq = pendingSampling.get(id);
					if (!pendingReq || pendingReq.server !== server)
						throw new Error(
							\`Sampling request not found or server mismatch for id: \${id}\`,
						);
					pendingReq.resolve({ approved: true });
					return { success: true };
				},
			);
		};

		this.api.rejectSamplingRequest = ({ id, server }) => {
			return historyApi.withHistory(
				"sampling:reject",
				{ id, server },
				async () => {
					const pendingReq = pendingSampling.get(id);
					if (!pendingReq || pendingReq.server !== server)
						throw new Error(
							\`Sampling request not found or server mismatch for id: \${id}\`,
						);
					pendingReq.resolve({ approved: false });
					return { success: true };
				},
			);
		};
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/notifications.js":{content:`export default ({ ServerNotificationSchema }) => ({
	name: "notifications",
	initialize(host) {
		for (const schema of ServerNotificationSchema.options) {
			const method = schema.shape.method.value;
			host.requestHandlers.add([
				schema,
				(notification) => {
					console.log("MCP Notification Received", {
						method,
						notification,
					});
				},
			]);
		}
	},
	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/clients.js":{content:`export default ({ McpClient }) => ({
	name: "clients",

	initialize(host) {
		const historyApi = host.plugin("history");
		if (!historyApi)
			throw new Error("System plugin requires the History plugin.");
		host.addStore("clients", new Map());
		this.api.listClients = () => {
			return Array.from(host.clients.keys());
		};
		this.api.connect = async (transportConfig, options) => {
			const historyApi = host.plugin("history");
			return historyApi.withHistory(
				"server:connect",
				{ transportConfig, options },
				async () => {
					const { alias, assignedRoots = [] } = options;
					if (host.clients.has(alias)) {
						throw new Error(\`Client with alias '\${alias}' already exists.\`);
					}

					const transportPlugin = host.transports.get(transportConfig.type);
					if (!transportPlugin) {
						throw new Error(
							\`Unsupported transport type: '\${transportConfig.type}'\`,
						);
					}

					const transport = await transportPlugin.createTransport(
						transportConfig,
						{
							...host.dependencies,
							host: host,
							config: host.config,
						},
					);

					const client = new McpClient(
						{ name: \`host-client-for-\${alias}\`, version: "1.0.0" },
						{
							capabilities: {
								sampling: {},
								elicitation: {},
								logging: {},
								roots: { listChanged: true },
							},
						},
					);

					await client.connect(transport);
					host.clients.set(alias, client);
					[...host.requestHandlers].forEach(([schema, requestHandler]) =>
						client.setRequestHandler(schema, (request) =>
							requestHandler(request, alias),
						),
					);

					if (assignedRoots.length > 0) {
						const rootApi = host.plugin("roots");
						if (rootApi)
							await rootApi.assignRootsToServer(alias, assignedRoots);
					}

					await host._updateToolMapForAlias(alias);
					await host._updatePromptMapForAlias(alias);

					console.log(
						\`Client '\${alias}' connected via \${transportConfig.type}.\`,
					);
					return {
						alias,
						transportType: transportConfig.type,
						success: true,
					};
				},
			);
		};
		this.api.disconnect = async (alias) => {
			const historyApi = host.plugin("history");
			return historyApi.withHistory(
				"server:disconnect",
				{ alias },
				async () => {
					const client = host.clients.get(alias);
					if (!client) {
						console.warn(\`No client with alias '\${alias}' to disconnect.\`);
						return { success: false, message: "Client not found" };
					}
					await client.disconnect();
					host.clients.delete(alias);
					host._cleanupMappingsForAlias(alias);
					console.log(\`Client '\${alias}' disconnected.\`);
					return { alias, success: true };
				},
			);
		};
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/roots.js":{content:`export default {
	name: "roots",
	initialize(host) {
		const hostRoots = new Map();
		const serverRootAssignments = new Map();
		const rootChangeListeners = new Set();
		const historyApi = host.plugin("history");

		if (!historyApi)
			throw new Error("Root plugin requires the History plugin.");

		const notifyRootChanges = (action, uri) => {
			const event = {
				action,
				uri,
				root: hostRoots.get(uri),
				timestamp: new Date().toISOString(),
			};
			rootChangeListeners.forEach((listener) => listener(event));
		};

		const notifyServerOfRoots = async (serverAlias) => {
			const client = host.clients.get(serverAlias);
			const assignedRoots = this.api.getServerRoots(serverAlias);
			if (client && typeof client.setRoots === "function") {
				try {
					await client.setRoots(assignedRoots);
				} catch (error) {
					console.error(
						\`Failed to notify server \${serverAlias} of roots:\`,
						error,
					);
				}
			}
		};

		this.api.addRoot = (rootDefinition) => {
			const { uri, path, name, description } = rootDefinition;
			const rootUri = uri || path;
			if (!rootUri) throw new Error("Root URI or path is required");
			return historyApi.withHistory("root:add", { uri: rootUri }, async () => {
				hostRoots.set(rootUri, {
					uri: rootUri,
					name: name || rootUri,
					description: description || \`Root access to \${rootUri}\`,
				});
				notifyRootChanges("added", rootUri);
				return { uri: rootUri, success: true };
			});
		};

		this.api.removeRoot = (uri) => {
			return historyApi.withHistory("root:remove", { uri }, async () => {
				if (!hostRoots.has(uri))
					return { success: false, message: "Root does not exist" };
				hostRoots.delete(uri);
				serverRootAssignments.forEach((assigned) => assigned.delete(uri));
				notifyRootChanges("removed", uri);
				return { success: true };
			});
		};

		this.api.assignRootsToServer = (serverAlias, rootUris) => {
			return historyApi.withHistory(
				"root:assign",
				{ serverAlias, rootUris },
				async () => {
					if (!host.clients.has(serverAlias))
						throw new Error(\`Server \${serverAlias} is not connected\`);
					for (const uri of rootUris) {
						if (!hostRoots.has(uri))
							throw new Error(\`Root \${uri} does not exist\`);
					}
					serverRootAssignments.set(serverAlias, new Set(rootUris));
					await notifyServerOfRoots(serverAlias);
					return { serverAlias, assignedCount: rootUris.length };
				},
			);
		};

		this.api.validateResourceAccess = (serverAlias, resourceUri) => {
			const assignedRoots = serverRootAssignments.get(serverAlias);
			if (!assignedRoots) return false;
			for (const rootUri of assignedRoots) {
				if (resourceUri.startsWith(rootUri)) return true;
			}
			return false;
		};

		this.api.getServerRoots = (serverAlias) => {
			const assigned = serverRootAssignments.get(serverAlias);
			return assigned
				? Array.from(assigned)
						.map((uri) => hostRoots.get(uri))
						.filter(Boolean)
				: [];
		};

		this.api.onRootChange = (listener) => {
			rootChangeListeners.add(listener);
			return () => rootChangeListeners.delete(listener);
		};
	},
	api: {},
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/history.js":{content:`export default () => ({
	name: "history",
	initialize(host) {
		let history = [];
		const listeners = new Set();
		const notifyListeners = (action, entry) => {
			for (const listener of listeners) {
				try {
					listener({ action, entry, history: [...history] });
				} catch (error) {
					console.error("Error in history listener:", error);
				}
			}
		};
		this.api.onHistoryChange = (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		};

		this.api.addToHistory = (entry) => {
			const historyEntry = {
				id: Date.now() + Math.random(),
				timestamp: new Date().toISOString(),
				...entry,
			};
			history = [historyEntry, ...history];
			notifyListeners("add", historyEntry);
			return historyEntry;
		};

		this.api.updateHistory = (id, updates) => {
			let updatedEntry = null;
			history = history.map((h) => {
				if (h.id === id) {
					updatedEntry = {
						...h,
						...updates,
						updatedAt: new Date().toISOString(),
					};
					return updatedEntry;
				}
				return h;
			});
			if (updatedEntry) {
				notifyListeners("update", updatedEntry);
			}
			return updatedEntry;
		};

		this.api.getHistory = () => [...history];

		this.api.clearHistory = () => {
			history = [];
			notifyListeners("clear", null);
		};

		this.api.withHistory = async (operationName, args, operation) => {
			const historyEntry = this.api.addToHistory({
				toolName: operationName,
				args,
				status: "pending",
			});
			try {
				const result = await operation();
				this.api.updateHistory(historyEntry.id, {
					status: "success",
					result,
				});
				if (typeof result === "object" && result !== null && !result.history) {
					result.history = historyEntry;
				}
				return result;
			} catch (error) {
				console.error(\`Failed to execute \${operationName}:\`, error);
				this.api.updateHistory(historyEntry.id, {
					status: "error",
					error: error.message,
				});
				return { error, history: historyEntry };
			}
		};
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/chat.js":{content:`const adaptMessageToGemini = (msg) => {
	if (msg.content) {
		return {
			role: msg.role === "assistant" ? "model" : "user",
			parts: Array.isArray(msg.content)
				? msg.content.map((c) => ({ text: c.text }))
				: [{ text: msg.content }],
		};
	}
	if (msg.toolCalls) {
		return {
			role: "model",
			parts: msg.toolCalls.map((tc) => ({
				functionCall: { name: tc.name, args: tc.arguments },
			})),
		};
	}
	if (msg.role === "tool") {
		return {
			role: "function",
			parts: [
				{
					functionResponse: {
						name: msg.toolCallId,
						response: { result: msg.result },
					},
				},
			],
		};
	}
	return { role: "user", parts: [{ text: "" }] };
};

const adaptMessagesToGemini = (messages = []) =>
	messages.map(adaptMessageToGemini);

const adaptGeminiResponseToCommon = (geminiResponse) => {
	const candidate = geminiResponse.candidates?.[0];
	if (!candidate?.content?.parts?.[0]) {
		return { role: "assistant", content: "" };
	}
	const toolCalls = [];
	let content = "";
	for (const part of candidate.content.parts) {
		if (part.text) content += part.text;
		if (part.functionCall) {
			toolCalls.push({
				id: part.functionCall.name,
				name: part.functionCall.name,
				arguments: part.functionCall.args,
			});
		}
	}
	return {
		role: "assistant",
		content: content || null,
		toolCalls: toolCalls.length > 0 ? toolCalls : null,
	};
};

const adaptMcpToolToGemini = (mcpTool) => ({
	name: mcpTool.name.replace(/\\//g, "__"),
	description: mcpTool.description,
	parameters: { type: "OBJECT", properties: mcpTool.inputSchema.properties },
});

const callGeminiAPI = async ({
	apiKey,
	model,
	messages,
	generationConfig,
	tools,
}) => {
	const API_ENDPOINT = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`;
	const payload = {
		contents: messages,
		generationConfig,
		...(tools?.length > 0 && { tools: [{ functionDeclarations: tools }] }),
	};
	const response = await fetch(API_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`Gemini API Error: \${errorBody.error?.message || response.statusText}\`,
		);
	}
	return response.json();
};

async function* callStreamingGeminiAPI({
	apiKey,
	model,
	messages,
	generationConfig,
	tools,
}) {
	const API_ENDPOINT = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:streamGenerateContent?key=\${apiKey}&alt=sse\`;
	const payload = {
		contents: messages,
		generationConfig,
		...(tools?.length > 0 && { tools: [{ functionDeclarations: tools }] }),
	};
	const response = await fetch(API_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`Gemini Streaming API Error: \${errorBody.error?.message || response.statusText}\`,
		);
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\\n");
		buffer = lines.pop();
		for (const line of lines) {
			if (line.startsWith("data: ")) {
				try {
					yield JSON.parse(line.substring(6));
				} catch (e) {
					console.error("Failed to parse stream chunk:", line);
				}
			}
		}
	}
}

const googleProvider = {
	name: "google",
	defaultModel: "gemini-1.5-flash",
	adaptMessages: adaptMessagesToGemini,
	adaptTools: (tools) => tools.map(adaptMcpToolToGemini),
	adaptResponse: adaptGeminiResponseToCommon,
	callAPI: callGeminiAPI,
	streamAPI: callStreamingGeminiAPI,
	validateConfig: (config) => {
		if (!config.geminiApiKey) console.warn("Google API key is missing."); // Not throwing error as it might be proxied
		return true;
	},
};

const adaptMessageToOpenRouter = (msg) => {
	if (msg.role === "tool") {
		const result = msg.structuredContent?.result || msg.result || msg.content;
		return {
			role: "tool",
			tool_call_id: msg.toolCallId,
			content: typeof result === "string" ? result : JSON.stringify(result),
		};
	}
	if (msg.toolCalls) {
		return {
			role: "assistant",
			content: null,
			tool_calls: msg.toolCalls.map((tc) => ({
				id: tc.id,
				type: "function",
				function: {
					name: tc.name,
					arguments:
						typeof tc.arguments === "string"
							? tc.arguments
							: JSON.stringify(tc.arguments),
				},
			})),
		};
	}
	if (msg.content) {
		return {
			role: msg.role,
			content: Array.isArray(msg.content)
				? msg.content.map((c) => c.text || c).join("\\n")
				: msg.content,
		};
	}
	return { role: "user", content: "" };
};

const adaptMessagesToOpenRouter = (messages = []) =>
	messages.map(adaptMessageToOpenRouter);

const adaptOpenRouterResponseToCommon = (openRouterResponse) => {
	const choice = openRouterResponse.choices?.[0];
	if (!choice) return { role: "assistant", content: "" };
	const { message } = choice;
	if (message.tool_calls?.length > 0) {
		return {
			role: "assistant",
			toolCalls: message.tool_calls.map((tc) => ({
				id: tc.id,
				name: tc.function.name,
				arguments:
					typeof tc.function.arguments === "string"
						? JSON.parse(tc.function.arguments)
						: tc.function.arguments,
			})),
		};
	}
	return { role: "assistant", content: message.content ?? "" };
};

const adaptMcpToolToOpenRouter = (mcpTool) => ({
	type: "function",
	function: {
		name: mcpTool.name.replace(/\\//g, "__"),
		description: mcpTool.description,
		parameters: mcpTool.inputSchema,
	},
});

const callOpenRouterAPI = async ({
	apiKey,
	model,
	messages,
	generationConfig,
	tools,
}) => {
	const API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
	const payload = {
		model,
		messages,
		...generationConfig,
		...(tools?.length > 0 && { tools }),
	};
	const response = await fetch(API_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: \`Bearer \${apiKey}\`,
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`OpenRouter API Error: \${errorBody.error?.message || response.statusText}\`,
		);
	}
	return response.json();
};

async function* callStreamingOpenRouterAPI({
	apiKey,
	model,
	messages,
	generationConfig,
	tools,
}) {
	const API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
	const payload = {
		model,
		messages,
		...generationConfig,
		...(tools?.length > 0 && { tools }),
		stream: true,
	};
	const response = await fetch(API_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: \`Bearer \${apiKey}\`,
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`OpenRouter Streaming API Error: \${errorBody.error?.message || response.statusText}\`,
		);
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\\n");
		buffer = lines.pop();
		for (const line of lines) {
			if (line.startsWith("data: ") && line.substring(6).trim() !== "[DONE]") {
				try {
					yield JSON.parse(line.substring(6));
				} catch (e) {
					console.error("Failed to parse stream chunk:", line);
				}
			}
		}
	}
}

const openRouterProvider = {
	name: "openrouter",
	defaultModel: "anthropic/claude-3.5-sonnet",
	adaptMessages: adaptMessagesToOpenRouter,
	adaptTools: (tools) => tools.map(adaptMcpToolToOpenRouter),
	adaptResponse: adaptOpenRouterResponseToCommon,
	callAPI: callOpenRouterAPI,
	streamAPI: callStreamingOpenRouterAPI,
	validateConfig: (config) => {
		if (!config.openrouterApiKey)
			throw new Error("OpenRouter API key is required.");
		return true;
	},
};

// --- NEW LOCAL PROVIDER LOGIC ---

// Helper function for calling any OpenAI-compatible API endpoint
const callLocalAPI = async ({
	config,
	model,
	messages,
	generationConfig,
	tools,
}) => {
	const { localAIEndpoint, localAIApiKey } = config;
	const payload = {
		model,
		messages,
		...generationConfig,
		...(tools?.length > 0 && { tools }),
	};
	const response = await fetch(localAIEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(localAIApiKey && { Authorization: \`Bearer \${localAIApiKey}\` }),
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`Local AI API Error: \${errorBody.error?.message || response.statusText}\`,
		);
	}
	return response.json();
};

// Helper for streaming from any OpenAI-compatible endpoint
async function* streamLocalAPI({
	config,
	model,
	messages,
	generationConfig,
	tools,
}) {
	const { localAIEndpoint, localAIApiKey } = config;
	const payload = {
		model,
		messages,
		...generationConfig,
		...(tools?.length > 0 && { tools }),
		stream: true,
	};
	console.log({ localAIEndpoint });
	const response = await fetch(localAIEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(localAIApiKey && { Authorization: \`Bearer \${localAIApiKey}\` }),
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`Local AI Streaming Error: \${errorBody.error?.message || response.statusText}\`,
		);
	}
	// Re-use the same streaming logic as OpenRouter
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\\n");
		buffer = lines.pop();
		for (const line of lines) {
			if (line.startsWith("data: ") && line.substring(6).trim() !== "[DONE]") {
				try {
					yield JSON.parse(line.substring(6));
				} catch (e) {
					console.error("Failed to parse stream chunk:", line);
				}
			}
		}
	}
}

const localAIProvider = {
	name: "local",
	defaultModel: "local-model", // This is usually ignored by local servers
	adaptMessages: adaptMessagesToOpenRouter,
	adaptTools: (tools) => tools.map(adaptMcpToolToOpenRouter),
	adaptResponse: adaptOpenRouterResponseToCommon,
	callAPI: callLocalAPI,
	streamAPI: streamLocalAPI,
	validateConfig: (config) => {
		if (!config.localAIEndpoint) {
			throw new Error(
				"Local AI provider requires 'localAIEndpoint' in config.",
			);
		}
		return true;
	},
};

const providers = {
	google: googleProvider,
	openrouter: openRouterProvider,
	local: localAIProvider,
};
const getProvider = (name) => {
	const provider = providers[name];
	if (!provider) throw new Error(\`Provider '\${name}' not found.\`);
	return provider;
};

export default () => ({
	name: "chat",
	initialize(host) {
		const historyApi = host.plugin("history");
		if (!historyApi)
			throw new Error("Chat plugin requires the History plugin.");

		const toolsApi = host.plugin("tools");
		if (!toolsApi)
			throw new Error(
				"Chat plugin requires the Tools plugin for tool execution.",
			);

		const createStreamChatHandler = async function* (messages, options) {
			const currentMessages = [...messages];
			const {
				enabledTools = [],
				provider: providerName = "openrouter",
				model,
				...generationConfig
			} = options;
			const toolAliases = Array.from(host.clients.keys());

			const provider = getProvider(providerName);
			provider.validateConfig(host.config);
			const { tools: mcpTools } = await toolsApi.listTools({
				servers: toolAliases.filter((alias) =>
					enabledTools.some(
						(toolName) => host.toolToAliasMap.get(toolName) === alias,
					),
				),
			});
			const adaptedTools = provider.adaptTools(
				mcpTools.filter((t) => enabledTools.includes(t.name)),
			);
			const adaptedMessages = provider.adaptMessages(currentMessages);
			const selectedModel = model || provider.defaultModel;

			const stream = provider.streamAPI({
				config: host.config, // Pass the full config object
				apiKey: host.config[\`\${providerName}ApiKey\`], // For existing providers
				model: selectedModel,
				messages: adaptedMessages,
				generationConfig,
				tools: adaptedTools,
			});
			let fullContent = "";
			let finishReason = null;
			const toolCallChunks = {};

			if (providerName === "openrouter" || providerName === "local") {
				for await (const chunk of stream) {
					const choice = chunk.choices?.[0];
					if (!choice) continue;
					const { delta } = choice;
					if (delta?.content) {
						fullContent += delta.content;
						yield {
							type: "content",
							content: fullContent,
							isComplete: false,
						};
					}
					if (delta?.tool_calls) {
						for (const toolCallDelta of delta.tool_calls) {
							const { index } = toolCallDelta;
							if (!toolCallChunks[index])
								toolCallChunks[index] = {
									id: "",
									type: "function",
									function: { name: "", arguments: "" },
								};
							const current = toolCallChunks[index];
							if (toolCallDelta.id) current.id = toolCallDelta.id;
							if (toolCallDelta.function?.name)
								current.function.name += toolCallDelta.function.name;
							if (toolCallDelta.function?.arguments)
								current.function.arguments += toolCallDelta.function.arguments;
						}
					}
					if (choice.finish_reason) finishReason = choice.finish_reason;
				}
			} else if (providerName === "google") {
				for await (const chunk of stream) {
					const response = provider.adaptResponse(chunk);
					if (response.content) {
						fullContent += response.content;
						yield {
							type: "content",
							content: fullContent,
							isComplete: false,
						};
					}
					if (response.toolCalls) {
						response.toolCalls.forEach((tc, index) => {
							toolCallChunks[index] = {
								id: tc.id,
								function: {
									name: tc.name,
									arguments: JSON.stringify(tc.arguments),
								},
							};
						});
					}
				}
				finishReason =
					Object.keys(toolCallChunks).length > 0 ? "tool_calls" : "stop";
			}

			const finalToolCalls = Object.values(toolCallChunks).map((tc) => ({
				id: tc.id,
				name: tc.function.name,
				arguments: JSON.parse(tc.function.arguments || "{}"),
			}));

			if (finishReason === "tool_calls" && finalToolCalls.length > 0) {
				yield { type: "tool_calls_start", toolCalls: finalToolCalls };
				currentMessages.push({
					role: "assistant",
					content: null,
					toolCalls: finalToolCalls,
				});

				const toolResponses = [];
				for (const toolCall of finalToolCalls) {
					const originalToolName = toolCall.name.replace(/__/g, "/");
					try {
						const result = await toolsApi.callTool(
							originalToolName,
							toolCall.arguments,
						);
						yield { type: "tool_result", name: originalToolName, result };
						toolResponses.push({
							role: "tool",
							toolCallId: toolCall.id,
							result: result.result,
						});
					} catch (error) {
						yield {
							type: "tool_error",
							name: originalToolName,
							error: error.message,
						};
						toolResponses.push({
							role: "tool",
							toolCallId: toolCall.id,
							result: { error: error.message },
						});
					}
				}
				currentMessages.push(...toolResponses);
			} else {
				yield {
					type: "content",
					content: fullContent,
					isComplete: true,
					toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined,
				};
			}
		};

		const createChatHandler = async (messages, options) => {
			const stream = createStreamChatHandler(messages, options);
			let lastChunk = {};
			for await (const chunk of stream) {
				lastChunk = chunk;
			}
			return {
				content: lastChunk.content,
				toolCalls: lastChunk.toolCalls,
			};
		};

		this.api.chat = (messages, options = {}) => {
			const { stream, ...restOptions } = options;
			const operationName = stream ? "llm:stream_chat" : "llm:chat";

			if (stream) {
				return createStreamChatHandler(messages, restOptions);
			}

			return historyApi.withHistory(operationName, { messages, options }, () =>
				createChatHandler(messages, restOptions),
			);
		};
	},
	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/conversations.js":{content:`export default () => ({
	name: "conversation",

	initialize(host) {
		const conversations = new Map();
		const conversationListeners = new Set();
		const historyApi = host.plugin("history");

		if (!historyApi)
			throw new Error("Conversation plugin requires the History plugin.");

		const notifyListeners = (action, conversation) => {
			conversationListeners.forEach((listener) => {
				try {
					listener({
						action,
						conversation,
						conversations: Object.fromEntries(conversations),
					});
				} catch (error) {
					console.error("Error in conversation listener:", error);
				}
			});
		};

		this.api.onConversationChange = (listener) => {
			conversationListeners.add(listener);
			return () => conversationListeners.delete(listener);
		};

		this.api.createConversation = (params = {}) => {
			return historyApi.withHistory(
				"conversation:create",
				{ params },
				async () => {
					const id = params.id || \`conv_\${Date.now()}\`;
					if (conversations.has(id))
						throw new Error(\`Conversation with id \${id} already exists.\`);
					const newConversation = {
						id,
						title: params.title || "New Conversation",
						messages: params.messages || [],
						createdAt: new Date().toISOString(),
						...params,
					};
					conversations.set(id, newConversation);
					notifyListeners("create", newConversation);
					return newConversation;
				},
			);
		};

		this.api.deleteConversation = (id) => {
			return historyApi.withHistory("conversation:delete", { id }, async () => {
				if (!conversations.has(id))
					throw new Error(\`Conversation with id \${id} not found.\`);
				conversations.delete(id);
				notifyListeners("delete", { id });
				return { success: true, deletedId: id };
			});
		};

		this.api.getConversation = (id) => conversations.get(id);

		this.api.listConversations = () => Array.from(conversations.values());

		this.api.addMessage = ({ conversationId, message }) => {
			return historyApi.withHistory(
				"conversation:addMessage",
				{ conversationId },
				async () => {
					const conversation = conversations.get(conversationId);
					if (!conversation)
						throw new Error(
							\`Conversation with id \${conversationId} not found.\`,
						);

					conversation.messages.push(message);

					const chatApi = host.plugin("chat");
					const response = await chatApi.chat(conversation.messages);

					conversation.messages.push({
						role: "assistant",
						content: response.content,
					});
					conversations.set(conversationId, conversation);
					notifyListeners("update", conversation);
					return conversation;
				},
			);
		};

		this.api.getConversationContext = (messages, maxLength = 500) => {
			if (messages.length <= 2) return null;
			return historyApi.withHistory(
				"conversation:get_context",
				{ messageCount: messages.length },
				async () => {
					const chatApi = host.plugin("chat");
					const contextMessages = [
						{
							role: "system",
							content: \`Provide a brief context summary of this conversation in \${maxLength} characters or less. Focus on key topics, decisions, and current state.\`,
						},
						...messages.slice(-10),
						{
							role: "user",
							content:
								"Summarize the key context from our conversation so far.",
						},
					];
					try {
						const response = await chatApi.chat(contextMessages);
						return {
							summary: response.content,
							messageCount: messages.length,
							generatedAt: new Date().toISOString(),
						};
					} catch (error) {
						console.error("Failed to generate context summary:", error);
						return null;
					}
				},
			);
		};

		this.api.summarizeConversation = (messages, maxLength = 150) => {
			return historyApi.withHistory(
				"conversation:summarize",
				{ messageCount: messages.length },
				async () => {
					const chatApi = host.plugin("chat");
					const summaryMessages = [
						{
							role: "system",
							content: \`Please provide a brief summary of this conversation in \${maxLength} characters or less.\`,
						},
						...messages,
						{ role: "user", content: "Please summarize our conversation." },
					];
					const response = await chatApi.chat(summaryMessages);
					return {
						summary: response.content || "",
						messageCount: messages.length,
						generatedAt: new Date().toISOString(),
					};
				},
			);
		};

		this.api.trimConversation = (messages, maxTokens = 4000) => {
			return historyApi.withHistory(
				"conversation:trim",
				{ messageCount: messages.length, maxTokens },
				async () => {
					let totalTokens = 0;
					const trimmedMessages = [];
					if (messages[0]?.role === "system") {
						trimmedMessages.push(messages[0]);
						totalTokens += Math.ceil(messages[0].content.length / 4);
					}
					for (
						let i = messages.length - 1;
						i >= (messages[0]?.role === "system" ? 1 : 0);
						i--
					) {
						const message = messages[i];
						const messageTokens = Math.ceil((message.content || "").length / 4);
						if (
							totalTokens + messageTokens > maxTokens &&
							trimmedMessages.length > (messages[0]?.role === "system" ? 1 : 0)
						)
							break;
						trimmedMessages.unshift(message);
						totalTokens += messageTokens;
					}
					return {
						messages: trimmedMessages,
						originalCount: messages.length,
						trimmedCount: trimmedMessages.length,
						estimatedTokens: totalTokens,
					};
				},
			);
		};
	},

	api: {},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/admin/index.js":{content:`export const dependencies = {
	cms: "/modules/apps/cms/index.js",
	drive: "/modules/apps/drive/index.js",
	project: "/modules/apps/project/index.js",
	IDE: "/modules/apps/ide/index.js",
	chat: "/modules/apps/chat/index.js",
	editor: "/modules/apps/editor/index.js",
	Bundler: "/modules/apps/bundler/index.js",
	mcp: "/modules/apps/mcp/index.js",
};

export default ({ $APP, html }) => {
	$APP.addModule({
		name: "admin",
		path: "apps/admin/views",
	});

	const routes = {
		"/admin": {
			component: () => html\`<cms-ui directory="admin/cms"></cms-ui>\`,
			title: "Admin",
			template: "admin-template",
		},
		"/admin/cms": {
			component: () => html\`<cms-ui directory="admin/cms"></cms-ui>\`,
			title: "Data",
			template: "admin-template",
		},
		"/admin/ide": {
			component: () =>
				html\`<ide-ui full directory="/projects" hasProject></ide-ui>\`,
			title: "IDE",
			template: "admin-template",
		},
		"/admin/bundler": {
			component: () => html\`<bundler-ui></bundler-ui>\`,
			title: "Bundler",
			template: "admin-template",
		},
		"/admin/project": {
			component: () =>
				html\`<cms-crud
							view="board"
							class="p-8"
							._data=\${{ model: "tasks" }} 
							.allowedActions=\${["import", "export", "changeViewMode", "changeColumns"]}></cms-crud>\`,
			title: "Data",
			template: "admin-template",
		},
		"/admin/design": {
			component: () => html\`<design-ui></design-ui>\`,
			title: "Design",
			template: "admin-template",
		},
		"/admin/design/:component": {
			component: ({ component }) =>
				html\`<design-ui component=\${component}></design-ui>\`,
			title: "Component Design",
			template: "admin-template",
		},
		"/admin/cms/:model": {
			component: ({ model }) =>
				html\`<cms-ui directory="admin/cms" model=\${model}></cms-ui>\`,
			title: "Admin",
			template: "admin-template",
		},
		"/admin/cms/:model/:id": {
			name: "cms_item",
			component: ({ model, id }) =>
				html\`<cms-ui directory="admin/cms" model=\${model} selectedId=\${id}></cms-ui>\`,
			title: "Admin",
			template: "admin-template",
		},
		"/admin/mcp": {
			component: () => html\`<mcp-inspector></mcp-inspector>\`,
			title: "MCP Inspector",
			template: "admin-template",
		},
		"/admin/mcp-dev": {
			component: () => html\`<mcp-dev></mcp-dev>\`,
			title: "Chat",
			template: "admin-template",
		},
		"/admin/mcp-chat": {
			component: () => html\`<mcp-chat></mcp-chat>\`,
			title: "Chat",
			template: "admin-template",
		},
		"/admin/chat": {
			component: () =>
				html\`<app-chat class="flex-1 flex h-screen bg-gray-100 font-sans"></app-chat>\`,
			title: "Data",
			template: "admin-template",
		},
	};

	$APP.routes.set(routes);
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/cms/index.js":{content:`export default ({ $APP }) =>
	$APP.addModule({
		name: "cms",
		path: "apps/cms/views",
		settings: {
			appbar: {
				label: "Data",
				icon: "database",
			},
		},
	});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/drive/index.js":{content:`export const migration = true;
export default ({ $APP }) =>
	$APP.addModule({
		name: "drive",
		path: "apps/drive",
		backend: true,
	});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/project/index.js":{content:`export const migration = true;

export default ({ $APP, Controller }) => {
	const commands = {
		"project:new-project": async ({ IDE }) => {
			const name = prompt("Enter the new project name:");
			if (name) {
				const files = $APP.project.newProjectTemplate(name);
				await IDE.filesystem.createFiles(files);
				Controller.local.set("selectedProject", name);
			}
		},
		"project:open-project": async ({ IDE }) => {
			Controller.local.set("selectedProject", null);
			Controller.local.set("selectedProjectConfig", null);
		},
		"project:save-project": async ({ IDE }) => {
			const project = IDE.project.getCurrent();
			if (project) {
				await IDE.project.save(project);
			}
		},
		"project:close-project": async () => {
			if (confirm("Are you sure you want to close the project?")) {
				Controller.local.set("selectedProject", null);
				Controller.local.set("selectedProjectConfig", null);
			}
		},
		"project:delete-project": async ({ IDE }) => {
			const project = IDE.project.getCurrent();
			if (project && confirm(\`Delete project \${project.name}?\`)) {
				await IDE.project.delete(project);
			}
		},
	};

	const keybindings = {
		"ctrl+n": "project:new-project",
		"ctrl+o": "project:open-project",
		"ctrl+shift+d": "project:delete-project",
	};

	const menu = {
		"project:new-project": "New Project...",
		"project:open-project": "Open Project...",
		"project:close-project": "Close Project",
		"project:delete-project": "Delete Project",
	};

	$APP.settings.add("globalKeybindings", keybindings);
	$APP.settings.add("commands", commands);
	$APP.settings.add("menu", menu);

	$APP.addModule({
		name: "project",
		path: "apps/project",
		settings: {
			appbar: {
				label: "Management",
				icon: "folder",
			},
		},
	});
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/index.js":{content:`import "/modules/apps/ide/plugins/highlight.js";
import "/modules/apps/ide/plugins/format.js";
import "/modules/apps/ide/plugins/explorer.js";
import "/modules/apps/ide/plugins/edit.js";
import "/modules/apps/ide/plugins/markdown.js";
import "/modules/apps/ide/plugins/keybindings.js";
import "/modules/apps/ide/highlights/css.js";
import "/modules/apps/ide/highlights/html.js";
import "/modules/apps/ide/highlights/javascript.js";

export const dependencies = {
	FileSystemAdapter: "/modules/sw/adapter.js",
};

const languagesByExtension = {
	css: "css",
	html: "html",
	js: "javascript",
	md: "markdown",
};

const getLanguage = (name) =>
	languagesByExtension[name.split(".").at(-1)] || "javascript";

export default ({ $APP, FileSystemAdapter, Controller }) => {
	const { ram, local } = Controller;

	const createIDE = () => {
		const settings = $APP.settings.IDE;
		const filesystem = new FileSystemAdapter();

		const getActiveEditor = () => {
			return window.$("editor-textarea");
		};

		const getExplorer = () => {
			const explorer = window.$("editor-explorer");
			return explorer?.q("editor-explorer");
		};

		const getActiveFile = () => {
			const tabs = local.get("tabs");
			const tabIndex = local.get("activeTab");
			return tabs[tabIndex];
		};

		const saveFile = (file) => {
			filesystem.saveFile(file).then(() => {
				const preview = window.$("ide-preview");
				if (preview) preview.reload();
			});
		};

		const listFiles = async (path) => {
			const files = await $APP.SW.request("FS:LIST_FILES", { path });
			return files;
		};
		const listSystemFiles = async (path) => {
			const files = await $APP.SW.request("FS:LIST_FILES", {
				path,
				system: true,
			});
			return files;
		};
		const openFile = async (path, system = false) => {
			const file = await $APP.SW.request("FS:READ_FILE", { path, system });
			if (!file) return;
			window.$("editor-tabs").addTab({
				name: path.split("/").at(-1),
				path,
				content: file.content,
				original: file.content,
				language: getLanguage(path),
				system,
			});
		};

		const executeCommand = (commandId, _args = {}) => {
			const handler = $APP.settings.commands[commandId];
			if (handler) {
				const panel = getActiveEditor();
				const explorer = getExplorer();
				const IDE = ram.get("IDE");
				const editor = window.$("editor-textarea");
				const input = editor?.q("textarea");
				const args = {
					settings,
					IDE,
					panel,
					editor,
					explorer,
					input,
					..._args,
				};

				$APP.hooks.emit(commandId, args);
				handler(args);
			} else console.warn(\`Command \${commandId} is not registered.\`);
		};
		const getCommand = (commandId) => $APP.settings.commands[commandId];

		const normalizeKeyCombo = (keyCombo) => {
			return keyCombo.toLowerCase().split("+").sort().join("+");
		};

		const extractKeyCombo = (event) =>
			normalizeKeyCombo(
				(event.ctrlKey ? "ctrl+" : "") +
					(event.metaKey ? "meta+" : "") +
					(event.altKey ? "alt+" : "") +
					(event.shiftKey ? "shift+" : "") +
					event.key,
			);

		const createKeydownHandler = (bindings = "globalKeybindings") => {
			return (event, context) => {
				const keyCombo = extractKeyCombo(event);
				if ($APP.settings?.[bindings][keyCombo]) {
					event.preventDefault();
					console.log($APP.settings?.[bindings][keyCombo]);
					executeCommand($APP.settings?.[bindings][keyCombo], context);
				}
			};
		};

		const handleEditorKeydown = createKeydownHandler("editorKeybindings");
		const handleGlobalKeydown = createKeydownHandler("globalKeybindings");

		const attachKeybindings = (input, context) => {
			detachKeybindings();
			input.addEventListener("keydown", (event) =>
				handleEditorKeydown(event, { ...context, event }),
			);
		};

		const detachKeybindings = () => {};

		const attachGlobalKeybindings = () => {
			detachGlobalKeybindings();
			window.addEventListener("keydown", handleGlobalKeydown);
		};

		const detachGlobalKeybindings = () => {
			window.removeEventListener("keydown", handleGlobalKeydown);
		};

		const getMenuItems = () => {
			const groupedMenuItems = {};
			const menuItems = $APP.settings.menu || {};
			Object.keys(menuItems).forEach((menuId) => {
				const menuItem = menuItems[menuId];
				const [category] = menuId.split(":");
				if (!groupedMenuItems[category]) {
					groupedMenuItems[category] = {
						label: capitalize(category),
						items: [],
					};
				}
				groupedMenuItems[category].items.push([menuItem, menuId]);
			});

			return Object.values(groupedMenuItems);
		};

		const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

		return {
			getActiveEditor,
			getActiveFile,
			openFile,
			saveFile,
			listFiles,
			listSystemFiles, // NEW: Expose the new function
			filesystem,
			getCommand,
			executeCommand,
			attachKeybindings,
			attachGlobalKeybindings,
			detachKeybindings,
			detachGlobalKeybindings,
			getMenuItems,
		};
	};

	$APP.addModule({
		name: "ide",
		alias: "IDE",
		backend: true,
		path: "apps/ide/views",
		settings: {
			useTabs: false,
			tabSize: 2,
			autoClosing: true,
			appbar: {
				label: "IDE - Code Editor",
				icon: "code",
			},
		},
	});

	const manager = createIDE();
	ram.set("IDE", manager);
	return manager;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/plugins/highlight.js":{content:`import $APP from "/bootstrap.js";

const Highlight = {
	name: "highlight",
	applyHighlighting({ language, code }) {
		const highlighter = $APP.settings.highlights[language] || { regex: [] };
		const tokens = this.tokenize(code, highlighter.regex);
		const lines = this.tokensToHTMLLines(tokens, language);
		return lines.map((line, index) => \`\${line || ""}\\n\`).join("");
	},

	tokenize(source, tokenSpec) {
		const tokens = [];
		let remaining = source;
		while (remaining.length > 0) {
			let matched = false;
			for (const [regex, type] of tokenSpec) {
				const match = regex.exec(remaining);
				if (match && match.index === 0) {
					tokens.push({ text: match[0], type });
					remaining = remaining.slice(match[0].length);
					matched = true;
					break;
				}
			}
			if (!matched) {
				tokens.push({ text: remaining[0], type: "plain" });
				remaining = remaining.slice(1);
			}
		}
		return tokens;
	},

	tokensToHTMLLines(tokens, language) {
		const lines = [];
		let currentLineTokens = [];
		for (const token of tokens) {
			const parts = token.text.split("\\n");
			parts.forEach((part, index) => {
				if (index > 0) {
					lines.push(this.renderTokens(currentLineTokens, language));
					currentLineTokens = [];
				}
				if (part.length > 0)
					currentLineTokens.push({ text: part, type: token.type });
			});
		}
		lines.push(this.renderTokens(currentLineTokens, language));
		return lines;
	},

	renderTokens(tokens, language) {
		return tokens
			.map((token) => {
				if (token.type === "WHITESPACE") {
					return token.text
						.replace(/\\t/g, "&nbsp;&nbsp;")
						.replace(/ /g, "&nbsp;");
				}
				if (token.type === "plain")
					return \`<editor-tag \${language} plain>\${this.escapeHTML(token.text)}</editor-tag>\`;
				return \`<editor-tag \${language} \${token.type.toLowerCase()}>\${this.escapeHTML(token.text)}</editor-tag>\`;
			})
			.join("");
	},

	escapeHTML(str) {
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	},
};

$APP.settings.add("commands", {
	"highlight:apply": Highlight.applyHighlighting.bind(Highlight),
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/plugins/format.js":{content:`import $APP from "/bootstrap.js";

const Format = {
	handleKeydown({ event, input, editor }) {
		const { selectionStart: start, selectionEnd: end } = input;
		const { key } = event;
		if (Format.isCharacterKey(event)) {
			if (Format.isOpeningBrace(key) || Format.isQuote(key)) {
				event.preventDefault();
				Format.handleAutoComplete({ key, start, end, input, editor });
			} else if (start !== end) {
				event.preventDefault();
				Format.handleReplaceSelection({ key, start, end, input, editor });
			}
		} else if (key === "Backspace" || key === "Delete") {
			Format.handleDelete({ key, start, end, input, editor, event });
		}
	},

	handleAutoComplete({ key, start, end, input, editor }) {
		const pair = Format.getPair(key);
		const newText = \`\${key}\${pair}\`;
		Format.updateContent({
			input,
			start,
			end,
			newText,
			cursorPosition: start + 1,
			editor,
		});
	},

	handleReplaceSelection({ key, start, end, input, editor }) {
		Format.updateContent({
			input,
			start,
			end,
			cursorPosition: start + 1,
			newText: key,
			editor,
		});
	},

	handleDelete({ key, start, end, input, editor, event }) {
		const charBefore = input.value[start - 1];
		const charAfter = input.value[start];

		if (Format.isMatchingPair(charBefore, charAfter)) {
			event.preventDefault();
			Format.updateContent({
				input,
				start: start - 1,
				end: end + 1,
				cursorPosition: start - 1,
				newText: "",
				editor,
			});
		} else if (Format.isIndentationDeletion({ key, start, input })) {
			event.preventDefault();
			Format.updateContent({
				input,
				start: start - 2,
				cursorPosition: start - 2,
				end,
				newText: "",
				editor,
			});
		}
	},

	updateContent({ input, start, end, cursorPosition, newText, editor }) {
		const value = input.value;
		const newValue = value.slice(0, start) + newText + value.slice(end);
		if (newValue !== value) {
			editor.updateContent(newValue);
			if (cursorPosition) {
				setTimeout(() => {
					input.selectionStart = cursorPosition;
					input.selectionEnd = cursorPosition;
				}, 0);
			}
		}
	},

	trimTrailingLines(content) {
		// Remove all trailing empty lines and leave only one maximum
		return content.replace(/\\s+$/g, "\\n").replace(/\\n{2,}$/, "\\n");
	},

	// Utility functions
	isOpeningBrace(key) {
		return ["{", "(", "["].includes(key);
	},

	isQuote(key) {
		return ['"', "'", "\`"].includes(key);
	},

	getPair(key) {
		const pairs = {
			"{": "}",
			"(": ")",
			"[": "]",
			'"': '"',
			"'": "'",
			"\`": "\`",
		};
		return pairs[key];
	},

	isMatchingPair(charBefore, charAfter) {
		const pair = Format.getPair(charBefore);
		return pair === charAfter;
	},

	isIndentationDeletion({ key, start, input }) {
		if (key !== "Backspace" || start < 2) return false;
		const textBefore = input.value.slice(start - 2, start);
		return textBefore === "  "; // Check if we're deleting an indent (two spaces)
	},

	isCharacterKey(event) {
		if (event.ctrlKey || event.altKey || event.metaKey) {
			return false;
		}
		// A key is a character key if event.key is a single character (excluding control keys)
		// and event.code is not part of the non-character key codes.
		const key = event.key;
		const code = event.code;

		if (key.length === 1) return true;

		if (code === "Enter") return false;

		return !(
			code.startsWith("Arrow") ||
			code.startsWith("Home") ||
			code.startsWith("End") ||
			code.startsWith("Page") ||
			[
				"Tab",
				"Escape",
				"Backspace",
				"Delete",
				"Control",
				"Alt",
				"Shift",
				"ContextMenu",
			].includes(key)
		);
	},
};
const editorCommands = {
	"editor:auto-complete": ({ key, start, end, input, editor }) => {
		const pair = Format.getPair(key);
		const newText = \`\${key}\${pair}\`;
		Format.updateContent({
			input,
			start,
			end,
			newText,
			cursorPosition: start + 1,
			editor,
		});
	},
	"editor:replace-selection": (args) => {
		Format.handleReplaceSelection(args);
	},
	"editor:delete-pair": (args) => {
		Format.handleDelete(args);
	},
	"editor:trim-trailing-lines": (args) => {
		Format.trimTrailingLines(args);
	},
};

$APP.hooks.on("onEditorInit", ({ editor, input }) => {
	input.addEventListener("keydown", (event) =>
		Format.handleKeydown({ event, input, editor }),
	);
});

$APP.hooks.on("onFileOpen", ({ editor, settings, file }) => {
	let content;
	if (!settings.useTabs) {
		const tabSize = settings.tabSize || 2;
		const spaceEquivalent = " ".repeat(tabSize);
		content = file.content.replace(/\\t/g, spaceEquivalent);
	}
	content = Format.trimTrailingLines(content);
	editor.updateContent(content);
});

$APP.settings.add("commands", editorCommands);
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/plugins/explorer.js":{content:`import $APP from "/bootstrap.js";

const explorerCommands = {
	"file:new-file": async ({ IDE, explorer, directory = "/" }) => {
		setTimeout(async () => {
			const name = prompt("What's the file name?");
			if (name) {
				const file = await IDE.filesystem.createFile({
					name,
					directory,
					content: "",
				});
				if (file) {
					explorer.selectItem(file);
				}
			}
		}, 16);
	},
	"file:new-folder": async ({ IDE, directory = "/" }) => {
		setTimeout(async () => {
			const name = prompt("What's the folder name?");
			if (name) {
				await IDE.filesystem.createFolder({ name, directory });
			}
		}, 16);
	},
	"file:new-window": () => {
		console.log("New Window command executed");
		const currentUrl = window.location.href;
		window.open(currentUrl, "_blank");
	},
	"file:open-file": async ({ IDE }) => {
		const fileData = await IDE.filesystem.openFile();
		if (fileData) {
			IDE.openFile(fileData);
		}
	},
	"file:open-folder": async ({ IDE }) => {
		await IDE.filesystem.openFolder();
	},
	"file:save": async ({ IDE }) => {
		const file = IDE.getActiveFile();
		console.log({ file });
		if (file) await IDE.saveFile(file);
	},
	"file:save-as": async ({ IDE, name, directory, path }) => {
		const file = IDE.getActiveFile();
		await IDE.saveFile({
			name,
			directory,
			path,
			content: file.content,
		});
	},
	"file:delete-file": async ({ IDE, explorer }) => {
		const selectedItems = explorer.selectedFiles;
		for (const item of selectedItems) {
			if (!item.isDirectory) {
				await IDE.deleteFile(item);
			}
		}
	},
	"file:delete-folder": async ({ IDE }) => {
		const selectedItems = await IDE.filesystem.getSelectedItems();
		for (const item of selectedItems) {
			if (item.isDirectory) {
				await IDE.deleteFolder(item.path);
			}
		}
	},
	"file:rename": async ({ IDE }) => {
		const selectedItems = await IDE.filesystem.getSelectedItems();
		for (const item of selectedItems) {
			const newName = prompt(\`Rename \${item.name} to:\`, item.name);
			if (newName && newName !== item.name) {
				const newPath = item.path.replace(item.name, newName);
				await IDE.filesystem.editName(item.path, newPath);
			}
		}
	},
	"file:move": async ({ IDE }) => {
		const selectedItems = await IDE.filesystem.getSelectedItems();
		const newDir = prompt("Enter new directory path:");
		if (newDir) {
			for (const item of selectedItems) {
				const newPath = \`\${newDir}/\${item.name}\`;
				await IDE.filesystem.moveFileOrFolder(item.path, newPath);
			}
		}
	},
	"file:close-editor": ({ editor }) => {
		console.log("Close Editor command executed");
		if (editor) {
			editor.clearContent();
			editor.currentFileHandle = null;
			editor.file = null;
		}
	},
	"file:close-folder": ({ IDE }) => {
		console.log("Close Folder command executed");
		$APP.settings["editor:filesystem"] = false;
		IDE.setFiles([]);
	},
	"file:close-window": () => {
		console.log("Close Window command executed");
		if (confirm("Are you sure you want to close this window?")) {
			window.close();
		}
	},
	"file:exit": () => {
		console.log("Exit command executed");
		if (confirm("Are you sure you want to exit the IDE?")) {
			window.close();
		}
	},
};

const fileMenu = {
	"file:new-file": "New File...",
	"file:new-folder": "New Folder...",
	"file:new-window": "New Window",
	"file:open-file": "Open File...",
	"file:open-folder": "Open Folder...",
	"file:save": "Save",
	"file:save-as": "Save As...",
	"file:delete-file": "Delete File",
	"file:delete-folder": "Delete Folder",
	"file:rename": "Rename",
	"file:move": "Move",
	"file:close-editor": "Close Editor",
	"file:close-folder": "Close Folder",
	"file:close-window": "Close Window",
	"file:exit": "Exit",
};

$APP.settings.add("commands", explorerCommands);
$APP.settings.add("menu", fileMenu);
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/plugins/edit.js":{content:`import $APP from "/bootstrap.js";

const editorCommands = {
	"selection:select-all"({ input }) {
		input.setSelectionRange(0, input.value.length);
	},

	"selection:expand-selection"({ input }) {
		const { selectionStart, selectionEnd, value } = input;
		let newStart = selectionStart;
		let newEnd = selectionEnd;
		if (newStart > 0) newStart--;
		if (newEnd < value.length) newEnd++;
		input.setSelectionRange(newStart, newEnd);
	},

	"selection:shrink-selection"({ input }) {
		const { selectionStart, selectionEnd } = input;
		let newStart = selectionStart;
		let newEnd = selectionEnd;
		if (newStart < newEnd) newStart++;
		if (newEnd > newStart) newEnd--;
		input.setSelectionRange(newStart, newEnd);
	},

	"selection:copy-line-up"({ input, editor }) {
		const { selectionStart, selectionEnd, value } = input;
		const lineStart = value.lastIndexOf("\\n", selectionStart - 1) + 1;
		const lineEnd =
			value.indexOf("\\n", selectionEnd) === -1
				? value.length
				: value.indexOf("\\n", selectionEnd);
		const lineContent = value.slice(lineStart, lineEnd);
		const newValue = \`\${value.slice(0, lineStart)}\${lineContent}\\n\${value.slice(lineStart)}\`;
		editor.updateContent(newValue);
		input.setSelectionRange(
			selectionStart + lineContent.length + 1,
			selectionEnd + lineContent.length + 1,
		);
	},

	"selection:copy-line-down"({ input, editor }) {
		const { selectionStart, selectionEnd, value } = input;
		const lineStart = value.lastIndexOf("\\n", selectionStart - 1) + 1;
		const lineEnd =
			value.indexOf("\\n", selectionEnd) === -1
				? value.length
				: value.indexOf("\\n", selectionEnd);
		const lineContent = value.slice(lineStart, lineEnd);
		const newValue = \`\${value.slice(0, lineEnd)}\\n\${lineContent}\${value.slice(lineEnd)}\`;
		editor.updateContent(newValue);
		input.setSelectionRange(
			selectionStart + lineContent.length + 1,
			selectionEnd + lineContent.length + 1,
		);
	},

	"selection:move-line-up"({ input, editor }) {
		const { selectionStart, selectionEnd, value } = input;
		const lineStart = value.lastIndexOf("\\n", selectionStart - 1) + 1;
		const lineEnd =
			value.indexOf("\\n", selectionEnd) === -1
				? value.length
				: value.indexOf("\\n", selectionEnd);
		const prevLineEnd = lineStart - 1;
		const prevLineStart = value.lastIndexOf("\\n", prevLineEnd - 1) + 1;
		if (prevLineStart >= 0 && prevLineEnd >= 0) {
			const lineContent = value.slice(lineStart, lineEnd);
			const prevLineContent = value.slice(prevLineStart, prevLineEnd);
			const newValue = \`\${value.slice(0, prevLineStart)}\${lineContent}\\n\${prevLineContent}\${value.slice(lineEnd)}\`;
			editor.updateContent(newValue);
			const offset = lineContent.length + 1;
			input.setSelectionRange(selectionStart - offset, selectionEnd - offset);
		}
	},

	"selection:move-line-down"({ input, editor }) {
		const { selectionStart, selectionEnd, value } = input;
		const lineStart = value.lastIndexOf("\\n", selectionStart - 1) + 1;
		const lineEnd =
			value.indexOf("\\n", selectionEnd) === -1
				? value.length
				: value.indexOf("\\n", selectionEnd);
		const nextLineStart = lineEnd + 1;
		const nextLineEnd =
			value.indexOf("\\n", nextLineStart) === -1
				? value.length
				: value.indexOf("\\n", nextLineStart);
		if (nextLineStart < value.length) {
			const lineContent = value.slice(lineStart, lineEnd);
			const nextLineContent = value.slice(nextLineStart, nextLineEnd);
			const newValue = \`\${value.slice(0, lineStart)}\${nextLineContent}\\n\${lineContent}\${value.slice(nextLineEnd)}\`;
			editor.updateContent(newValue);
			const offset = nextLineContent.length + 1;
			input.setSelectionRange(selectionStart + offset, selectionEnd + offset);
		}
	},

	"selection:duplicate-selection"({ input, editor }) {
		const { selectionStart, selectionEnd, value } = input;
		const selectedText = value.slice(selectionStart, selectionEnd);
		const newValue =
			value.slice(0, selectionEnd) + selectedText + value.slice(selectionEnd);
		editor.updateContent(newValue);
		input.setSelectionRange(selectionStart, selectionEnd + selectedText.length);
	},

	"edit:undo"() {
		document.execCommand("undo");
	},

	"edit:redo"() {
		document.execCommand("redo");
	},

	"edit:cut"() {
		document.execCommand("cut");
	},

	"edit:copy"() {
		document.execCommand("copy");
	},

	"edit:paste"() {
		document.execCommand("paste");
	},

	"edit:find"() {
		// Implement find functionality using editor's built-in or custom method
	},

	"edit:replace"() {
		// Implement replace functionality using editor's built-in or custom method
	},

	"edit:find-in-files"() {
		// Implement find-in-files functionality
	},

	"edit:replace-in-files"() {
		// Implement replace-in-files functionality
	},

	"edit:toggle-line-comment"({ input, editor }) {
		const { value } = input;
		const start = input.selectionStart;
		const end = input.selectionEnd;
		const selectedText = value.slice(start, end);
		const lines = selectedText.split("\\n");
		const allCommented = lines.every((line) => line.trim().startsWith("//"));
		const newText = lines
			.map((line) => {
				if (allCommented) {
					return line.replace(/^(\\s*)\\/\\/\\s?/, "$1");
				}
				return \`// \${line}\`;
			})
			.join("\\n");
		editor.updateContent(value.slice(0, start) + newText + value.slice(end));
		input.setSelectionRange(start, start + newText.length);
	},

	"edit:toggle-block-comment"({ input, editor }) {
		const { value } = input;
		const start = input.selectionStart;
		const end = input.selectionEnd;
		const selectedText = value.slice(start, end);
		if (selectedText.startsWith("/*") && selectedText.endsWith("*/")) {
			const newText = selectedText.slice(2, -2).trim();
			editor.updateContent(value.slice(0, start) + newText + value.slice(end));
			input.setSelectionRange(start, start + newText.length);
		} else {
			const newText = \`/* \${selectedText} */\`;
			editor.updateContent(value.slice(0, start) + newText + value.slice(end));
			input.setSelectionRange(start, start + newText.length);
		}
	},
};

const keyBindings = {
	"ctrl+z": "edit:undo",
	"ctrl+y": "edit:redo",
	"ctrl+x": "edit:cut",
	"ctrl+c": "edit:copy",
	//"ctrl+v": "edit:paste",
	//"ctrl+f": "edit:find",
	"ctrl+h": "edit:replace",
	"ctrl+shift+f": "edit:find-in-files",
	"ctrl+shift+h": "edit:replace-in-files",
	"ctrl+/": "edit:toggle-line-comment",
	"ctrl+shift+/": "edit:toggle-block-comment",
};

const editorMenu = {
	"edit:undo": "Undo",
	"edit:redo": "Redo",
	"edit:cut": "Cut",
	"edit:copy": "Copy",
	"edit:paste": "Paste",
	"edit:find": "Find",
	"edit:replace": "Replace",
	"edit:find-in-files": "Find in Files",
	"edit:replace-in-files": "Replace in Files",
	"edit:toggle-line-comment": "Toggle Line Comment",
	"edit:toggle-block-comment": "Toggle Block Comment",
	"selection:select-all": "Select All",
	"selection:expand-selection": "Expand Selection",
	"selection:shrink-selection": "Shrink Selection",
	"selection:copy-line-up": "Copy Line Up",
	"selection:copy-line-down": "Copy Line Down",
	"selection:move-line-up": "Move Line Up",
	"selection:move-line-down": "Move Line Down",
	"selection:duplicate-selection": "Duplicate Selection",
};

$APP.hooks.on("onEditorInit", ({ input, editor }) => {
	input.addEventListener("input", (event) => {
		const updatedCode = event.target.value || event.target.textContent;
		editor.content = updatedCode;
	});
});

$APP.settings.add("globalKeybindings", keyBindings);
$APP.settings.add("commands", editorCommands);
$APP.settings.add("menu", editorMenu);
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/plugins/markdown.js":{content:`// Implement https://overtype.dev/
import $APP from "/bootstrap.js";
import html from "/modules/mvc/view/html/index.js";
import T from "/modules/types/index.js";

function escapeHtml(text) {
	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

const blockParsers = [
	{
		name: "code",
		regex: /^\`\`\`\\n?([\\s\\S]*?)\\n\`\`\`$/gm,
		replace: (match, code) =>
			\`\\n%%CODEBLOCK%%\\n\${escapeHtml(code)}\\n%%CODEBLOCK%%\\n\`,
	},
	{
		name: "headings",
		regex: /^(#{1,6})\\s+(.+)$/gm,
		replace: (match, hashes, text) =>
			\`<h\${hashes.length}>\${text}</h\${hashes.length}>\`,
	},
];

const inlineParsers = [
	{
		name: "image",
		regex: /!\\[([^\\]]+)\\]\\(([^)]+)\\)/g,
		replace: (match, alt, src) => \`<img src="\${src}" alt="\${alt}" />\`,
	},
	{
		name: "bold",
		regex: /\\*\\*(.+?)\\*\\*/g,
		replace: (match, content) => \`<strong>\${content}</strong>\`,
	},
	{
		name: "italic",
		regex: /\\*(.+?)\\*/g,
		replace: (match, content) => \`<em>\${content}</em>\`,
	},
	{
		name: "link",
		regex: /\\[([^\\]]+)\\]\\(([^)]+)\\)/g,
		replace: (match, text, url) => \`<a href="\${url}">\${text}</a>\`,
	},
];

function parseFrontMatter(markdown) {
	const fmRegex = /^---\\s*\\n([\\s\\S]*?)\\n---\\s*\\n?/;
	const match = markdown.match(fmRegex);
	if (!match) return { frontMatter: {}, markdown };
	const frontMatter = match[1].split("\\n").reduce((acc, line) => {
		const [key, ...rest] = line.split(":");
		if (rest.length === 0) return acc;
		return { ...acc, [key.trim()]: rest.join(":").trim() };
	}, {});
	return { frontMatter, markdown: markdown.replace(fmRegex, "") };
}

function parseMarkdown(markdown) {
	const { frontMatter, markdown: md } = parseFrontMatter(markdown);
	return { frontMatter, markdown: parseMarkdownContent(md) };
}

const markdownLanguage = {
	name: "Markdown",
	regex: [
		[/^\\[ \\]/, "TASK_PENDING"],
		[/^---$/, "FRONT_MATTER_TAG"],
		[/^---\\s*\\n([\\s\\S]*?)\\n---\\s*\\n/, "FRONT_MATTER_BLOCK"],
		[/^\\s*([\\w-]+):\\s*(.*)/, "FRONT_MATTER_PROP"],
		[/^\\[x\\]/i, "TASK_DONE"],
		[/^\\[-\\]/, "TASK_WONT_FIX"],
		[/^(#{1,6})\\s+(.+)$/, "HEADER"],
		[/^>\\s+(.+)$/, "BLOCKQUOTE"],
		[/^(\\s*[-+*]|\\d+\\.)\\s+/, "LIST"],
		[/\\*\\*([^*]+)\\*\\*/, "BOLD"],
		[/\\*([^*]+)\\*/, "ITALIC"],
		[/__([^_]+)__/, "BOLD"],
		[/_([^_]+)_/, "ITALIC"],
		[/~~([^~]+)~~/, "STRIKETHROUGH"],
		[/\`([^\`]+)\`/, "INLINE_CODE"],
		[/^\`\`\`([\\s\\S]+?)\`\`\`/, "CODE_BLOCK"],
		[/^\\s{4}(.+)/, "CODE_BLOCK"],
		[/\\[(.+?)\\]\\((https?:\\/\\/[^\\s]+)\\)/, "LINK"],
		[/!\\[(.+?)\\]\\((https?:\\/\\/[^\\s]+)\\)/, "IMAGE"],
		[/<[^>]+>/, "HTML_TAG"],
		[/\\\\([\`*_{}[\\]()#+\\-.!>])/, "ESCAPE"],
	],
};

const MarkdownViewer = {
	properties: {
		content: T.string(),
		frontMatter: T.object({ defaultValue: {} }),
	},
	render() {
		const { frontMatter, markdown } = parseMarkdown(this.content);
		this.frontMatter = frontMatter;
		return html\`\${
			frontMatter
				? html\`
          <div class="front-matter">
            <h3>Metadata</h3>
            <table>
              \${Object.entries(frontMatter).map(
								([key, value]) => html\`
                  <tr>
                    <th>\${key}</th>
                    <td>\${value}</td>
                  </tr>
                \`,
							)}
            </table>
          </div>
          <uix-divider padding="0-md"></uix-divider>
        \`
				: null
		}
      \${html.unsafeHTML(markdown)}\`;
	},
};

const processCodeBlocks = (content) => {
	const codeMatches = Array.from(content.matchAll(/^\`\`\`\\n?([\\s\\S]*?)\\n\`\`\`$/gm));
	const codeBlocks = codeMatches.map((m) => escapeHtml(m[1]));
	const replaced = codeMatches.reduce(
		(acc, m, i) => acc.replace(m[0], \`\\n%%CODEBLOCK_\${i}%%\\n\`),
		content,
	);
	return { content: replaced, codeBlocks };
};

const applyParsers = (content, parsers) =>
	parsers.reduce(
		(acc, { regex, replace }) =>
			acc.replace(regex, (...args) => replace(...args)),
		content,
	);

function parseMarkdownContent(markdown) {
	const { content: withPlaceholders, codeBlocks } = processCodeBlocks(markdown);
	const afterBlockParsers = applyParsers(withPlaceholders, blockParsers);
	const afterLists = parseNestedLists(afterBlockParsers);
	const afterInlineParsers = applyParsers(afterLists, inlineParsers);
	const afterRestoreCodeBlocks = afterInlineParsers.replace(
		/%%CODEBLOCK_(\\d+)%%/g,
		(match, index) => \`<pre><code>\${codeBlocks[index]}</code></pre>\`,
	);
	const paragraphs = afterRestoreCodeBlocks
		.split("\\n")
		.map((line) =>
			line.trim() && !line.startsWith("<") ? \`<p>\${line}</p>\` : line,
		)
		.join("\\n");
	return paragraphs.replace(/\\n{2,}/g, (match) =>
		"<br/>".repeat(match.length - 1),
	);
}

function parseNestedLists(markdown) {
	const { lines, currentList } = markdown.split("\\n").reduce(
		(acc, line) => {
			if (/^\\s*([*\\-+]|\\d+\\.)\\s+/.test(line))
				return { ...acc, currentList: [...acc.currentList, line] };
			return {
				lines: acc.currentList.length
					? [...acc.lines, parseListBlock(acc.currentList), line]
					: [...acc.lines, line],
				currentList: [],
			};
		},
		{ lines: [], currentList: [] },
	);
	return currentList.length
		? [...lines, parseListBlock(currentList)].join("\\n")
		: lines.join("\\n");
}

function parseListBlock(lines) {
	const { html, stack } = lines.reduce(
		(acc, line) => {
			const match = line.match(/^(\\s*)([*\\-+]|\\d+\\.)\\s+(.*)/);
			if (!match) return acc;
			const indent = match[1].length;
			const marker = match[2];
			const content = match[3];
			const listType = /^\\d+\\.$/.test(marker) ? "ol" : "ul";
			let { html, stack } = acc;
			while (stack.length && indent < stack[stack.length - 1].indent) {
				const { type } = stack.pop();
				html += \`</li></\${type}>\`;
			}
			if (stack.length && indent === stack[stack.length - 1].indent) {
				if (stack[stack.length - 1].type !== listType) {
					stack.pop();
					html += \`</li></\${listType === "ol" ? "ul" : "ol"}>\`;
					html += \`<\${listType}>\`;
					stack.push({ indent, type: listType });
				} else {
					html += "</li>";
				}
			} else if (!stack.length || indent > stack[stack.length - 1].indent) {
				html += \`<\${listType}>\`;
				stack.push({ indent, type: listType });
			}
			html += \`<li>\${content}\`;
			return { html, stack };
		},
		{ html: "", stack: [] },
	);
	const closingTags = stack.reduce(
		(acc, { type }) => \`\${acc}</li></\${type}>\`,
		"",
	);
	return html + closingTags;
}

function generateMarkdownTree(markdown) {
	return markdown.split("\\n").reduce(
		(acc, line) => {
			const match = line.match(/^(#{1,6})\\s+(.+)$/);
			if (match) {
				const level = match[1].length;
				const title = match[2];
				const node = { level, title, children: [] };
				while (
					acc.stack.length &&
					acc.stack[acc.stack.length - 1].level >= level
				) {
					acc.stack.pop();
				}
				if (!acc.stack.length) {
					acc.tree.push(node);
				} else {
					acc.stack[acc.stack.length - 1].children.push(node);
				}
				acc.stack.push(node);
			}
			return acc;
		},
		{ tree: [], stack: [] },
	).tree;
}

$APP.settings.add("highlights", { markdown: markdownLanguage });
$APP.define({ "markdown-viewer": MarkdownViewer });
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/plugins/keybindings.js":{content:`import $APP from "/bootstrap.js";

const Keybindings = {
	name: "Keybindings",
	deleteChar({ editor, input }) {
		const start = input.selectionStart;
		const end = input.selectionEnd;

		if (start === end) {
			// No text is selected, delete the character in front of the cursor
			const value = editor.getValue();
			if (start < value.length) {
				const newValue = value.slice(0, start) + value.slice(start + 1);
				editor.updateContent(newValue);
				editor.setCursorPosition(start);
			}
		} else {
			// Text is selected, delete the selection
			const value = editor.getValue();
			const newValue = value.slice(0, start) + value.slice(end);
			editor.updateContent(newValue);
			editor.setCursorPosition(start);
		}
	},

	tabIndent({ editor, input, settings }) {
		const result = Keybindings.indentOrOutdentSelection(
			{ input, settings },
			false,
		);
		Keybindings.applyIndentationChange({ editor, input }, result);
	},

	outdentSelection({ editor, input, settings }) {
		const result = Keybindings.indentOrOutdentSelection(
			{ input, settings },
			true,
		);
		Keybindings.applyIndentationChange({ editor, input }, result);
	},

	applyIndentationChange(
		{ editor },
		{ newContent, replaceStart, replaceEnd, newSelStart, newSelEnd },
	) {
		const currentValue = editor.getValue();
		const updatedContent =
			currentValue.slice(0, replaceStart) +
			newContent +
			currentValue.slice(replaceEnd);
		editor.updateContent(updatedContent);
		setTimeout(() => {
			editor.setCursorPosition(newSelStart, newSelEnd);
		}, 50);
	},

	indentOrOutdentSelection({ input, settings }, outdent = false) {
		const value = input.value;
		const selStart = input.selectionStart;
		const selEnd = input.selectionEnd;
		const tabCharacter = settings.useTabs ? "\\t" : " ".repeat(settings.tabSize);
		// Find the start and end of the lines containing the selection
		const lineStart = value.lastIndexOf("\\n", selStart - 1) + 1;
		const lineEnd =
			value.indexOf("\\n", selEnd) === -1
				? value.length
				: value.indexOf("\\n", selEnd);

		// Extract the affected lines
		const selectedLines = value.slice(lineStart, lineEnd).split("\\n");

		// Process each line
		const processedLines = selectedLines.map((line) => {
			if (outdent) {
				if (line.startsWith(tabCharacter)) {
					return line.slice(tabCharacter.length);
				}
				if (line.startsWith("\\t")) {
					return line.slice(1);
				}
				return line;
			}
			return tabCharacter + line;
		});

		// Join the processed lines
		const newContent = processedLines.join("\\n");

		// Calculate the new selection start and end
		const startDiff = processedLines[0].length - selectedLines[0].length;
		const newSelStart = selStart + (selStart > lineStart ? startDiff : 0);
		const newSelEnd = selEnd + newContent.length - (lineEnd - lineStart);

		// Return the necessary information for the editor to update
		return {
			newContent,
			replaceStart: lineStart,
			replaceEnd: lineEnd,
			newSelStart: selStart === selEnd ? newSelEnd : newSelStart,
			newSelEnd,
		};
	},

	moveWordLeft({ editor, input, event }) {
		event.preventDefault(); // Prevent default behavior
		const value = editor.getValue();
		let pos = input.selectionStart;

		while (pos > 0 && /\\s/.test(value[pos - 1])) pos--;
		while (pos > 0 && /\\S/.test(value[pos - 1])) pos--;

		editor.setCursorPosition(pos);
	},

	moveWordRight({ editor, input, event }) {
		event.preventDefault(); // Prevent default behavior
		const value = editor.getValue();
		let pos = input.selectionEnd;

		while (pos < value.length && /\\s/.test(value[pos])) pos++;
		while (pos < value.length && /\\S/.test(value[pos])) pos++;

		editor.setCursorPosition(pos);
	},

	moveToLineStart({ editor, input, event }) {
		event.preventDefault(); // Prevent default behavior
		const value = editor.getValue();
		const start = input.selectionStart;
		let lineStart = start;
		while (lineStart > 0 && value[lineStart - 1] !== "\\n") lineStart--;
		editor.setCursorPosition(lineStart);
	},

	moveToLineEnd({ editor, input, event }) {
		event.preventDefault(); // Prevent default behavior
		const value = editor.getValue();
		const end = input.selectionEnd;
		let lineEnd = end;
		while (lineEnd < value.length && value[lineEnd] !== "\\n") lineEnd++;
		editor.setCursorPosition(lineEnd);
	},

	moveToTextStart({ editor, event }) {
		event.preventDefault(); // Prevent default behavior
		editor.setCursorPosition(0);
	},

	moveToTextEnd({ editor, event }) {
		event.preventDefault(); // Prevent default behavior
		editor.setCursorPosition(editor.getValue().length);
	},

	handleEnter({ editor, input }) {
		const start = input.selectionStart;
		const end = input.selectionEnd;
		const value = editor.getValue();
		let lineStart = start;
		while (lineStart > 0 && value[lineStart - 1] !== "\\n") lineStart--;
		let indent = "";
		while (value[lineStart] === " " || value[lineStart] === "\\t") {
			indent += value[lineStart++];
		}
		if (start === end) {
			const newText = \`\\n\${indent}\`;
			editor.insertTextAtRange(newText, start, end);
		} else editor.insertTextAtRange(\`\\n\${indent}\`, start, end);
	},

	handleEscape({ editor, input }) {
		input.blur();
		editor.focus();
	},

	openFile({ event }) {
		event.preventDefault();
		console.log("Opening file dialog...");
		// Implement the logic to open a file dialog
	},

	newWindow({ event }) {
		event.preventDefault();
		console.log("Opening a new window...");
		// Implement the logic to open a new editor window
	},

	openCommandPalette({ event, IDE }) {
		event.preventDefault();
		console.log("Opening command palette...");
		// Implement the logic to open the command palette
		// The command palette could list all registered commands and allow the user to execute them
	},

	openSettings({ event }) {
		event.preventDefault();
		console.log("Opening settings...");
		// Implement the logic to open the settings page or panel
	},

	addExtension({ event }) {
		event.preventDefault();
		console.log("Opening extension manager...");
		// Implement the logic to add modules (plugins)
	},

	toggleSidebar({ event }) {
		event.preventDefault();
		console.log("Toggling sidebar visibility...");
		// Implement the logic to toggle the sidebar visibility
	},
};

const editorKeyBindings = {
	"ctrl+d": "editor:delete-char",
	tab: "editor:tab-indent",
	"shift+tab": "editor:outdent-selection",
	"ctrl+w": "editor:quit",
	enter: "editor:insert-newline",
	escape: "editor:escape",
	"alt+arrowleft": "editor:move-word-left",
	"alt+arrowright": "editor:move-word-right",
	"alt+arrowup": "editor:move-line-start",
	"alt+arrowdown": "editor:move-line-end",
	"ctrl+arrowup": "editor:move-text-start",
	"ctrl+arrowdown": "editor:move-text-end",
};

const GlobalKeyBindings = {
	"ctrl+p": "global:open-file",
	"ctrl+n": "global:new-window",
	"ctrl+shift+p": "global:open-command-palette",
	",+ctrl": "global:open-settings",
	"ctrl+shift+x": "global:add-extension",
	"ctrl+b": "global:toggle-sidebar",
	"ctrl+s": "file:save",
};

const commands = {
	"editor:delete-char": Keybindings.deleteChar,
	"editor:tab-indent": Keybindings.tabIndent,
	"editor:outdent-selection": Keybindings.outdentSelection,
	"editor:insert-newline": Keybindings.handleEnter,
	"editor:move-word-left": Keybindings.moveWordLeft,
	"editor:move-word-right": Keybindings.moveWordRight,
	"editor:move-line-start": Keybindings.moveToLineStart,
	"editor:move-line-end": Keybindings.moveToLineEnd,
	"editor:move-text-start": Keybindings.moveToTextStart,
	"editor:move-text-end": Keybindings.moveToTextEnd,
	"editor:escape": Keybindings.handleEscape,
	"global:open-file": Keybindings.openFile,
	"global:new-window": Keybindings.newWindow,
	"global:open-command-palette": Keybindings.openCommandPalette,
	"global:open-settings": Keybindings.openSettings,
	"global:add-extension": Keybindings.addExtension,
	"global:toggle-sidebar": Keybindings.toggleSidebar,
};

$APP.settings.add("commands", commands);
$APP.settings.add("globalKeybindings", GlobalKeyBindings);
$APP.settings.add("editorKeybindings", editorKeyBindings);
$APP.hooks.on(
	"onEditorInit",

	({ editor, explorer, panel, input, IDE, settings }) => {
		IDE.attachKeybindings(input, {
			input,
			editor,
			panel,
			explorer,
			IDE,
			settings,
		});
	},
);
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/highlights/css.js":{content:`import $APP from "/bootstrap.js";

const css = {
	name: "css",
	regex: [
		[/^\\s+/, "WHITESPACE"],
		[/^\\/\\*[\\s\\S]*?\\*\\//, "COMMENT"],
		[/^#[a-fA-F0-9]{3,6}/, "COLOR_HEX"],
		[/^\\.[a-zA-Z_][\\w-]*/, "CLASS_NAME"],
		[/^\\b[a-zA-Z-]+\\b(?=\\s*:\\s*)/, "PROPERTY_NAME"],
		[/^:[a-zA-Z_][\\w-]*/, "PSEUDO_CLASS"],
		[/^[{}()[\\];,:]/, "PUNCTUATOR"],
	],
};

$APP.settings.add("highlights", { css });
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/highlights/html.js":{content:`import $APP from "/bootstrap.js";

const html = {
	name: "html",
	regex: [
		[/^\\s+/, "WHITESPACE"],
		[/^<!--[\\s\\S]*?-->/, "COMMENT"],
		[/^<!DOCTYPE[^>]+>/i, "DOCTYPE"],
		[/^<[/]?[a-z][a-z0-9]*[^>]*>/i, "TAG"],
		[/^"([^"\\\\]|\\\\.)*"/, "ATTRIBUTE_VALUE"],
		[/^\\b[a-zA-Z-:]+\\b(?=\\s*=)/, "ATTRIBUTE_NAME"],
		[/^&[a-zA-Z0-9#]+;/, "ENTITY"],
		[/^[{}()[\\];,:]/, "PUNCTUATOR"],
	],
};

$APP.settings.add("highlights", { html });
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/ide/highlights/javascript.js":{content:`import $APP from "/bootstrap.js";

const javascript = {
	name: "highlight-javascript",
	regex: [
		[/^\\t+/, "WHITESPACE"],
		[/^\\s+/, "WHITESPACE"],
		[/^\\/\\/.*$/, "COMMENT"],
		[/^\\/\\*[\\s\\S]*?\\*\\//, "COMMENT"],
		[/^"([^"\\\\]|\\\\.)*"/, "STRING"],
		[/^'([^'\\\\]|\\\\.)*'/, "STRING"],
		[/^\\b(import|export|from)\\b/, "importExport"],
		[
			/^\\b(abstract|arguments|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|yield|from|as|of)\\b/,
			"KEYWORD",
		],
		[/^\\b([A-Z][a-zA-Z0-9_$]*)\\b/, "type"],
		[/^\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\b(?=\\()/, "FUNCTION"],
		[/^\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\b(?=\\.)/, "OBJECT"],
		[/^\\.(\\w+)/, "PROPERTY"],
		[/^\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\b/, "IDENTIFIER"],
		[/^[0-9]+/, "NUMBER"],
		[/^[{}()[\\];,:]/, "PUNCTUATOR"],
		[/^[=!+-/*<>]+/, "OPERATOR"],
	],
};

$APP.settings.add("highlights", { javascript });
`,mimeType:"application/javascript",skipSW:!1},"/modules/sw/adapter.js":{content:`export default ({ $APP }) => {
	class SWAdapter {
		async namespaceExists({ namespace }) {
			try {
				const files = await this.listDirectory({ namespace });
				return files.length > 0;
			} catch (error) {
				console.error("Error checking namespace existence:", error);
				return false;
			}
		}

		async createFiles({ namespace, files, system }) {
			return $APP.SW.request("FS:WRITE_FILES", { namespace, files, system });
		}

		async createFile({ namespace, path, content = "" }) {
			return this.writeFile({ namespace, path, content });
		}

		async saveFile({ namespace, path, content, system }) {
			return this.writeFile({ namespace, path, content, system });
		}

		async writeFile({ namespace, path, system, content = "" }) {
			console.trace();
			return $APP.SW.request("FS:WRITE_FILE", {
				namespace,
				path,
				content,
				system,
			});
		}

		async readFile({ namespace, path, system }) {
			const { content } = await $APP.SW.request("FS:READ_FILE", {
				namespace,
				path,
				system,
			});
			return content;
		}

		async deleteFile({ namespace, path }) {
			return $APP.SW.request("FS:DELETE_FILE", { namespace, path });
		}

		async createFolder({ namespace, path }) {
			const dirPath = path.endsWith("/") ? path : \`\${path}/\`;
			const placeholderPath = \`\${dirPath}.dir-placeholder\`;
			return this.writeFile({ namespace, path: placeholderPath, content: "" });
		}

		async deleteDirectory({ namespace, path }) {
			return $APP.SW.request("FS:DELETE_DIRECTORY", { namespace, path });
		}

		async listDirectory({ namespace, path = "/", recursive = true }) {
			const { files } = await $APP.SW.request("FS:LIST_FILES", {
				namespace,
				path,
				recursive,
			});
			return files;
		}

		async deleteNamespace({ namespace }) {
			return $APP.SW.request("FS:DELETE_NAMESPACE", { namespace });
		}
	}

	return SWAdapter;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/chat/index.js":{content:`export const migration = true;
export default ({ $APP, T, AI, Model, html }) => {
	$APP.events.on("INIT_APP", async () => {
		$APP.define("app-chat-message", {
			properties: {
				message: T.object(),
			},
			render() {
				if (!this.message) return html\`\`;

				const { role, content, toolCalls } = this.message;
				const isUser = role === "user";
				const isTool = !!toolCalls;

				if (isTool) {
					return html\`
                    <div class="text-xs text-gray-400 italic text-center my-2">
                        <uix-icon name="cog" class="animate-spin"></uix-icon>
                        Using tool: <strong>\${toolCalls[0].name}</strong>
                    </div>\`;
				}

				return html\`
                <div class="flex \${isUser ? "justify-end" : "justify-start"}">
                    <div class="flex items-end gap-2 max-w-lg">
                        \${!isUser ? html\`<uix-avatar class="is-sm bg-gray-700 text-white" icon="bot"></uix-avatar>\` : ""}
                        <div class="p-3 rounded-lg \${isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"}">
                            <p>\${content}</p>
                        </div>
                    </div>
                </div>
            \`;
			},
		});

		$APP.define("app-chat-input", {
			properties: {
				conversation: T.object(),
				messages: T.array(),
				isThinking: T.boolean(false),
				newMessage: T.string(""),
			},
			async sendMessage() {
				if (!this.newMessage?.trim() || !this.conversation) return;

				const userMessageContent = this.newMessage;
				this.newMessage = ""; // Clear input immediately
				this.isThinking = true;

				try {
					// 1. Add user message to the model
					await Model.messages.add({
						conversationId: this.conversation.id,
						role: "user",
						content: userMessageContent,
					});

					// 2. Prepare conversation history for the AI
					const conversationHistory = this.messages.map((m) => ({
						role: m.role,
						content: m.content,
						toolCalls: m.toolCalls, // Pass tool history as well
					}));
					conversationHistory.push({
						role: "user",
						content: userMessageContent,
					});

					// 3. Get AI response
					const aiResponse = await AI.chat(conversationHistory);

					// 4. Add AI response to the model
					await Model.messages.add({
						conversationId: this.conversation.id,
						...aiResponse,
					});
				} catch (error) {
					console.error("Chat AI error:", error);
					// Add an error message to the conversation
					await Model.messages.add({
						conversationId: this.conversation.id,
						role: "assistant",
						content: \`Sorry, an error occurred: \${error.message}\`,
					});
				} finally {
					this.isThinking = false;
				}
			},
			render() {
				return html\`
                <footer class="p-2 border-t bg-white">
                    <uix-form .submit=\${this.sendMessage.bind(this)}>
                        <uix-join>
                            <uix-input
                                .bind=\${this.prop("newMessage")}
                                placeholder="Type a message..."
                                class="w-full"
                                ?disabled=\${this.isThinking}
                            ></uix-input>
                            <uix-button type="submit" icon="send" ?disabled=\${!this.newMessage?.trim() || this.isThinking}>
                                \${this.isThinking ? "Thinking..." : "Send"}
                            </uix-button>
                        </uix-join>
                    </uix-form>
                </footer>
            \`;
			},
		});

		/**
		 * Component: app-chat-window
		 * Displays the main chat window for a selected conversation, including the message history
		 * and the input form.
		 */
		$APP.define("app-chat-window", {
			extends: "uix-list", // Assuming uix-list provides _rows for conversations
			properties: {
				conversationId: T.string(),
			},
			get conversation() {
				if (!this._rows || !this.conversationId) return null;
				return this._rows.find((c) => c.id === this.conversationId);
			},
			render() {
				if (!this.conversationId) {
					return html\`
                    <div class="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 text-center p-8">
                        <uix-icon name="message-circle" class="text-5xl mb-4"></uix-icon>
                        <h2 class="text-2xl font-bold">Select a conversation</h2>
                        <p>Choose a conversation from the sidebar to start chatting.</p>
                    </div>
                \`;
				}

				if (!this.conversation) {
					return html\`<div class="flex-1 flex items-center justify-center"><uix-spinner></uix-spinner></div>\`;
				}

				// Determine icon based on conversation type (channel/dm)
				const conversationIcon =
					this.conversation.type === "channel" ? "hash" : "at-sign";

				return html\`
                <div class="flex-1 flex flex-col bg-white">
                    <header class="p-4 border-b flex items-center gap-3">
                        <uix-icon name=\${conversationIcon} class="text-gray-500"></uix-icon>
                        <h3 class="font-bold text-lg">\${this.conversation.name}</h3>
                    </header>

                    <app-messages-list
                        ._data=\${{ model: "messages", where: { conversationId: this.conversationId }, sort: "createdAt" }}
                        class="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
                    ></app-messages-list>
                    
                    <app-chat-input 
                        .conversation=\${this.conversation}
                        ._data=\${{ model: "messages", where: { conversationId: this.conversationId }, sort: "createdAt" }}
                    ></app-chat-input>
                </div>
            \`;
			},
		});

		/**
		 * Component: app-messages-list
		 * A simple component to render the list of messages. It observes the messages model
		 * and renders an app-chat-message for each message.
		 */
		$APP.define("app-messages-list", {
			extends: "uix-list",
			render() {
				if (!this._rows) {
					return html\`<div class="flex-1 flex items-center justify-center"><uix-spinner></uix-spinner></div>\`;
				}
				// Scroll to bottom when new messages are added
				this.scrollTop = this.scrollHeight;

				return this._rows.map(
					(message) =>
						html\`<app-chat-message .message=\${message}></app-chat-message>\`,
				);
			},
		});

		/**
		 * Component: app-chat-sidebar
		 * Displays a single, unified list of all conversations.
		 */
		$APP.define("app-chat-sidebar", {
			extends: "uix-list", // Gets conversations via ._data
			properties: {
				selectedConversationId: T.string({ sync: "querystring" }),
				newConversationName: T.string(),
				newConversationType: T.string("channel"), // Default to channel
			},
			async createConversation() {
				if (!this.newConversationName?.trim()) return;
				try {
					await Model.conversations.add({
						name: this.newConversationName,
						type: this.newConversationType,
					});
					this.newConversationName = "";
					// Find and hide the modal
					const modal = this.querySelector("#new-conversation-modal");
					if (modal) modal.hide();
				} catch (error) {
					console.error("Failed to create conversation:", error);
					alert(\`Error: \${error.message}\`);
				}
			},
			selectConversation(id) {
				console.log({ id });
				this.selectedConversationId = id;
			},
			render() {
				if (!this._rows)
					return html\`<div class="p-4"><uix-spinner></uix-spinner></div>\`;

				// Sort all conversations alphabetically
				const sortedConversations = [...this._rows];

				return html\`
                <div class="w-full px-2">
                    <div class="flex justify-between items-center p-2">
                        <h4 class="text-sm font-bold uppercase text-gray-400">Conversations</h4>
                        <uix-modal id="new-conversation-modal">
                            <uix-button size="is-sm" shape="circle" icon="plus"></uix-button>
                            <dialog class="p-4 flex flex-col gap-4 rounded-lg shadow-xl w-80">
                                <h3 class="text-lg font-bold">New Conversation</h3>
                                <uix-form .submit=\${this.createConversation.bind(this)}>
                                    <uix-input
                                        label="Name"
                                        placeholder="e.g. general-questions"
                                        .bind=\${this.prop("newConversationName")}
                                    ></uix-input>
                                    <uix-input type="select" .options=\${["channel", "dm"]} .bind=\${this.prop("newConversationType")} label="Type" class="mt-2">                                        
                                    </uix-input>
                                    <uix-list class="flex justify-end gap-2 pt-4">
                                        <uix-button type="submit" label="Create" class="is-primary"></uix-button>
                                    </uix-list>
                                </uix-form>
                            </dialog>
                        </uix-modal>
                    </div>
                    <uix-list class="flex flex-col gap-1">
                        \${sortedConversations.map((conv) => {
													const icon =
														conv.type === "channel" ? "hash" : "at-sign";
													console.log({ conv });
													return html\`
                                <a @click=\${() => this.selectConversation(conv.id)} class="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-700 \${this.selectedConversationId === conv.id ? "bg-gray-900" : ""}">
                                    <uix-icon name=\${icon} class="text-gray-500"></uix-icon>
                                    <span>\${conv.parent.name}</span>
                                </a>
                            \`;
												})}
                    </uix-list>
                </div>
            \`;
			},
		});

		$APP.define("app-chat", {
			properties: {
				selectedConversationId: T.string({ sync: "querystring" }),
			},
			render() {
				return html\`<aside class="w-64 bg-gray-800 text-gray-200 flex flex-col">
											<header class="p-4 border-b border-gray-700">
													<h2 class="text-xl font-bold">Chat</h2>
											</header>
											<app-chat-sidebar
													._data=\${{ model: "conversations", includes: ["parent"] }}
													.selectedConversationId=\${this.selectedConversationId}
													class="flex-1 overflow-y-auto py-2"
											></app-chat-sidebar>
									</aside>

									<!-- Main Chat Area -->
									<main class="flex-1 flex flex-col">
											<app-chat-window
													._data=\${{ model: "conversations", id: this.selectedConversationId }}
											></app-chat-window>
									</main>\`;
			},
		});
	});

	$APP.addModule({
		name: "chat",
		path: "apps/chat",
		settings: {
			appbar: {
				label: "Conversations",
				icon: "message-circle",
			},
		},
	});
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/editor/index.js":{content:`export default ({ $APP }) =>
	$APP.addModule({
		name: "editor",
		path: "apps/editor/views",
	});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/bundler/index.js":{content:"export default {}"},"/modules/integrations/github.js":{content:"export default {}"},"/modules/apps/mcp/index.js":{content:`export default ({ $APP }) => {
	$APP.addModule({
		name: "mcp",
		path: "apps/mcp/views",
		settings: {
			appbar: {
				label: "MCP Inspector",
				icon: "square-mouse-pointer",
			},
		},
	});

	$APP.addModule({
		name: "mcp-dev",
		settings: {
			appbar: {
				label: "MCP dev",
				icon: "server-cog",
			},
		},
	});

	$APP.addModule({
		name: "mcp-chat",
		settings: {
			appbar: {
				label: "MCP Chat",
				icon: "bot-message-square",
			},
		},
	});
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/index.js":{content:`export default ({ $APP }) => {
	$APP.addModule({
		name: "uix",
		components: {
			form: [
				"form",
				"form-control",
				"input",
				"textarea",
				"time",
				"rating",
				"join",
				"file-upload", // \u{1F53A} ToDo
				"number-input", // \u{1F53A} ToDo
				"switch", // \u{1F53A} ToDo
				"slider", // \u{1F53A} ToDo
			],
			navigation: [
				"navbar",
				"breadcrumbs",
				"menu", // \u{1F53A} ToDo (menu dropdown)
				"sidebar", // \u{1F53A} ToDo
				"pagination",
				"tabs",
				"tabbed",
			],
			overlay: [
				"overlay",
				"modal",
				"drawer",
				"tooltip",
				"popover", // \u{1F53A} ToDo
				"alert-dialog", // \u{1F53A} ToDo
				"toast", // \u{1F53A} ToDo
			],
			display: [
				"markdown",
				"editable",
				"link",
				"button",
				"avatar",
				"badge",
				"card",
				"circle",
				"image",
				"pattern",
				"logo",
				"media",
				"table",
				"table-row",
				"icon",
				"calendar",
				"calendar-day",
				"tag", // \u{1F53A} ToDo
				"stat",
				"chart",
			],

			layout: [
				"list",
				"accordion",
				"container",
				"divider",
				"section", // \u{1F53A} ToDo
				"page", // \u{1F53A} ToDo
				"flex", // \u{1F53A} ToDo
				"stack", // \u{1F53A} ToDo
				"spacer", // \u{1F53A} ToDo
			],

			feedback: [
				"spinner",
				"progress-bar", // \u{1F53A} ToDo
				"circular-progress", // \u{1F53A} ToDo
				"skeleton", // \u{1F53A} ToDo
			],

			utility: [
				"darkmode",
				"draggable",
				"droparea",
				"clipboard", // \u{1F53A} ToDo
				"theme-toggle", // \u{1F53A} ToDo
				"dark-mode-switch", // \u{1F53A} ToDo
			],
		},
	});
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/index.js":{content:`export default ({ $APP }) => {
	$APP.addModule({ name: "icon-lucide", icon: true });
};
`,mimeType:"application/javascript",skipSW:!1},"/worker.js":{content:`import $APP from "/bootstrap.js";

let STARTED;

const bootstrap = async (_project) => {
	console.log("App Worker: bootstrap() called");
	const url = new URL(self.location);
	const param = url.searchParams.get("project");
	const project = param ? JSON.parse(decodeURIComponent(param)) : {};
	project.backend = true;
	const APP = await $APP.bootstrap({
		backend: true,
		...(project || {}),
		dependencies: {
			T: "/modules/types/index.js",
			IndexedDBWrapper: "/modules/mvc/model/indexeddb/index.js",
			Database: "/modules/mvc/model/database/index.js",
			Model: "/modules/mvc/model/backend.js",
			Backend: "/modules/mvc/controller/backend/worker.js",
			"user-migration": "/models/migration.js",
			...(project.dependencies || {}),
		},
		settings: {
			...(project.settings || {}),
			preview: !!self.IS_PREVIEW,
			IS_MV3: !!self.chrome,
		},
	});

	if (APP && !STARTED) {
		console.log("App Worker: Initializing backend application");
		await $APP.Backend.bootstrap(APP);
	}
	return APP;
};
let app;
let commsPort;
const events = [];
const MessageHandler = {
	handleMessage: async ({ data }) => {
		if (data.eventId && events.includes(data.eventId)) return;
		if (data.eventId) events.push(data.eventId);

		const respond =
			data.eventId &&
			((responsePayload) => {
				if (commsPort) {
					console.log({ responsePayload, data });
					commsPort.postMessage({
						eventId: data.eventId,
						payload: responsePayload,
						connection: data.connection,
					});
				}
			});

		if ($APP?.Backend) {
			console.info(\`App Worker: Routing message to backend: \${data.type}\`, {
				data,
			});
			$APP.Backend.handleMessage({
				data,
				respond,
			});
		} else {
			$APP.hooks.on("APP:BACKEND_STARTED", async () => {
				console.info(
					\`App Worker: Routing message to backend after APP:BACKEND_STARTED: \${data.type}\`,
				);
				$APP.Backend.handleMessage({
					data,
					respond,
				});
			});
		}
	},
};

self.addEventListener("message", async (event) => {
	if (event.data.type === "INIT_PORT") {
		commsPort = event.ports[0];
		console.warn("App Worker: Communication port initialized.");
		commsPort.onmessage = MessageHandler.handleMessage;
		(async () => {
			app = await bootstrap();
			$APP.Backend.client = commsPort;
		})();
	}
});
`,mimeType:"application/javascript",skipSW:!1},"/bootstrap.js":{content:`import coreModules, {
	installModulePrototype,
} from "/modules/mvc/helpers/core.js";

const prototypeAPP = {
	async loadApp() {
		try {
			const response = await fetch("/package.json");
			if (!response.ok)
				throw new Error(\`HTTP error! status: \${response.status}\`);
			const packageConfig = await response.json();
			await this.bootstrap(packageConfig);
		} catch (error) {
			console.error("Could not load 'package.json'. Bootstrap failed.", {
				error,
			});
		}
	},

	async loadDep({ key, path, name, tag }, isLocals) {
		if (key && this[key]) return;
		const module = await import(path, { tag });
		let locals = {};
		if (module.dependencies) await this.inject(module.dependencies);
		if (module.locals) locals = await this.inject(module.locals, true);

		let instance;

		if (module.component) {
			instance = module.component;
		} else if (name && name in module) {
			const depExport = module[name];
			instance = depExport;
		} else if (typeof module.default === "function")
			instance = module.default({ ...this, $APP: this, ...locals }, locals);
		else instance = module.default;

		if (instance?.constructor === Promise) instance = await instance;

		if (module.migration) {
			if (!this.settings.dependencies) this.settings.dependencies = {};
			this.settings.dependencies[key] = path.replace(
				"index.js",
				"models/migration.js",
			);
		}

		if (key && !isLocals) this[key] = instance;
		if (tag) return instance;
		if (isLocals) return [key, instance];
	},

	addDep(key, dep) {
		this[key] = dep;
	},

	async inject(dependencies, isLocals = false) {
		const locals = [];
		for (const [key, path] of Object.entries(dependencies)) {
			const dep = await this.loadDep(
				{
					key,
					path: Array.isArray(path) ? path[0] : path,
					name: Array.isArray(path) ? path[1] : undefined,
				},
				isLocals,
			);
			if (isLocals && dep && Array.isArray(dep)) locals.push(dep);
		}
		if (isLocals)
			return Object.fromEntries(locals.filter((dep) => Array.isArray(dep)));
	},

	async bootstrap(
		{ dependencies = [], backend = false, settings = {}, theme },
		extraSettings = {},
	) {
		this.settings.set({
			...settings,
			...extraSettings,
			backend,
			frontend: !backend,
		});
		await this.inject(dependencies);
		if (!backend && theme) this.theme.set({ theme });
		this.hooks.emit("init");
		return this;
	},

	addHooks({ hooks, base }) {
		if (!this.hooks) return base;
		if (hooks)
			Object.entries(
				typeof hooks === "function"
					? hooks({ $APP: this, context: base })
					: hooks,
			).map(([name, fn]) => this.hooks.on(name, fn));
	},

	addModule(module) {
		if (
			(module.dev && this.settings.dev !== true) ||
			!!this?.modules?.[module.name]
		)
			return;
		if (!module.base) module.base = {};
		const { alias, name, hooks, beforeSave } = module;
		const base = module.base ?? this[name];
		if (this.modules && !this.modules[name]) this.modules.set(name, module);
		if (module.base) {
			installModulePrototype(base, beforeSave);
			this[name] = base;
			if (alias) this[alias] = base;
		}
		if (hooks) this.addHooks({ hooks, name, base });
		this.hooks
			?.get("moduleAdded")
			.map((fn) => fn.bind(this[module.name])({ module }));
		if (this.log) this.log(\`Module '\${module.name}' added successfully\`);
		return base;
	},
};

const initApp = (prototype = prototypeAPP) => {
	const app = Object.create(prototype);
	for (const moduleName in coreModules) app.addModule(coreModules[moduleName]);
	return app;
};

const $APP = initApp();
self.$APP = $APP;
export default $APP;
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/helpers/core.js":{content:`self.sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
export const ArrayStorageFunctions = {
	add: function (...values) {
		values.forEach(
			(value) =>
				!this.includes(value) &&
				this.push(this._beforeSave ? this._beforeSave(value) : value),
		);
		return this;
	},
	remove: function (key) {
		const index = Number.parseInt(key, 10);
		if (!Number.isNaN(index) && index >= 0 && index < this.length)
			this.splice(index, 1);
		return this;
	},
	list: function () {
		return [...this];
	},
	get: function (key) {
		const index = Number.parseInt(key, 10);
		return !Number.isNaN(index) && index >= 0 && index < this.length
			? this[index]
			: undefined;
	},
};

export const ObjectStorageFunctions = {
	set: function (...args) {
		if (args.length === 1 && typeof args[0] === "object" && args[0] !== null)
			Object.entries(args[0]).forEach(([k, v]) => {
				this[k] = this._beforeSave ? this._beforeSave(v) : v;
			});
		else if (args.length === 2 && typeof args[0] === "string") {
			this[args[0]] = this._beforeSave ? this._beforeSave(args[1]) : args[1];
		}
		return this;
	},
	add: function (prop, valuesToAdd) {
		if (typeof valuesToAdd !== "object") return;
		if (!this[prop]) this[prop] = {};
		Object.entries(valuesToAdd).forEach(([k, v]) => {
			this[prop][k] = this._beforeSave ? this._beforeSave(v) : v;
		});

		return this;
	},
	get: function (...args) {
		const [key1, key2] = args;
		if (args.length === 0) return undefined;
		if (args.length === 2) return this[key1]?.[key2];
		return this[key1];
	},
	remove: function (...args) {
		args.length === 2 ? delete this[args[0]][args[1]] : delete this[args[0]];
		return this;
	},
	list: function () {
		return Object.entries(this);
	},
	keys: function () {
		return Object.keys(this);
	},
};

export const installModulePrototype = (base, beforeSave) => {
	if (!base) base = {};
	const proto = Object.create(Object.getPrototypeOf(base));
	const storageFunctions = Array.isArray(base)
		? ArrayStorageFunctions
		: ObjectStorageFunctions;
	if (beforeSave) proto._beforeSave = beforeSave;
	Object.assign(proto, storageFunctions);
	Object.setPrototypeOf(base, proto);
	return base;
};

export const installEventsHandler = (target) => {
	const listeners = new Map();
	const anyListeners = new Set();
	target.listeners = listeners;
	target.hasListeners = (key) => {
		return listeners.has(key);
	};
	target.on = (key, callback) => {
		if (!callback)
			return console.error(
				\`Error adding listener to \${key}: no callback passed\`,
			);
		if (!listeners.has(key)) {
			listeners.set(key, new Set());
		}
		listeners.get(key).add(callback);
	};
	target.off = (key, callback) => {
		const callbackSet = listeners.get(key);
		if (!callbackSet) return;
		callbackSet.delete(callback);
		if (callbackSet.size === 0) {
			listeners.delete(key);
		}
	};
	target.onAny = (callback) => {
		if (!callback)
			return console.error("Error adding onAny listener: no callback passed");
		anyListeners.add(callback.bind(target));
	};
	target.offAny = (callback) => {
		anyListeners.delete(callback);
	};
	target.emit = (key, data) => {
		const results = [];
		listeners.get(key)?.forEach((callback) => {
			try {
				results.push(callback(data));
			} catch (error) {
				console.error(\`Error in listener for key "\${key}":\`, error);
			}
		});
		anyListeners.forEach((callback) => {
			try {
				const bindedFn = callback.bind(target);
				results.push(bindedFn({ key, data }));
			} catch (error) {
				console.error(\`Error in onAny listener for key "\${key}":\`, error);
			}
		});
		return results;
	};
	return target;
};

const eventsBase = { install: installEventsHandler };

export default {
	modules: {
		name: "modules",
		description: "Global modules store",
	},
	storage: {
		name: "storage",
		description: "Storage Module",
		base: {
			install: installModulePrototype,
		},
	},
	error: {
		name: "error",
		base: console.error,
	},
	log: {
		name: "log",
		base: console.log,
	},
	icons: { name: "Icons", base: new Map(Object.entries(self.__icons || {})) },
	theme: {
		name: "theme",
	},
	components: {
		name: "components",
	},
	hooks: {
		name: "hooks",
		description: "Global Hooks store",
		base: {
			get: function (type) {
				return this[type] || [];
			},
			on: function (type, fn) {
				this[type] = Array.isArray(this[type]) ? [...this[type], fn] : [fn];
			},
			set: function (hooks) {
				Object.entries(hooks).forEach(([key, hook]) => this.on(key, hook));
			},
			emit: async function (type, ...args) {
				try {
					if (Array.isArray(this[type])) {
						for (const hook of this[type]) {
							await hook(...args);
						}
					}
				} catch (error) {
					console.error(\`Error running hook '\${type}':\`, error);
				}
			},
			clear: function (type) {
				this[type] = null;
			},
		},
	},
	settings: {
		name: "settings",
		description: "Global settings store",
		base: {
			dev: true,
			backend: false,
			frontend: true,
			mv3: false,
			mv3Injected: false,
			basePath: "",
			...(self.__settings || {}),
		},
		hooks: ({ context }) => ({
			moduleAdded({ module }) {
				if (module.settings) context[module.name] = module.settings;
			},
		}),
	},
	events: {
		name: "events",
		description: "Global events Store",
		base: installEventsHandler(eventsBase),
	},
	data: {
		name: "data",
		description: "Data Migration store",
	},
	routes: {
		name: "routes",
		description: "Routes store",
	},
	devFiles: {
		name: "devFiles",
		base: [],
	},
	assetFiles: {
		name: "assetFiles",
		base: [],
	},
	app: { name: "app" },
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/types/index.js":{content:`const formats = { email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ };

const parseJSON = (value) => {
	try {
		return value in specialCases ? value : JSON.parse(value);
	} catch (_) {
		return undefined;
	}
};

const specialCases = {
	undefined: undefined,
	null: null,
	"": null,
	[undefined]: undefined,
};

const typeHandlers = {
	any: (value) => value,
	function: (value) => value,
	extension: () => undefined,
	boolean: (value, { attribute = true } = {}) =>
		(attribute && value === "") || ["true", 1, "1", true].includes(value),
	string: (val) => (val in specialCases ? specialCases[val] : String(val)),
	array: (value, prop = {}) => {
		if (Array.isArray(value)) return value;
		const { itemType } = prop;
		try {
			if (!value) throw value;
			const parsedArray = parseJSON(value);
			if (!Array.isArray(parsedArray)) throw parsedArray;
			return !itemType
				? parsedArray
				: parsedArray.map((item) =>
						typeof item !== "object"
							? item
							: Object.entries(item).reduce((obj, [key, val]) => {
									obj[key] = typeHandlers[itemType[key]?.type]
										? typeHandlers[itemType[key].type](val, prop)
										: val;
									return obj;
								}, {}),
					);
		} catch (_) {
			return [];
		}
	},
	number: (value) => {
		return value ? Number(value) : value;
	},
	date: (value) => new Date(value),
	datetime: (value) => {
		if (!value) return null;
		const date = new Date(value);
		return !Number.isNaN(date.getTime()) ? date : null;
	},
	object: (v, prop = {}) => {
		const value = typeof v === "string" ? parseJSON(v) : v;
		if (prop.properties) {
			Object.entries(prop.properties).map(([propKey, propProps]) => {
				if (propProps.defaultValue !== undefined) {
					value[propKey] = propProps.defaultValue;
				}
			});
		}
		return value;
	},
};

const stringToType = (value, prop = {}) => {
	const { type } = prop;
	return (typeHandlers[type] || ((val) => val))(value, prop);
};

const validations = {
	datetime: (value, prop = {}) => {
		if (prop.min && value < new Date(prop.min)) {
			return ["minimum", null];
		}
		if (prop.max && value > new Date(prop.max)) {
			return ["maximum", null];
		}
	},
	number: (value, prop = {}) => {
		if ("min" in prop && value < prop.min) {
			return ["minimum", null];
		}
		if ("max" in prop && value > prop.max) {
			return ["maximum", null];
		}
		if (Number.isNaN(Number(value))) {
			return ["NaN", null];
		}
	},
};

const validateField = (value, prop) => {
	if (
		prop.required === true &&
		(value === undefined || value === null || value === "")
	)
		return ["required", null];
	const typeHandler = typeHandlers[prop.type];
	if (prop.relationship) {
		if (prop.many) {
			return [
				null,
				Array.isArray(value)
					? value.map((i) => (prop.mixed ? i : (i?.id ?? i)))
					: [],
			];
		}
		return [null, value?.id ?? value];
	}
	const typedValue = typeHandler
		? typeHandler(value, prop)
		: [undefined, null, ""].includes(value)
			? (prop.defaultValue ?? null)
			: value;
	const validation = validations[prop.type];
	if (validation) {
		const errors = validation(value, prop);
		if (errors) return errors;
	}

	if ("format" in prop || formats[prop.key]) {
		const formatFn = "format" in prop ? prop.format : formats[prop.key];
		const format =
			typeof formatFn === "function"
				? prop.format
				: (value) => formatFn.test(value);
		const isValid = format(typedValue);
		if (!isValid) return ["invalid", null];
	}

	return [null, typedValue];
};

function interpolate(str, data) {
	return str.replace(/\\\${(.*?)}/g, (_, key) => {
		return data[key.trim()];
	});
}

const validateType = (
	object,
	{ schema, row = {}, undefinedProps = true, validateVirtual = false },
) => {
	if (!schema) return [null, object];
	const errors = {};
	let hasError = false;

	const props = undefinedProps ? schema : object;
	for (const key in props) {
		const prop = { ...schema[key], key };
		if ("virtual" in prop || prop.persist === false) continue;
		const [error, value] =
			[undefined, null, ""].includes(object[key]) && !prop.required
				? [null, prop.defaultValue]
				: validateField(object[key], prop);
		if (error) {
			hasError = true;
			errors[key] = error;
		} else if (value !== undefined) object[key] = value;
	}
	const virtual = Object.fromEntries(
		Object.entries(schema).filter(([_, prop]) => "virtual" in prop),
	);
	for (const prop in virtual) {
		if (validateVirtual) {
			const [error, value] = validateField(
				interpolate(virtual[prop].virtual, { ...row, ...object }),
				virtual[prop],
			);
			if (error) {
				hasError = true;
				errors[prop] = error;
			} else if (value !== undefined) object[prop] = value;
		} else
			object[prop] = interpolate(virtual[prop].virtual, { ...row, ...object });
	}

	if (hasError) return [errors, null];
	return [null, object];
};

const createType = (type, options) => {
	const normalizedOptions =
		typeof options === "object" && !Array.isArray(options) && options !== null
			? options
			: { defaultValue: options };

	return {
		type,
		persist: true,
		attribute: true,
		...normalizedOptions,
	};
};

const createRelationType =
	(relationship) =>
	(...args) => {
		const targetModel = args[0];
		let targetForeignKey;
		let options = args[2];
		if (typeof args[1] === "string") targetForeignKey = args[1];
		else options = args[1];
		const belongs = belongTypes.includes(relationship);
		return {
			type: belongs
				? relationship === "belongs_many"
					? "array"
					: "string"
				: relationship === "one"
					? "object"
					: "array",
			many: manyTypes.includes(relationship),
			belongs,
			persist: belongs,
			relationship,
			defaultValue: relationship === "belongs_many" ? [] : null,
			polymorphic: targetModel === "*" || Array.isArray(targetModel),
			targetModel,
			targetForeignKey,
			index: belongTypes.includes(relationship),
			...options,
		};
	};

const typesHelpers = {
	createType,
	stringToType,
	validateType,
};

const relationshipTypes = ["one", "many", "belongs", "belongs_many"];
const manyTypes = ["many", "belongs_many"];
const belongTypes = ["belongs", "belongs_many"];
const proxyHandler = {
	get(target, prop) {
		if (target[prop]) return target[prop];
		const type = prop.toLowerCase();
		if (relationshipTypes.includes(prop)) return createRelationType(prop);
		if (type === "extension")
			return (options = {}) =>
				createType("extension", {
					...options,
					persist: false,
					extension: true,
				});
		return (options = {}) => {
			if (!typeHandlers[type]) throw new Error(\`Unknown type: \${type}\`);
			return createType(type, options);
		};
	},
};

const Types = new Proxy(typesHelpers, proxyHandler);

export default Types;
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/indexeddb/index.js":{content:`export default async () => {
	const parseBoolean = { true: 1, false: 0 };
	const parseBooleanReverse = { true: true, false: false };

	async function open(props) {
		const db = Database(props);
		await db.init();
		return db;
	}

	function Database({ name: dbName, models, version }) {
		let db = null;
		let isConnected = false;
		let connectionPromise = null;
		let dbVersion = Number(version);

		const init = async () => {
			if (connectionPromise) return connectionPromise;

			connectionPromise = new Promise((resolve, reject) => {
				const request = indexedDB.open(dbName, dbVersion);

				request.onerror = (event) => {
					connectionPromise = null;
					reject(new Error(\`Failed to open database: \${event.target.error}\`));
				};

				request.onsuccess = (event) => {
					db = event.target.result;
					isConnected = true;

					db.onversionchange = () => {
						if (db) {
							db.close();
							db = null;
							isConnected = false;
							connectionPromise = null;
						}
					};
					resolve(db);
				};

				request.onupgradeneeded = (event) => {
					const currentDb = event.target.result;
					const transaction = event.target.transaction;
					Object.keys(models).forEach((storeName) => {
						if (!currentDb.objectStoreNames.contains(storeName)) {
							createStore(currentDb, storeName);
						} else {
							const objectStore = transaction.objectStore(storeName);
							const storeSchema = models[storeName];
							Object.keys(storeSchema).forEach((field) => {
								if (
									storeSchema[field].index === true &&
									!objectStore.indexNames.contains(field)
								) {
									objectStore.createIndex(field, field, {
										unique: storeSchema[field].unique || false,
										multiEntry: storeSchema[field].type === "array",
									});
								}
							});
						}
					});
				};
			});

			return connectionPromise;
		};

		const close = () => {
			if (db) {
				db.close();
			}
			db = null;
			isConnected = false;
			connectionPromise = null;
		};

		const reload = async (props) => {
			// Block new connections and wait for any pending one to finish.
			if (connectionPromise) {
				await connectionPromise;
			}

			close();

			// Update the version and models before re-initializing.
			dbVersion = props.version;
			models = props.models;
			// The next call to _ensureDb will trigger a fresh init.

			$APP.Backend.broadcast({
				type: "UPDATE_MODELS",
				payload: { models },
			});
			return init();
		};

		// This is the gatekeeper for all database operations.
		const _ensureDb = async () => {
			if (!isConnected || !db) {
				await init();
			}
		};

		const prepareRow = ({ model, row, reverse = false, currentRow = {} }) => {
			const parse = reverse ? parseBooleanReverse : parseBoolean;
			const modelProps = models[model];
			const updatedRow = { ...row };
			Object.keys(modelProps).forEach((prop) => {
				if (prop.relationship && !prop.belongs) return;
				if (row[prop] === undefined && currentRow[prop] !== undefined) {
					updatedRow[prop] = currentRow[prop];
				} else {
					if (modelProps[prop].type === "boolean") {
						updatedRow[prop] = row[prop] ? parse.true : parse.false;
					}
					if (updatedRow[prop] === undefined) delete updatedRow[prop];
				}
			});
			if (reverse) {
				Object.keys(modelProps).forEach((prop) => {
					if (modelProps[prop].type === "boolean") {
						if (updatedRow[prop] === parseBoolean.true) {
							updatedRow[prop] = true;
						} else if (updatedRow[prop] === parseBoolean.false) {
							updatedRow[prop] = false;
						}
					}
				});
			}
			return updatedRow;
		};

		const matchesFilter = (item, filter, modelName) => {
			const modelSchema = models[modelName];
			return Object.entries(filter).every(([key, queryValue]) => {
				const itemValue = item[key];
				const fieldSchema = modelSchema?.[key];
				if (
					typeof queryValue === "object" &&
					queryValue !== null &&
					!Array.isArray(queryValue)
				) {
					return Object.entries(queryValue).every(([operator, operand]) => {
						switch (operator) {
							case "$gt":
								return itemValue > operand;
							case "$gte":
								return itemValue >= operand;
							case "$lt":
								return itemValue < operand;
							case "$lte":
								return itemValue <= operand;
							case "$ne":
								return itemValue != operand;
							case "$in":
								return Array.isArray(operand) && operand.includes(itemValue);
							case "$nin":
								return Array.isArray(operand) && !operand.includes(itemValue);
							case "$contains":
								if (Array.isArray(itemValue))
									return itemValue.includes(operand);
								if (
									typeof itemValue === "string" &&
									typeof operand === "string"
								)
									return itemValue.includes(operand);
								return false;
							default:
								return false;
						}
					});
				}
				if (fieldSchema?.type === "boolean") {
					return Boolean(itemValue) == queryValue;
				}
				if (fieldSchema?.type === "array" && Array.isArray(itemValue)) {
					return itemValue.includes(queryValue);
				}
				return itemValue === queryValue;
			});
		};

		const createStore = (db, storeName) => {
			const storeSchema = models[storeName];
			const objectStore = db.createObjectStore(storeName, {
				keyPath: "id",
				autoIncrement: true,
			});
			Object.keys(storeSchema).forEach((field) => {
				if (
					storeSchema[field].index === true ||
					storeSchema[field].unique === true
				) {
					objectStore.createIndex(field, field, {
						unique: storeSchema[field].unique ?? false,
						multiEntry: storeSchema[field].type === "array",
					});
				}
			});
		};

		const findIndexedProperty = (filter, modelName) => {
			const modelSchema = models[modelName];
			if (!modelSchema || typeof filter !== "object" || filter === null)
				return null;
			for (const key in filter) {
				if (Object.hasOwn(filter, key)) {
					if (modelSchema[key]?.index) {
						return key;
					}
				}
			}
			return null;
		};

		const put = async (model, row, opts = {}) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(model, "readwrite");
				const store = transaction.objectStore(model);
				const request = store.put(
					prepareRow({ model, row, currentRow: opts.currentRow }),
				);
				request.onerror = () =>
					reject(new Error(\`Failed to put: \${request.error}\`));
				transaction.oncomplete = () => resolve(request.result);
			});
		};

		const getMany = async (
			storeName,
			filter = {},
			{ limit = 0, offset = 0, order = null, keys } = {},
		) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				try {
					const transaction = db.transaction(storeName, "readonly");
					const store = transaction.objectStore(storeName);
					const items = [];
					const modelSchema = models[storeName];
					const finishProcessingAndResolve = () => {
						if (order && items.length > 0) {
							const orderArray = Array.isArray(order)
								? order
								: order.split(",").map((item) => item.trim());
							items.sort((a, b) => {
								for (const currentOrder of orderArray) {
									let direction = 1;
									let field = currentOrder;
									if (currentOrder.startsWith("-")) {
										direction = -1;
										field = currentOrder.substring(1).trim();
									} else if (currentOrder.startsWith("+")) {
										field = currentOrder.substring(1).trim();
									}
									const valA = a[field];
									const valB = b[field];
									if (valA === undefined && valB === undefined) return 0;
									if (valA === undefined) return 1 * direction;
									if (valB === undefined) return -1 * direction;
									if (valA < valB) return -1 * direction;
									if (valA > valB) return 1 * direction;
								}
								return 0;
							});
						}
						const sliced =
							limit > 0
								? items.slice(offset, offset + limit)
								: items.slice(offset);
						resolve(
							sliced.map((row) =>
								prepareRow({ model: storeName, row, reverse: true }),
							),
						);
					};
					if (Array.isArray(filter)) {
						const request = store.openCursor();
						request.onerror = () =>
							reject(
								new Error(\`Failed to getMany \${storeName}: \${request.error}\`),
							);
						request.onsuccess = (event) => {
							const cursor = event.target.result;
							if (cursor) {
								if (
									filter.includes(cursor.key) &&
									(!keys || keys.includes(cursor.key))
								) {
									items.push(cursor.value);
								}
								cursor.continue();
							} else {
								finishProcessingAndResolve();
							}
						};
						return;
					}
					let cursorRequest;
					let useIndex = false;
					const indexedProp = findIndexedProperty(filter, storeName);
					if (indexedProp && Object.keys(filter).length > 0) {
						let queryValue = filter[indexedProp];
						if (modelSchema[indexedProp]?.type === "boolean") {
							queryValue = queryValue ? parseBoolean.true : parseBoolean.false;
						}
						if (queryValue !== undefined) {
							try {
								const index = store.index(indexedProp);
								cursorRequest = index.openCursor(IDBKeyRange.only(queryValue));
								useIndex = true;
							} catch (e) {
								cursorRequest = store.openCursor();
							}
						} else {
							cursorRequest = store.openCursor();
						}
					} else {
						cursorRequest = store.openCursor();
					}
					cursorRequest.onerror = () =>
						reject(
							new Error(
								\`Failed to getMany \${storeName}: \${cursorRequest.error}\`,
							),
						);
					cursorRequest.onsuccess = (event) => {
						const cursor = event.target.result;
						if (cursor) {
							const primaryKeyToCheck = useIndex
								? cursor.primaryKey
								: cursor.key;
							if (keys && !keys.includes(primaryKeyToCheck)) {
								cursor.continue();
								return;
							}
							if (matchesFilter(cursor.value, filter, storeName)) {
								items.push(cursor.value);
							}
							cursor.continue();
						} else {
							finishProcessingAndResolve();
						}
					};
				} catch (error) {
					reject(
						new Error(
							\`Failed to start transaction: \${error.message}. Query Props: \${JSON.stringify({ storeName, limit, offset, filter, order, keys })}\`,
						),
					);
				}
			});
		};

		const get = async (storeName, keyOrFilter) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				if (!keyOrFilter) return resolve(null);
				const transaction = db.transaction(storeName, "readonly");
				const store = transaction.objectStore(storeName);
				const modelSchema = models[storeName];
				if (typeof keyOrFilter === "object" && !Array.isArray(keyOrFilter)) {
					const indexedProp = findIndexedProperty(keyOrFilter, storeName);
					let cursorRequest;
					if (indexedProp) {
						let queryValue = keyOrFilter[indexedProp];
						if (modelSchema[indexedProp]?.type === "boolean") {
							queryValue = queryValue ? parseBoolean.true : parseBoolean.false;
						}
						if (queryValue !== undefined) {
							try {
								const index = store.index(indexedProp);
								cursorRequest = index.openCursor(IDBKeyRange.only(queryValue));
							} catch (e) {
								cursorRequest = store.openCursor();
							}
						} else {
							cursorRequest = store.openCursor();
						}
					} else {
						cursorRequest = store.openCursor();
					}
					cursorRequest.onerror = () =>
						reject(new Error(\`Failed to get: \${cursorRequest.error}\`));
					cursorRequest.onsuccess = (event) => {
						const cursor = event.target.result;
						if (cursor) {
							if (matchesFilter(cursor.value, keyOrFilter, storeName)) {
								resolve(
									prepareRow({
										model: storeName,
										row: cursor.value,
										reverse: true,
									}),
								);
							} else {
								cursor.continue();
							}
						} else {
							resolve(null);
						}
					};
				} else {
					if (Array.isArray(keyOrFilter)) {
						reject(
							new Error("Filter for get must be an object or a primary key."),
						);
						return;
					}
					const request = store.get(keyOrFilter);
					request.onerror = () =>
						reject(new Error(\`Failed to get: \${request.error}\`));
					request.onsuccess = () =>
						resolve(
							!request.result
								? null
								: prepareRow({
										model: storeName,
										row: request.result,
										reverse: true,
									}),
						);
				}
			});
		};

		const remove = async (storeName, key) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, "readwrite");
				const store = transaction.objectStore(storeName);
				const request = store.delete(key);
				request.onerror = () =>
					reject(new Error(\`Failed to delete: \${request.error}\`));
				request.onsuccess = () => resolve(true);
			});
		};

		const count = async (storeName, { filter = {} } = {}) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, "readonly");
				const store = transaction.objectStore(storeName);
				if (Object.keys(filter).length === 0) {
					const request = store.count();
					request.onerror = () =>
						reject(new Error(\`Failed to count: \${request.error}\`));
					request.onsuccess = () => resolve(request.result);
				} else {
					const request = store.openCursor();
					let countNum = 0;
					request.onerror = () =>
						reject(new Error(\`Failed to count: \${request.error}\`));
					request.onsuccess = (event) => {
						const cursor = event.target.result;
						if (cursor) {
							if (matchesFilter(cursor.value, filter, storeName)) {
								countNum++;
							}
							cursor.continue();
						} else {
							resolve(countNum);
						}
					};
				}
			});
		};

		const isEmpty = async (storeName) => {
			const recordCount = await count(storeName);
			return recordCount === 0;
		};

		const clear = async (storeName) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, "readwrite");
				const store = transaction.objectStore(storeName);
				const request = store.clear();
				request.onerror = () =>
					reject(new Error(\`Failed to clear: \${request.error}\`));
				request.onsuccess = () => resolve();
			});
		};

		const destroy = async () => {
			const dbNameToDelete = dbName;
			close();
			return new Promise((resolve, reject) => {
				const request = indexedDB.deleteDatabase(dbNameToDelete);
				request.onerror = () =>
					reject(new Error(\`Failed to delete database: \${request.error}\`));
				request.onsuccess = () => resolve();
			});
		};

		const exportStore = async (storeName) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, "readonly");
				const store = transaction.objectStore(storeName);
				const request = store.getAll();
				request.onerror = () =>
					reject(new Error(\`Failed to export: \${request.error}\`));
				request.onsuccess = () => {
					const dump = {};
					if (request.result) {
						request.result.forEach((item) => {
							if (["string", "number"].includes(typeof item.id)) {
								dump[item.id] = item;
							}
						});
					}
					resolve(dump);
				};
			});
		};

		const importStore = async (storeName, data) => {
			await _ensureDb();
			if (!Array.isArray(data)) {
				throw new Error("No data provided or data is not an array");
			}
			if (data.length === 0) return Promise.resolve();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, "readwrite");
				const store = transaction.objectStore(storeName);
				let completed = 0;
				let firstError = null;
				data.forEach((entry) => {
					if (firstError) return;
					const request = store.put(entry);
					request.onerror = () => {
						if (!firstError) {
							firstError = request.error;
							transaction.abort();
							reject(new Error(\`Failed to import: \${firstError}\`));
						}
					};
					request.onsuccess = () => {
						if (firstError) return;
						completed++;
						if (completed === data.length) {
						}
					};
				});
				transaction.oncomplete = () => {
					if (!firstError) resolve();
				};
				transaction.onerror = () => {
					if (!firstError)
						reject(
							new Error(
								\`Transaction error during import: \${transaction.error}\`,
							),
						);
				};
			});
		};

		const transactionWrapper = async (storeNames, mode = "readwrite") => {
			await _ensureDb();
			const idbTransaction = db.transaction(storeNames, mode);
			return {
				transaction: idbTransaction,
				put: (model, row, opts = {}) => {
					return new Promise((resolve, reject) => {
						const store = idbTransaction.objectStore(model);
						const preparedRow = prepareRow({
							model,
							row,
							currentRow: opts.currentRow,
						});
						const request = store.put(preparedRow);
						request.onsuccess = () => resolve(request.result);
						request.onerror = () => reject(request.error);
					});
				},
				remove: (model, id) => {
					return new Promise((resolve, reject) => {
						const store = idbTransaction.objectStore(model);
						const request = store.delete(id);
						request.onsuccess = () => resolve(true);
						request.onerror = () => reject(request.error);
					});
				},
				done: () => {
					return new Promise((resolve, reject) => {
						idbTransaction.oncomplete = () => resolve();
						idbTransaction.onerror = () => reject(idbTransaction.error);
						idbTransaction.onabort = () =>
							reject(idbTransaction.error || new Error("Transaction aborted"));
					});
				},
				abort: () => idbTransaction.abort(),
			};
		};

		return {
			init,
			transaction: transactionWrapper,
			getMany,
			prepareRow,
			put,
			get,
			remove,
			reload,
			count,
			isEmpty,
			clear,
			get db() {
				return db;
			},
			close,
			destroy,
			export: exportStore,
			import: importStore,
			get isConnected() {
				return isConnected;
			},
			get version() {
				return dbVersion;
			},
			name: dbName,
			models,
		};
	}

	return { open };
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/database/index.js":{content:`export const dependencies = {
	metadata: "/modules/mvc/model/extensions/metadata.js",
	operations: "/modules/mvc/model/extensions/operations.js",
};
export default async ({ $APP, T, IndexedDBWrapper, metadata, operations }) => {
	const addModels = ({ context, collection = "models" }) => {
		return ({ module }) => {
			if (!module[collection]) return;
			const models = Object.fromEntries(
				Object.keys(module[collection]).map((model) => {
					const props = {
						id: T.string({ primary: true }),
						...module[collection][model],
					};
					return [
						model,
						Object.fromEntries(
							Object.entries(props).map(([key, prop]) => {
								prop.name = key;
								if (prop.relationship && !prop.targetForeignKey)
									prop.targetForeignKey = model;
								return [key, prop];
							}),
						),
					];
				}),
			);
			context.set(models);
		};
	};

	const availableDatabaseExtensions = {
		operations,
		metadata,
	};

	$APP.addModule({
		name: "sysmodels",
		hooks: ({ context }) => ({
			moduleAdded: addModels({ context, collection: "sysmodels" }),
		}),
		settings: { APP: "App", USER: "User", DEVICE: "Device" },
	});

	$APP.sysmodels.set({
		[$APP.settings.sysmodels.APP]: {
			name: T.string({ index: true, primary: true }),
			version: T.number(),
			users: T.many($APP.settings.sysmodels.USER, "appId"),
			active: T.boolean({ defaultValue: true, index: true }),
			models: T.object(),
			migrationTimestamp: T.number(),
		},
		[$APP.settings.sysmodels.USER]: {
			name: T.string({ index: true, primary: true }),
			appId: T.one($APP.settings.sysmodels.APP, "users"),
			devices: T.many($APP.settings.sysmodels.DEVICE, "userId"),
			publicKey: T.string(),
			privateKey: T.string(),
			active: T.boolean({ index: true }),
		},
		[$APP.settings.sysmodels.DEVICE]: {
			name: T.string({ index: true, primary: true }),
			userId: T.one($APP.settings.sysmodels.USER, "devices"),
			deviceData: T.string(),
			active: T.number({ defaultValue: true, index: true }),
		},
	});

	const isSystem = (model) => !!$APP.sysmodels[model];

	$APP.addModule({
		name: "DatabaseExtensions",
		base: $APP.storage.install([]),
	});

	const filterExtensionModels = (models, ext) =>
		Object.fromEntries(
			Object.entries(models)
				.filter(([_, schema]) => Object.hasOwn(schema, \`$\${ext}\`))
				.map(([model]) => [model, availableDatabaseExtensions[ext]]),
		);

	const loadDBDump = async (payload) => {
		const { dump } = payload;
		const app = payload.app ?? (await $APP.Backend.getApp());
		if (!dump) throw "No dump provided";
		if (!app) throw "No app selected";
		for (const [modelName, entries] of Object.entries(dump))
			if ($APP.Model[modelName])
				await $APP.Model[modelName].addMany(entries, { keepIndex: true });

		await $APP.SysModel.edit($APP.settings.sysmodels.APP, {
			id: app.id,
			migrationTimestamp: Date.now(),
		});
	};

	const createDBDump = async () => {
		const app = await $APP.Backend.getApp();
		const dump = {};
		const modelNames = Object.keys(app.models);

		for (const modelName of modelNames)
			if ($APP.Model[modelName])
				dump[modelName] = await $APP.Model[modelName].getAll({ object: true });

		return dump;
	};

	const createDatabase = () => {
		let models;
		let version;
		let name;
		let db;
		let system;
		const extdbs = {};
		const stores = {};

		const open = async (props = {}) => {
			if (props.extensions) $APP.DatabaseExtensions.add(...props.extensions);
			if (props.name) name = props.name;
			if (props.models) models = props.models;
			if (props.version) version = props.version;
			system = props.system === true;
			if (db) db.close();
			db = await IndexedDBWrapper.open({
				name,
				version,
				models,
			});
			if ($APP.DatabaseExtensions.length && !system) {
				$APP.DatabaseExtensions.forEach(async (ext) => {
					extdbs[ext] = await IndexedDBWrapper.open({
						name: \`\${name}_\${ext}\`,
						version,
						models: filterExtensionModels(models, ext),
					});
				});
			}
		};

		const _loadRelationshipsForMany = async (
			rows,
			modelName,
			includes,
			opts,
		) => {
			if (!rows || rows.length === 0 || !includes || includes.length === 0)
				return;
			const modelDef = models[modelName];
			const idsToFetchByModel = {};
			const relationshipDetails = {};

			for (const relation of includes) {
				const relationDef = modelDef[relation];
				if (!relationDef) continue;
				relationshipDetails[relation] = relationDef;

				const { targetModel, belongs, polymorphic, mixed } = relationDef;

				for (const row of rows) {
					let fkValue = row[relation];

					if (belongs) {
						fkValue = row[relation];
					} else {
						continue;
					}
					if (fkValue === null || fkValue === undefined) continue;

					const addId = (model, id) => {
						if (!idsToFetchByModel[model]) idsToFetchByModel[model] = new Set();
						idsToFetchByModel[model].add(id);
					};

					const processFkValue = (val) => {
						if (polymorphic) {
							if (typeof val === "string") {
								const [polyModel, polyId] = val.split("@");
								if (polyModel && polyId) addId(polyModel, polyId);
							}
						} else if (typeof val === "string") {
							addId(targetModel, val);
						} else if (mixed && typeof val === "object" && val !== null) {
						}
					};
					if (Array.isArray(fkValue)) {
						fkValue.forEach(processFkValue);
					} else {
						processFkValue(fkValue);
					}
				}
			}

			const fetchedItemsByModel = {};
			for (const [modelToFetch, idSet] of Object.entries(idsToFetchByModel)) {
				if (idSet.size > 0) {
					const ids = Array.from(idSet);
					const items = await api.getMany(modelToFetch, ids);
					fetchedItemsByModel[modelToFetch] = items.reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}
			}

			for (const row of rows) {
				for (const relation of includes) {
					const relationDef = relationshipDetails[relation];
					if (!relationDef) continue;

					const { targetModel, belongs, polymorphic, mixed, many } =
						relationDef;
					const transform = opts.transform ?? relationDef.transform;

					if (belongs) {
						const fkValueOnCurrentRow = row[relation];
						if (
							fkValueOnCurrentRow === null ||
							fkValueOnCurrentRow === undefined
						) {
							row[relation] = many ? [] : null;
							continue;
						}

						const stitch = (fk) => {
							let model = targetModel;
							let id = fk;
							if (polymorphic && typeof fk === "string") {
								[model, id] = fk.split("@");
							}
							if (mixed && typeof fk === "object" && fk !== null) return fk;

							const item = fetchedItemsByModel[model]?.[id] ?? null;
							return transform ? transform(item, model) : item;
						};

						if (many) {
							row[relation] = Array.isArray(fkValueOnCurrentRow)
								? fkValueOnCurrentRow.map(stitch).filter(Boolean)
								: [];
						} else {
							row[relation] = stitch(fkValueOnCurrentRow);
						}
					} else {
						let filter;
						if (polymorphic) {
							const searchPolymorphicId = \`\${modelName}@\${row.id}\`;
							const targetFkDef =
								models[targetModel]?.[relationDef.targetForeignKey];
							if (targetFkDef?.many) {
								filter = {
									[relationDef.targetForeignKey]: {
										$contains: searchPolymorphicId,
									},
								};
							} else {
								filter = {
									[relationDef.targetForeignKey]: searchPolymorphicId,
								};
							}
						} else {
							filter = { [relationDef.targetForeignKey]: row.id };
						}
						row[relation] =
							relationDef.relationship === "one"
								? await api.get(targetModel, filter)
								: await api.getMany(targetModel, filter);
					}
				}
			}
		};

		const api = {
			loadDBDump,
			createDBDump,
			extdbs,
			get db() {
				return db;
			},
			get models() {
				return models;
			},
			get version() {
				return db?.version;
			},
			open,
			stores,
			reload: open,
			count: (...args) => db.count(...args),
			isEmpty: (...args) => db.isEmpty(...args),
			async put(model, row = {}, opts = {}) {
				const { skipRelationship = false, currentRow = {} } = opts;
				const properties = models[model];
				if (!properties)
					return console.error(
						\`Model \${model} not found. current schema version: \${version} / \${db.version}\`,
					);
				if (isSystem(model)) {
					try {
						const result = await db.put(model, row);
						if (result) {
							const row = await db.get(model, result);
							return [null, row];
						}
						return [null, null];
					} catch (error) {
						return [error, null];
					}
				}
				const [errors, validatedRow] = T.validateType(row, {
					schema: models[model],
					row: currentRow,
					undefinedProps: !!opts.insert,
					validateVirtual: true,
				});
				if (errors) return [errors, null];
				try {
					if (skipRelationship) {
						await db.put(model, validatedRow, opts);
						return [null, validatedRow];
					}
					const storesToTransact = [model];
					const relationships = Object.keys(properties).filter((prop) => {
						const propDef = properties[prop];
						const bool =
							propDef.targetModel &&
							propDef.relationship &&
							validatedRow[prop] !== undefined &&
							validatedRow[prop] !== null;
						if (bool && !storesToTransact.includes(propDef.targetModel)) {
							if (propDef.polymorphic) {
							} else storesToTransact.push(propDef.targetModel);
						}
						return bool;
					});
					const id = validatedRow.id || row.id;
					const updates = [];
					for (const propKey of relationships) {
						const prop = properties[propKey];
						let relatedValue = validatedRow[propKey];
						if (prop.many && Array.isArray(relatedValue)) {
							const newFkArray = [];
							for (const item of relatedValue) {
								if (
									typeof item === "string" ||
									(prop.mixed && typeof item === "object" && item !== null)
								) {
									newFkArray.push(item);
								} else {
									const childModel = prop.targetModel;
									if (models[childModel]) {
										const newChildRow = { ...item };
										if (!newChildRow.id)
											newChildRow.id = $APP.Backend.generateId();

										updates.push([childModel, newChildRow]);
										if (!storesToTransact.includes(childModel))
											storesToTransact.push(childModel);

										const idToStore = prop.polymorphic
											? \`\${childModel}@\${newChildRow.id}\`
											: newChildRow.id;
										newFkArray.push(idToStore);
									}
								}
							}
							validatedRow[propKey] = newFkArray;
							relatedValue = newFkArray;
						}

						if (!models[prop.targetModel] && !prop?.polymorphic) {
							console.error(
								\`ERROR: couldn't find target model '\${prop.targetModel}' for relationship '\${propKey}' on model '\${model}'\`,
							);
							continue;
						}
						const fkProp = models[prop.targetModel]?.[prop.targetForeignKey];
						if (!fkProp) {
							if (!prop.belongs) {
								console.warn(
									\`WARN: couldn't find target foreign key '\${prop.targetForeignKey}' in model '\${prop.targetModel}' for relationship '\${propKey}' from '\${model}'. This might be a one-way definition or configuration issue.\`,
								);
							}
							continue;
						}
						if (fkProp.belongs) {
							const effectiveFkId = fkProp.polymorphic ? \`\${model}@\${id}\` : id;
							const targetIsMany = fkProp.many;

							if (targetIsMany) {
								const fks = Array.isArray(relatedValue)
									? relatedValue
									: [relatedValue];
								if (fks.length) {
									const targets = await api.getMany(
										prop.targetModel,
										fks.map((fk) =>
											fk && typeof fk === "object" ? fk.id : fk,
										),
									);
									targets.forEach((target) => {
										if (target) {
											const fk = target[prop.targetForeignKey];
											if (!fk) target[prop.targetForeignKey] = [effectiveFkId];
											else if (!fk.includes(effectiveFkId))
												fk.push(effectiveFkId);
											updates.push([prop.targetModel, target]);
										}
									});
								}
							} else {
								const targetId =
									typeof relatedValue === "string"
										? relatedValue
										: relatedValue?.id;
								if (targetId) {
									const target = await api.get(prop.targetModel, targetId);
									if (target) {
										target[prop.targetForeignKey] = effectiveFkId;
										updates.push([prop.targetModel, target]);
									}
								}
							}
						}
						if (!prop.belongs && !properties[propKey]?.polymorphic) {
							delete validatedRow[propKey];
						}
					}

					updates.push([model, validatedRow]);
					const tx = await db.transaction(storesToTransact);
					const relatedPuts = updates.map(([m, r]) => tx.put(m, r));
					await Promise.all(relatedPuts);
					await tx.done();
					return [null, validatedRow];
				} catch (error) {
					console.error("Error in put operation:", error, {
						model,
						row,
						models,
						version,
					});
					return [error, null];
				}
			},
			async get(model, filter, opts = {}) {
				if (!filter) return null;
				const { insert = false, includes = [], recursive = null } = opts;
				let row = await db.get(model, filter);
				if (!row && !insert) return null;
				if (!row && insert) {
					const [error, newRow] = await api.add(
						model,
						typeof filter === "object" ? filter : { id: filter },
						{
							skipRelationship: true,
							...(typeof filter !== "object" && {
								overrideId: true,
								keepIndex: true,
							}),
						},
					);
					if (error) {
						console.error("Failed to insert record in get():", error);
						return null;
					}
					row = newRow;
				}
				if (row && includes.length) {
					await _loadRelationshipsForMany([row], model, includes, opts);
				}
				if (row && recursive) {
					const visited = new Set();
					let itemsToProcess = [row];
					const relationName = recursive;
					while (itemsToProcess.length > 0) {
						const currentBatch = [];
						for (const item of itemsToProcess) {
							const modelForVisitor = item._modelName || model;
							const visitedKey = \`\${modelForVisitor}@\${item.id}\`;
							if (!visited.has(visitedKey)) {
								visited.add(visitedKey);
								currentBatch.push(item);
							}
						}

						if (currentBatch.length === 0) break;

						await _loadRelationshipsForMany(
							currentBatch,
							model,
							[relationName],
							opts,
						);

						itemsToProcess = [];
						for (const item of currentBatch) {
							const children = item[relationName];
							if (Array.isArray(children)) {
								children.forEach((child) => {
									if (child) {
										const relDef = models[model][relationName];
										if (relDef) child._modelName = relDef.targetModel;
										itemsToProcess.push(child);
									}
								});
							} else if (children) {
								const relDef = models[model][relationName];
								if (relDef) children._modelName = relDef.targetModel;
								itemsToProcess.push(children);
							}
						}
					}
				}
				return row;
			},
			async getMany(model, filter, opts = {}) {
				const { limit, offset, order, includes = [], recursive = null } = opts;
				let items;
				if (Array.isArray(filter)) {
					items = (
						await Promise.all(filter.map((id) => db.get(model, id)))
					).filter((item) => item !== null);
				} else {
					items = await db.getMany(model, filter, {
						limit,
						offset,
						order,
					});
				}

				if (includes.length && items.length)
					await _loadRelationshipsForMany(items, model, includes, opts);

				if (recursive && items.length) {
					const visited = new Set();
					let itemsToProcess = [...items];
					const relationName = recursive;

					while (itemsToProcess.length > 0) {
						const currentBatch = [];
						for (const item of itemsToProcess) {
							const modelForVisitor = item._modelName || model;
							const visitedKey = \`\${modelForVisitor}@\${item.id}\`;
							if (!visited.has(visitedKey)) {
								visited.add(visitedKey);
								currentBatch.push(item);
							}
						}

						if (currentBatch.length === 0) break;

						const batchModelName = currentBatch[0]._modelName || model;
						await _loadRelationshipsForMany(
							currentBatch,
							batchModelName,
							[relationName],
							opts,
						);

						itemsToProcess = [];
						for (const item of currentBatch) {
							const children = item[relationName];
							const relDef = models[batchModelName][relationName];
							if (Array.isArray(children)) {
								children.forEach((child) => {
									if (child) {
										if (relDef) child._modelName = relDef.targetModel;
										itemsToProcess.push(child);
									}
								});
							} else if (children) {
								if (relDef) children._modelName = relDef.targetModel;
								itemsToProcess.push(children);
							}
						}
					}
				}

				if (!limit) return items;

				const count = await db.count(
					model,
					Array.isArray(filter) ? { id: { $in: filter } } : filter,
				);
				return { count, limit, offset, items };
			},
			async remove(model, id, opts = {}) {
				const properties = models[model];
				if (!properties) {
					console.error(\`Model \${model} not found for removal.\`);
					return false;
				}
				const row = await api.get(model, id);
				if (!row) return false;
				const relationships = Object.keys(properties).filter(
					(prop) =>
						properties[prop].targetModel && properties[prop].relationship,
				);
				const storesToTransact = [model];
				const updates = [];

				if (relationships.length > 0) {
					for (const propKey of relationships) {
						const propDef = properties[propKey];
						if (!propDef.targetModel || !propDef.targetForeignKey) continue;

						if (!storesToTransact.includes(propDef.targetModel)) {
							if (propDef.polymorphic) {
							} else storesToTransact.push(propDef.targetModel);
						}

						const targetModelName = propDef.targetModel;
						const fkFieldNameOnTarget = propDef.targetForeignKey;
						const fkFieldDefOnTarget =
							models[targetModelName]?.[fkFieldNameOnTarget];

						if (!fkFieldDefOnTarget) continue;

						if (fkFieldDefOnTarget.belongs) {
							const valueToRemove = fkFieldDefOnTarget.polymorphic
								? \`\${model}@\${id}\`
								: id;
							let filterForTargets;

							if (fkFieldDefOnTarget.many) {
								filterForTargets = {
									[fkFieldNameOnTarget]: { $contains: valueToRemove },
								};
							} else
								filterForTargets = { [fkFieldNameOnTarget]: valueToRemove };

							const targetsToUpdate = await api.getMany(
								targetModelName,
								filterForTargets,
							);

							targetsToUpdate.forEach((target) => {
								let newFkValue;
								if (fkFieldDefOnTarget.many) {
									newFkValue = (target[fkFieldNameOnTarget] || []).filter(
										(entry) => entry !== valueToRemove,
									);
								} else {
									newFkValue = null;
								}
								updates.push([
									targetModelName,
									{ ...target, [fkFieldNameOnTarget]: newFkValue },
								]);
							});
						}
					}
				}
				try {
					const tx = await db.transaction(storesToTransact);
					const relatedPuts = updates.map(([targetModel, targetRow]) =>
						tx.put(targetModel, targetRow),
					);
					const mainRemove = tx.remove(model, id);
					await Promise.all([...relatedPuts, mainRemove]);
					await tx.done();
					const system = isSystem(model);
					[\`ModelRemoveRecord-\${model}\`, "onRemoveRecord"].forEach((event) =>
						$APP.hooks.emit(event, {
							model,
							opts,
							id,
							system,
							row,
							db: api,
							extensions: Object.keys(models[model])
								.filter((prop) => prop[0] === "$")
								.map((prop) => prop.slice(1)),
						}),
					);
					return true;
				} catch (error) {
					console.error(
						"Failed to remove record or update relationships:",
						error,
						{ model, id },
					);
					return false;
				}
			},
			async removeMany(model, filter, opts = {}) {
				if (!filter && opts.filter) filter = opts.filter;
				const entries = Array.isArray(filter)
					? filter.map((item) => (typeof item === "object" ? item.id : item))
					: (await db.getMany(model, filter)).map((entry) => entry.id);
				return Promise.all(
					entries
						.filter(Boolean)
						.map((entryId) => api.remove(model, entryId, opts)),
				);
			},
			async edit(model, row, _opts = {}) {
				if (!row || !row.id) {
					console.error("Edit operation requires a row with an ID.", {
						model,
						row,
					});
					return {
						errors: { id: "ID is required for edit." },
						model,
						row,
						opts: _opts,
					};
				}
				const opts = {
					..._opts,
					update: true,
					currentRow:
						_opts.currentRow ??
						(await api.get(model, row.id, { includes: [] })),
				};
				if (!opts.currentRow) {
					console.warn(\`Record not found for edit: \${model} with id \${row.id}\`);
					return { errors: { record: "Record not found." }, model, row, opts };
				}
				const [errors, patchResult] = await api.put(
					model,
					{ ...opts.currentRow, ...row },
					opts,
				);

				if (errors) return { errors, model, row, opts };
				const system = isSystem(model);
				[\`ModelEditRecord-\${model}\`, "onEditRecord"].forEach((event) =>
					$APP.hooks.emit(event, {
						row,
						model,
						system,
						opts,
						db: api,
						extensions: Object.keys(models[model])
							.filter((prop) => prop[0] === "$")
							.map((prop) => prop.slice(1)),
					}),
				);
				return patchResult;
			},
			async editMany(model, rows, opts = {}) {
				if (!rows?.length) return [];
				const results = await Promise.allSettled(
					rows.map(async (row) => {
						if (row?.id) return api.edit(model, row, opts);
						return { errors: { id: "Row or ID missing for editMany" }, row };
					}),
				);
				return results;
			},
			async editAll(model, filter, updates, opts = {}) {
				const rows = await db.getMany(model, filter, {
					...opts,
				});
				const results = await Promise.allSettled(
					rows.map((row) =>
						api.edit(
							model,
							{ ...row, ...updates },
							{ ...opts, currentRow: row },
						),
					),
				);
				return results;
			},
			async add(model, row, opts = {}) {
				const newRow = { ...row };
				const system = isSystem(model);
				if ((!system && !opts.keepIndex && !opts.overrideId) || !newRow.id) {
					newRow.id = $APP.Backend.generateId();
				}
				const [errors, resultRow] = await api.put(model, newRow, {
					...opts,
					insert: true,
				});
				if (errors) return { errors, model, row: newRow, opts };
				[\`ModelAddRecord-\${model}\`, "onAddRecord"].forEach((event) =>
					$APP.hooks.emit(event, {
						model,
						row: resultRow,
						system,
						opts,
						db: api,
						extensions: Object.keys(models[model])
							.filter((prop) => prop[0] === "$")
							.map((prop) => prop.slice(1)),
					}),
				);

				return resultRow;
			},
			async addMany(model, rows = [], opts = {}) {
				const results = await Promise.allSettled(
					rows.map((row) => api.add(model, row, opts)),
				);
				return results;
			},
		};
		return api;
	};

	const SysModel = createDatabase();
	await SysModel.open({
		name: $APP.settings.sysmodels.APP,
		version: 1,
		models: $APP.sysmodels,
		system: true,
	});

	$APP.addModule({
		name: "sysmodel",
		alias: "SysModel",
		base: SysModel,
	});

	const Database = createDatabase();

	$APP.hooks.on(
		"APP:BACKEND_STARTED",
		async ({ app, user, device, models }) => {
			if (!app || !models) {
				console.error(
					"APP:BACKEND_STARTED hook called with invalid app or models.",
					{
						app,
						models,
					},
				);
				return;
			}

			await Database.open({
				name: app.id,
				version: app.version,
				extensions: app.extensions,
				system: false,
				models: { ...models, ...(app.models || {}) },
			});
			$APP.hooks.emit("APP:DATABASE_STARTED", { app, user, device });
		},
	);

	return Database;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/extensions/metadata.js":{content:`export const module = true;
export default ({ T, $APP }) => {
	$APP.hooks.set({
		onAddRecord({ model, row, system, extensions }) {
			if (system || !$APP.Database.extdbs || !extensions.includes("metadata"))
				return;
			const db = $APP.Database.extdbs.metadata;
			if (!db) return console.error("Metadata database instance not active.");
			db.put(model, {
				id: row.id,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		},
		async onEditRecord({ model, row, system, extensions }) {
			if (system || !$APP.Database.extdbs || !extensions.includes("metadata"))
				return;
			const db = $APP.Database.extdbs.metadata;
			if (!db) return console.error("Metadata database instance not active.");
			const metadataRow = await db.get(model, row.id);
			metadataRow.updatedAt = Date.now();
			db.put(model, metadataRow);
		},
		onRemoveRecord({ model, id, system, extensions }) {
			if (system || !$APP.Database.extdbs || !extensions.includes("metadata"))
				return;
			const db = $APP.Database.extdbs.metadata;
			if (!db) return console.error("Metadata database instance not active.");
			db.remove(model, id);
		},
	});
	return {
		createdAt: T.string({ index: true }),
		updatedAt: T.string({ index: true }),
		createdBy: T.string({ index: true }),
		updatedBy: T.string({ index: true }),
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/extensions/operations.js":{content:`export const module = true;
export default ({ T, $APP }) => {
	$APP.hooks.set({
		onAddRecord({ model, row, system, extensions }) {
			if (system || !$APP.Database.extdbs || !extensions.includes("operations"))
				return;
			const db = $APP.Database.extdbs.operations;
			if (!db) return console.error("Operations database instance not active.");
			db.put(model, {
				timestamp: Date.now(),
				row,
			});
		},
		async onEditRecord({ model, id, row, system, extensions }) {
			if (system || !$APP.Database.extdbs || !extensions.includes("operations"))
				return;
			const db = $APP.Database.extdbs.operations;
			if (!db) return console.error("Operations database instance not active.");
			db.put(model, {
				timestamp: Date.now(),
				rowId: id,
				row,
			});
		},
		onRemoveRecord({ model, id, system, extensions }) {
			if (system || !$APP.Database.extdbs || !extensions.includes("operations"))
				return;
			const db = $APP.Database.extdbs.operations;
			if (!db) return console.error("Operations database instance not active.");
			db.put(model, {
				timestamp: Date.now(),
				removedAt: Date.now(),
				rowId: id,
			});
		},
	});
	return {
		createdAt: T.string({ index: true }),
		removedAt: T.string(),
		rowId: T.string({ index: true }),
		row: T.object(),
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/backend.js":{content:`import Model from "/modules/mvc/model/index.js";

export default ({ $APP, Database }) => {
	const queryModelEvents = {
		DISCONNECT: (_, { port }) => port.removePort(),
		CREATE_REMOTE_WORKSPACE: async ({ payload }, { importDB }) =>
			importDB(payload),
		ADD_REMOTE_USER: async ({ payload }) =>
			$APP.Backend.createUserEntry(payload),
		ADD: async ({ payload, respond }) => {
			const response = await Database.add(
				payload.model,
				payload.row,
				payload.opts,
			);
			respond(response);
		},
		ADD_MANY: async ({ payload, respond }) => {
			const response = await Database.addMany(
				payload.model,
				payload.rows,
				payload.opts,
			);
			respond({ success: true, results: response });
		},
		REMOVE: async ({ payload, respond }) => {
			const response = await Database.remove(
				payload.model,
				payload.id,
				payload.opts,
			);
			respond(response);
		},
		REMOVE_MANY: async ({ payload, respond }) => {
			const response = await Database.removeMany(
				payload.model,
				payload.ids,
				payload.opts,
			);
			respond({ success: true, results: response });
		},
		EDIT: async ({ payload, respond }) => {
			const response = await Database.edit(
				payload.model,
				payload.row,
				payload.opts,
			);
			respond(response);
		},
		EDIT_MANY: async ({ payload, respond }) => {
			const response = await Database.editMany(
				payload.model,
				payload.rows,
				payload.opts,
			);
			respond({ success: true, results: response });
		},
		GET: async ({ payload, respond }) => {
			const { id, model, opts = {} } = payload;
			const response = await Database.get(
				model,
				id ??
					(opts.filter &&
						((typeof opts.filter === "string" && JSON.parse(opts.filter)) ||
							opts.filter)),
				opts,
			);
			respond(response);
		},
		GET_MANY: async ({ payload: { model, opts = {} }, respond } = {}) => {
			const response = await Database.getMany(model, opts.filter, opts);
			respond(response);
		},
	};

	$APP.events.set(queryModelEvents);

	const request = (action, modelName, payload = {}) => {
		return new Promise((resolve) => {
			const event = queryModelEvents[action];
			if (event && typeof event === "function") {
				event({
					respond: resolve,
					payload: {
						model: modelName,
						...payload,
					},
				});
			} else
				resolve({ success: false, error: \`Action "\${action}" not found.\` });
		});
	};

	const syncRelationships = ({ model, row }) => {
		if (!row) return;

		const props = $APP.models[model];
		const relationships = Object.entries(props).filter(
			([, prop]) => prop.belongs && prop.targetModel !== "*",
		);

		if (!relationships.length) return;

		relationships.forEach(([key, prop]) => {
			if (row[key]) {
				$APP.Backend.broadcast({
					type: "REQUEST_DATA_SYNC",
					payload: {
						key: \`get:\${row[key]}\`,
						model: prop.targetModel,
						data: undefined,
					},
				});
			}
		});
	};

	const handleExtensions = ({ row, db, model }) => {
		if (!row.models) return;
		const currentExtensions = new Set(row.extensions || []);
		const foundExtensions = new Set();
		Object.values(row.models).forEach((modelSchema) =>
			Object.keys(modelSchema).forEach((prop) => {
				if (prop.startsWith("$")) {
					foundExtensions.add(prop.slice(1));
				}
			}),
		);
		const newExtensions = [...foundExtensions].filter(
			(ext) => !currentExtensions.has(ext),
		);

		if (newExtensions.length === 0) return;

		console.log(\`New extensions found: \${newExtensions.join(", ")}\`);

		newExtensions.forEach((extensionName) => {
			console.log(\`Initializing extension: \${extensionName}\`);
			$APP.DatabaseExtensions.add(extensionName);
		});

		const allExtensions = [...currentExtensions, ...newExtensions];
		db.edit(model, { ...row, extensions: allExtensions });
	};

	$APP.hooks.set({
		"ModelAddRecord-App": handleExtensions,
		"ModelEditRecord-App": handleExtensions,
		onAddRecord({ model, row, system }) {
			if (system) return;
			$APP.Backend.broadcast({
				type: "REQUEST_DATA_SYNC",
				payload: { key: \`get:\${row.id}\`, model, data: row },
			});
			syncRelationships({ model, row });
			console.log("BROADCAST MESSAGE", {
				system,
				type: "REQUEST_DATA_SYNC",
				payload: { key: \`get:\${row.id}\`, model, data: row },
			});
		},
		onEditRecord({ model, row, system }) {
			if (system) return;
			$APP.Backend.broadcast({
				type: "REQUEST_DATA_SYNC",
				payload: { key: \`get:\${row.id}\`, model, data: row },
			});
			syncRelationships({ model, row });
		},
		onRemoveRecord({ model, row, id, system }) {
			if (system) return;
			$APP.Backend.broadcast({
				type: "REQUEST_DATA_SYNC",
				payload: { key: \`get:\${id}\`, model, data: undefined },
			});
			syncRelationships({ model, row });
		},
	});

	Model.request = request;
	return Model;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/model/index.js":{content:`import $APP from "/bootstrap.js";
import T from "/modules/types/index.js";

const addModels = ({ context, collection = "models" }) => {
	return ({ module }) => {
		if (!module[collection]) return;
		const models = Object.fromEntries(
			Object.keys(module[collection]).map((model) => {
				const props = {
					id: T.string({ primary: true }),
					...module[collection][model],
				};
				return [
					model,
					Object.fromEntries(
						Object.entries(props).map(([key, prop]) => {
							prop.name = key;
							if (prop.relationship && !prop.targetForeignKey)
								prop.targetForeignKey = model;
							return [key, prop];
						}),
					),
				];
			}),
		);
		context.set(models);
	};
};

$APP.addModule({
	name: "models",
	hooks: ({ context }) => ({
		moduleAdded: addModels({ context, collection: "models" }),
		moduleUpdated: addModels({ context, collection: "models" }),
	}),
});

const instanceProxyHandler = {
	get(target, prop, receiver) {
		if (prop === "remove") {
			return () =>
				Model.request("REMOVE", target._modelName, { id: target.id });
		}

		if (prop === "update") {
			return () => {
				const cleanRow = { ...target };
				delete cleanRow._modelName;
				return Model.request("EDIT", target._modelName, {
					row: cleanRow,
				});
			};
		}

		if (prop === "include") {
			return async (include) => {
				if (!target.id || !target._modelName) {
					console.error(
						"Cannot run .include() on an object without an ID or model name.",
					);
					return receiver; // Return the proxy itself for chaining.
				}

				if (!(target._modelName in $APP.models))
					throw new Error(
						\`Model \${target._modelName} does not exist in models\`,
					);

				const model = $APP.models[target._modelName];
				const prop = model[include];
				if (!prop)
					throw new Error(
						\`Relationship '\${include}' not found in \${target._modelName} model\`,
					);
				const freshData = await Model.request("GET_MANY", prop.targetModel, {
					opts: {
						filter: prop.belongs
							? target[include]
							: { [prop.targetForeignKey]: target.id },
					},
				});
				target[include] = proxifyMultipleRows(freshData, prop.targetModel);

				return receiver;
			};
		}
		return target[prop];
	},

	set(target, prop, value) {
		target[prop] = value;
		return true;
	},
};

const handleModelRequest = async ({ modelName, action, payload }) => {
	const result = await Model.request(action, modelName, payload);
	if (action === "ADD_MANY" && result && Array.isArray(result.results)) {
		result.results.forEach((res) => {
			if (res.status === "fulfilled" && res.value) {
				res.value = proxifyRow(res.value, modelName);
			}
		});
		return result;
	}

	if (action.includes("MANY")) {
		if (payload.opts.object) return result;
		if (result?.items) {
			result.items = proxifyMultipleRows(result.items, modelName);
			return result;
		}
		return proxifyMultipleRows(result, modelName);
	}

	return proxifyRow(result, modelName);
};

const getMethodRegistry = (modelName) => [
	{
		type: "static",
		name: "get",
		handler: (id, opts = {}) =>
			handleModelRequest({
				modelName,
				action: "GET",
				payload: id ? { id, opts } : { opts },
			}),
	},
	{
		type: "static",
		name: "getAll",
		handler: (opts = {}) =>
			handleModelRequest({
				modelName,
				action: "GET_MANY",
				payload: { opts },
			}),
	},
	{
		type: "static",
		name: "add",
		handler: (row, opts) =>
			handleModelRequest({
				modelName,
				action: "ADD",
				payload: { row, opts },
			}),
	},
	{
		type: "static",
		name: "addMany",
		handler: (rows, opts) =>
			handleModelRequest({
				modelName,
				action: "ADD_MANY",
				payload: { rows, opts },
			}),
	},
	{
		type: "static",
		name: "remove",
		handler: (id) => Model.request("REMOVE", modelName, { id }),
	},
	{
		type: "static",
		name: "removeAll",
		handler: (filter) =>
			Model.request("REMOVE_MANY", modelName, { opts: { filter } }),
	},
	{
		type: "static",
		name: "edit",
		handler: (row) =>
			handleModelRequest({
				modelName,
				action: "EDIT",
				payload: { row },
			}),
	},
	{
		type: "static",
		name: "editAll",
		handler: (filter, updates) =>
			Model.request("EDIT_MANY", modelName, { opts: { filter, updates } }),
	},
	{
		type: "static",
		name: "upsert",
		handler: (row, opts) =>
			handleModelRequest({
				modelName,
				action: row?.id ? "EDIT" : "ADD",
				payload: { row, opts },
			}),
	},
	{ type: "dynamic", prefix: "getBy", action: "GET" },
	{ type: "dynamic", prefix: "getAllBy", action: "GET_MANY" },
	{ type: "dynamic", prefix: "editAllBy", action: "EDIT_MANY" },
	{ type: "dynamic", prefix: "editBy", action: "EDIT" },
	{ type: "dynamic", prefix: "removeBy", action: "REMOVE" },
	{ type: "dynamic", prefix: "removeAllBy", action: "REMOVE_MANY" },
];

const proxifyRow = (row, modelName) => {
	if (!row || typeof row !== "object" || row.errors) return row;
	Model[modelName].rows[row.id] = row;
	Model[modelName].on(\`get:\${row.id}\`, (data) => {
		if (data === undefined) {
			delete Model[modelName].rows[row.id];
			return;
		}
		const { id, ...newRow } = data;
		Object.assign(Model[modelName].rows[row.id], newRow);
	});
	row._modelName = modelName;
	return new Proxy(Model[modelName].rows[row.id], instanceProxyHandler);
};

const proxifyMultipleRows = (rows, modelName) => {
	if (!Array.isArray(rows)) return rows;
	return rows.map((row) => proxifyRow(row, modelName));
};

const uncapitalize = (str) => {
	if (typeof str !== "string" || !str) return str;
	return str.charAt(0).toLowerCase() + str.slice(1);
};

const modelApiCache = new Map();
const Model = new Proxy(
	{},
	{
		get(target, prop, receiver) {
			if (prop in target) return Reflect.get(target, prop, receiver);
			if (modelApiCache.has(prop)) return modelApiCache.get(prop);
			const modelName = prop;
			if (!(prop in $APP.models)) {
				throw new Error(\`Model \${modelName} does not exist in models\`);
			}
			const modelSchema = $APP.models[modelName];
			const methodRegistry = getMethodRegistry(modelName, modelSchema);
			const modelApi = new Proxy(
				{},
				{
					get(target, methodName, modelReceiver) {
						if (methodName in target)
							return Reflect.get(target, methodName, modelReceiver);
						for (const definition of methodRegistry) {
							if (
								definition.type === "static" &&
								definition.name === methodName
							)
								return definition.handler;

							if (
								definition.type === "dynamic" &&
								methodName.startsWith(definition.prefix)
							) {
								const property = methodName.slice(definition.prefix.length);
								if (!property) continue;

								const propertyKey = uncapitalize(property);

								if (!(propertyKey in modelSchema))
									throw new Error(
										\`Property '\${propertyKey}' not found in model '\${modelName}'\`,
									);

								return (value, row = null) => {
									const payload = {
										opts: { filter: { [propertyKey]: value } },
									};
									if (row) payload.opts.row = row;

									return handleModelRequest({
										modelName,
										action: definition.action,
										payload,
									});
								};
							}
						}
						throw new Error(
							\`Method '\${methodName}' not found in model '\${modelName}'\`,
						);
					},
				},
			);

			$APP.events.install(modelApi);

			modelApi.rows = $APP.storage.install({});
			modelApiCache.set(prop, modelApi);
			return modelApi;
		},
	},
);
Model.proxifyRow = proxifyRow;
Model.proxifyMultipleRows = proxifyMultipleRows;
Model.addModels = addModels;
export default Model;
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/controller/backend/worker.js":{content:`export default ({ $APP, Database }) => {
	const generateId = (() => {
		let lastTimestamp = 0;
		let sequentialCounter = 0;
		return () => {
			let now = Date.now();
			if (now > lastTimestamp) {
				sequentialCounter = 0;
			} else {
				sequentialCounter++;
				now += sequentialCounter;
			}
			lastTimestamp = now;
			return now.toString();
		};
	})();

	let nextRequestId = 1;
	const pendingRequests = {};
	const pendingBackendRequests = {};

	const requestFromClient = async (type, payload, timeout = 5000) => {
		const clients = await self.clients.matchAll({
			type: "window",
			includeUncontrolled: true,
		});
		const client = clients[0]; // Simple strategy: pick the first client.

		if (!client) {
			return Promise.reject(
				new Error("No active client found to send request to."),
			);
		}

		const eventId = \`backend-request-\${nextRequestId++}\`;

		return new Promise((resolve, reject) => {
			pendingBackendRequests[eventId] = { resolve, reject };
			setTimeout(() => {
				delete pendingBackendRequests[eventId];
				reject(new Error(\`Request timed out after \${timeout}ms\`));
			}, timeout);
			client.postMessage({
				type,
				payload,
				eventId,
			});
		});
	};

	const broadcast = async (params) => {
		if (!$APP.Backend.client) return;
		$APP.Backend.client.postMessage(params);
		$APP.Backend.client.postMessage({ type: "BROADCAST", params });
	};

	const handleMessage = async ({ data, respond }) => {
		const { events } = $APP;
		const { type, payload, connection, eventId } = data;
		if (pendingBackendRequests[eventId]) {
			const promise = pendingBackendRequests[eventId];
			promise.resolve(payload);
			delete pendingBackendRequests[eventId];
			return;
		}

		if (connection) {
			if (!pendingRequests[eventId]) {
				$APP.mv3.postMessage(data, connection);
				pendingRequests[eventId] = respond;
			} else pendingRequests[eventId].postMessage(data);
			return;
		}

		const handler = events[type];
		if (!handler) return;
		await handler({
			payload,
			eventId,
			respond,
			client: createClientProxy($APP.Backend.client),
			broadcast,
		});
	};

	const createClientProxy = (client) => {
		return new Proxy(
			{},
			{
				get: (target, prop) => {
					return (payload) => sendRequestToClient(client, prop, payload);
				},
			},
		);
	};

	const sendRequestToClient = (client, type, payload) => {
		const eventId = \`sw_\${nextRequestId++}\`;
		return new Promise((resolve, reject) => {
			pendingBackendRequests[eventId] = { resolve, reject };
			client.postMessage({ type, payload, eventId });
		});
	};

	function createModelAdder({ $APP, getApp, debounceDelay = 50 }) {
		let debounceTimer;
		const processModelAdditions = async () => {
			if (!$APP.dynamicModels.length) return;
			$APP.log(\`Batch processing \${$APP.dynamicModels.length} model(s)...\`);

			try {
				const { SysModel } = $APP;
				const app = await getApp();
				app.version++;
				app.models = $APP.models;
				await SysModel.edit($APP.settings.sysmodels.APP, app);
				$APP.log(
					\`Batch add successful. \${$APP.dynamicModels.length} model(s) added. App version is now \${app.version}.\`,
				);

				await Database.reload({
					models: app.models,
					version: app.version,
				});
				const env = await setupAppEnvironment(app);
				await migrateData(Object.fromEntries($APP.dynamicData), {
					skipDynamicCheck: true,
				});
				await $APP.hooks.emit("APP:STARTED", env);
			} catch (error) {
				console.error("Failed to process model additions batch:", error);
			}
		};

		$APP.addModule({ name: "dynamicModels", base: [] });
		$APP.addModule({ name: "dynamicData", base: [] });

		return function addModel({ name, schema }) {
			if (!$APP.dynamicModels.includes(name)) $APP.dynamicModels.add(name);
			if (!name || !schema)
				throw new Error("A model 'name' and 'schema' are required.");
			$APP.log(\`Model "\${name}" queued for addition.\`);
			$APP.models.set({ [name]: schema });
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(processModelAdditions, debounceDelay);
		};
	}

	const createAppEntry = async ({
		timestamp = Date.now(),
		id = timestamp.toString(),
		models = $APP.models,
		version = 1,
	} = {}) => {
		const app = {
			id,
			version,
			active: true,
			models,
		};

		await $APP.SysModel.add($APP.settings.sysmodels.APP, app);
		$APP.hooks.emit("APP:CREATED", {
			app,
		});
		return app;
	};

	async function generateKeyPair() {
		const keyPair = await self.crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: "SHA-256",
			},
			true,
			["encrypt", "decrypt"],
		);

		const publicKey = await self.crypto.subtle.exportKey(
			"spki",
			keyPair.publicKey,
		);
		const privateKey = await self.crypto.subtle.exportKey(
			"pkcs8",
			keyPair.privateKey,
		);

		return {
			publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
			privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
		};
	}

	const createUserEntry = async ({ app: _app, device, user } = {}) => {
		const app = _app || (await $APP.Backend.getApp());
		if (!user) {
			const existingUser = await $APP.SysModel.get(
				$APP.settings.sysmodels.USER,
				{
					active: true,
					appId: app.id,
				},
			);

			if (existingUser) {
				existingUser.privateKey = null;
				const existingDevice = await $APP.SysModel.get(
					$APP.settings.sysmodels.DEVICE,
					{
						userId: existingUser.id,
						active: true,
					},
				);
				if (!existingDevice)
					await $APP.SysModel.add($APP.settings.sysmodels.DEVICE, device);
				return existingUser;
			}
		}

		const { publicKey, privateKey } = await generateKeyPair();
		const newUser = user || {
			id: user?.id || generateId(),
			name: user?.name || "Local User",
			publicKey,
			privateKey,
			appId: app.id,
			active: true,
		};
		await $APP.SysModel.add($APP.settings.sysmodels.USER, newUser);

		const newDevice = device || {
			userId: newUser.id,
			appId: app.id,
			active: true,
		};
		await $APP.SysModel.add($APP.settings.sysmodels.DEVICE, newDevice);
		newUser.privateKey = null;
		return newUser;
	};

	const getApp = async () => {
		return await $APP.SysModel.get($APP.settings.sysmodels.APP, {
			active: true,
		});
	};

	const getUser = async (_app) => {
		if ($APP.Backend.user) return $APP.Backend.user;
		const app = _app || (await $APP.Backend.getApp());
		if ($APP.Backend.user && $APP.Backend.user.appId !== app.id) {
			$APP.Backend.user = null;
		}

		if (!$APP.Backend.user) {
			let puser = await $APP.SysModel.get($APP.settings.sysmodels.USER, {
				appId: app.id,
				active: true,
			});
			if (!puser)
				puser = await $APP.Backend.createUserEntry({
					app,
				});
			const { privateKey, active, ...user } = puser;
			$APP.Backend.user = user;
		}
		return $APP.Backend.user;
	};

	const getDevice = async ({ app: _app, user: _user } = {}) => {
		const app = _app || (await $APP.Backend.getApp());
		const user = _user || (await $APP.Backend.getUser(app));
		if (!user) throw new Error("User not found");
		const device = await $APP.SysModel.get($APP.settings.sysmodels.DEVICE, {
			userId: user.id,
			active: true,
		});
		return device || null;
	};

	const migrateData = async (_data, opts = {}) => {
		const { skipDynamicCheck = false } = opts;
		const data = _data ?? $APP.data;
		const { SysModel } = $APP;
		const app = await getApp();
		const appsData = Object.entries(data);
		if (appsData.length) {
			const dump = {};
			for (const [modelName, entries] of appsData) {
				if (!skipDynamicCheck && !$APP.models[modelName])
					$APP.dynamicData.add([modelName, entries]);
				else dump[modelName] = entries;
			}
			Database.loadDBDump({ dump, app });

			Database.app = await SysModel.edit($APP.settings.sysmodels.APP, {
				id: app.id,
				migrationTimestamp: Date.now(),
			});
		}
	};

	$APP.DatabaseExtensions;
	const setupAppEnvironment = async (app) => {
		Database.app = app;
		const extensions = [];
		app.models ??= {};
		Object.values(app.models).forEach((modelSchema) =>
			Object.keys(modelSchema).forEach((prop) => {
				if (prop.startsWith("$")) {
					extensions.push(prop.slice(1));
				}
			}),
		);
		await Database.reload({
			name: app.id,
			models: app.models,
			version: app.version,
			extensions,
		});
		const { active, privateKey, ...user } = await getUser(app);
		const device = await getDevice({
			app,
			user,
		});
		if ($APP.data && !app.migrationTimestamp) {
			await migrateData($APP.data);
			app = await getApp();
		}

		return {
			app,
			user,
			device,
			models: app.models,
		};
	};

	const addModel = createModelAdder({
		$APP,
		getApp,
	});

	const Backend = {
		bootstrap: async () => {
			let app = await getApp();
			if (!app) {
				app = await createAppEntry();
			}
			const env = await setupAppEnvironment(app);
			if (!$APP.dynamicModels.length) {
				await $APP.hooks.on("APP:DATABASE_STARTED", async () => {
					await $APP.hooks.emit("APP:STARTED", env);
				});
			}
			await $APP.hooks.emit("APP:BACKEND_STARTED", env);
			return env;
		},
		handleMessage,
		getApp,
		getDevice,
		createAppEntry,
		createUserEntry,
		getUser,
		generateId,
		broadcast,
		addModel,
		requestFromClient,
	};

	$APP.events.set({
		INIT_APP: async ({ respond }) => {
			await $APP.hooks.on(
				"APP:STARTED",
				async ({ app, user, device, models }) => {
					respond({ app, user, device, models });
				},
			);
		},
		GET_CURRENT_APP: async ({ respond }) => {
			const app = await $APP.Backend.getApp();
			respond(app);
		},
		LIST_APPS: async ({ respond }) => {
			const apps = await $APP.SysModel.getMany($APP.settings.sysmodels.APP);
			respond(apps || []);
		},
		CREATE_APP: async ({ respond }) => {
			const currentApp = await $APP.Backend.getApp();
			if (currentApp) {
				await $APP.SysModel.edit($APP.settings.sysmodels.APP, {
					id: currentApp.id,
					active: false,
				});
			}

			const newApp = await $APP.Backend.createAppEntry();
			const env = await setupAppEnvironment(newApp);
			respond(env.app);
		},
		SELECT_APP: async ({ payload, respond }) => {
			const { appId } = payload;
			if (!appId) {
				return respond({
					error: "An 'appId' is required to select an app.",
				});
			}

			const currentApp = await $APP.Backend.getApp();
			if (currentApp && currentApp.id !== appId) {
				await $APP.SysModel.edit($APP.settings.sysmodels.APP, {
					id: currentApp.id,
					active: false,
				});
			}

			await $APP.SysModel.edit($APP.settings.sysmodels.APP, {
				id: appId,
				active: true,
			});

			const selectedApp = await $APP.SysModel.get($APP.settings.sysmodels.APP, {
				id: appId,
			});

			const env = await setupAppEnvironment(selectedApp);
			respond(env.app);
		},

		GET_DB_DUMP: async ({ respond }) => {
			const dump = await Database.createDBDump();
			respond(dump);
		},

		LOAD_DB_DUMP: async ({ payload, respond = console.log }) => {
			try {
				Database.loadDBDump(payload);
				respond({ success: true });
			} catch (error) {
				console.error("Failed to load DB dump:", error);
				respond({ success: false, error });
			}
		},
	});

	return Backend;
};
`,mimeType:"application/javascript",skipSW:!1},"/models/migration.js":{content:`export const version = 1;

export default ({ T, $APP }) => {
	const data = {
		blocks: [
			{
				id: "posts-schema-definition",
				collection: "posts",
				properties: {
					title: T.string({ required: true }),
					headline: T.string(),
					content: T.string({ type: "textarea" }),
					status: T.string({
						enum: ["draft", "published", "scheduled"],
						index: true,
					}),
					createdAt: T.string({ type: "datetime" }),
					feed_items: T.many("feed", "item"),
					tags: T.many("tags", "taggable"),
				},
			},
			{
				id: "links-schema-definition",
				collection: "links",
				properties: {
					url: T.string({ required: true }),
					title: T.string({ required: true }),
					description: T.string({ type: "textarea" }),
					createdAt: T.string({ type: "datetime" }),
					feed_items: T.many("feed", "item"),
					tags: T.many("tags", "taggable"),
				},
			},
			{
				id: "projects-schema-definition",
				collection: "projects",
				properties: {
					name: T.string({ required: true }),
					description: T.string({ type: "textarea" }),
					url: T.string(),
					image: T.string(),
					status: T.string({ enum: ["active", "archived"] }),
					feed_items: T.many("feed", "item"),
					tags: T.many("tags", "taggable"),
					stack: T.many("stack", "projects"), // Relationship to the stack
				},
			},
			{
				id: "stack-schema-definition",
				collection: "stack",
				properties: {
					name: T.string({ required: true, index: true }),
					projects: T.belongs_many("projects", "stack"), // Relationship back to projects
				},
			},

			// --- Polymorphic Relationship Schemas ---
			{
				id: "feed-schema-definition",
				collection: "feed",
				properties: {
					type: T.string({ index: true, defaultValue: "main" }),
					item: T.one("*", "feed_items", { polymorphic: true }),
					createdAt: T.string({ type: "datetime" }),
				},
			},
			{
				id: "tags-schema-definition",
				collection: "tags",
				properties: {
					name: T.string({ required: true, index: true }),
					taggable: T.belongs_many("*", "tags", { polymorphic: true }),
				},
			},

			// --- Other Schemas ---
			{
				id: "profile-schema-definition",
				collection: "profiles",
				properties: {
					name: T.string(),
					handle: T.string(),
					bio: T.string({ input: "textarea" }),
					avatar: T.string(),
					headerImage: T.string(),
				},
			},
			{
				id: "favorites-schema-definition",
				collection: "favorites",
				properties: {
					favoritable: T.one("*", "favorites", { polymorphic: true }),
					list: T.string({ defaultValue: "default" }),
				},
			},
			{
				id: "notifications-schema-definition",
				collection: "notifications",
				properties: {
					title: T.string({ required: true }),
					body: T.string({ type: "textarea" }),
					read: T.boolean({ defaultValue: false }),
					endpoint: T.string(),
					p256dh: T.string(),
					auth: T.string(),
				},
			},
		],

		profiles: [
			{
				id: "main-profile",
				name: "Alan Leal",
				handle: "brazuka.dev",
				bio: "I started to code at age 12 to create a website about Dragon Ball Z that got aired in a national TV program. Since then I've been trying to do something cooler without much success. Currently I work as a software engineer and consultant for tech companies and am now starting to write about a lot of stuff at brazuka.dev.",
				avatar:
					"https://lh3.googleusercontent.com/a/ACg8ocLY8rMTOQdVufDG-cMsgnz69KbyOWGh_zT59jNyl-JVyFbVQ07q=s288-c-no",
				headerImage:
					"https://cdn.bsky.app/img/banner/plain/did:plc:kft6lu4trxowqmter2b6vg6z/bafkreiek62qzg63w5utds443ptdul7u5kodm53rep3ib4lf62b53s343hi@jpeg",
			},
		],
		posts: [
			{
				id: "hello-world",
				title: "Brazuka.dev's First Post",
				content:
					"After ages, I have a blog to write about tech again. This is the first post! :)",
				createdAt: "2025-08-29T10:00:00Z",
				tags: ["tag-js", "tag-webdev"],
			},
		],
		links: [
			{
				id: "link-1",
				url: "https://arstechnica.com/information-technology/2025/08/the-personhood-trap-how-ai-fakes-human-personality/",
				title: "The Personhood Trap: How AI Fakes Human Personality",
				description: // Changed from 'content' to 'description' to match schema
					"A comprehensive survey of prompt engineering demonstrated just how powerful these prompts are. Adding instructions like 'You are a helpful assistant' versus 'You are an expert researcher' changed accuracy on factual questions by up to 15 percent.",
				createdAt: "2025-08-27T11:00:00Z",
				tags: ["tag-ai"],
			},
		],
		projects: [
			{
				id: "proj-1",
				name: "Personal Website & Blog",
				description:
					"The very website you're looking at now. Built with a custom frontend framework and a flexible, block-based data model.",
				url: "https://brazuka.dev",
				status: "active",
				tags: ["tag-webdev"],
				stack: [
					// Added stack data
					"stack-js",
					"stack-html",
					"stack-tailwind",
					"stack-css",
					"stack-wc",
					"stack-idb",
					"stack-lit",
					"stack-git",
					"stack-md",
					"stack-cm",
					"stack-mcp",
				],
			},
		],
		stack: [
			// Added stack collection data
			{ id: "stack-js", name: "JavaScript" },
			{ id: "stack-html", name: "HTML" },
			{ id: "stack-css", name: "CSS" },
			{ id: "stack-tailwind", name: "Tailwind" },
			{ id: "stack-wc", name: "Web Component" },
			{ id: "stack-idb", name: "IndexedDB" },
			{ id: "stack-lit", name: "Lit-html" },
			{ id: "stack-git", name: "Git" },
			{ id: "stack-md", name: "Markdown" },
			{ id: "stack-cm", name: "CodeMirror" },
			{ id: "stack-mcp", name: "MCP (Model Context Protocol)" },
		],
		feed: [
			{
				id: "feed-1",
				item: "posts@hello-world",
				createdAt: "2025-08-26T10:00:00Z",
			},
			{ id: "feed-2", item: "links@link-1", createdAt: "2025-08-25T14:00:00Z" },
			{
				id: "feed-3",
				item: "projects@proj-1",
				createdAt: "2025-08-24T18:00:00Z",
			},
			{ id: "feed-4", item: "links@link-1", createdAt: "2025-08-27T11:00:00Z" },
		],
		tags: [
			{ id: "tag-js", name: "JavaScript" },
			{ id: "tag-webdev", name: "Web Development" },
			{ id: "tag-api", name: "API" },
			{
				id: "tag-ai",
				name: "AI",
				taggable: ["posts@hello-world", "links@link-1"],
			},
		],
		favorites: [
			{ id: "fav-1", favoritable: "posts@hello-world", list: "reading-list" },
			{ id: "fav-2", favoritable: "links@link-1" },
		],
	};

	$APP.data.set(data);
	$APP.models.set({
		blocks: {
			name: T.string({ index: true }),
			title: T.string(),
			tag: T.string({ index: true }),
			type: T.string({ defaultValue: "block" }),
			properties: T.object(),
			indexed: T.many("index", "indexed", { polymorphic: true }),
			blocks: T.belongs_many("*", "parents", {
				mixed: true,
				polymorphic: true,
			}),
			parents: T.many("*", "blocks", { polymorphic: true }),
			collection: T.string({
				index: true,
				description:
					"If present, this block defines and uses a data collection.",
			}),
			mixed: T.boolean(),
			tags: T.array({
				description:
					"If mixed is false, defines the blocks which can be used inside this container",
			}),
		},
		index: {
			indexed: T.belongs("*", "indexed", { polymorphic: true }),
		},
	});

	$APP.hooks.on("ModelAddRecord-blocks", async ({ row }) => {
		if (row.collection) {
			$APP.dynamicModels.add(row.collection);
			return $APP.Backend.addModel({
				name: row.collection,
				schema: row.properties,
			});
		}
	});
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/drive/models/migration.js":{content:`import $APP from "/bootstrap.js";
import T from "/modules/types/index.js";

const blogData = {
	files: [
		{ name: "modules", directory: "", isDirectory: true },
		{
			name: "app.js",
			directory: "",
			content: \`
import T from "/modules/types/index.js";
import html from "/modules/mvc/view/html/index.js";
export default ({tag: "app-index",

	properties: {
		name: T.string({ defaultValue: "Visitor" }),
	},

	render() {
		return html\\\`
			<div class="p-4">
				<uix-card class="p-6 shadow rounded-xl bg-white">
					<span class="text-lg font-bold text-center">\\\${this.name}, Welcome to Bootstrapp!</span>
					<uix-button class="mt-4" label="Click!"></uix-button>
				</uix-card>
			</div>
		\\\`;
	}
});\`,
		},
	],
};

$APP.data.set(blogData);

$APP.models.set({
	files: {
		name: T.string({ index: true }),
		directory: T.string({ index: true }),
		path: T.string({
			index: true,
			virtual: "\${directory}/\${name}",
		}),
		isDirectory: T.boolean({ index: true }),
		mimeType: T.string({ defaultValue: "plain/text" }),
		content: T.string(),
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/project/models/migration.js":{content:`const newProjectTemplate = (name) => {
	const htmlContent = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${name}</title>
  <link rel="stylesheet" href="index.css">
</head>
<body>
  <h1>Welcome to \${name}!</h1>
  <p>Your new project is ready to go.</p>
  <script type="module" src="index.js"><\/script>
</body>
</html>\`;

	const jsContent = \`console.log("\u2728 Hello from \${name}!");console.trace();

// Your JavaScript code starts here.
\`;

	const cssContent = \`body {
  font-family: system-ui, -apple-system, sans-serif;
  display: grid;
  place-content: center;
  text-align: center;
  min-height: 100vh;
  margin: 0;
  background-color: #f0f2f5;
  color: #1c1e21;
}
\`;

	return [
		// The main project directory
		{ name, directory: "/projects", isDirectory: true },

		{
			name: "index.html",
			directory: \`/projects/\${name}\`,
			content: htmlContent,
			mimeType: "text/html",
		},

		{
			name: "index.js",
			directory: \`/projects/\${name}\`,
			content: jsContent,
			mimeType: "application/javascript",
		},

		{
			name: "index.css",
			directory: \`/projects/\${name}\`,
			content: cssContent,
			mimeType: "text/css",
		},
	];
};
export default ({ T, $APP }) => {
	$APP.data.set({
		boards: [
			{ name: "Backlog", description: "Development Tasks" },
			{ name: "Development", description: "Development Tasks" },
			{ name: "Finished", description: "Development Tasks" },
			{ name: "Cancelled", description: "Development Tasks" },
		],
		files: [
			{ name: "projects", directory: "", isDirectory: true },
			//...$APP.project.newProjectTemplate("untitled-1"),
		],
	});
	$APP.data.set({
		boards: [
			{ name: "Backlog", description: "Development Tasks" },
			{ name: "In Development", description: "Development Tasks" },
			{ name: "Finished", description: "Development Tasks" },
			{ name: "Cancelled", description: "Development Tasks" },
		],
		files: [
			{ name: "projects", directory: "", isDirectory: true },
			...newProjectTemplate("untitled-1"),
		],
	});
	$APP.models.set({
		users: {
			username: T.string({ primary: true }),
			email: T.string({ unique: true }),
			role: T.string({ defaultValue: "user", enum: ["admin", "user"] }),
		},
		boards: {
			name: T.string(),
			description: T.string(),
			tasks: T.many("tasks", "boardId"),
		},
		tasks: {
			title: T.string(),
			description: T.string({ input: "textarea" }),
			completed: T.boolean({ defaultValue: false }),
			dueDate: T.date(),
			priority: T.string({
				defaultValue: "medium",
				enum: ["low", "medium", "high"],
			}),
			boardId: T.belongs("boards", "tasks"),
			createdBy: T.belongs("users", "tasks"),
			assignedTo: T.belongs("users", "assignedTasks"),
			comments: T.array(),
		},
	});
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/chat/models/migration.js":{content:`import $APP from "/bootstrap.js";
import T from "/modules/types/index.js";

/**
 * Mock Backend Data Store
 *
 * This version restores the polymorphic parent relationship for conversations,
 * aligning with the original architecture.
 */
const chatData = {
	users: [
		{ id: "user-1", name: "You", avatar: "https://i.pravatar.cc/40?u=user-1" },
		{ id: "user-2", name: "Alex", avatar: "https://i.pravatar.cc/40?u=user-2" },
		{
			id: "user-3",
			name: "Jordan",
			avatar: "https://i.pravatar.cc/40?u=user-3",
		},
		{
			id: "bot-1",
			name: "Habit Coach",
			avatar: "https://i.pravatar.cc/40?u=bot-1",
			isBot: true,
		},
	],

	channels: [
		{
			id: "chan-1",
			name: "general",
			topic: "General chat about habits",
			participants: ["user-1", "user-2", "user-3"],
		},
		{
			id: "chan-2",
			name: "random",
			topic: "Anything else!",
			participants: ["user-1", "user-3"],
		},
	],

	// Conversations now link to a parent (either a channel or a user for DMs)
	conversations: [
		{
			id: "conv-1",
			type: "channel",
			parent: "channels@chan-1", // Belongs to the 'general' channel
		},
		{
			id: "conv-2",
			type: "channel",
			parent: "channels@chan-2", // Belongs to the 'random' channel
		},
		{
			id: "conv-3",
			type: "dm",
			parent: "users@user-2", // A DM with Alex
		},
		{
			id: "conv-4",
			type: "dm",
			parent: "users@bot-1", // A DM with the Habit Coach
		},
	],

	messages: [
		// Message in DM with Alex
		{
			id: "msg-1",
			conversation: "conv-3",
			sender: "user-2",
			role: "user",
			content: "Hey! How's the new habit tracker working out?",
			timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
		},
		{
			id: "msg-2",
			conversation: "conv-3",
			sender: "user-1",
			role: "user",
			content: "It's great! The AI integration is super helpful.",
			timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
		},
		// Message in DM with Habit Coach Bot
		{
			id: "msg-3",
			conversation: "conv-4",
			sender: "bot-1",
			role: "assistant",
			content:
				"Hello! I'm here to help you build better habits. What's on your mind?",
			timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
		},
		// Message in #general channel
		{
			id: "msg-4",
			conversation: "conv-1",
			sender: "user-3",
			role: "user",
			content: "Welcome to the general channel!",
			timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
		},
	],
};

// Initialize the mock data in the application
$APP.data.set(chatData);

/**
 * Model Definitions
 *
 * Restored polymorphic 'parent' relationship in the conversations model.
 */
$APP.models.set({
	users: {
		name: T.string(),
		avatar: T.string(),
		isBot: T.boolean(false),
		messages: T.many("messages", "sender"),
		// A user can be the parent of many DM conversations
		conversations: T.many("conversations", "parent", { polymorphic: true }),
		channels: T.many("channels", "users"),
	},

	channels: {
		name: T.string(),
		topic: T.string(),
		participants: T.belongs_many("users", "channels"),
		// A channel can be the parent of one conversation
		conversation: T.one("conversations", "parent", { polymorphic: true }),
	},

	conversations: {
		type: T.string({ options: ["channel", "dm"] }), // Kept for frontend convenience
		// This is the polymorphic relationship you requested
		parent: T.belongs("*", "conversations", { polymorphic: true }),
		messages: T.many("messages", "conversation"),
	},

	messages: {
		content: T.string(),
		timestamp: T.string(), // ISO string
		role: T.string({ options: ["user", "assistant"] }),
		toolCalls: T.object(null),
		sender: T.belongs("users", "messages"),
		conversation: T.belongs("conversations", "messages"),
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/bundler/models/migration.js":{content:`import $APP from "/bootstrap.js";
import T from "/modules/types/index.js";

$APP.data.set({
	credentials: [
		{
			id: "singleton",
			owner: "meiraleal",
			branch: "main",
			repo: "brazuka.dev",
			token: "",
		},
	],
});

$APP.models.set({
	credentials: {
		owner: T.string(),
		repo: T.string(),
		branch: T.string({ defaultValue: "main" }),
		token: T.string(),
	},
	releases: {
		version: T.string({
			index: true,
		}),
		notes: T.string(),
		status: T.string({
			enum: ["pending", "success", "failed"],
			defaultValue: "pending",
		}),
		deployedAt: T.string(),
		files: T.array(),
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/app/container.js":{content:`export default ({ routes, T }) => ({
	tag: "app-container",
	class: "flex flex-grow",
	extends: "router-ui",
	properties: {
		routes: T.object({ defaultValue: routes }),
		full: T.boolean(true),
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/theme.css":{content:`body {
	font-family: var(--font-family);
}

html,
body {
	font-family: var(--theme-font-family);
	background-color: var(--theme-background-color) !important;
	color: var(--text-color) !important;
	width: 100%;
	min-height: 100%;
	height: 100%;
	padding: 0;
	margin: 0;
}

body:not(.production) *:not(:defined) {
	border: 1px solid red;
}

.dark {
	filter: invert(1) hue-rotate(180deg);
}

.dark img,
.dark dialog,
.dark video,
.dark iframe {
	filter: invert(1) hue-rotate(180deg);
}

html {
	font-size: 14px;
}

@media (max-width: 768px) {
	html {
		font-size: 18px;
	}
}

@media (max-width: 480px) {
	html {
		font-size: 20px;
	}
}

textarea {
	font-family: inherit;
	font-feature-settings: inherit;
	font-variation-settings: inherit;
	font-size: 100%;
	font-weight: inherit;
	line-height: inherit;
	color: inherit;
	margin: 0;
	padding: 0;
}

:root {
	box-sizing: border-box;
	-moz-text-size-adjust: none;
	-webkit-text-size-adjust: none;
	text-size-adjust: none;
	line-height: 1.2;
	-webkit-font-smoothing: antialiased;
}
*,
*::before,
*::after {
	box-sizing: border-box;
}
* {
	margin: 0;
}
body {
	-webkit-font-smoothing: antialiased;
	font-family: var(--font-family);
}

button,
textarea,
select {
	background-color: inherit;
	border-width: 0;
	color: inherit;
}
img,
picture,
video,
canvas,
svg {
	display: block;
	max-width: 100%;
}
input,
button,
textarea,
select {
	font: inherit;
}
p,
h1,
h2,
h3,
h4,
h5,
h6 {
	font-family: var(--font-family);
	overflow-wrap: break-word;
}

dialog::backdrop {
	background-color: rgba(0, 0, 0, 0.8);
}

*::-webkit-scrollbar {
	width: 8px;
	margin-right: 10px;
}

*::-webkit-scrollbar-track {
	background: transparent;
}

*::-webkit-scrollbar-thumb {
	&:hover {
		scrollbar-color: rgba(154, 153, 150, 0.8) transparent;
	}
	border-radius: 10px;
	border: none;
}

*::-webkit-scrollbar-button {
	background: transparent;
	color: transparent;
}

* {
	scrollbar-width: thin;
	scrollbar-color: transparent transparent;
	&:hover {
		scrollbar-color: rgba(154, 153, 150, 0.8) transparent;
	}
}

[full] {
	width: 100%;
	height: 100vh;
}

[w-full] {
	width: 100%;
}

[grow] {
	flex-grow: 1;
}

[hide] {
	display: none !important;
}

.hide {
	display: none !important;
}

[noscroll] {
	overflow: hidden;
}

div [container] {
	display: flex;
}

div [container][horizontal] {
	display: flex;
	flex-direction: col;
}
`,mimeType:"text/css",skipSW:!1},"/modules/router/ui.js":{content:`export default ({ html, T }) => ({
	tag: "router-ui",

	properties: {
		currentRoute: T.object({
			sync: "ram",
		}),
	},

	renderRoute(route, params) {
		const component =
			typeof route.component === "function"
				? route.component(params)
				: route.component;
		return route.template
			? html.staticHTML\`<\${html.unsafeStatic(route.template)} .component=\${component}>
			</\${html.unsafeStatic(route.template)}>\`
			: component;
	},

	render() {
		const { route, params } = this.currentRoute || {};
		return route
			? this.renderRoute(
					typeof route === "function" ? { component: route } : route,
					params,
				)
			: html\`404: Page not found\`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/views/templates/app.js":{content:`export default ({ $APP, html, AI, T }) => {
	return {
		style: true,
		class: "w-full h-screen bg-[#282828] text-[#ebdbb2] flex font-sans text-sm",
		properties: {
			currentRoute: T.object({ sync: "ram" }),
			content: T.string(""),
			language: T.string({ sync: "local", defaultValue: "javascript" }),
			filePath: T.string({ sync: "local" }),
			selectedServer: T.string({ sync: "local", defaultValue: "default" }),
			availableServers: T.array(),
			isServerConnected: T.boolean({ sync: "local" }),
			transportType: T.string({ sync: "local", defaultValue: "JavaScript" }),
			command: T.string({ sync: "local" }),
			args: T.string({ sync: "local" }),
			history: T.array([]),
			selectedHistoryItem: T.object(null),
			activeView: T.string("ide"),
			isDirty: T.boolean(false),
			isSaving: T.boolean(false),
			lastSaved: T.object(null),
			compilerErrors: T.array([]),
			validationTimeout: T.object(null),
			tsLibCache: T.object({ defaultValue: {} }),
			worker: T.object(null),
			transpilePromises: T.object({ defaultValue: {} }),
		},
		async connected() {
			this.initializeWorker();
			await this.initializeAI();
			const initialPath = this.availableServers[0].path;
			await this.loadServerContent(initialPath);
		},
		disconnected() {
			if (this.validationTimeout) clearTimeout(this.validationTimeout);
			if (this.worker) this.worker.terminate();
		},

		async onServerChange(newServerKey) {
			if (this.isDirty) {
				console.warn(
					"Switching server templates with unsaved changes. The changes will be lost.",
				);
			}
			this.selectedServer = newServerKey;
			const newPath = this.availableServers[newServerKey].path;
			await this.loadServerContent(newPath);

			if (this.isServerConnected) {
				await this.disconnectFromServer();
			}
		},

		async loadServerContent(path) {
			this.filePath = path;
			this.command = path.replace(/\\.ts$/, ".js");
			try {
				const response = await fetch(path);
				const fileContent = await response.text();
				this.content = fileContent;
				this.isDirty = false;
				this.validateCode();
			} catch (error) {
				this.isDirty = true;
				this.content = \`// Failed to load file: \${path}\\n// You can start editing here to create it.\`;
				console.log(
					\`File \${path} couldn't be loaded, starting with placeholder content.\`,
					error,
				);
				this.validateCode();
			}
		},

		initializeWorker() {
			this.worker = new Worker("/modules/apps/mcp/worker.js", {
				type: "module",
			});
			this.worker.onmessage = (e) => {
				const { type, payload } = e.data;
				switch (type) {
					case "validationComplete":
						this.compilerErrors = payload.errors;
						break;
					case "transpileComplete": {
						const promise = this.transpilePromises[payload.requestId];
						if (promise) {
							promise.resolve(payload.transpiledCode);
							delete this.transpilePromises[payload.requestId];
						}
						break;
					}
				}
			};
			this.worker.onerror = (event) => {
				console.error("Error in worker:", event);
			};
			this.worker.postMessage({
				type: "init",
			});
		},

		validateCode() {
			if (!this.worker) {
				this.compilerErrors = [];
				return;
			}
			this.worker.postMessage({
				type: "validate",
				payload: { code: this.content, filePath: this.filePath },
			});
		},

		getTranspiledContent() {
			if (this.language !== "typescript") {
				return Promise.resolve(this.content);
			}
			return new Promise((resolve, reject) => {
				const requestId = \`req_\${Date.now()}_\${Math.random()}\`;
				this.transpilePromises[requestId] = { resolve, reject };
				this.worker.postMessage({
					type: "transpile",
					payload: { code: this.content, requestId },
				});
				setTimeout(() => {
					if (this.transpilePromises[requestId]) {
						reject(new Error("Transpilation timed out."));
						delete this.transpilePromises[requestId];
					}
				}, 10000);
			});
		},

		async applyCodeChanges() {
			if (!$APP.fs || !$APP.fs.writeFile) {
				console.warn("File system not available");
				return;
			}

			this.isSaving = true;
			try {
				await this.validateCode();
				if (this.compilerErrors.length > 0) {
					console.warn(
						"Applying changes with errors. The resulting code may not run correctly.",
					);
				}

				await $APP.fs.writeFile(this.filePath, this.content);

				if (this.language === "typescript") {
					const executableCode = await this.getTranspiledContent();
					const executablePath = this.filePath.replace(/\\.ts$/, ".js");
					await $APP.fs.writeFile(executablePath, executableCode);
					this.command = executablePath;
				} else {
					this.command = this.filePath;
				}

				this.lastSaved = new Date();
				this.isDirty = false;
			} catch (error) {
				console.error("Failed to apply code changes:", error);
			} finally {
				this.isSaving = false;
			}
		},

		onEditorUpdate(newContent) {
			this.content = newContent;
			this.isDirty = true;
			if (this.validationTimeout) clearTimeout(this.validationTimeout);
			this.validationTimeout = setTimeout(() => this.validateCode(), 500);
		},

		async handleReload() {
			if (this.isDirty) {
				await this.applyCodeChanges();
			}
			if (this.isServerConnected) {
				await this.reconnectToServer();
			}
		},

		async handleConnectionToggle() {
			if (this.isServerConnected) {
				await this.disconnectFromServer();
			} else {
				await this.applyCodeChanges();
				await this.connectToServer();
			}
		},

		toggleLanguage() {
			const newLang =
				this.language === "javascript" ? "typescript" : "javascript";
			const oldExt = this.language === "javascript" ? ".js" : ".ts";
			const newExt = newLang === "javascript" ? ".js" : ".ts";

			this.language = newLang;
			const newPath = this.filePath.replace(oldExt, newExt);

			this.loadServerContent(newPath);
		},

		async initializeAI() {
			try {
				if (!AI.isInitialized) {
					await AI.init({
						geminiApiKey: "",
						localAIEndpoint: "http://localhost:1234/v1/chat/completions",
						openrouterApiKey:
							"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",
						defaultRoots: [
							{
								uri: "file:///",
								name: "Root Filesystem",
								description: "Full filesystem access",
							},
						],
					});
				}
				this.isServerConnected = AI.listClients().length > 0;

				this.availableServers = AI.listServers();
			} catch (error) {
				console.error("Error initializing AI service:", error);
				this.isServerConnected = false;
			}
		},
		async connectToServer() {
			if (!this.command) {
				console.error("Connection command/URL cannot be empty.");
				return;
			}
			try {
				const transportConfig = {
					type: this.transportType,
					command: this.command,
					args: this.args ? this.args.split(" ") : [],
				};
				await AI.connect(transportConfig, { alias: "dev_server" });
				this.isServerConnected = true;
			} catch (e) {
				console.error("Failed to connect:", e);
				this.isServerConnected = false;
			}
		},
		async disconnectFromServer() {
			try {
				await AI.disconnect("dev_server");
				this.isServerConnected = false;
			} catch (e) {
				console.error("Failed to disconnect:", e);
			}
		},
		async reconnectToServer() {
			if (this.isServerConnected) {
				await this.disconnectFromServer();
				setTimeout(() => {
					this.connectToServer();
				}, 200);
			}
		},

		selectView(view) {
			this.activeView = view;
			this.clearSelectedHistory();
		},
		onSelectHistory(item) {
			this.selectedHistoryItem = item;
		},
		clearSelectedHistory() {
			this.selectedHistoryItem = null;
		},
		render() {
			const availableServersForSelect = this.availableServers.map(
				(val) =>
					!console.log({ val }) && {
						value: val.id,
						label: val.name,
					},
			);
			console.log({ availableServersForSelect });
			return html\`
				<mcp-sidebar
					.activeView=\${this.activeView}
					.onSelectView=\${this.selectView.bind(this)}
					.onSelectHistory=\${this.onSelectHistory.bind(this)}
				></mcp-sidebar>

				<div class="flex-1 h-full flex flex-col min-w-0">
					<div
						class="h-15 bg-[#3c3836] border-b border-[#504945] p-2 flex items-center justify-between"
					>
						<div class="flex items-center space-x-2">
							<uix-input
								ghost
								class="dark w-3xs"
								type="select"
								.options=\${availableServersForSelect}
								.value=\${this.selectedServer}
								@change=\${(e) => this.onServerChange(e.target.value)}
							></uix-input>
							<uix-button
								size="small"
								@click=\${this.toggleLanguage.bind(this)}
								class="w-28 dark"
								ghost
								label=\${
									this.language === "typescript" ? "TypeScript" : "JavaScript"
								}
							></uix-button>
						</div>
						<div class="flex items-center space-x-2 gap-2">
							\${
								this.isServerConnected && this.isDirty
									? html\`<uix-link
										@click=\${this.handleReload.bind(this)}
										class="dark"										
										size="small"
										label="Refresh"
										icon="refresh-cw"
								  ></uix-link>\`
									: ""
							}
							\${
								!this.isServerConnected
									? null
									: html\`<uix-button
								label="Disconnect"
								class="bg-red-700"								
								@click=\${this.handleConnectionToggle.bind(this)}
								size="small"
							></uix-button>\`
							}
						</div>
					</div>
					<div class="flex-1 overflow-auto flex">
            \${this.component}
					</div>
				</div>
			\`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/admin/views/template.js":{content:`export default ({ T, html, $APP }) => ({
	tag: "admin-template",

	properties: {
		component: T.object(),
		horizontal: T.boolean(true),
		full: T.boolean(true),
		currentRoute: T.object({ sync: "ram" }),
		class: T.string("flex"),
	},
	render() {
		const { modules } = $APP;
		const navbarItems = modules
			? Object.keys($APP.settings)
					.filter((ext) => $APP.settings[ext]?.appbar)
					.map((ext) => ({
						...$APP.settings[ext].appbar,
						label: ext,
						href: \`/admin/\${ext}\`,
					}))
					.map(
						(item) => html\`
              <uix-button
                label=\${item.label}
                href=\${item.href}
                icon=\${item.icon}
                hideLabel
                tooltip
                vertical
                selectable
                ghost
                iconSize="lg"
                class="w-full"
              ></uix-button>
            \`,
					)
			: [];

		return html\`
      <div class="flex flex-col flex-shrink-0 justify-between bg-gray-100">
        <uix-navbar class="w-full flex flex-col">\${navbarItems}</uix-navbar>
        <uix-navbar class="w-full flex flex-col">
          <uix-darkmode
              hideLabel               
              tooltip
              vertical
              ghost
              iconSize="lg"
              label="Dark Mode"
              class="w-full"></uix-darkmode>            
          <uix-button
          icon="settings"
          hideLabel
          tooltip
          vertical
          ghost
          iconSize="lg"
          label="Settings"
          class="w-full"></uix-button>
          </uix-navbar>
      </div>
      <div class="flex flex-1 h-full">
        \${this.component}
      </div>
    \`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/navigation/navbar.js":{content:`export default ({ T }) => ({
	tag: "uix-navbar",
	style: true,
	extends: "uix-list",
	properties: {
		join: T.boolean({ defaultValue: true }),
		docked: T.string(),
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/views/templates/app.css":{content:`.app-template {
	.uix-card {
		button {
			color: #111;
			cursor: pointer;
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/uix/utility/darkmode.js":{content:`export default ({ T }) => ({
	tag: "uix-darkmode",
	extends: "uix-button",
	icons: ["moon", "sun"],
	properties: {
		width: T.string({ defaultValue: "fit" }),
		darkmode: T.boolean({
			sync: "local",
			defaultValue: true,
		}),
	},

	click(e) {
		e.stopPropagation();
		this.darkmode = !this.darkmode;
		this.icon = this.darkmode ? "sun" : "moon";
	},
	willUpdate(changedProps) {
		console.log({ changedProps });
		if (Object.hasOwn(changedProps, "darkmode"))
			document.documentElement.classList.toggle("dark");
	},
	connected() {
		this.icon = this.darkmode ? "sun" : "moon";
		if (this.darkmode) document.documentElement.classList.add("dark");
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/bundler/views/ui.js":{content:`export default ({ T, html, $APP, Bundler }) => {
	$APP.define("credentials-manager", {
		class: "flex flex-col gap-4 p-4 border rounded-lg shadow-md bg-white",
		properties: {
			_row: T.object(), // Data binding to the 'credentials' model
		},
		render() {
			if (!this._row)
				return html\`<div class="text-center p-4">Loading credentials...</div>\`;

			return html\`
      <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">
        Deployment Credentials
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <uix-input
          label="Owner"
          .value=\${this._row.owner}
          @change=\${(e) => (this._row.owner = e.target.value)}
        ></uix-input>
        <uix-input
          label="Repository"
          .value=\${this._row.repo}
          @change=\${(e) => (this._row.repo = e.target.value)}
        ></uix-input>
        <uix-input
          label="Branch"
          .value=\${this._row.branch}
          @change=\${(e) => (this._row.branch = e.target.value)}
        ></uix-input>
        <uix-input
          label="GitHub Token"
          type="password"
          .value=\${this._row.token}
          @change=\${(e) => (this._row.token = e.target.value)}
        ></uix-input>
      </div>
      <div class="flex justify-end">
        <uix-button
          @click=\${() => !console.log(this._row) && $APP.Model.credentials.edit({ ...this._row })}
          label="Save Credentials"
        ></uix-button>
      </div>
    \`;
		},
	});

	$APP.define("release-creator", {
		class: "flex flex-col gap-4 p-4 border rounded-lg shadow-md bg-white",
		properties: {
			version: T.string(\`v\${new Date().toISOString().slice(0, 10)}\`),
			notes: T.string(""),
			deploymentType: T.string(null), // Can be 'spa', 'ssg', or null
		},
		async handleDeploy(type) {
			this.deploymentType = type;
			const credentials = await $APP.Model.credentials.get("singleton");
			if (!credentials || !credentials.token) {
				alert("Please provide a GitHub token before deploying.");
				this.deploymentType = null;
				return;
			}

			let newRelease;
			try {
				newRelease = await $APP.Model.releases.add({
					version: this.version,
					notes: this.notes,
					status: "pending",
					deployedAt: new Date(),
					deployType: type,
				});
				console.log({ Bundler });
				const files =
					type === "spa"
						? await Bundler.bundleSPA(credentials)
						: await Bundler.bundleSSG(credentials);

				await $APP.Model.releases.edit({
					...newRelease,
					status: "success",
					files,
				});

				alert(\`Deployment (\${type.toUpperCase()}) successful!\`);
			} catch (error) {
				console.error(\`Deployment failed for \${type.toUpperCase()}:\`, error);
				alert(\`Deployment failed: \${error.message}\`);
				if (newRelease?._id) {
					await $APP.Model.releases.edit({
						...newRelease,
						status: "failed",
					});
				}
			} finally {
				this.deploymentType = null;
			}
		},
		render() {
			return html\`
      <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">
        New Release
      </h2>
      <uix-input
        label="Version"
        .value=\${this.version}
        @change=\${(e) => (this.version = e.target.value)}
      ></uix-input>
      <uix-input
        type="textarea"
        label="Release Notes"
        .value=\${this.notes}
        @change=\${(e) => (this.notes = e.target.value)}
      ></uix-input>
      <div class="flex justify-end gap-2">
        <uix-button
          @click=\${() => this.handleDeploy("spa")}
          label=\${this.deploymentType === "spa" ? "Deploying..." : "Deploy SPA"}
          ?disabled=\${this.deploymentType !== null}
        ></uix-button>
        <uix-button
          @click=\${() => this.handleDeploy("ssg")}
          label=\${this.deploymentType === "ssg" ? "Deploying..." : "Deploy SSG"}
          ?disabled=\${this.deploymentType !== null}
        ></uix-button>
      </div>
    \`;
		},
	});

	/**
	 * A component to display the history of releases.
	 * It lists all past deployments with their version, status, and deployment date.
	 */
	$APP.define("release-history", {
		class: "flex flex-col gap-4 p-4 border rounded-lg shadow-md bg-white",
		properties: {
			_rows: T.array(), // Data binding to the 'releases' model
		},
		getStatusClass(status) {
			switch (status) {
				case "success":
					return "bg-green-100 text-green-800";
				case "failed":
					return "bg-red-100 text-red-800";
				default:
					return "bg-yellow-100 text-yellow-800";
			}
		},
		render() {
			return html\`
      <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">
        Release History
      </h2>
      <div class="flex flex-col gap-3">
        \${
					this._rows && this._rows.length > 0
						? this._rows
								.sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt))
								.map(
									(release) => html\`
                  <div
                    class="flex flex-col p-2 rounded-md \${this.getStatusClass(
											release.status,
										)}"
                  >
                    <div class="grid grid-cols-3 items-center gap-2">
                      <div class="font-semibold">\${release.version}</div>
                      <div class="flex items-center gap-2">
                        <span>\${release.status}</span>
                        \${
													release.deployType
														? html\`<span
                                    class="text-xs font-mono px-2 py-1 rounded bg-gray-200 text-gray-700"
                                    >\${release.deployType.toUpperCase()}</span
                                  >\`
														: ""
												}
                      </div>
                      <div class="text-sm text-right">
                        \${new Date(release.deployedAt).toLocaleString()}
                      </div>
                    </div>
                    \${
											release.notes
												? html\`<p class="text-sm text-gray-600 pt-2">
                                \${release.notes}
                              </p>\`
												: ""
										}
                  </div>
                \`,
								)
						: html\`<p class="text-center text-gray-500">
                    No releases yet.
                  </p>\`
				}
      </div>
    \`;
		},
	});

	// Add this new component to bundler-ui.js

	$APP.define("settings-editor", {
		class: "flex flex-col gap-4 p-4 border rounded-lg shadow-md bg-white",
		properties: {
			_settings: T.object(null), // Will hold the app settings
		},
		// Fetch settings when the component is added to the page
		connected() {
			this._settings = $APP.settings; // Assumes a function to get all current settings
		},
		async handleSave() {
			try {
				// The user provided \`$APP.settings.set()\` which we'll use here
				await $APP.settings.set(this._settings);
				alert("Settings saved successfully!");
			} catch (error) {
				console.error("Failed to save settings:", error);
				alert("Error saving settings. Check the console for details.");
			}
		},
		render() {
			if (!this._settings) {
				return html\`<div class="text-center p-4">Loading settings...</div>\`;
			}
			return html\`
            <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">
                App Settings
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <uix-input
                    label="App Name"
                    .value=\${this._settings.name}
                    @change=\${(e) => (this._settings.name = e.target.value)}
                ></uix-input>
                <uix-input
                    label="Short Name"
                    .value=\${this._settings.short_name}
                    @change=\${(e) => (this._settings.short_name = e.target.value)}
                ></uix-input>
                <uix-input
                    label="Start URL"
                    .value=\${this._settings.url}
                    @change=\${(e) => (this._settings.url = e.target.value)}
                ></uix-input>
                 <uix-input
                    label="Theme Color"
                    type="color" 
                    .value=\${this._settings.theme_color}
                    @change=\${(e) => (this._settings.theme_color = e.target.value)}
                ></uix-input>
                <uix-input
                    class="md:col-span-2"
                    label="Open Graph Image URL"
                    .value=\${this._settings.og_image}
                    @change=\${(e) => (this._settings.og_image = e.target.value)}
                ></uix-input>
                <uix-input
                    class="md:col-span-2"
                    type="textarea"
                    label="Description"
                    .value=\${this._settings.description}
                    @change=\${(e) => (this._settings.description = e.target.value)}
                ></uix-input>
            </div>
            <div class="flex justify-end">
                <uix-button
                    @click=\${this.handleSave.bind(this)}
                    label="Save Settings"
                ></uix-button>
            </div>
        \`;
		},
	});

	return {
		tag: "bundler-ui",
		class: "flex flex-col gap-6 p-6 bg-gray-50 min-h-screen",
		render() {
			return html\`
            <h1 class="text-4xl font-extrabold text-gray-900">Release Manager</h1>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="flex flex-col gap-6">
                    <settings-editor></settings-editor> 
                    <credentials-manager
                        ._data=\${{ model: "credentials", id: "singleton" }}
                    ></credentials-manager>
                    <release-creator></release-creator>
                </div>
                <release-history
                    ._data=\${{ model: "releases", order: "-deployedAt" }}
                ></release-history>
            </div>
        \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/button.js":{content:`export default ({ T }) => ({
	tag: "uix-button",
	properties: { variant: T.string("default") },
	extends: "uix-link",
	style: true,
	setVariant() {
		const { variant } = this;
		this.style.setProperty(
			"--_variant-color-50",
			\`var(--colors-\${variant}-50)\`,
		);
		this.style.setProperty(
			"--_variant-color-300",
			\`var(--colors-\${variant}-300)\`,
		);
		this.style.setProperty(
			"--_variant-color-400",
			\`var(--colors-\${variant}-400)\`,
		);
		this.style.setProperty(
			"--_variant-color-500",
			\`var(--colors-\${variant}-500)\`,
		);
		this.style.setProperty(
			"--_variant-color-600",
			\`var(--colors-\${variant}-600)\`,
		);
		this.style.setProperty(
			"--_variant-color-700",
			\`var(--colors-\${variant}-700)\`,
		);
		this.style.setProperty(
			"--_variant-color-800",
			\`var(--colors-\${variant}-800)\`,
		);
	},
	connected() {
		this.setVariant();
	},
	willUpdate(changedProps) {
		if (Object.keys(changedProps).includes("variant")) {
			this.setVariant();
		}
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/worker.js":{content:`let ts;
let tsLibCache = {};
async function loadCjsModule(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(\`HTTP error! status: \${response.status}\`);
		}
		const scriptText = await response.text();

		// Prepare a fake CJS environment
		const module = { exports: {} };
		const exports = module.exports;

		// Wrap the script text in a function and execute it
		const scriptFunc = new Function("module", "exports", scriptText);
		scriptFunc(module, exports);

		// If the module uses \`module.exports = ...\`, it will be on module.exports.
		// If it just uses \`exports.foo = ...\`, it will be on exports.
		// We check \`module.exports\` first.
		const exportedModule = module.exports;

		// Sometimes the main export isn't \`default\`, we check if the object is empty.
		if (Object.keys(exportedModule).length === 0) {
			return exports;
		}

		return exportedModule;
	} catch (error) {
		console.error(\`Failed to load module from \${url}:\`, error);
		throw error;
	}
}

const loadTypeScript = async () => {
	if (ts) return;
	try {
		const tsModule = await loadCjsModule(
			"https://unpkg.com/typescript@latest/lib/typescript.js",
		);
		ts = tsModule;
		self.ts = ts;
		console.log({ ts }, self.ts);
	} catch (error) {
		console.error("Failed to load TypeScript:", error);
	}
};

const loadTypeScriptLibs = async () => {
	if (Object.keys(tsLibCache).length > 0) return;
	const libsToFetch = [
		"lib.es2020.d.ts",
		"lib.es2018.d.ts",
		"lib.es2019.d.ts",
		"lib.es2019.string.d.ts",
		"lib.es2019.array.d.ts",
		"lib.es2019.object.d.ts",
		"lib.es2020.bigint.d.ts",
		"lib.es2020.date.d.ts",
		"lib.es2020.number.d.ts",
		"lib.es2020.promise.d.ts",
		"lib.es2020.sharedmemory.d.ts",
		"lib.es2020.string.d.ts",
		"lib.es2020.symbol.wellknown.d.ts",
		"lib.es2015.symbol.d.ts",
		"lib.es2019.symbol.d.ts",
		"lib.es2019.intl.d.ts",
		"lib.es2015.iterable.d.ts",
		"lib.es2018.intl.d.ts",
		"lib.es2020.intl.d.ts",
		"lib.es5.d.ts",
		"lib.dom.d.ts",
		"lib.es2017.d.ts",
		"lib.es2018.asynciterable.d.ts",
		"lib.es2018.asyncgenerator.d.ts",
		"lib.es2018.promise.d.ts",
		"lib.es2018.regexp.d.ts",
		"lib.es2016.d.ts",
		"lib.es2017.arraybuffer.d.ts",
		"lib.es2017.date.d.ts",
		"lib.es2017.intl.d.ts",
		"lib.es2017.object.d.ts",
		"lib.es2017.sharedmemory.d.ts",
		"lib.es2017.string.d.ts",
		"lib.es2017.typedarrays.d.ts",
		"lib.es2015.d.ts",
		"lib.es2016.array.include.d.ts",
		"lib.es2016.intl.d.ts",
		"lib.es2015.symbol.wellknown.d.ts",
		"lib.es2015.core.d.ts",
		"lib.es2015.collection.d.ts",
		"lib.es2015.generator.d.ts",
		"lib.es2015.promise.d.ts",
		"lib.es2015.proxy.d.ts",
		"lib.es2015.reflect.d.ts",
		"lib.decorators.d.ts",
		"lib.decorators.legacy.d.ts",
	];

	try {
		const promises = libsToFetch.map((lib) =>
			fetch(\`https://unpkg.com/typescript@latest/lib/\${lib}\`).then((res) => {
				if (!res.ok) throw new Error(\`Failed to fetch \${lib}\`);
				return res.text();
			}),
		);
		const contents = await Promise.all(promises);
		const newCache = {};
		libsToFetch.forEach((lib, index) => {
			newCache[lib] = contents[index];
		});

		return newCache;
	} catch (e) {
		console.error(
			"Could not fetch TypeScript library definitions. Type checking will be less accurate.",
			e,
		);
	}
};

self.onmessage = async (e) => {
	const { type, payload } = e.data;
	switch (type) {
		case "init":
			await loadTypeScript();
			tsLibCache = await loadTypeScriptLibs();
			break;
		case "validate": {
			if (!ts) return;
			const validationErrors = validate(payload.code, payload.filePath);
			self.postMessage({
				type: "validationComplete",
				payload: { errors: validationErrors },
			});
			break;
		}
		case "transpile": {
			if (!ts) {
				// Fallback if TS isn't loaded yet
				self.postMessage({
					type: "transpileComplete",
					payload: {
						transpiledCode: payload.code,
						requestId: payload.requestId,
					},
				});
				return;
			}
			const transpiledResult = transpile(payload.code);
			self.postMessage({
				type: "transpileComplete",
				payload: {
					transpiledCode: transpiledResult,
					requestId: payload.requestId,
				},
			});
			break;
		}
	}
};

const validate = (code, filePath) => {
	try {
		const defaultLibFileName = "lib.es2020.d.ts";
		const compilerOptions = {
			target: ts.ScriptTarget.ES2020,
			module: ts.ModuleKind.CommonJS,
			allowJs: true,
			esModuleInterop: true,
			noEmit: true,
		};

		const host = {
			getSourceFile: (fileName, languageVersion) => {
				const sourceText =
					tsLibCache[fileName] || (fileName === filePath ? code : undefined);
				return sourceText !== undefined
					? ts.createSourceFile(fileName, sourceText, languageVersion)
					: undefined;
			},
			writeFile: () => {},
			getDefaultLibFileName: () => defaultLibFileName,
			useCaseSensitiveFileNames: () => false,
			getCanonicalFileName: (fileName) => fileName,
			getCurrentDirectory: () => "/",
			getNewLine: () => "\\n",
			fileExists: (fileName) => fileName === filePath || !!tsLibCache[fileName],
			readFile: (fileName) =>
				fileName === filePath ? code : tsLibCache[fileName],
		};

		const program = ts.createProgram([filePath], compilerOptions, host);
		const diagnostics = ts.getPreEmitDiagnostics(program);

		return diagnostics.map((diagnostic) => {
			const message = ts.flattenDiagnosticMessageText(
				diagnostic.messageText,
				"\\n",
			);
			if (diagnostic.file && diagnostic.start) {
				const { line, character } = ts.getLineAndCharacterOfPosition(
					diagnostic.file,
					diagnostic.start,
				);
				return { line: line + 1, character: character + 1, message };
			}
			return { line: 0, character: 0, message };
		});
	} catch (error) {
		console.error("Error during code validation in worker:", error);
		return [
			{
				line: 0,
				character: 0,
				message: "An unexpected error occurred during validation.",
			},
		];
	}
};

const transpile = (code) => {
	try {
		const jsResult = ts.transpileModule(code, {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2020,
			},
		});
		return jsResult.outputText;
	} catch (error) {
		console.error("TypeScript compilation failed in worker:", error);
		return code;
	}
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/sidebar.js":{content:`export default ({ html, T }) => ({
	class:
		"w-64 bg-[#3c3836] text-[#ebdbb2] flex flex-col h-screen shrink-0 border-r border-[#504945]",
	properties: {
		activeView: T.string("dashboard"),
		onSelectView: T.function(),
		currentRoute: T.object({ sync: "ram" }),
		onSelectHistory: T.function(),
		isDarkMode: T.boolean({ defaultValue: true, sync: "local" }),
	},

	_renderLink(link) {
		const isActive = this.currentRoute.name === link.key;
		return html\`
            <uix-link href=\${link.key}
          icon=\${link.icon}
          label=\${link.label}
          data-active=\${isActive}
          class="
            relative flex items-center text-sm font-bold p-2 rounded-md transition-colors w-full
            text-[#ebdbb2] hover:bg-[#504945]
            data-[active=true]:bg-[#504945] data-[active=true]:text-white
          ">
                \${
									link.isComingSoon
										? html\`<span class="ml-auto bg-[#b16286] text-xs font-bold text-[#ebdbb2] px-2 py-0.5 rounded-full absolute right-3">soon</span>\`
										: ""
								}
            </uix-link>
        \`;
	},
	toggleDarkMode() {
		document.body.classList.toggle("dark", this.isDarkMode);
		this.isDarkMode = !this.isDarkMode;
	},

	render() {
		const mainLinks = [
			{ key: "dev", label: "Develop", icon: "code" },
			{ key: "chat", label: "Chat", icon: "message-circle" },
			{ key: "inspector", label: "Inspector", icon: "search" },
			{ key: "servers", label: "Servers", icon: "server" },
			{ key: "agents", label: "Agents", icon: "bot", isComingSoon: true },
			{ key: "apps", label: "Apps", icon: "layout-grid", isComingSoon: true },
			{ key: "learn", label: "Learn", icon: "book", isComingSoon: true },
			{
				key: "vibecoding",
				label: "Vibecoding",
				icon: "zap",
				isComingSoon: true,
			},
		];

		return html\`<div class="h-15 p-4 border-b border-[#504945] flex items-center space-x-2 shrink-0">
            <h2 class="text-xl font-semibold text-[#ebdbb2]">\u{1F336}\uFE0F MCPiQuant</h2>
        </div>
        <div class="flex-grow flex flex-col min-h-0">
            <nav class="p-2 space-y-1 shrink-0">
                \${mainLinks.map((link) => this._renderLink(link))}
            </nav>
            <div class="flex-grow flex flex-col border-t border-[#504945] min-h-0">
                <h3 class="p-2 text-xs font-semibold text-[#928374] uppercase tracking-wider shrink-0">History</h3>
                <div class="flex-1 overflow-y-auto">
                    <mcp-history .onSelect=\${this.onSelectHistory} listOnly></mcp-history>
                </div>
            </div>
            <div class="p-2 border-t border-[#504945] shrink-0">
                \${this._renderLink({
									key: "settings",
									label: "Settings",
									icon: "settings",
								})}
                \${this._renderLink({
									key: "feedback",
									label: "Feedback",
									icon: "message-square-heart",
								})}
                <button @click=\${this.toggleDarkMode.bind(this)} class="w-full flex items-center p-2 rounded-md hover:bg-[#504945] text-left text-sm">
                    <uix-icon name=\${
											this.isDarkMode ? "sun" : "moon"
										} class="w-5 h-5 mr-3 shrink-0"></uix-icon>
                    <span>\${this.isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                    <div class="ml-auto w-10 h-5 \${
											this.isDarkMode ? "bg-red-700" : "bg-gray-600"
										} rounded-full flex items-center p-1 transition-colors">
                        <div class="w-4 h-4 bg-white rounded-full transform transition-transform \${
													this.isDarkMode ? "translate-x-4" : ""
												}"></div>
                    </div>
                </button>
            </div>
        </div>
      \`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/layout/list.js":{content:`export default ({ T }) => ({
	tag: "uix-list",
	style: true,
	properties: {
		multiple: T.boolean(),
		multipleWithCtrl: T.boolean(),
		multipleWithShift: T.boolean(),
		lastSelectedIndex: T.number(),
		selectedIds: T.array(),
		onSelectedChanged: T.function(),
		gap: T.string({ defaultValue: "md" }),
		itemId: T.string(".uix-link"),
		selectable: T.boolean(),
	},
	connected() {
		if (this.selectable)
			this.addEventListener("click", this.handleClick.bind(this));
	},
	disconnected() {
		if (this.selectable)
			this.removeEventListener("click", this.handleClick.bind(this));
	},
	handleClick: function (e) {
		const link = e.target.closest(".uix-link");
		if (!link || !this.contains(link)) return;
		e.preventDefault();
		const links = Array.from(this.qa(".uix-link"));
		const index = links.indexOf(link);
		if (index === -1) return;
		if (
			this.multipleWithShift &&
			e.shiftKey &&
			this.lastSelectedIndex !== null
		) {
			const start = Math.min(this.lastSelectedIndex, index);
			const end = Math.max(this.lastSelectedIndex, index);
			links
				.slice(start, end + 1)
				.forEach((el) => el.setAttribute("selected", ""));
			this.lastSelectedIndex = index;
			this.updateSelectedIds();
			return;
		}
		if (this.multipleWithCtrl) {
			if (e.ctrlKey) {
				link.hasAttribute("selected")
					? link.removeAttribute("selected")
					: link.setAttribute("selected", "");
				this.lastSelectedIndex = index;
				this.updateSelectedIds();
				return;
			}
			links.forEach((el) => el.removeAttribute("selected"));
			if (link.hasAttribute("selected")) {
				link.removeAttribute("selected");
				this.lastSelectedIndex = null;
			} else {
				link.setAttribute("selected", "");
				this.lastSelectedIndex = index;
			}
			this.updateSelectedIds();
			return;
		}

		if (this.multiple) {
			link.hasAttribute("selected")
				? link.removeAttribute("selected")
				: link.setAttribute("selected", "");
			this.lastSelectedIndex = index;
			this.updateSelectedIds();
			return;
		}

		if (link.hasAttribute("selected")) {
			links.forEach((el) => el.removeAttribute("selected"));
			this.lastSelectedIndex = null;
		} else {
			links.forEach((el) => el.removeAttribute("selected"));
			link.setAttribute("selected", "");
			this.lastSelectedIndex = index;
		}
		this.updateSelectedIds();
	},
	updateSelectedIds() {
		const links = Array.from(this.qa(this.itemId));
		this.selectedIds = links.reduce((ids, el, index) => {
			if (el.hasAttribute("selected")) ids.push(index);
			return ids;
		}, []);
		if (this.onSelectedChanged) this.onSelectedChanged(this.selectedIds);
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/form/input.js":{content:`import { ifDefined } from "/modules/mvc/view/html/directive.js";

const inputTypes = { string: "text" };
let uniqueIdCounter = 0;

export default ({ T, html }) => ({
	tag: "uix-input",
	style: true,
	properties: {
		bind: T.object({ attribute: false }),
		autofocus: T.boolean(),
		value: T.string(),
		placeholder: T.string(),
		name: T.string(),
		label: T.string(),
		disabled: T.boolean(),
		required: T.boolean(),
		type: T.string({
			defaultValue: "text",
			enum: [
				"text",
				"textarea",
				"select",
				"password",
				"email",
				"number",
				"decimal",
				"search",
				"tel",
				"url",
				"checkbox",
				"radio",
			],
		}),
		options: T.array({ defaultValue: [] }),
		checked: T.boolean(),
		selected: T.boolean(),
		regex: T.string(),
		maxLength: T.string(),
		rows: T.number({ defaultValue: 4 }),
		keydown: T.function(),
		input: T.function(),
		icon: T.string(),
	},
	formAssociated: true,
	formResetCallback() {
		const $input = this.getInput();
		if (!$input) return;
		if (!["submit", "button", "reset"].includes($input.type))
			$input.value = this._defaultValue || "";
		if (["radio", "checkbox", "switch"].includes($input.type))
			$input.checked = this._defaultValue || false;
		this.value = this.isCheckable ? $input.checked : $input.value;
		this._updateHasValue();
	},
	formDisabledCallback(disabled) {
		const $input = this.getInput();
		if ($input) $input.disabled = disabled;
	},
	formStateRestoreCallback(state) {
		const $input = this.getInput();
		if ($input) $input.value = state;
		this.value = state;
		this._updateHasValue();
	},
	reportValidity() {
		const $input = this.getInput();
		if (!$input) return true;
		const validity = $input.reportValidity() !== false;
		$input?.classList.toggle("input-error", !validity);
		return validity;
	},
	getInput() {
		if (!this.$input) {
			this.$input = this.querySelector("input, select, textarea");
			if (this.$input) {
				this._internals.setValidity(
					this.$input.validity,
					this.$input.validationMessage,
					this.$input,
				);
			}
		}
		return this.$input;
	},
	connected() {
		this._internals = this.attachInternals();
		this.fieldId = \`uix-input-\${++uniqueIdCounter}\`;
		this.isCheckable = this.type === "checkbox" || this.type === "radio";

		if (!this.name) {
			this.name = this.label
				? \`uix-input-\${this.label.toLowerCase().replace(/\\s+/g, "-")}\`
				: this.fieldId;
		}
		this.placeholder = this.placeholder || " ";
		if (this.bind) {
			this.value = this.bind.value;
			if (this.bind.instance) {
				this.bind.instance.on(\`\${this.bind.prop}Changed\`, ({ value }) => {
					this.setValue(value);
				});
			}
		}
		this._updateHasValue();
	},
	_updateHasValue() {
		if (this.isCheckable) {
			this.classList.remove("has-value");
			return;
		}
		const hasValue =
			this.value !== null && this.value !== undefined && this.value !== "";
		this.classList.toggle("has-value", hasValue);
	},
	_onInput(event) {
		const { target } = event;
		const newValue = this.isCheckable ? target.checked : target.value;

		if (this.value !== newValue) {
			this.value = newValue;
			this._updateHasValue();
			if (this.bind) this.bind.setValue(this.value);
			if (this.input) this.input(event);
		}
	},
	inputValue() {
		const el = this.getInput();
		return el ? (this.isCheckable ? el.checked : el.value) : undefined;
	},
	setValue(value) {
		const el = this.getInput();
		if (el) {
			if (this.isCheckable) el.checked = !!value;
			else el.value = value;
		}
		if (this.bind) this.bind.value = value;
		this.value = value;
		this._updateHasValue();
		this.requestUpdate();
	},
	resetValue() {
		const el = this.getInput();
		if (el) {
			if (this.isCheckable) el.checked = false;
			else el.value = "";
		}
		this.value = this.isCheckable ? false : "";
		if (this.bind) this.bind.value = this.value;
		this._updateHasValue();
		this.requestUpdate();
	},
	render() {
		const {
			fieldId,
			name,
			type,
			label,
			value = "",
			placeholder,
			rows,
			regex,
			autofocus,
			required,
			disabled,
			maxLength,
			keydown,
			icon,
			options,
		} = this;
		let fieldTemplate;
		switch (type) {
			case "textarea":
				fieldTemplate = html\`
                    <textarea
                        id=\${fieldId}
                        name=\${name}
                        placeholder=\${ifDefined(placeholder)}
                        ?autofocus=\${autofocus}
                        ?disabled=\${disabled}
                        ?required=\${required}
                        maxLength=\${ifDefined(maxLength)}
                        @input=\${this._onInput.bind(this)}
                        @keydown=\${ifDefined(keydown)}
                        rows=\${rows}
                    >\${value}</textarea>\`;
				break;

			case "select":
				fieldTemplate = html\`
									<div class="select-container">
											<select
												id=\${fieldId}
												name=\${name}
												value=\${value}
												?disabled=\${disabled}
												?required=\${required}
												?autofocus=\${autofocus}
												@change=\${this._onInput.bind(this)}>
													\${placeholder && !value ? html\`<option value="" disabled selected hidden>\${placeholder}</option>\` : ""}
													\${options.map(
														(option) => html\`
															<option value=\${option.value ?? option} ?selected=\${(option.value ?? option) === this.value}>
																	\${option.label ?? option}
															</option>
													\`,
													)}
											</select>
											<uix-icon name="chevron-down" class="select-arrow"></uix-icon>
										</div>
										\`;
				break;

			default:
				fieldTemplate = html\`
                    <input
                        id=\${fieldId}
                        name=\${name}
                        type=\${inputTypes[type] || type}
                        .value=\${value}
                        placeholder=\${ifDefined(placeholder)}
                        ?autofocus=\${autofocus}
                        maxLength=\${ifDefined(maxLength)}
                        @input=\${this._onInput.bind(this)}
                        @keydown=\${ifDefined(keydown)}
                        ?disabled=\${disabled}
                        ?required=\${required}
                        pattern=\${ifDefined(regex)}
                        ?checked=\${this.isCheckable && !!this.value}
                    />\`;
				break;
		}

		return html\`
            \${label ? html\`<label for=\${fieldId} ?required=\${required}>\${label}</label>\` : ""}
            \${fieldTemplate}
            \${icon ? html\`<uix-icon name=\${icon} class="input-icon"></uix-icon>\` : ""}
        \`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/servers.js":{content:`export default ({ html, AI, T }) => {
	const starIcon = (isFilled = false) => html\`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="\${isFilled ? "#fabd2f" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${isFilled ? "text-[#fabd2f]" : "text-[#a89984]"}">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    \`;

	return {
		tag: "mcp-servers",
		class:
			"w-full h-full bg-[#282828] text-[#ebdbb2] flex flex-col p-6 md:p-8 font-sans text-sm overflow-y-auto",
		properties: {
			searchQuery: T.string(""),
		},
		availableServers: [],
		favoriteServerIds: [],
		connectedServerId: null,

		connected() {
			this.availableServers = AI.listServers();
			this.availableServers.map((server) =>
				$APP.SW.request("SW:CACHE_FILE", {
					path: server.path,
					skipSW: true,
				}),
			);
			this.favoriteServerIds = AI.getFavorites();
			this.updateConnectionStatus();
			this._updateFavorites = this.updateFavorites.bind(this);
			this._updateConnectionStatus = this.updateConnectionStatus.bind(this);
			AI.events.on("servers:favoritesChanged", this._updateFavorites);
			AI.events.on("connect", this._updateConnectionStatus);
			AI.events.on("disconnect", this._updateConnectionStatus);
			this.update();
		},

		disconnected() {
			AI.events.off("servers:favoritesChanged", this._updateFavorites);
			AI.events.off("connect", this._updateConnectionStatus);
			AI.events.off("disconnect", this._updateConnectionStatus);
		},
		updateFavorites(newFavoriteIds) {
			this.favoriteServerIds = newFavoriteIds;
			this.update();
		},

		updateConnectionStatus() {
			const clients = AI.listClients();
			const devClient = clients.find((c) => c.alias === "dev_server");
			let newConnectedServerId = null;
			if (devClient && this.availableServers) {
				const connectedServer = this.availableServers.find(
					(s) => s.path === devClient.command,
				);
				if (connectedServer) newConnectedServerId = connectedServer.id;
			}
			if (this.connectedServerId !== newConnectedServerId) {
				this.connectedServerId = newConnectedServerId;
				this.update();
			}
		},
		async connectToServer(server) {
			try {
				if (this.connectedServerId) {
					await this.disconnectFromServer();
				}
				const transportConfig = {
					type: "JavaScript",
					command: server.path,
					args: [],
				};
				await AI.connect(transportConfig, { alias: "dev_server" });
			} catch (e) {
				console.error(\`Failed to connect to \${server.name}:\`, e);
			}
		},
		async disconnectFromServer() {
			try {
				await AI.disconnect("dev_server");
			} catch (e) {
				console.error("Failed to disconnect from server:", e);
			}
		},

		toggleFavorite(server) {
			AI.toggleFavorite(server.id);
		},

		// --- Render Methods ---
		renderServerCard(server) {
			const isConnected = this.connectedServerId === server.id;
			const isFavorited = this.favoriteServerIds.includes(server.id);

			return html\`
                <div class="bg-[#3c3836] border-2 border-[#504945] rounded-lg p-4 flex flex-col gap-4 font-semibold transition-all duration-200 shadow-[4px_4px_0px_#1d2021] hover:shadow-[6px_6px_0px_#83a598] hover:border-[#83a598]">
                    <div class="flex justify-between items-start">
                         <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-md flex-shrink-0 flex items-center justify-center bg-[#282828] text-[#83a598]">
                               \${html.unsafeHTML(server.icon)}
                            </div>
                            <div>
                                <h3 class="font-bold text-md text-[#ebdbb2]">\${server.name}</h3>
                                \${isConnected ? html\`<span class="text-xs text-[#b8bb26] font-medium">Currently connected</span>\` : ""}
                            </div>
                        </div>
                        <button @click=\${() => this.toggleFavorite(server)} class="p-1 rounded-full hover:bg-[#504945] transition-colors">
                            \${starIcon(isFavorited)}
                        </button>
                    </div>

                    <!-- Middle Section: Description -->
                    <p class="text-sm text-[#bdae93] font-medium min-h-[2.5rem]">\${server.description}</p>
                    
                    <!-- Bottom Section: Tags and Connect Button -->
                     <div class="flex flex-wrap items-center justify-between gap-2 pt-4 border-t-2 border-dashed border-[#504945]">
                        <div class="flex flex-wrap gap-2">
                            \${server.tags.map((tag) => html\`<span class="text-xs font-bold px-2 py-1 rounded bg-[#504945] text-[#ebdbb2]">\${tag.toUpperCase()}</span>\`)}
                        </div>
                        \${
													isConnected
														? html\`<uix-button label="Disconnect" @click=\${() => this.disconnectFromServer()} class="bg-[#fb4934] text-[#ebdbb2] font-bold" size="small"></uix-button>\`
														: html\`<uix-button label="Connect" @click=\${() => this.connectToServer(server)} class="bg-[#458588] text-[#ebdbb2] font-bold" size="small"></uix-button>\`
												}
                    </div>
                </div>
            \`;
		},

		render() {
			const lowerCaseQuery = this.searchQuery.toLowerCase();
			const filteredServers = this.searchQuery
				? this.availableServers.filter(
						(s) =>
							s.name.toLowerCase().includes(lowerCaseQuery) ||
							s.description.toLowerCase().includes(lowerCaseQuery) ||
							s.tags.some((t) => t.toLowerCase().includes(lowerCaseQuery)),
					)
				: this.availableServers;

			const favoriteServers = filteredServers.filter((s) =>
				this.favoriteServerIds.includes(s.id),
			);
			const otherServers = filteredServers.filter(
				(s) => !this.favoriteServerIds.includes(s.id),
			);

			return html\`
                <div class="w-full h-full flex flex-col space-y-6">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 class="font-bold text-3xl text-[#ebdbb2]">Servers</h1>
                            <p class="text-[#bdae93]">Browse and connect to your available MCP test servers.</p>
                        </div>
                        <div class="relative">
                            <input
                                type="text"
                                .value=\${this.searchQuery}
                                @input=\${(e) => (this.searchQuery = e.target.value)}
                                placeholder="Search servers..."
                                class="w-full md:w-64 bg-[#504945] border-2 border-[#665c54] font-semibold text-[#ebdbb2] rounded-lg py-2 px-4 focus:outline-none focus:shadow-[2px_2px_0px_#1d2021] focus:border-[#83a598] transition"
                            />
                        </div>
                    </div>
                    \${
											favoriteServers.length > 0
												? html\`
                        <div>
                            <h2 class="font-semibold text-xl text-[#ebdbb2] mb-4 flex items-center gap-2">
                                <uix-icon name="star" class="w-5 h-5 text-[#fabd2f]"></uix-icon>
                                Favorites
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                \${favoriteServers.map((server) => this.renderServerCard(server))}
                            </div>
                        </div>
                    \`
												: ""
										}
                    <div>
                         <h2 class="font-semibold text-xl text-[#ebdbb2] mb-4">\${favoriteServers.length > 0 ? "Available Servers" : ""}</h2>
                         \${
														otherServers.length > 0
															? html\`
                                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    \${otherServers.map((server) => this.renderServerCard(server))}
                                </div>\`
															: html\`
                                <div class="text-center text-[#928374] p-8 bg-[#3c3836] border-2 border-[#504945] rounded-lg shadow-[4px_4px_0px_#1d2021]">
                                    <h3 class="font-bold text-lg text-[#ebdbb2]">No Servers Found</h3>
                                    \${this.searchQuery ? html\`<p>Your search for "\${this.searchQuery}" did not match any servers.</p>\` : ""}
                                </div>
                            \`
													}
                    </div>
                </div>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/link.js":{content:`export default ({ T, html, Router }) => ({
	tag: "uix-link",
	style: true,
	properties: {
		content: T.object(),
		context: T.object(),
		external: T.boolean(),
		selectable: T.boolean(),
		skipRoute: T.boolean(),
		hideLabel: T.boolean(),
		accordion: T.boolean(),
		float: T.object(),
		tab: T.boolean(),
		tooltip: T.boolean(),
		dropdown: T.boolean(),
		direction: T.string(),
		name: T.string(),
		alt: T.string(),
		label: T.string(),
		type: T.string(),
		href: T.string(),
		related: T.string(),
		icon: T.string(),
		active: T.boolean(),
		reverse: T.boolean(),
		vertical: T.boolean(),
		selected: T.boolean(),
		floatOpen: T.boolean(),
		click: T.function(),
		confirmation: T.string(),
	},

	connected() {
		this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
		this.boundHandleEscKey = this.handleEscKey.bind(this);

		if (this.context) {
			this.addEventListener("contextmenu", this.handleContextMenu);
		}
	},

	disconnected() {
		// --- REFACTOR: Clean up all listeners on disconnect.
		this.removeEventListener("contextmenu", this.handleContextMenu);
		this._removeGlobalListeners();
	},

	// --- NEW: Helper method to add global listeners.
	_addGlobalListeners() {
		// Use a slight delay to prevent the same click that opened the popup from closing it.
		setTimeout(() => {
			document.addEventListener("click", this.boundHandleOutsideClick);
			document.addEventListener("keydown", this.boundHandleEscKey);
		}, 0);
	},

	// --- NEW: Helper method to remove global listeners.
	_removeGlobalListeners() {
		document.removeEventListener("click", this.boundHandleOutsideClick);
		document.removeEventListener("keydown", this.boundHandleEscKey);
	},

	// --- NEW: A single method to close all popups and clean up listeners.
	closeAllPopups() {
		let wasOpen = false;
		if (this.hasAttribute("selected")) {
			this.removeAttribute("selected");
			wasOpen = true;
		}
		const contextContainer = this.q("[context]");
		if (contextContainer?.hasAttribute("open")) {
			contextContainer.removeAttribute("open");
			wasOpen = true;
		}
		if (this.hasAttribute("floatOpen")) {
			this.removeAttribute("floatOpen");
			wasOpen = true;
		}

		// Only remove listeners if something was actually closed.
		if (wasOpen) {
			this._removeGlobalListeners();
		}
	},

	defaultOnClick(e) {
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
			return;
		}
		const link = e.currentTarget;
		const localLink =
			this.href && link.origin === window.location.origin && !this.external;
		const isComponent = this.dropdown || this.accordion || this.tab;

		if (!this.href || localLink || isComponent || this.float) {
			e.preventDefault();
		}

		if (this.float) {
			this.toggleAttribute("floatOpen");
			// --- REFACTOR: Use helpers to manage listeners.
			this.hasAttribute("floatOpen")
				? this._addGlobalListeners()
				: this._removeGlobalListeners();
			return;
		}
		if (localLink && !this.skipRoute) {
			const path = [link.pathname, link.search].filter(Boolean).join("");
			isComponent ? Router.push(path) : Router.go(path);
			return;
		}

		if (this.click && this.type !== "submit") {
			if (this.confirmation) {
				if (window.confirm(this.confirmation)) {
					this.click(e);
				}
			} else {
				this.click(e);
			}
			e.stopImmediatePropagation();
		}

		if (this.dropdown) {
			this.toggleAttribute("selected");
			this.hasAttribute("selected")
				? this._addGlobalListeners()
				: this._removeGlobalListeners();
		}
	},

	handleContextMenu(e) {
		e.preventDefault();
		const contextContainer = this.q("[context]");
		if (contextContainer) {
			contextContainer.toggleAttribute("open");
			// --- REFACTOR: Use helpers to manage listeners.
			contextContainer.hasAttribute("open")
				? this._addGlobalListeners()
				: this._removeGlobalListeners();
		}
	},

	// --- REFACTOR: Simplified outside click handler.
	handleOutsideClick(e) {
		// If the click is outside the component OR on a link inside a popup, close everything.
		const isLinkInsidePopup =
			this.q("[dropdown], [context], [float]")?.contains(e.target) &&
			e.target.closest("a");

		if (!this.contains(e.target) || isLinkInsidePopup) {
			this.closeAllPopups();
		}
	},

	// --- REFACTOR: Simplified escape key handler.
	handleEscKey(e) {
		if (e.key === "Escape") {
			e.preventDefault();
			this.closeAllPopups();
		}
	},

	render() {
		// The render method remains the same.
		return html\`<a
            class=\${this.icon ? "uix-text-icon__element" : undefined}
            content
            href=\${this.href}
            @click=\${this.defaultOnClick.bind(this)}
            related=\${this.related}
            name=\${this.name || this.label || this.alt}
            alt=\${this.alt || this.label || this.name}
        >
            \${
							this.icon
								? html\`<uix-icon
                          name=\${this.icon}
                          alt=\${this.alt || this.label || this.name}
                          size=\${this.iconSize || this.size}
                      ></uix-icon>\`
								: ""
						}
            \${this.hideLabel ? null : this.label}
        </a>
        \${!this.dropdown ? null : html\`<div dropdown>\${this.dropdown}</div>\`}
        \${!this.context ? null : html\`<div context>\${this.context}</div>\`}
        \${!this.accordion ? null : html\`<div accordion>\${this.accordion}</div>\`}
        \${
					!this.tooltip
						? null
						: html\`<div tooltip>\${this.tooltip === true ? this.label : this.tooltip}</div>\`
				}
        \${!this.float ? null : html\`<div float>\${this.float}</div>\`}
    \`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/navigation/navbar.css":{content:`.uix-navbar {
	--uix-navbar-text-color: var(--color-default-90);
	--uix-navbar-hover-text-color: var(--color-surface-80);
	--uix-navbar-border-radius: 0px;
	--uix-navbar-border-color: var(--color-default-60);
	--uix-navbar-border-size: 1px;
	--uix-navbar-border-style: solid;
	--uix-navbar-hover-background-color: var(--color-default-40);
	--uix-container-position: var(--uix-navbar-position);
	display: flex;
	flex-direction: column;
	&[docked] {
		--uix-list-button-radius: 0;
		border-bottom: 0;
		position: fixed;
		bottom: 0px;
		background-color: var(--uix-navbar-background-color, var(--color-default-5));
		> * {
			border-right: 0;
			border-bottom: 0;
			&:first-child {
				border-left: 0;
			}
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/uix/layout/list.css":{content:`.uix-list {
	display: flex;
	&[vertical] {
		flex-direction: column;
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/apps/mcp/views/history.js":{content:`export default ({ html, AI, T }) => {
	$APP.define("mcp-history-view", {
		properties: {
			item: T.object(null),
			onBack: T.function(),
		},

		handleBack() {
			if (this.onBack) {
				this.onBack();
			}
		},

		render() {
			if (!this.item) {
				return html\`<div class="text-center text-gray-500 h-full flex items-center justify-center">Select a history item to view details.</div>\`;
			}

			const { item } = this;

			return html\`
                <div class="text-sm">
                    <uix-link label="Back" icon="arrow-left" reverse @click=\${this.handleBack.bind(this)} class="text-xs text-blue-600 hover:underline mb-3 flex items-center"></uix-link>
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-mono text-xs font-bold text-gray-700 mb-1">REQUEST</h4>
                            <pre class="text-xs whitespace-pre-wrap bg-gray-800 text-gray-200 p-2 rounded-lg font-mono overflow-auto">\${JSON.stringify({ tool: item.toolName, args: item.args || item.params }, null, 2)}</pre>
                        </div>
                        <div>
                            <h4 class="font-mono text-xs font-bold text-gray-700 mb-1">RESPONSE</h4>
                            \${
															item.status === "success"
																? html\`<pre class="text-xs whitespace-pre-wrap bg-gray-900 text-green-400 p-2 rounded-lg font-mono overflow-auto">\${JSON.stringify(item.result, null, 2)}</pre>\`
																: item.status === "error"
																	? html\`<pre class="text-xs whitespace-pre-wrap bg-red-100 text-red-700 p-2 rounded-lg font-mono overflow-auto">\${item.error}</pre>\`
																	: html\`<p class="text-xs text-gray-500">Request is still pending...</p>\`
														}
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	return {
		properties: {
			history: T.array([]),
			selectedHistoryId: T.string(null),
			onSelect: T.function(),
			listOnly: T.boolean(),
		},
		selectHistoryItem(item) {
			this.selectedHistoryId = item ? item.id : undefined;
			if (this.onHistorySelect) this.onSelect(item);
		},
		connected() {
			this.historyUnsubscribe = AI.onHistoryChange((event) => {
				this.history = event.history;
			});
			this.history = AI.getHistory();
		},
		render() {
			if (this.history.length === 0)
				return html\`<p class="text-center text-xs text-gray-400 p-4">No history yet</p>\`;
			const selectedHistoryItem = this.history.find(
				(h) => h.id === this.selectedHistoryId,
			);

			return html\`
                <ul class="text-xs space-y-1 font-mono">
                    \${this.history.map(
											(item) => html\`
                            <li
                                class="flex flex-col \${this.selectedHistoryId === item.id ? "font-semibold text-blue-100 p-2" : item.status === "error" ? "text-red-100" : "text-white"}">
                                <div 
																 @click=\${() => this.selectHistoryItem(item)}
																class="cursor-pointer flex items-center justify-between p-2 rounded hover:bg-gray-700">
																<span class="text-ellipsis">\${item.toolName}</span>
                                <div class="flex items-center">
                                    <span class="text-gray-500 mr-2">\${item.status}</span>
                                    <uix-icon name="chevron-right" class="h-4 w-4 text-gray-400"></uix-icon>
                                </div>
																</div>
																\${!this.listOnly || !selectedHistoryItem || selectedHistoryItem.id !== item.id ? null : html\`<mcp-history-view .item=\${selectedHistoryItem} .onBack=\${() => this.selectHistoryItem(null)}></mcp-history-view>\`}
                            </li>
                        \`,
										)}
                </ul>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/button.css":{content:`:where(.uix-button) {
	border: var(--uix-button-borderSize, 0) solid var(--uix-button-borderColor);
	border-radius: var(--uix-button-borderRadius, var(--radius-md));
	box-shadow: var(--uix-button-shadow);
	width: var(--uix-button-width);
	min-width: fit-content;
	background-color: var(--uix-button-backgroundColor, black);
	color: var(--uix-button-textColor, var(--colors-default-100));
	font-weight: var(--uix-button-fontWeight, 700);
	display: flex;
	text-align: center;
	transition:
		transform 0.2s ease-in-out,
		opacity 0.2s ease-in-out,
		background-color 0.2s ease-in-out;
	&:hover {
		opacity: var(--uix-button-hover-opacity, 0.4);
	}

	&:active {
		transform: scale(0.97);
	}

	> button,
	> a,
	> input {
		width: max-content;
		display: block;
		border-radius: inherit;
		cursor: var(--uix-button-cursor, pointer);
		height: calc(var(--spacing) * 10);
		line-height: calc(var(--spacing) * 5);
		padding: var(
			--uix-button-padding,
			calc(var(--spacing) * 2.5) calc(var(--spacing) * 4)
		);
		word-break: keep-all;
		flex-basis: 100%;
	}

	.uix-icon,
	button,
	input,
	a {
		cursor: pointer;
	}

	&[bordered] {
		--uix-button-border-size: 1px;
		--uix-button-backgroundColor: transparent;
		--uix-button-hoverBackgroundColor: var(--_variant-color-300);
		--uix-button-borderColor: var(--_variant-color-400);
		--uix-button-textColor: var(--_variant-color-700);
	}

	&[ghost] {
		--uix-button-backgroundColor: transparent;
		--uix-button-hoverBackgroundColor: var(--_variant-color-300);
		--uix-button-borderSize: 0px;
		--uix-button-textColor: var(--_variant-color-700);
	}

	&[outline] {
		--uix-button-backgroundColor: transparent;
		--uix-button-hoverBackgroundColor: var(--_variant-color-300);
		--uix-button-textColor: var(--_variant-color-800);
		--uix-button-borderSize: 1px;
		--uix-button-borderColor: var(--_variant-color-400);
	}

	&[float] {
		background-color: black;
		--uix-button-hoverBackgroundColor: var(--_variant-color-500);
		--uix-button-textColor: var(--_variant-color-50);
		--uix-button-borderSize: 0px;
		--uix-button-borderRadius: 9999px;
		--uix-button-width: var(--uix-button-height);
		box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
		--uix-button-padding: 0.5rem;
	}
	&[float]:hover {
		box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/uix/display/link.css":{content:`:where(.uix-link) {
	font-weight: var(--uix-link-font-weight, 600);
	width: var(--uix-link-width, auto);
	color: var(--uix-link-text-color, var(--colors-default-900));
	--uix-link-indent: 0;
	cursor: pointer;

	&[vertical] {
		margin: 0 auto;
	}
	a,
	button {
		width: inherit;
		cursor: pointer;
		padding: var(--uix-link-padding);
		&:hover {
			color: var(--uix-link-hover-color, var(--uix-link-text-color));
		}
	}
	.uix-text-icon__element {
		display: flex;
		align-items: center;
		gap: var(--uix-link-icon-gap, 0.5rem);
		&[reverse][vertical] {
			flex-direction: column-reverse;
		}

		&:not([reverse])[vertical] {
			flex-direction: column;
		}

		&[reverse]:not([vertical]) {
			flex-direction: row-reverse;
		}

		&:not([reverse]):not([vertical]) {
			flex-direction: row;
		}
	}
	transition: all 0.3s ease-in-out;

	&[indent] {
		> a,
		> button {
			padding-left: var(--uix-link-indent);
		}
	}

	&[active]:hover {
		color: var(--uix-link-hover-text-color, var(--colors-primary-400));
	}

	&[selectable][selected] {
		background-color: var(--colors-primary-400);
	}

	&:hover {
		[tooltip] {
			display: flex;
		}
	}

	&[tooltip] {
		display: inline-block;
		&:hover {
			[tooltip] {
				visibility: visible;
			}
		}
		[tooltip] {
			visibility: hidden;
			width: 120px;
			background-color: black;
			color: #fff;
			text-align: center;
			border-radius: 6px;
			padding: 5px 10px;
			margin-left: 3px;
			position: absolute;
			z-index: 1000000000;
			top: 50%;
			left: 100%;
			transform: translateY(-50%);
		}
	}

	&[position~="top"] [tooltip] {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
	}

	&[position~="bottom"] [tooltip] {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
	}

	&[position~="left"] [tooltip] {
		top: 50%;
		right: 100%;
		transform: translateY(-50%);
	}

	&[tooltip],
	&[dropdown],
	&[context],
	&[float] {
		position: relative;
	}

	&[dropdown],
	&[accordion] {
		flex-direction: column;
	}

	[float],
	[dropdown],
	[accordion],
	[context] {
		display: none;
	}
	&[floatopen] > a {
		display: none;
	}
	&[floatopen] [float] {
		display: block;
		position: relative;
		bottom: 0px;
		right: 0px;
	}

	&[context] {
		z-index: auto;
	}
	[context][open] {
		display: flex;
		flex-direction: column;
	}
	[dropdown],
	[context][open] {
		position: absolute;
		left: 0;
		top: 100%;
		width: 100%;
		min-width: 200px;
		z-index: 1000;
		background-color: var(--colors-primary-100);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
		.uix-link:hover,
		input {
			background-color: var(--colors-primary-200);
		}
		& > .uix-link {
			width: 100%;
		}
	}

	[context][open] {
		display: flex;
	}

	&[selected] {
		[dropdown],
		[accordion] {
			display: flex;
			flex-direction: column;
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/book.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/bot.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2m16 0h2m-7-1v2m-6-2v2"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/search.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.3-4.3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/layout-grid.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/server.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><path d="M6 6h.01M6 18h.01"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/zap.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/message-square-heart.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M14.8 7.5a1.84 1.84 0 0 0-2.6 0l-.2.3l-.3-.3a1.84 1.84 0 1 0-2.4 2.8L12 13l2.7-2.7c.9-.9.8-2.1.1-2.8"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/apps/mcp/views/chat.js":{content:`export default ({ $APP, html, AI, T }) => {
	// In-memory store for conversations. In a real app, this would be persisted.
	const conversations = new Map();
	let currentConversationId = null;

	// --- Helper SVG Icons ---
	const SendIcon = () => html\`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <path d="m22 2-7 20-4-9-9-4Z"></path>
            <path d="m22 2-11 11"></path>
        </svg>
    \`;

	const TrashIcon = () => html\`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" x2="10" y1="11" y2="17"></line>
            <line x1="14" x2="14" y1="11" y2="17"></line>
        </svg>
    \`;

	const PlusIcon = () => html\`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
        </svg>
    \`;

	const SettingsIcon = () => html\`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    \`;

	const ToolIcon = () => html\`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
    \`;

	// --- MCP Chat Message Component ---
	$APP.define("mcp-chat-message", {
		properties: {
			message: T.object({}),
			isUser: T.boolean(false),
			isStreaming: T.boolean(false),
		},

		_formatTimestamp(timestamp) {
			return new Date(timestamp).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		},

		_renderToolCall(toolCall) {
			return html\`
                <div class="bg-[#1d2021] border-l-4 border-[#504945] p-3 mt-2 rounded-md">
                    <div class="font-mono text-[#83a598] font-semibold flex items-center gap-2">
                        \${ToolIcon()}
                        \${toolCall.name}
                    </div>
                    \${
											toolCall.arguments
												? html\`<pre class="text-sm text-[#bdae93] mt-2 whitespace-pre-wrap bg-[#282828] p-2 rounded">\${JSON.stringify(toolCall.arguments, null, 2)}</pre>\`
												: ""
										}
                    \${
											toolCall.result
												? html\`
                          <div class="mt-2 text-[#ebdbb2]">
                              <div class="font-semibold text-sm text-[#928374]">Result:</div>
                              <pre class="text-sm bg-[#282828] p-2 rounded mt-1 whitespace-pre-wrap">\${typeof toolCall.result === "string" ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}</pre>
                          </div>\`
												: ""
										}
                </div>
            \`;
		},
		render() {
			const { message, isUser } = this;
			const senderIcon = isUser
				? html\`<div class="w-8 h-8 rounded-full bg-[#458588] flex-shrink-0 flex items-center justify-center font-bold text-[#ebdbb2]">Y</div>\`
				: html\`<div class="w-8 h-8 rounded-full bg-[#3c3836] border border-[#504945] flex-shrink-0 flex items-center justify-center text-[#83a598]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
                </div>\`;

			return html\`
                <div class="flex items-start gap-4 my-6 \${isUser ? "justify-end" : "justify-start"}">
                    \${!isUser ? senderIcon : ""}
                    <div class="max-w-[75%]">
                        <div class="flex items-baseline gap-2 mb-1 \${isUser ? "justify-end" : ""}">
                            <span class="font-bold \${isUser ? "text-[#d5c4a1]" : "text-[#bdae93]"}">\${isUser ? "You" : "Assistant"}</span>
                            \${message.timestamp ? html\`<span class="text-sm text-[#928374]">\${this._formatTimestamp(message.timestamp)}</span>\` : ""}
                        </div>
                        <div class="bg-[#3c3836] border border-[#504945] rounded-lg p-3 shadow-sm text-[#ebdbb2]">
                            \${message.content ? html\`<div class="prose prose-sm max-w-none text-[#ebdbb2] whitespace-pre-wrap">\${message.content}</div>\` : ""}
                            \${message.toolCalls?.length > 0 ? message.toolCalls.map((toolCall) => this._renderToolCall(toolCall)) : ""}
                            \${this.isStreaming ? html\`<div class="inline-block w-2 h-4 bg-[#ebdbb2] animate-pulse ml-1"></div>\` : ""}
                        </div>
                    </div>
                    \${isUser ? senderIcon : ""}
                </div>
            \`;
		},
	});

	// --- MCP Chat Input Component ---
	$APP.define("mcp-chat-input", {
		properties: {
			value: T.string(""),
			isLoading: T.boolean(false),
			onSend: T.function(),
			availableTools: T.array([]),
			selectedTools: T.array([]),
			onToolToggle: T.function(),
			availableModels: T.array([]),
			selectedModel: T.string(""),
			onModelChange: T.function(),
			onSettingsClick: T.function(),
		},

		handleInput(event) {
			this.value = event.target.value;
			this.autoResize(event.target);
		},

		autoResize(textarea) {
			textarea.style.height = "auto";
			textarea.style.height = \`\${textarea.scrollHeight}px\`;
		},

		handleKeyPress(event) {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				this.sendMessage();
			}
		},

		sendMessage() {
			if (!this.value.trim() || this.isLoading) return;
			const message = this.value.trim();

			if (this.onSend) {
				this.onSend(message);
			}

			this.value = "";
			setTimeout(() => {
				const textarea = this.querySelector("textarea");
				if (textarea) this.autoResize(textarea);
			}, 0);
		},

		render() {
			return html\`
                <div class="px-6 pb-4">
                    <div class="bg-[#3c3836] border border-[#504945] rounded-xl shadow-lg p-2">
                        <div class="px-2 pb-2 flex justify-between items-center flex-wrap gap-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                \${this.availableTools.map(
																	(tool) => html\`
                                    <button 
                                        @click=\${() => this.onToolToggle(tool.name)}
                                        class="px-2 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 \${this.selectedTools.includes(tool.name) ? "bg-[#83a598] text-[#1d2021]" : "bg-[#504945] text-[#ebdbb2] hover:bg-[#665c54]"}"
                                        title=\${tool.description}
                                    >
                                        \${ToolIcon()}
                                        \${tool.name}
                                    </button>
                                \`,
																)}
                            </div>
                            <div class="flex items-center gap-2">
                                <select @change=\${(e) => this.onModelChange(e.target.value)} .value=\${this.selectedModel} class="bg-[#504945] border border-[#665c54] rounded-md px-2 text-sm focus:ring-[#83a598] focus:outline-none h-7">
                                    \${this.availableModels.map((model) => html\`<option value=\${model.id}>\${model.name}</option>\`)}
                                </select>
                                <button @click=\${this.onSettingsClick} class="p-1.5 text-[#bdae93] hover:text-[#ebdbb2] hover:bg-[#504945] rounded-md">
                                    \${SettingsIcon()}
                                </button>
                            </div>
                        </div>
                        <div class="relative">
                            <textarea
                                .value=\${this.value}
                                @input=\${this.handleInput.bind(this)}
                                @keydown=\${this.handleKeyPress.bind(this)}
                                ?disabled=\${this.isLoading}
                                placeholder="Type your message..."
                                rows="1"
                                class="w-full bg-[#282828] p-4 pr-16 text-[#ebdbb2] placeholder-[#928374] resize-none focus:outline-none focus:ring-2 focus:ring-[#83a598] rounded-lg transition-all"
                                style="max-height: 200px; overflow-y: auto;"
                            ></textarea>
                            <button
                                @click=\${this.sendMessage.bind(this)}
                                ?disabled=\${!this.value.trim() || this.isLoading}
                                class="absolute right-3 bottom-2.5 p-2 rounded-full text-[#ebdbb2] transition-colors
                                    \${
																			!this.value.trim() || this.isLoading
																				? "bg-[#504945] cursor-not-allowed"
																				: "bg-[#458588] hover:bg-[#83a598]"
																		}"
                            >
                                \${this.isLoading ? html\`<div class="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>\` : SendIcon()}
                            </button>
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	// --- MCP Conversation List Component ---
	$APP.define("mcp-conversation-list", {
		properties: {
			conversations: T.array([]),
			currentId: T.any(null),
			onSelect: T.function(),
			onNew: T.function(),
			onDelete: T.function(),
		},

		_getPreview(conversation) {
			const lastMessage =
				conversation.messages[conversation.messages.length - 1];
			if (!lastMessage) return "New conversation";
			const content = lastMessage.content || "No content";
			return content.length > 35 ? \`\${content.substring(0, 35)}...\` : content;
		},

		_formatDate(timestamp) {
			const date = new Date(timestamp);
			const now = new Date();
			if (date.toDateString() === now.toDateString()) {
				return date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				});
			}
			return date.toLocaleDateString([], { month: "short", day: "numeric" });
		},

		render() {
			return html\`
                <div class="h-full flex flex-col bg-[#3c3836]">
                    <div class="p-3 border-b border-[#504945]">
                        <button @click=\${this.onNew} class="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[#458588] text-[#ebdbb2] hover:bg-[#83a598] transition-colors font-semibold">
                            \${PlusIcon()} New Chat
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2">
                        \${
													this.conversations.length === 0
														? html\`<div class="p-4 text-center text-[#928374]">No conversations yet</div>\`
														: this.conversations.map(
																(conv) => html\`
                                    <div
                                        @click=\${() => this.onSelect(conv.id)}
                                        class="p-3 rounded-lg cursor-pointer transition-colors group relative \${this.currentId === conv.id ? "bg-[#504945]" : "hover:bg-[#504945]"}"
                                    >
                                        <div class="text-sm font-semibold text-[#ebdbb2] truncate">\${conv.title || "Untitled Chat"}</div>
                                        <div class="flex justify-between items-center mt-1">
                                            <div class="text-sm text-[#bdae93] truncate pr-10">\${this._getPreview(conv)}</div>
                                            <span class="text-sm text-[#928374] flex-shrink-0">\${this._formatDate(conv.updatedAt || conv.createdAt)}</span>
                                        </div>
                                        <button 
                                            @click=\${(e) => {
																							e.stopPropagation();
																							this.onDelete(conv.id);
																						}}
                                            class="absolute top-2 right-2 p-1 text-[#928374] hover:text-[#fb4934] rounded-full hover:bg-[#1d2021] opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete conversation">
                                            \${TrashIcon()}
                                        </button>
                                    </div>
                                \`,
															)
												}
                    </div>
                </div>
            \`;
		},
	});

	// --- Main Application Component ---
	return {
		class: "w-full h-full bg-[#282828] text-[#ebdbb2] flex font-sans",
		properties: {
			currentConversation: T.object(null),
			conversations: T.array([]),
			isLoading: T.boolean(false),
			error: T.string(""),
			availableTools: T.array([]),
			selectedTools: T.array([]),
			availableModels: T.array([]),
			selectedModel: T.string("qwen/qwen3-4b-2507"),
			showSettingsModal: T.boolean(false),
			modelSettings: T.object({ temperature: 0.5 }),
		},

		async initializeAI() {
			try {
				if (!AI.isInitialized) {
					await AI.init({
						// Example API Keys - replace with actual config management
						googleApiKey: "",
						openrouterApiKey: "",
					});
				}
			} catch (error) {
				console.error("Error initializing AI service:", error);
				this.error = "Failed to initialize AI Service.";
			}
		},

		async connected() {
			await this.initializeAI();
			this.loadConversations();
			this.loadTools();
			this.loadModels();
			if (!currentConversationId && this.conversations.length > 0) {
				this.selectConversation(this.conversations[0].id);
			} else if (this.conversations.length === 0) {
				this.createNewConversation();
			}
		},

		async loadTools() {
			try {
				const { tools } = await AI.listTools();
				this.availableTools = tools || [];
			} catch (e) {
				console.error("Couldn't load tools", e);
				this.availableTools = [];
			}
		},

		async loadModels() {
			this.availableModels = [
				{ id: "qwen/qwen3-4b-2507", name: "Qwen3 4b" },
				{ id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
				{ id: "google/gemini-1.5-pro-latest", name: "Gemini 1.5 Pro" },
				{ id: "openai/gpt-4-turbo", name: "GPT-4 Turbo" },
			];
		},

		toggleTool(toolName) {
			if (this.selectedTools.includes(toolName)) {
				this.selectedTools = this.selectedTools.filter((t) => t !== toolName);
			} else {
				this.selectedTools = [...this.selectedTools, toolName];
			}
		},

		handleModelChange(modelId) {
			this.selectedModel = modelId;
			// Infer provider from model string
			const provider = modelId.split("/")[0];
			if (provider) {
				this.modelSettings = { ...this.modelSettings, provider };
			}
		},

		toggleSettingsModal() {
			this.showSettingsModal = !this.showSettingsModal;
			console.log("Settings modal toggled:", this.showSettingsModal);
		},

		loadConversations() {
			this.conversations = Array.from(conversations.values()).sort(
				(a, b) =>
					new Date(b.updatedAt || b.createdAt) -
					new Date(a.updatedAt || a.createdAt),
			);
		},

		createNewConversation() {
			const id = Date.now().toString();
			const conversation = {
				id,
				title: "",
				messages: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			conversations.set(id, conversation);
			currentConversationId = id;
			this.currentConversation = conversation;
			this.loadConversations();
		},

		selectConversation(id) {
			const conversation = conversations.get(id);
			if (conversation) {
				currentConversationId = id;
				this.currentConversation = conversation;
			}
		},

		deleteConversation(id) {
			conversations.delete(id);
			this.loadConversations();
			if (currentConversationId === id) {
				currentConversationId = null;
				this.currentConversation = null;
				if (this.conversations.length > 0) {
					this.selectConversation(this.conversations[0].id);
				} else {
					this.createNewConversation();
				}
			}
		},

		updateConversationTitle(conversation) {
			if (!conversation.title && conversation.messages.length > 0) {
				const firstMessage = conversation.messages.find(
					(m) => m.role === "user",
				);
				if (firstMessage?.content) {
					conversation.title =
						firstMessage.content.length > 50
							? \`\${firstMessage.content.substring(0, 50)}...\`
							: firstMessage.content;
				}
			}
		},

		async sendMessage(content) {
			if (!this.currentConversation) {
				this.createNewConversation();
			}

			const userMessage = {
				role: "user",
				content,
				timestamp: new Date().toISOString(),
			};
			this.currentConversation.messages.push(userMessage);
			this.currentConversation.updatedAt = new Date().toISOString();
			this.updateConversationTitle(this.currentConversation);
			conversations.set(this.currentConversation.id, this.currentConversation);
			this.currentConversation = { ...this.currentConversation };
			this.loadConversations();

			this.isLoading = true;
			this.error = "";

			const assistantMessage = {
				role: "assistant",
				content: "",
				timestamp: null,
				toolCalls: [],
			};
			this.currentConversation.messages.push(assistantMessage);

			try {
				const history = this.currentConversation.messages
					.slice(0, -1)
					.map((m) => ({
						role: m.role,
						content: m.content,
						toolCalls: m.toolCalls,
					}));

				const modelParts = this.selectedModel.split("/");
				const provider = modelParts.length > 1 ? modelParts[0] : "openrouter";

				const stream = AI.chat(history, {
					stream: true,
					enabledTools: this.selectedTools,
					model: this.selectedModel,
					provider: "local",
					...this.modelSettings,
				});
				console.error({ stream });
				for await (const chunk of stream) {
					if (chunk.type === "content") {
						assistantMessage.content = chunk.content;
					} else if (chunk.type === "tool_calls_start") {
						assistantMessage.toolCalls = chunk.toolCalls;
					} else if (
						chunk.type === "tool_result" ||
						chunk.type === "tool_error"
					) {
						const toolCall = assistantMessage.toolCalls.find(
							(tc) => tc.name.replace(/__/g, "/") === chunk.name,
						);
						if (toolCall) {
							toolCall.result = chunk.result || { error: chunk.error };
						}
					}

					this.currentConversation = { ...this.currentConversation };

					this.scrollToBottom();
				}
			} catch (error) {
				console.error("Error sending message:", error);
				this.error = error.message || "Failed to send message";
				assistantMessage.content = \`Error: \${this.error}\`;
			} finally {
				this.isLoading = false;
				assistantMessage.timestamp = new Date().toISOString();
				this.currentConversation.updatedAt = new Date().toISOString();
				conversations.set(
					this.currentConversation.id,
					this.currentConversation,
				);
				this.currentConversation = { ...this.currentConversation };
				this.loadConversations();
			}
		},

		scrollToBottom() {
			setTimeout(() => {
				const chatContainer = this.querySelector(".chat-messages");
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}, 0);
		},
		render() {
			this.scrollToBottom();
			return html\`
                <div class="w-80 border-r border-[#504945] flex-shrink-0">
                    <mcp-conversation-list
                        .conversations=\${this.conversations}
                        .currentId=\${this.currentConversation?.id}
                        .onSelect=\${this.selectConversation.bind(this)}
                        .onNew=\${this.createNewConversation.bind(this)}
                        .onDelete=\${this.deleteConversation.bind(this)}
                    ></mcp-conversation-list>
                </div>

                <div class="flex-1 flex flex-col bg-[#282828] h-full">
                    \${
											this.currentConversation
												? html\`
                                <div class="flex-1 overflow-y-auto chat-messages px-6">
                                    \${this.error ? html\`<div class="bg-red-900/50 border border-[#fb4934] rounded-lg p-3 my-4 text-[#fabd2f]">\${this.error}</div>\` : ""}
                                    \${this.currentConversation.messages.map(
																			(message, index) => html\`
                                            <mcp-chat-message
                                                .message=\${{ ...message }}
                                                .isUser=\${message.role === "user"}
                                                .isStreaming=\${this.isLoading && index === this.currentConversation.messages.length - 1}
                                            ></mcp-chat-message>
                                        \`,
																		)}
                                </div>
                                <mcp-chat-input
                                    .isLoading=\${this.isLoading}
                                    .onSend=\${this.sendMessage.bind(this)}
                                    .availableTools=\${this.availableTools}
                                    .selectedTools=\${this.selectedTools}
                                    .onToolToggle=\${this.toggleTool.bind(this)}
                                    .availableModels=\${this.availableModels}
                                    .selectedModel=\${this.selectedModel}
                                    .onModelChange=\${this.handleModelChange.bind(this)}
                                    .onSettingsClick=\${this.toggleSettingsModal.bind(this)}
                                ></mcp-chat-input>
                            \`
												: html\`
                                <div class="flex-1 flex items-center justify-center">
                                    <div class="text-center text-[#928374]">
                                        <div class="text-6xl mb-4">\u{1F4AC}</div>
                                        <h3 class="text-xl font-semibold text-[#ebdbb2] mb-2">Select a chat</h3>
                                        <p>Or start a new conversation to begin.</p>
                                    </div>
                                </div>
                            \`
										}
                </div>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/icon.js":{content:`export default ({ T, html, $APP, Icons, theme }) => ({
	tag: "uix-icon",
	style: true,
	properties: {
		name: T.string(),
		svg: T.string(),
		solid: T.boolean(),
	},

	async getIcon(name) {
		if (Icons.has(name)) this.svg = Icons.get(name);
		else {
			try {
				const response = await fetch(
					$APP.fs.getFilePath(
						\`modules/icon-\${theme.font.icon.family}/\${theme.font.icon.family}/\${name}.svg\`,
					),
				);
				if (response.ok) {
					const svgElement = await response.text();
					Icons.set(name, svgElement);
					this.svg = svgElement;
				} else {
					console.error(\`Failed to fetch icon: \${name}\`);
				}
			} catch (error) {
				console.error(\`Error fetching icon: \${name}\`, error);
			}
		}
	},
	willUpdate() {
		if (this.name) {
			this.getIcon(this.name);
		}
	},
	render() {
		return !this.svg ? null : html.unsafeHTML(this.svg);
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/view/html/directive.js":{content:`/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
export const directive =
	(c) =>
	(...values) => ({
		// This property needs to remain unminified.
		["_$litDirective$"]: c,
		values,
	});

/**
 * Base class for creating custom directives. Users should extend this class,
 * implement \`render\` and/or \`update\`, and then pass their subclass to
 * \`directive\`.
 */
export class Directive {
	//@internal
	__part;
	//@internal
	__attributeIndex;
	//@internal
	__directive;
	//@internal
	_$parent;

	// These will only exist on the AsyncDirective subclass
	//@internal
	_$disconnectableChildren;
	// This property needs to remain unminified.
	//@internal
	["_$notifyDirectiveConnectionChanged"];

	constructor(_partInfo) {}

	// See comment in Disconnectable interface for why this is a getter
	get _$isConnected() {
		return this._$parent._$isConnected;
	}

	/** @internal */
	_$initialize(part, parent, attributeIndex) {
		this.__part = part;
		this._$parent = parent;
		this.__attributeIndex = attributeIndex;
	}
	/** @internal */
	_$resolve(part, props) {
		return this.update(part, props);
	}

	render(...props) {
		throw new Error("The \`render()\` method must be implemented.");
	}

	update(_part, props) {
		return this.render(...props);
	}
}

// A sentinel value that can never appear as a part value except when set by
// live(). Used to force a dirty-check to fail and cause a re-render.
const RESET_VALUE = {};

/**
 * Sets the committed value of a ChildPart directly without triggering the
 * commit stage of the part.
 *
 * This is useful in cases where a directive needs to update the part such
 * that the next update detects a value change or not. When value is omitted,
 * the next update will be guaranteed to be detected as a change.
 *
 * @param part
 * @param value
 */
const setCommittedValue = (part, value = RESET_VALUE) =>
	(part._$committedValue = value);
const nothing = Symbol.for("lit-nothing");
class Keyed extends Directive {
	key = nothing;
	render(k, v) {
		this.key = k;
		return v;
	}
	update(part, [k, v]) {
		if (k !== this.key) {
			// Clear the part before returning a value. The one-arg form of
			// setCommittedValue sets the value to a sentinel which forces a
			// commit the next render.
			setCommittedValue(part);
			this.key = k;
		}
		return v;
	}
}

export const keyed = directive(Keyed);

export const ifDefined = (value) => value ?? nothing;
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/icon.css":{content:`.uix-icon {
	display: inline-block;
	vertical-align: middle;
	svg {
		height: inherit;
		width: inherit;
	}
}

&[solid] {
	stroke: currentColor;
	fill: currentColor;
}
`,mimeType:"text/css",skipSW:!1},"/modules/uix/form/input.css":{content:`:where(.uix-input) {
	--uix-input-background-color: var(--colors-surface-100);
	--uix-input-border-color: var(--colors-gray-900);
	--uix-input-text-color: var(--colors-gray-900);
	--uix-input-placeholder-color: var(--colors-default-500);
	--uix-input-border-radius: var(--border-radius-md);
	--uix-input-border-width: 2px;
	--uix-input-padding-x: calc(var(--spacing) * 4);
	--uix-input-padding-y: calc(var(--spacing) * 2.5);
	--uix-input-font-size: var(--font-size-base);
	--uix-input-height: 2.5rem;
	--uix-input-disabled-opacity: 0.6;
	--uix-input-label-font-size: var(--font-size-sm);
	--uix-input-label-font-weight: var(--font-weight-bold);
	--uix-input-label-color: var(--colors-default-700);
	--uix-input-checkbox-size: 1.5rem;
	--uix-input-checkbox-border-radius: var(--border-radius-sm);
	--uix-input-checkbox-checked-bg: var(--colors-primary-600);
	--uix-input-checkbox-check-color: var(--colors-surface-100);
	width: 100%;
	display: flex;
	flex-direction: column;

	input,
	select,
	textarea {
		width: 100%;
		height: var(--uix-input-height);
		border-radius: var(--uix-input-border-radius);
		border: var(--uix-input-border-width) solid var(--uix-input-border-color);
		font-size: var(--uix-input-font-size);
		background-color: var(--uix-input-background-color);
		color: var(--uix-input-text-color);
		transition: var(--uix-transition);
		outline: none;
		padding: var(--uix-input-padding-y) var(--uix-input-padding-x);
	}

	textarea {
		resize: vertical;
	}

	&:has(textarea) {
		height: auto;
	}

	select {
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		font-weight: 600;
		padding-block: 0;
		option {
			font-weight: 600;
			background-color: var(--uix-input-background-color);
			font-size: 1.1rem;
			line-height: 1.5rem;
			color: #333;
			padding: 50px;
			border: 2px solid red;
		}
	}

	.select-container {
		position: relative;
		.select-arrow {
			position: absolute;
			right: calc(2 * var(--spacing));
		}
	}

	input::placeholder {
		color: transparent;
	}

	label {
		font-weight: var(--uix-input-label-font-weight);
		color: var(--uix-input-label-color, var(--colors-gray-600));
		margin-bottom: var(--spacing);
		font-size: 0.9rem;
		padding: 0 4px;
		transition: all 0.2s ease-in-out;
		pointer-events: none;
		&[required]::after {
			content: "*";
			color: var(--colors-danger-500);
			margin-left: 2px;
		}
	}

	/* Floating label logic */
	input:not(:placeholder-shown) + label,
	textarea:not(:placeholder-shown) + label,
	&:focus-within label,
	&.has-value label {
		top: -2px;
		transform: translateY(0);
		font-size: var(--uix-input-label-font-size);
	}
	&:focus-within input,
	&:focus-within select,
	&:focus-within textarea {
		box-shadow: 0 0 var(--uix-input-focus-ring-width, 5px)
			var(--uix-input-focus-ring-color, rgba(0, 0, 255, 0.5));
	}

	&[disabled] {
		cursor: not-allowed;
		opacity: var(--uix-input-disabled-opacity);

		& label {
			cursor: not-allowed;
		}
	}

	.input-icon,
	.select-arrow {
		position: absolute;
		top: 50%;
		right: var(--spacing);
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--uix-input-label-color);
		transition: transform 0.2s ease-in-out;
	}

	&:has(select:hover:active) .select-arrow {
		transform: translateY(-50%) rotate(180deg);
	}

	&:has(.input-icon:not(.select-arrow)) > input {
		padding-right: calc(var(--uix-input-padding-x) + 1.75em);
	}

	&[type="checkbox"],
	&[type="radio"] {
		flex-direction: row;
		align-items: center;
		border: 0;
		height: auto;
		width: auto;
		background-color: transparent;
		box-shadow: none;
		gap: 0.75rem;
		cursor: pointer;
		label {
			margin: 0;
			line-height: 1.5rem;
			position: static;
			transform: none;
			background-color: transparent;
			padding: 0;
			cursor: pointer;
			font-weight: var(--font-weight-normal);
			order: 2;
			pointer-events: auto;
		}

		input {
			appearance: none;
			-webkit-appearance: none;
			width: var(--uix-input-checkbox-size);
			height: var(--uix-input-checkbox-size);
			margin: 0;
			border: var(--uix-input-border-width) solid var(--uix-input-border-color);
			background-color: var(--uix-input-background-color);
			cursor: pointer;
			position: relative;
			transition: var(--uix-transition);
			padding: 0;

			&::after {
				content: "";
				position: absolute;
				display: none;
				left: 50%;
				top: 50%;
			}

			&:checked {
				background-color: var(--uix-input-checkbox-checked-bg);
				border-color: var(--uix-input-checkbox-checked-bg);
				&::after {
					display: block;
				}
			}

			&:focus-visible {
				box-shadow: 0 0 0 var(--uix-input-focus-ring-width)
					var(--uix-input-focus-ring-color);
				border-color: var(--uix-input-focus-ring-color);
			}
		}
	}

	&[type="checkbox"] input::after {
		width: 0.375rem;
		height: 0.75rem;
		border: solid var(--uix-input-checkbox-check-color);
		border-width: 0 2px 2px 0;
		transform: translate(-50%, -60%) rotate(45deg);
	}

	&[type="radio"] input {
		border-radius: var(--border-radius-full);
		&::after {
			width: calc(var(--uix-input-checkbox-size) / 2);
			height: calc(var(--uix-input-checkbox-size) / 2);
			border-radius: var(--border-radius-full);
			background-color: var(--uix-input-checkbox-check-color);
			transform: translate(-50%, -50%);
		}
	}

	&[ghost] {
		&:focus-within select {
			box-shadow: none;
		}
		.select-arrow {
			margin-left: 5px;
			padding-left: 5px;
		}
		select {
			background: inherit;
			border: 0;
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/code.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 18l6-6l-6-6M8 6l-6 6l6 6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/folder.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/message-circle.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/cog.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16"/><path d="M12 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0-12v2m0 18v-2m5 .66l-1-1.73m-5-8.66L7 3.34M20.66 17l-1.73-1M3.34 7l1.73 1M14 12h8M2 12h2m16.66-5l-1.73 1M3.34 17l1.73-1M17 3.34l-1 1.73m-5 8.66l-4 6.93"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/bot-message-square.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V2H8m0 16l-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Zm-6-6h2m5-1v2m6-2v2m5-1h2"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/server-cog.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5m-15 4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5M6 6h.01M6 18h.01m9.69-4.6l-.9-.3m-5.6-2.2l-.9-.3m2.3 5.1l.3-.9m2.7.9l-.4-1m-2.4-5.4l-.4-1m-2.1 5.3l1-.4m5.4-2.4l1-.4m-2.3-2.1l-.3.9"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/sun.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/square-mouse-pointer.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/settings.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/apps/mcp/views/inspector.js":{content:`export default ({ $APP, html, AI, T }) => {
	$APP.define("mcp-inspector-sidebar", {
		class: "w-80 bg-[#3c3836] border-r border-[#504945] flex flex-col shrink-0",
		properties: {
			servers: T.array([]),
			onConnect: T.function(),
			onDisconnect: T.function(),
			transportType: T.string(),
			command: T.string(),
			args: T.string(),
			onInput: T.function(),
		},

		render() {
			return html\`
                <div class="p-4 border-b border-[#504945]">
                    <h1 class="font-bold text-lg text-[#ebdbb2]">Inspector</h1>
                </div>
                <div class="flex-grow flex flex-col overflow-y-auto p-4 space-y-6">
                    <div>
                        <h2 class="font-semibold text-sm mb-3 text-[#ebdbb2]">Add Connection</h2>
                        \${this._renderConnectionForm()}
                    </div>

                    \${
											this.servers.length > 0
												? html\`
                              <div class="border-t border-[#504945] pt-4">
                                  <h2 class="font-semibold text-sm mb-3 text-[#ebdbb2]">Active Connections</h2>
                                  \${this._renderConnectedServersList()}
                              </div>
                          \`
												: ""
										}
                </div>
            \`;
		},

		_renderConnectionForm() {
			return html\`
                <div class="dark space-y-4">
                    <uix-input type="select" .options=\${["JavaScript", "StreamableHTTP"]} label="Transport" value=\${this.transportType} @change=\${(e) => this.onInput("transportType", e.target.value)}></uix-input>
                    <uix-input label="Command / URL" value=\${this.command} @input=\${(e) => this.onInput("command", e.target.value)}></uix-input>
                    <uix-input label="Arguments" value=\${this.args} @input=\${(e) => this.onInput("args", e.target.value)}></uix-input>
                </div>
                <div class="mt-4">
                    <uix-button @click=\${this.onConnect} label="Connect" class="bg-[#83a598] text-[#1d2021] w-full"></uix-button>
                </div>
            \`;
		},

		_renderConnectedServersList() {
			return html\`
                <div class="space-y-4">
                    \${this.servers.map(
											(server) => html\`
                            <div class="text-xs space-y-2 text-[#ebdbb2] bg-[#282828] p-3 rounded-lg border border-[#504945]">
                                <div class="flex justify-between items-center">
                                    <span class="font-semibold text-[#bdae93]">Status:</span>
                                    <span class="px-2 py-1 bg-[#b8bb26] text-[#282828] rounded-full font-medium text-xs">Connected</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="font-semibold text-[#bdae93]">Transport:</span>
                                    <span>\${server.type}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="font-semibold text-[#bdae93] mr-2">Endpoint:</span>
                                    <span class="truncate font-mono text-right" title=\${server.command}>\${server.command}</span>
                                </div>
                                <div class="mt-2 pt-2 border-t border-[#504945]">
                                    <uix-button @click=\${() => this.onDisconnect(server.alias)} label="Disconnect" class="bg-[#fb4934] text-[#ebdbb2] w-full h-8 text-xs"></uix-button>
                                </div>
                            </div>
                        \`,
										)}
                </div>
            \`;
		},
	});

	$APP.define("mcp-tabs", {
		class: "flex flex-col flex-grow",
		properties: {
			tabs: T.array([]),
			activeTab: T.number(0),
			selectedHistoryItem: T.object(null),
			onDeselectHistoryItem: T.function(),
		},

		connected() {
			this.tabs = [
				{ key: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
				{ key: "resources", label: "Resources", icon: "database" },
				{ key: "tools", label: "Tools", icon: "wrench" },
				{ key: "prompts", label: "Prompts", icon: "terminal" },
				{ key: "roots", label: "Roots", icon: "git-branch-plus" },
				{ key: "auth", label: "Auth", icon: "key" },
			];
		},

		selectTab(index) {
			this.activeTab = index;
		},

		_renderTabView(tab) {
			switch (tab.key) {
				case "dashboard":
					return html\`<mcp-dashboard .selectedHistoryItem=\${this.selectedHistoryItem} .onDeselectHistoryItem=\${this.onDeselectHistoryItem}></mcp-dashboard>\`;
				case "resources":
					return html\`<mcp-resources></mcp-resources>\`;
				case "tools":
					return html\`<mcp-tools></mcp-tools>\`;
				case "prompts":
					return html\`<mcp-prompts></mcp-prompts>\`;
				case "roots":
					return html\`<mcp-roots></mcp-roots>\`;
				default:
					return html\`<div class="text-center p-8 text-[#928374]">View not implemented: \${tab.key}</div>\`;
			}
		},

		render() {
			return html\`
                <uix-tabs
                    class="flex flex-col flex-grow flex-1"
                    style="--uix-tabs-font-size: 1rem; --uix-tabs-active-background-color: var(--colors-red-700); --uix-tabs-border-color: var(--colors-red-800); --uix-tabs-text: #ebdbb2; --uix-tabs-active-text: #ebdbb2;"
                    .activeTab=\${this.activeTab}
                    .selectTab=\${this.selectTab.bind(this)}
                    .tabs=\${this.tabs.map((tab) => [
											html\`<uix-icon name=\${tab.icon} class="mr-2"></uix-icon> \${tab.label}\`,
											html\`<div class="p-6 bg-[#282828] flex-grow">\${this._renderTabView(tab)}</div>\`,
										])}
                >
                </uix-tabs>
            \`;
		},
	});

	return {
		tag: "mcp-inspector",
		class: "w-full bg-[#282828] text-[#ebdbb2] flex font-sans text-sm",
		properties: {
			servers: T.array([]),
			transportType: T.string({ sync: "local", defaultValue: "JavaScript" }),
			command: T.string({
				sync: "local",
				defaultValue: "/templates/servers/basic.js",
			}),
			args: T.string({ sync: "local" }),
			history: T.array([]),
			historyUnsubscribe: T.any(null),
			selectedHistoryId: T.any(null),
		},

		connected() {
			this.initializeAI();
		},

		disconnected() {
			if (this.historyUnsubscribe) this.historyUnsubscribe();
		},

		handleHistorySelect(item) {
			this.selectedHistoryId = item ? item.id : null;
		},

		getSelectedHistoryItem() {
			if (!this.selectedHistoryId) return null;
			return (
				this.history.find((item) => item.id === this.selectedHistoryId) || null
			);
		},

		handleSidebarInput(field, value) {
			this[field] = value;
		},

		async initializeAI() {
			try {
				if (!AI.isInitialized) {
					await AI.init({
						geminiApiKey: "",
						defaultRoots: [
							{
								uri: "file:///",
								name: "Root Filesystem",
								description: "Full filesystem access",
							},
							{
								uri: "file:///home/user/",
								name: "User Home",
								description: "User home directory",
							},
							{
								uri: "config://",
								name: "Configuration",
								description: "Application configuration",
							},
						],
					});
				}
			} catch (error) {
				console.error("Error initializing AI service:", error);
			}
		},

		async connectToServer() {
			if (!this.command) {
				console.error("Connection command/URL cannot be empty.");
				return;
			}

			try {
				const transportConfig = {
					type: this.transportType,
					command: this.command,
					args: this.args ? this.args.split(" ") : [],
				};

				const alias = \`inspector_server_\${Date.now()}\`;

				await AI.connect(transportConfig, { alias });

				this.servers = [...this.servers, { alias, ...transportConfig }];

				this.command = "";
				this.args = "";
			} catch (e) {
				console.error("Failed to connect:", e);
			}
		},

		async disconnectFromServer(alias) {
			try {
				await AI.disconnect(alias);
				this.servers = this.servers.filter((s) => s.alias !== alias);
			} catch (e) {
				console.error(\`Failed to disconnect \${alias}:\`, e);
			}
		},

		render() {
			const selectedHistoryItem = this.getSelectedHistoryItem();
			return html\`
                <mcp-inspector-sidebar
                    .servers=\${this.servers}
                    .onConnect=\${this.connectToServer.bind(this)}
                    .onDisconnect=\${this.disconnectFromServer.bind(this)}
                    .transportType=\${this.transportType}
                    .command=\${this.command}
                    .args=\${this.args}
                    .onInput=\${this.handleSidebarInput.bind(this)}
                ></mcp-inspector-sidebar>
                <main class="flex-1 flex flex-col">
                    \${
											this.servers.length > 0
												? html\`<mcp-tabs
                              .selectedHistoryItem=\${selectedHistoryItem}
                              .onDeselectHistoryItem=\${() => this.handleHistorySelect(null)}
                          ></mcp-tabs>\`
												: html\`
                              <div
                                  class="flex-grow flex items-center justify-center bg-[#282828]"
                              >
                                  <div class="text-center">
                                      <h3
                                          class="text-lg font-semibold text-[#ebdbb2]"
                                      >
                                          Not Connected
                                      </h3>
                                      <p class="text-[#bdae93] mt-1">
                                          Please connect to a server using the
                                          sidebar to begin.
                                      </p>
                                  </div>
                              </div>
                          \`
										}
                </main>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/lucide/chevron-down.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/templates/servers/basic.js":{content:`import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

export default () => {
	const server = new McpServer(
		{
			name: "example-server",
			version: "0.1.0",
		},
		{
			capabilities: {
				tools: {},
				resources: { subscribe: true },
				logging: {},
				prompts: {},
				sampling: {},
				elicitation: {},
			},
		},
	);

	// In-memory data storage
	const dataStore = {
		users: [
			{ id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
			{ id: 2, name: "Bob", email: "bob@example.com", role: "user" },
			{ id: 3, name: "Charlie", email: "charlie@example.com", role: "user" },
		],
		posts: [
			{
				id: 1,
				title: "Welcome Post",
				content: "Welcome to our platform!",
				authorId: 1,
			},
			{
				id: 2,
				title: "Getting Started",
				content: "Here's how to get started...",
				authorId: 1,
			},
		],
		settings: {
			theme: "dark",
			language: "en",
			notifications: true,
			maxUsers: 100,
		},
	};

	const subscriptions = new Set();

	server.registerTool(
		"echo",
		{
			title: "Echo Tool",
			description: "Echo back the input text with optional formatting",
			inputSchema: {
				text: z.string().describe("Text to echo back"),
				uppercase: z.boolean().optional().describe("Convert to uppercase"),
				repeat: z
					.number()
					.min(1)
					.max(5)
					.optional()
					.default(1)
					.describe("Number of times to repeat"),
			},
		},
		async ({ text, uppercase = false, repeat = 1 }) => {
			let result = uppercase ? text.toUpperCase() : text;
			result = Array(repeat).fill(result).join(" | ");

			return {
				content: [
					{
						type: "text",
						text: \`Echo: \${result}\`,
					},
				],
			};
		},
	);

	// Math calculator tool
	server.registerTool(
		"calculate",
		{
			title: "Calculator",
			description: "Perform basic mathematical operations",
			inputSchema: {
				operation: z
					.enum(["add", "subtract", "multiply", "divide", "power"])
					.describe("Mathematical operation to perform"),
				a: z.number().describe("First number"),
				b: z.number().describe("Second number"),
			},
		},
		async ({ operation, a, b }) => {
			let result;

			switch (operation) {
				case "add":
					result = a + b;
					break;
				case "subtract":
					result = a - b;
					break;
				case "multiply":
					result = a * b;
					break;
				case "divide":
					if (b === 0) throw new Error("Division by zero is not allowed");
					result = a / b;
					break;
				case "power":
					result = a ** b;
					break;
			}

			return {
				content: [
					{
						type: "text",
						text: \`\${a} \${operation} \${b} = \${result}\`,
					},
				],
			};
		},
	);

	// User management tool with elicitation
	server.registerTool(
		"manage_user",
		{
			title: "User Management",
			description: "Create, update, or delete users",
			inputSchema: {
				action: z
					.enum(["create", "update", "delete", "list"])
					.describe("Action to perform"),
				userId: z
					.number()
					.optional()
					.describe("User ID (required for update/delete)"),
				name: z.string().optional().describe("User name (required for create)"),
				email: z
					.string()
					.email()
					.optional()
					.describe("User email (required for create)"),
				role: z.enum(["admin", "user"]).optional().describe("User role"),
			},
		},
		async ({ action, userId, name, email, role }) => {
			switch (action) {
				case "list": {
					return {
						content: [
							{
								type: "text",
								text: \`Users:\\n\${dataStore.users.map((u) => \`\${u.id}: \${u.name} (\${u.email}) - \${u.role}\`).join("\\n")}\`,
							},
						],
					};
				}
				case "create": {
					if (!name || !email)
						throw new Error("Name and email are required for creating a user");
					const newUser = {
						id: Math.max(...dataStore.users.map((u) => u.id)) + 1,
						name,
						email,
						role: role || "user",
					};
					dataStore.users.push(newUser);

					// Notify subscribers
					if (subscriptions.has("data://users")) {
						server.notifyResourceUpdated("data://users");
					}

					return {
						content: [
							{
								type: "text",
								text: \`Created user: \${newUser.name} (ID: \${newUser.id})\`,
							},
						],
					};
				}
				case "update": {
					if (!userId) throw new Error("User ID is required for updating");
					const userIndex = dataStore.users.findIndex((u) => u.id === userId);
					if (userIndex === -1)
						throw new Error(\`User with ID \${userId} not found\`);

					if (name) dataStore.users[userIndex].name = name;
					if (email) dataStore.users[userIndex].email = email;
					if (role) dataStore.users[userIndex].role = role;

					// Notify subscribers
					if (subscriptions.has("data://users")) {
						server.notifyResourceUpdated("data://users");
					}
					if (subscriptions.has(\`data://users/\${userId}\`)) {
						server.notifyResourceUpdated(\`data://users/\${userId}\`);
					}

					return {
						content: [
							{
								type: "text",
								text: \`Updated user: \${dataStore.users[userIndex].name}\`,
							},
						],
					};
				}
				case "delete": {
					if (!userId) throw new Error("User ID is required for deletion");
					const deleteIndex = dataStore.users.findIndex((u) => u.id === userId);
					if (deleteIndex === -1)
						throw new Error(\`User with ID \${userId} not found\`);

					const deletedUser = dataStore.users.splice(deleteIndex, 1)[0];

					// Notify subscribers
					if (subscriptions.has("data://users")) {
						server.notifyResourceUpdated("data://users");
					}

					return {
						content: [
							{
								type: "text",
								text: \`Deleted user: \${deletedUser.name}\`,
							},
						],
					};
				}
			}
		},
	);

	// NEW: Delete user with confirmation using elicitation
	server.registerTool(
		"delete_user_with_confirmation",
		{
			title: "Delete User with Confirmation",
			description: "Deletes a user after confirming with the user",
			inputSchema: {
				userId: z.number().describe("ID of the user to delete"),
				force: z
					.boolean()
					.optional()
					.describe("Skip confirmation if true (default: false)"),
			},
		},
		async ({ userId, force = false }) => {
			const userIndex = dataStore.users.findIndex((u) => u.id === userId);
			if (userIndex === -1) {
				throw new Error(\`User with ID \${userId} not found\`);
			}

			const user = dataStore.users[userIndex];

			if (!force) {
				const result = await server.server.elicitInput({
					message: \`Are you sure you want to delete user "\${user.name}" (\${user.email})?\`,
					requestedSchema: {
						type: "object",
						properties: {
							confirm: {
								type: "boolean",
								title: "Confirm deletion",
								description: \`Confirm deletion of user "\${user.name}"\`,
							},
							transferPosts: {
								type: "boolean",
								title: "Transfer posts",
								description: "Transfer user's posts to another user",
								default: false,
							},
							newAuthorId: {
								type: "number",
								title: "New author ID",
								description:
									"ID of user to transfer posts to (if transferring)",
							},
						},
						required: ["confirm"],
					},
				});

				if (result.action !== "accept" || !result.content?.confirm) {
					return {
						content: [
							{
								type: "text",
								text: \`Deletion cancelled by user for \${user.name}\`,
							},
						],
					};
				}

				if (result.content?.transferPosts && result.content?.newAuthorId) {
					const newAuthor = dataStore.users.find(
						(u) => u.id === result.content.newAuthorId,
					);
					if (newAuthor) {
						dataStore.posts.forEach((post) => {
							if (post.authorId === userId) {
								post.authorId = result.content.newAuthorId;
							}
						});
						await server.sendLoggingMessage({
							level: "info",
							data: \`Transferred posts from \${user.name} to \${newAuthor.name}\`,
						});
					}
				}
			}

			// Delete the user
			dataStore.users.splice(userIndex, 1);

			// Notify subscribers
			if (subscriptions.has("data://users")) {
				server.notifyResourceUpdated("data://users");
			}

			return {
				content: [
					{
						type: "text",
						text: \`Successfully deleted user: \${user.name}\`,
					},
				],
			};
		},
	);

	// NEW: Generate post content using sampling
	server.registerTool(
		"generate_post",
		{
			title: "Generate Post Content",
			description:
				"Uses AI to generate a blog post with the specified parameters",
			inputSchema: {
				title: z.string().describe("Title of the post"),
				authorId: z.number().describe("ID of the author"),
				topic: z.string().optional().describe("Topic or theme for the post"),
				style: z
					.enum(["professional", "casual", "technical", "creative"])
					.optional()
					.default("professional")
					.describe("Writing style for the post"),
			},
		},
		async ({ title, authorId, topic, style = "professional" }) => {
			const author = dataStore.users.find((u) => u.id === authorId);
			if (!author) {
				throw new Error(\`Author with ID \${authorId} not found\`);
			}

			let generationPrompt = \`Write a blog post with the title "\${title}"\`;
			if (topic) {
				generationPrompt += \` about \${topic}\`;
			}
			generationPrompt += \`. Use a \${style} writing style. Keep it concise (2-3 paragraphs).\`;

			try {
				const response = await server.server.createMessage({
					messages: [
						{
							role: "user",
							content: {
								type: "text",
								text: generationPrompt,
							},
						},
					],
					maxTokens: 500,
					temperature: style === "creative" ? 0.8 : 0.3,
				});

				let generatedContent = "";
				if (response.content.type === "text") {
					generatedContent = response.content.text;
				} else {
					throw new Error("Failed to generate text content");
				}

				// Create the new post
				const newPost = {
					id: Math.max(...dataStore.posts.map((p) => p.id)) + 1,
					title,
					content: generatedContent,
					authorId,
				};

				dataStore.posts.push(newPost);

				// Notify subscribers
				if (subscriptions.has("data://posts")) {
					server.notifyResourceUpdated("data://posts");
				}

				await server.sendLoggingMessage({
					level: "info",
					data: \`Generated post "\${title}" for author \${author.name} in \${style} style\`,
				});

				return {
					content: [
						{
							type: "text",
							text: \`Successfully generated post "\${title}" (ID: \${newPost.id})\\n\\nContent preview:\\n\${generatedContent.substring(0, 200)}\${generatedContent.length > 200 ? "..." : ""}\`,
						},
					],
				};
			} catch (error) {
				await server.sendLoggingMessage({
					level: "error",
					data: \`Failed to generate post: \${error.message}\`,
				});

				throw new Error(\`Post generation failed: \${error.message}\`);
			}
		},
	);

	// Slow operation with progress
	server.registerTool(
		"slow_task",
		{
			title: "Slow Task Simulator",
			description: "Simulates a long-running task with progress updates",
			inputSchema: {
				taskName: z.string().describe("Name of the task to simulate"),
				duration: z.number().min(1).max(10).describe("Duration in seconds"),
			},
		},
		async ({ taskName, duration }, { progress }) => {
			await server.sendLoggingMessage({
				level: "info",
				data: \`Starting task: \${taskName} (\${duration}s)\`,
			});

			const steps = duration * 2; // Update every 500ms
			for (let i = 1; i <= steps; i++) {
				await new Promise((resolve) => setTimeout(resolve, 500));
				progress({ progress: i, total: steps });
			}

			await server.sendLoggingMessage({
				level: "info",
				data: \`Completed task: \${taskName}\`,
			});

			return {
				content: [
					{
						type: "text",
						text: \`Task "\${taskName}" completed successfully after \${duration} seconds!\`,
					},
				],
			};
		},
	);

	// ===== STATIC RESOURCES =====

	// App configuration
	server.registerResource(
		"config",
		"config://app",
		{
			title: "App Configuration",
			description: "Application configuration settings",
			mimeType: "application/json",
		},
		async (uri) => ({
			contents: [
				{
					uri: uri.href,
					mimeType: "application/json",
					text: JSON.stringify(
						{
							name: "MCP Dev Server",
							version: "1.0.0",
							features: ["tools", "resources", "templates"],
							status: "active",
							...dataStore.settings,
						},
						null,
						2,
					),
				},
			],
		}),
	);

	// Users list resource
	server.registerResource(
		"data_users",
		"data://users",
		{
			title: "Users List",
			description: "List of all users in the system",
			mimeType: "application/json",
		},
		async (uri) => ({
			contents: [
				{
					uri: uri.href,
					mimeType: "application/json",
					text: JSON.stringify(dataStore.users, null, 2),
				},
			],
		}),
	);

	// Posts list resource
	server.registerResource(
		"data_posts",
		"data://posts",
		{
			title: "Posts List",
			description: "List of all posts in the system",
			mimeType: "application/json",
		},
		async (uri) => ({
			contents: [
				{
					uri: uri.href,
					mimeType: "application/json",
					text: JSON.stringify(dataStore.posts, null, 2),
				},
			],
		}),
	);

	// ===== RESOURCE TEMPLATES =====

	// Individual user resource template
	server.registerResource(
		"data_users_template",
		new ResourceTemplate("data://users/{id}", {
			list: undefined,
		}),
		{
			title: "User Resource",
			description: "Individual user data by ID",
		},
		async (uri, { id }) => {
			const userId = Number.parseInt(id);
			const user = dataStore.users.find((u) => u.id === userId);

			if (!user) {
				throw new Error(\`User with ID \${userId} not found\`);
			}

			// Include user's posts
			const userPosts = dataStore.posts.filter((p) => p.authorId === userId);
			const userData = {
				...user,
				posts: userPosts,
			};

			return {
				contents: [
					{
						uri: uri.href,
						mimeType: "application/json",
						text: JSON.stringify(userData, null, 2),
					},
				],
			};
		},
	);

	// Individual post resource template
	server.registerResource(
		"data_posts_template",
		new ResourceTemplate("data://posts/{id}", {
			list: undefined,
		}),
		{
			title: "Post Resource",
			description: "Individual post data by ID",
		},
		async (uri, { id }) => {
			const postId = Number.parseInt(id);
			const post = dataStore.posts.find((p) => p.id === postId);

			if (!post) {
				throw new Error(\`Post with ID \${postId} not found\`);
			}

			// Include author information
			const author = dataStore.users.find((u) => u.id === post.authorId);
			const postData = {
				...post,
				author: author ? { name: author.name, email: author.email } : null,
			};

			return {
				contents: [
					{
						uri: uri.href,
						mimeType: "application/json",
						text: JSON.stringify(postData, null, 2),
					},
				],
			};
		},
	);

	// Dynamic report template
	server.registerResource(
		"reports",
		new ResourceTemplate("reports://{type}/{format}", {
			list: undefined,
		}),
		{
			title: "Dynamic Reports",
			description: "Generate various reports in different formats",
		},
		async (uri, { type, format }) => {
			let reportData;
			let mimeType;

			// Generate report based on type
			switch (type) {
				case "users":
					reportData = {
						title: "User Report",
						generated: new Date().toISOString(),
						summary: {
							total: dataStore.users.length,
							admins: dataStore.users.filter((u) => u.role === "admin").length,
							users: dataStore.users.filter((u) => u.role === "user").length,
						},
						users: dataStore.users,
					};
					break;
				case "posts":
					reportData = {
						title: "Posts Report",
						generated: new Date().toISOString(),
						summary: {
							total: dataStore.posts.length,
							byAuthor: dataStore.users.map((u) => ({
								author: u.name,
								count: dataStore.posts.filter((p) => p.authorId === u.id)
									.length,
							})),
						},
						posts: dataStore.posts,
					};
					break;
				default:
					throw new Error(\`Unknown report type: \${type}\`);
			}

			// Format the report
			let content;
			switch (format) {
				case "json":
					mimeType = "application/json";
					content = JSON.stringify(reportData, null, 2);
					break;
				case "csv":
					mimeType = "text/csv";
					if (type === "users") {
						content =
							"ID,Name,Email,Role\\n" +
							dataStore.users
								.map((u) => \`\${u.id},\${u.name},\${u.email},\${u.role}\`)
								.join("\\n");
					} else {
						content =
							"ID,Title,Author ID\\n" +
							dataStore.posts
								.map((p) => \`\${p.id},\${p.title},\${p.authorId}\`)
								.join("\\n");
					}
					break;
				case "txt":
					mimeType = "text/plain";
					content = \`\${reportData.title}\\nGenerated: \${reportData.generated}\\n\\n\${JSON.stringify(reportData.summary, null, 2)}\`;
					break;
				default:
					throw new Error(\`Unknown format: \${format}\`);
			}

			return {
				contents: [
					{
						uri: uri.href,
						mimeType,
						text: content,
					},
				],
			};
		},
	);

	// ===== PROMPTS =====

	server.registerPrompt(
		"simple_greeting",
		{
			title: "Simple Greeting",
			description: "A basic greeting prompt",
		},
		() => ({
			messages: [
				{
					role: "user",
					content: {
						type: "text",
						text: "Please greet the user in a friendly and professional manner.",
					},
				},
			],
		}),
	);

	server.registerPrompt(
		"analyze_user_data",
		{
			title: "Analyze User Data",
			description: "Analyze user data with specific parameters",
			argsSchema: {
				userId: z.number().describe("ID of the user to analyze"),
				includeStats: z
					.boolean()
					.default(true)
					.describe("Include statistical analysis"),
			},
		},
		({ userId, includeStats }) => ({
			messages: [
				{
					role: "user",
					content: {
						type: "text",
						text: \`Please analyze the user data for user ID \${userId}.\${includeStats ? " Include detailed statistics and insights." : " Provide a basic summary only."}\`,
					},
				},
				{
					role: "user",
					content: {
						type: "resource",
						uri: \`data://users/\${userId}\`,
					},
				},
			],
		}),
	);

	server.registerPrompt(
		"summarize_post",
		{
			title: "Summarize Post",
			description: "Generate a summary of a specific post",
			argsSchema: {
				postId: z.number().describe("ID of the post to summarize"),
			},
		},
		({ postId }) => ({
			messages: [
				{
					role: "user",
					content: {
						type: "text",
						text: "Please provide a concise summary of the following post:",
					},
				},
				{
					role: "user",
					content: {
						type: "resource",
						uri: \`data://posts/\${postId}\`,
					},
				},
			],
		}),
	);

	return server;
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/navigation/tabs.js":{content:`export default ({ T, html }) => ({
	tag: "uix-tabs",
	style: true,
	class: "overflow-auto",
	properties: {
		tabs: T.array(),
		selectTab: T.function(),
		removeTab: T.function(),
		activeTab: T.number({ defaultValue: 0 }),
		toggle: T.boolean(false),
	},

	async __selectTab(_tabId) {
		const newActiveTab = this.toggle && this.activeTab === _tabId ? -1 : _tabId;

		if (this.selectTab) {
			await this.selectTab(newActiveTab);
		}

		this.activeTab = newActiveTab;
	},

	_removeTab(tabId, e) {
		e.stopPropagation();
		if (this.removeTab) {
			this.removeTab(tabId);
		}
	},

	render() {
		if (!this.tabs || this.tabs.length === 0) {
			return null;
		}

		return html\`
            <div class="tab-headers" role="tablist">
                \${this.tabs.map(
									([name], tabId) => html\`
                    <uix-link
                        role="tab"
                        @click=\${() => this.__selectTab(tabId)}
                        .label=\${name}
                        ?selected=\${tabId === this.activeTab}
                        ?closable=\${!!this.closeTab}
                        @close=\${(e) => this.__closeTab(e, tabId)}
                        skipRoute
                        padding=\${this.padding}
                        text="center"
												class="py-1 text-lg"
                    >								
									\${!this.removeTab ? null : html\`<uix-icon name="x" class="w-3 close" @click=\${((e) => this._removeTab(tabId, e)).bind(this)}></uix-icon>\`}
									</uix-link>
                \`,
								)}
            </div>

            <div class="flex flex-1 overflow-auto" role="tabpanel">
                \${this.tabs[this.activeTab] ? this.tabs[this.activeTab][1] : ""}
            </div>
        \`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/navigation/tabs.css":{content:`.uix-tabs {
	display: flex;
	flex-direction: column;
	flex-grow: 1;

	.tab-headers {
		display: flex;
		flex-direction: row;
		flex-shrink: 0;
		background-color: var(--uix-tabs-background-color, #2a2a2a);
		border-bottom: 2px solid var(--uix-tabs-border-color, #005a99);
	}

	.tab-headers > uix-link {
		flex: 1;
		text-align: center;
		cursor: pointer;
		line-height: var(--uix-tabs-line-height, 2rem);
		font-size: var(--uix-tabs-font-size, 0.75rem);
		border-radius: var(--uix-tabs-border-radius, 0);
		color: var(--uix-tabs-text, #eee);
		transition:
			background-color 0.2s ease-in-out,
			color 0.2s ease-in-out;
		.close {
			visibility: hidden;
		}
	}
	.tab-headers > uix-link:hover {
		background-color: var(--uix-tabs-active-background-color, #007acc);
		a {
			color: #fff;
		}
		.close {
			visibility: visible;
		}
	}
	.tab-headers > uix-link[selected] {
		font-weight: var(--uix-tabs-font-weight, 600);
		background-color: var(--uix-tabs-active-background-color, #007acc);
		color: var(--uix-tabs-active-text, #fff);
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/apps/mcp/views/dashboard.js":{content:`export default ({ html, T }) => ({
	style: true,
	properties: {
		selectedHistoryItem: T.object(null),
		onDeselectHistoryItem: T.function(),
	},

	_renderCard(title, content) {
		return html\`
                <uix-card class="flex flex-col min-h-[200px]">
                    <h3 class="font-semibold mb-3">\${title}</h3>
                    <div class="flex-grow overflow-y-auto pr-2">\${content}</div>
                </uix-card>
            \`;
	},

	render() {
		return html\`
              <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <mcp-tools viewMode="flow" class="block h-60"></mcp-tools>
        <mcp-prompts viewMode="flow" class="block h-60"></mcp-prompts>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <mcp-resources viewMode="flow" resourceType="resources" class="block h-60"></mcp-resources>
        <mcp-resources viewMode="flow" resourceType="templates" class="block h-60"></mcp-resources>
    </div>
</div>

            \`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/dashboard.css":{content:`.mcp-dashboard {
	.uix-card {
		button {
			color: #111;
			cursor: pointer;
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/apps/mcp/views/prompts.js":{content:`export default ({ html, AI, T }) => {
	return {
		tag: "mcp-prompts",
		properties: {
			prompts: T.array([]),
			selectedPrompt: T.object(null),
			promptArgs: T.object({}),
			isExecuting: T.boolean(false),
			isLoading: T.boolean(true),
			viewMode: T.string({ defaultValue: "side-by-side" }),
			promptResponse: T.any(null),
		},
		connected() {
			this.loadPrompts();
		},
		async loadPrompts() {
			this.isLoading = true;
			try {
				const servers = AI.listClients();
				if (servers && servers.length > 0) {
					const { prompts } = await AI.listPrompts({ servers });
					console.log({ prompts });
					this.prompts = prompts || [];
				}
			} catch (error) {
				console.error("Error loading prompts:", error);
				this.prompts = [];
			} finally {
				this.isLoading = false;
			}
		},
		selectPrompt(prompt) {
			this.selectedPrompt = prompt;
			this.promptArgs = {};
			this.promptResponse = null;
		},
		clearSelectedPrompt() {
			this.selectedPrompt = null;
			this.promptResponse = null;
		},
		handleArgInput(paramName, event) {
			this.promptArgs = {
				...this.promptArgs,
				[paramName]: event.target.value,
			};
		},
		async handleGetPrompt() {
			if (!this.selectedPrompt) return;

			this.isExecuting = true;
			this.promptResponse = null;
			try {
				const { name } = this.selectedPrompt;
				const args = this.promptArgs;

				const response = await AI.getPrompt({ name, arguments: args });
				this.promptResponse = response;
			} catch (error) {
				console.error("Error executing prompt:", error);
				this.promptResponse = {
					error: error.message || "An unknown error occurred.",
				};
			} finally {
				this.isExecuting = false;
			}
		},

		// Shared rendering methods
		_renderPromptList(showBackButton = false) {
			if (this.isLoading) {
				return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">Loading...</p></div>\`;
			}
			if (!this.prompts.length) {
				return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">No prompts found.</p></div>\`;
			}
			return html\`
				<div class="flex-1 overflow-y-auto p-2">
					<h3 class="font-semibold text-sm p-2 text-gray-800">Prompts</h3>
					<ul>
						\${this.prompts.map(
							(prompt) => html\`
								<li>
									<button 
										@click=\${() => this.selectPrompt(prompt)} 
										class="w-full text-left p-2 rounded text-sm hover:bg-gray-100 \${
											this.selectedPrompt?.name === prompt.name
												? "bg-blue-50 font-semibold text-blue-700"
												: ""
										}"
									>
										<p class="font-mono text-xs">\${prompt.name}</p>
										<p class="text-xs text-gray-500 truncate">\${prompt.description}</p>
									</button>
								</li>
							\`,
						)}
					</ul>
				</div>
			\`;
		},

		_renderResponseView() {
			if (!this.promptResponse) return "";

			if (this.promptResponse.error) {
				return html\`
					<div class="mt-6 border-t pt-4">
						<h4 class="font-semibold text-sm mb-3">Response</h4>
						<div class="bg-red-50 text-red-700 rounded p-3 text-sm font-mono">
							\${this.promptResponse.error}
						</div>
					</div>
				\`;
			}

			return html\`
				<div class="mt-6 border-t pt-4">
					<h4 class="font-semibold text-sm mb-3">Response</h4>
					<div class="space-y-4">
						\${this.promptResponse.messages.map(
							(msg) => html\`
								<div class="dark bg-gray-100  text-gray-800 rounded p-3">
									<div class="text-xs font-bold uppercase text-gray-500 mb-1">\${msg.role}</div>
									\${
										msg.content.type === "text"
											? html\`<p class="text-sm whitespace-pre-wrap font-mono">\${msg.content.text}</p>\`
											: html\`<div class="text-sm font-mono">Resource: \${msg.content.uri}</div>\`
									}
								</div>
							\`,
						)}
					</div>
				</div>
			\`;
		},

		_renderPromptExecutor(showBackButton = false) {
			if (!this.selectedPrompt) {
				return html\`<div class="text-center text-gray-500 h-full flex items-center justify-center">Select a prompt to view details.</div>\`;
			}

			return html\`
				<div class="dark \${showBackButton ? "p-6 overflow-y-auto w-full" : ""}">
					\${
						showBackButton
							? html\`
						<button @click=\${this.clearSelectedPrompt.bind(this)} class="dark flex items-center text-sm text-blue-600 hover:underline mb-4">
							<uix-icon name="arrow-left" class="w-4 h-4 mr-2"></uix-icon>
							Back to list
						</button>
					\`
							: ""
					}
					<h3 class="font-bold text-lg mb-2">\${this.selectedPrompt.name}</h3>
					<p class="text-xs text-gray-200 mb-6">\${this.selectedPrompt.description}</p>
					
					\${
						this.promptResponse
							? this._renderResponseView()
							: html\`<h4 class="font-semibold text-sm mb-3">Parameters</h4>
					<div class="space-y-4">
						\${
							Array.isArray(this.selectedPrompt.arguments) &&
							this.selectedPrompt.arguments.length
								? this.selectedPrompt.arguments.map(
										(arg) =>
											!console.log(arg) &&
											html\`
											<uix-input
												label=\${arg.name}
                        type=\${arg.enum ? "select" : { boolean: "checkbox", enum: "select" }[arg.type] || "text"}
												value=\${this.promptArgs[arg.name] || ""}
												@input=\${(e) => this.handleArgInput(arg.name, e)}
												placeholder=\${arg.description || arg.name}
												class="font-mono text-xs"
											></uix-input>
										\`,
									)
								: html\`<p class="text-xs text-gray-300">This prompt has no parameters.</p>\`
						}
					</div>
					<div class="mt-8 border-t pt-6">
						<uix-button
							label=\${this.isExecuting ? "Executing..." : "Get Prompt"}
							class="is-primary"
							@click=\${this.handleGetPrompt.bind(this)}
							?disabled=\${this.isExecuting}
						></uix-button>
					</div>\`
					}
				</div>
			\`;
		},
		_renderFlowView() {
			if (this.selectedPrompt) {
				return this._renderPromptExecutor(true);
			}
			return this._renderPromptList();
		},

		_renderSideBySideView() {
			return html\`
				<div class="w-1/3 flex flex-col border-r border-gray-200">
					\${this._renderPromptList()}
				</div>
				<div class="w-2/3 p-6 overflow-y-auto">
					\${this._renderPromptExecutor(false)}
				</div>
			\`;
		},

		render() {
			return html\`
				<uix-card class="bg-[#3c3836] h-full overflow-y-auto">
					<div class="dark">
						\${this.viewMode === "flow" ? this._renderFlowView() : this._renderSideBySideView()}
					</div>
				</uix-card>
			\`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/resources.js":{content:`export default ({ html, AI, T }) => {
	return {
		tag: "mcp-resources",
		properties: {
			resourceType: T.string(),
			viewMode: T.string({ defaultValue: "side-by-side" }),
			resources: T.array([]),
			resourceTemplates: T.array([]),
			isLoading: T.boolean(true),
			selectedResource: T.object(null),
			selectedTemplate: T.object(null),
			resourceArgs: T.object({}),
			isExecuting: T.boolean(false),
			resourceResponse: T.any(null),
		},
		connected() {
			this.loadData();
		},
		async loadData() {
			this.isLoading = true;
			try {
				const servers = AI.listClients();
				if (servers && servers.length > 0) {
					const [{ resources }, { resourceTemplates }] = await Promise.all([
						AI.listResources({ servers }),
						AI.listResourceTemplates({ servers }),
					]);
					this.resources = resources || [];
					this.resourceTemplates = resourceTemplates || [];
				}
			} catch (error) {
				console.error("Error loading resources:", error);
				this.resources = [];
				this.resourceTemplates = [];
			} finally {
				this.isLoading = false;
			}
		},
		async handleReadResource() {
			const resource = this.selectedResource || this.selectedTemplate;
			const isTemplate = !!this.selectedTemplate;
			const uriTemplate = isTemplate ? resource.uriTemplate : resource.uri;

			const uri = Object.entries(this.resourceArgs).reduce(
				(acc, [key, value]) => acc.replace(\`{\${key}}\`, value),
				uriTemplate,
			);

			this.isExecuting = true;
			this.resourceResponse = null;
			try {
				const response = await AI.readResource({ uri });
				this.resourceResponse = response;
				console.log({ response });
			} catch (e) {
				console.error(\`Failed to read resource \${uri}:\`, e);
				this.resourceResponse = {
					error: e.message || "An unknown error occurred.",
				};
			} finally {
				this.isExecuting = false;
			}
		},
		selectResource(res) {
			this.selectedResource = res;
			this.selectedTemplate = null;
			this.resourceArgs = {};
			this.resourceResponse = null;
		},
		selectTemplate(template) {
			this.selectedTemplate = template;
			this.selectedResource = null;
			this.resourceArgs = {};
			this.resourceResponse = null;
		},
		deselectReaderView() {
			this.selectedResource = null;
			this.selectedTemplate = null;
			this.resourceResponse = null;
		},
		handleResourceArgInput(paramName, event) {
			this.resourceArgs = {
				...this.resourceArgs,
				[paramName]: event.target.value,
			};
		},
		_extractUriParams(uri) {
			const regex = /\\{(.+?)\\}/g;
			return [...uri.matchAll(regex)].map((match) => match[1]);
		},

		_renderReaderContent() {
			const resource = this.selectedResource || this.selectedTemplate;
			if (!resource) return "";

			const isTemplate = !!this.selectedTemplate;
			const uri = isTemplate ? resource.uriTemplate : resource.uri;
			const uriParams = isTemplate ? this._extractUriParams(uri) : [];

			return html\`
                <div>
                    <h4 class="font-bold text-sm mb-1 dark font-mono">\${uri}</h4>
                    <p class="text-xs text-gray-600 mb-4">\${resource.description || "No description provided."}</p>
                    
                    \${
											!isTemplate
												? null
												: html\`<div class="space-y-3">
                        \${
													uriParams.length > 0
														? uriParams.map(
																(paramName) => html\`
                                        <div>
                                            <label class="block text-xs font-medium text-gray-600 mb-1">\${paramName}</label>
                                            <uix-input
                                                .value=\${this.resourceArgs[paramName] || ""}
                                                @input=\${(e) => this.handleResourceArgInput(paramName, e)}
                                                placeholder="Enter value for \${paramName}"
                                                class="font-mono text-xs"
                                            ></uix-input>
                                        </div>
                                    \`,
															)
														: html\`<p class="text-xs text-gray-500">This resource takes no parameters.</p>\`
												}
                    </div>\`
										}
                    <div class="mt-4 border-t pt-4">
                        <uix-button
                            label=\${this.isExecuting ? "Reading..." : "Read Resource"}
                            class="is-primary w-full"
                            @click=\${this.handleReadResource.bind(this)}
                            ?disabled=\${this.isExecuting}
                        ></uix-button>
                    </div>
                </div>
            \`;
		},

		_renderResponseView() {
			if (!this.resourceResponse) return "";
			return html\`
                <div class="mt-6 border-t pt-4 dark">
									<h4 class="font-semibold text-sm mb-3">Response</h4>
                    \${
											this.resourceResponse.error
												? html\`<div class="bg-red-50 text-red-700 rounded p-3 text-sm font-mono">\${this.resourceResponse.error}</div>\`
												: html\`<pre class="text-xs whitespace-pre-wrap bg-gray-800 text-gray-200 p-2 rounded-lg font-mono overflow-auto">\${this.resourceResponse?.contents?.[0]?.text}</pre>\`
										}
                </div>
            \`;
		},

		_renderList() {
			return html\`
                <ul class="text-xs font-mono space-y-1">
                    \${
											this.resourceType === "resources" || !this.resourceType
												? this.resources.map(
														(
															res,
														) => html\`<li><button @click=\${() => this.selectResource(res)} class="w-full text-left p-2 rounded text-sm hover:bg-gray-100 \${this.selectedResource?.uri === res.uri ? "bg-blue-50 font-semibold text-blue-700" : ""}">
                        <p class="font-mono text-sm flex items-center"><uix-icon name="file-text" class="w-4 h-4 mr-2 text-gray-500"></uix-icon>\${res.uri}</p>
                    </button></li>\`,
													)
												: null
										}
                    \${
											this.resourceType === "templates" || !this.resourceType
												? this.resourceTemplates.map(
														(
															template,
														) => html\`<li><button @click=\${() => this.selectTemplate(template)} class="w-full text-left p-2 rounded text-sm hover:bg-gray-100 \${this.selectedTemplate?.uriTemplate === template.uriTemplate ? "bg-blue-50 font-semibold text-blue-700" : ""}">
                        <p class="font-mono text-sm flex items-center"><uix-icon name="file-code-2" class="w-4 h-4 mr-2 text-blue-600"></uix-icon>\${template.uriTemplate}</p>
                    </button></li>\`,
													)
												: null
										}
                </ul>
             \`;
		},
		_generateTitle() {
			const titles = {
				resources: "Resources",
				templates: "Templates",
			};
			const title = titles[this.resourceType] || "Resources & Templates";
			return html\`<h3 class="font-semibold text-sm p-2 text-gray-800">\${title}</h3>\`;
		},
		_renderFlowView() {
			if (this.isLoading) {
				return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">Loading...</p></div>\`;
			}
			if (this.selectedResource || this.selectedTemplate) {
				return html\`
                    <div class="p-6 overflow-y-auto w-full">
                        <button @click=\${() => this.deselectReaderView()} class="flex items-center text-sm text-blue-600 hover:underline mb-4">
                            <uix-icon name="arrow-left" class="w-4 h-4 mr-2"></uix-icon>
                            Back to list
                        </button>
                        \${this.resourceResponse ? this._renderResponseView() : this._renderReaderContent()}                        
                    </div>
                \`;
			}
			return html\`
                <div class="flex-1 overflow-y-auto p-2">
									\${this._generateTitle()}
                  \${this._renderList()}
                </div>
            \`;
		},

		_renderSideBySideView() {
			if (this.isLoading) {
				return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">Loading...</p></div>\`;
			}
			return html\`
                <div class="w-1/3 flex flex-col border-r border-gray-200 p-2 overflow-y-auto">
									\${this._generateTitle()}
                    \${this._renderList()}
                </div>
                <div class="w-2/3 p-6 overflow-y-auto">
                    \${
											this.selectedResource || this.selectedTemplate
												? html\`
                            \${this._renderReaderContent()}
                            \${this._renderResponseView()}
                        \`
												: html\`<div class="text-center text-gray-500 h-full flex items-center justify-center">Select an item to view details.</div>\`
										}
                </div>
            \`;
		},

		render() {
			return html\`
                <uix-card class="h-full bg-[#3c3836] overflow-y-auto">
									<div class="dark">\${this.viewMode === "flow" ? this._renderFlowView() : this._renderSideBySideView()}</div>
								</uix-card>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/tools.js":{content:`export default ({ html, AI, T }) => {
	return {
		tag: "mcp-tools",
		properties: {
			tools: T.array([]),
			selectedTool: T.object(null),
			toolArgs: T.object({}),
			isExecuting: T.boolean(false),
			isLoading: T.boolean(true),
			viewMode: T.string({ defaultValue: "side-by-side" }), // 'side-by-side' or 'flow'
			toolResponse: T.any(null),
		},

		connected() {
			this.loadTools();
		},

		async loadTools() {
			this.isLoading = true;
			try {
				const servers = AI.listClients();
				if (servers && servers.length > 0) {
					const { tools } = await AI.listTools({ servers });
					this.tools = tools || [];
				}
			} catch (error) {
				console.error("Error loading tools:", error);
				this.tools = [];
			} finally {
				this.isLoading = false;
			}
		},

		selectTool(tool) {
			this.selectedTool = tool;
			this.toolArgs = {};
			this.toolResponse = null;
		},

		clearSelectedTool() {
			this.selectedTool = null;
			this.toolResponse = null;
		},

		handleArgInput(paramName, event, schema) {
			this.toolArgs = {
				...this.toolArgs,
				[paramName]:
					schema.type === "number"
						? Number(event.target.value)
						: schema.type === "boolean"
							? !!event.target.checked
							: event.target.value,
			};
		},

		async handleExecuteTool() {
			if (!this.selectedTool) return;

			this.isExecuting = true;
			this.toolResponse = null;
			try {
				const { name } = this.selectedTool;
				const args = this.toolArgs;
				const response = await AI.callTool(name, args);
				this.toolResponse = response;
			} catch (e) {
				console.error(\`Failed to execute tool \${this.selectedTool.name}:\`, e);
				this.toolResponse = {
					error: e.message || "An unknown error occurred.",
				};
			} finally {
				this.isExecuting = false;
			}
		},

		// Rendering methods for 'flow' view
		_renderFlowView() {
			if (this.selectedTool) {
				return this._renderToolExecutorFlow();
			}
			return this._renderToolListFlow();
		},
		_renderToolListFlow() {
			if (this.isLoading) {
				return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">Loading...</p></div>\`;
			}
			if (!this.tools.length) {
				return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">No tools found.</p></div>\`;
			}
			return html\`
                <div class="flex-1 overflow-y-auto p-2">
                    <h3 class="font-semibold text-sm p-2 text-gray-800">Tools</h3>
                    <ul>
                        \${this.tools.map(
													(tool) => html\`
                                <li>
                                    <button @click=\${() => this.selectTool(tool)} class="w-full text-left p-2 rounded text-sm hover:bg-gray-100">
                                        <p class="font-mono text-sm">\${tool.name}</p>
                                        <p class="text-xs text-gray-500 truncate">\${tool.description}</p>
                                    </button>
                                </li>
                            \`,
												)}
                    </ul>
                </div>
            \`;
		},

		_renderToolExecutorFlow() {
			const responseView = this.toolResponse
				? html\`
                <div class="mt-6 border-t pt-4 dark">
									<h4 class="font-semibold text-sm mb-3">Response</h4>
                    \${
											this.toolResponse.error
												? html\`<div class="bg-red-50 text-red-700 rounded p-3 text-sm font-mono">\${this.toolResponse.error}</div>\`
												: html\`<pre class="text-xs whitespace-pre-wrap bg-gray-800 text-gray-200 p-2 rounded-lg font-mono overflow-auto">\${this.toolResponse?.content?.[0]?.text}</pre>\`
										}
                </div>
            \`
				: "";

			return html\`
                <div class="p-6 overflow-y-auto w-full">
                     <button @click=\${this.clearSelectedTool.bind(this)} class="flex items-center text-sm text-blue-600 hover:underline mb-4">
                        <uix-icon name="arrow-left" class="w-4 h-4 mr-2"></uix-icon>
                        Back to list
                    </button>
                    \${this.toolResponse ? responseView : this._renderToolExecutorContent()}                    
                </div>
            \`;
		},
		_renderSideBySideView() {
			const toolList = () => {
				if (this.isLoading) {
					return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">Loading...</p></div>\`;
				}
				if (!this.tools.length) {
					return html\`<div class="flex items-center justify-center h-full"><p class="text-xs text-gray-500">No tools found.</p></div>\`;
				}
				return html\`
                    <div class="flex-1 overflow-y-auto p-2">
                        <h3 class="font-semibold text-sm p-2 text-gray-800">Tools</h3>
                        <ul>
                            \${this.tools.map(
															(tool) => html\`
                                    <li>
                                        <button @click=\${() => this.selectTool(tool)} class="w-full text-left p-2 rounded text-sm hover:bg-gray-100 \${this.selectedTool?.name === tool.name ? "bg-blue-50 font-semibold text-blue-700" : ""}">
                                            <p class="font-mono text-xs">\${tool.name}</p>
                                            <p class="text-xs text-gray-500 truncate">\${tool.description}</p>
                                        </button>
                                    </li>
                                \`,
														)}
                        </ul>
                    </div>
                \`;
			};

			const toolExecutor = () => {
				if (!this.selectedTool) {
					return html\`<div class="text-center text-gray-500 h-full flex items-center justify-center">Select a tool to view details.</div>\`;
				}
				const responseView = this.toolResponse
					? html\`
                    <div class="mt-6 border-t pt-4">
                        \${
													this.toolResponse.error
														? html\`<div class="bg-red-50 text-red-700 rounded p-3 text-sm font-mono">\${this.toolResponse.error}</div>\`
														: html\`<pre class="text-xs whitespace-pre-wrap bg-gray-800 text-gray-200 p-2 rounded-lg font-mono overflow-auto">\${this.toolResponse?.contents?.[0]?.text}</pre>\`
												}
                    </div>
                \`
					: "";

				return html\`
                    <div>
                        \${this._renderToolExecutorContent()}
                        \${responseView}
                    </div>
                \`;
			};

			return html\`
                <div class="w-1/3 flex flex-col border-r border-gray-200">
                    \${toolList()}
                </div>
                <div class="w-2/3 p-6 overflow-y-auto">
                    \${toolExecutor()}
                </div>
            \`;
		},

		_renderToolExecutorContent() {
			if (!this.selectedTool) return "";
			return html\`
                <h3 class="font-bold text-lg mb-2  dark">\${this.selectedTool.name}</h3>
                <p class="text-xs text-gray-600 mb-6">\${this.selectedTool.description}</p>
                <h4 class="font-semibold text-sm mb-3 dark">Parameters</h4>
                <div class="space-y-4">
                    \${
											this.selectedTool.inputSchema &&
											Object.keys(this.selectedTool.inputSchema.properties)
												.length > 0
												? Object.entries(
														this.selectedTool.inputSchema.properties,
													).map(
														([paramName, paramSchema]) =>
															html\`<uix-input
                                        label=\${paramName}
                                        type=\${paramSchema.enum ? "select" : { boolean: "checkbox", enum: "select" }[paramSchema.type] || "text"}
                                        .options=\${paramSchema.enum}
                                        value=\${this.toolArgs[paramName] || ""}
                                        @input=\${(e) => this.handleArgInput(paramName, e, paramSchema)}
                                        placeholder=\${paramSchema.description || paramName}
                                        class="font-mono text-xs"
                                    ></uix-input>\`,
													)
												: html\`<p class="text-xs text-gray-500">This tool has no parameters.</p>\`
										}
                </div>
                <div class="mt-8 border-t pt-6">
                    <uix-button
                        label=\${this.isExecuting ? "Executing..." : "Execute"}
                        class="is-primary"
                        @click=\${this.handleExecuteTool.bind(this)}
                        ?disabled=\${this.isExecuting}
                    ></uix-button>
                </div>
            \`;
		},

		render() {
			return html\`<uix-card class="bg-[#3c3836] h-full overflow-y-auto pb-2">
                    <div class="dark">\${this.viewMode === "flow" ? this._renderFlowView() : this._renderSideBySideView()}</div>
								</uix-card>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/lucide/layout-dashboard.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/wrench.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/key.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m15.5 7.5l2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4m2-2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/database.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/terminal.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 17l6-6l-6-6m8 14h8"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/git-branch-plus.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 3v12m12-6a3 3 0 1 0 0-6a3 3 0 0 0 0 6M6 21a3 3 0 1 0 0-6a3 3 0 0 0 0 6"/><path d="M15 6a9 9 0 0 0-9 9m12 0v6m3-3h-6"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/uix/display/card.js":{content:`export default {
	tag: "uix-card",
	style: true,
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/card.css":{content:`:where(.uix-card) {
	display: flex;
	flex-direction: column;
	padding: var(--uix-card-padding, 10px);
	border-width: var(--uix-card-border-size);
	border-radius: var(--uix-card-border-radius, var(--radius-md));
	background-color: var(--uix-card-background-color, #fff);
	border-color: var(--uix-card-border-color, transparent);
	box-shadow: var(--uix-card-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
	list-style-type: var(--uix-card-list-style-type);
	color: var(--uix-card-text-color);

	&[clickable],
	&[clickable] * {
		cursor: pointer;
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/file-text.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8m8 4H8m8 4H8"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/file-code-2.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4M5 12l-3 3l3 3m4 0l3-3l-3-3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/chevron-right.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/style.css":{content:`@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_P-bnBeA.woff2) format("woff2");unicode-range:U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_G-bnBeA.woff2) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_B-bnBeA.woff2) format("woff2");unicode-range:U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_N-bnBeA.woff2) format("woff2");unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_M-bnBeA.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_C-bk.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--un-bg-opacity:100%;--un-text-opacity:100%;--un-translate-x:initial;--un-translate-y:initial;--un-translate-z:initial;--un-ease:initial;--un-border-opacity:100%;--un-space-x-reverse:initial;--un-space-y-reverse:initial;--un-ring-opacity:100%;--un-placeholder-opacity:100%}}@property --un-text-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-border-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-bg-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-ring-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-inset-ring-color{syntax:"*";inherits:false;}@property --un-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-inset-shadow-color{syntax:"*";inherits:false;}@property --un-ring-color{syntax:"*";inherits:false;}@property --un-ring-inset{syntax:"*";inherits:false;}@property --un-ring-offset-color{syntax:"*";inherits:false;}@property --un-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0px;}@property --un-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-shadow-color{syntax:"*";inherits:false;}@property --un-translate-x{syntax:"*";inherits:false;initial-value:0;}@property --un-translate-y{syntax:"*";inherits:false;initial-value:0;}@property --un-translate-z{syntax:"*";inherits:false;initial-value:0;}@property --un-ease{syntax:"*";inherits:false;}@property --un-placeholder-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-space-x-reverse{syntax:"*";inherits:false;initial-value:0;}@property --un-space-y-reverse{syntax:"*";inherits:false;initial-value:0;}:root,:host{--spacing: .25rem;--font-sans: "Manrope",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-serif: ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;--font-mono: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;--font-icon-family: lucide;--colors-black: #000;--colors-white: #fff;--colors-slate-50: oklch(98.4% .003 247.858);--colors-slate-100: oklch(96.8% .007 247.896);--colors-slate-200: oklch(92.9% .013 255.508);--colors-slate-300: oklch(86.9% .022 252.894);--colors-slate-400: oklch(70.4% .04 256.788);--colors-slate-500: oklch(55.4% .046 257.417);--colors-slate-600: oklch(44.6% .043 257.281);--colors-slate-700: oklch(37.2% .044 257.287);--colors-slate-800: oklch(27.9% .041 260.031);--colors-slate-900: oklch(20.8% .042 265.755);--colors-slate-950: oklch(12.9% .042 264.695);--colors-slate-DEFAULT: oklch(70.4% .04 256.788);--colors-gray-50: oklch(98.5% .002 247.839);--colors-gray-100: oklch(96.7% .003 264.542);--colors-gray-200: oklch(92.8% .006 264.531);--colors-gray-300: oklch(87.2% .01 258.338);--colors-gray-400: oklch(70.7% .022 261.325);--colors-gray-500: oklch(55.1% .027 264.364);--colors-gray-600: oklch(44.6% .03 256.802);--colors-gray-700: oklch(37.3% .034 259.733);--colors-gray-800: oklch(27.8% .033 256.848);--colors-gray-900: oklch(21% .034 264.665);--colors-gray-950: oklch(13% .028 261.692);--colors-gray-DEFAULT: oklch(70.7% .022 261.325);--colors-zinc-50: oklch(98.5% 0 0);--colors-zinc-100: oklch(96.7% .001 286.375);--colors-zinc-200: oklch(92% .004 286.32);--colors-zinc-300: oklch(87.1% .006 286.286);--colors-zinc-400: oklch(70.5% .015 286.067);--colors-zinc-500: oklch(55.2% .016 285.938);--colors-zinc-600: oklch(44.2% .017 285.786);--colors-zinc-700: oklch(37% .013 285.805);--colors-zinc-800: oklch(27.4% .006 286.033);--colors-zinc-900: oklch(21% .006 285.885);--colors-zinc-950: oklch(14.1% .005 285.823);--colors-zinc-DEFAULT: oklch(70.5% .015 286.067);--colors-neutral-50: oklch(98.5% 0 0);--colors-neutral-100: oklch(97% 0 0);--colors-neutral-200: oklch(92.2% 0 0);--colors-neutral-300: oklch(87% 0 0);--colors-neutral-400: oklch(70.8% 0 0);--colors-neutral-500: oklch(55.6% 0 0);--colors-neutral-600: oklch(43.9% 0 0);--colors-neutral-700: oklch(37.1% 0 0);--colors-neutral-800: oklch(26.9% 0 0);--colors-neutral-900: oklch(20.5% 0 0);--colors-neutral-950: oklch(14.5% 0 0);--colors-neutral-DEFAULT: oklch(70.8% 0 0);--colors-stone-50: oklch(98.5% .001 106.423);--colors-stone-100: oklch(97% .001 106.424);--colors-stone-200: oklch(92.3% .003 48.717);--colors-stone-300: oklch(86.9% .005 56.366);--colors-stone-400: oklch(70.9% .01 56.259);--colors-stone-500: oklch(55.3% .013 58.071);--colors-stone-600: oklch(44.4% .011 73.639);--colors-stone-700: oklch(37.4% .01 67.558);--colors-stone-800: oklch(26.8% .007 34.298);--colors-stone-900: oklch(21.6% .006 56.043);--colors-stone-950: oklch(14.7% .004 49.25);--colors-stone-DEFAULT: oklch(70.9% .01 56.259);--colors-red-50: oklch(97.1% .013 17.38);--colors-red-100: oklch(93.6% .032 17.717);--colors-red-200: oklch(88.5% .062 18.334);--colors-red-300: oklch(80.8% .114 19.571);--colors-red-400: oklch(70.4% .191 22.216);--colors-red-500: oklch(63.7% .237 25.331);--colors-red-600: oklch(57.7% .245 27.325);--colors-red-700: oklch(50.5% .213 27.518);--colors-red-800: oklch(44.4% .177 26.899);--colors-red-900: oklch(39.6% .141 25.723);--colors-red-950: oklch(25.8% .092 26.042);--colors-red-DEFAULT: oklch(70.4% .191 22.216);--colors-orange-50: oklch(98% .016 73.684);--colors-orange-100: oklch(95.4% .038 75.164);--colors-orange-200: oklch(90.1% .076 70.697);--colors-orange-300: oklch(83.7% .128 66.29);--colors-orange-400: oklch(75% .183 55.934);--colors-orange-500: oklch(70.5% .213 47.604);--colors-orange-600: oklch(64.6% .222 41.116);--colors-orange-700: oklch(55.3% .195 38.402);--colors-orange-800: oklch(47% .157 37.304);--colors-orange-900: oklch(40.8% .123 38.172);--colors-orange-950: oklch(26.6% .079 36.259);--colors-orange-DEFAULT: oklch(75% .183 55.934);--colors-amber-50: oklch(98.7% .022 95.277);--colors-amber-100: oklch(96.2% .059 95.617);--colors-amber-200: oklch(92.4% .12 95.746);--colors-amber-300: oklch(87.9% .169 91.605);--colors-amber-400: oklch(82.8% .189 84.429);--colors-amber-500: oklch(76.9% .188 70.08);--colors-amber-600: oklch(66.6% .179 58.318);--colors-amber-700: oklch(55.5% .163 48.998);--colors-amber-800: oklch(47.3% .137 46.201);--colors-amber-900: oklch(41.4% .112 45.904);--colors-amber-950: oklch(27.9% .077 45.635);--colors-amber-DEFAULT: oklch(82.8% .189 84.429);--colors-yellow-50: oklch(98.7% .026 102.212);--colors-yellow-100: oklch(97.3% .071 103.193);--colors-yellow-200: oklch(94.5% .129 101.54);--colors-yellow-300: oklch(90.5% .182 98.111);--colors-yellow-400: oklch(85.2% .199 91.936);--colors-yellow-500: oklch(79.5% .184 86.047);--colors-yellow-600: oklch(68.1% .162 75.834);--colors-yellow-700: oklch(55.4% .135 66.442);--colors-yellow-800: oklch(47.6% .114 61.907);--colors-yellow-900: oklch(42.1% .095 57.708);--colors-yellow-950: oklch(28.6% .066 53.813);--colors-yellow-DEFAULT: oklch(85.2% .199 91.936);--colors-lime-50: oklch(98.6% .031 120.757);--colors-lime-100: oklch(96.7% .067 122.328);--colors-lime-200: oklch(93.8% .127 124.321);--colors-lime-300: oklch(89.7% .196 126.665);--colors-lime-400: oklch(84.1% .238 128.85);--colors-lime-500: oklch(76.8% .233 130.85);--colors-lime-600: oklch(64.8% .2 131.684);--colors-lime-700: oklch(53.2% .157 131.589);--colors-lime-800: oklch(45.3% .124 130.933);--colors-lime-900: oklch(40.5% .101 131.063);--colors-lime-950: oklch(27.4% .072 132.109);--colors-lime-DEFAULT: oklch(84.1% .238 128.85);--colors-green-50: oklch(98.2% .018 155.826);--colors-green-100: oklch(96.2% .044 156.743);--colors-green-200: oklch(92.5% .084 155.995);--colors-green-300: oklch(87.1% .15 154.449);--colors-green-400: oklch(79.2% .209 151.711);--colors-green-500: oklch(72.3% .219 149.579);--colors-green-600: oklch(62.7% .194 149.214);--colors-green-700: oklch(52.7% .154 150.069);--colors-green-800: oklch(44.8% .119 151.328);--colors-green-900: oklch(39.3% .095 152.535);--colors-green-950: oklch(26.6% .065 152.934);--colors-green-DEFAULT: oklch(79.2% .209 151.711);--colors-emerald-50: oklch(97.9% .021 166.113);--colors-emerald-100: oklch(95% .052 163.051);--colors-emerald-200: oklch(90.5% .093 164.15);--colors-emerald-300: oklch(84.5% .143 164.978);--colors-emerald-400: oklch(76.5% .177 163.223);--colors-emerald-500: oklch(69.6% .17 162.48);--colors-emerald-600: oklch(59.6% .145 163.225);--colors-emerald-700: oklch(50.8% .118 165.612);--colors-emerald-800: oklch(43.2% .095 166.913);--colors-emerald-900: oklch(37.8% .077 168.94);--colors-emerald-950: oklch(26.2% .051 172.552);--colors-emerald-DEFAULT: oklch(76.5% .177 163.223);--colors-teal-50: oklch(98.4% .014 180.72);--colors-teal-100: oklch(95.3% .051 180.801);--colors-teal-200: oklch(91% .096 180.426);--colors-teal-300: oklch(85.5% .138 181.071);--colors-teal-400: oklch(77.7% .152 181.912);--colors-teal-500: oklch(70.4% .14 182.503);--colors-teal-600: oklch(60% .118 184.704);--colors-teal-700: oklch(51.1% .096 186.391);--colors-teal-800: oklch(43.7% .078 188.216);--colors-teal-900: oklch(38.6% .063 188.416);--colors-teal-950: oklch(27.7% .046 192.524);--colors-teal-DEFAULT: oklch(77.7% .152 181.912);--colors-cyan-50: oklch(98.4% .019 200.873);--colors-cyan-100: oklch(95.6% .045 203.388);--colors-cyan-200: oklch(91.7% .08 205.041);--colors-cyan-300: oklch(86.5% .127 207.078);--colors-cyan-400: oklch(78.9% .154 211.53);--colors-cyan-500: oklch(71.5% .143 215.221);--colors-cyan-600: oklch(60.9% .126 221.723);--colors-cyan-700: oklch(52% .105 223.128);--colors-cyan-800: oklch(45% .085 224.283);--colors-cyan-900: oklch(39.8% .07 227.392);--colors-cyan-950: oklch(30.2% .056 229.695);--colors-cyan-DEFAULT: oklch(78.9% .154 211.53);--colors-sky-50: oklch(97.7% .013 236.62);--colors-sky-100: oklch(95.1% .026 236.824);--colors-sky-200: oklch(90.1% .058 230.902);--colors-sky-300: oklch(82.8% .111 230.318);--colors-sky-400: oklch(74.6% .16 232.661);--colors-sky-500: oklch(68.5% .169 237.323);--colors-sky-600: oklch(58.8% .158 241.966);--colors-sky-700: oklch(50% .134 242.749);--colors-sky-800: oklch(44.3% .11 240.79);--colors-sky-900: oklch(39.1% .09 240.876);--colors-sky-950: oklch(29.3% .066 243.157);--colors-sky-DEFAULT: oklch(74.6% .16 232.661);--colors-blue-50: oklch(97% .014 254.604);--colors-blue-100: oklch(93.2% .032 255.585);--colors-blue-200: oklch(88.2% .059 254.128);--colors-blue-300: oklch(80.9% .105 251.813);--colors-blue-400: oklch(70.7% .165 254.624);--colors-blue-500: oklch(62.3% .214 259.815);--colors-blue-600: oklch(54.6% .245 262.881);--colors-blue-700: oklch(48.8% .243 264.376);--colors-blue-800: oklch(42.4% .199 265.638);--colors-blue-900: oklch(37.9% .146 265.522);--colors-blue-950: oklch(28.2% .091 267.935);--colors-blue-DEFAULT: oklch(70.7% .165 254.624);--colors-indigo-50: oklch(96.2% .018 272.314);--colors-indigo-100: oklch(93% .034 272.788);--colors-indigo-200: oklch(87% .065 274.039);--colors-indigo-300: oklch(78.5% .115 274.713);--colors-indigo-400: oklch(67.3% .182 276.935);--colors-indigo-500: oklch(58.5% .233 277.117);--colors-indigo-600: oklch(51.1% .262 276.966);--colors-indigo-700: oklch(45.7% .24 277.023);--colors-indigo-800: oklch(39.8% .195 277.366);--colors-indigo-900: oklch(35.9% .144 278.697);--colors-indigo-950: oklch(25.7% .09 281.288);--colors-indigo-DEFAULT: oklch(67.3% .182 276.935);--colors-violet-50: oklch(96.9% .016 293.756);--colors-violet-100: oklch(94.3% .029 294.588);--colors-violet-200: oklch(89.4% .057 293.283);--colors-violet-300: oklch(81.1% .111 293.571);--colors-violet-400: oklch(70.2% .183 293.541);--colors-violet-500: oklch(60.6% .25 292.717);--colors-violet-600: oklch(54.1% .281 293.009);--colors-violet-700: oklch(49.1% .27 292.581);--colors-violet-800: oklch(43.2% .232 292.759);--colors-violet-900: oklch(38% .189 293.745);--colors-violet-950: oklch(28.3% .141 291.089);--colors-violet-DEFAULT: oklch(70.2% .183 293.541);--colors-purple-50: oklch(97.7% .014 308.299);--colors-purple-100: oklch(94.6% .033 307.174);--colors-purple-200: oklch(90.2% .063 306.703);--colors-purple-300: oklch(82.7% .119 306.383);--colors-purple-400: oklch(71.4% .203 305.504);--colors-purple-500: oklch(62.7% .265 303.9);--colors-purple-600: oklch(55.8% .288 302.321);--colors-purple-700: oklch(49.6% .265 301.924);--colors-purple-800: oklch(43.8% .218 303.724);--colors-purple-900: oklch(38.1% .176 304.987);--colors-purple-950: oklch(29.1% .149 302.717);--colors-purple-DEFAULT: oklch(71.4% .203 305.504);--colors-fuchsia-50: oklch(97.7% .017 320.058);--colors-fuchsia-100: oklch(95.2% .037 318.852);--colors-fuchsia-200: oklch(90.3% .076 319.62);--colors-fuchsia-300: oklch(83.3% .145 321.434);--colors-fuchsia-400: oklch(74% .238 322.16);--colors-fuchsia-500: oklch(66.7% .295 322.15);--colors-fuchsia-600: oklch(59.1% .293 322.896);--colors-fuchsia-700: oklch(51.8% .253 323.949);--colors-fuchsia-800: oklch(45.2% .211 324.591);--colors-fuchsia-900: oklch(40.1% .17 325.612);--colors-fuchsia-950: oklch(29.3% .136 325.661);--colors-fuchsia-DEFAULT: oklch(74% .238 322.16);--colors-pink-50: oklch(97.1% .014 343.198);--colors-pink-100: oklch(94.8% .028 342.258);--colors-pink-200: oklch(89.9% .061 343.231);--colors-pink-300: oklch(82.3% .12 346.018);--colors-pink-400: oklch(71.8% .202 349.761);--colors-pink-500: oklch(65.6% .241 354.308);--colors-pink-600: oklch(59.2% .249 .584);--colors-pink-700: oklch(52.5% .223 3.958);--colors-pink-800: oklch(45.9% .187 3.815);--colors-pink-900: oklch(40.8% .153 2.432);--colors-pink-950: oklch(28.4% .109 3.907);--colors-pink-DEFAULT: oklch(71.8% .202 349.761);--colors-rose-50: oklch(96.9% .015 12.422);--colors-rose-100: oklch(94.1% .03 12.58);--colors-rose-200: oklch(89.2% .058 10.001);--colors-rose-300: oklch(81% .117 11.638);--colors-rose-400: oklch(71.2% .194 13.428);--colors-rose-500: oklch(64.5% .246 16.439);--colors-rose-600: oklch(58.6% .253 17.585);--colors-rose-700: oklch(51.4% .222 16.935);--colors-rose-800: oklch(45.5% .188 13.697);--colors-rose-900: oklch(41% .159 10.272);--colors-rose-950: oklch(27.1% .105 12.094);--colors-rose-DEFAULT: oklch(71.2% .194 13.428);--colors-light-50: oklch(99.4% 0 0);--colors-light-100: oklch(99.11% 0 0);--colors-light-200: oklch(98.51% 0 0);--colors-light-300: oklch(98.16% .0017 247.84);--colors-light-400: oklch(97.31% 0 0);--colors-light-500: oklch(96.12% 0 0);--colors-light-600: oklch(96.32% .0034 247.86);--colors-light-700: oklch(94.17% .0052 247.88);--colors-light-800: oklch(91.09% .007 247.9);--colors-light-900: oklch(90.72% .0051 228.82);--colors-light-950: oklch(89.23% .006 239.83);--colors-light-DEFAULT: oklch(97.31% 0 0);--colors-dark-50: oklch(40.91% 0 0);--colors-dark-100: oklch(35.62% 0 0);--colors-dark-200: oklch(31.71% 0 0);--colors-dark-300: oklch(29.72% 0 0);--colors-dark-400: oklch(25.2% 0 0);--colors-dark-500: oklch(23.93% 0 0);--colors-dark-600: oklch(22.73% .0038 286.09);--colors-dark-700: oklch(22.21% 0 0);--colors-dark-800: oklch(20.9% 0 0);--colors-dark-900: oklch(16.84% 0 0);--colors-dark-950: oklch(13.44% 0 0);--colors-dark-DEFAULT: oklch(25.2% 0 0);--colors-primary-50: hsl(198, 100%, 97%);--colors-primary-100: hsl(198, 100%, 92%);--colors-primary-200: hsl(198, 100%, 84%);--colors-primary-300: hsl(198, 100%, 75%);--colors-primary-400: hsl(198, 100%, 66%);--colors-primary-500: hsl(198, 100%, 55%);--colors-primary-600: hsl(198, 100%, 45%);--colors-primary-700: hsl(198, 100%, 35%);--colors-primary-800: hsl(198, 100%, 24%);--colors-primary-900: hsl(198, 100%, 15%);--colors-primary-DEFAULT: hsl(198, 100%, 55%);--colors-secondary-50: hsl(120, 100%, 97%);--colors-secondary-100: hsl(120, 100%, 92%);--colors-secondary-200: hsl(120, 100%, 84%);--colors-secondary-300: hsl(120, 100%, 75%);--colors-secondary-400: hsl(120, 100%, 66%);--colors-secondary-500: hsl(120, 100%, 55%);--colors-secondary-600: hsl(120, 100%, 45%);--colors-secondary-700: hsl(120, 100%, 35%);--colors-secondary-800: hsl(120, 100%, 24%);--colors-secondary-900: hsl(120, 100%, 15%);--colors-secondary-DEFAULT: hsl(120, 100%, 55%);--colors-tertiary-50: hsl(175, 100%, 97%);--colors-tertiary-100: hsl(175, 100%, 92%);--colors-tertiary-200: hsl(175, 100%, 84%);--colors-tertiary-300: hsl(175, 100%, 75%);--colors-tertiary-400: hsl(175, 100%, 66%);--colors-tertiary-500: hsl(175, 100%, 55%);--colors-tertiary-600: hsl(175, 100%, 45%);--colors-tertiary-700: hsl(175, 100%, 35%);--colors-tertiary-800: hsl(175, 100%, 24%);--colors-tertiary-900: hsl(175, 100%, 15%);--colors-tertiary-DEFAULT: hsl(175, 100%, 55%);--colors-success-50: hsl(149, 87%, 97%);--colors-success-100: hsl(149, 87%, 92%);--colors-success-200: hsl(149, 87%, 84%);--colors-success-300: hsl(149, 87%, 75%);--colors-success-400: hsl(149, 87%, 66%);--colors-success-500: hsl(149, 87%, 55%);--colors-success-600: hsl(149, 87%, 45%);--colors-success-700: hsl(149, 87%, 35%);--colors-success-800: hsl(149, 87%, 24%);--colors-success-900: hsl(149, 87%, 15%);--colors-success-DEFAULT: hsl(149, 87%, 55%);--colors-warning-50: hsl(32, 100%, 97%);--colors-warning-100: hsl(32, 100%, 92%);--colors-warning-200: hsl(32, 100%, 84%);--colors-warning-300: hsl(32, 100%, 75%);--colors-warning-400: hsl(32, 100%, 66%);--colors-warning-500: hsl(32, 100%, 55%);--colors-warning-600: hsl(32, 100%, 45%);--colors-warning-700: hsl(32, 100%, 35%);--colors-warning-800: hsl(32, 100%, 24%);--colors-warning-900: hsl(32, 100%, 15%);--colors-warning-DEFAULT: hsl(32, 100%, 55%);--colors-danger-50: hsl(345, 100%, 97%);--colors-danger-100: hsl(345, 100%, 92%);--colors-danger-200: hsl(345, 100%, 84%);--colors-danger-300: hsl(345, 100%, 75%);--colors-danger-400: hsl(345, 100%, 66%);--colors-danger-500: hsl(345, 100%, 55%);--colors-danger-600: hsl(345, 100%, 45%);--colors-danger-700: hsl(345, 100%, 35%);--colors-danger-800: hsl(345, 100%, 24%);--colors-danger-900: hsl(345, 100%, 15%);--colors-danger-DEFAULT: hsl(345, 100%, 55%);--colors-default-50: hsl(0, 0%, 97%);--colors-default-100: hsl(0, 0%, 92%);--colors-default-200: hsl(0, 0%, 84%);--colors-default-300: hsl(0, 0%, 75%);--colors-default-400: hsl(0, 0%, 66%);--colors-default-500: hsl(0, 0%, 55%);--colors-default-600: hsl(0, 0%, 45%);--colors-default-700: hsl(0, 0%, 35%);--colors-default-800: hsl(0, 0%, 24%);--colors-default-900: hsl(0, 0%, 15%);--colors-default-DEFAULT: hsl(0, 0%, 35%);--colors-surface-50: hsl(0, 0%, 97%);--colors-surface-100: hsl(0, 0%, 92%);--colors-surface-200: hsl(0, 0%, 84%);--colors-surface-300: hsl(0, 0%, 75%);--colors-surface-400: hsl(0, 0%, 66%);--colors-surface-500: hsl(0, 0%, 55%);--colors-surface-600: hsl(0, 0%, 45%);--colors-surface-700: hsl(0, 0%, 35%);--colors-surface-800: hsl(0, 0%, 24%);--colors-surface-900: hsl(0, 0%, 15%);--colors-surface-DEFAULT: hsl(0, 0%, 35%);--text-xs-fontSize: .75rem;--text-xs-lineHeight: 1rem;--text-sm-fontSize: .875rem;--text-sm-lineHeight: 1.25rem;--text-base-fontSize: 1rem;--text-base-lineHeight: 1.5rem;--text-lg-fontSize: 1.125rem;--text-lg-lineHeight: 1.75rem;--text-xl-fontSize: 1.25rem;--text-xl-lineHeight: 1.75rem;--text-2xl-fontSize: 1.5rem;--text-2xl-lineHeight: 2rem;--text-3xl-fontSize: 1.875rem;--text-3xl-lineHeight: 2.25rem;--text-4xl-fontSize: 2.25rem;--text-4xl-lineHeight: 2.5rem;--text-5xl-fontSize: 3rem;--text-5xl-lineHeight: 1;--text-6xl-fontSize: 3.75rem;--text-6xl-lineHeight: 1;--text-7xl-fontSize: 4.5rem;--text-7xl-lineHeight: 1;--text-8xl-fontSize: 6rem;--text-8xl-lineHeight: 1;--text-9xl-fontSize: 8rem;--text-9xl-lineHeight: 1;--text-color: var(--color-surface-100);--fontWeight-thin: 100;--fontWeight-extralight: 200;--fontWeight-light: 300;--fontWeight-normal: 400;--fontWeight-medium: 500;--fontWeight-semibold: 600;--fontWeight-bold: 700;--fontWeight-extrabold: 800;--fontWeight-black: 900;--tracking-tighter: -.05em;--tracking-tight: -.025em;--tracking-normal: 0em;--tracking-wide: .025em;--tracking-wider: .05em;--tracking-widest: .1em;--leading-none: 1;--leading-tight: 1.25;--leading-snug: 1.375;--leading-normal: 1.5;--leading-relaxed: 1.625;--leading-loose: 2;--textStrokeWidth-DEFAULT: 1.5rem;--textStrokeWidth-none: 0;--textStrokeWidth-sm: thin;--textStrokeWidth-md: medium;--textStrokeWidth-lg: thick;--radius-DEFAULT: .25rem;--radius-none: 0;--radius-xs: .125rem;--radius-sm: .25rem;--radius-md: .375rem;--radius-lg: .5rem;--radius-xl: .75rem;--radius-2xl: 1rem;--radius-3xl: 1.5rem;--radius-4xl: 2rem;--ease-linear: linear;--ease-in: cubic-bezier(.4, 0, 1, 1);--ease-out: cubic-bezier(0, 0, .2, 1);--ease-in-out: cubic-bezier(.4, 0, .2, 1);--ease-DEFAULT: cubic-bezier(.4, 0, .2, 1);--blur-DEFAULT: 8px;--blur-xs: 4px;--blur-sm: 8px;--blur-md: 12px;--blur-lg: 16px;--blur-xl: 24px;--blur-2xl: 40px;--blur-3xl: 64px;--perspective-dramatic: 100px;--perspective-near: 300px;--perspective-normal: 500px;--perspective-midrange: 800px;--perspective-distant: 1200px;--default-transition-duration: .15s;--default-transition-timingFunction: cubic-bezier(.4, 0, .2, 1);--default-font-family: var(--font-sans);--default-font-featureSettings: var(--font-sans--font-feature-settings);--default-font-variationSettings: var(--font-sans--font-variation-settings);--default-monoFont-family: var(--font-mono);--default-monoFont-featureSettings: var(--font-mono--font-feature-settings);--default-monoFont-variationSettings: var(--font-mono--font-variation-settings);--container-3xs: 16rem;--container-2xs: 18rem;--container-xs: 20rem;--container-sm: 24rem;--container-md: 28rem;--container-lg: 32rem;--container-xl: 36rem;--container-2xl: 42rem;--container-3xl: 48rem;--container-4xl: 56rem;--container-5xl: 64rem;--container-6xl: 72rem;--container-7xl: 80rem;--container-prose: 65ch;--background-color: var(--colors-primary-100);--boxShadow-md: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);--boxShadow-lg: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--theme-font-family: "Manrope"}*,:after,:before,::backdrop,::file-selector-button{box-sizing:border-box;margin:0;padding:0;border:0 solid}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:var( --default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" );font-feature-settings:var(--default-font-featureSettings, normal);font-variation-settings:var(--default-font-variationSettings, normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var( --default-monoFont-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace );font-feature-settings:var(--default-monoFont-featureSettings, normal);font-variation-settings:var(--default-monoFont-variationSettings, normal);font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea,::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;border-radius:0;background-color:transparent;opacity:1}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit,::-webkit-datetime-edit-year-field,::-webkit-datetime-edit-month-field,::-webkit-datetime-edit-day-field,::-webkit-datetime-edit-hour-field,::-webkit-datetime-edit-minute-field,::-webkit-datetime-edit-second-field,::-webkit-datetime-edit-millisecond-field,::-webkit-datetime-edit-meridiem-field{padding-block:0}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]),::file-selector-button{appearance:button}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}.container{width:100%}@media (min-width: 40rem){.container{max-width:40rem}}@media (min-width: 48rem){.container{max-width:48rem}}@media (min-width: 64rem){.container{max-width:64rem}}@media (min-width: 80rem){.container{max-width:80rem}}@media (min-width: 96rem){.container{max-width:96rem}}.text-2xl{font-size:var(--text-2xl-fontSize);line-height:var(--un-leading, var(--text-2xl-lineHeight))}.text-3xl{font-size:var(--text-3xl-fontSize);line-height:var(--un-leading, var(--text-3xl-lineHeight))}.text-4xl{font-size:var(--text-4xl-fontSize);line-height:var(--un-leading, var(--text-4xl-lineHeight))}.text-5xl{font-size:var(--text-5xl-fontSize);line-height:var(--un-leading, var(--text-5xl-lineHeight))}.text-6xl{font-size:var(--text-6xl-fontSize);line-height:var(--un-leading, var(--text-6xl-lineHeight))}.text-lg{font-size:var(--text-lg-fontSize);line-height:var(--un-leading, var(--text-lg-lineHeight))}.text-sm{font-size:var(--text-sm-fontSize);line-height:var(--un-leading, var(--text-sm-lineHeight))}.text-xl{font-size:var(--text-xl-fontSize);line-height:var(--un-leading, var(--text-xl-lineHeight))}.text-xs{font-size:var(--text-xs-fontSize);line-height:var(--un-leading, var(--text-xs-lineHeight))}.text-\\[\\#1d2021\\]{color:color-mix(in oklab,#1d2021 var(--un-text-opacity),transparent)}.text-\\[\\#282828\\]{color:color-mix(in oklab,#282828 var(--un-text-opacity),transparent)}.text-\\[\\#83a598\\]{color:color-mix(in oklab,#83a598 var(--un-text-opacity),transparent)}.text-\\[\\#928374\\]{color:color-mix(in oklab,#928374 var(--un-text-opacity),transparent)}.text-\\[\\#a89984\\]{color:color-mix(in oklab,#a89984 var(--un-text-opacity),transparent)}.text-\\[\\#b8bb26\\]{color:color-mix(in oklab,#b8bb26 var(--un-text-opacity),transparent)}.text-\\[\\#bdae93\\]{color:color-mix(in oklab,#bdae93 var(--un-text-opacity),transparent)}.text-\\[\\#d5c4a1\\]{color:color-mix(in oklab,#d5c4a1 var(--un-text-opacity),transparent)}.text-\\[\\#ebdbb2\\]{color:color-mix(in oklab,#ebdbb2 var(--un-text-opacity),transparent)}.text-\\[\\#fabd2f\\]{color:color-mix(in oklab,#fabd2f var(--un-text-opacity),transparent)}.text-amber-600{color:color-mix(in srgb,var(--colors-amber-600) var(--un-text-opacity),transparent)}.text-amber-900{color:color-mix(in srgb,var(--colors-amber-900) var(--un-text-opacity),transparent)}.text-blue-100{color:color-mix(in srgb,var(--colors-blue-100) var(--un-text-opacity),transparent)}.text-blue-600{color:color-mix(in srgb,var(--colors-blue-600) var(--un-text-opacity),transparent)}.text-gray-200{color:color-mix(in srgb,var(--colors-gray-200) var(--un-text-opacity),transparent)}.text-gray-400{color:color-mix(in srgb,var(--colors-gray-400) var(--un-text-opacity),transparent)}.text-gray-500{color:color-mix(in srgb,var(--colors-gray-500) var(--un-text-opacity),transparent)}.text-gray-600{color:color-mix(in srgb,var(--colors-gray-600) var(--un-text-opacity),transparent)}.text-gray-700{color:color-mix(in srgb,var(--colors-gray-700) var(--un-text-opacity),transparent)}.text-gray-800{color:color-mix(in srgb,var(--colors-gray-800) var(--un-text-opacity),transparent)}.text-gray-900{color:color-mix(in srgb,var(--colors-gray-900) var(--un-text-opacity),transparent)}.text-green-400{color:color-mix(in srgb,var(--colors-green-400) var(--un-text-opacity),transparent)}.text-green-800{color:color-mix(in srgb,var(--colors-green-800) var(--un-text-opacity),transparent)}.text-red-100{color:color-mix(in srgb,var(--colors-red-100) var(--un-text-opacity),transparent)}.text-red-400{color:color-mix(in srgb,var(--colors-red-400) var(--un-text-opacity),transparent)}.text-red-700{color:color-mix(in srgb,var(--colors-red-700) var(--un-text-opacity),transparent)}.text-red-800{color:color-mix(in srgb,var(--colors-red-800) var(--un-text-opacity),transparent)}.text-white{color:color-mix(in srgb,var(--colors-white) var(--un-text-opacity),transparent)}.text-yellow-800{color:color-mix(in srgb,var(--colors-yellow-800) var(--un-text-opacity),transparent)}.hover\\:text-\\[\\#ebdbb2\\]:hover{color:color-mix(in oklab,#ebdbb2 var(--un-text-opacity),transparent)}.hover\\:text-\\[\\#fb4934\\]:hover{color:color-mix(in oklab,#fb4934 var(--un-text-opacity),transparent)}.tracking-wider{--un-tracking:var(--tracking-wider);letter-spacing:var(--tracking-wider)}.font-bold{--un-font-weight:var(--fontWeight-bold);font-weight:var(--fontWeight-bold)}.font-extrabold{--un-font-weight:var(--fontWeight-extrabold);font-weight:var(--fontWeight-extrabold)}.font-family{font-family:var(--font-family)}.font-medium{--un-font-weight:var(--fontWeight-medium);font-weight:var(--fontWeight-medium)}.font-mono{font-family:var(--font-mono)}.font-sans{font-family:var(--font-sans)}.font-semibold{--un-font-weight:var(--fontWeight-semibold);font-weight:var(--fontWeight-semibold)}.tab{-moz-tab-size:4;-o-tab-size:4;tab-size:4}.m\\[1\\]{margin:1}.m\\[W\\]{margin:W}.m16{margin:calc(var(--spacing) * 16)}.m21{margin:calc(var(--spacing) * 21)}.m21\\.73{margin:calc(var(--spacing) * 21.73)}.m22{margin:calc(var(--spacing) * 22)}.m6{margin:calc(var(--spacing) * 6)}.m9{margin:calc(var(--spacing) * 9)}.mx-auto{margin-inline:auto}.my-2{margin-block:calc(var(--spacing) * 2)}.my-4{margin-block:calc(var(--spacing) * 4)}.my-6{margin-block:calc(var(--spacing) * 6)}.mb-1{margin-bottom:calc(var(--spacing) * 1)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.mb-4{margin-bottom:calc(var(--spacing) * 4)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.ml-1{margin-left:calc(var(--spacing) * 1)}.ml-2{margin-left:calc(var(--spacing) * 2)}.ml-auto{margin-left:auto}.mr-2{margin-right:calc(var(--spacing) * 2)}.mr-3{margin-right:calc(var(--spacing) * 3)}.mt-1{margin-top:calc(var(--spacing) * 1)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mt-4{margin-top:calc(var(--spacing) * 4)}.p-1{padding:calc(var(--spacing) * 1)}.p-1\\.5{padding:calc(var(--spacing) * 1.5)}.p-2{padding:calc(var(--spacing) * 2)}.p-3{padding:calc(var(--spacing) * 3)}.p-4{padding:calc(var(--spacing) * 4)}.p-6{padding:calc(var(--spacing) * 6)}.p-8{padding:calc(var(--spacing) * 8)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-6{padding-inline:calc(var(--spacing) * 6)}.py-0\\.5{padding-block:calc(var(--spacing) * .5)}.py-1{padding-block:calc(var(--spacing) * 1)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-8{padding-block:calc(var(--spacing) * 8)}.pb-2{padding-bottom:calc(var(--spacing) * 2)}.pb-4{padding-bottom:calc(var(--spacing) * 4)}.pr-10{padding-right:calc(var(--spacing) * 10)}.pr-16{padding-right:calc(var(--spacing) * 16)}.pr-4{padding-right:calc(var(--spacing) * 4)}.pt-2{padding-top:calc(var(--spacing) * 2)}.pt-4{padding-top:calc(var(--spacing) * 4)}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.focus\\:outline-none:focus{--un-outline-style:none;outline-style:none}.b,.border{border-width:1px}.border-2{border-width:2px}.border-b{border-bottom-width:1px}.border-b-2{border-bottom-width:2px}.border-l-4{border-left-width:4px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-t-2{border-top-width:2px}.border-\\[\\#3c3836\\]{border-color:color-mix(in oklab,#3c3836 var(--un-border-opacity),transparent)}.border-\\[\\#504945\\]{border-color:color-mix(in oklab,#504945 var(--un-border-opacity),transparent)}.border-\\[\\#665c54\\]{border-color:color-mix(in oklab,#665c54 var(--un-border-opacity),transparent)}.border-\\[\\#fb4934\\]{border-color:color-mix(in oklab,#fb4934 var(--un-border-opacity),transparent)}.border-amber-200{border-color:color-mix(in srgb,var(--colors-amber-200) var(--un-border-opacity),transparent)}.border-amber-400{border-color:color-mix(in srgb,var(--colors-amber-400) var(--un-border-opacity),transparent)}.border-gray-200{border-color:color-mix(in srgb,var(--colors-gray-200) var(--un-border-opacity),transparent)}.border-gray-700{border-color:color-mix(in srgb,var(--colors-gray-700) var(--un-border-opacity),transparent)}.border-white{border-color:color-mix(in srgb,var(--colors-white) var(--un-border-opacity),transparent)}.hover\\:border-\\[\\#83a598\\]:hover{border-color:color-mix(in oklab,#83a598 var(--un-border-opacity),transparent)}.focus\\:border-\\[\\#83a598\\]:focus{border-color:color-mix(in oklab,#83a598 var(--un-border-opacity),transparent)}.border-t-transparent{border-top-color:transparent}.rounded{border-radius:var(--radius-DEFAULT)}.rounded-full{border-radius:calc(infinity * 1px)}.rounded-lg{border-radius:var(--radius-lg)}.rounded-md{border-radius:var(--radius-md)}.rounded-xl{border-radius:var(--radius-xl)}.rounded-b-lg{border-bottom-left-radius:var(--radius-lg);border-bottom-right-radius:var(--radius-lg)}.rounded-bl-none{border-bottom-left-radius:var(--radius-none)}.rounded-br-none{border-bottom-right-radius:var(--radius-none)}.border-dashed{--un-border-style:dashed;border-style:dashed}.bg-\\[\\#1d2021\\]{background-color:color-mix(in oklab,#1d2021 var(--un-bg-opacity),transparent)}.bg-\\[\\#282828\\]{background-color:color-mix(in oklab,#282828 var(--un-bg-opacity),transparent)}.bg-\\[\\#3c3836\\]{background-color:color-mix(in oklab,#3c3836 var(--un-bg-opacity),transparent)}.bg-\\[\\#458588\\]{background-color:color-mix(in oklab,#458588 var(--un-bg-opacity),transparent)}.bg-\\[\\#504945\\],.data-\\[active\\=true\\]\\:bg-\\[\\#504945\\][data-active=true]{background-color:color-mix(in oklab,#504945 var(--un-bg-opacity),transparent)}.bg-\\[\\#83a598\\]{background-color:color-mix(in oklab,#83a598 var(--un-bg-opacity),transparent)}.bg-\\[\\#b16286\\]{background-color:color-mix(in oklab,#b16286 var(--un-bg-opacity),transparent)}.bg-\\[\\#b8bb26\\]{background-color:color-mix(in oklab,#b8bb26 var(--un-bg-opacity),transparent)}.bg-\\[\\#ebdbb2\\]{background-color:color-mix(in oklab,#ebdbb2 var(--un-bg-opacity),transparent)}.bg-\\[\\#fb4934\\]{background-color:color-mix(in oklab,#fb4934 var(--un-bg-opacity),transparent)}.bg-amber-50{background-color:color-mix(in srgb,var(--colors-amber-50) var(--un-bg-opacity),transparent)}.bg-blue-600{background-color:color-mix(in srgb,var(--colors-blue-600) var(--un-bg-opacity),transparent)}.bg-gray-100{background-color:color-mix(in srgb,var(--colors-gray-100) var(--un-bg-opacity),transparent)}.bg-gray-200{background-color:color-mix(in srgb,var(--colors-gray-200) var(--un-bg-opacity),transparent)}.bg-gray-50{background-color:color-mix(in srgb,var(--colors-gray-50) var(--un-bg-opacity),transparent)}.bg-gray-600{background-color:color-mix(in srgb,var(--colors-gray-600) var(--un-bg-opacity),transparent)}.bg-gray-700{background-color:color-mix(in srgb,var(--colors-gray-700) var(--un-bg-opacity),transparent)}.bg-gray-800{background-color:color-mix(in srgb,var(--colors-gray-800) var(--un-bg-opacity),transparent)}.bg-gray-900{background-color:color-mix(in srgb,var(--colors-gray-900) var(--un-bg-opacity),transparent)}.bg-green-100{background-color:color-mix(in srgb,var(--colors-green-100) var(--un-bg-opacity),transparent)}.bg-red-100{background-color:color-mix(in srgb,var(--colors-red-100) var(--un-bg-opacity),transparent)}.bg-red-700{background-color:color-mix(in srgb,var(--colors-red-700) var(--un-bg-opacity),transparent)}.bg-red-900\\/50{background-color:color-mix(in srgb,var(--colors-red-900) 50%,transparent)}.bg-white{background-color:color-mix(in srgb,var(--colors-white) var(--un-bg-opacity),transparent)}.bg-yellow-100{background-color:color-mix(in srgb,var(--colors-yellow-100) var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#1d2021\\]:hover{background-color:color-mix(in oklab,#1d2021 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#3c3836\\]:hover{background-color:color-mix(in oklab,#3c3836 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#504945\\]:hover{background-color:color-mix(in oklab,#504945 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#665c54\\]:hover{background-color:color-mix(in oklab,#665c54 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#83a598\\]:hover{background-color:color-mix(in oklab,#83a598 var(--un-bg-opacity),transparent)}.hover\\:bg-amber-100:hover{background-color:color-mix(in srgb,var(--colors-amber-100) var(--un-bg-opacity),transparent)}.hover\\:bg-gray-700:hover{background-color:color-mix(in srgb,var(--colors-gray-700) var(--un-bg-opacity),transparent)}.opacity-0{opacity:0%}.group:hover .group-hover\\:opacity-100{opacity:100%}.hover\\:underline:hover{text-decoration-line:underline}.flex{display:flex}.flex-1{flex:1 1 0%}.flex-shrink-0,.shrink-0{flex-shrink:0}.selection\\:shrink-selection *::selection,.selection\\:shrink-selection::selection{flex-shrink:1}.flex-grow{flex-grow:1}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.gap-1{gap:calc(var(--spacing) * 1)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-6{gap:calc(var(--spacing) * 6)}.grid{display:grid}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.h-12{height:calc(var(--spacing) * 12)}.h-15{height:calc(var(--spacing) * 15)}.h-16{height:calc(var(--spacing) * 16)}.h-3\\.5{height:calc(var(--spacing) * 3.5)}.h-4{height:calc(var(--spacing) * 4)}.h-5{height:calc(var(--spacing) * 5)}.h-50{height:calc(var(--spacing) * 50)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-full{height:100%}.h-screen{height:100vh}.max-h-32{max-height:calc(var(--spacing) * 32)}.max-h-48{max-height:calc(var(--spacing) * 48)}.max-w-\\[75\\%\\]{max-width:75%}.max-w-lg{max-width:var(--container-lg)}.max-w-md{max-width:var(--container-md)}.max-w-none{max-width:none}.min-h-\\[2\\.5rem\\]{min-height:2.5rem}.min-h-0{min-height:calc(var(--spacing) * 0)}.min-h-screen{min-height:100vh}.min-w-0{min-width:calc(var(--spacing) * 0)}.w-10{width:calc(var(--spacing) * 10)}.w-12{width:calc(var(--spacing) * 12)}.w-16{width:calc(var(--spacing) * 16)}.w-2{width:calc(var(--spacing) * 2)}.w-28{width:calc(var(--spacing) * 28)}.w-3\\.5{width:calc(var(--spacing) * 3.5)}.w-3xs{width:var(--container-3xs)}.w-4{width:calc(var(--spacing) * 4)}.w-5{width:calc(var(--spacing) * 5)}.w-64{width:calc(var(--spacing) * 64)}.w-8{width:calc(var(--spacing) * 8)}.w-80{width:calc(var(--spacing) * 80)}.w-full{width:100%}.w\\[M\\]{width:M}.inline{display:inline}.block{display:block}.inline-block{display:inline-block}.contents{display:contents}.hidden{display:none}.visible{visibility:visible}.cursor-pointer{cursor:pointer}.cursor-not-allowed{cursor:not-allowed}.resize-none{resize:none}.selection\\:select-all *::selection,.selection\\:select-all::selection{-webkit-user-select:all;user-select:all}.whitespace-pre-wrap{white-space:pre-wrap}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.text-ellipsis{text-overflow:ellipsis}.uppercase{text-transform:uppercase}.capitalize{text-transform:capitalize}.italic{font-style:italic}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.focus\\:ring-2:focus{--un-ring-shadow:var(--un-ring-inset,) 0 0 0 calc(2px + var(--un-ring-offset-width)) var(--un-ring-color, currentColor);box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.focus\\:ring-\\[\\#83a598\\]:focus{--un-ring-color:color-mix(in oklab, #83a598 var(--un-ring-opacity), transparent)}.shadow,.shadow-sm{--un-shadow:0 1px 3px 0 var(--un-shadow-color, rgb(0 0 0 / .1)),0 1px 2px -1px var(--un-shadow-color, rgb(0 0 0 / .1));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.shadow-\\[4px_4px_0px_\\#1d2021\\]{--un-shadow:4px 4px 0px var(--un-shadow-color, rgb(29 32 33));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.shadow-lg{--un-shadow:0 10px 15px -3px var(--un-shadow-color, rgb(0 0 0 / .1)),0 4px 6px -4px var(--un-shadow-color, rgb(0 0 0 / .1));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.shadow-md{--un-shadow:0 4px 6px -1px var(--un-shadow-color, rgb(0 0 0 / .1)),0 2px 4px -2px var(--un-shadow-color, rgb(0 0 0 / .1));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.shadow-xl{--un-shadow:0 20px 25px -5px var(--un-shadow-color, rgb(0 0 0 / .1)),0 8px 10px -6px var(--un-shadow-color, rgb(0 0 0 / .1));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.hover\\:shadow-\\[6px_6px_0px_\\#83a598\\]:hover{--un-shadow:6px 6px 0px var(--un-shadow-color, rgb(131 165 152));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.focus\\:shadow-\\[2px_2px_0px_\\#1d2021\\]:focus{--un-shadow:2px 2px 0px var(--un-shadow-color, rgb(29 32 33));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.translate-x-4{--un-translate-x:calc(var(--spacing) * 4);translate:var(--un-translate-x) var(--un-translate-y)}.transform{transform:var(--un-rotate-x) var(--un-rotate-y) var(--un-rotate-z) var(--un-skew-x) var(--un-skew-y)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,--un-gradient-from,--un-gradient-via,--un-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,--un-gradient-from,--un-gradient-via,--un-gradient-to;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.duration-200{--un-duration:.2s;transition-duration:.2s}.ease-in-out{--un-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.items-center{align-items:center}.items-baseline{align-items:baseline}.bottom-2\\.5{bottom:calc(var(--spacing) * 2.5)}.right-2{right:calc(var(--spacing) * 2)}.right-3{right:calc(var(--spacing) * 3)}.top-2{top:calc(var(--spacing) * 2)}.justify-start{justify-content:flex-start}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.overflow-auto{overflow:auto}.overflow-y-auto{overflow-y:auto}@keyframes pulse{0%,to{opacity:1}50%{opacity:.5}}@keyframes spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}.animate-spin{animation:spin 1s linear infinite}.filter{filter:var(--un-blur,) var(--un-brightness,) var(--un-contrast,) var(--un-grayscale,) var(--un-hue-rotate,) var(--un-invert,) var(--un-saturate,) var(--un-sepia,) var(--un-drop-shadow,)}.placeholder-\\[\\#928374\\]::placeholder{color:color-mix(in oklab,#928374 var(--un-placeholder-opacity),transparent)}.table{display:table}.table-row{display:table-row}.space-x-2>:not(:last-child){--un-space-x-reverse:0;margin-inline-start:calc(calc(var(--spacing) * 2) * var(--un-space-x-reverse));margin-inline-end:calc(calc(var(--spacing) * 2) * calc(1 - var(--un-space-x-reverse)))}.space-x-3>:not(:last-child){--un-space-x-reverse:0;margin-inline-start:calc(calc(var(--spacing) * 3) * var(--un-space-x-reverse));margin-inline-end:calc(calc(var(--spacing) * 3) * calc(1 - var(--un-space-x-reverse)))}.space-y-1>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 1) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 1) * calc(1 - var(--un-space-y-reverse)))}.space-y-2>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 2) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 2) * calc(1 - var(--un-space-y-reverse)))}.space-y-3>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 3) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 3) * calc(1 - var(--un-space-y-reverse)))}.space-y-4>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 4) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 4) * calc(1 - var(--un-space-y-reverse)))}.space-y-6>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 6) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 6) * calc(1 - var(--un-space-y-reverse)))}@supports (color: color-mix(in lab,red,red)){.text-amber-600{color:color-mix(in oklab,var(--colors-amber-600) var(--un-text-opacity),transparent)}.text-amber-900{color:color-mix(in oklab,var(--colors-amber-900) var(--un-text-opacity),transparent)}.text-blue-100{color:color-mix(in oklab,var(--colors-blue-100) var(--un-text-opacity),transparent)}.text-blue-600{color:color-mix(in oklab,var(--colors-blue-600) var(--un-text-opacity),transparent)}.text-gray-200{color:color-mix(in oklab,var(--colors-gray-200) var(--un-text-opacity),transparent)}.text-gray-400{color:color-mix(in oklab,var(--colors-gray-400) var(--un-text-opacity),transparent)}.text-gray-500{color:color-mix(in oklab,var(--colors-gray-500) var(--un-text-opacity),transparent)}.text-gray-600{color:color-mix(in oklab,var(--colors-gray-600) var(--un-text-opacity),transparent)}.text-gray-700{color:color-mix(in oklab,var(--colors-gray-700) var(--un-text-opacity),transparent)}.text-gray-800{color:color-mix(in oklab,var(--colors-gray-800) var(--un-text-opacity),transparent)}.text-gray-900{color:color-mix(in oklab,var(--colors-gray-900) var(--un-text-opacity),transparent)}.text-green-400{color:color-mix(in oklab,var(--colors-green-400) var(--un-text-opacity),transparent)}.text-green-800{color:color-mix(in oklab,var(--colors-green-800) var(--un-text-opacity),transparent)}.text-red-100{color:color-mix(in oklab,var(--colors-red-100) var(--un-text-opacity),transparent)}.text-red-400{color:color-mix(in oklab,var(--colors-red-400) var(--un-text-opacity),transparent)}.text-red-700{color:color-mix(in oklab,var(--colors-red-700) var(--un-text-opacity),transparent)}.text-red-800{color:color-mix(in oklab,var(--colors-red-800) var(--un-text-opacity),transparent)}.text-white{color:color-mix(in oklab,var(--colors-white) var(--un-text-opacity),transparent)}.text-yellow-800{color:color-mix(in oklab,var(--colors-yellow-800) var(--un-text-opacity),transparent)}.border-amber-200{border-color:color-mix(in oklab,var(--colors-amber-200) var(--un-border-opacity),transparent)}.border-amber-400{border-color:color-mix(in oklab,var(--colors-amber-400) var(--un-border-opacity),transparent)}.border-gray-200{border-color:color-mix(in oklab,var(--colors-gray-200) var(--un-border-opacity),transparent)}.border-gray-700{border-color:color-mix(in oklab,var(--colors-gray-700) var(--un-border-opacity),transparent)}.border-white{border-color:color-mix(in oklab,var(--colors-white) var(--un-border-opacity),transparent)}.bg-amber-50{background-color:color-mix(in oklab,var(--colors-amber-50) var(--un-bg-opacity),transparent)}.bg-blue-600{background-color:color-mix(in oklab,var(--colors-blue-600) var(--un-bg-opacity),transparent)}.bg-gray-100{background-color:color-mix(in oklab,var(--colors-gray-100) var(--un-bg-opacity),transparent)}.bg-gray-200{background-color:color-mix(in oklab,var(--colors-gray-200) var(--un-bg-opacity),transparent)}.bg-gray-50{background-color:color-mix(in oklab,var(--colors-gray-50) var(--un-bg-opacity),transparent)}.bg-gray-600{background-color:color-mix(in oklab,var(--colors-gray-600) var(--un-bg-opacity),transparent)}.bg-gray-700{background-color:color-mix(in oklab,var(--colors-gray-700) var(--un-bg-opacity),transparent)}.bg-gray-800{background-color:color-mix(in oklab,var(--colors-gray-800) var(--un-bg-opacity),transparent)}.bg-gray-900{background-color:color-mix(in oklab,var(--colors-gray-900) var(--un-bg-opacity),transparent)}.bg-green-100{background-color:color-mix(in oklab,var(--colors-green-100) var(--un-bg-opacity),transparent)}.bg-red-100{background-color:color-mix(in oklab,var(--colors-red-100) var(--un-bg-opacity),transparent)}.bg-red-700{background-color:color-mix(in oklab,var(--colors-red-700) var(--un-bg-opacity),transparent)}.bg-red-900\\/50{background-color:color-mix(in oklab,var(--colors-red-900) 50%,transparent)}.bg-white{background-color:color-mix(in oklab,var(--colors-white) var(--un-bg-opacity),transparent)}.bg-yellow-100{background-color:color-mix(in oklab,var(--colors-yellow-100) var(--un-bg-opacity),transparent)}.hover\\:bg-amber-100:hover{background-color:color-mix(in oklab,var(--colors-amber-100) var(--un-bg-opacity),transparent)}.hover\\:bg-gray-700:hover{background-color:color-mix(in oklab,var(--colors-gray-700) var(--un-bg-opacity),transparent)}}@media (min-width: 48rem){.md\\:p-8{padding:calc(var(--spacing) * 8)}.md\\:flex-row{flex-direction:row}.md\\:col-span-2{grid-column:span 2/span 2}.md\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\\:w-64{width:calc(var(--spacing) * 64)}.md\\:items-center{align-items:center}.md\\:justify-between{justify-content:space-between}}@media (min-width: 64rem){.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (min-width: 80rem){.xl\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}body{font-family:var(--font-family)}html,body{font-family:var(--theme-font-family);background-color:var(--theme-background-color)!important;color:var(--text-color)!important;width:100%;min-height:100%;height:100%;padding:0;margin:0}body:not(.production) *:not(:defined){border:1px solid red}.dark{filter:invert(1) hue-rotate(180deg)}.dark img,.dark dialog,.dark video,.dark iframe{filter:invert(1) hue-rotate(180deg)}html{font-size:14px}@media (max-width: 768px){html{font-size:18px}}@media (max-width: 480px){html{font-size:20px}}textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}:root{box-sizing:border-box;-moz-text-size-adjust:none;-webkit-text-size-adjust:none;text-size-adjust:none;line-height:1.2;-webkit-font-smoothing:antialiased}*,*:before,*:after{box-sizing:border-box}*{margin:0}body{-webkit-font-smoothing:antialiased;font-family:var(--font-family)}button,textarea,select{background-color:inherit;border-width:0;color:inherit}img,picture,video,canvas,svg{display:block;max-width:100%}input,button,textarea,select{font:inherit}p,h1,h2,h3,h4,h5,h6{font-family:var(--font-family);overflow-wrap:break-word}dialog::backdrop{background-color:#000c}*::-webkit-scrollbar{width:8px;margin-right:10px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{&:hover{scrollbar-color:rgba(154,153,150,.8) transparent}border-radius:10px;border:none}*::-webkit-scrollbar-button{background:transparent;color:transparent}*{scrollbar-width:thin;scrollbar-color:transparent transparent;&:hover{scrollbar-color:rgba(154,153,150,.8) transparent}}[full]{width:100%;height:100vh}[w-full]{width:100%}[grow]{flex-grow:1}[hide],.hide{display:none!important}[noscroll]{overflow:hidden}div [container]{display:flex}div [container][horizontal]{display:flex;flex-direction:col}:where(.uix-link){font-weight:var(--uix-link-font-weight, 600);width:var(--uix-link-width, auto);color:var(--uix-link-text-color, var(--colors-default-900));--uix-link-indent: 0;cursor:pointer;&[vertical]{margin:0 auto}a,button{width:inherit;cursor:pointer;padding:var(--uix-link-padding);&:hover{color:var(--uix-link-hover-color, var(--uix-link-text-color))}}.uix-text-icon__element{display:flex;align-items:center;gap:var(--uix-link-icon-gap, .5rem);&[reverse][vertical]{flex-direction:column-reverse}&:not([reverse])[vertical]{flex-direction:column}&[reverse]:not([vertical]){flex-direction:row-reverse}&:not([reverse]):not([vertical]){flex-direction:row}}transition:all .3s ease-in-out;&[indent]{>a,>button{padding-left:var(--uix-link-indent)}}&[active]:hover{color:var(--uix-link-hover-text-color, var(--colors-primary-400))}&[selectable][selected]{background-color:var(--colors-primary-400)}&:hover{[tooltip]{display:flex}}&[tooltip]{display:inline-block;&:hover{[tooltip]{visibility:visible}}[tooltip]{visibility:hidden;width:120px;background-color:#000;color:#fff;text-align:center;border-radius:6px;padding:5px 10px;margin-left:3px;position:absolute;z-index:1000000000;top:50%;left:100%;transform:translateY(-50%)}}&[position~=top] [tooltip]{bottom:100%;left:50%;transform:translate(-50%)}&[position~=bottom] [tooltip]{top:100%;left:50%;transform:translate(-50%)}&[position~=left] [tooltip]{top:50%;right:100%;transform:translateY(-50%)}&[tooltip],&[dropdown],&[context],&[float]{position:relative}&[dropdown],&[accordion]{flex-direction:column}[float],[dropdown],[accordion],[context]{display:none}&[floatopen]>a{display:none}&[floatopen] [float]{display:block;position:relative;bottom:0;right:0}&[context]{z-index:auto}[context][open]{display:flex;flex-direction:column}[dropdown],[context][open]{position:absolute;left:0;top:100%;width:100%;min-width:200px;z-index:1000;background-color:var(--colors-primary-100);box-shadow:0 8px 16px #0003;.uix-link:hover,input{background-color:var(--colors-primary-200)}>.uix-link{width:100%}}[context][open]{display:flex}&[selected]{[dropdown],[accordion]{display:flex;flex-direction:column}}}:where(.uix-button){border:var(--uix-button-borderSize, 0) solid var(--uix-button-borderColor);border-radius:var(--uix-button-borderRadius, var(--radius-md));box-shadow:var(--uix-button-shadow);width:var(--uix-button-width);min-width:fit-content;background-color:var(--uix-button-backgroundColor, black);color:var(--uix-button-textColor, var(--colors-default-100));font-weight:var(--uix-button-fontWeight, 700);display:flex;text-align:center;transition:transform .2s ease-in-out,opacity .2s ease-in-out,background-color .2s ease-in-out;&:hover{opacity:var(--uix-button-hover-opacity, .4)}&:active{transform:scale(.97)}>button,>a,>input{width:max-content;display:block;border-radius:inherit;cursor:var(--uix-button-cursor, pointer);height:calc(var(--spacing) * 10);line-height:calc(var(--spacing) * 5);padding:var( --uix-button-padding, calc(var(--spacing) * 2.5) calc(var(--spacing) * 4) );word-break:keep-all;flex-basis:100%}.uix-icon,button,input,a{cursor:pointer}&[bordered]{--uix-button-border-size: 1px;--uix-button-backgroundColor: transparent;--uix-button-hoverBackgroundColor: var(--_variant-color-300);--uix-button-borderColor: var(--_variant-color-400);--uix-button-textColor: var(--_variant-color-700)}&[ghost]{--uix-button-backgroundColor: transparent;--uix-button-hoverBackgroundColor: var(--_variant-color-300);--uix-button-borderSize: 0px;--uix-button-textColor: var(--_variant-color-700)}&[outline]{--uix-button-backgroundColor: transparent;--uix-button-hoverBackgroundColor: var(--_variant-color-300);--uix-button-textColor: var(--_variant-color-800);--uix-button-borderSize: 1px;--uix-button-borderColor: var(--_variant-color-400)}&[float]{background-color:#000;--uix-button-hoverBackgroundColor: var(--_variant-color-500);--uix-button-textColor: var(--_variant-color-50);--uix-button-borderSize: 0px;--uix-button-borderRadius: 9999px;--uix-button-width: var(--uix-button-height);box-shadow:var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / .1));--uix-button-padding: .5rem}&[float]:hover{box-shadow:var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / .1))}}.uix-list{display:flex;&[vertical]{flex-direction:column}}.uix-navbar{--uix-navbar-text-color: var(--color-default-90);--uix-navbar-hover-text-color: var(--color-surface-80);--uix-navbar-border-radius: 0px;--uix-navbar-border-color: var(--color-default-60);--uix-navbar-border-size: 1px;--uix-navbar-border-style: solid;--uix-navbar-hover-background-color: var(--color-default-40);--uix-container-position: var(--uix-navbar-position);display:flex;flex-direction:column;&[docked]{--uix-list-button-radius: 0;border-bottom:0;position:fixed;bottom:0;background-color:var(--uix-navbar-background-color, var(--color-default-5));>*{border-right:0;border-bottom:0;&:first-child{border-left:0}}}}.uix-icon{display:inline-block;vertical-align:middle;svg{height:inherit;width:inherit}}&[solid]{stroke:currentColor;fill:currentColor}:where(.uix-input){--uix-input-background-color: var(--colors-surface-100);--uix-input-border-color: var(--colors-gray-900);--uix-input-text-color: var(--colors-gray-900);--uix-input-placeholder-color: var(--colors-default-500);--uix-input-border-radius: var(--border-radius-md);--uix-input-border-width: 2px;--uix-input-padding-x: calc(var(--spacing) * 4);--uix-input-padding-y: calc(var(--spacing) * 2.5);--uix-input-font-size: var(--font-size-base);--uix-input-height: 2.5rem;--uix-input-disabled-opacity: .6;--uix-input-label-font-size: var(--font-size-sm);--uix-input-label-font-weight: var(--font-weight-bold);--uix-input-label-color: var(--colors-default-700);--uix-input-checkbox-size: 1.5rem;--uix-input-checkbox-border-radius: var(--border-radius-sm);--uix-input-checkbox-checked-bg: var(--colors-primary-600);--uix-input-checkbox-check-color: var(--colors-surface-100);width:100%;display:flex;flex-direction:column;input,select,textarea{width:100%;height:var(--uix-input-height);border-radius:var(--uix-input-border-radius);border:var(--uix-input-border-width) solid var(--uix-input-border-color);font-size:var(--uix-input-font-size);background-color:var(--uix-input-background-color);color:var(--uix-input-text-color);transition:var(--uix-transition);outline:none;padding:var(--uix-input-padding-y) var(--uix-input-padding-x)}textarea{resize:vertical}&:has(textarea){height:auto}select{appearance:none;-webkit-appearance:none;cursor:pointer;font-weight:600;padding-block:0;option{font-weight:600;background-color:var(--uix-input-background-color);font-size:1.1rem;line-height:1.5rem;color:#333;padding:50px;border:2px solid red}}.select-container{position:relative;.select-arrow{position:absolute;right:calc(2 * var(--spacing))}}input::placeholder{color:transparent}label{font-weight:var(--uix-input-label-font-weight);color:var(--uix-input-label-color, var(--colors-gray-600));margin-bottom:var(--spacing);font-size:.9rem;padding:0 4px;transition:all .2s ease-in-out;pointer-events:none;&[required]:after{content:"*";color:var(--colors-danger-500);margin-left:2px}}input:not(:placeholder-shown)+label,textarea:not(:placeholder-shown)+label,&:focus-within label,&.has-value label{top:-2px;transform:translateY(0);font-size:var(--uix-input-label-font-size)}&:focus-within input,&:focus-within select,&:focus-within textarea{box-shadow:0 0 var(--uix-input-focus-ring-width, 5px) var(--uix-input-focus-ring-color, rgba(0, 0, 255, .5))}&[disabled]{cursor:not-allowed;opacity:var(--uix-input-disabled-opacity);& label{cursor:not-allowed}}.input-icon,.select-arrow{position:absolute;top:50%;right:var(--spacing);transform:translateY(-50%);pointer-events:none;color:var(--uix-input-label-color);transition:transform .2s ease-in-out}&:has(select:hover:active) .select-arrow{transform:translateY(-50%) rotate(180deg)}&:has(.input-icon:not(.select-arrow))>input{padding-right:calc(var(--uix-input-padding-x) + 1.75em)}&[type=checkbox],&[type=radio]{flex-direction:row;align-items:center;border:0;height:auto;width:auto;background-color:transparent;box-shadow:none;gap:.75rem;cursor:pointer;label{margin:0;line-height:1.5rem;position:static;transform:none;background-color:transparent;padding:0;cursor:pointer;font-weight:var(--font-weight-normal);order:2;pointer-events:auto}input{appearance:none;-webkit-appearance:none;width:var(--uix-input-checkbox-size);height:var(--uix-input-checkbox-size);margin:0;border:var(--uix-input-border-width) solid var(--uix-input-border-color);background-color:var(--uix-input-background-color);cursor:pointer;position:relative;transition:var(--uix-transition);padding:0;&:after{content:"";position:absolute;display:none;left:50%;top:50%}&:checked{background-color:var(--uix-input-checkbox-checked-bg);border-color:var(--uix-input-checkbox-checked-bg);&:after{display:block}}&:focus-visible{box-shadow:0 0 0 var(--uix-input-focus-ring-width) var(--uix-input-focus-ring-color);border-color:var(--uix-input-focus-ring-color)}}}&[type=checkbox] input:after{width:.375rem;height:.75rem;border:solid var(--uix-input-checkbox-check-color);border-width:0 2px 2px 0;transform:translate(-50%,-60%) rotate(45deg)}&[type=radio] input{border-radius:var(--border-radius-full);&:after{width:calc(var(--uix-input-checkbox-size) / 2);height:calc(var(--uix-input-checkbox-size) / 2);border-radius:var(--border-radius-full);background-color:var(--uix-input-checkbox-check-color);transform:translate(-50%,-50%)}}&[ghost]{&:focus-within select{box-shadow:none}.select-arrow{margin-left:5px;padding-left:5px}select{background:inherit;border:0}}}
`,metaType:"text/css"}};self.addEventListener("install",t=>t.waitUntil(self.skipWaiting())),self.addEventListener("activate",t=>t.waitUntil(self.clients.claim())),self.addEventListener("fetch",t=>{const e=new URL(t.request.url),n=FILE_BUNDLE[e.pathname];n&&t.respondWith(new Response(n.content,{headers:{"Content-Type":n.metaType||"application/javascript"}}))});
