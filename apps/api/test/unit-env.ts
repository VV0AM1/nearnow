// Unit tests never touch a database; modules only need a syntactically present URL.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://unit-test@localhost:1/none';
