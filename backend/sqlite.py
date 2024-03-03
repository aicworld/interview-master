# Since the scenario needs to have id, title, description, whether finished, progress, tags, total click times, winning chance,
# we need to modify the table structure and the sample data insertion accordingly.

import sqlite3

# Connect to SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect('app.db')  # Use in-memory database for demonstration
cursor = conn.cursor()

# Create a new table named scenarios with additional fields
cursor.execute('''
CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    finished BOOLEAN NOT NULL CHECK (finished IN (0,1)),
    progress INTEGER CHECK (progress BETWEEN 0 AND 100),
    tags TEXT,
    total_click_times INTEGER DEFAULT 0,
    winning_chance REAL CHECK (winning_chance BETWEEN 0 AND 1)
)
''')

# Insert sample data into the scenarios table with additional fields
sample_scenarios = [
    (1, 'Scenario 1', 'Description for scenario 1', False, 20, 'tag1,tag2', 5, 0.5),
    (2, 'Scenario 2', 'Description for scenario 2', True, 100, 'tag3,tag4', 10, 0.8),
    (3, 'Scenario 3', 'Description for scenario 3', False, 40, 'tag5,tag6', 2, 0.3)
]

# Since we're defining more columns, we specify them in the INSERT statement
cursor.executemany('''
    INSERT INTO scenarios (id, title, description, finished, progress, tags, total_click_times, winning_chance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', sample_scenarios)

# Commit changes and close the connection
conn.commit()
conn.close()

print('Database created and sample data inserted with additional fields.')
