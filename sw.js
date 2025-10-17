const FILE_BUNDLE={"/modules/uix/navigation/tabs.js":{content:`export default ({ T, html }) => ({
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
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/refresh-cw.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/apps/mcp/views/dashboard.js":{content:`export default ({ html, T }) => ({
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
`,mimeType:"text/css",skipSW:!1},"/modules/apps/mcp/views/tools.js":{content:`export default ({ html, AI, T }) => {
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/prompts.js":{content:`export default ({ html, AI, T }) => {
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/display/card.js":{content:`export default {
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
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/file-text.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8m8 4H8m8 4H8"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/file-code-2.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4M5 12l-3 3l3 3m4 0l3-3l-3-3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/uix/display/markdown.js":{content:`// TODO: add DOMPurify
export const dependencies = {
	marked: ["https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js", "marked"],
};
export default ({ html, marked, T }) => ({
	tag: "uix-markdown",
	style: true,
	class: "prose max-w-none",
	properties: { content: T.string() },
	render() {
		return html.unsafeHTML(marked.parse(this.content || ""));
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/lucide/circle-check.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12l2 2l4-4"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/circle.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/uix/display/markdown.css":{content:`:where(.uix-markdown) {
	display: block;
	overflow-y: auto;
	height: 100%;
	font-size: 1.125rem;
	line-height: 1rem;
	& > :first-child {
		margin-top: 0;
	}
	& > :last-child {
		margin-bottom: 0;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-weight: 600;
	}

	h1 {
		font-size: 1.8em;
		padding-bottom: 0.3em;
		line-height: 2.5rem;
	}

	h2 {
		font-size: 1.6em;
		line-height: 1.9rem;
		padding-bottom: 0.3em;
	}

	h3 {
		font-size: 1.4em;
		line-height: 1.4rem;
	}

	h4 {
		font-size: 1.2em;
	}

	h5 {
		font-size: 1em;
	}

	h6 {
		font-size: 0.9em;
	}

	p {
		line-height: 1.4rem;
		margin-bottom: 0.5em;
	}

	a {
		font-weight: 500;
		text-decoration: none;
		color: var(--prose-link-color);

		&:hover {
			text-decoration: underline;
		}
	}

	/* --- Lists --- */
	ul,
	ol {
		margin: 0 0 0.5em 0.5em;
		padding-left: 1em;
	}

	ul {
		list-style-type: square;
	}

	ol {
		list-style-type: decimal;
	}

	hr {
		border: 0;
		border-top: 1px solid var(--border-color);
		margin-block: 0.5rem;
		margin-inline: 30%;
	}

	blockquote {
		margin: 0 0 1em;
		padding: 0em 1em;
		border-left: 4px solid var(--border-color);
		color: var(--prose-muted-text-color);
		& > :last-child {
			margin-bottom: 0;
			padding-bottom: 0;
		}
	}

	code {
		background-color: var(--prose-code-bg-color);
		padding: 0.2em 0.4em;
		margin: 0 0.1rem;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.9em;
	}

	pre {
		background-color: #2d3748;
		color: #e2e8f0;
		padding: 1em;
		margin-block: 1em;
		border-radius: 8px;
		overflow-x: auto;
		white-space: pre-wrap;

		code {
			background-color: transparent;
			padding: 0;
			margin: 0;
			font-size: 1em;
			line-height: 1.5;
		}
	}

	/* --- Tables --- */
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 0 0 1.5em;
		font-size: 0.95em;
	}

	th,
	td {
		border: 1px solid var(--border-color);
		padding: 0.75em 1em;
		text-align: left;
	}

	thead {
		background-color: #f7fafc;

		th {
			font-weight: 600;
		}
	}

	tbody {
		tr:nth-child(odd) {
			background-color: #f9fafb;
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/layout-dashboard.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/git-branch-plus.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 3v12m12-6a3 3 0 1 0 0-6a3 3 0 0 0 0 6M6 21a3 3 0 1 0 0-6a3 3 0 0 0 0 6"/><path d="M15 6a9 9 0 0 0-9 9m12 0v6m3-3h-6"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/key.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m15.5 7.5l2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4m2-2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/views/templates/app.js":{content:`export default ({ html, AI, T }) => {
	return {
		style: true,
		class: "w-full h-screen bg-[#282828] text-[#ebdbb2] flex font-sans text-sm",
		properties: {
			currentRoute: T.object({ sync: "ram" }),
			isServerConnected: T.boolean({ sync: "local" }),
		},
		async connected() {
			await this.initializeAI();
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
			} catch (error) {
				console.error("Error initializing AI service:", error);
				this.isServerConnected = false;
			}
		},
		render() {
			return html\`
				<mcp-sidebar></mcp-sidebar>
				<div class="flex-1 h-full flex flex-col min-w-0">
					<div
						class="h-15 bg-[#3c3836] border-b border-[#504945] p-2 flex items-center justify-between"
					>
					
					</div>
					<div class="flex-1 overflow-auto flex">
            \${this.component}
					</div>
				</div>
			\`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/views/templates/app.css":{content:`.app-template {
	.uix-card {
		button {
			color: #111;
			cursor: pointer;
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/apps/mcp/views/sidebar.js":{content:`export default ({ html, T }) => ({
	class:
		"w-64 bg-[#3c3836] text-[#ebdbb2] flex flex-col h-screen shrink-0 border-r border-[#504945]",
	properties: {
		currentRoute: T.object({ sync: "ram" }),
		onSelectHistory: T.function(),
		isDarkMode: T.boolean({ defaultValue: true, sync: "local" }),
	},

	_renderLink(link) {
		const isActive = this.currentRoute.name === link.key;
		return html\`
            <uix-link href=\${\`/\${link.key}\`}
          icon=\${link.icon}
          label=\${link.label}
          data-active=\${isActive}
          class="[&>a>uix-icon]:w-5 [&>a>uix-icon]:h-5
            relative flex items-center text-sm font-bold p-2 rounded-md transition-colors w-full
            text-[#ebdbb2] hover:bg-[#504945]
            data-[active=true]:bg-[#504945] data-[active=true]:text-white
          ">
                \${
									link.isComingSoon
										? html\`<span class="ml-auto bg-[#b16286] text-xs font-bold text-white px-2 py-0.5 rounded-full absolute right-3">soon</span>\`
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
			{ key: "discover", label: "Discover", icon: "telescope" },
			{ key: "dev", label: "Develop", icon: "code" },
			{ key: "chat", label: "Chat", icon: "message-circle" },
			{ key: "inspector", label: "Inspector", icon: "search" },
			{ key: "local-servers", label: "Servers", icon: "server" },
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
            <h2 class="text-xl text-[#ebdbb2] tracking-widest font-bold"><a href="/">\u{1F336}\uFE0F MCPiquant</a></h2>
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
								<uix-darkmode client:defer ghost></uix-darkmode>				
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
`,mimeType:"application/javascript",skipSW:!1},"/views/templates/discover.js":{content:`import { keyed } from "/modules/mvc/view/html/directive.js";
export default ({ html, T, $APP, Model }) => {
	$APP.define("mcp-discover-list-view", {
		properties: {
			type: T.string("server"),
			tagId: T.string(),
			page: T.string("1"),
		},
		render() {
			const modelName = \`\${this.type}s\`;
			const dataQuery = {
				model: modelName,
				key: "artifacts",
				offset: ((this.page ?? 1) - 1) * 6,
				limit: 6,
			};
			if (this.tagId) dataQuery.where = { tags: { $includes: this.tagId } };
			return keyed(
				this.page,
				html\`<mcp-artifact-grid
                                type=\${this.type}
                                .data-query=\${dataQuery}
																page=\${this.page}
                                ></mcp-artifact-grid>\`,
			);
		},
	});
	$APP.define("mcp-capabilities-display", {
		properties: {
			capabilities: T.object(),
			type: T.string("server"),
		},
		render() {
			if (!this.capabilities) return html\`\`;

			const capabilityConfig = {
				resources: { label: "Resources", icon: "database" },
				prompts: { label: "Prompts", icon: "message-square" },
				tools: { label: "Tools", icon: "wrench" },
				discovery: { label: "Discovery", icon: "search" },
				sampling: { label: "Sampling", icon: "activity" },
				roots: { label: "Roots", icon: "folder-tree" },
				elicitation: {
					label: "Elicitation",
					icon: "info",
				},
			};

			const entries = Object.entries(this.capabilities);
			if (entries.length === 0) return html\`\`;

			return html\`
                <div class="flex flex-col gap-3">
                    <h4 class="text-xs font-bold text-[#a89984] uppercase tracking-wide">
                        Capabilities
                    </h4>
                    <div class="grid grid-cols-2 gap-2">
                        \${entries.map(([key, value]) => {
													const config = capabilityConfig[key];
													if (!config) return "";

													const isEnabled = value === true;
													return html\`
                                <div class="flex items-center gap-2 px-3 py-2 rounded-md \${
																	isEnabled
																		? "bg-[#3c3836] border border-[#83a598]"
																		: "bg-[#282828] border border-[#3c3836] opacity-50"
																}">
                                    <uix-icon
                                        name=\${config.icon}
                                        class="w-4 h-4 \${isEnabled ? "text-[#83a598]" : "text-[#665c54]"}"
                                    ></uix-icon>
                                    <span class="text-xs font-semibold \${
																			isEnabled
																				? "text-[#ebdbb2]"
																				: "text-[#928374]"
																		}">
                                        \${config.label}
                                    </span>
                                </div>
                            \`;
												})}
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-connection-configurator", {
		properties: {
			artifact: T.object(),
			copyStatus: T.object({ defaultValue: {} }),
			formValues: T.object({ defaultValue: {} }),
		},
		connected() {
			this.formValues = {};
			const pkg = this.artifact?.packages?.[0];
			if (pkg?.environmentVariables) {
				pkg.environmentVariables.forEach((env) => {
					this.formValues[env.name] = env.defaultValue || "";
				});
			}
			if (!this.formValues["port"]) {
				this.formValues["port"] = "8080";
			}
		},
		handleInputChange(name, value) {
			this.formValues[name] = value;
			this.update();
		},
		copyToClipboard(key, text) {
			navigator.clipboard
				.writeText(text)
				.then(() => {
					this.copyStatus[key] = "Copied!";
					this.update();
					setTimeout(() => {
						this.copyStatus[key] = null;
						this.update();
					}, 2000);
				})
				.catch((err) => {
					console.error("Failed to copy text: ", err);
					this.copyStatus[key] = "Failed!";
					this.update();
				});
		},
		renderPackageRunner(pkg) {
			const port = this.formValues["port"] || "8080";
			const envVars = pkg.environmentVariables || [];

			const mcpServerConfig = JSON.stringify(
				{
					mcpServers: {
						[this.artifact.id]: {
							type: pkg.transport.type === "stdio" ? "sse" : pkg.transport.type,
							url: \`http://127.0.0.1:\${port}/\${pkg.transport.type === "stdio" ? "sse" : ""}\`.replace(
								/\\/$/,
								"",
							),
						},
					},
				},
				null,
				2,
			);

			const transportRunnerArgs = [pkg.identifier, "--port", port];
			const transportRunnerConfig = JSON.stringify(
				{
					command: "npx",
					args: transportRunnerArgs,
					env: this.formValues,
				},
				null,
				2,
			);

			return html\`
                <div class="flex flex-col gap-4">
                    <div>
                        <h4 class="text-xs font-bold text-[#a89984] uppercase tracking-wide mb-2">Package Arguments</h4>
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center gap-2">
                                <label for="port" class="text-sm font-semibold text-[#bdae93] w-48">Server port number</label>
                                <input id="port" type="number" value=\${port} @input=\${(e) => this.handleInputChange("port", e.target.value)} class="flex-1 bg-[#1d2021] border-2 border-[#3c3836] font-mono text-sm text-[#ebdbb2] rounded-md py-1.5 px-3 focus:outline-none focus:border-[#83a598]" />
                            </div>
                            \${envVars.map(
															(env) => html\`
                                    <div class="flex items-center gap-2">
                                        <label for=\${env.name} class="text-sm font-semibold text-[#bdae93] w-48" title=\${env.description}>\${env.name}</label>
                                        <input id=\${env.name} type=\${env.isSecret ? "password" : "text"} value=\${this.formValues[env.name] || ""} @input=\${(e) => this.handleInputChange(env.name, e.target.value)} class="flex-1 bg-[#1d2021] border-2 border-[#3c3836] font-mono text-sm text-[#ebdbb2] rounded-md py-1.5 px-3 focus:outline-none focus:border-[#83a598]" placeholder=\${env.description} />
                                    </div>
                                \`,
														)}
                        </div>
                    </div>

                    \${this.renderConfigBlock("MCP Server Configuration", mcpServerConfig, "mcpConfig")}
                    \${this.renderConfigBlock("Transport Runner Configuration", transportRunnerConfig, "runnerConfig")}
                </div>
            \`;
		},
		renderRemoteConnector(remote) {
			const mcpServerConfig = JSON.stringify(
				{
					mcpServers: {
						[this.artifact.id]: {
							type: remote.type.replace("streamable-http", "http"),
							url: remote.url,
						},
					},
				},
				null,
				2,
			);

			return html\`
                <div class="flex flex-col gap-4">
                           \${this.renderConfigBlock("MCP Server Configuration", mcpServerConfig, "mcpConfig")}
                </div>
            \`;
		},
		renderConfigBlock(title, configString, key) {
			return html\`
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="text-xs font-bold text-[#a89984] uppercase tracking-wide">\${title}</h4>
                        <button @click=\${() => this.copyToClipboard(key, configString)} class="flex items-center gap-1.5 text-xs font-bold text-[#83a598] hover:text-[#ebdbb2] transition-colors">
                            <uix-icon name="copy" class="w-3.5 h-3.5"></uix-icon>
                            \${this.copyStatus[key] || "Copy"}
                        </button>
                    </div>
                    <pre class="bg-[#1d2021] border border-[#3c3836] rounded-md p-3 text-xs text-[#98971a] font-mono overflow-x-auto"><code>\${configString}</code></pre>
                </div>
            \`;
		},
		render() {
			const { artifact } = this;
			if (!artifact) return html\`\`;

			const pkg = artifact.packages?.[0];
			const remote = artifact.remotes?.find(
				(r) => r.type === "sse" || r.type === "streamable-http",
			);

			return html\`
                <div class="flex flex-col gap-3 mt-4">
                    <h4 class="text-xs font-bold text-[#a89984] uppercase tracking-wide">
                        Connection
                    </h4>
                    <div class="bg-[#282828] border-2 border-dashed border-[#3c3836] rounded-lg p-4">
                        \${pkg ? this.renderPackageRunner(pkg) : remote ? this.renderRemoteConnector(remote) : html\`<p class="text-sm text-[#928374]">No connection information available.</p>\`}
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-tags-grid", {
		properties: {
			tags: T.array([]),
			type: T.string("server"),
		},
		render() {
			if (!this.tags || this.tags.length === 0) return html\`\`;

			const baseUrl = \`/\${this.type}s\`;

			return html\`
                <div class="grid grid-cols-3 gap-2">
                    \${this.tags.map(
											(tag) => html\`
                            <uix-link
                                href=\${\`\${baseUrl}/tag/\${encodeURIComponent(tag)}\`}
                                label=\${tag}
                                class="text-xs font-bold px-2 py-1 rounded bg-[#504945] text-[#ebdbb2] hover:bg-[#665c54] transition-colors truncate block text-center"
                            >
                            </uix-link>
                        \`,
										)}
                </div>
            \`;
		},
	});

	$APP.define("mcp-server-card", {
		properties: {
			artifact: T.object(),
			isDetailView: T.boolean(false),
		},
		onToggleHot(e) {
			e.stopPropagation();
			e.preventDefault();
			Model.servers.edit({
				id: this.artifact.id,
				hots: (this.artifact.hots ?? 0) + (this.artifact.hotted ? -1 : 1),
				hotted: !this.artifact.hotted,
			});
		},
		onToggleFavorite(e) {
			e.stopPropagation();
			e.preventDefault();
			Model.servers.edit({
				id: this.artifact.id,
				favorite: !this.artifact.favorite,
			});
		},
		render() {
			const { artifact, isDetailView } = this;
			if (!artifact) return html\`\`;

			const isFavorited = artifact.favorite;
			const starClass = isFavorited ? "text-[#fabd2f]" : "text-[#a89984]";

			const transportInfo = [];
			if (artifact.transports) {
				if (artifact.transports.stdio)
					transportInfo.push({ icon: "terminal", label: "stdio" });
				if (artifact.transports.sse)
					transportInfo.push({ icon: "radio", label: "SSE" });
				if (artifact.transports.streamableHTTP)
					transportInfo.push({ icon: "globe", label: "HTTP" });
			}

			return html\`
                <div class=\${\`\${isDetailView ? "" : "hover:border-[#cc241d] hover:shadow-[6px_6px_0px_#cc241d]"} bg-[#282828]
                    w-full h-full flex-1 border-2 border-[#3c3836] rounded-lg p-5 flex flex-col gap-5
                    font-semibold transition-all duration-200 shadow-[4px_4px_0px_#1d2021]\`}>
                    <div class="flex items-center gap-4 w-full">
                        <div class="w-12 h-12 text-xl rounded-md flex-shrink-0 flex items-center justify-center bg-[#1d2021] text-[#cc241d]">
                            \${artifact.icon ? html\`<uix-icon name=\${artifact.icon} class="w-6 h-6"></uix-icon>\` : artifact.name[0].toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h3 class="font-bold text-lg truncate">
                                    <uix-link class="text-[#ebdbb2]" href=\${\`/server/\${artifact.id.replace("/", "_")}\`} label=\${artifact.name}></uix-link>
                                </h3>
                                \${artifact.version ? html\`<span class="text-xs text-[#928374] font-mono bg-[#1d2021] px-2 py-0.5 rounded">v\${artifact.version}</span>\` : ""}
                                \${artifact.isConnected ? html\`<span class="text-xs text-[#98971a] font-medium whitespace-nowrap">Connected</span>\` : ""}
                            </div>
                            \${artifact.repository?.url ? html\`<a href=\${artifact.repository.url} target="_blank" class="text-xs text-[#928374] hover:text-[#cc241d] truncate block flex items-center gap-1"><uix-icon name="github" class="w-3 h-3"></uix-icon>\${artifact.repository.url.replace("https://github.com/", "")}</a>\` : ""}
                        </div>
                        <uix-link
                            @click=\${this.onToggleFavorite.bind(this)}
                            icon="star"
                            class="w-6 h-6 \${starClass} pointer transition-colors hover:text-yellow-300 flex-shrink-0"
                            fill=\${isFavorited ? "currentColor" : "none"}
                        ></uix-link>
                    </div>

                    <p class="text-sm text-[#bdae93] font-medium leading-relaxed">
                        \${artifact.description}
                    </p>

                    \${
											transportInfo.length > 0 && !isDetailView
												? html\`
                                <div class="flex flex-col gap-2">
                                    <h4 class="text-xs font-bold text-[#a89984] uppercase tracking-wide">
                                        Transports
                                    </h4>
                                    <div class="flex flex-wrap gap-2">
                                        \${transportInfo.map(
																					(t) => html\`
                                                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3c3836] border border-[#83a598]">
                                                    <uix-icon name=\${t.icon} class="w-3.5 h-3.5 text-[#83a598]"></uix-icon>
                                                    <span class="text-xs font-semibold text-[#ebdbb2]">\${t.label}</span>
                                                </div>
                                            \`,
																				)}
                                    </div>
                                </div>\`
												: ""
										}

                    \${
											artifact.capabilities
												? html\`
                                <mcp-capabilities-display
                                    .capabilities=\${artifact.capabilities}
                                    type="server"
                                ></mcp-capabilities-display>\`
												: ""
										}
                    
                    \${isDetailView ? html\`<mcp-connection-configurator .artifact=\${artifact}></mcp-connection-configurator>\` : ""}
                    
                    <div class="flex flex-col gap-4 pt-4 border-t-2 border-dashed border-[#504945] w-full mt-auto">
                        <mcp-tags-grid .tags=\${artifact.tags || []} type="server"></mcp-tags-grid>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <button
                                    @click=\${this.onToggleHot.bind(this)}
                                    class="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors font-bold text-sm \${
																			artifact.hotted
																				? "bg-[#fe8019] text-[#1d2021]"
																				: "bg-[#504945] text-[#ebdbb2] hover:bg-[#665c54]"
																		}"
                                >
                                    <uix-icon name="flame" class="w-4 h-4"></uix-icon>
                                    <span>\${artifact.hots ?? 0}</span>
                                </button>
                                <div class="flex items-center gap-1.5 text-[#a89984] font-bold text-sm" title="Comments">
                                    <uix-icon name="message-circle" class="w-4 h-4"></uix-icon>
                                    <span>\${artifact.commentsCount ?? 0}</span>
                                </div>
                            </div>
                               \${
																	!isDetailView
																		? artifact.isConnected
																			? html\`<uix-button label="Disconnect" class="bg-[#cc241d] text-[#ebdbb2] font-bold" size="small"></uix-button>\`
																			: html\`<uix-button label="Connect" class="bg-[#cc241d] text-[#ebdbb2] font-bold" size="small"></uix-button>\`
																		: ""
																}
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-client-card", {
		properties: {
			artifact: T.object(),
			isDetailView: T.boolean(false),
		},
		onToggleHot(e) {
			e.stopPropagation();
			e.preventDefault();
			Model.clients.edit({
				id: this.artifact.id,
				hots: (this.artifact.hots ?? 0) + (this.artifact.hotted ? -1 : 1),
				hotted: !this.artifact.hotted,
			});
		},
		onToggleFavorite(e) {
			e.stopPropagation();
			e.preventDefault();
			Model.clients.edit({
				id: this.artifact.id,
				favorite: !this.artifact.favorite,
			});
		},
		render() {
			const { artifact, isDetailView } = this;
			if (!artifact) return html\`\`;

			const isFavorited = artifact.favorite;
			const starClass = isFavorited ? "text-[#fabd2f]" : "text-[#a89984]";

			return html\`
                <div class=\${\`\${isDetailView ? "" : "hover:border-[#98971a] hover:shadow-[6px_6px_0px_#98971a]"} bg-[#282828]
                    w-full h-full flex-1 border-2 border-[#3c3836] rounded-lg p-5 flex flex-col gap-5
                    font-semibold transition-all duration-200 shadow-[4px_4px_0px_#1d2021]\`}>
                    
                    <div class="flex items-center gap-4 w-full">
                        <div class="w-12 h-12 text-xl rounded-md flex-shrink-0 flex items-center justify-center bg-[#1d2021] text-[#98971a]">
                            \${artifact.icon ? html\`<uix-icon name=\${artifact.icon} class="w-6 h-6"></uix-icon>\` : artifact.name[0].toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-lg truncate">
                                    <uix-link class="text-[#ebdbb2]" href=\${\`/client/\${encodeURIComponent(artifact.id)}\`} label=\${artifact.name}></uix-link>
                                </h3>
                            </div>
                            \${
															artifact.url
																? html\`<uix-link href=\${artifact.url} target="_blank" class="[&>a>uix-icon]:w-3 [&>a>uix-icon]:h-3 text-xs text-[#928374] hover:text-[#98971a] truncate block" label=\${artifact.url} icon="link"></uix-link>\`
																: ""
														}
                        </div>
                        <uix-link
                            @click=\${this.onToggleFavorite.bind(this)}
                            icon="star"
                            class="[&>a>uix-icon]:w-6 [&>a>uix-icon]:h-6 \${starClass} pointer transition-colors hover:text-yellow-300 flex-shrink-0"
                            fill=\${isFavorited ? "currentColor" : "none"}
                        ></uix-link>
                    </div>

                    <!-- Description -->
                    <p class="text-sm text-[#bdae93] font-medium leading-relaxed">
                        \${artifact.description}
                    </p>

                    <!-- Capabilities (Client-specific) -->
                    \${
											artifact.capabilities
												? html\`
                                <mcp-capabilities-display
                                    .capabilities=\${artifact.capabilities}
                                    type="client"
                                ></mcp-capabilities-display>
                            \`
												: ""
										}

                    <!-- Platform Tags (Client-specific feature) -->
                    \${
											artifact.tags?.some((t) =>
												["web", "desktop", "mobile"].includes(t),
											)
												? html\`
                                <div class="flex flex-col gap-2">
                                    <h4 class="text-xs font-bold text-[#a89984] uppercase tracking-wide">
                                        Platforms
                                    </h4>
                                    <div class="flex flex-wrap gap-2">
                                        \${artifact.tags
																					.filter((t) =>
																						[
																							"web",
																							"desktop",
																							"mobile",
																						].includes(t),
																					)
																					.map((platform) => {
																						const platformIcons = {
																							web: "globe",
																							desktop: "monitor",
																							mobile: "smartphone",
																						};
																						return html\`
                                                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3c3836] border border-[#98971a]">
                                                    <uix-icon name=\${platformIcons[platform]} class="w-3.5 h-3.5 text-[#98971a]"></uix-icon>
                                                    <span class="text-xs font-semibold text-[#ebdbb2] capitalize">\${platform}</span>
                                                </div>
                                            \`;
																					})}
                                    </div>
                                </div>
                            \`
												: ""
										}

                    <!-- Footer Section -->
                    <div class="flex flex-col gap-4 pt-4 border-t-2 border-dashed border-[#504945] w-full mt-auto">
                        <mcp-tags-grid .tags=\${(artifact.tags || []).filter((t) => !["web", "desktop", "mobile"].includes(t))} type="client"></mcp-tags-grid>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <button
                                    @click=\${this.onToggleHot.bind(this)}
                                    class="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors font-bold text-sm \${
																			artifact.hotted
																				? "bg-[#fe8019] text-[#1d2021]"
																				: "bg-[#504945] text-[#ebdbb2] hover:bg-[#665c54]"
																		}"
                                >
                                    <uix-icon name="flame" class="w-4 h-4"></uix-icon>
                                    <span>\${artifact.hots ?? 0}</span>
                                </button>
                                <div class="flex items-center gap-1.5 text-[#a89984] font-bold text-sm" title="Comments">
                                    <uix-icon name="message-circle" class="w-4 h-4"></uix-icon>
                                    <span>\${artifact.commentsCount}</span>
                                </div>
                            </div>
                            <a href=\${artifact.url} target="_blank" class="no-underline">
                                <uix-button label="View Client" class="bg-[#98971a] text-[#ebdbb2] font-bold" size="small"></uix-button>
                            </a>
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-discover-header", {
		properties: {
			type: T.string("server"),
			searchQuery: T.string(""),
			availableTags: T.array([]),
			onSearchChange: T.function(),
			currentRoute: T.object({ sync: "ram" }),
		},
		render() {
			const navItems = ["Servers", "Clients", "Agents"];
			return html\`
                <div class="flex flex-col gap-6">
                    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 class="font-bold text-3xl text-[#ebdbb2]">Discover</h1>
                            <p class="text-[#bdae93]">
                                Browse, experiment, develop, and discuss all things MCP
                            </p>
                        </div>
                        <div class="relative">
                            <input
                                type="text"
                                value=\${this.searchQuery}
                                @input=\${(e) => this.onSearchChange(e.target.value)}
                                placeholder="Search ..."
                                class="w-full md:w-72 bg-[#282828] border-2 border-[#3c3836] font-semibold text-[#ebdbb2] rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:shadow-[2px_2px_0px_#1d2021] focus:border-[#83a598] transition"
                            />
                            <uix-icon
                                name="search"
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#928374]"
                            ></uix-icon>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div class="flex items-center border border-[#3c3836] rounded-lg bg-[#282828] w-full md:w-auto self-start">
                            \${navItems.map((item) => {
															const tab = item.toLowerCase();
															const url = \`/\${tab === "servers" ? "" : tab}\`;
															const isActive =
																tab === "servers"
																	? this.currentRoute.path === "/" ||
																		this.currentRoute.path.startsWith(
																			"/servers",
																		)
																	: this.currentRoute.path.startsWith(url);
															return html\`
                                    <uix-link
                                        href=\${url}
                                        label=\${item}
                                        class="block [&>a]:px-5 [&>a]:py-2.5 [&>a]:block rounded-md text-sm font-semibold transition-colors \${
																					isActive
																						? "bg-[#458588] text-[#ebdbb2]"
																						: "text-[#bdae93] hover:bg-[#3c3836]"
																				}"
                                    >
                                    </uix-link>
                                \`;
														})}
                        </div>
                        <div>
                            <div class="flex flex-wrap gap-2">
                                <span class="text-[#a89984] font-bold text-xs self-center pr-2">TAGS:</span>
                                \${this.availableTags.map((tag) => {
																	const isActive =
																		this.currentRoute.params.tagId &&
																		this.currentRoute.params.tagId === tag.id;
																	return html\`
                                        <uix-link
                                            href=\${\`/\${this.type}s/tag/\${encodeURIComponent(tag.id)}\`}
                                            label=\${tag.name}
                                            class="text-xs font-bold px-2 py-1 rounded transition-colors \${
																							isActive
																								? "bg-[#83a598] text-[#1d2021]"
																								: "bg-[#504945] text-[#ebdbb2] hover:bg-[#665c54]"
																						}"
                                        >
                                        </uix-link>
                                    \`;
																})}
                            </div>
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-artifact-grid", {
		class: "flex flex-col gap-6",
		properties: {
			artifacts: T.array(),
			type: T.string("server"),
			onClearFilters: T.function(),
			searchQuery: T.string(""),
			activeTags: T.array([]),
			availableTags: T.array([]),
			component: T.object(),
			page: T.string(),
			currentRoute: T.object({
				sync: "ram",
				attribute: false,
				reflect: false,
			}),
		},
		async connected() {
			this._currentArtifactType = undefined;
		},
		async _fetchTagsForType(type) {
			if (this._currentArtifactType === type) return;
			this._currentArtifactType = type;

			if (!type) {
				this.availableTags = [];
				return;
			}

			const tags = await Model.tags.getAll();
			this.availableTags = [...new Set(tags)];
		},
		toggleTag(tagToToggle) {
			const tagIndex = this.activeTags.indexOf(tagToToggle);
			if (tagIndex > -1) {
				this.activeTags.splice(tagIndex, 1);
			} else {
				this.activeTags.push(tagToToggle);
			}
			this.update();
		},
		clearFilters() {
			this.activeTags = [];
			this.searchQuery = "";
			this.update();
		},
		render() {
			const artifactType = this.type;
			this._fetchTagsForType(artifactType);
			const { artifacts = [] } = this;
			const CardComponent =
				this.type === "client" ? "mcp-client-card" : "mcp-server-card";

			const totalCount = this["data-query"]?.count;
			const limit = this["data-query"]?.limit || 6;
			let paginationHtml = html\`\`;
			if (totalCount && totalCount > limit) {
				const totalPages = Math.ceil(totalCount / limit);
				const currentPage = this.page ? Number.parseInt(this.page, 10) : 1;
				const path = \`/\${artifactType}s\`;

				const createLink = (pageNumber, customLabel = null) => {
					const isActive = pageNumber === currentPage;
					return html\`
                        <uix-link
                            href=\${\`\${path}/page/\${pageNumber}\`}
                            label=\${customLabel || String(pageNumber)}
                            class="block [&>a]:px-4 [&>a]:py-2 [&>a]:block rounded-md text-sm font-bold transition-colors \${
															isActive
																? "bg-[#83a598] text-[#1d2021]"
																: "bg-[#3c3836] text-[#ebdbb2] hover:bg-[#504945]"
														}"
                        ></uix-link>
                    \`;
				};

				const ellipsis = html\`<span class="flex items-center justify-center px-2 py-2 text-sm font-bold text-[#928374]">...</span>\`;
				const pageLinks = [];

				const maxVisiblePages = 5;
				if (totalPages <= maxVisiblePages + 2) {
					for (let i = 1; i <= totalPages; i++) {
						pageLinks.push(createLink(i));
					}
				} else {
					pageLinks.push(createLink(1));
					let startPage = Math.max(2, currentPage - 2);
					let endPage = Math.min(totalPages - 1, currentPage + 2);
					if (currentPage <= 4) endPage = maxVisiblePages;

					if (currentPage > totalPages - 4)
						startPage = totalPages - maxVisiblePages + 1;

					if (startPage > 2) pageLinks.push(ellipsis);

					for (let i = startPage; i <= endPage; i++)
						pageLinks.push(createLink(i));

					if (endPage < totalPages - 1) pageLinks.push(ellipsis);

					pageLinks.push(createLink(totalPages));
				}

				const hasPrev = currentPage > 1;
				const hasNext = currentPage < totalPages;

				paginationHtml = html\`
                    <div class="flex items-center justify-center gap-2 mt-8">
                        <uix-link
                            href=\${hasPrev ? \`\${path}/page/\${currentPage - 1}\` : null}
                            label="Previous"
                            class="block [&>a]:px-4 [&>a]:py-2 [&>a]:block rounded-md text-sm font-bold bg-[#3c3836] text-[#ebdbb2] hover:bg-[#504945] transition-colors \${!hasPrev ? "opacity-50 pointer-events-none" : ""}"
                        ></uix-link>
                        \${pageLinks}
                        <uix-link
                            href=\${hasNext ? \`\${path}/page/\${currentPage + 1}\` : null}
                            label="Next"
                            class="block [&>a]:px-4 [&>a]:py-2 [&>a]:block rounded-md text-sm font-bold bg-[#3c3836] text-[#ebdbb2] hover:bg-[#504945] transition-colors \${!hasNext ? "opacity-50 pointer-events-none" : ""}"
                        ></uix-link>
                    </div>
                \`;
			}

			console.log({ paginationHtml });
			// SEO Info for Grid View
			const pageTitle = \`Discover \${this.type.charAt(0).toUpperCase() + this.type.slice(1)}s\`;
			const description = \`Browse and find \${this.type}s on the MCP network.\`;

			return html\`
                <uix-seo
                    pageTitle=\${pageTitle}
                    description=\${description}
                ></uix-seo>

                <mcp-discover-header
                    type=\${this.type}
                    searchQuery=\${this.searchQuery}
                    .activeTags=\${this.activeTags}
                    .availableTags=\${this.availableTags}
                    .onSearchChange=\${(q) => {
											this.searchQuery = q;
										}}
                >
                </mcp-discover-header>
                <div class="flex-grow">
                    \${
											artifacts.length === 0
												? html\`
                                <div class="w-full text-center text-[#928374] p-8 bg-[#282828] border-2 border-dashed border-[#3c3836] rounded-lg">
                                    <h3 class="font-bold text-lg text-[#ebdbb2]">
                                        No Artifacts Found
                                    </h3>
                                    <p>
                                        Your search and filter combination did not match any artifacts.
                                    </p>
                                    <button
                                        @click=\${() => this.onClearFilters()}
                                        class="mt-4 text-sm font-bold text-[#83a598] hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            \`
												: html\`
                                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    \${artifacts.map(
																			(artifact) => html.staticHTML\`
                                            <\${html.unsafeStatic(CardComponent)}
                                                .artifact=\${artifact}
                                            ></\${html.unsafeStatic(CardComponent)}>
                                        \`,
																		)}
                                </div>
                                \${paginationHtml}
                            \`
										}
                </div>
            \`;
		},
	});

	$APP.define("mcp-artifact-detail", {
		class: "flex-grow gap-8 flex flex-col",
		properties: {
			type: T.string("server"),
			artifact: T.object(),
		},
		render() {
			const { artifact } = this;
			if (!artifact) return html\`\`;

			const CardComponent =
				this.type === "client" ? "mcp-client-card" : "mcp-server-card";

			const backUrl = this.type === "client" ? "/clients" : "/servers";
			const canonicalUrl = \`\${$APP.settings.canonicalUrl}\${backUrl}/\${artifact.id.replace("/", "_")}\`;

			return html.staticHTML\`
                <uix-seo
                    pageTitle=\${artifact.name}
                    description=\${artifact.description}
                    canonicalUrl=\${canonicalUrl}
                ></uix-seo>

                <uix-link
                    class="flex items-center gap-2 text-[#bdae93] hover:text-[#ebdbb2] font-semibold self-start -mb-4"
                    label="Back to Discover"
                    icon="arrow-left"
                    href=\${backUrl}
                >
                </uix-link>
                <\${html.unsafeStatic(CardComponent)}
                    .artifact=\${artifact}
                    isDetailView
                ></\${html.unsafeStatic(CardComponent)}>
                <div class="flex flex-col gap-y-10">
                    <view-github-comments
                        owner="mcpiquanthq"
                        repo="githubcomments"
                        title=\${artifact.name}
                    >
                    </view-github-comments>
                </div>
            \`;
		},
	});

	$APP.define("mcp-trending-discussions", {
		class:
			"w-80 bg-[#282828] p-6 flex-col space-y-6 flex-shrink-0 hidden lg:flex border-l border-[#3c3836]",
		properties: {
			discussions: T.object(),
		},
		render() {
			return html\`
                <h2 class="font-semibold text-lg text-[#ebdbb2]">
                    Trending Discussions
                </h2>
                <div class="flex flex-col gap-y-10">
                    \${this.discussions?.map(
											(d) => html\`
                            <div class="flex items-start gap-3 text-[#bdae93]">
                                <div class="w-8 h-8 flex-shrink-0 bg-[#3c3836] rounded-md flex items-center justify-center text-[#928374]">
                                    <uix-icon name=\${d.icon} class="w-5 h-5"></uix-icon>
                                </div>
                                <div>
                                    <p class="font-semibold text-[#ebdbb2] hover:text-[#83a598] cursor-pointer leading">
                                        \${d.title}
                                    </p>
                                    <div class="text-xs text-[#928374] flex items-center gap-4 mt-1.5">
                                        <span>\${d.category}</span>
                                        <div class="flex items-center gap-1.5" title="Upvotes">
                                            <uix-icon name="arrow-up" class="w-3.5 h-3.5"></uix-icon>
                                            <span>\${d.upvotes}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5" title="Comments">
                                            <uix-icon name="message-circle" class="w-3.5 h-3.5"></uix-icon>
                                            <span>\${d.comments}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`,
										)}
                </div>
                <uix-button
                    label="View all discussions"
                    class="w-full mt-auto bg-[#3c3836]"
                    size="small"
                ></uix-button>
            \`;
		},
	});

	return {
		tag: "mcp-main",
		class:
			"w-full h-full bg-[#1d2021] text-[#ebdbb2] flex font-sans text-sm overflow-hidden",
		properties: {
			currentRoute: T.object({
				sync: "ram",
				attribute: false,
				reflect: false,
			}),
		},
		render() {
			return html\`
                <main class="flex-grow p-6 md:p-8 flex flex-col gap-8 overflow-y-auto">
                    \${this.currentRoute?.matched?.component}
                </main>
                <mcp-trending-discussions
                    .data-query=\${{ model: "discussions", limit: 5, key: "discussions" }}
                ></mcp-trending-discussions>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/history.js":{content:`export default ({ html, AI, T }) => {
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/utility/seo.js":{content:`export default ({ T, html, $APP }) => ({
	properties: {
		pageTitle: T.string(),
		description: T.string(),
		imageUrl: T.string("/assets/cover.png"),
		canonicalUrl: T.string(),
		structuredData: T.object(),
	},
	connected() {
		this.updateSeoTags();
	},
	updated() {
		this.updateSeoTags();
	},
	updateSeoTags() {
		const { pageTitle, description, imageUrl, canonicalUrl, structuredData } =
			this;
		const siteName = "MCP Discover";
		const defaultDescription =
			"Browse, experiment, develop, and discuss all things MCP.";

		document.title = pageTitle ? \`\${pageTitle} | \${siteName}\` : siteName;

		this._upsertMetaTag(
			"name",
			"description",
			description || defaultDescription,
		);
		const finalUrl =
			canonicalUrl ||
			$APP.settings.url + window.location.pathname ||
			window.location.href;
		this._upsertLinkTag("rel", "canonical", finalUrl);

		this._upsertMetaTag("property", "og:title", pageTitle || siteName);
		this._upsertMetaTag(
			"property",
			"og:description",
			description || defaultDescription,
		);
		this._upsertMetaTag("property", "og:url", finalUrl);
		this._upsertMetaTag("property", "og:type", "website");
		if (imageUrl) {
			this._upsertMetaTag("property", "og:image", imageUrl);
		}

		// 5. Update Twitter Card tags
		this._upsertMetaTag("name", "twitter:card", "summary_large_image");
		this._upsertMetaTag("name", "twitter:title", pageTitle || siteName);
		this._upsertMetaTag(
			"name",
			"twitter:description",
			description || defaultDescription,
		);
		if (imageUrl) {
			this._upsertMetaTag("name", "twitter:image", imageUrl);
		}

		// 6. NEW: Update JSON-LD Structured Data
		this._upsertStructuredData(structuredData);
	},

	/**
	 * Helper to create or update a <meta> tag in the head.
	 * @param {string} keyName - The attribute to select by (e.g., 'name', 'property').
	 * @param {string} keyValue - The value of the keyName attribute.
	 * @param {string} content - The value for the 'content' attribute.
	 */
	_upsertMetaTag(keyName, keyValue, content) {
		if (!content) return;
		let element = document.head.querySelector(\`meta[\${keyName}="\${keyValue}"]\`);
		if (!element) {
			element = document.createElement("meta");
			element.setAttribute(keyName, keyValue);
			document.head.appendChild(element);
		}
		element.setAttribute("content", content);
	},

	/**
	 * Helper to create or update a <link> tag in the head.
	 * @param {string} keyName - The attribute to select by (e.g., 'rel').
	 * @param {string} keyValue - The value of the keyName attribute.
	 * @param {string} href - The value for the 'href' attribute.
	 */
	_upsertLinkTag(keyName, keyValue, href) {
		if (!href) return;
		let element = document.head.querySelector(\`link[\${keyName}="\${keyValue}"]\`);
		if (!element) {
			element = document.createElement("link");
			element.setAttribute(keyName, keyValue);
			document.head.appendChild(element);
		}
		element.setAttribute("href", href);
	},

	/**
	 * NEW: Helper to create, update, or remove a <script type="application/ld+json"> tag.
	 * @param {object} jsonData - The JSON object for the structured data.
	 */
	_upsertStructuredData(jsonData) {
		const selector = 'script[type="application/ld+json"]';
		let element = document.head.querySelector(selector);

		// If no JSON data is provided, remove the tag if it exists.
		if (!jsonData || Object.keys(jsonData).length === 0) {
			if (element) {
				element.remove();
			}
			return;
		}

		// If the tag doesn't exist, create and append it.
		if (!element) {
			element = document.createElement("script");
			element.setAttribute("type", "application/ld+json");
			document.head.appendChild(element);
		}

		// Set the content of the script tag.
		element.textContent = JSON.stringify(jsonData, null, 2);
	},

	// This component does not render any visible output.
	render() {
		return html\`\`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/lucide/code.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 18l6-6l-6-6M8 6l-6 6l6 6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/telescope.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m10.065 12.493l-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44m-2.875 6.493l4.332-.924M16 21l-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455zM6.158 8.633l1.114 4.456M8 21l3.105-6.21"/><circle cx="12" cy="13" r="2"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/bot.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2m16 0h2m-7-1v2m-6-2v2"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/server.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><path d="M6 6h.01M6 18h.01"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/layout-grid.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/book.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/message-square-heart.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M14.8 7.5a1.84 1.84 0 0 0-2.6 0l-.2.3l-.3-.3a1.84 1.84 0 1 0-2.4 2.8L12 13l2.7-2.7c.9-.9.8-2.1.1-2.8"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/views/github-comments.js":{content:`export default ({ T, html }) => {
	// Helper function to make GraphQL API calls to GitHub
	const callGraphQL = async (token, query, variables) => {
		const headers = {
			"Content-Type": "application/json",
			Accept: "application/json",
		};

		// Only add Authorization header if a token is provided
		if (token) {
			headers.Authorization = \`bearer \${token}\`;
		}

		const response = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers,
			body: JSON.stringify({
				query,
				variables,
			}),
		});

		if (!response.ok) {
			throw new Error(
				\`Network response was not ok, status: \${response.status}\`,
			);
		}

		const result = await response.json();
		if (result.errors) {
			throw new Error(
				\`GraphQL Error: \${result.errors.map((e) => e.message).join(", ")}\`,
			);
		}

		return result.data;
	};

	return {
		properties: {
			title: T.string(""),
			comments: T.array([]),
			user: T.object(null),
			owner: T.string(),
			repo: T.string(),
			categoryId: T.string(""), // Optional: Provide a specific discussion category ID
			newComment: T.string(""),
			isLoading: T.boolean(false),
			discussionId: T.string(null),
			discussionNumber: T.number(null),
		},

		async connected() {
			const token = localStorage.getItem("github_token");
			if (token) {
				await this.fetchUser(token);
			}
			await this.loadComments();
		},

		async loginWithGitHub() {
			// NOTE: Remember to replace this with your actual GitHub OAuth App Client ID
			const clientId = "Iv23li5VLrzD90cqA7AX";
			const redirectUri = encodeURIComponent(
				\`\${window.location.origin}/github\`, // Adjust if your callback URL is different
			);
			const scope = "public_repo read:discussion write:discussion";
			sessionStorage.setItem("github_auth_return", window.location.href);
			window.location.href = \`https://github.com/login/oauth/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&scope=\${scope}\`;
		},

		async fetchUser(token) {
			try {
				const response = await fetch("https://api.github.com/user", {
					headers: {
						Authorization: \`token \${token}\`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				if (response.ok) {
					this.user = await response.json();
				} else {
					// Token is likely invalid or expired
					localStorage.removeItem("github_token");
					this.user = null;
				}
			} catch (error) {
				console.error("Failed to fetch user:", error);
			}
		},

		// Search for a discussion by title using the efficient GraphQL search query
		async findDiscussionByTitle(token = null) {
			const searchQuery = \`
                query FindDiscussion($searchQuery: String!) {
                    search(query: $searchQuery, type: DISCUSSION, first: 1) {
                        nodes {
                            ... on Discussion {
                                id
                                number
                                title
                            }
                        }
                    }
                }
            \`;

			// Construct a precise search query to find an exact title match within the specified repo, sorted by creation date
			const preciseQuery = \`repo:\${this.owner}/\${this.repo} in:title "\${this.title}" sort:created-asc\`;

			try {
				const data = await callGraphQL(token, searchQuery, {
					searchQuery: preciseQuery,
				});

				const discussion = data?.search?.nodes?.[0];

				// Ensure it's an exact match
				if (
					discussion &&
					discussion.title.toLowerCase() === this.title.toLowerCase()
				) {
					this.discussionId = discussion.id;
					this.discussionNumber = discussion.number;
					return discussion;
				}

				return null;
			} catch (error) {
				console.error("Failed to search for discussion:", error);
				return null;
			}
		},

		// Create a new discussion
		async createDiscussion(token) {
			const getRepoQuery = \`
                query GetRepo($owner: String!, $repo: String!) {
                    repository(owner: $owner, name: $repo) {
                        id
                        discussionCategories(first: 10) {
                            nodes {
                                id
                                name
                            }
                        }
                    }
                }
            \`;

			try {
				const repoData = await callGraphQL(token, getRepoQuery, {
					owner: this.owner,
					repo: this.repo,
				});

				const repositoryId = repoData?.repository?.id;
				const categories =
					repoData?.repository?.discussionCategories?.nodes || [];

				// Use the provided categoryId or find a "General" or "Announcements" category
				let categoryId = this.categoryId;
				if (!categoryId && categories.length > 0) {
					const generalCategory = categories.find(
						(c) =>
							c.name.toLowerCase() === "general" ||
							c.name.toLowerCase() === "announcements",
					);
					categoryId = generalCategory ? generalCategory.id : categories[0].id;
				}

				if (!repositoryId || !categoryId) {
					throw new Error(
						"Could not find repository or a suitable category ID",
					);
				}

				const createMutation = \`
                    mutation CreateDiscussion($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
                        createDiscussion(input: {
                            repositoryId: $repositoryId,
                            categoryId: $categoryId,
                            title: $title,
                            body: $body
                        }) {
                            discussion {
                                id
                                number
                                title
                            }
                        }
                    }
                \`;

				const discussionData = await callGraphQL(token, createMutation, {
					repositoryId,
					categoryId,
					title: this.title,
					body: "Discussion created automatically to host comments.",
				});

				const discussion = discussionData?.createDiscussion?.discussion;
				if (discussion) {
					this.discussionId = discussion.id;
					this.discussionNumber = discussion.number;
					return discussion;
				}
				return null;
			} catch (error) {
				console.error("Failed to create discussion:", error);
				throw error;
			}
		},

		async loadComments() {
			this.isLoading = true;
			try {
				const token = localStorage.getItem("github_token");
				const discussion = await this.findDiscussionByTitle(token);

				if (!discussion) {
					this.comments = [];
					this.isLoading = false;
					return;
				}

				const getCommentsQuery = \`
                    query GetDiscussionComments($owner: String!, $repo: String!, $number: Int!) {
                        repository(owner: $owner, name: $repo) {
                            discussion(number: $number) {
                                comments(first: 100) {
                                    nodes {
                                        id
                                        body
                                        createdAt
                                        url
                                        author {
                                            login
                                            avatarUrl
                                            url
                                        }
                                    }
                                }
                            }
                        }
                    }
                \`;

				const data = await callGraphQL(token, getCommentsQuery, {
					owner: this.owner,
					repo: this.repo,
					number: discussion.number,
				});

				const comments = data?.repository?.discussion?.comments?.nodes || [];
				this.comments = comments.map((comment) => ({
					id: comment.id,
					content: comment.body,
					authorName: comment.author.login,
					authorAvatar: comment.author.avatarUrl,
					githubUrl: comment.author.url,
					createdAt: comment.createdAt,
					htmlUrl: comment.url,
				}));
			} catch (error) {
				console.error("Failed to load comments:", error);
				this.comments = [];
			} finally {
				this.isLoading = false;
			}
		},

		async postComment(e) {
			e.preventDefault();

			if (!this.user) {
				this.loginWithGitHub();
				return;
			}

			if (!this.newComment.trim()) return;

			const token = localStorage.getItem("github_token");
			if (!token) {
				this.loginWithGitHub();
				return;
			}

			try {
				// If we don't have a discussion ID yet, find or create the discussion
				if (!this.discussionId) {
					let discussion = await this.findDiscussionByTitle(token);
					if (!discussion) {
						discussion = await this.createDiscussion(token);
					}
					if (!discussion) {
						throw new Error(
							"Failed to find or create a discussion for this topic.",
						);
					}
				}

				const addCommentMutation = \`
                    mutation AddComment($discussionId: ID!, $body: String!) {
                        addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
                            comment {
                                id
                                body
                                createdAt
                                url
                                author {
                                    login
                                    avatarUrl
                                    url
                                }
                            }
                        }
                    }
                \`;

				const newCommentData = await callGraphQL(token, addCommentMutation, {
					discussionId: this.discussionId,
					body: this.newComment,
				});

				// Optimistically add the new comment to the local state for a smooth UI update
				const comment = newCommentData.addDiscussionComment.comment;
				this.comments.push({
					id: comment.id,
					content: comment.body,
					authorName: comment.author.login,
					authorAvatar: comment.author.avatarUrl,
					githubUrl: comment.author.url,
					createdAt: comment.createdAt,
					htmlUrl: comment.url,
				});
				this.newComment = "";
				this.update();
			} catch (error) {
				console.error("Failed to post comment:", error);
				if (error.message.includes("status: 401")) {
					localStorage.removeItem("github_token");
					this.user = null;
					this.loginWithGitHub();
				}
			}
		},

		logout() {
			localStorage.removeItem("github_token");
			this.user = null;
			this.update();
		},

		formatDate(dateString) {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		},

		render() {
			return html\`
              <div class="flex flex-col gap-6 bg-[#282828] border-2 border-[#3c3836] rounded-lg p-6 font-sans">
                  <div class="flex items-center justify-between">
                      <h2 class="font-semibold text-2xl text-[#ebdbb2]">
                          Comments (\${this.comments.length})
                      </h2>
                      \${
												this.user
													? html\`
                                    <div class="flex items-center gap-3">
                                        <img
                                            src=\${this.user.avatar_url}
                                            alt=\${this.user.login}
                                            class="w-8 h-8 rounded-full"
                                        />
                                        <span class="text-sm text-[#bdae93]">\${this.user.login}</span>
                                        <button
                                            @click=\${() => this.logout()}
                                            class="text-xs text-[#928374] hover:text-[#ebdbb2] font-semibold"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                \`
													: ""
											}
                  </div>
      
                  <!-- Comment Form -->
                  <form @submit=\${(e) => this.postComment(e)} class="flex flex-col gap-3">
                      <textarea
                          .value=\${this.newComment}
                          @input=\${(e) => {
														this.newComment = e.target.value;
														this.update();
													}}
                          rows="3"
                          placeholder=\${this.user ? "Share your thoughts..." : "Sign in with GitHub to comment..."}
                          ?disabled=\${!this.user}
                          class="w-full bg-[#1d2021] border-2 border-[#3c3836] font-semibold text-[#ebdbb2] rounded-lg py-2 px-4 focus:outline-none focus:shadow-[2px_2px_0px_#1d2021] focus:border-[#83a598] transition disabled:opacity-50"
                      ></textarea>
                      
                      \${
												this.user
													? html\`
                                    <button
                                        type="submit"
                                        ?disabled=\${!this.newComment.trim()}
                                        class="bg-[#458588] text-[#ebdbb2] font-bold px-4 py-2 rounded-lg self-end hover:bg-[#83a598] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Post Comment
                                    </button>
                                \`
													: html\`
                                    <button
                                        type="button"
                                        @click=\${() => this.loginWithGitHub()}
                                        class="bg-[#458588] text-[#ebdbb2] font-bold px-4 py-2 rounded-lg self-end hover:bg-[#83a598] transition flex items-center gap-2"
                                    >
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        Sign in with GitHub
                                    </button>
                                \`
											}
                  </form>
      
                  <!-- Comments List -->
                  <div class="flex flex-col gap-6">
                      \${
												this.isLoading
													? html\`
                                    <div class="text-center text-[#928374] py-8">
                                        Loading comments...
                                    </div>
                                \`
													: this.comments.length > 0
														? this.comments.map(
																(comment) => html\`
                                        <div class="flex items-start gap-4">
                                            <a href=\${comment.githubUrl} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src=\${comment.authorAvatar}
                                                    alt=\${comment.authorName}
                                                    class="w-10 h-10 rounded-full flex-shrink-0 hover:opacity-80 transition"
                                                />
                                            </a>
                                            <div class="flex-grow">
                                                <div class="flex items-baseline gap-3">
                                                    <a
                                                        href=\${comment.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="font-bold text-md text-[#ebdbb2] hover:text-[#83a598]"
                                                    >
                                                        \${comment.authorName}
                                                    </a>
                                                    <span class="text-xs text-[#928374]">
                                                        \${this.formatDate(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <div class="mt-2 bg-[#1d2021] border-2 border-[#3c3836] rounded-lg p-3 text-[#d5c4a1]">
                                                    \${comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    \`,
															)
														: html\`
                                    <div class="text-center text-[#928374] p-8 bg-[#1d2021] border-2 border-dashed border-[#3c3836] rounded-lg">
                                        <h3 class="font-bold text-lg text-[#ebdbb2]">No Comments Yet</h3>
                                        <p>Be the first one to share your thoughts!</p>
                                    </div>
                                \`
											}
                  </div>
              </div>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/lucide/copy.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/arrow-left.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 19l-7-7l7-7m7 7H5"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/zap.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/link.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/wrench.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/message-square.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/folder-tree.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Zm0 11a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1ZM3 5a2 2 0 0 0 2 2h3"/><path d="M3 3v13a2 2 0 0 0 2 2h3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/activity.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/info.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/apps/mcp/views/servers.js":{content:`export default ({ html, AI, T }) => {
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
														? html\`<uix-button label="Disconnect" @click=\${() => this.disconnectFromServer()} class="bg-[#cc241d] text-[#ebdbb2] font-bold" size="small"></uix-button>\`
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
`,mimeType:"application/javascript",skipSW:!1},"/templates/servers/react-agent.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/cot-reasoner.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/eval.js":{content:`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

const server = new McpServer(
	{
		name: "javascript-executor",
		version: "0.1.0",
	},
	{
		capabilities: {
			tools: {},
			resources: {},
			logging: {},
		},
	},
);

// In-memory storage for execution history
const executionHistory = [];

// Execute JavaScript code
server.registerTool(
	"execute_js",
	{
		title: "Execute JavaScript",
		description:
			"Execute JavaScript code in a sandboxed iframe and return the result",
		inputSchema: {
			code: z.string().describe("JavaScript code to execute"),
		},
	},
	async ({ code }) => {
		const startTime = Date.now();

		try {
			await server.sendLoggingMessage({
				level: "info",
				data: "Executing JavaScript code",
			});

			// Create sandboxed iframe execution
			const iframe = \`
					<iframe 
						sandbox="allow-scripts" 
						style="display: none;"
						srcdoc="
							<script>
								try {
									const result = eval(\\\`\${code.replace(/\`/g, "\\\\\`")}\\\`);
									window.parent.postMessage({ success: true, result: String(result) }, '*');
								} catch (error) {
									window.parent.postMessage({ success: false, error: error.message }, '*');
								}
							<\/script>
						">
					</iframe>
				\`;

			const executionTime = Date.now() - startTime;

			// Add to history
			executionHistory.push({
				timestamp: new Date().toISOString(),
				code,
				executionTime,
			});

			// Keep only last 100 executions
			if (executionHistory.length > 100) {
				executionHistory.shift();
			}

			return {
				content: [
					{
						type: "text",
						text: \`Code will be executed in sandboxed iframe:\\n\\n\\\`\\\`\\\`javascript\\n\${code}\\n\\\`\\\`\\\`\\n\\nExecution queued (\${executionTime}ms)\`,
					},
				],
			};
		} catch (error) {
			await server.sendLoggingMessage({
				level: "error",
				data: \`Execution failed: \${error.message}\`,
			});

			return {
				content: [
					{
						type: "text",
						text: \`Error: \${error.message}\`,
					},
				],
				isError: true,
			};
		}
	},
);

server.registerResource(
	"exec_history",
	"exec://history",
	{
		title: "Execution History",
		description: "History of JavaScript executions",
		mimeType: "application/json",
	},
	async (uri) => ({
		contents: [
			{
				uri: uri.href,
				mimeType: "application/json",
				text: JSON.stringify(executionHistory, null, 2),
			},
		],
	}),
);

export default server;
`,mimeType:"application/javascript",skipSW:!0},"/templates/servers/tot-explorer.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/reflexion-agent.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/plan-solve-agent.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/self-consistency.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/metacognitive-controller.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/frontend-agent.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/viz-generator.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/ui-generator.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/game-generator.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/landing-generator.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/code-transformer.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/data-processor.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/virtual-fs.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/http-client.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/github-api.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/games.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/templates/servers/canvas-studio.js":{content:"404 Not Found",mimeType:"application/javascript",skipSW:!0},"/modules/apps/mcp/views/inspector.js":{content:`export default ({ $APP, html, AI, T }) => {
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
                                    <uix-button @click=\${() => this.onDisconnect(server.alias)} label="Disconnect" class="bg-[#cc241d] text-[#ebdbb2] w-full h-8 text-xs"></uix-button>
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/chat.js":{content:`export default ({ $APP, html, AI, T, Model }) => {
	let currentConversationId = null;

	// *****************************************************************
	// UPDATED: Context Bar Component
	// This component displays information about the current context.
	// *****************************************************************
	$APP.define("mcp-context-bar", {
		properties: {
			tokenCount: T.number(0),
			selectedTools: T.array([]),
			messageCount: T.number(0),
			totalMessages: T.number(0),
			onSelectAll: T.function(),
			onDeselectAll: T.function(),
		},
		render() {
			return html\`
                <div class="px-6 py-2 border-b border-[#504945] bg-[#282828] flex items-center justify-between text-sm text-[#bdae93] shadow-md">
                    <div class="flex items-center gap-x-6">
                        <div class="flex items-center gap-2" title="Messages in context / Total messages">
                            <uix-icon name="list-checks" class="w-4 h-4 text-[#928374]"></uix-icon>
                            <span>\${this.messageCount} / \${this.totalMessages} Messages</span>
                        </div>
                        <div class="flex items-center gap-2" title="Estimated token count for the context">
                            <uix-icon name="database" class="w-4 h-4 text-[#928374]"></uix-icon>
                            <span>~\${this.tokenCount.toLocaleString()} Tokens</span>
                        </div>
                        <div class="flex items-center gap-2" title="Enabled tools for the next message">
                            <uix-icon name="pickaxe" class="w-4 h-4 text-[#928374]"></uix-icon>
                            <span>\${this.selectedTools.length} Tools Enabled</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click=\${this.onSelectAll} class="px-2 py-1 rounded-md hover:bg-[#504945] transition-colors flex items-center gap-1.5 text-sm font-medium">
                            <uix-icon name="square-check" class="w-3.5 h-3.5"></uix-icon> Select All
                        </button>
                        <button @click=\${this.onDeselectAll} class="px-2 py-1 rounded-md hover:bg-[#504945] transition-colors flex items-center gap-1.5 text-sm font-medium">
                           <uix-icon name="square" class="w-3.5 h-3.5"></uix-icon> Deselect All
                        </button>
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-chat-message", {
		properties: {
			message: T.object({}),
			isUser: T.boolean(false),
			isStreaming: T.boolean(false),
			inContext: T.boolean(false),
			onContextToggle: T.function(),
		},
		_formatTimestamp(timestamp) {
			if (!timestamp) return "";
			return new Date(timestamp).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		},
		_renderToolCall(toolCall) {
			return html\`
                <div class="bg-[#1d2021] border-l-4 border-[#504945] p-3 mt-2 rounded-md">
                    <div class="font-mono text-[#83a598] font-semibold flex items-center gap-2">
                        <uix-icon name="pickaxe" class="w-3.5 h-3.5"></uix-icon>
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
                                </div>
                              \`
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
                            <uix-icon name="bot" class="w-5 h-5"></uix-icon>
                        </div>\`;

			return html\`<div class="flex w-full items-start gap-3 my-4 group \${isUser ? "flex-row-reverse" : ""}">
                     <div class="flex-shrink-0 pt-1.5">
                         <button 
                            @click=\${() => this.onContextToggle(this.message.id)}
                            class="transition-all \${this.inContext ? "text-[#83a598]" : "text-[#665c54]"} hover:text-[#ebdbb2]"
                            title="Include this message in the next turn's context"
                         >
                            <uix-icon name=\${this.inContext ? "circle-check" : "circle"} class="w-4 h-4"></uix-icon>
                         </button>
                    </div>

                    \${senderIcon}
                    
                    <div class="max-w-[75%]">
                        <div class="flex items-baseline gap-2 mb-1 \${isUser ? "justify-end" : ""}">
                            <span class="font-bold \${isUser ? "text-[#d5c4a1]" : "text-[#bdae93]"}">\${isUser ? "You" : "Assistant"}</span>
                            \${message.timestamp ? html\`<span class="text-sm text-[#928374]">\${this._formatTimestamp(message.timestamp)}</span>\` : ""}
                        </div>
                        <div class="bg-[#3c3836] border border-[#504945] rounded-lg p-3 shadow-sm ">
                            \${message.content ? html\`<uix-markdown style="--border-color: #ebdbb2" class="prose prose-sm p-2 max-w-none whitespace-pre-wrap" content=\${message.content}></uix-markdown>\` : ""}
                            \${message.toolCalls?.length > 0 ? message.toolCalls.map((toolCall) => this._renderToolCall(toolCall)) : ""}
                            \${this.isStreaming ? html\`<div class="inline-block w-2 h-4 bg-[#ebdbb2] animate-pulse ml-1"></div>\` : ""}
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-chat-input", {
		properties: {
			value: T.string(""),
			isLoading: T.boolean(false),
			onSend: T.function(),
			groupedTools: T.object({}),
			expandedServers: T.array([]),
			selectedTools: T.array([]),
			onToolToggle: T.function(),
			onServerToggle: T.function(),
			onServerExpandToggle: T.function(),
			selectedModel: T.string(),
			onModelChange: T.function(),
			availableProviders: T.array([]),
			selectedProvider: T.object(),
			onProviderChange: T.function(),
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
                                \${Object.keys(this.groupedTools || {}).map(
																	(serverName) => {
																		const toolsOnServer =
																			this.groupedTools[serverName];
																		const allSelected = toolsOnServer.every(
																			(t) =>
																				this.selectedTools.includes(t.name),
																		);
																		const someSelected =
																			!allSelected &&
																			toolsOnServer.some((t) =>
																				this.selectedTools.includes(t.name),
																			);
																		const isExpanded =
																			this.expandedServers.includes(serverName);

																		let serverButtonClass = "bg-[#504945]";
																		let serverTextColor = "text-[#ebdbb2]";
																		if (allSelected) {
																			serverButtonClass = "bg-[#83a598]";
																			serverTextColor = "text-[#1d2021]";
																		} else if (someSelected) {
																			serverButtonClass = "bg-[#d65d0e]";
																			serverTextColor = "text-[#1d2021]";
																		}

																		return html\`
                                            <div class="relative inline-block text-left">
                                                <div class="flex items-center rounded-md \${serverButtonClass} \${serverTextColor} text-sm font-medium transition-colors">
                                                    <button
                                                        @click=\${() => this.onServerToggle(serverName)}
                                                        class="px-2 py-1 hover:bg-black/10 transition-all flex items-center gap-1.5 rounded-l-md"
                                                        title=\${\`Toggle all tools for \${serverName}\`}
                                                    >
                                                        <span class="capitalize">\${serverName}</span>
                                                    </button>
                                                    <button @click=\${() => this.onServerExpandToggle(serverName)} class="px-1.5 py-1 hover:bg-black/10 rounded-r-md border-l border-black/20">
                                                        <span class="\${isExpanded ? "rotate-180" : ""} inline-block transition-transform">
                                                            <uix-icon name="chevron-down"></uix-icon>
                                                        </span>
                                                    </button>
                                                </div>
                                                \${
																									isExpanded
																										? html\`
                                                            <div class="absolute bottom-full mb-2 z-10 w-64 bg-[#3c3836] border border-[#504945] rounded-md shadow-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                                                                \${toolsOnServer.map(
																																	(
																																		tool,
																																	) => html\`
                                                                        <button
                                                                            @click=\${() => this.onToolToggle(tool.name)}
                                                                            class="w-full text-left p-1.5 rounded text-sm truncate transition-colors \${this.selectedTools.includes(tool.name) ? "bg-[#83a598] text-[#1d2021]" : "text-[#ebdbb2] hover:bg-[#504945]"}"
                                                                            title=\${tool.description}
                                                                        >
                                                                            \${tool.name}
                                                                        </button>
                                                                    \`,
																																)}
                                                            </div>
                                                          \`
																										: ""
																								}
                                            </div>
                                        \`;
																	},
																)}
                            </div>
                            <div class="flex items-center gap-2">
                                <select @change=\${(e) => this.onProviderChange(e.target.value)} .value=\${this.selectedProvider?.type} class="bg-[#504945] border border-[#665c54] rounded-md px-2 text-sm focus:ring-[#83a598] focus:outline-none h-7 capitalize">
                                    \${this.availableProviders.map((provider) => html\`<option value=\${provider.type}>\${provider.type}</option>\`)}
                                </select>
                                \${
																	!this.selectedProvider
																		? null
																		: html\`<select @change=\${(e) => this.onModelChange(e.target.value)} value=\${this.selectedModel} class="bg-[#504945] border border-[#665c54] rounded-md px-2 text-sm focus:ring-[#83a598] focus:outline-none h-7">
                                                    \${this.selectedProvider.models.map((model) => html\`<option value=\${model.id} ?selected=\${model.id === this.selectedModel}>\${model.name}</option>\`)}
                                                </select>
                                              \`
																}
                                <button @click=\${this.onSettingsClick} class="p-1.5 text-[#bdae93] hover:text-[#ebdbb2] hover:bg-[#504945] rounded-md">
                                    <uix-icon name="settings" class="w-5 h-5"></uix-icon>
                                </button>
                            </div>
                        </div>
                        <div class="relative">
                            <textarea
                                .value=\${this.value}
                                @input=\${this.handleInput.bind(this)}
                                @keydown=\${this.handleKeyPress.bind(this)}
                                ?disabled=\${this.isLoading || this.availableProviders.length === 0}
                                placeholder=\${this.availableProviders.length === 0 ? "Please add a provider in settings first." : "Type your message..."}
                                rows="1"
                                class="w-full bg-[#282828] p-4 pr-16 text-[#ebdbb2] placeholder-[#928374] resize-none focus:outline-none focus:ring-2 focus:ring-[#83a598] rounded-lg transition-all"
                                style="max-height: 200px; overflow-y: auto;"
                            ></textarea>
                            <button
                                @click=\${this.sendMessage.bind(this)}
                                ?disabled=\${!this.value.trim() || this.isLoading || this.availableProviders.length === 0}
                                class="absolute right-3 bottom-2.5 p-2 rounded-full text-[#ebdbb2] transition-colors
                                \${
																	!this.value.trim() ||
																	this.isLoading ||
																	this.availableProviders.length === 0
																		? "bg-[#504945] cursor-not-allowed"
																		: "bg-[#458588] hover:bg-[#83a598]"
																}"
                            >
                                \${this.isLoading ? html\`<div class="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>\` : html\`<uix-icon name="send" class="w-5 h-5"></uix-icon>\`}
                            </button>
                        </div>
                    </div>
                </div>
            \`;
		},
	});

	$APP.define("mcp-conversation-list", {
		properties: {
			conversations: T.array([]),
			currentId: T.any(null),
			onSelect: T.function(),
			onNew: T.function(),
			onDelete: T.function(),
		},
		_getPreview(conversation) {
			if (!conversation.messages || conversation.messages.length === 0)
				return "New conversation";
			const lastMessage =
				conversation.messages[conversation.messages.length - 1];
			if (!lastMessage) return "New conversation";
			const content = lastMessage.content || "Tool Call";
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
			const sortedConversations = [...this.conversations].sort(
				(a, b) =>
					new Date(b.updatedAt || b.createdAt) -
					new Date(a.updatedAt || a.createdAt),
			);

			return html\`
                <div class="h-full flex flex-col bg-[#3c3836]">
                    <div class="p-3 border-b border-[#504945]">
                        <button @click=\${this.onNew} class="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[#458588] text-[#ebdbb2] hover:bg-[#83a598] transition-colors font-semibold">
                            <uix-icon name="plus" class="w-4 h-4"></uix-icon> New Chat
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2">
                        \${
													!sortedConversations ||
													sortedConversations.length === 0
														? html\`<div class="p-4 text-center text-[#928374]">No conversations yet</div>\`
														: sortedConversations.map(
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
                                                class="absolute top-2 right-2 p-1 text-[#928374] hover:text-[#cc241d] rounded-full hover:bg-[#1d2021] opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete conversation"
                                            >
                                                <uix-icon name="trash-2" class="w-4 h-4"></uix-icon>
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

	return {
		class: "w-full h-full bg-[#282828] text-[#ebdbb2] flex font-sans",
		"data-query": {
			model: "conversations",
			includes: "messages",
			orderBy: "-updatedAt",
			key: "rows",
		},
		properties: {
			rows: T.array(),
			currentConversation: T.object(null),
			providers: T.array([]),
			isLoading: T.boolean(false),
			error: T.string(""),
			availableTools: T.array([]),
			groupedTools: T.object({}),
			expandedServers: T.array([]),
			selectedTools: T.array([]),
			availableModels: T.array([]),
			selectedModel: T.string({ sync: "local" }),
			selectedProvider: T.object({ sync: "local" }),
			showSettings: T.boolean(false),
			contextMessageIds: T.array([]),
			contextTokenCount: T.number(0),
		},

		async initializeAI() {
			try {
				await AI.init({ providers: this.providers });
			} catch (error) {
				console.error("Error initializing AI service:", error);
				this.error = "Failed to initialize AI Service.";
			}
		},

		async connected() {
			await this.loadState();
			const activeProviders = this.providers.filter((p) => p.active);
			if (activeProviders.length > 0) {
				await this.initializeAI();
				this.loadTools();
				if (
					!this.selectedProvider ||
					!activeProviders.some((p) => p.id === this.selectedProvider.id)
				) {
					this.selectedProvider = activeProviders[0];
					this.selectedModel = this.selectedProvider.models[0].id;
				}
			}
			if (!currentConversationId && this.rows && this.rows.length > 0)
				this.selectConversation(this.rows[0].id);
			else if (this.rows && this.rows.length === 0)
				await this.createNewConversation();
		},
		async loadState() {
			this.providers = await Model.providers.getAll({ includes: ["models"] });
		},

		async addProvider(providerData) {
			if (
				this.providers.some((p) => p.active && p.type === providerData.type)
			) {
				this.error = \`A provider of type "\${providerData.type}" already exists. Please delete it first.\`;
				return;
			}

			const newRecord = await Model.providers.edit({
				id: providerData.id,
				apiKey: providerData.apiKey,
				endpoint: providerData.endpoint,
				active: true,
			});
			await this.loadState();
			await this.initializeAI();
			const newProvider = this.providers.find((p) => p.id === newRecord.id);
			if (newProvider) {
				this.selectedProvider = newProvider;
				this.selectedModel = this.selectedProvider.models[0].id;
			}

			this.error = "";
		},

		async deleteProvider(providerType) {
			const providerToDelete = this.providers.find(
				(p) => p.type === providerType,
			);
			if (providerToDelete) await Model.providers.remove(providerToDelete.id);

			await this.loadState();
			await this.initializeAI();

			if (this.selectedProvider?.type === providerType) {
				const activeProviders = this.providers.filter((p) => p.active);
				this.selectedProvider =
					activeProviders.length > 0 ? activeProviders[0] : null;
			}
		},
		toggleSettings() {
			this.showSettings = !this.showSettings;
		},
		async loadTools() {
			try {
				const { tools } = await AI.listTools();
				this.availableTools = tools || [];
				const groups = {};
				for (const tool of this.availableTools) {
					const serverName = tool.server || "local";
					if (!groups[serverName]) groups[serverName] = [];
					groups[serverName].push(tool);
				}
				this.groupedTools = groups;
			} catch (e) {
				console.error("Couldn't load tools", e);
				this.availableTools = [];
				this.groupedTools = {};
			}
		},
		toggleTool(toolName) {
			if (this.selectedTools.includes(toolName))
				this.selectedTools = this.selectedTools.filter((t) => t !== toolName);
			else this.selectedTools = [...this.selectedTools, toolName];
			this.updateTokenCount();
		},
		toggleServerTools(serverName) {
			const toolsOnServer = this.groupedTools[serverName].map((t) => t.name);
			const allSelected = toolsOnServer.every((t) =>
				this.selectedTools.includes(t),
			);
			if (allSelected)
				this.selectedTools = this.selectedTools.filter(
					(t) => !toolsOnServer.includes(t),
				);
			else {
				const currentSelectedSet = new Set(this.selectedTools);
				toolsOnServer.forEach((t) => currentSelectedSet.add(t));
				this.selectedTools = Array.from(currentSelectedSet);
			}
			this.updateTokenCount();
		},
		toggleServerExpansion(serverName) {
			if (this.expandedServers.includes(serverName))
				this.expandedServers = this.expandedServers.filter(
					(s) => s !== serverName,
				);
			else this.expandedServers = [...this.expandedServers, serverName];
		},
		handleModelChange(modelId) {
			this.selectedModel = modelId;
		},
		handleProviderChange(providerType) {
			const provider = this.providers.find((p) => p.type === providerType);
			if (provider) this.selectedProvider = provider;
			if (provider.models.length > 0)
				this.selectedModel = provider.models[0].id;
		},
		async createNewConversation() {
			const conversation = {
				title: "New Chat",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			const newConversation = await Model.conversations.add(conversation);
			currentConversationId = newConversation.id;
			this.currentConversation = newConversation;
			newConversation.messages = [];
			this.showSettings = false;
			this.contextMessageIds = [];
			this.updateTokenCount();
		},
		selectConversation(id) {
			const conversation = this.rows.find((conv) => conv.id === id);
			if (conversation) {
				currentConversationId = id;
				this.currentConversation = conversation;
				this.contextMessageIds = conversation.messages.map((m) => m.id);
				this.updateTokenCount();
			}
			this.showSettings = false;
		},
		async deleteConversation(id) {
			await Model.conversations.remove(id);
			if (currentConversationId === id) {
				currentConversationId = null;
				this.currentConversation = null;
				if (this.rows.length > 0) {
					this.selectConversation(this.rows[0].id);
				} else {
					await this.createNewConversation();
				}
			}
		},

		toggleMessageInContext(messageId) {
			const idSet = new Set(this.contextMessageIds);
			if (idSet.has(messageId)) {
				idSet.delete(messageId);
			} else {
				idSet.add(messageId);
			}
			this.contextMessageIds = Array.from(idSet);
			this.updateTokenCount();
		},

		selectAllMessages() {
			if (this.currentConversation?.messages) {
				this.contextMessageIds = this.currentConversation.messages.map(
					(m) => m.id,
				);
				this.updateTokenCount();
			}
		},

		deselectAllMessages() {
			this.contextMessageIds = [];
			this.updateTokenCount();
		},

		updateTokenCount() {
			if (!this.currentConversation && this.selectedTools.length === 0) {
				this.contextTokenCount = 0;
				return;
			}

			let totalChars = 0;

			if (this.currentConversation) {
				const contextMessages = this.currentConversation.messages.filter((m) =>
					this.contextMessageIds.includes(m.id),
				);
				totalChars += contextMessages.reduce((sum, msg) => {
					let messageChars = msg.content?.length || 0;
					if (msg.toolCalls) {
						messageChars += JSON.stringify(msg.toolCalls).length;
					}
					return sum + messageChars;
				}, 0);
			}

			const selectedToolObjects = this.availableTools.filter((t) =>
				this.selectedTools.includes(t.name),
			);
			const toolChars = selectedToolObjects.reduce((sum, tool) => {
				const argumentString = tool.arguments
					? JSON.stringify(tool.arguments)
					: "";
				return (
					sum +
					(tool.name?.length || 0) +
					(tool.description?.length || 0) +
					argumentString.length +
					100
				);
			}, 0);

			totalChars += toolChars;

			this.contextTokenCount = Math.ceil(totalChars / 4);
		},

		updateConversationTitle(conversation) {
			if (
				(!conversation.title || conversation.title === "New Chat") &&
				conversation.messages.length > 0
			) {
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
			if (this.providers.filter((p) => p.active).length === 0) {
				this.error =
					"Cannot send message. Please add a provider in the settings.";
				return;
			}
			if (!this.selectedModel) {
				this.error = "Cannot send message. No model selected.";
				return;
			}
			if (!this.currentConversation) {
				await this.createNewConversation();
			}
			const userMessage = {
				role: "user",
				content,
				timestamp: new Date().toISOString(),
			};

			const savedUserMessage = await Model.messages.add({
				...userMessage,
				chat: this.currentConversation.id,
			});

			this.currentConversation.messages.push(savedUserMessage);
			this.contextMessageIds = [...this.contextMessageIds, savedUserMessage.id];

			this.updateConversationTitle(this.currentConversation);
			this.updateTokenCount();

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
					.filter((m) => !m.id || this.contextMessageIds.includes(m.id))
					.map((m) => ({
						role: m.role,
						content: m.content,
						toolCalls: m.toolCalls,
					}));
				const stream = AI.chat(history, {
					stream: true,
					enabledTools: this.selectedTools,
					model: this.selectedModel,
					provider: this.selectedProvider,
				});
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
							(tc) => tc.id === chunk.id,
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

				const savedAssistantMessage = await Model.messages.add({
					...assistantMessage,
					chat: this.currentConversation.id,
				});

				const lastMsgIndex = this.currentConversation.messages.length - 1;
				this.currentConversation.messages[lastMsgIndex] = savedAssistantMessage;

				this.contextMessageIds = [
					...this.contextMessageIds,
					savedAssistantMessage.id,
				];
				this.updateTokenCount();
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
			const activeProviders = this.providers.filter((p) => p.active);
			return html\`
                <div class="w-80 border-r border-[#504945] flex-shrink-0">
                    <mcp-conversation-list
                        .conversations=\${this.rows}
                        .currentId=\${this.currentConversation?.id}
                        .onSelect=\${this.selectConversation.bind(this)}
                        .onNew=\${this.createNewConversation.bind(this)}
                        .onDelete=\${this.deleteConversation.bind(this)}
                    ></mcp-conversation-list>
                </div>
                <div class="flex-1 flex flex-col bg-[#282828] h-full relative">
                    \${
											activeProviders.length === 0
												? html\`
                                <div class="flex-1 overflow-y-auto">
                                    <mcp-provider-settings
                                        .providers=\${this.providers}
                                        .onAddProvider=\${this.addProvider.bind(this)}
                                        .onDeleteProvider=\${this.deleteProvider.bind(this)}
                                    ></mcp-provider-settings>
                                </div>
                              \`
												: html\`
                                <mcp-context-bar
                                    .tokenCount=\${this.contextTokenCount}
                                    .selectedTools=\${this.selectedTools}
                                    .messageCount=\${this.contextMessageIds.length}
                                    .totalMessages=\${this.currentConversation?.messages.length || 0}
                                    .onSelectAll=\${this.selectAllMessages.bind(this)}
                                    .onDeselectAll=\${this.deselectAllMessages.bind(this)}
                                ></mcp-context-bar>

                                <div class="flex-1 overflow-y-auto chat-messages px-6">
                                    \${this.error ? html\`<div class="bg-red-900/50 border border-[#cc241d] rounded-lg p-3 my-4 text-[#fabd2f]">\${this.error}</div>\` : ""}
                                    \${this.currentConversation?.messages.map(
																			(message, index) => html\`
                                            <mcp-chat-message
                                                .message=\${{ ...message }}
                                                .isUser=\${message.role === "user"}
                                                .isStreaming=\${this.isLoading && this.currentConversation && index === this.currentConversation.messages.length - 1}
                                                .inContext=\${this.contextMessageIds.includes(message.id)}
                                                .onContextToggle=\${this.toggleMessageInContext.bind(this)}
                                            ></mcp-chat-message>
                                        \`,
																		)}
                                </div>
                              \`
										}
                    \${
											this.showSettings && activeProviders.length > 0
												? html\`
                                <div class="absolute inset-0 bg-black/60 z-10 flex items-center justify-center p-4">
                                    <div class="w-full max-w-2xl h-[80vh] max-h-[700px] bg-[#282828] rounded-lg shadow-2xl border border-[#504945] overflow-hidden">
                                        <mcp-provider-settings
                                            .providers=\${this.providers}
                                            .onAddProvider=\${this.addProvider.bind(this)}
                                            .onDeleteProvider=\${this.deleteProvider.bind(this)}
                                            .isModal=\${true}
                                            .onClose=\${this.toggleSettings.bind(this)}
                                        ></mcp-provider-settings>
                                    </div>
                                </div>
                              \`
												: ""
										}
                    <mcp-chat-input
                        .isLoading=\${this.isLoading}
                        .onSend=\${this.sendMessage.bind(this)}
                        .groupedTools=\${this.groupedTools}
                        .expandedServers=\${this.expandedServers}
                        .selectedTools=\${this.selectedTools}
                        .onToolToggle=\${this.toggleTool.bind(this)}
                        .onServerToggle=\${this.toggleServerTools.bind(this)}
                        .onServerExpandToggle=\${this.toggleServerExpansion.bind(this)}
                        selectedModel=\${this.selectedModel}
                        .onModelChange=\${this.handleModelChange.bind(this)}
                        .availableProviders=\${activeProviders}
                        .selectedProvider=\${this.selectedProvider}
                        .onProviderChange=\${this.handleProviderChange.bind(this)}
                        .onSettingsClick=\${this.toggleSettings.bind(this)}
                    ></mcp-chat-input>
                </div>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/provider-settings.js":{content:`export default ({ html, T }) => {
	return {
		properties: {
			providers: T.array([]),
			onAddProvider: T.function(),
			onDeleteProvider: T.function(),
			isModal: T.boolean(false),
			onClose: T.function(),
			newProviderType: T.string("local"),
		},

		async addProvider(providerData) {
			if (providerConfigs.has(providerData.type)) {
				this.error = \`A provider of type "\${providerData.type}" already exists. Please delete it first.\`;
				return;
			}
			providerConfigs.set(providerData.type, providerData);
			this.providers = Array.from(providerConfigs.values());
			this.saveState();
			await this.initializeAI();
			await this.loadModels();
			this.error = "";
		},

		async deleteProvider(providerType) {
			providerConfigs.delete(providerType);
			this.providers = Array.from(providerConfigs.values());
			this.saveState();
			await this.initializeAI();
			await this.loadModels();
		},
		render() {
			const activeProviders = this.providers.filter((p) => p.active);
			return html\`
            <div class="h-full flex flex-col p-6 bg-[#282828] text-[#ebdbb2]">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold">AI Providers</h1>
                    \${this.isModal ? html\`<button @click=\${this.onClose} class="p-2 rounded-full hover:bg-[#504945] text-[#bdae93] hover:text-[#ebdbb2] text-2xl leading-none">&times;</button>\` : ""}
                </div>

                \${
									!this.isModal && this.providers.length === 0
										? html\`
                <div class="bg-[#3c3836] border border-[#504945] rounded-lg p-4 mb-6 text-center">
                    <p class="font-semibold text-lg">Welcome!</p>
                    <p class="text-[#bdae93]">To start chatting, please add at least one AI provider below.</p>
                </div>
                \`
										: ""
								}

                <!-- Add Provider Form -->
                <div class="bg-[#3c3836] border border-[#504945] rounded-lg p-4 mb-6">
                    <h2 class="text-lg font-semibold mb-3">Add New Provider</h2>
                    <form @submit=\${(e) => {
											e.preventDefault();
											const formData = new FormData(e.target);
											const data = Object.fromEntries(formData.entries());
											this.onAddProvider(data);
											e.target.reset();
											this.newProviderType = "local";
										}}>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label for="provider-type" class="block text-sm font-medium text-[#bdae93] mb-1">Provider Type</label>
                                <select name="id" id="provider-type" @change=\${(e) => (this.newProviderType = e.target.value)} class="w-full bg-[#504945] border border-[#665c54] rounded-md px-3 py-1.5 text-sm focus:ring-[#83a598] focus:outline-none h-[34px]">
                                	\${this.providers.map((provider) => html\`<option value=\${provider.id} ?selected=\${provider.id === this.newProviderType}>\${provider.name}</option>\`)}  																
                                </select>
                            </div>
                            \${
															this.newProviderType === "local"
																? html\`
                                <div>
                                    <label for="api-endpoint" class="block text-sm font-medium text-[#bdae93] mb-1">API Endpoint</label>
                                    <input type="url" name="endpoint" id="api-endpoint" required value="http://localhost:1234/v1/chat/completions" placeholder="http://localhost:1234/v1/chat/completions" class="w-full bg-[#504945] border border-[#665c54] rounded-md px-3 py-1.5 text-sm focus:ring-[#83a598] focus:outline-none">
                                </div>
                            \`
																: ""
														}
                            <div class="col-span-1 md:col-span-2">
                                <label for="api-key" class="block text-sm font-medium text-[#bdae93] mb-1">API Key</label>
                                <input type="password" name="apiKey" id="api-key" placeholder="Optional for some local providers" class="w-full bg-[#504945] border border-[#665c54] rounded-md px-3 py-1.5 text-sm focus:ring-[#83a598] focus:outline-none">
                            </div>
                        </div>
                        <button type="submit" class="mt-4 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#458588] text-[#ebdbb2] hover:bg-[#83a598] transition-colors font-semibold">
                            Add Provider
                        </button>
                    </form>
                </div>

                <!-- Existing Providers List -->
                <div class="flex-1 overflow-y-auto">
                     <h2 class="text-lg font-semibold mb-3">Configured Providers</h2>
                     \${
												activeProviders.length === 0
													? html\`
                        <div class="text-center py-8 px-4 border-2 border-dashed border-[#504945] rounded-lg">
                            <p class="text-[#928374]">No providers configured yet.</p>
                        </div>
                     \`
													: html\`
                     <div class="space-y-3">
                        \${activeProviders.map(
													(p) => html\`
                            <div class="bg-[#3c3836] border border-[#504945] rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <p class="font-semibold text-[#ebdbb2] capitalize">\${p.type}</p>
                                    \${p.endpoint ? html\`<p class="text-xs text-[#928374]">\${p.endpoint}</p>\` : ""}
                                </div>
                                <uix-button ghost icon="trash" @click=\${() => this.onDeleteProvider(p.type)} 
																	class="p-1.5 text-[#928374] hover:text-[#cc241d] rounded-full hover:bg-[#1d2021]">
                              </uix-button>
                            </div>
                        \`,
												)}
                     </div>
                     \`
											}
                </div>
            </div>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/icon-lucide/lucide/plus.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/send.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m22 2l-7 20l-4-9l-9-4Zm0 0L11 13"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/chevron-right.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/trash-2.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/list-checks.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 17l2 2l4-4M3 7l2 2l4-4m4 1h8m-8 6h8m-8 6h8"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/pickaxe.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14.531 12.469L6.619 20.38a1 1 0 1 1-3-3l7.912-7.912m4.155-5.154A12.5 12.5 0 0 0 5.461 2.958A1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393"/><path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/><path d="M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225a1 1 0 0 1-1.751-.119a22 22 0 0 0-3.393-6.319"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/square-check.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12l2 2l4-4"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/database.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/square.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/apps/mcp/views/dev.js":{content:`export default ({ $APP, html, AI, T }) => {
	return {
		tag: "mcp-dev",
		class: "w-full bg-[#282828] text-[#ebdbb2] flex font-sans text-sm",
		properties: {
			// Core Editor Properties
			content: T.string(""),
			language: T.string({ sync: "local", defaultValue: "javascript" }),
			filePath: T.string({ sync: "local" }),
			isDirty: T.boolean(false),
			isSaving: T.boolean(false),
			lastSaved: T.object(null),
			compilerErrors: T.array({ defaultValue: [], sync: "local" }),
			// Server Management Properties
			availableServers: T.array([]),
			selectedServer: T.string({ sync: "local", defaultValue: "default" }),
			isServerConnected: T.boolean({ sync: "local", defaultValue: false }),
			transportType: T.string({ sync: "local", defaultValue: "JavaScript" }),
			command: T.string({ sync: "local" }),
			args: T.string({ sync: "local" }),

			// UI State
			activeTab: T.string(),
			history: T.array([]),
			selectedHistoryItem: T.object(null),
			validationTimeout: T.object(null),
			worker: T.object(null),
			transpilePromises: T.object({ defaultValue: {} }),
		},

		async connected() {
			this.initializeWorker();
			await this.initializeAI();
			// Load initial server content based on saved selection or default
			const server =
				this.availableServers.find((s) => s.id === this.selectedServer) ||
				this.availableServers[0];
			if (server) {
				// If the selectedServer wasn't found, update it to the default
				if (server.id !== this.selectedServer) {
					this.selectedServer = server.id;
				}
				await this.loadServerContent(server.path);
			} else {
				console.warn("No available servers found to load.");
			}
		},

		disconnected() {
			if (this.validationTimeout) clearTimeout(this.validationTimeout);
			if (this.worker) this.worker.terminate();
		},

		// Fetches available servers from the AI service
		async initializeAI() {
			try {
				if (!AI.isInitialized) {
					await AI.init({
						/* Your AI config here */
					});
				}
				this.isServerConnected = AI.listClients().some(
					(c) => c.alias === "dev_server",
				);
				this.availableServers = AI.listServers();
			} catch (error) {
				console.error("Error initializing AI service:", error);
				this.isServerConnected = false;
				this.availableServers = [];
			}
		},

		async onServerChange(newServerKey) {
			if (this.isDirty) {
				console.warn(
					"Switching server templates with unsaved changes. The changes will be lost.",
				);
			}
			this.selectedServer = newServerKey;
			const server = this.availableServers.find((s) => s.id === newServerKey);
			if (server) {
				await this.loadServerContent(server.path);
				if (this.isServerConnected) {
					await this.disconnectFromServer();
				}
			} else {
				console.error(\`Server with key \${newServerKey} not found.\`);
			}
		},

		async loadServerContent(path) {
			this.filePath = path;
			this.command = path.replace(/\\.ts$/, ".js");
			try {
				const response = await fetch(path);
				if (!response.ok)
					throw new Error(\`HTTP error! status: \${response.status}\`);
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
			this.worker.onerror = (event) => console.error("Error in worker:", event);
			this.worker.postMessage({ type: "init" });
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

		async connectToServer() {
			await this.applyCodeChanges();
			if (!this.command) {
				console.error("Connection command/URL cannot be empty.");
				return;
			}
			try {
				const transportConfig = {
					type: this.transportType,
					command: this.command,
					args: this.args ? this.args.split(" ").filter(Boolean) : [],
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
				// Brief pause to ensure full disconnect before reconnecting
				setTimeout(() => {
					this.connectToServer();
				}, 200);
			}
		},

		// Combined handler for the connect/disconnect button
		async handleConnectionToggle() {
			if (this.isServerConnected) {
				await this.disconnectFromServer();
			} else {
				await this.connectToServer();
			}
		},

		// Handler for the reload/refresh button
		async handleReload() {
			if (this.isDirty) {
				await this.applyCodeChanges();
			}
			if (this.isServerConnected) {
				await this.reconnectToServer();
			}
		},

		selectTab(tabKey) {
			this.activeTab = tabKey;
		},

		// RENDER METHODS
		renderErrorPanel() {
			return html\`<div class="flex flex-col h-full bg-[#1d2021]">
                <div class="p-2 border-b border-[#504945] flex items-center">
                    <uix-icon name="triangle-alert" class="w-4 h-4 mr-2 text-red-400"></uix-icon>
                    <h3 class="text-md font-semibold text-[#ebdbb2]">Problems (\${this.compilerErrors.length})</h3>
                </div>
                <div class="flex-1 overflow-auto font-mono text-xs">
                    \${this.compilerErrors.map(
											(error) => html\`
                            <div class="p-2 border-b border-[#3c3836] hover:bg-[#3c3836]">
                                <span class="text-red-400">Error:</span>
                                <span class="text-[#bdae93]">(\${error.line}:\${error.character})</span>
                                <span class="text-white ml-2">\${error.message}</span>
                            </div>
                        \`,
										)}
                </div>
            </div>\`;
		},

		render() {
			const tabs = [
				{ key: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
				{ key: "tools", label: "Tools", icon: "wrench" },
				{ key: "resources", label: "Resources", icon: "database" },
				{ key: "prompts", label: "Prompts", icon: "terminal" },
			];

			const renderTabContent = (tab) => {
				switch (tab.key) {
					case "dashboard":
						return html\`<mcp-dashboard></mcp-dashboard>\`;
					case "tools":
						return html\`<mcp-tools></mcp-tools>\`;
					case "resources":
						return html\`<mcp-resources></mcp-resources>\`;
					case "prompts":
						return html\`<mcp-prompts></mcp-prompts>\`;
					default:
						return html\`<div class="text-center p-8 text-gray-500">View not implemented: \${tab.key}</div>\`;
				}
			};

			const availableServersForSelect = this.availableServers.map((val) => ({
				value: val.id,
				label: val.name,
			}));

			return html\`
                <!-- Left Panel: Editor -->
                <div class="flex-1 h-full flex flex-col min-w-0">
                     <div class="h-15 bg-[#3c3836] border-b border-[#504945] p-2 flex items-center justify-between">
                         <div class="flex items-center space-x-2">
                             <uix-input
                                 ghost
                                 class="dark w-3xs"
                                 type="select"
                                 .options=\${availableServersForSelect}
                                 .value=\${this.selectedServer}
                                 @change=\${(e) => this.onServerChange(e.target.value)}
                             ></uix-input>
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
                             <uix-button
                                 .label=\${this.isServerConnected ? "Disconnect" : "Connect"}
                                 class=\${this.isServerConnected ? "bg-red-700" : "bg-green-700"}
                                 @click=\${this.handleConnectionToggle.bind(this)}
                                 size="small"
                             ></uix-button>
                         </div>
                    </div>
                    <uix-code
                        .content=\${this.content}
                        .language=\${this.language}
                        .onUpdate=\${this.onEditorUpdate.bind(this)}
                        class="flex-1 overflow-y-auto"
                    ></uix-code>
                </div>

                <uix-divider vertical resizable style="--uix-divider-color: #3c3836;"></uix-divider>

                <!-- Right Panel: Dashboard/Tools -->
                <div class="flex-1 h-full flex flex-col min-w-0">
                    \${
											this.isServerConnected
												? html\`<div class="flex-1 flex flex-col min-h-0">
                            <uix-tabs
                                style="--uix-tabs-font-size: 1rem; --uix-tabs-active-background-color: var(--colors-red-700); --uix-tabs-border-color: var(--colors-red-800); --uix-tabs-text: #ebdbb2; --uix-tabs-active-text: #ebdbb2;"
                                class="flex flex-col flex-grow"
                                activeTab=\${this.activeTab}
                                .selectTab=\${this.selectTab.bind(this)}
                                .tabs=\${tabs.map((tab) => [
																	html\`<uix-icon name=\${tab.icon} class="mr-2 w-5"></uix-icon> \${tab.label}\`,
																	html\`<div class="p-4 flex-grow overflow-auto">\${renderTabContent(tab)}</div>\`,
																])}
                            ></uix-tabs>
                          </div>\`
												: html\`
                          <div class="flex-1 flex items-center justify-center bg-[#282828]">
                              <div class="text-center max-w-md p-4">
                                  <uix-icon name="server-off" class="w-16 h-16 text-[#928374] mx-auto mb-4"></uix-icon>
                                  <h3 class="text-lg font-semibold text-[#ebdbb2] mb-2">Server Not Connected</h3>
                                  <p class="text-[#bdae93] mb-6">Edit your server code, then click Connect to run it.</p>
                                  <uix-button
                                      label="Connect"
                                      @click=\${this.connectToServer.bind(this)}
                                      size="small"
                                  ></uix-button>
                              </div>
                          </div>
                        \`
										}
                    <mcp-requests></mcp-requests>
                    \${
											this.compilerErrors.length > 0
												? html\`
                            <uix-divider resizable></uix-divider>
                            <div class="flex-shrink-0 h-50 overflow-auto">
                                \${this.renderErrorPanel()}
                            </div>
                          \`
												: ""
										}
                </div>
            \`;
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/templates/servers/basic.js":{content:`import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

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
							description: "ID of user to transfer posts to (if transferring)",
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
							count: dataStore.posts.filter((p) => p.authorId === u.id).length,
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

export default server;
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/form/code.js":{content:`const cm = {
	core: () => import("https://esm.sh/@codemirror/state"),
	view: () => import("https://esm.sh/@codemirror/view"),
	commands: () => import("https://esm.sh/@codemirror/commands"),
	language: () => import("https://esm.sh/@codemirror/language"),
	theme: () => import("https://esm.sh/@fsegurai/codemirror-theme-gruvbox-dark"),
	lang: {
		typescript: () => import("https://esm.sh/@codemirror/lang-javascript"),
		javascript: () => import("https://esm.sh/@codemirror/lang-javascript"),
		css: () => import("https://esm.sh/@codemirror/lang-css"),
		html: () => import("https://esm.sh/@codemirror/lang-html"),
	},
};

export default ({ T }) => ({
	tag: "textarea",
	class: "flex flex-grow",
	style: true,
	properties: {
		content: T.string(),
		language: T.string(),
		onUpdate: T.function(),
	},

	view: null,
	isUpdatingFromOutside: false,

	async connected() {
		const parent = this;
		if (!parent || this.view) return;

		const [
			{ EditorState },
			{ EditorView, keymap, lineNumbers, highlightSpecialChars },
			{ defaultKeymap, history, historyKeymap, indentWithTab },
			{ indentUnit },
			{ gruvboxDark }, // Import the new theme
		] = await Promise.all([
			cm.core(),
			cm.view(),
			cm.commands(),
			cm.language(),
			cm.theme(),
		]);

		const langExtension = [];
		if (this.language && cm.lang[this.language]) {
			const langModule = await cm.lang[this.language]();
			const langFunc = langModule[this.language];
			console.log({ langFunc, langModule });
			if (typeof langFunc === "function") {
				langExtension.push(langFunc());
			} else {
				console.warn(
					\`CodeMirror language function for "\${this.language}" not found.\`,
				);
			}
		}

		const updateListener = EditorView.updateListener.of((update) => {
			if (update.docChanged && this.onUpdate) {
				const newContent = update.state.doc.toString();
				this.isUpdatingFromOutside = true;
				this.onUpdate(newContent);
				queueMicrotask(() => {
					this.isUpdatingFromOutside = false;
				});
			}
		});

		const customFontSize = EditorView.theme({
			".cm-editor": {
				fontSize: "12px",
			},
		});

		const state = EditorState.create({
			doc: this.content || "",
			extensions: [
				lineNumbers(),
				highlightSpecialChars(),
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
				gruvboxDark, // Use the gruvbox dark theme
				customFontSize,
				EditorView.lineWrapping,
				...langExtension,
				updateListener,
				indentUnit.of("  "),
				EditorState.tabSize.of(2),
			],
		});

		this.view = new EditorView({ state, parent });
	},

	updated(changedProperties) {
		if (
			this.view &&
			Object.hasOwn(changedProperties, "content") &&
			!this.isUpdatingFromOutside
		) {
			const currentDoc = this.view.state.doc.toString();
			if (currentDoc !== this.content) {
				this.view.dispatch({
					changes: {
						from: 0,
						to: currentDoc.length,
						insert: this.content || "",
					},
				});
			}
		}
	},

	disconnected() {
		if (this.view) {
			this.view.destroy();
			this.view = null;
		}
	},

	render() {
		return null;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/layout/divider.js":{content:`let throttleTimeout = null;
let lastEvent = null;

export default ({ html, T }) => ({
	tag: "uix-divider",
	style: true,
	properties: {
		label: T.string(),
		vertical: T.boolean(),
		resizable: T.boolean({ defaultValue: false }),
	},
	firstUpdated() {
		if (this.resizable) {
			window.addEventListener("pointerdown", this.pointerDown.bind(this));
		}
	},

	pointerDown(e) {
		if (e.target !== this) return;
		e.preventDefault();
		this.setPointerCapture(e.pointerId);

		this._startX = e.clientX;
		this._startY = e.clientY;

		this._prevElem = this.previousElementSibling;
		this._nextElem = this.nextElementSibling;

		this._prevElemStartWidth = this._prevElem ? this._prevElem.offsetWidth : 0;
		this._nextElemStartWidth = this._nextElem ? this._nextElem.offsetWidth : 0;
		this._prevElemStartHeight = this._prevElem
			? this._prevElem.offsetHeight
			: 0;
		this._nextElemStartHeight = this._nextElem
			? this._nextElem.offsetHeight
			: 0;

		window.addEventListener("pointermove", this.pointerMove.bind(this));
		window.addEventListener("pointerup", this.pointerUp.bind(this));
	},
	pointerMove(e) {
		lastEvent = e;
		if (throttleTimeout) return;

		throttleTimeout = setTimeout(() => {
			throttleTimeout = null;
			this.handleMouseMove(lastEvent);
		}, 15);
	},

	handleMouseMove(e) {
		if (!this._prevElem || !this._nextElem) return;

		if (this.vertical) {
			let dx = e.clientX - this._startX;
			if (dx > 0) dx += 20;
			const newPrevWidth = this._prevElemStartWidth + dx;
			const newNextWidth = this._nextElemStartWidth - dx;

			if (newPrevWidth > 0 && newNextWidth > 0) {
				this._prevElem.style.flexBasis = \`\${newPrevWidth}px\`;
				this._nextElem.style.flexBasis = \`\${newNextWidth}px\`;
			}
		} else {
			const dy = e.clientY - this._startY;
			const newPrevHeight = this._prevElemStartHeight + dy;
			const newNextHeight = this._nextElemStartHeight - dy;

			if (newPrevHeight > 0 && newNextHeight > 0) {
				this._prevElem.style.flexBasis = \`\${newPrevHeight}px\`;
				this._nextElem.style.flexBasis = \`\${newNextHeight}px\`;
			}
		}
	},

	pointerUp(e) {
		this.releasePointerCapture(e.pointerId);
		this._startX = null;
		this._startY = null;

		this._prevElem = null;
		this._nextElem = null;

		this._prevElemStartWidth = null;
		this._nextElemStartWidth = null;
		this._prevElemStartHeight = null;
		this._nextElemStartHeight = null;
		window.removeEventListener("pointermove", this.pointerMove.bind(this));
		window.removeEventListener("pointerup", this.pointerUp.bind(this));
	},

	render() {
		return !this.label ? null : html\`<span>\${this.label}</span>\`;
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/apps/mcp/views/requests.js":{content:`export default ({ html, AI, T }) => {
	return {
		properties: {
			pendingRequests: T.array([]),
			isLoading: T.boolean(true),
			isExpanded: T.boolean(false),
			formValues: T.object({}),
			requestUnsubscribe: T.object(null),
		},

		async connected() {
			this.requestUnsubscribe = AI.onRequestChange(
				this.loadAllPendingRequests.bind(this),
			);
			// Initial load
			await this.loadAllPendingRequests();
		},

		disconnected() {
			if (this.requestUnsubscribe) {
				this.requestUnsubscribe();
			}
		},

		async loadAllPendingRequests() {
			// Store the count before fetching to detect new requests.
			const previousRequestCount = this.pendingRequests.length;

			if (!AI.isInitialized || AI.listClients().length === 0) {
				this.pendingRequests = [];
				this.isLoading = false;
				return;
			}

			this.isLoading = true;
			try {
				const [samplings, elicitations] = await Promise.all([
					AI.listSamplingRequests(),
					AI.listElicitationRequests(),
				]);

				// Tag each request with its type ('elicitation' or 'sampling').
				const elicitationReqs = (elicitations.elicitationRequests || []).map(
					(req) => ({ ...req, type: "elicitation" }),
				);
				const samplingReqs = (samplings.samplingRequests || []).map((req) => ({
					...req,
					type: "sampling",
				}));

				// Combine into a single list.
				this.pendingRequests = [...elicitationReqs, ...samplingReqs];

				// Automatically expand if new requests have arrived.
				if (this.pendingRequests.length > previousRequestCount) {
					this.isExpanded = true;
				}
			} catch (error) {
				console.error("Error loading pending requests:", error);
				this.pendingRequests = [];
			} finally {
				this.isLoading = false;
			}
		},

		toggleExpanded() {
			this.isExpanded = !this.isExpanded;
		},

		// --- Event Handlers ---
		// Sampling handlers
		async handleSamplingResponse(request, action) {
			try {
				if (action === "approve") {
					await AI.approveSamplingRequest({
						id: request.id,
						server: request.server,
					});
				} else {
					await AI.rejectSamplingRequest({
						id: request.id,
						server: request.server,
					});
				}
			} catch (e) {
				console.error(\`Failed to \${action} sampling request:\`, e);
			}
		},

		// Elicitation handlers
		handleInput(requestId, fieldName, event, schema) {
			const newValues = {
				...(this.formValues?.[requestId] || {}),
				[fieldName]:
					schema.type === "boolean"
						? !!event.target.checked
						: event.target.value,
			};
			this.formValues = { ...this.formValues, [requestId]: newValues };
		},

		async handleElicitationSubmit(request) {
			const response = this.formValues[request.id] || {};
			try {
				await AI.respondToElicitation({
					id: request.id,
					response,
					server: request.server,
				});
				const newFormValues = { ...this.formValues };
				delete newFormValues[request.id];
				this.formValues = newFormValues;
			} catch (e) {
				console.error("Failed to respond to elicitation:", e);
			}
		},

		async handleElicitationDecline(request) {
			try {
				await AI.respondToElicitation({
					id: request.id,
					response: {},
					server: request.server,
					action: "decline",
				});
				const newFormValues = { ...this.formValues };
				delete newFormValues[request.id];
				this.formValues = newFormValues;
			} catch (e) {
				console.error("Failed to decline elicitation:", e);
			}
		},

		// --- Render Methods (Updated for unified list) ---
		renderFormField(req, fieldName, schema) {
			const value = this.formValues?.[req.id]?.[fieldName] || "";
			return html\`
                 <uix-input
                     label=\${fieldName}
                     value=\${value}
                     type=\${schema.enum ? "select" : { boolean: "checkbox", enum: "select" }[schema.type] || "text"}
                     .options=\${schema.enum}
                     placeholder=\${schema.description}
                     @input=\${(e) => this.handleInput(req.id, fieldName, e, schema)}
                     class="font-mono text-sm w-full"
                 ></uix-input>
             \`;
		},

		renderSamplingRequest(req) {
			return html\`
                 <div class="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                     <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <h5 class="font-semibold text-sm mb-2 text-gray-700">Request</h5>
                             <pre class="text-xs whitespace-pre-wrap bg-gray-800 text-gray-200 p-3 rounded-lg font-mono overflow-auto max-h-48">\${JSON.stringify(req.request, null, 2)}</pre>
                         </div>
                         <div>
                             <h5 class="font-semibold text-sm mb-2 text-gray-700">Response Preview</h5>
                             <pre class="text-xs whitespace-pre-wrap bg-gray-100 text-gray-800 p-3 rounded-lg font-mono overflow-auto max-h-48">\${JSON.stringify(req.responseStub, null, 2)}</pre>
                         </div>
                     </div>
                     <div class="flex justify-end gap-3 p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                         <uix-button @click=\${() => this.handleSamplingResponse(req, "reject")} label="Reject" size="small" class="is-danger"></uix-button>
                         <uix-button @click=\${() => this.handleSamplingResponse(req, "approve")} label="Approve" size="small" class="is-primary"></uix-button>
                     </div>
                 </div>
             \`;
		},

		renderElicitationRequest(req) {
			return html\`
                 <div class="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                         <div class="pr-4 border-r border-gray-200">
                             <h5 class="font-semibold text-sm mb-2 text-gray-700">Information Request</h5>
                             <p class="text-sm text-gray-800 mb-4">\${req.requestText}</p>
                             <h6 class="font-mono text-xs font-bold text-gray-600 mb-2">Schema</h6>
                             <pre class="text-xs whitespace-pre-wrap bg-gray-800 text-gray-200 p-3 rounded-lg font-mono overflow-auto max-h-32">\${JSON.stringify(req.schema, null, 2)}</pre>
                         </div>
                         <div>
                             <h5 class="font-semibold text-sm mb-3 text-gray-700">Response Form</h5>
                             <div class="space-y-3">
                                 \${Object.entries(req.schema.properties).map(
																		([fieldName, fieldSchema]) =>
																			this.renderFormField(
																				req,
																				fieldName,
																				fieldSchema,
																			),
																	)}
                             </div>
                         </div>
                     </div>
                     <div class="flex justify-end gap-3 p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                         <uix-button @click=\${() => (this.formValues[req.id] = {})} label="Reset" size="small"></uix-button>
                         <uix-button @click=\${() => this.handleElicitationDecline(req)} label="Decline" size="small" class="is-danger"></uix-button>
                         <uix-button @click=\${() => this.handleElicitationSubmit(req)} label="Submit" size="small" class="is-primary"></uix-button>
                     </div>
                 </div>
             \`;
		},

		renderCollapsedBanner() {
			return html\`
                <div class="bg-amber-50 border-b-2 border-amber-400 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors" @click=\${this.toggleExpanded.bind(this)}>
                    <div class="flex items-center space-x-3">
                        <uix-icon name="bell" class="w-5 h-5 text-amber-600 animate-pulse"></uix-icon>
                        <div>
                            <!-- SIMPLIFIED: Display total count directly. -->
                            <span class="font-semibold text-amber-900">
                                \${this.pendingRequests.length} Pending Request\${this.pendingRequests.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                    <uix-icon name="chevron-down" class="w-5 h-5 text-amber-600"></uix-icon>
                </div>
            \`;
		},

		renderExpandedPanel() {
			return html\`
                <div class="flex flex-col bg-white border-b-2 border-amber-400">
                    <!-- Header -->
                    <div class="bg-amber-50 px-4 py-2 flex items-center justify-between border-b border-amber-200">
                        <div class="flex items-center space-x-3">
                            <uix-icon name="bell" class="w-5 h-5 text-amber-600"></uix-icon>
                            <span class="font-semibold text-amber-900">Pending Requests</span>
                        </div>
                        <uix-button @click=\${this.toggleExpanded} size="small" ghost>
                            <uix-icon name="chevron-up" class="w-4 h-4"></uix-icon>
                        </uix-button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-auto p-4">
                        \${
													this.pendingRequests.length > 0
														? this.pendingRequests.map((req) =>
																// Conditionally render based on the request 'type'.
																req.type === "sampling"
																	? this.renderSamplingRequest(req)
																	: this.renderElicitationRequest(req),
															)
														: html\`<div class="text-center text-gray-500 py-8">No pending requests</div>\`
												}
                    </div>
                </div>
            \`;
		},

		render() {
			// SIMPLIFIED: Check the length of the unified pendingRequests array.
			if (this.isLoading || this.pendingRequests.length === 0) {
				return html\`\`;
			}
			return this.isExpanded
				? this.renderExpandedPanel()
				: this.renderCollapsedBanner();
		},
	};
};
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/form/code.css":{content:`.cm-scroller {
	overflow: auto !important;
}

.cm-editor {
	width: 100%;
}
`,mimeType:"text/css",skipSW:!1},"/modules/uix/layout/divider.css":{content:`.uix-divider {
	--uix-divider-color: rgba(0, 0, 0, 0.05);
	--uix-divider-size: 2px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 0;
	width: 100%;
	height: var(--uix-divider-size);
	span {
		padding: 0 0.75rem;
		font-weight: bold;
		font-size: var(--uix-divider-font-size, 1.5rem);
	}

	&[resizable] {
		cursor: row-resize;
		&[vertical] {
			cursor: col-resize;
		}
	}
	&::before,
	&::after {
		content: "";
		flex-grow: 1;
		height: var(--uix-divider-size);
		background-color: var(--uix-divider-color);
	}
	&[label] {
		padding: var(--uix-divider-padding, 1rem) 0;
	}
	&[label]::before,
	&[label]::after {
		flex-grow: 1;
	}
	&[vertical] {
		flex-direction: column;
		width: 1px;
		height: 100%;
		background-color: transparent;
		&::before,
		&::after {
			width: 1px;
			height: auto;
		}
		&[label] {
			padding: 0 var(--uix-divider-padding, 1rem);
		}
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/server-off.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5m-5 0L2.5 2.5C2 2 2 2.5 2 5v3a2 2 0 0 0 2 2zm12 7v-1a2 2 0 0 0-2-2h-1M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16.5l1-.5l.5.5l-8-8zm2 4h.01M2 2l20 20"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/triangle-alert.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/atom.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9c-4.54-4.52-9.87-6.54-11.9-4.5c-2.04 2.03-.02 7.36 4.5 11.9c4.54 4.52 9.87 6.54 11.9 4.5"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9c-2.03-2.04-7.36-.02-11.9 4.5c-4.52 4.54-6.54 9.87-4.5 11.9c2.03 2.04 7.36.02 11.9-4.5"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/workflow.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/users.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87m-3-12a4 4 0 0 1 0 7.75"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/gem.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 3h12l4 6l-10 13L2 9Z"/><path d="M11 3L8 9l4 13l4-13l-3-6M2 9h20"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/arrow-up.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12l7-7l7 7m-7 7V5"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/search.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.3-4.3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/github.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5c.08-1.25-.27-2.48-1-3.5c.28-1.15.28-2.35 0-3.5c0 0-1 0-3 1.5c-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5c-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/terminal.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 17l6-6l-6-6m8 14h8"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/flame.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3c-1.072-2.143-.224-4.054 2-6c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/message-circle.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/star.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01z"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/package.json":{content:`{
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
		"name": "MCPiquant.com",
		"url": "https://www.mcpiquant.com",
		"emojiIcon": "\u{1F336}\uFE0F",
		"importmap": {
			"@modelcontextprotocol/sdk/": "https://cdn.jsdelivr.net/npm/@modelcontextprotocol/sdk@1.18.1/dist/esm/",
			"zod": "https://esm.sh/zod@3.23.8",
			"eventsource-parser/stream": "https://esm.sh/eventsource-parser/stream",
			"pkce-challenge": "https://esm.sh/pkce-challenge",
			"zod-to-json-schema": "https://esm.sh/zod-to-json-schema@3.24.5",
			"ajv": "https://esm.sh/ajv@6.12.6"
		}
	},
	"theme": {
		"font": {
			"family": "'Manrope'"
		}
	}
}
`,mimeType:"application/json",skipSW:!1},"/modules/mvc/index.js":{content:`export const dependencies = {
	T: "/modules/types/index.js",
	html: "/modules/mvc/view/html/index.js",
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
 *     to avoid object fields since this code is shared with non-minified SSG
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
	 *   but not set the attribute, and in SSG to no-op the DOM operation and
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/view/index.js":{content:`export default ({ T, html }) => {
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

		static properties = {};
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
			this._ignoreAttributeChange = skipPropUpdate;
			const isReflectable =
				type &&
				!["array", "object"].includes(type) &&
				typeof value !== "function";
			if (isReflectable) {
				if (type === "boolean")
					value ? this.setAttribute(key, "") : this.removeAttribute(key);
				else if (value == null) this.removeAttribute(key);
				else this.setAttribute(key, String(value));
			}
			if (!skipPropUpdate) this[key] = value;
			else this._ignoreAttributeChange = false;
		}
	}

	return View;
};
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
				if (klass) this.classList.add(...klass.split(" "));
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
		//TODO: optin for plugins
		BaseClass.plugins
			.filter(({ init }) => init && typeof init === "function")
			.map(({ init }) => {
				init({ View, component, definition, tag });
			});
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/mvc/controller/backend/index.js":{content:`export default ({ View, T, $APP }) => {
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
		const query = instance["data-query"];
		if (!query) return;
		const {
			id,
			model,
			limit,
			offset = 0,
			includes,
			recursive,
			order,
			where,
			key,
		} = query;
		const isMany = query.many ?? !id;
		const opts = { limit, offset, order, recursive };
		opts.where ??= where;
		if (includes)
			opts.includes = Array.isArray(includes) ? includes : includes.split(",");

		const onDataLoaded = (res) => {
			if (!isMany) instance.state[key] = res;
			else {
				instance.state[key] = res.items ?? res;
				if (res.count) query.count = res.count;
			}
			instance.requestUpdate();
			instance.emit("dataLoaded", {
				instance,
				rows: isMany ? instance[key] : undefined,
				row: !isMany ? instance[key] : undefined,
				component: instance.constructor,
			});
		};

		if (isMany) $APP.Model[model].getAll(opts).then(onDataLoaded);
		else $APP.Model[model].get(id, opts).then(onDataLoaded);
	};

	View.plugins.push({
		name: "dataQuery",
		init: ({ View }) => {
			View.properties["data-query"] = T.object({
				properties: {
					model: T.string(),
					id: T.string(),
					method: T.string(),
					where: T.object(),
					includes: T.string(),
					order: T.string(),
					limit: T.number(),
					offset: T.number(),
					count: T.number(),
				},
			});
		},
		events: {
			connected: ({ instance }) => {
				const query = instance["data-query"];
				if (!query) return;
				instance._listeners = {};
				const { model, id, key } = query;
				const row = instance[key];
				const modelRows = $APP.Model[model]?.rows;
				if (!modelRows) return;
				if (id) {
					const listenerKey = \`get:\${id}\`;
					if (row !== undefined && modelRows[id] === undefined)
						modelRows[id] = row;
					instance._listeners[listenerKey] = () => {
						instance[key] = modelRows[id];
						instance.requestUpdate();
					};
					$APP.Model[model].on(listenerKey, instance._listeners[listenerKey]);
				} else {
					instance._listeners.any = () => requestDataSync({ instance });
					$APP.Model[model].onAny(instance._listeners.any);
				}
				if (!row) requestDataSync({ instance });
				instance.syncable = true;
			},
			disconnected: ({ instance }) => {
				if (!instance._listeners) return;
				const query = instance["data-query"];
				if (!query) return;
				Object.entries(instance._listeners).forEach(([key, listener]) => {
					if (!query.model || !$APP.Model[query.model]) return;
					if (key === "any") $APP.Model[query.model].offAny(listener);
					else $APP.Model[query.model].off(key, listener);
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
		console.error({ key, value });
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/router/index.js":{content:`/**
 * @file Application Router
 * @description A client-side router that supports nested routes, dynamic parameters, query strings,
 * trailing optional parameters (e.g., /page/2), and history management.
 */
export default ({ html, Controller, $APP }) => {
	class Router {
		static stack = [];
		static routes = {};
		static namedRoutes = {};
		static currentRoute = {};
		static defaultTitle = "";

		/**
		 * Converts a route path string into a regular expression for matching.
		 * @param {string} path - The route path definition.
		 * @returns {{ regex: RegExp, paramNames: string[] }}
		 * @private
		 */
		static _pathToRegex(path) {
			const paramNames = [];
			const regexPath = path.replace(/:(\\w+)/g, (_, paramName) => {
				paramNames.push(paramName);
				return "([^/]+)";
			});

			const regex = new RegExp(\`^\${regexPath}$\`);
			return { regex, paramNames };
		}

		/**
		 * Recursively flattens the nested route configuration.
		 * @param {object} routes - The nested routes object to process.
		 * @param {string} [basePath=''] - The base path from the parent route.
		 * @param {object} [parentRoute=null] - The parent route object.
		 * @returns {{flatRoutes: object, namedRoutes: object}}
		 */
		static flattenRoutes(routes, basePath = "", parentRoute = null) {
			const flatRoutes = {};
			const namedRoutes = {};

			for (const path in routes) {
				const route = { ...routes[path] };
				const fullPath = (basePath + path).replace(/\\/+/g, "/");

				route.path = fullPath || "/";
				route.parent = parentRoute;
				flatRoutes[route.path] = route;

				if (route.name) {
					if (namedRoutes[route.name]) {
						console.warn(
							\`Router Warning: Duplicate route name "\${route.name}". Overwriting.\`,
						);
					}
					namedRoutes[route.name] = route.path;
				}

				if (route.routes) {
					const { flatRoutes: childFlatRoutes, namedRoutes: childNamedRoutes } =
						this.flattenRoutes(route.routes, fullPath, route);
					Object.assign(flatRoutes, childFlatRoutes);
					Object.assign(namedRoutes, childNamedRoutes);
				}
			}
			return { flatRoutes, namedRoutes };
		}

		/**
		 * Initializes the router.
		 * @param {object} routes - The main routes configuration.
		 * @param {string} [defaultTitle=''] - The default document title.
		 */
		static init(routes, defaultTitle = "") {
			if (!Object.keys(routes).length) {
				return console.error("Error: no routes loaded");
			}

			const { flatRoutes, namedRoutes } = this.flattenRoutes(routes);
			this.routes = flatRoutes;
			this.namedRoutes = namedRoutes;
			this.defaultTitle = defaultTitle;

			window.addEventListener("popstate", () => this.handleHistoryNavigation());
			this.setCurrentRoute(window.location.href, false);
		}

		/**
		 * Handles browser history navigation (back/forward buttons).
		 */
		static handleHistoryNavigation() {
			const currentPath = window.location.href;
			const stackIndex = this.stack.findIndex(
				(item) =>
					this.normalizePath(item.path) === this.normalizePath(currentPath),
			);
			if (stackIndex !== -1) {
				this.truncateStack(stackIndex);
			}
			this.setCurrentRoute(currentPath, false);
		}

		/**
		 * Generates a URL path for a named route.
		 * @param {string} routeName - The name of the route.
		 * @param {object} [params={}] - The parameters for the path.
		 * @returns {string|null} The generated path or null on error.
		 */
		static create(routeName, params = {}) {
			const pathPattern = this.namedRoutes[routeName];
			if (!pathPattern) {
				console.error(
					\`Router Error: Route with name "\${routeName}" not found.\`,
				);
				return null;
			}

			const route = this.routes[pathPattern];
			const allowedTrailing = route.namedParams || [];
			let finalPath = pathPattern;

			// Separate path params from trailing and query params
			const pathParams = {};
			const namedParams = {};
			for (const key in params) {
				if (pathPattern.includes(\`:\${key}\`)) {
					pathParams[key] = params[key];
				} else if (allowedTrailing.includes(key)) {
					namedParams[key] = params[key];
				}
			}

			// Build the base path
			finalPath = finalPath.replace(/:(\\w+)/g, (match, paramName) => {
				if (
					pathParams[paramName] !== undefined &&
					pathParams[paramName] !== null
				) {
					return String(pathParams[paramName]);
				}
				console.warn(
					\`Router Warning: Parameter "\${paramName}" was not provided for named route "\${routeName}".\`,
				);
				return match;
			});

			// Append trailing parameters
			for (const key in namedParams) {
				finalPath += \`/\${key}/\${namedParams[key]}\`;
			}

			if (finalPath.includes(":")) {
				console.error(
					\`Router Error: Could not create path for "\${routeName}". Final path still contains unresolved parameters: \${finalPath}\`,
				);
				return null;
			}

			return finalPath;
		}

		/**
		 * Navigates to a given route.
		 * @param {string} routeNameOrPath - The path or the name of the route.
		 * @param {object} [params] - Route parameters if navigating by name.
		 */
		static go(routeNameOrPath, params) {
			const path = params
				? this.create(routeNameOrPath, params)
				: routeNameOrPath;
			if (path !== null) {
				this.setCurrentRoute(path, true);
			}
		}

		/** Navigates to the home route and clears the history stack. */
		static home = () => {
			this.stack = [];
			this.go("/");
		};

		/** Navigates back in the history stack. */
		static back = () => {
			if (this.stack.length <= 1) return this.home();
			this.stack.pop();
			window.history.back();
		};

		/**
		 * Pushes a new state to the browser's history.
		 * @private
		 */
		static _pushState(path, state = {}) {
			if (path !== window.location.href) {
				window.history.pushState(state, "", path);
			}
			this.updateCurrentRouteInRam(this.currentRoute);
		}

		/**
		 * Sets the current route based on a path.
		 * @param {string} path - The URL path to navigate to.
		 * @param {boolean} [pushState=true] - Whether to push to the history stack.
		 */
		static setCurrentRoute(path, pushState = true) {
			if (!this.routes) return;

			const url = new URL(path, window.location.origin);
			const normalizedPath = this.normalizePath(url.pathname);
			const matched = this.matchRoute(normalizedPath);

			if (!matched) {
				console.warn(
					\`Router Warning: No route found for path "\${normalizedPath}".\`,
				);
				return pushState ? this.go("/") : null;
			}

			if (matched.route.ssg && $APP.settings.production) {
				window.location.href = path;
				return;
			}

			matched.path = url.pathname;
			matched.querystring = url.search;
			matched.hash = url.hash;
			matched.queryParams = Object.fromEntries(url.searchParams.entries());
			matched.params = { ...matched.queryParams, ...matched.params };

			if (matched.route.action) return matched.route.action(matched.params);
			if (matched.route.redirect) return this.go(matched.route.redirect);

			this.currentRoute = matched;
			const newTitle = matched.route.title || this.defaultTitle;
			this.setTitle(newTitle);

			if (pushState) {
				this.pushToStack(path, matched.params, newTitle);
				this._pushState(path, { path });
			} else {
				this.updateCurrentRouteInRam(this.currentRoute);
			}
		}

		/**
		 * Finds the route that matches the given URL, progressively shortening
		 * the path to check for trailing optional parameters.
		 * @param {string} path - The URL to match.
		 * @returns {object|null} A match object or null.
		 */
		static matchRoute(path) {
			const segments = path.split("/").filter(Boolean);
			const namedParams = {};

			while (true) {
				const currentPathToTest =
					segments.length > 0 ? "/" + segments.join("/") : "/";

				for (const routePath in this.routes) {
					const route = this.routes[routePath];
					const { regex, paramNames } = this._pathToRegex(route.path);
					const match = currentPathToTest.match(regex);

					if (match) {
						const allowedTrailing = route.namedParams || [];
						const collectedTrailingKeys = Object.keys(namedParams);
						const isValidTrailing = collectedTrailingKeys.every((key) =>
							allowedTrailing.includes(key),
						);

						if (!isValidTrailing) {
							break;
						}

						const params = {};
						paramNames.forEach((name, index) => {
							if (match[index + 1] !== undefined) {
								params[name] = decodeURIComponent(match[index + 1]);
							}
						});

						const combinedParams = { ...params, ...namedParams };
						const component =
							typeof route.component === "function"
								? route.component(combinedParams)
								: route.component;
						const result = {
							route,
							params: combinedParams,
							path,
							name: route.name,
							component,
							template: route.template,
						};

						if (route.parent) {
							result.route = route.parent;
							result.template = route.parent.template;
							result.component = route.parent.component(combinedParams);
							result.matched = {
								route,
								params: combinedParams,
								path: route.path,
								name: route.name,
								component: component,
								template: route.template,
							};
						}
						return result;
					}
				}

				if (segments.length < 2) break;

				const value = segments.pop();
				const key = segments.pop();
				namedParams[key] = value;
			}
			return null;
		}

		// --- Helper and State Management Methods ---

		static pushToStack(path, params = {}, title = this.defaultTitle) {
			const newItem = { path, params, title };
			if (this.normalizePath(path) === "/") {
				this.stack = [newItem];
			} else {
				this.stack.push(newItem);
			}
		}

		static setTitle(newTitle) {
			const fullTitle = newTitle
				? \`\${newTitle} | \${$APP.settings.name}\`
				: $APP.settings.name;
			document.title = fullTitle;
			if (this.stack.length > 0) this.stack.at(-1).title = newTitle;
			if (this.currentRoute?.route) this.currentRoute.route.title = newTitle;
		}

		static updateCurrentRouteInRam(route) {
			this.currentRoute = { ...route, root: this.isRoot() };
			Controller.ram.set("currentRoute", this.currentRoute);
		}

		static isRoot = () => this.stack.length <= 1;

		static truncateStack = (index = 0) => {
			this.stack = this.stack.slice(0, index + 1);
		};

		static normalizePath = (path = "/") => {
			const normalized = path.split("?")[0].split("#")[0];
			return (normalized || "/").replace(/\\/+$/, "") || "/";
		};
	}

	const init = () => Router.init($APP.routes, "My App");

	$APP.hooks.on("init", init);
	$APP.routes.set({
		"/": { name: "home", component: () => html\`<app-index></app-index>\` },
	});
	$APP.addModule({ name: "router" });

	return Router;
};
`,mimeType:"application/javascript",skipSW:!1},"/index.js":{content:`import { keyed } from "/modules/mvc/view/html/directive.js";

export default ({ $APP, html }) => {
	const routes = {
		"/servers": {
			name: "discover-servers",
			redirect: "/",
		},
		"/discover": {
			name: "discover-servers",
			redirect: "/",
		},
		"": {
			name: "discover",
			ssg: true,
			component: () => html\`<template-discover></template-discover>\`,
			title: "Discover: Servers",
			template: "template-app",
			routes: {
				"": {
					name: "discover-index",
					ssg: true,
					component: ({ page }) =>
						html\`<mcp-discover-list-view type="server" .page=\${page}></mcp-discover-list-view>\`,
					title: "Discover: Servers",
				},
				"/servers/tag/:tagId": {
					ssg: true,
					name: "discover-servers-by-tag",
					component: ({ tagId, page = 1 }) => {
						const decodedTagId = decodeURIComponent(tagId);
						return keyed(
							tagId,
							html\`<mcp-discover-list-view
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 type="server"
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 .tagId=\${decodedTagId}
                                .page=\${page}
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 ></mcp-discover-list-view>\`,
						);
					},
					title: "Discover: Servers by Tag",
				},
				"/servers": {
					namedParams: ["page"],
					name: "discover",
					ssg: true,
					component: ({ page }) =>
						html\`<mcp-discover-list-view type="server" .page=\${page}></mcp-discover-list-view>\`,
					title: "Discover: Servers",
				},
				"/server/:id": {
					name: "discover-server",
					ssg: true,
					component: ({ id }) =>
						keyed(
							id,
							html\`<mcp-artifact-detail .data-query=\${{ model: "servers", id: id.replace("_", "/"), key: "artifact" }} type="server"></mcp-artifact-detail>\`,
						),
					title: "Discover: Server",
				},
				"/clients/tag/:tagId": {
					namedParams: ["page"],
					ssg: true,
					name: "discover-clients-by-tag",
					component: ({ tagId, page }) => {
						const decodedTagId = decodeURIComponent(tagId);
						return keyed(
							tagId,
							html\`<mcp-discover-list-view
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 type="client"
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 .tagId=\${decodedTagId}
                                .page=\${page}
\xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 \xA0 ></mcp-discover-list-view>\`,
						);
					},
					title: "Discover: Clients by Tag",
				},
				"/clients": {
					namedParams: ["page"],
					ssg: true,
					name: "discover-clients",
					component: ({ page }) =>
						html\`<mcp-discover-list-view type="client" .page=\${page}></mcp-discover-list-view>\`,
					title: "Discover: Clients",
				},
				"/client/:id": {
					ssg: true,
					name: "discover-client",
					component: ({ id }) =>
						keyed(
							id,
							html\`<mcp-artifact-detail .data-query=\${{ model: "clients", id: decodeURIComponent(id), key: "artifact" }} type="client"></mcp-artifact-detail>\`,
						),
					title: "Discover: Client",
				},
				"/discussions": {
					name: "discover-discussions",
					component: () => html\`<discover-discussions></discover-discussions>\`,
					title: "Discover: Discussions",
				},
			},
		},
		"/dev": {
			name: "dev",
			component: () => html\`<mcp-dev></mcp-dev>\`,
			title: "Develop",
			template: "template-app",
		},
		"/chat": {
			name: "chat",
			component: () => html\`<mcp-chat></mcp-chat>\`,
			title: "Chat",
			template: "template-app",
		},
		"/inspector": {
			name: "inspector",
			component: () => html\`<mcp-inspector></mcp-inspector>\`,
			title: "Inspector",
			template: "template-app",
		},
		"/local-servers": {
			name: "servers",
			component: () => html\`<mcp-servers></mcp-servers>\`,
			title: "Servers",
			template: "template-app",
		},
		"/apps": {
			name: "apps",
			component: () => html\`<mcp-apps></mcp-apps>\`,
			title: "Apps",
			template: "template-app",
		},
		"/learn": {
			name: "learn",
			component: () => html\`<mcp-learn></mcp-learn>\`,
			title: "Learn",
			template: "template-app",
		},
		"/vibecoding": {
			name: "vibecoding",
			component: () => html\`<mcp-vibecoding></mcp-vibecoding>\`,
			title: "Vibecoding",
			template: "template-app",
		},
		"/github": {
			name: "github-callback",
			component: () => html\`<view-github-callback></view-github-callback>\`,
			title: "GitHub Authentication",
			template: "template-app",
		},
	};

	$APP.routes.set(routes);
};
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
	providersPlugin: "/modules/ai/plugins/core/providers.js", // New providers plugin
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
	providersPlugin, // Import new plugin
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
					generationConfig: { temperature: 0.7, max_tokens: 2048 },
					...initialConfig,
				};

				// Initialize providers first
				const providerApi = this.plugin("providers");
				if (providerApi && initialConfig.providers) {
					initialConfig.providers.forEach((p) => providerApi.addProvider(p));
				}

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
		providersPlugin, // Add new plugin to the host
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
					if (!module.default && !module.server) {
						throw new Error(
							\`Module \${transportConfig.command} does not have a default export function.\`,
						);
					}
					server = module.server
						? module.server({
								...$APP,
								$APP,
								host,
								config,
								...transportConfig.args,
							})
						: module.default;

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
				{
					id: "react-agent",
					name: "ReAct Agent",
					description:
						"Reasoning and Acting agent that alternates between thinking and taking actions. Implements the ReAct pattern for systematic problem-solving.",
					path: "/templates/servers/react-agent.js",
					tags: ["AI Reasoning", "Agent", "Official", "Advanced"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-2-2l-4.2-4.2"></path></svg>\`,
				},
				{
					id: "chain-of-thought",
					name: "Chain-of-Thought Reasoner",
					description:
						"Step-by-step reasoning framework that breaks down complex problems into logical sequences. Perfect for mathematical and analytical tasks.",
					path: "/templates/servers/cot-reasoner.js",
					tags: ["AI Reasoning", "Logic", "Official", "Advanced"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>\`,
				},
				{
					id: "tree-of-thoughts",
					name: "Tree-of-Thoughts Explorer",
					description:
						"Explores multiple reasoning paths simultaneously, evaluates them, and selects the best solution. Ideal for complex decision-making.",
					path: "/templates/servers/tot-explorer.js",
					tags: ["AI Reasoning", "Decision Making", "Official", "Advanced"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6m0 0l-3-3m3 3l3-3M12 8v8m0 0l-3 3m3-3l3 3M6 8l-3 3 3 3m12-6l3 3-3 3"></path></svg>\`,
				},
				{
					id: "reflexion-agent",
					name: "Reflexion Agent",
					description:
						"Self-reflective agent that learns from mistakes, maintains memory of past attempts, and improves over iterations.",
					path: "/templates/servers/reflexion-agent.js",
					tags: ["AI Reasoning", "Learning", "Agent", "Advanced"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>\`,
				},
				{
					id: "plan-and-solve",
					name: "Plan-and-Solve Agent",
					description:
						"Creates detailed execution plans before solving problems. Separates planning from execution for better results.",
					path: "/templates/servers/plan-solve-agent.js",
					tags: ["AI Reasoning", "Planning", "Agent", "Advanced"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"></path><path d="M6 9.01V9"></path><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"></path></svg>\`,
				},
				{
					id: "self-consistency",
					name: "Self-Consistency Reasoner",
					description:
						"Generates multiple reasoning paths and uses majority voting to find the most consistent answer. Great for verification.",
					path: "/templates/servers/self-consistency.js",
					tags: ["AI Reasoning", "Verification", "Advanced"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>\`,
				},
				{
					id: "metacognitive-controller",
					name: "Metacognitive Controller",
					description:
						"Monitors and controls its own thinking process. Decides which reasoning strategy to use based on the problem type.",
					path: "/templates/servers/metacognitive-controller.js",
					tags: ["AI Reasoning", "Meta", "Advanced", "Controller"],
					icon: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>\`,
				},
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/core/providers.js":{content:`// --- Google Gemini Provider ---
const adaptMessageToGemini = (msg) => {
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

async function* streamGeminiAPI({
	model,
	provider,
	messages,
	generationConfig,
	tools,
}) {
	const API_ENDPOINT = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:streamGenerateContent?key=\${provider.apiKey}&alt=sse\`;
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
			\`Gemini Streaming API Error: \${
				errorBody.error?.message || response.statusText
			}\`,
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

async function* processStreamGemini(stream) {
	const finalToolCalls = [];
	for await (const chunk of stream) {
		const candidate = chunk.candidates?.[0];
		if (!candidate?.content?.parts?.[0]) continue;
		let content = "";
		for (const part of candidate.content.parts) {
			if (part.text) {
				content += part.text;
			}
			if (part.functionCall) {
				finalToolCalls.push({
					id: part.functionCall.name,
					name: part.functionCall.name,
					arguments: part.functionCall.args,
				});
			}
		}
		if (content) {
			yield { type: "content", content: content };
		}
	}
	const hasToolCalls = finalToolCalls.length > 0;
	if (hasToolCalls) {
		yield { type: "tool_calls", toolCalls: finalToolCalls };
	}
	const finishReason = hasToolCalls ? "tool_calls" : "stop";
	yield { type: "finish_reason", reason: finishReason };
}

const googleProvider = {
	type: "google",
	adaptMessages: adaptMessagesToGemini,
	adaptTools: (tools) => tools.map(adaptMcpToolToGemini),
	adaptResponse: adaptGeminiResponseToCommon,
	streamAPI: streamGeminiAPI,
	processStream: processStreamGemini,
};

const adaptMessageToOpenAI = (msg) => {
	console.error({ msg });
	if (msg.role === "tool") {
		const result = msg.structuredContent?.result || msg.result || msg.content;
		return {
			role: "tool",
			tool_call_id: msg.toolCallId,
			content: typeof result === "string" ? result : JSON.stringify(result),
		};
	}
	if (msg.toolCalls?.length) {
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
		console.error({
			role: msg.role,
			content: Array.isArray(msg.content)
				? msg.content.map((c) => c.text || c).join("\\n")
				: msg.content,
		});
		return {
			role: msg.role,
			content: Array.isArray(msg.content)
				? msg.content.map((c) => c.text || c).join("\\n")
				: msg.content,
		};
	}
	return { role: "user", content: "" };
};
const adaptMessagesToOpenAI = (messages = []) =>
	messages.map(adaptMessageToOpenAI);

const adaptOpenAIResponseToCommon = (openAIResponse) => {
	const choice = openAIResponse.choices?.[0];
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
const adaptMcpToolToOpenAI = (mcpTool) => ({
	type: "function",
	function: {
		name: mcpTool.name.replace(/\\//g, "__"),
		description: mcpTool.description,
		parameters: mcpTool.inputSchema,
	},
});
async function* streamOpenAIAPI({
	endpoint,
	config,
	provider,
	model,
	messages,
	generationConfig,
	tools,
}) {
	const payload = {
		model,
		messages,
		...generationConfig,
		...(tools?.length > 0 && { tools }),
		stream: true,
	};
	console.error({ provider, config });
	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(provider.apiKey && { Authorization: \`Bearer \${provider.apiKey}\` }),
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errorBody = await response
			.json()
			.catch(() => ({ error: { message: "Failed to parse error." } }));
		throw new Error(
			\`OpenAI-compatible API Error: \${
				errorBody.error?.message || response.statusText
			}\`,
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

async function* processStreamOpenAI(stream) {
	const toolCallChunks = {};
	let finishReason = null;
	for await (const chunk of stream) {
		const choice = chunk.choices?.[0];
		if (!choice) continue;
		const { delta } = choice;
		if (delta?.content) {
			yield { type: "content", content: delta.content };
		}
		if (delta?.tool_calls) {
			for (const toolCallDelta of delta.tool_calls) {
				const { index } = toolCallDelta;
				if (!toolCallChunks[index]) {
					toolCallChunks[index] = {
						id: "",
						type: "function",
						function: { name: "", arguments: "" },
					};
				}
				const current = toolCallChunks[index];
				if (toolCallDelta.id) current.id = toolCallDelta.id;
				if (toolCallDelta.function?.name)
					current.function.name += toolCallDelta.function.name;
				if (toolCallDelta.function?.arguments)
					current.function.arguments += toolCallDelta.function.arguments;
			}
		}
		if (choice.finish_reason) {
			finishReason = choice.finish_reason;
		}
	}
	if (finishReason === "tool_calls") {
		const finalToolCalls = Object.values(toolCallChunks).map((tc) => ({
			id: tc.id,
			name: tc.function.name,
			arguments: JSON.parse(tc.function.arguments || "{}"),
		}));
		yield { type: "tool_calls", toolCalls: finalToolCalls };
	}
	yield { type: "finish_reason", reason: finishReason };
}

const openRouterProvider = {
	type: "openrouter",
	endpoint: "https://openrouter.ai/api/v1/chat/completions",
	adaptMessages: adaptMessagesToOpenAI,
	adaptTools: (tools) => tools.map(adaptMcpToolToOpenAI),
	adaptResponse: adaptOpenAIResponseToCommon,
	streamAPI: (opts) =>
		streamOpenAIAPI({ ...opts, endpoint: openRouterProvider.endpoint }),
	processStream: processStreamOpenAI,
};

const localAIProvider = {
	type: "local",
	endpoint: "http://localhost:1234/v1/chat/completions",
	adaptMessages: adaptMessagesToOpenAI,
	adaptTools: (tools) => tools.map(adaptMcpToolToOpenAI),
	adaptResponse: adaptOpenAIResponseToCommon,
	streamAPI: (opts) =>
		streamOpenAIAPI({
			...opts,
			endpoint: opts.provider.endpoint ?? opts.config.endpoint,
		}),
	processStream: processStreamOpenAI,
};

// --- Main Providers Plugin ---
const providerImplementations = {
	google: googleProvider,
	openrouter: openRouterProvider,
	local: localAIProvider,
};

export default () => {
	const providers = new Map();
	return {
		name: "providers",
		initialize() {
			this.api.addProvider = (config) => {
				if (!config.type || !providerImplementations[config.type]) {
					throw new Error(\`Invalid provider type: \${config.type}\`);
				}
				if (providers.has(config.type)) {
					console.warn(
						\`Provider of type "\${config.type}" is already configured. It will be overwritten.\`,
					);
				}
				providers.set(config.type, {
					...providerImplementations[config.type],
					...config,
				});
				console.log(\`Provider of type "\${config.type}" added.\`);
			};

			this.api.clearProviders = () => {
				providers.clear();
			};

			this.api.getProvider = (providerId) => {
				const provider = providers.get(providerId);
				if (provider) return provider;
				if (providerImplementations[providerId]) {
					return providerImplementations[providerId];
				}
				throw new Error(\`No provider found for "\${providerId}"\`);
			};

			this.api.listProviders = () => {
				return Array.from(providers.values()).map(
					({
						adaptMessages,
						adaptTools,
						adaptResponse,
						streamAPI,
						processStream,
						...rest
					}) => rest,
				);
			};

			this.api.getModels = async () => {
				let allModels = [];
				for (const [type, impl] of Object.entries(providerImplementations)) {
					const providerModels = impl.models.map((m) => ({
						...m,
						id: \`\${type}/\${m.id.split("/").pop()}\`,
					}));
					allModels = allModels.concat(providerModels);
				}
				return allModels;
			};
		},
		api: {},
	};
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/ai/plugins/chat.js":{content:`export default () => ({
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

		const providersApi = host.plugin("providers");
		if (!providersApi)
			throw new Error("Chat plugin requires the Providers plugin.");

		const createStreamChatHandler = async function* (messages, options) {
			const currentMessages = [...messages];
			const {
				enabledTools = [],
				model,
				provider,
				...generationConfig
			} = options;

			if (!provider)
				throw new Error("A 'provider' must be specified in chat options.");
			if (!model)
				throw new Error("A 'model' must be specified in chat options.");
			const adapter = providersApi.getProvider(provider.id);
			if (!adapter)
				throw new Error(\`Could not find a provider for model \${model}\`);

			const toolAliases = Array.from(host.clients.keys());
			const { tools: mcpTools } = await toolsApi.listTools({
				servers: toolAliases.filter((alias) =>
					enabledTools.some(
						(toolName) => host.toolToAliasMap.get(toolName) === alias,
					),
				),
			});

			const adaptedTools = adapter.adaptTools(
				mcpTools.filter((t) => enabledTools.includes(t.name)),
			);
			const adaptedMessages = adapter.adaptMessages(currentMessages);
			const modelName = model.substring(model.indexOf("/") + 1);
			console.warn({ currentMessages, adaptedMessages });
			const stream = adapter.streamAPI({
				config: adapter,
				provider: options.provider,
				model: modelName,
				messages: adaptedMessages,
				generationConfig,
				tools: adaptedTools,
			});
			const processedStream = adapter.processStream(stream);
			let fullContent = "";
			let finalToolCalls = [];
			let finishReason = null;
			for await (const chunk of processedStream) {
				switch (chunk.type) {
					case "content":
						fullContent += chunk.content;
						yield { type: "content", content: fullContent, isComplete: false };
						break;
					case "tool_calls":
						finalToolCalls = chunk.toolCalls;
						break;
					case "finish_reason":
						finishReason = chunk.reason;
						break;
				}
			}

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
				for await (const finalChunk of createStreamChatHandler(
					currentMessages,
					options,
				)) {
					yield finalChunk;
				}
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
			if (stream) return createStreamChatHandler(messages, restOptions);

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
	//cms: "/modules/apps/cms/index.js",
	//drive: "/modules/apps/drive/index.js",
	//project: "/modules/apps/project/index.js",
	//IDE: "/modules/apps/ide/index.js",
	//editor: "/modules/apps/editor/index.js",
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
							.data-query=\${{ model: "tasks", key: "rows" }} 
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
				"code",
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
				"seo",
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
				if (commsPort)
					commsPort.postMessage({
						eventId: data.eventId,
						payload: responsePayload,
						connection: data.connection,
					});
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
	async loadApp(production) {
		try {
			const response = await fetch("/package.json");
			if (!response.ok)
				throw new Error(\`HTTP error! status: \${response.status}\`);
			const packageConfig = await response.json();
			await this.bootstrap(packageConfig, production);
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
		production = false,
	) {
		this.settings.set({
			...settings,
			backend,
			frontend: !backend,
			production,
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

const typesHelpers = {
	createType,
	stringToType,
	validateType,
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
			if (connectionPromise) {
				await connectionPromise;
			}
			close();
			dbVersion = props.version;
			models = props.models;
			$APP.Backend.broadcast({
				type: "UPDATE_MODELS",
				payload: { models },
			});
			return init();
		};

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

		const matchesFilter = (item, where, modelName) => {
			const modelSchema = models[modelName];
			return Object.entries(where).every(([key, queryValue]) => {
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
							case "$includes":
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

		const findIndexedProperty = (where, modelName) => {
			const modelSchema = models[modelName];
			if (!modelSchema || typeof where !== "object" || where === null)
				return null;
			for (const key in where) {
				if (Object.hasOwn(where, key)) {
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
			{ where = {}, limit = 0, offset = 0, order = null, keys } = {},
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
					if (Array.isArray(where)) {
						const request = store.openCursor();
						request.onerror = () =>
							reject(
								new Error(\`Failed to getMany \${storeName}: \${request.error}\`),
							);
						request.onsuccess = (event) => {
							const cursor = event.target.result;
							if (cursor) {
								if (
									where.includes(cursor.key) &&
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
					const indexedProp = findIndexedProperty(where, storeName);
					if (indexedProp && Object.keys(where).length > 0) {
						let queryValue = where[indexedProp];
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
							if (matchesFilter(cursor.value, where, storeName)) {
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
							\`Failed to start transaction: \${error.message}. Query Props: \${JSON.stringify({ storeName, limit, offset, where, order, keys })}\`,
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

		const count = async (storeName, { where = {} } = {}) => {
			await _ensureDb();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, "readonly");
				const store = transaction.objectStore(storeName);
				if (Object.keys(where).length === 0) {
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
							if (matchesFilter(cursor.value, where, storeName)) {
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
			if (includes)
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
							if (!idsToFetchByModel[model])
								idsToFetchByModel[model] = new Set();
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
					const items = await api.getMany(modelToFetch, { where: ids });
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
						let where;
						if (polymorphic) {
							const searchPolymorphicId = \`\${modelName}@\${row.id}\`;
							const targetFkDef =
								models[targetModel]?.[relationDef.targetForeignKey];
							if (targetFkDef?.many) {
								where = {
									[relationDef.targetForeignKey]: {
										$contains: searchPolymorphicId,
									},
								};
							} else {
								where = {
									[relationDef.targetForeignKey]: searchPolymorphicId,
								};
							}
						} else {
							where = { [relationDef.targetForeignKey]: row.id };
						}
						row[relation] =
							relationDef.relationship === "one"
								? await api.get(targetModel, { where })
								: await api.getMany(targetModel, { where });
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
									const targets = await api.getMany(prop.targetModel, {
										where: fks.map((fk) =>
											fk && typeof fk === "object" ? fk.id : fk,
										),
									});
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
			async get(model, idOrOptions, options = {}) {
				const hasId = typeof idOrOptions !== "object";
				const id = hasId ? idOrOptions : null;
				const opts = hasId ? options : idOrOptions;
				const { where, insert = false, includes = [], recursive = null } = opts;
				let row = await db.get(model, id ?? { where });
				if (!row && !insert) return null;
				if (!row && insert) {
					const [error, newRow] = await api.add(
						model,
						typeof where === "object" ? where : { id: where },
						{
							skipRelationship: true,
							...(typeof where !== "object" && {
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
			async getMany(model, opts = {}) {
				const {
					limit,
					offset,
					where,
					order,
					includes = [],
					recursive = null,
				} = opts;
				const items = await db.getMany(model, { where, limit, offset, order });
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

				const count = await db.count(model, { where });
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

							const targetsToUpdate = await api.getMany(targetModelName, {
								where: filterForTargets,
							});

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
			async removeMany(model, where, opts = {}) {
				if (!where && opts.where) where = opts.where;
				const entries = Array.isArray(where)
					? where.map((item) => (typeof item === "object" ? item.id : item))
					: (await db.getMany(model, { where })).map((entry) => entry.id);
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
					currentRow: _opts.currentRow ?? (await api.get(model, row.id)),
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
			async editAll(model, updates, opts = {}) {
				const rows = await db.getMany(model, opts);
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
					(opts.where &&
						((typeof opts.where === "string" && JSON.parse(opts.where)) ||
							opts.where)),
				opts,
			);
			respond(response);
		},
		GET_MANY: async ({ payload: { model, opts = {} }, respond } = {}) => {
			const response = await Database.getMany(model, opts);
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
						where: prop.belongs
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
		handler: (where) =>
			Model.request("REMOVE_MANY", modelName, { opts: { where } }),
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
		handler: (where, updates) =>
			Model.request("EDIT_MANY", modelName, { opts: { where, updates } }),
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
										opts: { where: { [propertyKey]: value } },
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

	const migrateData = async (data, opts = {}) => {
		const { skipDynamicCheck = false } = opts;
		data ??= $APP.data;
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
`,mimeType:"application/javascript",skipSW:!1},"/models/migration.js":{content:`export const version = 2;

export default ({ T, $APP }) => {
	$APP.models.set({
		users: {
			name: T.string(),
			avatar: T.string(),
			conversations: T.many("conversations", "user"),
		},
		tags: {
			name: T.string(),
			tagged: T.many("*", "tags", { polymorphic: true }),
		},
		conversations: {
			name: T.string(),
			user: T.belongs("users", "conversations"),
			server: T.belongs("servers", "conversations"),
			messages: T.many("messages", "chat"),
			createdAt: T.string({ index: true }),
		},
		messages: {
			content: T.string(),
			timestamp: T.string({ index: true }),
			role: T.string({ options: ["user", "assistant", "tool"] }),
			toolCalls: T.object(),
			toolCallId: T.string(),
			result: T.object(),
			chat: T.belongs("conversations", "messages"),
		},
		servers: {
			name: T.string(),
			description: T.string(),
			path: T.string(),
			icon: T.string(),
			config: T.object(),
			favorite: T.boolean({ index: true }),
			tags: T.belongs_many("tags", "tagged", { polymorphic: true }),
			hots: T.number({ index: true, default: 0 }),
			commentsCount: T.number({ default: 0 }),
			hotted: T.boolean({ default: false }),
			comments: T.many("comments", "server"),
			capabilities: T.object(),
			transports: T.object(),
			websiteUrl: T.string(),
			_meta: T.object(),
			version: T.string(),
			packages: T.array(),
			remotes: T.array(),
			repository: T.object(),
		},
		clients: {
			name: T.string(),
			description: T.string(),
			icon: T.string(),
			url: T.string(),
			favorite: T.boolean({ index: true }),
			tags: T.belongs_many("tags", "tagged", { polymorphic: true }),
			hots: T.number({ index: true, default: 0 }),
			commentsCount: T.number({ default: 0 }),
			hotted: T.boolean({ default: false }),
			comments: T.many("comments", "client"),
			capabilities: T.object(),
		},
		agents: {
			name: T.string(),
			description: T.string(),
			icon: T.string(),
			favorite: T.boolean({ index: true }),
			tags: T.belongs_many("tags", "tagged", { polymorphic: true }),
			hots: T.number({ index: true, default: 0 }),
			commentsCount: T.number({ default: 0 }),
			hotted: T.boolean({ default: false }),
			comments: T.many("comments", "agent"),
		},
		discussions: {
			title: T.string(),
			category: T.string(),
			icon: T.string(),
			upvotes: T.number({ index: true, default: 0 }),
			comments: T.number({ default: 0 }),
		},
		providers: {
			name: T.string(),
			type: T.string(),
			baseUrl: T.string(),
			apiKey: T.string(),
			active: T.boolean(),
			models: T.many("models", "provider"),
		},
		models: {
			name: T.string(),
			provider: T.belongs("providers", "models"),
		},
		comments: {
			content: T.string(),
			authorName: T.string(),
			authorAvatar: T.string(),
			createdAt: T.string({ index: true }),
			server: T.belongs("servers", "comments"),
			client: T.belongs("clients", "comments"),
			agent: T.belongs("agents", "comments"),
		},
	});

	const data = {
		servers: [
			{
				id: "ai.aliengiraffe/spotdb",
				name: "ai.aliengiraffe/spotdb",
				description:
					"Ephemeral data sandbox for AI workflows with guardrails and security",
				version: "0.1.0",
				packages: [
					{
						registryType: "oci",
						registryBaseUrl: "https://docker.io",
						identifier: "aliengiraffe/spotdb",
						version: "0.1.0",
						transport: {
							type: "stdio",
						},
						environmentVariables: [
							{
								description: "Optional API key for request authentication",
								format: "string",
								isSecret: true,
								name: "X-API-Key",
							},
						],
					},
				],
				repository: {
					url: "https://github.com/aliengiraffe/spotdb",
					source: "github",
				},
				transports: {
					stdio: true,
					sse: false,
					streamableHTTP: false,
				},
			},
		],
		clients: [
			{
				id: "zencoder",
				name: "Zencoder",
				description:
					"Zencoder is a coding agent that's available as an extension for VS Code and JetBrains family of IDEs, meeting developers where they already work. It comes with RepoGrokking (deep contextual codebase understanding), agentic pipeline, and the ability to create and share custom agents.",
				icon: "zap",
				url: "https://zecoder.ai",
				tags: ["coding", "agentic", "ide-integration"],
				favorite: false,
				hots: 0,
				commentsCount: 0,
				hotted: false,
				capabilities: {
					resources: false,
					prompts: false,
					tools: true,
					discovery: false,
					sampling: false,
					roots: false,
					elicitation: false,
				},
			},
		],
		discussions: [
			{
				id: "d1",
				title: "How to optimize the React Agent for complex reasoning?",
				category: "p/agent-react",
				icon: "atom",
				upvotes: 46,
				comments: 8,
			},
			{
				id: "d2",
				title: "New feature idea: Real-time collaboration in Web UI Client",
				category: "p/client-webui",
				icon: "users",
				upvotes: 32,
				comments: 5,
			},
			{
				id: "d3",
				title: "Is the Chain-of-Thought Reasoner production-ready?",
				category: "p/server-cot",
				icon: "workflow",
				upvotes: 19,
				comments: 12,
			},
			{
				id: "d4",
				title: "Showcase: I built a custom data visualizer agent!",
				category: "p/showcase",
				icon: "gem",
				upvotes: 9,
				comments: 2,
			},
			{
				id: "d5",
				title: "Best practices for using the CLI with multiple servers",
				category: "p/client-cli",
				icon: "terminal",
				upvotes: 6,
				comments: 4,
			},
		],
		comments: [
			{
				id: "comment-1",
				content:
					"This server is incredibly versatile! The built-in tools are a huge time-saver for my development workflow.",
				authorName: "Alex Johnson",
				authorAvatar: "https://i.pravatar.cc/40?u=alex-j",
				createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
				server: "default-feature-rich",
			},
			{
				id: "comment-2",
				content:
					"I agree, the documentation is also very clear. Had it up and running in minutes.",
				authorName: "Samantha Lee",
				authorAvatar: "https://i.pravatar.cc/40?u=samantha-l",
				createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
				server: "default-feature-rich",
			},
			{
				id: "comment-3",
				content:
					"Is there a plan to add more data analysis tools? Would be a great addition.",
				authorName: "David Chen",
				authorAvatar: "https://i.pravatar.cc/40?u=david-c",
				createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
				server: "default-feature-rich",
			},
			{
				id: "comment-4",
				content:
					"The CLI is solid, but a GUI for managing scripts would be awesome for less technical team members.",
				authorName: "Maria Garcia",
				authorAvatar: "https://i.pravatar.cc/40?u=maria-g",
				createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				client: "command-line-interface", // This would need to be updated to a new ID if 'client-2' is removed
			},
		],
		users: [
			{
				id: "user",
				name: "You",
				avatar: "https://i.pravatar.cc/40?u=user-1",
			},
			{
				id: "assistant",
				name: "Assistant",
				avatar: "https://i.pravatar.cc/40?u=assistant",
			},
		],
		providers: [
			{
				id: "local",
				name: "Local",
				type: "local",
				baseUrl: "http://localhost:1234/v1/chat/completions",
			},
			{
				id: "google",
				name: "Google",
				type: "google",
			},
			{
				id: "openrouter",
				name: "OpenRouter",
				type: "openrouter",
				baseUrl: "https://openrouter.ai/api/v1",
			},
		],
		models: [
			{
				id: "google/gemini-2.5-pro",
				name: "Gemini 2.5 Pro",
				provider: "google",
			},
			{
				id: "google/gemini-2.5-flash",
				name: "Gemini 2.5 Flash",
				provider: "google",
			},
			{
				id: "openrouter/anthropic/claude-3.5-haiku",
				name: "Claude 3.5 Haiku",
				provider: "openrouter",
			},
			{
				id: "openrouter/openai/gpt-4o",
				name: "GPT-4o",
				provider: "openrouter",
			},
			{
				id: "openrouter/mistralai/mistral-large",
				name: "Mistral Large",
				provider: "openrouter",
			},
			{
				id: "openrouter/qwen/qwen2-72b-instruct",
				name: "Qwen 2 72B",
				provider: "openrouter",
			},
			{ id: "local/local-model", name: "Local Model", provider: "local" },
		],
	};

	$APP.data.set(data);
};
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
`,mimeType:"text/css",skipSW:!1},"/modules/app/container.js":{content:`export default ({ routes, T }) => ({
	tag: "app-container",
	class: "flex flex-grow",
	extends: "router-ui",
	properties: {
		routes: T.object({ defaultValue: routes }),
		full: T.boolean(true),
	},
});
`,mimeType:"application/javascript",skipSW:!1},"/modules/router/ui.js":{content:`export default ({ html, T }) => ({
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/utility/darkmode.js":{content:`export default ({ T }) => ({
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
			row: T.object(),
		},
		render() {
			if (!this.row)
				return html\`<div class="text-center p-4">Loading credentials...</div>\`;

			return html\`
      <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">
        GitHub Credentials
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <uix-input
          label="Owner"
          .value=\${this.row.owner}
          @change=\${(e) => (this.row.owner = e.target.value)}
        ></uix-input>
        <uix-input
          label="Repository"
          .value=\${this.row.repo}
          @change=\${(e) => (this.row.repo = e.target.value)}
        ></uix-input>
        <uix-input
          label="Branch"
          .value=\${this.row.branch}
          @change=\${(e) => (this.row.branch = e.target.value)}
        ></uix-input>
        <uix-input
          label="GitHub Token"
          type="password"
          .value=\${this.row.token}
          @change=\${(e) => (this.row.token = e.target.value)}
        ></uix-input>
      </div>
      <div class="flex justify-end">
        <uix-button
          @click=\${() => $APP.Model.credentials.edit({ ...this.row })}
          label="Save Credentials"
        ></uix-button>
      </div>
    \`;
		},
	});

	$APP.define("cloudflare-credentials-manager", {
		class: "flex flex-col gap-4 p-4 border rounded-lg shadow-md bg-white",
		properties: {
			row: T.object(),
		},
		render() {
			if (!this.row)
				return html\`<div class="text-center p-4">Loading credentials...</div>\`;
			if (!this.row.cloudflare) this.row.cloudflare = {};
			return html\`
                <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">
                    Cloudflare Credentials
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <uix-input
                        label="Account ID"
                        .value=\${this.row.cloudflare.accountId}
                        @change=\${(e) => (this.row.cloudflare.accountId = e.target.value)}
                    ></uix-input>
                    <uix-input
                        label="Project Name"
                        .value=\${this.row.cloudflare.projectName}
                        @change=\${(e) => (this.row.cloudflare.projectName = e.target.value)}
                    ></uix-input>
                    <uix-input
                        class="md:col-span-2"
                        label="API Token"
                        type="password"
                        .value=\${this.row.cloudflare.apiToken}
                        @change=\${(e) => (this.row.cloudflare.apiToken = e.target.value)}
                    ></uix-input>
                </div>
                <div class="flex justify-end">
                    <uix-button
                        @click=\${() => $APP.Model.credentials.edit({ ...this.row, cloudflare: this.row.cloudflare })}
                        label="Save Cloudflare Credentials"
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
			deployMode: T.string("hybrid"), // Default to hybrid
			isDeploying: T.boolean(false),
		},
		async handleDeploy() {
			if (this.isDeploying) return;

			this.isDeploying = true;
			const credentials = await $APP.Model.credentials.get("singleton");

			if (this.deployMode === "worker") {
				if (
					!credentials?.cloudflare?.apiToken ||
					!credentials?.cloudflare?.accountId ||
					!credentials?.cloudflare?.projectName
				) {
					alert(
						"Please provide all Cloudflare credentials before deploying a worker.",
					);
					this.isDeploying = false;
					return;
				}
			} else {
				if (!credentials || !credentials.token) {
					alert("Please provide a GitHub token before deploying.");
					this.isDeploying = false;
					return;
				}
			}

			let newRelease;
			try {
				newRelease = await $APP.Model.releases.add({
					version: this.version,
					notes: this.notes,
					status: "pending",
					deployedAt: new Date(),
					deployType: this.deployMode,
				});

				// Using the new unified deploy method
				const files = await Bundler.deploy({
					...credentials,
					mode: this.deployMode,
				});

				await $APP.Model.releases.edit({
					...newRelease,
					status: "success",
					files,
				});

				alert(\`Deployment (\${this.deployMode.toUpperCase()}) successful!\`);
			} catch (error) {
				console.error(
					\`Deployment failed for \${this.deployMode.toUpperCase()}:\`,
					error,
				);
				alert(\`Deployment failed: \${error.message}\`);
				if (newRelease?._id) {
					await $APP.Model.releases.edit({
						...newRelease,
						status: "failed",
					});
				}
			} finally {
				this.isDeploying = false;
			}
		},
		render() {
			return html\`
                <h2 class="text-2xl font-bold text-gray-800 border-b pb-2">New Release</h2>
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
                
                    <uix-input
                        class="md:col-span-2"
                        type="checkbox"
                        label="Obfuscate"
                        ?checked=\${!!$APP.settings.obfuscate}
                        @change=\${(e) => ($APP.settings.obfuscate = e.target.checked)}
                    ></uix-input>
                <div class="flex items-center justify-end gap-2">
                    <uix-input
                        type="select" 
                        label="Deployment Mode"
                        .value=\${this.deployMode}
                        @change=\${(e) => (this.deployMode = e.target.value)}
                        .options=\${[
													{ value: "spa", label: "SPA" },
													{ value: "ssg", label: "SSG" },
													{ value: "hybrid", label: "Hybrid" },
													{ value: "worker", label: "Worker" },
												]}
                    >
                    </uix-input>
                    <uix-button
                        @click=\${() => this.handleDeploy()}
                        label=\${this.isDeploying ? \`Deploying \${this.deployMode.toUpperCase()}...\` : "Deploy"}
                        ?disabled=\${this.isDeploying}
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
			rows: T.array(),
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
					this.rows && this.rows.length > 0
						? this.rows
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
                        label="Emoji Icon"
                        .value=\${this._settings.emojiIcon}
                        @change=\${(e) => (this._settings.emojiIcon = e.target.value)}
                    ></uix-input>
                    <uix-input
                        label="Icon"
                        .value=\${this._settings.icon}
                        @change=\${(e) => (this._settings.icon = e.target.value)}
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
                            .data-query=\${{ model: "credentials", id: "singleton", key: "row" }}
                        ></credentials-manager>
                        <cloudflare-credentials-manager
                            .data-query=\${{ model: "credentials", id: "singleton", key: "row" }}
                        ></cloudflare-credentials-manager>
                    </div>

                    <div class="flex flex-col gap-6">
                        <release-creator></release-creator>
                    <release-history
                        .data-query=\${{ model: "releases", order: "-deployedAt", key: "rows" }}
                    ></release-history>
                </div>
                </div>
            \`;
		},
	};
};
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
		if (this.context)
			this.addEventListener("contextmenu", this.handleContextMenu);
	},
	disconnected() {
		this.removeEventListener("contextmenu", this.handleContextMenu);
		this._removeGlobalListeners();
	},
	_addGlobalListeners() {
		setTimeout(() => {
			document.addEventListener("click", this.boundHandleOutsideClick);
			document.addEventListener("keydown", this.boundHandleEscKey);
		}, 0);
	},
	_removeGlobalListeners() {
		document.removeEventListener("click", this.boundHandleOutsideClick);
		document.removeEventListener("keydown", this.boundHandleEscKey);
	},
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/layout/list.css":{content:`.uix-list {
	display: flex;
	&[vertical] {
		flex-direction: column;
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/uix/navigation/navbar.css":{content:`.uix-navbar {
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
`,mimeType:"text/css",skipSW:!1},"/modules/uix/display/button.css":{content:`:where(.uix-button) {
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
`,mimeType:"text/css",skipSW:!1},"/modules/uix/display/icon.js":{content:`export default ({ T, html, $APP, Icons, theme }) => ({
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
`,mimeType:"application/javascript",skipSW:!1},"/modules/uix/form/input.css":{content:`:where(.uix-input) {
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
`,mimeType:"text/css",skipSW:!1},"/modules/uix/display/icon.css":{content:`:where(.uix-icon) {
	display: inline-block;
	vertical-align: middle;
	width: 1rem;
	height: 1rem;
	svg {
		height: inherit;
		width: inherit;
	}

	&[solid] {
		stroke: currentColor;
		fill: currentColor;
	}
}
`,mimeType:"text/css",skipSW:!1},"/modules/icon-lucide/lucide/square-mouse-pointer.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/cog.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16"/><path d="M12 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4m0-12v2m0 18v-2m5 .66l-1-1.73m-5-8.66L7 3.34M20.66 17l-1.73-1M3.34 7l1.73 1M14 12h8M2 12h2m16.66-5l-1.73 1M3.34 17l1.73-1M17 3.34l-1 1.73m-5 8.66l-4 6.93"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/bot-message-square.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V2H8m0 16l-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Zm-6-6h2m5-1v2m6-2v2m5-1h2"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/server-cog.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5m-15 4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5M6 6h.01M6 18h.01m9.69-4.6l-.9-.3m-5.6-2.2l-.9-.3m2.3 5.1l.3-.9m2.7.9l-.4-1m-2.4-5.4l-.4-1m-2.1 5.3l1-.4m5.4-2.4l1-.4m-2.3-2.1l-.3.9"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/settings.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/sun.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></g></svg>',mimeType:"image/svg+xml",skipSW:!1},"/modules/icon-lucide/lucide/chevron-down.svg":{content:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/></svg>',mimeType:"image/svg+xml",skipSW:!1},"/style.css":{content:`@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_P-bnBeA.woff2) format("woff2");unicode-range:U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_G-bnBeA.woff2) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_B-bnBeA.woff2) format("woff2");unicode-range:U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_N-bnBeA.woff2) format("woff2");unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_M-bnBeA.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Manrope;font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FN_C-bk.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--un-bg-opacity:100%;--un-text-opacity:100%;--un-border-opacity:100%;--un-translate-x:initial;--un-translate-y:initial;--un-translate-z:initial;--un-leading:initial;--un-space-x-reverse:initial;--un-space-y-reverse:initial;--un-ring-opacity:100%;--un-placeholder-opacity:100%}}@property --un-text-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-leading{syntax:"*";inherits:false;}@property --un-border-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-bg-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-ring-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-inset-ring-color{syntax:"*";inherits:false;}@property --un-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-inset-shadow-color{syntax:"*";inherits:false;}@property --un-ring-color{syntax:"*";inherits:false;}@property --un-ring-inset{syntax:"*";inherits:false;}@property --un-ring-offset-color{syntax:"*";inherits:false;}@property --un-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0px;}@property --un-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000;}@property --un-shadow-color{syntax:"*";inherits:false;}@property --un-translate-x{syntax:"*";inherits:false;initial-value:0;}@property --un-translate-y{syntax:"*";inherits:false;initial-value:0;}@property --un-translate-z{syntax:"*";inherits:false;initial-value:0;}@property --un-placeholder-opacity{syntax:"<percentage>";inherits:false;initial-value:100%;}@property --un-space-x-reverse{syntax:"*";inherits:false;initial-value:0;}@property --un-space-y-reverse{syntax:"*";inherits:false;initial-value:0;}:root,:host{--spacing: .25rem;--font-sans: "Manrope",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-serif: ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;--font-mono: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;--font-icon-family: lucide;--colors-black: #000;--colors-white: #fff;--colors-slate-50: oklch(98.4% .003 247.858);--colors-slate-100: oklch(96.8% .007 247.896);--colors-slate-200: oklch(92.9% .013 255.508);--colors-slate-300: oklch(86.9% .022 252.894);--colors-slate-400: oklch(70.4% .04 256.788);--colors-slate-500: oklch(55.4% .046 257.417);--colors-slate-600: oklch(44.6% .043 257.281);--colors-slate-700: oklch(37.2% .044 257.287);--colors-slate-800: oklch(27.9% .041 260.031);--colors-slate-900: oklch(20.8% .042 265.755);--colors-slate-950: oklch(12.9% .042 264.695);--colors-slate-DEFAULT: oklch(70.4% .04 256.788);--colors-gray-50: oklch(98.5% .002 247.839);--colors-gray-100: oklch(96.7% .003 264.542);--colors-gray-200: oklch(92.8% .006 264.531);--colors-gray-300: oklch(87.2% .01 258.338);--colors-gray-400: oklch(70.7% .022 261.325);--colors-gray-500: oklch(55.1% .027 264.364);--colors-gray-600: oklch(44.6% .03 256.802);--colors-gray-700: oklch(37.3% .034 259.733);--colors-gray-800: oklch(27.8% .033 256.848);--colors-gray-900: oklch(21% .034 264.665);--colors-gray-950: oklch(13% .028 261.692);--colors-gray-DEFAULT: oklch(70.7% .022 261.325);--colors-zinc-50: oklch(98.5% 0 0);--colors-zinc-100: oklch(96.7% .001 286.375);--colors-zinc-200: oklch(92% .004 286.32);--colors-zinc-300: oklch(87.1% .006 286.286);--colors-zinc-400: oklch(70.5% .015 286.067);--colors-zinc-500: oklch(55.2% .016 285.938);--colors-zinc-600: oklch(44.2% .017 285.786);--colors-zinc-700: oklch(37% .013 285.805);--colors-zinc-800: oklch(27.4% .006 286.033);--colors-zinc-900: oklch(21% .006 285.885);--colors-zinc-950: oklch(14.1% .005 285.823);--colors-zinc-DEFAULT: oklch(70.5% .015 286.067);--colors-neutral-50: oklch(98.5% 0 0);--colors-neutral-100: oklch(97% 0 0);--colors-neutral-200: oklch(92.2% 0 0);--colors-neutral-300: oklch(87% 0 0);--colors-neutral-400: oklch(70.8% 0 0);--colors-neutral-500: oklch(55.6% 0 0);--colors-neutral-600: oklch(43.9% 0 0);--colors-neutral-700: oklch(37.1% 0 0);--colors-neutral-800: oklch(26.9% 0 0);--colors-neutral-900: oklch(20.5% 0 0);--colors-neutral-950: oklch(14.5% 0 0);--colors-neutral-DEFAULT: oklch(70.8% 0 0);--colors-stone-50: oklch(98.5% .001 106.423);--colors-stone-100: oklch(97% .001 106.424);--colors-stone-200: oklch(92.3% .003 48.717);--colors-stone-300: oklch(86.9% .005 56.366);--colors-stone-400: oklch(70.9% .01 56.259);--colors-stone-500: oklch(55.3% .013 58.071);--colors-stone-600: oklch(44.4% .011 73.639);--colors-stone-700: oklch(37.4% .01 67.558);--colors-stone-800: oklch(26.8% .007 34.298);--colors-stone-900: oklch(21.6% .006 56.043);--colors-stone-950: oklch(14.7% .004 49.25);--colors-stone-DEFAULT: oklch(70.9% .01 56.259);--colors-red-50: oklch(97.1% .013 17.38);--colors-red-100: oklch(93.6% .032 17.717);--colors-red-200: oklch(88.5% .062 18.334);--colors-red-300: oklch(80.8% .114 19.571);--colors-red-400: oklch(70.4% .191 22.216);--colors-red-500: oklch(63.7% .237 25.331);--colors-red-600: oklch(57.7% .245 27.325);--colors-red-700: oklch(50.5% .213 27.518);--colors-red-800: oklch(44.4% .177 26.899);--colors-red-900: oklch(39.6% .141 25.723);--colors-red-950: oklch(25.8% .092 26.042);--colors-red-DEFAULT: oklch(70.4% .191 22.216);--colors-orange-50: oklch(98% .016 73.684);--colors-orange-100: oklch(95.4% .038 75.164);--colors-orange-200: oklch(90.1% .076 70.697);--colors-orange-300: oklch(83.7% .128 66.29);--colors-orange-400: oklch(75% .183 55.934);--colors-orange-500: oklch(70.5% .213 47.604);--colors-orange-600: oklch(64.6% .222 41.116);--colors-orange-700: oklch(55.3% .195 38.402);--colors-orange-800: oklch(47% .157 37.304);--colors-orange-900: oklch(40.8% .123 38.172);--colors-orange-950: oklch(26.6% .079 36.259);--colors-orange-DEFAULT: oklch(75% .183 55.934);--colors-amber-50: oklch(98.7% .022 95.277);--colors-amber-100: oklch(96.2% .059 95.617);--colors-amber-200: oklch(92.4% .12 95.746);--colors-amber-300: oklch(87.9% .169 91.605);--colors-amber-400: oklch(82.8% .189 84.429);--colors-amber-500: oklch(76.9% .188 70.08);--colors-amber-600: oklch(66.6% .179 58.318);--colors-amber-700: oklch(55.5% .163 48.998);--colors-amber-800: oklch(47.3% .137 46.201);--colors-amber-900: oklch(41.4% .112 45.904);--colors-amber-950: oklch(27.9% .077 45.635);--colors-amber-DEFAULT: oklch(82.8% .189 84.429);--colors-yellow-50: oklch(98.7% .026 102.212);--colors-yellow-100: oklch(97.3% .071 103.193);--colors-yellow-200: oklch(94.5% .129 101.54);--colors-yellow-300: oklch(90.5% .182 98.111);--colors-yellow-400: oklch(85.2% .199 91.936);--colors-yellow-500: oklch(79.5% .184 86.047);--colors-yellow-600: oklch(68.1% .162 75.834);--colors-yellow-700: oklch(55.4% .135 66.442);--colors-yellow-800: oklch(47.6% .114 61.907);--colors-yellow-900: oklch(42.1% .095 57.708);--colors-yellow-950: oklch(28.6% .066 53.813);--colors-yellow-DEFAULT: oklch(85.2% .199 91.936);--colors-lime-50: oklch(98.6% .031 120.757);--colors-lime-100: oklch(96.7% .067 122.328);--colors-lime-200: oklch(93.8% .127 124.321);--colors-lime-300: oklch(89.7% .196 126.665);--colors-lime-400: oklch(84.1% .238 128.85);--colors-lime-500: oklch(76.8% .233 130.85);--colors-lime-600: oklch(64.8% .2 131.684);--colors-lime-700: oklch(53.2% .157 131.589);--colors-lime-800: oklch(45.3% .124 130.933);--colors-lime-900: oklch(40.5% .101 131.063);--colors-lime-950: oklch(27.4% .072 132.109);--colors-lime-DEFAULT: oklch(84.1% .238 128.85);--colors-green-50: oklch(98.2% .018 155.826);--colors-green-100: oklch(96.2% .044 156.743);--colors-green-200: oklch(92.5% .084 155.995);--colors-green-300: oklch(87.1% .15 154.449);--colors-green-400: oklch(79.2% .209 151.711);--colors-green-500: oklch(72.3% .219 149.579);--colors-green-600: oklch(62.7% .194 149.214);--colors-green-700: oklch(52.7% .154 150.069);--colors-green-800: oklch(44.8% .119 151.328);--colors-green-900: oklch(39.3% .095 152.535);--colors-green-950: oklch(26.6% .065 152.934);--colors-green-DEFAULT: oklch(79.2% .209 151.711);--colors-emerald-50: oklch(97.9% .021 166.113);--colors-emerald-100: oklch(95% .052 163.051);--colors-emerald-200: oklch(90.5% .093 164.15);--colors-emerald-300: oklch(84.5% .143 164.978);--colors-emerald-400: oklch(76.5% .177 163.223);--colors-emerald-500: oklch(69.6% .17 162.48);--colors-emerald-600: oklch(59.6% .145 163.225);--colors-emerald-700: oklch(50.8% .118 165.612);--colors-emerald-800: oklch(43.2% .095 166.913);--colors-emerald-900: oklch(37.8% .077 168.94);--colors-emerald-950: oklch(26.2% .051 172.552);--colors-emerald-DEFAULT: oklch(76.5% .177 163.223);--colors-teal-50: oklch(98.4% .014 180.72);--colors-teal-100: oklch(95.3% .051 180.801);--colors-teal-200: oklch(91% .096 180.426);--colors-teal-300: oklch(85.5% .138 181.071);--colors-teal-400: oklch(77.7% .152 181.912);--colors-teal-500: oklch(70.4% .14 182.503);--colors-teal-600: oklch(60% .118 184.704);--colors-teal-700: oklch(51.1% .096 186.391);--colors-teal-800: oklch(43.7% .078 188.216);--colors-teal-900: oklch(38.6% .063 188.416);--colors-teal-950: oklch(27.7% .046 192.524);--colors-teal-DEFAULT: oklch(77.7% .152 181.912);--colors-cyan-50: oklch(98.4% .019 200.873);--colors-cyan-100: oklch(95.6% .045 203.388);--colors-cyan-200: oklch(91.7% .08 205.041);--colors-cyan-300: oklch(86.5% .127 207.078);--colors-cyan-400: oklch(78.9% .154 211.53);--colors-cyan-500: oklch(71.5% .143 215.221);--colors-cyan-600: oklch(60.9% .126 221.723);--colors-cyan-700: oklch(52% .105 223.128);--colors-cyan-800: oklch(45% .085 224.283);--colors-cyan-900: oklch(39.8% .07 227.392);--colors-cyan-950: oklch(30.2% .056 229.695);--colors-cyan-DEFAULT: oklch(78.9% .154 211.53);--colors-sky-50: oklch(97.7% .013 236.62);--colors-sky-100: oklch(95.1% .026 236.824);--colors-sky-200: oklch(90.1% .058 230.902);--colors-sky-300: oklch(82.8% .111 230.318);--colors-sky-400: oklch(74.6% .16 232.661);--colors-sky-500: oklch(68.5% .169 237.323);--colors-sky-600: oklch(58.8% .158 241.966);--colors-sky-700: oklch(50% .134 242.749);--colors-sky-800: oklch(44.3% .11 240.79);--colors-sky-900: oklch(39.1% .09 240.876);--colors-sky-950: oklch(29.3% .066 243.157);--colors-sky-DEFAULT: oklch(74.6% .16 232.661);--colors-blue-50: oklch(97% .014 254.604);--colors-blue-100: oklch(93.2% .032 255.585);--colors-blue-200: oklch(88.2% .059 254.128);--colors-blue-300: oklch(80.9% .105 251.813);--colors-blue-400: oklch(70.7% .165 254.624);--colors-blue-500: oklch(62.3% .214 259.815);--colors-blue-600: oklch(54.6% .245 262.881);--colors-blue-700: oklch(48.8% .243 264.376);--colors-blue-800: oklch(42.4% .199 265.638);--colors-blue-900: oklch(37.9% .146 265.522);--colors-blue-950: oklch(28.2% .091 267.935);--colors-blue-DEFAULT: oklch(70.7% .165 254.624);--colors-indigo-50: oklch(96.2% .018 272.314);--colors-indigo-100: oklch(93% .034 272.788);--colors-indigo-200: oklch(87% .065 274.039);--colors-indigo-300: oklch(78.5% .115 274.713);--colors-indigo-400: oklch(67.3% .182 276.935);--colors-indigo-500: oklch(58.5% .233 277.117);--colors-indigo-600: oklch(51.1% .262 276.966);--colors-indigo-700: oklch(45.7% .24 277.023);--colors-indigo-800: oklch(39.8% .195 277.366);--colors-indigo-900: oklch(35.9% .144 278.697);--colors-indigo-950: oklch(25.7% .09 281.288);--colors-indigo-DEFAULT: oklch(67.3% .182 276.935);--colors-violet-50: oklch(96.9% .016 293.756);--colors-violet-100: oklch(94.3% .029 294.588);--colors-violet-200: oklch(89.4% .057 293.283);--colors-violet-300: oklch(81.1% .111 293.571);--colors-violet-400: oklch(70.2% .183 293.541);--colors-violet-500: oklch(60.6% .25 292.717);--colors-violet-600: oklch(54.1% .281 293.009);--colors-violet-700: oklch(49.1% .27 292.581);--colors-violet-800: oklch(43.2% .232 292.759);--colors-violet-900: oklch(38% .189 293.745);--colors-violet-950: oklch(28.3% .141 291.089);--colors-violet-DEFAULT: oklch(70.2% .183 293.541);--colors-purple-50: oklch(97.7% .014 308.299);--colors-purple-100: oklch(94.6% .033 307.174);--colors-purple-200: oklch(90.2% .063 306.703);--colors-purple-300: oklch(82.7% .119 306.383);--colors-purple-400: oklch(71.4% .203 305.504);--colors-purple-500: oklch(62.7% .265 303.9);--colors-purple-600: oklch(55.8% .288 302.321);--colors-purple-700: oklch(49.6% .265 301.924);--colors-purple-800: oklch(43.8% .218 303.724);--colors-purple-900: oklch(38.1% .176 304.987);--colors-purple-950: oklch(29.1% .149 302.717);--colors-purple-DEFAULT: oklch(71.4% .203 305.504);--colors-fuchsia-50: oklch(97.7% .017 320.058);--colors-fuchsia-100: oklch(95.2% .037 318.852);--colors-fuchsia-200: oklch(90.3% .076 319.62);--colors-fuchsia-300: oklch(83.3% .145 321.434);--colors-fuchsia-400: oklch(74% .238 322.16);--colors-fuchsia-500: oklch(66.7% .295 322.15);--colors-fuchsia-600: oklch(59.1% .293 322.896);--colors-fuchsia-700: oklch(51.8% .253 323.949);--colors-fuchsia-800: oklch(45.2% .211 324.591);--colors-fuchsia-900: oklch(40.1% .17 325.612);--colors-fuchsia-950: oklch(29.3% .136 325.661);--colors-fuchsia-DEFAULT: oklch(74% .238 322.16);--colors-pink-50: oklch(97.1% .014 343.198);--colors-pink-100: oklch(94.8% .028 342.258);--colors-pink-200: oklch(89.9% .061 343.231);--colors-pink-300: oklch(82.3% .12 346.018);--colors-pink-400: oklch(71.8% .202 349.761);--colors-pink-500: oklch(65.6% .241 354.308);--colors-pink-600: oklch(59.2% .249 .584);--colors-pink-700: oklch(52.5% .223 3.958);--colors-pink-800: oklch(45.9% .187 3.815);--colors-pink-900: oklch(40.8% .153 2.432);--colors-pink-950: oklch(28.4% .109 3.907);--colors-pink-DEFAULT: oklch(71.8% .202 349.761);--colors-rose-50: oklch(96.9% .015 12.422);--colors-rose-100: oklch(94.1% .03 12.58);--colors-rose-200: oklch(89.2% .058 10.001);--colors-rose-300: oklch(81% .117 11.638);--colors-rose-400: oklch(71.2% .194 13.428);--colors-rose-500: oklch(64.5% .246 16.439);--colors-rose-600: oklch(58.6% .253 17.585);--colors-rose-700: oklch(51.4% .222 16.935);--colors-rose-800: oklch(45.5% .188 13.697);--colors-rose-900: oklch(41% .159 10.272);--colors-rose-950: oklch(27.1% .105 12.094);--colors-rose-DEFAULT: oklch(71.2% .194 13.428);--colors-light-50: oklch(99.4% 0 0);--colors-light-100: oklch(99.11% 0 0);--colors-light-200: oklch(98.51% 0 0);--colors-light-300: oklch(98.16% .0017 247.84);--colors-light-400: oklch(97.31% 0 0);--colors-light-500: oklch(96.12% 0 0);--colors-light-600: oklch(96.32% .0034 247.86);--colors-light-700: oklch(94.17% .0052 247.88);--colors-light-800: oklch(91.09% .007 247.9);--colors-light-900: oklch(90.72% .0051 228.82);--colors-light-950: oklch(89.23% .006 239.83);--colors-light-DEFAULT: oklch(97.31% 0 0);--colors-dark-50: oklch(40.91% 0 0);--colors-dark-100: oklch(35.62% 0 0);--colors-dark-200: oklch(31.71% 0 0);--colors-dark-300: oklch(29.72% 0 0);--colors-dark-400: oklch(25.2% 0 0);--colors-dark-500: oklch(23.93% 0 0);--colors-dark-600: oklch(22.73% .0038 286.09);--colors-dark-700: oklch(22.21% 0 0);--colors-dark-800: oklch(20.9% 0 0);--colors-dark-900: oklch(16.84% 0 0);--colors-dark-950: oklch(13.44% 0 0);--colors-dark-DEFAULT: oklch(25.2% 0 0);--colors-primary-50: hsl(198, 100%, 97%);--colors-primary-100: hsl(198, 100%, 92%);--colors-primary-200: hsl(198, 100%, 84%);--colors-primary-300: hsl(198, 100%, 75%);--colors-primary-400: hsl(198, 100%, 66%);--colors-primary-500: hsl(198, 100%, 55%);--colors-primary-600: hsl(198, 100%, 45%);--colors-primary-700: hsl(198, 100%, 35%);--colors-primary-800: hsl(198, 100%, 24%);--colors-primary-900: hsl(198, 100%, 15%);--colors-primary-DEFAULT: hsl(198, 100%, 55%);--colors-secondary-50: hsl(120, 100%, 97%);--colors-secondary-100: hsl(120, 100%, 92%);--colors-secondary-200: hsl(120, 100%, 84%);--colors-secondary-300: hsl(120, 100%, 75%);--colors-secondary-400: hsl(120, 100%, 66%);--colors-secondary-500: hsl(120, 100%, 55%);--colors-secondary-600: hsl(120, 100%, 45%);--colors-secondary-700: hsl(120, 100%, 35%);--colors-secondary-800: hsl(120, 100%, 24%);--colors-secondary-900: hsl(120, 100%, 15%);--colors-secondary-DEFAULT: hsl(120, 100%, 55%);--colors-tertiary-50: hsl(175, 100%, 97%);--colors-tertiary-100: hsl(175, 100%, 92%);--colors-tertiary-200: hsl(175, 100%, 84%);--colors-tertiary-300: hsl(175, 100%, 75%);--colors-tertiary-400: hsl(175, 100%, 66%);--colors-tertiary-500: hsl(175, 100%, 55%);--colors-tertiary-600: hsl(175, 100%, 45%);--colors-tertiary-700: hsl(175, 100%, 35%);--colors-tertiary-800: hsl(175, 100%, 24%);--colors-tertiary-900: hsl(175, 100%, 15%);--colors-tertiary-DEFAULT: hsl(175, 100%, 55%);--colors-success-50: hsl(149, 87%, 97%);--colors-success-100: hsl(149, 87%, 92%);--colors-success-200: hsl(149, 87%, 84%);--colors-success-300: hsl(149, 87%, 75%);--colors-success-400: hsl(149, 87%, 66%);--colors-success-500: hsl(149, 87%, 55%);--colors-success-600: hsl(149, 87%, 45%);--colors-success-700: hsl(149, 87%, 35%);--colors-success-800: hsl(149, 87%, 24%);--colors-success-900: hsl(149, 87%, 15%);--colors-success-DEFAULT: hsl(149, 87%, 55%);--colors-warning-50: hsl(32, 100%, 97%);--colors-warning-100: hsl(32, 100%, 92%);--colors-warning-200: hsl(32, 100%, 84%);--colors-warning-300: hsl(32, 100%, 75%);--colors-warning-400: hsl(32, 100%, 66%);--colors-warning-500: hsl(32, 100%, 55%);--colors-warning-600: hsl(32, 100%, 45%);--colors-warning-700: hsl(32, 100%, 35%);--colors-warning-800: hsl(32, 100%, 24%);--colors-warning-900: hsl(32, 100%, 15%);--colors-warning-DEFAULT: hsl(32, 100%, 55%);--colors-danger-50: hsl(345, 100%, 97%);--colors-danger-100: hsl(345, 100%, 92%);--colors-danger-200: hsl(345, 100%, 84%);--colors-danger-300: hsl(345, 100%, 75%);--colors-danger-400: hsl(345, 100%, 66%);--colors-danger-500: hsl(345, 100%, 55%);--colors-danger-600: hsl(345, 100%, 45%);--colors-danger-700: hsl(345, 100%, 35%);--colors-danger-800: hsl(345, 100%, 24%);--colors-danger-900: hsl(345, 100%, 15%);--colors-danger-DEFAULT: hsl(345, 100%, 55%);--colors-default-50: hsl(0, 0%, 97%);--colors-default-100: hsl(0, 0%, 92%);--colors-default-200: hsl(0, 0%, 84%);--colors-default-300: hsl(0, 0%, 75%);--colors-default-400: hsl(0, 0%, 66%);--colors-default-500: hsl(0, 0%, 55%);--colors-default-600: hsl(0, 0%, 45%);--colors-default-700: hsl(0, 0%, 35%);--colors-default-800: hsl(0, 0%, 24%);--colors-default-900: hsl(0, 0%, 15%);--colors-default-DEFAULT: hsl(0, 0%, 35%);--colors-surface-50: hsl(0, 0%, 97%);--colors-surface-100: hsl(0, 0%, 92%);--colors-surface-200: hsl(0, 0%, 84%);--colors-surface-300: hsl(0, 0%, 75%);--colors-surface-400: hsl(0, 0%, 66%);--colors-surface-500: hsl(0, 0%, 55%);--colors-surface-600: hsl(0, 0%, 45%);--colors-surface-700: hsl(0, 0%, 35%);--colors-surface-800: hsl(0, 0%, 24%);--colors-surface-900: hsl(0, 0%, 15%);--colors-surface-DEFAULT: hsl(0, 0%, 35%);--text-xs-fontSize: .75rem;--text-xs-lineHeight: 1rem;--text-sm-fontSize: .875rem;--text-sm-lineHeight: 1.25rem;--text-base-fontSize: 1rem;--text-base-lineHeight: 1.5rem;--text-lg-fontSize: 1.125rem;--text-lg-lineHeight: 1.75rem;--text-xl-fontSize: 1.25rem;--text-xl-lineHeight: 1.75rem;--text-2xl-fontSize: 1.5rem;--text-2xl-lineHeight: 2rem;--text-3xl-fontSize: 1.875rem;--text-3xl-lineHeight: 2.25rem;--text-4xl-fontSize: 2.25rem;--text-4xl-lineHeight: 2.5rem;--text-5xl-fontSize: 3rem;--text-5xl-lineHeight: 1;--text-6xl-fontSize: 3.75rem;--text-6xl-lineHeight: 1;--text-7xl-fontSize: 4.5rem;--text-7xl-lineHeight: 1;--text-8xl-fontSize: 6rem;--text-8xl-lineHeight: 1;--text-9xl-fontSize: 8rem;--text-9xl-lineHeight: 1;--text-color: var(--color-surface-100);--fontWeight-thin: 100;--fontWeight-extralight: 200;--fontWeight-light: 300;--fontWeight-normal: 400;--fontWeight-medium: 500;--fontWeight-semibold: 600;--fontWeight-bold: 700;--fontWeight-extrabold: 800;--fontWeight-black: 900;--tracking-tighter: -.05em;--tracking-tight: -.025em;--tracking-normal: 0em;--tracking-wide: .025em;--tracking-wider: .05em;--tracking-widest: .1em;--leading-none: 1;--leading-tight: 1.25;--leading-snug: 1.375;--leading-normal: 1.5;--leading-relaxed: 1.625;--leading-loose: 2;--textStrokeWidth-DEFAULT: 1.5rem;--textStrokeWidth-none: 0;--textStrokeWidth-sm: thin;--textStrokeWidth-md: medium;--textStrokeWidth-lg: thick;--radius-DEFAULT: .25rem;--radius-none: 0;--radius-xs: .125rem;--radius-sm: .25rem;--radius-md: .375rem;--radius-lg: .5rem;--radius-xl: .75rem;--radius-2xl: 1rem;--radius-3xl: 1.5rem;--radius-4xl: 2rem;--ease-linear: linear;--ease-in: cubic-bezier(.4, 0, 1, 1);--ease-out: cubic-bezier(0, 0, .2, 1);--ease-in-out: cubic-bezier(.4, 0, .2, 1);--ease-DEFAULT: cubic-bezier(.4, 0, .2, 1);--blur-DEFAULT: 8px;--blur-xs: 4px;--blur-sm: 8px;--blur-md: 12px;--blur-lg: 16px;--blur-xl: 24px;--blur-2xl: 40px;--blur-3xl: 64px;--perspective-dramatic: 100px;--perspective-near: 300px;--perspective-normal: 500px;--perspective-midrange: 800px;--perspective-distant: 1200px;--default-transition-duration: .15s;--default-transition-timingFunction: cubic-bezier(.4, 0, .2, 1);--default-font-family: var(--font-sans);--default-font-featureSettings: var(--font-sans--font-feature-settings);--default-font-variationSettings: var(--font-sans--font-variation-settings);--default-monoFont-family: var(--font-mono);--default-monoFont-featureSettings: var(--font-mono--font-feature-settings);--default-monoFont-variationSettings: var(--font-mono--font-variation-settings);--container-3xs: 16rem;--container-2xs: 18rem;--container-xs: 20rem;--container-sm: 24rem;--container-md: 28rem;--container-lg: 32rem;--container-xl: 36rem;--container-2xl: 42rem;--container-3xl: 48rem;--container-4xl: 56rem;--container-5xl: 64rem;--container-6xl: 72rem;--container-7xl: 80rem;--container-prose: 65ch;--background-color: var(--colors-primary-100);--boxShadow-md: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);--boxShadow-lg: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--theme-font-family: "Manrope"}*,:after,:before,::backdrop,::file-selector-button{box-sizing:border-box;margin:0;padding:0;border:0 solid}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:var( --default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" );font-feature-settings:var(--default-font-featureSettings, normal);font-variation-settings:var(--default-font-variationSettings, normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var( --default-monoFont-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace );font-feature-settings:var(--default-monoFont-featureSettings, normal);font-variation-settings:var(--default-monoFont-variationSettings, normal);font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea,::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;border-radius:0;background-color:transparent;opacity:1}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit,::-webkit-datetime-edit-year-field,::-webkit-datetime-edit-month-field,::-webkit-datetime-edit-day-field,::-webkit-datetime-edit-hour-field,::-webkit-datetime-edit-minute-field,::-webkit-datetime-edit-second-field,::-webkit-datetime-edit-millisecond-field,::-webkit-datetime-edit-meridiem-field{padding-block:0}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]),::file-selector-button{appearance:button}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}.text-2xl{font-size:var(--text-2xl-fontSize);line-height:var(--un-leading, var(--text-2xl-lineHeight))}.text-3xl{font-size:var(--text-3xl-fontSize);line-height:var(--un-leading, var(--text-3xl-lineHeight))}.text-4xl{font-size:var(--text-4xl-fontSize);line-height:var(--un-leading, var(--text-4xl-lineHeight))}.text-lg{font-size:var(--text-lg-fontSize);line-height:var(--un-leading, var(--text-lg-lineHeight))}.text-sm{font-size:var(--text-sm-fontSize);line-height:var(--un-leading, var(--text-sm-lineHeight))}.text-xl{font-size:var(--text-xl-fontSize);line-height:var(--un-leading, var(--text-xl-lineHeight))}.text-xs{font-size:var(--text-xs-fontSize);line-height:var(--un-leading, var(--text-xs-lineHeight))}.data-\\[active\\=true\\]\\:text-white[data-active=true],.text-white{color:color-mix(in srgb,var(--colors-white) var(--un-text-opacity),transparent)}.text-\\[\\#1d2021\\]{color:color-mix(in oklab,#1d2021 var(--un-text-opacity),transparent)}.text-\\[\\#665c54\\]{color:color-mix(in oklab,#665c54 var(--un-text-opacity),transparent)}.text-\\[\\#83a598\\]{color:color-mix(in oklab,#83a598 var(--un-text-opacity),transparent)}.text-\\[\\#928374\\]{color:color-mix(in oklab,#928374 var(--un-text-opacity),transparent)}.text-\\[\\#98971a\\]{color:color-mix(in oklab,#98971a var(--un-text-opacity),transparent)}.text-\\[\\#a89984\\]{color:color-mix(in oklab,#a89984 var(--un-text-opacity),transparent)}.text-\\[\\#bdae93\\]{color:color-mix(in oklab,#bdae93 var(--un-text-opacity),transparent)}.text-\\[\\#cc241d\\]{color:color-mix(in oklab,#cc241d var(--un-text-opacity),transparent)}.text-\\[\\#ebdbb2\\]{color:color-mix(in oklab,#ebdbb2 var(--un-text-opacity),transparent)}.text-gray-400{color:color-mix(in srgb,var(--colors-gray-400) var(--un-text-opacity),transparent)}.text-gray-500{color:color-mix(in srgb,var(--colors-gray-500) var(--un-text-opacity),transparent)}.text-gray-700{color:color-mix(in srgb,var(--colors-gray-700) var(--un-text-opacity),transparent)}.text-gray-800{color:color-mix(in srgb,var(--colors-gray-800) var(--un-text-opacity),transparent)}.text-gray-900{color:color-mix(in srgb,var(--colors-gray-900) var(--un-text-opacity),transparent)}.text-green-800{color:color-mix(in srgb,var(--colors-green-800) var(--un-text-opacity),transparent)}.text-red-400{color:color-mix(in srgb,var(--colors-red-400) var(--un-text-opacity),transparent)}.text-yellow-800{color:color-mix(in srgb,var(--colors-yellow-800) var(--un-text-opacity),transparent)}.hover\\:text-\\[\\#83a598\\]:hover{color:color-mix(in oklab,#83a598 var(--un-text-opacity),transparent)}.hover\\:text-\\[\\#98971a\\]:hover{color:color-mix(in oklab,#98971a var(--un-text-opacity),transparent)}.hover\\:text-\\[\\#cc241d\\]:hover{color:color-mix(in oklab,#cc241d var(--un-text-opacity),transparent)}.hover\\:text-\\[\\#ebdbb2\\]:hover{color:color-mix(in oklab,#ebdbb2 var(--un-text-opacity),transparent)}.hover\\:text-yellow-300:hover{color:color-mix(in srgb,var(--colors-yellow-300) var(--un-text-opacity),transparent)}.leading-relaxed{--un-leading:var(--leading-relaxed);line-height:var(--leading-relaxed)}.tracking-wide{--un-tracking:var(--tracking-wide);letter-spacing:var(--tracking-wide)}.tracking-wider{--un-tracking:var(--tracking-wider);letter-spacing:var(--tracking-wider)}.tracking-widest{--un-tracking:var(--tracking-widest);letter-spacing:var(--tracking-widest)}.font-bold{--un-font-weight:var(--fontWeight-bold);font-weight:var(--fontWeight-bold)}.font-extrabold{--un-font-weight:var(--fontWeight-extrabold);font-weight:var(--fontWeight-extrabold)}.font-medium{--un-font-weight:var(--fontWeight-medium);font-weight:var(--fontWeight-medium)}.font-mono{font-family:var(--font-mono)}.font-sans{font-family:var(--font-sans)}.font-semibold{--un-font-weight:var(--fontWeight-semibold);font-weight:var(--fontWeight-semibold)}.m10\\.065{margin:calc(var(--spacing) * 10.065)}.m12{margin:calc(var(--spacing) * 12)}.m15{margin:calc(var(--spacing) * 15)}.m16{margin:calc(var(--spacing) * 16)}.m21{margin:calc(var(--spacing) * 21)}.m21\\.73{margin:calc(var(--spacing) * 21.73)}.m22{margin:calc(var(--spacing) * 22)}.m3{margin:calc(var(--spacing) * 3)}.m4{margin:calc(var(--spacing) * 4)}.m5{margin:calc(var(--spacing) * 5)}.m6{margin:calc(var(--spacing) * 6)}.m9{margin:calc(var(--spacing) * 9)}.mx-auto{margin-inline:auto}.-mb-4{margin-bottom:calc(calc(var(--spacing) * 4) * -1)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.mb-4{margin-bottom:calc(var(--spacing) * 4)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.ml-2{margin-left:calc(var(--spacing) * 2)}.ml-auto{margin-left:auto}.mr-2{margin-right:calc(var(--spacing) * 2)}.mr-3{margin-right:calc(var(--spacing) * 3)}.mt-1{margin-top:calc(var(--spacing) * 1)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-4{margin-top:calc(var(--spacing) * 4)}.mt-auto{margin-top:auto}.p-1{padding:calc(var(--spacing) * 1)}.p-1\\.5{padding:calc(var(--spacing) * 1.5)}.p-2{padding:calc(var(--spacing) * 2)}.p-3{padding:calc(var(--spacing) * 3)}.p-4{padding:calc(var(--spacing) * 4)}.p-5{padding:calc(var(--spacing) * 5)}.p-6{padding:calc(var(--spacing) * 6)}.p-8{padding:calc(var(--spacing) * 8)}.\\[\\&\\>a\\]\\:px-5>a{padding-inline:calc(var(--spacing) * 5)}.\\[\\&\\>a\\]\\:py-2\\.5>a{padding-block:calc(var(--spacing) * 2.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-6{padding-inline:calc(var(--spacing) * 6)}.py-0\\.5{padding-block:calc(var(--spacing) * .5)}.py-1{padding-block:calc(var(--spacing) * 1)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-8{padding-block:calc(var(--spacing) * 8)}.pb-2{padding-bottom:calc(var(--spacing) * 2)}.pb-4{padding-bottom:calc(var(--spacing) * 4)}.pl-10{padding-left:calc(var(--spacing) * 10)}.pr-10{padding-right:calc(var(--spacing) * 10)}.pr-16{padding-right:calc(var(--spacing) * 16)}.pr-2{padding-right:calc(var(--spacing) * 2)}.pr-4{padding-right:calc(var(--spacing) * 4)}.pt-4{padding-top:calc(var(--spacing) * 4)}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.focus\\:outline-none:focus{--un-outline-style:none;outline-style:none}.b,.border{border-width:1px}.border-2{border-width:2px}.border-b{border-bottom-width:1px}.border-l{border-left-width:1px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-t-2{border-top-width:2px}.border-\\[\\#3c3836\\]{border-color:color-mix(in oklab,#3c3836 var(--un-border-opacity),transparent)}.border-\\[\\#504945\\]{border-color:color-mix(in oklab,#504945 var(--un-border-opacity),transparent)}.border-\\[\\#665c54\\]{border-color:color-mix(in oklab,#665c54 var(--un-border-opacity),transparent)}.border-\\[\\#83a598\\],.hover\\:border-\\[\\#83a598\\]:hover{border-color:color-mix(in oklab,#83a598 var(--un-border-opacity),transparent)}.hover\\:border-\\[\\#98971a\\]:hover{border-color:color-mix(in oklab,#98971a var(--un-border-opacity),transparent)}.hover\\:border-\\[\\#cc241d\\]:hover{border-color:color-mix(in oklab,#cc241d var(--un-border-opacity),transparent)}.focus\\:border-\\[\\#83a598\\]:focus{border-color:color-mix(in oklab,#83a598 var(--un-border-opacity),transparent)}.rounded{border-radius:var(--radius-DEFAULT)}.rounded-full{border-radius:calc(infinity * 1px)}.rounded-lg{border-radius:var(--radius-lg)}.rounded-md{border-radius:var(--radius-md)}.rounded-xl{border-radius:var(--radius-xl)}.border-dashed{--un-border-style:dashed;border-style:dashed}.bg-\\[\\#1d2021\\]{background-color:color-mix(in oklab,#1d2021 var(--un-bg-opacity),transparent)}.bg-\\[\\#282828\\]{background-color:color-mix(in oklab,#282828 var(--un-bg-opacity),transparent)}.bg-\\[\\#3c3836\\]{background-color:color-mix(in oklab,#3c3836 var(--un-bg-opacity),transparent)}.bg-\\[\\#458588\\]{background-color:color-mix(in oklab,#458588 var(--un-bg-opacity),transparent)}.bg-\\[\\#504945\\],.data-\\[active\\=true\\]\\:bg-\\[\\#504945\\][data-active=true]{background-color:color-mix(in oklab,#504945 var(--un-bg-opacity),transparent)}.bg-\\[\\#83a598\\]{background-color:color-mix(in oklab,#83a598 var(--un-bg-opacity),transparent)}.bg-\\[\\#98971a\\]{background-color:color-mix(in oklab,#98971a var(--un-bg-opacity),transparent)}.bg-\\[\\#b16286\\]{background-color:color-mix(in oklab,#b16286 var(--un-bg-opacity),transparent)}.bg-\\[\\#cc241d\\]{background-color:color-mix(in oklab,#cc241d var(--un-bg-opacity),transparent)}.bg-gray-100{background-color:color-mix(in srgb,var(--colors-gray-100) var(--un-bg-opacity),transparent)}.bg-gray-200{background-color:color-mix(in srgb,var(--colors-gray-200) var(--un-bg-opacity),transparent)}.bg-gray-50{background-color:color-mix(in srgb,var(--colors-gray-50) var(--un-bg-opacity),transparent)}.bg-green-100{background-color:color-mix(in srgb,var(--colors-green-100) var(--un-bg-opacity),transparent)}.bg-green-700{background-color:color-mix(in srgb,var(--colors-green-700) var(--un-bg-opacity),transparent)}.bg-red-700{background-color:color-mix(in srgb,var(--colors-red-700) var(--un-bg-opacity),transparent)}.bg-white{background-color:color-mix(in srgb,var(--colors-white) var(--un-bg-opacity),transparent)}.bg-yellow-100{background-color:color-mix(in srgb,var(--colors-yellow-100) var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#1d2021\\]:hover{background-color:color-mix(in oklab,#1d2021 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#3c3836\\]:hover{background-color:color-mix(in oklab,#3c3836 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#504945\\]:hover{background-color:color-mix(in oklab,#504945 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#665c54\\]:hover{background-color:color-mix(in oklab,#665c54 var(--un-bg-opacity),transparent)}.hover\\:bg-\\[\\#83a598\\]:hover{background-color:color-mix(in oklab,#83a598 var(--un-bg-opacity),transparent)}.hover\\:bg-gray-700:hover{background-color:color-mix(in srgb,var(--colors-gray-700) var(--un-bg-opacity),transparent)}.opacity-0{opacity:0%}.opacity-50{opacity:50%}.group:hover .group-hover\\:opacity-100{opacity:100%}.disabled\\:opacity-50:disabled{opacity:50%}.hover\\:underline:hover{text-decoration-line:underline}.no-underline{text-decoration:none}.flex{display:flex}.flex-1{flex:1 1 0%}.flex-shrink-0,.shrink-0{flex-shrink:0}.flex-grow{flex-grow:1}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.gap-1{gap:calc(var(--spacing) * 1)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-5{gap:calc(var(--spacing) * 5)}.gap-6{gap:calc(var(--spacing) * 6)}.gap-8{gap:calc(var(--spacing) * 8)}.gap-x-6{column-gap:calc(var(--spacing) * 6)}.gap-y-10{row-gap:calc(var(--spacing) * 10)}.grid{display:grid}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.\\[\\&\\>a\\>uix-icon\\]\\:h-3>a>uix-icon,.h-3{height:calc(var(--spacing) * 3)}.\\[\\&\\>a\\>uix-icon\\]\\:h-5>a>uix-icon,.h-5{height:calc(var(--spacing) * 5)}.\\[\\&\\>a\\>uix-icon\\]\\:h-6>a>uix-icon,.h-6{height:calc(var(--spacing) * 6)}.\\[\\&\\>a\\>uix-icon\\]\\:w-3>a>uix-icon,.w-3{width:calc(var(--spacing) * 3)}.\\[\\&\\>a\\>uix-icon\\]\\:w-5>a>uix-icon,.w-5{width:calc(var(--spacing) * 5)}.\\[\\&\\>a\\>uix-icon\\]\\:w-6>a>uix-icon,.w-6{width:calc(var(--spacing) * 6)}.h-12{height:calc(var(--spacing) * 12)}.h-15{height:calc(var(--spacing) * 15)}.h-16{height:calc(var(--spacing) * 16)}.h-3\\.5{height:calc(var(--spacing) * 3.5)}.h-4{height:calc(var(--spacing) * 4)}.h-50{height:calc(var(--spacing) * 50)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-full{height:100%}.h-screen{height:100vh}.max-w-md{max-width:var(--container-md)}.min-h-\\[2\\.5rem\\]{min-height:2.5rem}.min-h-0{min-height:calc(var(--spacing) * 0)}.min-h-screen{min-height:100vh}.min-w-0{min-width:calc(var(--spacing) * 0)}.w-10{width:calc(var(--spacing) * 10)}.w-12{width:calc(var(--spacing) * 12)}.w-16{width:calc(var(--spacing) * 16)}.w-3\\.5{width:calc(var(--spacing) * 3.5)}.w-3xs{width:var(--container-3xs)}.w-4{width:calc(var(--spacing) * 4)}.w-48{width:calc(var(--spacing) * 48)}.w-64{width:calc(var(--spacing) * 64)}.w-8{width:calc(var(--spacing) * 8)}.w-80{width:calc(var(--spacing) * 80)}.w-full{width:100%}.\\[\\&\\>a\\]\\:block>a,.block{display:block}.contents{display:contents}.hidden{display:none}.cursor-pointer{cursor:pointer}.cursor-not-allowed{cursor:not-allowed}.resize-none{resize:none}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.text-ellipsis{text-overflow:ellipsis}.uppercase{text-transform:uppercase}.capitalize{text-transform:capitalize}.focus\\:ring-2:focus{--un-ring-shadow:var(--un-ring-inset,) 0 0 0 calc(2px + var(--un-ring-offset-width)) var(--un-ring-color, currentColor);box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.focus\\:ring-\\[\\#83a598\\]:focus{--un-ring-color:color-mix(in oklab, #83a598 var(--un-ring-opacity), transparent)}.shadow-\\[4px_4px_0px_\\#1d2021\\]{--un-shadow:4px 4px 0px var(--un-shadow-color, rgb(29 32 33));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.shadow-lg{--un-shadow:0 10px 15px -3px var(--un-shadow-color, rgb(0 0 0 / .1)),0 4px 6px -4px var(--un-shadow-color, rgb(0 0 0 / .1));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.shadow-md{--un-shadow:0 4px 6px -1px var(--un-shadow-color, rgb(0 0 0 / .1)),0 2px 4px -2px var(--un-shadow-color, rgb(0 0 0 / .1));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.hover\\:shadow-\\[6px_6px_0px_\\#83a598\\]:hover{--un-shadow:6px 6px 0px var(--un-shadow-color, rgb(131 165 152));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.hover\\:shadow-\\[6px_6px_0px_\\#98971a\\]:hover{--un-shadow:6px 6px 0px var(--un-shadow-color, rgb(152 151 26));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.hover\\:shadow-\\[6px_6px_0px_\\#cc241d\\]:hover{--un-shadow:6px 6px 0px var(--un-shadow-color, rgb(204 36 29));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.focus\\:shadow-\\[2px_2px_0px_\\#1d2021\\]:focus{--un-shadow:2px 2px 0px var(--un-shadow-color, rgb(29 32 33));box-shadow:var(--un-inset-shadow),var(--un-inset-ring-shadow),var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)}.-translate-y-1\\/2{--un-translate-y:-50%;translate:var(--un-translate-x) var(--un-translate-y)}.translate-x-4{--un-translate-x:calc(var(--spacing) * 4);translate:var(--un-translate-x) var(--un-translate-y)}.transform{transform:var(--un-rotate-x) var(--un-rotate-y) var(--un-rotate-z) var(--un-skew-x) var(--un-skew-y)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,--un-gradient-from,--un-gradient-via,--un-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,--un-gradient-from,--un-gradient-via,--un-gradient-to;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--un-ease, var(--default-transition-timingFunction));transition-duration:var(--un-duration, var(--default-transition-duration))}.duration-200{--un-duration:.2s;transition-duration:.2s}.items-start{align-items:flex-start}.items-center{align-items:center}.self-start{align-self:flex-start}.self-end{align-self:flex-end}.self-center{align-self:center}.bottom-2\\.5{bottom:calc(var(--spacing) * 2.5)}.left-3{left:calc(var(--spacing) * 3)}.right-2{right:calc(var(--spacing) * 2)}.right-3{right:calc(var(--spacing) * 3)}.top-1\\/2{top:50%}.top-2{top:calc(var(--spacing) * 2)}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.absolute{position:absolute}.relative{position:relative}.sticky{position:sticky}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.overflow-x-auto{overflow-x:auto}.overflow-y-auto{overflow-y:auto}.filter{filter:var(--un-blur,) var(--un-brightness,) var(--un-contrast,) var(--un-grayscale,) var(--un-hue-rotate,) var(--un-invert,) var(--un-saturate,) var(--un-sepia,) var(--un-drop-shadow,)}.placeholder-\\[\\#928374\\]::placeholder{color:color-mix(in oklab,#928374 var(--un-placeholder-opacity),transparent)}.space-x-2>:not(:last-child){--un-space-x-reverse:0;margin-inline-start:calc(calc(var(--spacing) * 2) * var(--un-space-x-reverse));margin-inline-end:calc(calc(var(--spacing) * 2) * calc(1 - var(--un-space-x-reverse)))}.space-y-1>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 1) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 1) * calc(1 - var(--un-space-y-reverse)))}.space-y-4>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 4) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 4) * calc(1 - var(--un-space-y-reverse)))}.space-y-6>:not(:last-child){--un-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 6) * var(--un-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 6) * calc(1 - var(--un-space-y-reverse)))}@supports (color: color-mix(in lab,red,red)){.data-\\[active\\=true\\]\\:text-white[data-active=true]{color:color-mix(in oklab,var(--colors-white) var(--un-text-opacity),transparent)}.text-gray-400{color:color-mix(in oklab,var(--colors-gray-400) var(--un-text-opacity),transparent)}.text-gray-500{color:color-mix(in oklab,var(--colors-gray-500) var(--un-text-opacity),transparent)}.text-gray-700{color:color-mix(in oklab,var(--colors-gray-700) var(--un-text-opacity),transparent)}.text-gray-800{color:color-mix(in oklab,var(--colors-gray-800) var(--un-text-opacity),transparent)}.text-gray-900{color:color-mix(in oklab,var(--colors-gray-900) var(--un-text-opacity),transparent)}.text-green-800{color:color-mix(in oklab,var(--colors-green-800) var(--un-text-opacity),transparent)}.text-red-400{color:color-mix(in oklab,var(--colors-red-400) var(--un-text-opacity),transparent)}.text-white{color:color-mix(in oklab,var(--colors-white) var(--un-text-opacity),transparent)}.text-yellow-800{color:color-mix(in oklab,var(--colors-yellow-800) var(--un-text-opacity),transparent)}.hover\\:text-yellow-300:hover{color:color-mix(in oklab,var(--colors-yellow-300) var(--un-text-opacity),transparent)}.bg-gray-100{background-color:color-mix(in oklab,var(--colors-gray-100) var(--un-bg-opacity),transparent)}.bg-gray-200{background-color:color-mix(in oklab,var(--colors-gray-200) var(--un-bg-opacity),transparent)}.bg-gray-50{background-color:color-mix(in oklab,var(--colors-gray-50) var(--un-bg-opacity),transparent)}.bg-green-100{background-color:color-mix(in oklab,var(--colors-green-100) var(--un-bg-opacity),transparent)}.bg-green-700{background-color:color-mix(in oklab,var(--colors-green-700) var(--un-bg-opacity),transparent)}.bg-red-700{background-color:color-mix(in oklab,var(--colors-red-700) var(--un-bg-opacity),transparent)}.bg-white{background-color:color-mix(in oklab,var(--colors-white) var(--un-bg-opacity),transparent)}.bg-yellow-100{background-color:color-mix(in oklab,var(--colors-yellow-100) var(--un-bg-opacity),transparent)}.hover\\:bg-gray-700:hover{background-color:color-mix(in oklab,var(--colors-gray-700) var(--un-bg-opacity),transparent)}}@media (min-width: 48rem){.md\\:p-8{padding:calc(var(--spacing) * 8)}.md\\:flex-row{flex-direction:row}.md\\:col-span-2{grid-column:span 2/span 2}.md\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\\:w-64{width:calc(var(--spacing) * 64)}.md\\:w-72{width:calc(var(--spacing) * 72)}.md\\:w-auto{width:auto}.md\\:items-start{align-items:flex-start}.md\\:items-center{align-items:center}.md\\:justify-between{justify-content:space-between}}@media (min-width: 64rem){.lg\\:flex{display:flex}.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (min-width: 80rem){.xl\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}.\\37c 1.cm-focused{outline:1px dotted #212121}.\\37c 1{position:relative!important;box-sizing:border-box;display:flex!important;flex-direction:column}.\\37c 1 .cm-scroller{display:flex!important;align-items:flex-start!important;font-family:monospace;line-height:1.4;height:100%;overflow-x:auto;position:relative;z-index:0;overflow-anchor:none}.\\37c 1 .cm-content[contenteditable=true]{-webkit-user-modify:read-write-plaintext-only}.\\37c 1 .cm-content{margin:0;flex-grow:2;flex-shrink:0;display:block;white-space:pre;word-wrap:normal;box-sizing:border-box;min-height:100%;padding:4px 0;outline:none}.\\37c 1 .cm-lineWrapping{white-space:pre-wrap;white-space:break-spaces;word-break:break-word;overflow-wrap:anywhere;flex-shrink:1}.\\37c 2 .cm-content{caret-color:#000}.\\37c 3 .cm-content{caret-color:#fff}.\\37c 1 .cm-line{display:block;padding:0 2px 0 6px}.\\37c 1 .cm-layer>*{position:absolute}.\\37c 1 .cm-layer{position:absolute;left:0;top:0;contain:size style}.\\37c 2 .cm-selectionBackground{background:#d9d9d9}.\\37c 3 .cm-selectionBackground{background:#222}.\\37c 2.cm-focused>.cm-scroller>.cm-selectionLayer .cm-selectionBackground{background:#d7d4f0}.\\37c 3.cm-focused>.cm-scroller>.cm-selectionLayer .cm-selectionBackground{background:#233}.\\37c 1 .cm-cursorLayer{pointer-events:none}.\\37c 1.cm-focused>.cm-scroller>.cm-cursorLayer{animation:steps(1) cm-blink 1.2s infinite}@keyframes cm-blink{50%{opacity:0}}@keyframes cm-blink2{50%{opacity:0}}.\\37c 1 .cm-cursor,.\\37c 1 .cm-dropCursor{border-left:1.2px solid black;margin-left:-.6px;pointer-events:none}.\\37c 1 .cm-cursor{display:none}.\\37c 3 .cm-cursor{border-left-color:#ddd}.\\37c 1 .cm-dropCursor{position:absolute}.\\37c 1.cm-focused>.cm-scroller>.cm-cursorLayer .cm-cursor{display:block}.\\37c 1 .cm-iso{unicode-bidi:isolate}.\\37c 1 .cm-announced{position:fixed;top:-10000px}@media print{.\\37c 1 .cm-announced{display:none}}.\\37c 2 .cm-activeLine{background-color:#cef4}.\\37c 3 .cm-activeLine{background-color:#9ef3}.\\37c 2 .cm-specialChar{color:red}.\\37c 3 .cm-specialChar{color:#f78}.\\37c 1 .cm-gutters{flex-shrink:0;display:flex;height:100%;box-sizing:border-box;z-index:200}.\\37c 1 .cm-gutters-before{inset-inline-start:0}.\\37c 1 .cm-gutters-after{inset-inline-end:0}.\\37c 2 .cm-gutters.cm-gutters-before{border-right-width:1px}.\\37c 2 .cm-gutters.cm-gutters-after{border-left-width:1px}.\\37c 2 .cm-gutters{background-color:#f5f5f5;color:#6c6c6c;border:0px solid #ddd}.\\37c 3 .cm-gutters{background-color:#333338;color:#ccc}.\\37c 1 .cm-gutter{display:flex!important;flex-direction:column;flex-shrink:0;box-sizing:border-box;min-height:100%;overflow:hidden}.\\37c 1 .cm-gutterElement{box-sizing:border-box}.\\37c 1 .cm-lineNumbers .cm-gutterElement{padding:0 3px 0 5px;min-width:20px;text-align:right;white-space:nowrap}.\\37c 2 .cm-activeLineGutter{background-color:#e2f2ff}.\\37c 3 .cm-activeLineGutter{background-color:#222227}.\\37c 1 .cm-panels{box-sizing:border-box;position:sticky;left:0;right:0;z-index:300}.\\37c 2 .cm-panels{background-color:#f5f5f5;color:#000}.\\37c 2 .cm-panels-top{border-bottom:1px solid #ddd}.\\37c 2 .cm-panels-bottom{border-top:1px solid #ddd}.\\37c 3 .cm-panels{background-color:#333338;color:#fff}.\\37c 1 .cm-dialog label{font-size:80%}.\\37c 1 .cm-dialog{padding:2px 19px 4px 6px;position:relative}.\\37c 1 .cm-dialog-close{position:absolute;top:3px;right:4px;background-color:inherit;border:none;font:inherit;font-size:14px;padding:0}.\\37c 1 .cm-tab{display:inline-block;overflow:hidden;vertical-align:bottom}.\\37c 1 .cm-widgetBuffer{vertical-align:text-top;height:1em;width:0;display:inline}.\\37c 1 .cm-placeholder{color:#888;display:inline-block;vertical-align:top;user-select:none}.\\37c 1 .cm-highlightSpace{background-image:radial-gradient(circle at 50% 55%,#aaa 20%,transparent 5%);background-position:center}.\\37c 1 .cm-highlightTab{background-image:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>');background-size:auto 100%;background-position:right 90%;background-repeat:no-repeat}.\\37c 1 .cm-trailingSpace{background-color:#f325}.\\37c 1 .cm-button{vertical-align:middle;color:inherit;font-size:70%;padding:.2em 1em;border-radius:1px}.\\37c 2 .cm-button:active{background-image:linear-gradient(#b4b4b4,#d0d3d6)}.\\37c 2 .cm-button{background-image:linear-gradient(#eff1f5,#d9d9df);border:1px solid #888}.\\37c 3 .cm-button:active{background-image:linear-gradient(#111,#333)}.\\37c 3 .cm-button{background-image:linear-gradient(#393939,#111);border:1px solid #888}.\\37c 1 .cm-textfield{vertical-align:middle;color:inherit;font-size:70%;border:1px solid silver;padding:.2em .5em}.\\37c 2 .cm-textfield{background-color:#fff}.\\37c 3 .cm-textfield{border:1px solid #555;background-color:inherit}.\\37c 1y .cm-editor{font-size:12px}.\\37cp,.\\37cq,.\\37cr{color:#fb4934;font-weight:700}.\\37cs,.\\37ct{color:#83a598}.\\37cu{color:#8ec07c;font-style:normal}.\\37cv{color:#8ec07c}.\\37cw{color:#fabd2f;font-style:italic}.\\37cx{color:#83a598;font-style:italic}.\\37cy{color:#ebdbb2}.\\37cz,.\\37c 10,.\\37c 11{color:#928374}.\\37c 12{color:#fabd2f}.\\37c 13{color:#83a598}.\\37c 14,.\\37c 15{color:#d3869b}.\\37c 16{color:#fb4934;font-style:italic}.\\37c 17{color:#d3869b;font-style:italic}.\\37c 18{color:#d3869b}.\\37c 19,.\\37c 1a{color:#fe8019}.\\37c 1b,.\\37c 1c,.\\37c 1d{color:#b8bb26}.\\37c 1e{color:#8ec07c;font-weight:700}.\\37c 1f{color:#928374}.\\37c 1g,.\\37c 1h{font-style:italic;color:#928374}.\\37c 1i{color:#fb4934}.\\37c 1j{color:#fabd2f}.\\37c 1k,.\\37c 1l{font-weight:700;color:#fabd2f}.\\37c 1m{font-style:italic;color:#b8bb26}.\\37c 1n{color:#d3869b;font-weight:500;text-decoration:underline;text-underline-position:under}.\\37c 1o{color:#83a598;text-decoration:underline;text-underline-offset:2px}.\\37c 1p{color:#ebdbb2;text-decoration:underline wavy;border-bottom:1px wavy #fb4934}.\\37c 1q{color:#fb4934;text-decoration:line-through}.\\37c 1r{color:#fe8019}.\\37c 1s{color:#fb4934}.\\37c 1t,.\\37c 1u{color:#928374}.\\37c 1v{color:#ebdbb2}.\\37c 1w{color:#83a598}.\\37c 1x{color:#928374}.\\37co{color:#ebdbb2;background-color:#282828;font-size:14px;font-family:JetBrains Mono,Consolas,monospace}.\\37co .cm-content{caret-color:#fe8019;line-height:1.6}.\\37co .cm-cursor,.\\37co .cm-dropCursor{border-left-color:#fe8019;border-left-width:2px}.\\37co .cm-fat-cursor{background-color:#fe801999;color:#282828}.\\37co.cm-focused>.cm-scroller>.cm-selectionLayer .cm-selectionBackground,.\\37co .cm-selectionBackground,.\\37co .cm-content ::selection{background-color:#504945}.\\37co .cm-selectionLayer{z-index:100}.\\37co .cm-searchMatch span{color:#fbf1c7}.\\37co .cm-searchMatch{background-color:#b57614cc;outline:1px solid #fabd2f;color:#fbf1c7;border-radius:4px}.\\37co .cm-searchMatch.cm-searchMatch-selected span{color:#282828}.\\37co .cm-searchMatch.cm-searchMatch-selected{background-color:#fe8019;color:#282828;padding:2px 6px}.\\37co .cm-search.cm-panel.cm-textfield{color:#ebdbb2;border-radius:4px;padding:2px 6px}.\\37co .cm-panels{background-color:#3c3836;color:#ebdbb2;border-radius:4px}.\\37co .cm-panels.cm-panels-top{border-bottom:1px solid #665c54}.\\37co .cm-panels.cm-panels-bottom{border-top:1px solid #665c54}.\\37co .cm-panel button{background-color:#3c3836;color:#ebdbb2;border:none;border-radius:4px;padding:2px 10px}.\\37co .cm-panel button:hover{background-color:#504945}.\\37co .cm-activeLine{background-color:#3c383660;border-radius:2px;z-index:1}.\\37co .cm-gutters{background-color:#3c3836;color:#928374;border:none;border-right:1px solid #504945;padding-right:8px}.\\37co .cm-activeLineGutter{background-color:#3c3836;color:#ebdbb2;font-weight:500}.\\37co .cm-lineNumbers,.\\37co .cm-foldGutter{font-size:.9em}.\\37co .cm-foldGutter .cm-gutterElement{color:#928374;cursor:pointer}.\\37co .cm-foldGutter .cm-gutterElement:hover{color:#ebdbb2}.\\37co .cm-insertedLine{text-decoration:none;background-color:#32361a80;color:#b8bb26;padding:1px 3px;border-radius:3px}.\\37co ins.cm-insertedLine,.\\37co ins.cm-insertedLine:not(:has(.cm-changedText)){text-decoration:none;background-color:#32361a80!important;color:#b8bb26;padding:1px 3px;border-radius:3px;border:1px solid #b8bb2640}.\\37co ins.cm-insertedLine .cm-changedText{background:transparent!important}.\\37co .cm-deletedLine{text-decoration:line-through;background-color:#3c1f1e80;color:#fb4934;padding:1px 3px;border-radius:3px}.\\37co del.cm-deletedLine,.\\37co del,.\\37co del:not(:has(.cm-deletedText)){text-decoration:line-through;background-color:#3c1f1e80!important;color:#fb4934;padding:1px 3px;border-radius:3px;border:1px solid #fb493440}.\\37co del .cm-deletedText,.\\37co del .cm-changedText{background:transparent!important}.\\37co .cm-tooltip{background-color:#3c3836;border:1px solid #665c54;border-radius:4px;padding:4px 8px;box-shadow:0 2px 8px #0000004d}.\\37co .cm-tooltip-autocomplete>ul{background-color:#3c3836;border:none}.\\37co .cm-tooltip-autocomplete>ul>li{padding:4px 8px;line-height:1.3}.\\37co .cm-tooltip-autocomplete>ul>li[aria-selected]{background-color:#504945;color:#fbf1c7;border-radius:3px}.\\37co .cm-tooltip-autocomplete>ul>li>span.cm-completionIcon{color:#928374;padding-right:8px}.\\37co .cm-tooltip-autocomplete>ul>li>span.cm-completionDetail{color:#928374;font-style:italic}.\\37co .cm-tooltip .cm-tooltip-arrow:before{border-top-color:transparent;border-bottom-color:transparent}.\\37co .cm-tooltip .cm-tooltip-arrow:after{border-top-color:#3c3836;border-bottom-color:#3c3836}.\\37co .cm-diagnostic-error{border-left:3px solid #fb4934}.\\37co .cm-diagnostic-warning{border-left:3px solid #fabd2f}.\\37co .cm-diagnostic-info{border-left:3px solid #83a598}.\\37co .cm-lintPoint-error{border-bottom:2px wavy #fb4934}.\\37co .cm-lintPoint-warning{border-bottom:2px wavy #fabd2f}.\\37co .cm-matchingBracket{background-color:#504945cc;outline:1px solid #fabd2f;border-radius:2px}.\\37co .cm-nonmatchingBracket{background-color:#cc241d55;outline:1px solid #fb4934;border-radius:2px}.\\37co .cm-selectionMatch{background-color:#665c5480;outline:1px solid #665c54;border-radius:2px}.\\37co .cm-foldPlaceholder{background-color:#3c3836;color:#928374;border:1px dotted #665c54;border-radius:4px;padding:0 5px;margin:0 2px}.\\37co.cm-focused{outline:none;box-shadow:0 0 0 2px #282828,0 0 0 3px #fe801940}.\\37co .cm-scroller::-webkit-scrollbar{width:12px;height:12px}.\\37co .cm-scroller::-webkit-scrollbar-track{background:#3c3836}.\\37co .cm-scroller::-webkit-scrollbar-thumb{background-color:#665c54;border-radius:6px;border:3px solid #3c3836}.\\37co .cm-scroller::-webkit-scrollbar-thumb:hover{background-color:#7c6f64}.\\37co .cm-ghostText{opacity:.5;color:#928374}body{font-family:var(--font-family)}html,body{font-family:var(--theme-font-family);background-color:var(--theme-background-color)!important;color:var(--text-color)!important;width:100%;min-height:100%;height:100%;padding:0;margin:0}body:not(.production) *:not(:defined){border:1px solid red}.dark{filter:invert(1) hue-rotate(180deg)}.dark img,.dark dialog,.dark video,.dark iframe{filter:invert(1) hue-rotate(180deg)}html{font-size:14px}@media (max-width: 768px){html{font-size:18px}}@media (max-width: 480px){html{font-size:20px}}textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}:root{box-sizing:border-box;-moz-text-size-adjust:none;-webkit-text-size-adjust:none;text-size-adjust:none;line-height:1.2;-webkit-font-smoothing:antialiased}*,*:before,*:after{box-sizing:border-box}*{margin:0}body{-webkit-font-smoothing:antialiased;font-family:var(--font-family)}button,textarea,select{background-color:inherit;border-width:0;color:inherit}img,picture,video,canvas,svg{display:block;max-width:100%}input,button,textarea,select{font:inherit}p,h1,h2,h3,h4,h5,h6{font-family:var(--font-family);overflow-wrap:break-word}dialog::backdrop{background-color:#000c}*::-webkit-scrollbar{width:8px;margin-right:10px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{&:hover{scrollbar-color:rgba(154,153,150,.8) transparent}border-radius:10px;border:none}*::-webkit-scrollbar-button{background:transparent;color:transparent}*{scrollbar-width:thin;scrollbar-color:transparent transparent;&:hover{scrollbar-color:rgba(154,153,150,.8) transparent}}[full]{width:100%;height:100vh}[w-full]{width:100%}[grow]{flex-grow:1}[hide],.hide{display:none!important}[noscroll]{overflow:hidden}div [container]{display:flex}div [container][horizontal]{display:flex;flex-direction:col}.uix-list{display:flex;&[vertical]{flex-direction:column}}.uix-navbar{--uix-navbar-text-color: var(--color-default-90);--uix-navbar-hover-text-color: var(--color-surface-80);--uix-navbar-border-radius: 0px;--uix-navbar-border-color: var(--color-default-60);--uix-navbar-border-size: 1px;--uix-navbar-border-style: solid;--uix-navbar-hover-background-color: var(--color-default-40);--uix-container-position: var(--uix-navbar-position);display:flex;flex-direction:column;&[docked]{--uix-list-button-radius: 0;border-bottom:0;position:fixed;bottom:0;background-color:var(--uix-navbar-background-color, var(--color-default-5));>*{border-right:0;border-bottom:0;&:first-child{border-left:0}}}}:where(.uix-link){font-weight:var(--uix-link-font-weight, 600);width:var(--uix-link-width, auto);color:var(--uix-link-text-color, var(--colors-default-900));--uix-link-indent: 0;cursor:pointer;&[vertical]{margin:0 auto}a,button{width:inherit;cursor:pointer;padding:var(--uix-link-padding);&:hover{color:var(--uix-link-hover-color, var(--uix-link-text-color))}}.uix-text-icon__element{display:flex;align-items:center;gap:var(--uix-link-icon-gap, .5rem);&[reverse][vertical]{flex-direction:column-reverse}&:not([reverse])[vertical]{flex-direction:column}&[reverse]:not([vertical]){flex-direction:row-reverse}&:not([reverse]):not([vertical]){flex-direction:row}}transition:all .3s ease-in-out;&[indent]{>a,>button{padding-left:var(--uix-link-indent)}}&[active]:hover{color:var(--uix-link-hover-text-color, var(--colors-primary-400))}&[selectable][selected]{background-color:var(--colors-primary-400)}&:hover{[tooltip]{display:flex}}&[tooltip]{display:inline-block;&:hover{[tooltip]{visibility:visible}}[tooltip]{visibility:hidden;width:120px;background-color:#000;color:#fff;text-align:center;border-radius:6px;padding:5px 10px;margin-left:3px;position:absolute;z-index:1000000000;top:50%;left:100%;transform:translateY(-50%)}}&[position~=top] [tooltip]{bottom:100%;left:50%;transform:translate(-50%)}&[position~=bottom] [tooltip]{top:100%;left:50%;transform:translate(-50%)}&[position~=left] [tooltip]{top:50%;right:100%;transform:translateY(-50%)}&[tooltip],&[dropdown],&[context],&[float]{position:relative}&[dropdown],&[accordion]{flex-direction:column}[float],[dropdown],[accordion],[context]{display:none}&[floatopen]>a{display:none}&[floatopen] [float]{display:block;position:relative;bottom:0;right:0}&[context]{z-index:auto}[context][open]{display:flex;flex-direction:column}[dropdown],[context][open]{position:absolute;left:0;top:100%;width:100%;min-width:200px;z-index:1000;background-color:var(--colors-primary-100);box-shadow:0 8px 16px #0003;.uix-link:hover,input{background-color:var(--colors-primary-200)}>.uix-link{width:100%}}[context][open]{display:flex}&[selected]{[dropdown],[accordion]{display:flex;flex-direction:column}}}:where(.uix-button){border:var(--uix-button-borderSize, 0) solid var(--uix-button-borderColor);border-radius:var(--uix-button-borderRadius, var(--radius-md));box-shadow:var(--uix-button-shadow);width:var(--uix-button-width);min-width:fit-content;background-color:var(--uix-button-backgroundColor, black);color:var(--uix-button-textColor, var(--colors-default-100));font-weight:var(--uix-button-fontWeight, 700);display:flex;text-align:center;transition:transform .2s ease-in-out,opacity .2s ease-in-out,background-color .2s ease-in-out;&:hover{opacity:var(--uix-button-hover-opacity, .4)}&:active{transform:scale(.97)}>button,>a,>input{width:max-content;display:block;border-radius:inherit;cursor:var(--uix-button-cursor, pointer);height:calc(var(--spacing) * 10);line-height:calc(var(--spacing) * 5);padding:var( --uix-button-padding, calc(var(--spacing) * 2.5) calc(var(--spacing) * 4) );word-break:keep-all;flex-basis:100%}.uix-icon,button,input,a{cursor:pointer}&[bordered]{--uix-button-border-size: 1px;--uix-button-backgroundColor: transparent;--uix-button-hoverBackgroundColor: var(--_variant-color-300);--uix-button-borderColor: var(--_variant-color-400);--uix-button-textColor: var(--_variant-color-700)}&[ghost]{--uix-button-backgroundColor: transparent;--uix-button-hoverBackgroundColor: var(--_variant-color-300);--uix-button-borderSize: 0px;--uix-button-textColor: var(--_variant-color-700)}&[outline]{--uix-button-backgroundColor: transparent;--uix-button-hoverBackgroundColor: var(--_variant-color-300);--uix-button-textColor: var(--_variant-color-800);--uix-button-borderSize: 1px;--uix-button-borderColor: var(--_variant-color-400)}&[float]{background-color:#000;--uix-button-hoverBackgroundColor: var(--_variant-color-500);--uix-button-textColor: var(--_variant-color-50);--uix-button-borderSize: 0px;--uix-button-borderRadius: 9999px;--uix-button-width: var(--uix-button-height);box-shadow:var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / .1));--uix-button-padding: .5rem}&[float]:hover{box-shadow:var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / .1))}}:where(.uix-input){--uix-input-background-color: var(--colors-surface-100);--uix-input-border-color: var(--colors-gray-900);--uix-input-text-color: var(--colors-gray-900);--uix-input-placeholder-color: var(--colors-default-500);--uix-input-border-radius: var(--border-radius-md);--uix-input-border-width: 2px;--uix-input-padding-x: calc(var(--spacing) * 4);--uix-input-padding-y: calc(var(--spacing) * 2.5);--uix-input-font-size: var(--font-size-base);--uix-input-height: 2.5rem;--uix-input-disabled-opacity: .6;--uix-input-label-font-size: var(--font-size-sm);--uix-input-label-font-weight: var(--font-weight-bold);--uix-input-label-color: var(--colors-default-700);--uix-input-checkbox-size: 1.5rem;--uix-input-checkbox-border-radius: var(--border-radius-sm);--uix-input-checkbox-checked-bg: var(--colors-primary-600);--uix-input-checkbox-check-color: var(--colors-surface-100);width:100%;display:flex;flex-direction:column;input,select,textarea{width:100%;height:var(--uix-input-height);border-radius:var(--uix-input-border-radius);border:var(--uix-input-border-width) solid var(--uix-input-border-color);font-size:var(--uix-input-font-size);background-color:var(--uix-input-background-color);color:var(--uix-input-text-color);transition:var(--uix-transition);outline:none;padding:var(--uix-input-padding-y) var(--uix-input-padding-x)}textarea{resize:vertical}&:has(textarea){height:auto}select{appearance:none;-webkit-appearance:none;cursor:pointer;font-weight:600;padding-block:0;option{font-weight:600;background-color:var(--uix-input-background-color);font-size:1.1rem;line-height:1.5rem;color:#333;padding:50px;border:2px solid red}}.select-container{position:relative;.select-arrow{position:absolute;right:calc(2 * var(--spacing))}}input::placeholder{color:transparent}label{font-weight:var(--uix-input-label-font-weight);color:var(--uix-input-label-color, var(--colors-gray-600));margin-bottom:var(--spacing);font-size:.9rem;padding:0 4px;transition:all .2s ease-in-out;pointer-events:none;&[required]:after{content:"*";color:var(--colors-danger-500);margin-left:2px}}input:not(:placeholder-shown)+label,textarea:not(:placeholder-shown)+label,&:focus-within label,&.has-value label{top:-2px;transform:translateY(0);font-size:var(--uix-input-label-font-size)}&:focus-within input,&:focus-within select,&:focus-within textarea{box-shadow:0 0 var(--uix-input-focus-ring-width, 5px) var(--uix-input-focus-ring-color, rgba(0, 0, 255, .5))}&[disabled]{cursor:not-allowed;opacity:var(--uix-input-disabled-opacity);& label{cursor:not-allowed}}.input-icon,.select-arrow{position:absolute;top:50%;right:var(--spacing);transform:translateY(-50%);pointer-events:none;color:var(--uix-input-label-color);transition:transform .2s ease-in-out}&:has(select:hover:active) .select-arrow{transform:translateY(-50%) rotate(180deg)}&:has(.input-icon:not(.select-arrow))>input{padding-right:calc(var(--uix-input-padding-x) + 1.75em)}&[type=checkbox],&[type=radio]{flex-direction:row;align-items:center;border:0;height:auto;width:auto;background-color:transparent;box-shadow:none;gap:.75rem;cursor:pointer;label{margin:0;line-height:1.5rem;position:static;transform:none;background-color:transparent;padding:0;cursor:pointer;font-weight:var(--font-weight-normal);order:2;pointer-events:auto}input{appearance:none;-webkit-appearance:none;width:var(--uix-input-checkbox-size);height:var(--uix-input-checkbox-size);margin:0;border:var(--uix-input-border-width) solid var(--uix-input-border-color);background-color:var(--uix-input-background-color);cursor:pointer;position:relative;transition:var(--uix-transition);padding:0;&:after{content:"";position:absolute;display:none;left:50%;top:50%}&:checked{background-color:var(--uix-input-checkbox-checked-bg);border-color:var(--uix-input-checkbox-checked-bg);&:after{display:block}}&:focus-visible{box-shadow:0 0 0 var(--uix-input-focus-ring-width) var(--uix-input-focus-ring-color);border-color:var(--uix-input-focus-ring-color)}}}&[type=checkbox] input:after{width:.375rem;height:.75rem;border:solid var(--uix-input-checkbox-check-color);border-width:0 2px 2px 0;transform:translate(-50%,-60%) rotate(45deg)}&[type=radio] input{border-radius:var(--border-radius-full);&:after{width:calc(var(--uix-input-checkbox-size) / 2);height:calc(var(--uix-input-checkbox-size) / 2);border-radius:var(--border-radius-full);background-color:var(--uix-input-checkbox-check-color);transform:translate(-50%,-50%)}}&[ghost]{&:focus-within select{box-shadow:none}.select-arrow{margin-left:5px;padding-left:5px}select{background:inherit;border:0}}}:where(.uix-icon){display:inline-block;vertical-align:middle;width:1rem;height:1rem;svg{height:inherit;width:inherit}&[solid]{stroke:currentColor;fill:currentColor}}.app-template{.uix-card{button{color:#111;cursor:pointer}}}.uix-divider{--uix-divider-color: rgba(0, 0, 0, .05);--uix-divider-size: 2px;display:flex;align-items:center;justify-content:center;position:relative;padding:0;width:100%;height:var(--uix-divider-size);span{padding:0 .75rem;font-weight:700;font-size:var(--uix-divider-font-size, 1.5rem)}&[resizable]{cursor:row-resize;&[vertical]{cursor:col-resize}}&:before,&:after{content:"";flex-grow:1;height:var(--uix-divider-size);background-color:var(--uix-divider-color)}&[label]{padding:var(--uix-divider-padding, 1rem) 0}&[label]:before,&[label]:after{flex-grow:1}&[vertical]{flex-direction:column;width:1px;height:100%;background-color:transparent;&:before,&:after{width:1px;height:auto}&[label]{padding:0 var(--uix-divider-padding, 1rem)}}}.cm-scroller{overflow:auto!important}.cm-editor{width:100%}
`,metaType:"text/css"}};self.addEventListener("install",t=>t.waitUntil(self.skipWaiting())),self.addEventListener("activate",t=>t.waitUntil(self.clients.claim())),self.addEventListener("fetch",t=>{const n=new URL(t.request.url),e=FILE_BUNDLE[n.pathname];e&&t.respondWith(new Response(e.content,{headers:{"Content-Type":e.metaType||"application/javascript"}}))});
