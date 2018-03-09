const metrics = require('prom-client');

const statusCodeCounter = new metrics.Counter({
  name: 'status_codes',
  help: 'status_code_counter',
  labelNames: ['type', 'status_code', 'consumer', 'apiendpoint']
});

const plugin = {
  version: '1.0.0',
  policies: ['metrics'],
  schema: {
    $id: 'http://express-gateway.io/policies/metrics-plugin.json',
    type: 'object',
    properties: {
      endpointName: {
        type: 'string',
        default: '/metrics'
      }
    }, required: ['endpointName']
  },
  init: function (pluginContext) {
    pluginContext.registerAdminRoute((app) => {
      app.get(pluginContext.settings.endpointName, (req, res) => {
        if (req.accepts(metrics.register.contentType)) {
          res.contentType(metrics.register.contentType);
          return res.send(metrics.register.metrics());
        }

        return res.json(metrics.register.getMetricsAsJSON());
      });
    });

    pluginContext.registerPolicy({
      schema: {
        $id: 'http://express-gateway.io/policies/metrics-policy.json',
        type: 'object',
        properties: {
          consumerIdHeaderName: {
            type: 'string',
            default: 'eg-consumer-id'
          }
        }
      },
      name: 'metrics',
      policy: ({ consumerIdHeaderName }) => (req, res, next) => {
        const apiEndpoint = req.egContext.apiEndpoint.apiEndpointName;
        const consumerHeader = req.header(consumerIdHeaderName) || 'anonymous';

        res.once('finish', () => {
          const statusCode = res.statusCode.toString();
          const responseType = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED';
          statusCodeCounter.labels(responseType, statusCode, consumerHeader, apiEndpoint).inc();
        });

        next();
      }
    });
  }
};

module.exports = plugin;
