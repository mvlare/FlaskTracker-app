Watch-outs honored in Migration 0002: Initial fixes:
  - flasks.lowPressureAt maps to DB column 'Low_pressure_at' (capital L)   
  - flaskRefType.name is nullable (no .notNull()) — matches the SQL        
  - flasksRef.flaskRefTypeId is a nullable FK — no .notNull()

