export interface GridColumn {
	prompt: string;
	db_field: string;
	char_length?: number;
	format?: string;
	relation_lookup?: string[];
}

export const flasksGridColumns: GridColumn[] = [
	{ prompt: 'Id', db_field: 'flasks.id', char_length: 6 },
	{ prompt: 'Flask', db_field: 'flasks.name', char_length: 20 },
	{
		prompt: 'Box',
		db_field: 'boxes.name',
		char_length: 20,
		relation_lookup: ['flasks', 'box_content_lines', 'box_content_headers', 'boxes']
	},
	{ prompt: 'Broken date', db_field: 'flasks.broken_at', format: 'YYYY-MM-DD' },
	{ prompt: 'Low pressure date', db_field: 'flasks.low_pressure_at', format: 'YYYY-MM-DD' }
];
