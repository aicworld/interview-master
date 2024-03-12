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
    (1, 'Golang工程师模拟面试', 'Description for scenario 1', False, 0, '技术', 0, 0),
    (2, '产品经理模拟面试', 'Description for scenario 2', False, 0, '产品', 0, 0),
    (3, '运维工程师模拟面试', 'Description for scenario 3', False, 0, '技术', 0, 0),
    (4, 'UI模拟面试', 'Description for scenario 1', False, 0, '设计', 0, 0),
    (5, '前端模拟面试', 'Description for scenario 1', False, 0, '技术', 0, 0),
    (6, '道路工程师模拟面试', 'Description for scenario 1', False, 0, '工程', 0, 0),
    (7, '桥梁工程师模拟面试', 'Description for scenario 1', False, 0, '工程', 0, 0),
    (8, '排水工程师模拟面试', 'Description for scenario 1', False, 0, '工程', 0, 0),
]

# Since we're defining more columns, we specify them in the INSERT statement
cursor.executemany('''
    INSERT INTO scenarios (id, title, description, finished, progress, tags, total_click_times, winning_chance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', sample_scenarios)

# Commit changes and close the connection
conn.commit()
conn.close()

print('Database created and sample data inserted with additional fields.')
