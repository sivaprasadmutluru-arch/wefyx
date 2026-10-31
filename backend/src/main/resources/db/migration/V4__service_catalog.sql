CREATE TABLE IF NOT EXISTS service_definitions (
 code VARCHAR(40) PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 description VARCHAR(1000) NOT NULL,
 base_price NUMERIC(10,2) NOT NULL,
 vat_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
 opening_hour INTEGER NOT NULL DEFAULT 9,
 closing_hour INTEGER NOT NULL DEFAULT 17,
 slot_minutes INTEGER NOT NULL DEFAULT 60,
 working_days VARCHAR(255) NOT NULL,
 advance_days INTEGER NOT NULL DEFAULT 90,
 active BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO service_definitions(code,name,description,base_price,vat_percent,working_days) VALUES
 ('SITE_VISIT','Site Visit Support','Our engineer will visit your office or site.',100,5,'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY'),
 ('REMOTE','Remote Support','Get remote assistance from our support team.',100,5,'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY'),
 ('GENERAL','General IT Support','Software, hardware, network, email and printer support.',100,5,'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY');
