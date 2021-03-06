BEGIN;

DROP TABLE IF EXISTS users, dishes, dietary, connections;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  gitterhandle VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  DateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  makerID INT REFERENCES users(id) ON DELETE CASCADE,
  DateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dietary (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  DateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connections (
  id SERIAL PRIMARY KEY,
  dish_id INT REFERENCES dishes(id) ON DELETE CASCADE,
  dietary_id INT REFERENCES dietary(id) ON DELETE CASCADE,
  DateCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, gitterhandle, password) VALUES ('Natalie', '@njseeto', '$2a$10$f9bHlm5g5AEg6cg/gcTMm.HTVYd9m2Kg2yPLpR9.JvWi8RFTOJm.i');

INSERT INTO dishes (name, makerID) VALUES ('Vegan Gingerbread People', (SELECT id FROM users WHERE gitterhandle = '@njseeto'));

INSERT INTO dietary (name) VALUES ('vegan'), ('nutfree'), ('vegetarian'), ('glutenfree'), ('dairyfree'), ('halal'), ('none of the above');

INSERT INTO connections (dish_id, dietary_id) VALUES ((SELECT id FROM dishes WHERE name = 'Vegan Gingerbread People'),(SELECT id FROM dietary WHERE name = 'vegan')), ((SELECT id FROM dishes WHERE name = 'Vegan Gingerbread People'),(SELECT id FROM dietary WHERE name = 'nutfree'));

COMMIT;
