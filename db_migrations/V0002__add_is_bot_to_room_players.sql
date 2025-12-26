ALTER TABLE t_p97186151_mafia_mobile_version.room_players 
ADD COLUMN is_bot BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN t_p97186151_mafia_mobile_version.room_players.is_bot IS 'Является ли игрок ботом';