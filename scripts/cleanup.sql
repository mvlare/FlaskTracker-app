BEGIN;

  TRUNCATE TABLE 
    box_content_lines,  
    flasks_ref,
    flask_low_pressure_events,
    box_content_headers,
    boxes,
    flasks
  RESTART IDENTITY;

COMMIT;