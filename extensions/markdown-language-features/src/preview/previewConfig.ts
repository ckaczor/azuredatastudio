/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { equals } from '../util/arrays';

export class MarkdownPreviewConfiguration {
	public static getForResource(resource: vscode.Uri) {
		return new MarkdownPreviewConfiguration(resource);
	}

	public readonly scrollBeyondLastLine: boolean;
	public readonly wordWrap: boolean;
	public readonly lineBreaks: boolean;
	public readonly doubleClickToSwitchToEditor: boolean;
	public readonly scrollEditorWithPreview: boolean;
	public readonly scrollPreviewWithEditor: boolean;
	public readonly markEditorSelection: boolean;

	public readonly lineHeight: number;
	public readonly fontSize: number;
	public readonly fontFamily: string | undefined;
	public readonly styles: readonly string[];

	private constructor(resource: vscode.Uri) {
		const editorConfig = vscode.workspace.getConfiguration('editor', resource);
		const markdownConfig = vscode.workspace.getConfiguration('markdown', resource);
		const markdownEditorConfig = vscode.workspace.getConfiguration('[markdown]', resource);

		this.scrollBeyondLastLine = editorConfig.get<boolean>('scrollBeyondLastLine', false);

		this.wordWrap = editorConfig.get<string>('wordWrap', 'off') !== 'off';
		if (markdownEditorConfig && markdownEditorConfig['editor.wordWrap']) {
			this.wordWrap = markdownEditorConfig['editor.wordWrap'] !== 'off';
		}

		this.scrollPreviewWithEditor = !!markdownConfig.get<boolean>('preview.scrollPreviewWithEditor', true);
		this.scrollEditorWithPreview = !!markdownConfig.get<boolean>('preview.scrollEditorWithPreview', true);
		this.lineBreaks = !!markdownConfig.get<boolean>('preview.breaks', false);
		this.doubleClickToSwitchToEditor = !!markdownConfig.get<boolean>('preview.doubleClickToSwitchToEditor', true);
		this.markEditorSelection = !!markdownConfig.get<boolean>('preview.markEditorSelection', true);

		this.fontFamily = markdownConfig.get<string | undefined>('preview.fontFamily', undefined);
		this.fontSize = Math.max(8, +markdownConfig.get<number>('preview.fontSize', NaN));
		this.lineHeight = Math.max(0.6, +markdownConfig.get<number>('preview.lineHeight', NaN));

		this.styles = markdownConfig.get<string[]>('styles', []);
	}

	public isEqualTo(otherConfig: MarkdownPreviewConfiguration) {
		for (const key in this) {
			if (this.hasOwnProperty(key) && key !== 'styles') {
				if (this[key] !== otherConfig[key]) {
					return false;
				}
			}
		}

		return equals(this.styles, otherConfig.styles);
	}

	[key: string]: any;
}

export class MarkdownPreviewConfigurationManager {
	private readonly _previewConfigurationsForWorkspaces = new Map<string, MarkdownPreviewConfiguration>();

	public loadAndCacheConfiguration(
		resource: vscode.Uri
	): MarkdownPreviewConfiguration {
		const config = MarkdownPreviewConfiguration.getForResource(resource);
		this._previewConfigurationsForWorkspaces.set(this._getKey(resource), config);
		return config;
	}

	public hasConfigurationChanged(
		resource: vscode.Uri
	): boolean {
		const key = this._getKey(resource);
		const currentConfig = this._previewConfigurationsForWorkspaces.get(key);
		const newConfig = MarkdownPreviewConfiguration.getForResource(resource);
		return (!currentConfig || !currentConfig.isEqualTo(newConfig));
	}

	private _getKey(
		resource: vscode.Uri
	): string {
		const folder = vscode.workspace.getWorkspaceFolder(resource);
		return folder ? folder.uri.toString() : '';
	}
}
