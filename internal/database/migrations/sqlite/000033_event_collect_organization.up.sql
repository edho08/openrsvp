ALTER TABLE events ADD COLUMN collect_organization INTEGER NOT NULL DEFAULT 0;

UPDATE events
SET collect_organization = 1
WHERE id IN (
    SELECT event_id FROM invite_cards WHERE template_id = 'kasir-pintar-grand-opening'
);
