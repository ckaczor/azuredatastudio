/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Range } from 'vs/editor/common/core/range';
import { Position } from 'vs/editor/common/core/position';
import { Selection } from 'vs/editor/common/core/selection';
import { ICommand, ICursorStateComputerData, IEditOperationBuilder } from 'vs/editor/common/editorCommon';
import { ITextModel } from 'vs/editor/common/model';

export class SurroundSelectionCommand implements ICommand {
	private readonly _range: Selection;
	private readonly _charBeforeSelection: string;
	private readonly _charAfterSelection: string;

	constructor(range: Selection, charBeforeSelection: string, charAfterSelection: string) {
		this._range = range;
		this._charBeforeSelection = charBeforeSelection;
		this._charAfterSelection = charAfterSelection;
	}

	public getEditOperations(model: ITextModel, builder: IEditOperationBuilder): void {
		builder.addTrackedEditOperation(new Range(
			this._range.startLineNumber,
			this._range.startColumn,
			this._range.startLineNumber,
			this._range.startColumn
		), this._charBeforeSelection);

		builder.addTrackedEditOperation(new Range(
			this._range.endLineNumber,
			this._range.endColumn,
			this._range.endLineNumber,
			this._range.endColumn
		), this._charAfterSelection);
	}

	public computeCursorState(model: ITextModel, helper: ICursorStateComputerData): Selection {
		const inverseEditOperations = helper.getInverseEditOperations();
		const firstOperationRange = inverseEditOperations[0].range;
		const secondOperationRange = inverseEditOperations[1].range;

		return new Selection(
			firstOperationRange.endLineNumber,
			firstOperationRange.endColumn,
			secondOperationRange.endLineNumber,
			secondOperationRange.endColumn - this._charAfterSelection.length
		);
	}
}

/**
 * A surround selection command that runs after composition finished.
 */
export class CompositionSurroundSelectionCommand implements ICommand {

	constructor(
		private readonly _position: Position,
		private readonly _text: string,
		private readonly _charAfter: string
	) { }

	public getEditOperations(model: ITextModel, builder: IEditOperationBuilder): void {
		builder.addTrackedEditOperation(new Range(
			this._position.lineNumber,
			this._position.column,
			this._position.lineNumber,
			this._position.column
		), this._text + this._charAfter);
	}

	public computeCursorState(model: ITextModel, helper: ICursorStateComputerData): Selection {
		const inverseEditOperations = helper.getInverseEditOperations();
		const opRange = inverseEditOperations[0].range;

		return new Selection(
			opRange.endLineNumber,
			opRange.startColumn,
			opRange.endLineNumber,
			opRange.endColumn - this._charAfter.length
		);
	}
}
