const axios = require('axios').default;
const path = require('path');
const gateway = require('express-gateway');
const express = require('express');

let Application = undefined;
let axiosInstance = undefined;

beforeAll((done) => {
  axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/',
    validateStatus: () => true
  });

  const app = express();

  app.get('/status/:code', (req, res) => res.sendStatus(req.params.code));

  Application = app.listen(8081, done);

});

afterAll((done) => {
  Application.close(done);
})

describe('Prometheus metrics', () => {
  beforeAll(() => Promise.all([
    axiosInstance.get('/status/200'),
    axiosInstance.get('/status/404'),
    axiosInstance.get('/status/500'),
  ]));

  it('should return metrics in prometheus format', () => {
    return axios
      .get('http://localhost:9876/metrics')
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
  });

  it('should return metrics in JSON format', () => {
    return axios
      .get('http://localhost:9876/metrics', { headers: { 'Accept': 'application/json' } })
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
  });

});
