const request = require('supertest');
const app = require('../app');

describe('Error ingestion', () => {
  it('creates a new error group', async () => {
    const res = await request(app)
      .post('/api/errors')
      .send({
        message: 'TypeError: undefined',
        stackTrace: 'app.js:10',
        environment: 'development'
      });

    expect(res.statusCode).toBe(200);
  });
});


it('groups identical errors', async () => {
  await request(app).post('/api/errors').send({
    message: 'TypeError',
    stackTrace: 'app.js:10',
    environment: 'development'
  });

  await request(app).post('/api/errors').send({
    message: 'TypeError',
    stackTrace: 'app.js:10',
    environment: 'development'
  });

  const res = await request(app)
    .get('/api/errors');

  expect(res.body.results.length).toBe(1);
  expect(res.body.results[0].count).toBe(2);
});


it('supports pagination', async () => {
  const res = await request(app)
    .get('/api/errors?page=1&limit=10');

  expect(res.body.results.length).toBeLessThanOrEqual(10);
});


it('filters by environment', async () => {
  const res = await request(app)
    .get('/api/errors?environment=development');

  res.body.results.forEach(err =>
    expect(err.environment).toBe('development')
  );
});


it('fails silently on invalid payload', async () => {
  const res = await request(app)
    .post('/api/errors')
    .send({});

  expect(res.statusCode).toBe(200);
});


it('rate limits ingestion', async () => {
  for (let i = 0; i < 1000; i++) {
    await request(app).post('/api/errors').send({
      message: 'Spam',
      stackTrace: 'spam.js',
      environment: 'dev'
    });
  }

  const res = await request(app).post('/api/errors').send({
    message: 'Spam',
    stackTrace: 'spam.js',
    environment: 'dev'
  });

  expect(res.statusCode).toBe(429);
});
