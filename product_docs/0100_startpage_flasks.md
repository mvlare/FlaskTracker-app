# Startpage Flasks

## Top-bar-Menu: 
In a row on the top starting at the left in yellow shows:
- first a flask icon, and then some space
Then  the option(s).
- Flasks
In the same at the right there is a button with "Sign in" 

## Canvas Flasks 

A canvas with multi-rows (default 15 rows) compact grid layout, showing flask information.
The colums are defined in chapter "columns in the mulit-row grid" 
The fields are read only. It can be ordered on Flask (name), Box (name). 
On entering it starts to fetch flasks ordered on flask name descending.
Use the standard shadcn as much as possible. Search, order icon.
Layout should be inspired by: https://datatables.net/examples/layout/grid.html
It should be possible to enter a field inside a row. use a yellow gradient row line selector.

### Top 
It has 2 search fields on the top. Search field for Flask name and one for Box name

### Bottom
At the bottom has buttons: 
New, Edit, Issue, Box, History. What is behind the button is for other steps.
It has a horizontal Pagination bar, to be able to go to next 15 rows

### columns in the multi-row grid
The multi-rows grid shows following fields in columns, as defined in a json structure:
```json
{ "items": 
   [ { "prompt": "Id", "db_field": "flasks.id", "char_length": 6 },
     { "prompt": "Flask", "db_field": "flasks.name", "char_length": 20 }, 
     { "prompt": "Box"  , "db_field": "boxes.name" , "char_length": 20
       "relation_lookup": [ "flasks", "box_content_lines", "box_content_header", "boxes" ] 
     },
    
     { "prompt": "Broken date"  , "db_field": "flasks.broken_at" , "Format": "YYY-MM-DD" },
     { "prompt": "Low pressure date"  , "db_field": "flasks.low_pressure_at" , "Format": "YYY-MM-DD" } 
   ] 
}
```

It should be possible to go up and down the rows with a up-down key stroke. 

### canvas remarks
There should be a canvas on the right next to the flasks to show the Remarks
(flasks.remarks) of the row (flask.id selected). it should be lenght 30 char and 15 cols high.



