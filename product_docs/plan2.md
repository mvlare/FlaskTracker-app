# Plan 2

First some adjustements/approvements

## Tasks

[ ] Put the column names in $lib/config/flasksGridColumns.ts and adjust the code.
[ ] Remove the labels Flask name and Box name, because the labels are clear
[ ] Default search flask context with prefix: UU-1-.
[ ] On Search of flask: when search flask name is empty or containts UU-1- there should be no filter.
[ ] Prompts "Id" "Broken Date"	"Low Pressure Date" should be in initCAP like Flask
[ ] Should be possible to enter Remarks with a Tab. 
[ ] Make Remarks updatable for the flask selected. With a save button.
[ ] Remove edit buttons for now.
[ ] Use https://lucide.dev/icons/flask-conical as icon for the flask in the top bar. 
[ ] Use /product_docs/flask_imau.png to create a custom extra icon style of picture and place left next to "Flask Tracking System" 
[ ] src\lib\components\flasks\FlasksGrid.svelte. solve: 
'page' is deprecated. @deprecated — Use page from $app/state instead (requires Svelte 5
[ ]  src\lib\components\flasks\Pagination.svelte. Solve:
'page' is deprecated. @deprecated — Use page from $app/state instead (requires Svelte 5
[ ] Solve:
[{
	"resource": "/c:/Projects/FlaskTracker/FlaskTracker-app/src/lib/components/flasks/FlasksGrid.svelte",
	"owner": "tailwindcss-intellisense",
	"code": "suggestCanonicalClasses",
	"severity": 4,
	"message": "The class `bg-gradient-to-r` can be written as `bg-linear-to-r`",
	"startLineNumber": 157,
	"startColumn": 11,
	"endLineNumber": 157,
	"endColumn": 27,
	"modelVersionId": 1,
	"origin": "extHost1"
}]
[ ] Solve:
[{
	"resource": "/c:/Projects/FlaskTracker/FlaskTracker-app/src/lib/components/flasks/Pagination.svelte",
	"owner": "tailwindcss-intellisense",
	"code": "cssConflict",
	"severity": 4,
	"message": "'focus-visible:outline' applies the same CSS properties as 'focus-visible:outline-2'.",
	"startLineNumber": 70,
	"startColumn": 53,
	"endLineNumber": 70,
	"endColumn": 74,
	"relatedInformation": [
		{
			"startLineNumber": 70,
			"startColumn": 75,
			"endLineNumber": 70,
			"endColumn": 98,
			"message": "focus-visible:outline-2",
			"resource": "/c:/Projects/FlaskTracker/FlaskTracker-app/src/lib/components/flasks/Pagination.svelte"
		}
	],
	"modelVersionId": 1,
	"origin": "extHost1"
},{
	"resource": "/c:/Projects/FlaskTracker/FlaskTracker-app/src/lib/components/flasks/Pagination.svelte",
	"owner": "tailwindcss-intellisense",
	"code": "cssConflict",
	"severity": 4,
	"message": "'focus-visible:outline-2' applies the same CSS properties as 'focus-visible:outline'.",
	"startLineNumber": 70,
	"startColumn": 75,
	"endLineNumber": 70,
	"endColumn": 98,
	"relatedInformation": [
		{
			"startLineNumber": 70,
			"startColumn": 53,
			"endLineNumber": 70,
			"endColumn": 74,
			"message": "focus-visible:outline",
			"resource": "/c:/Projects/FlaskTracker/FlaskTracker-app/src/lib/components/flasks/Pagination.svelte"
		}
	],
	"modelVersionId": 1,
	"origin": "extHost1"
}]
