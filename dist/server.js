"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const graphqlHTTP = require("express-graphql");
const React = require("react");
const react_router_dom_1 = require("react-router-dom");
const swig = require("swig");
const favicon = require("serve-favicon");
const compression = require("compression");
const apicache = require("apicache");
const app_1 = require("./app/components/app");
const cacheManager_1 = require("./data/cacheManager");
const systemSetting_1 = require("./configs/systemSetting");
const forceSSL_1 = require("./helper/forceSSL");
const db_1 = require("./data/db");
const scheduler_1 = require("./backgroundService/scheduler");
const schema_1 = require("./data/schema");
const react_apollo_1 = require("react-apollo");
const apollo_local_query_1 = require("apollo-local-query");
const graphql = require("graphql");
const redis = require("redis");
const app = express();
app.use(forceSSL_1.default());
app.use(compression());
app.get('/api/test', (req, res) => {
    res.send('test!');
});
app.get('/api/crawlerStatus', (req, res) => {
    db_1.db.getDocument({ name: "crawlerStatus" }, "configs").then(c => res.send(c));
});
app.get('/api/cache/index', (req, res) => {
    res.json(apicache.getIndex());
});
//static content
const staticRoot = path.join(__dirname, 'public/');
app.use('/public', express.static(staticRoot, { maxAge: '1d' }));
app.use('/service-worker.js', express.static(staticRoot + 'bundles/service-worker.js', { maxAge: '1d' }));
app.use(favicon(path.join(__dirname, 'public', 'favicons', 'favicon.ico')));
//request below will be cache
// app.use(device.capture());
const redisClient = redis.createClient(process.env.REDIS_URL).on("error", function (err) {
    console.log("Error " + err);
});
const basicCacheOption = { debug: true, enabled: systemSetting_1.systemSetting.isProduction || true, redisClient };
const basicCache = apicache.options(basicCacheOption).middleware('1 hour');
const graphqlCache = apicache.newInstance(Object.assign({}, basicCacheOption, { appendKey: ["cacheKey"] })).middleware('1 hour');
app.use(bodyParser.json());
app.use('/graphql', (req, res, next) => {
    req['cacheKey'] = req.body.operationName + JSON.stringify(req.body.variables);
    next();
});
app.use('/graphql', graphqlCache, graphqlHTTP({ schema: schema_1.default, pretty: systemSetting_1.systemSetting.enableGraphiql, graphiql: systemSetting_1.systemSetting.enableGraphiql, }));
app.use(basicCache, function (req, res) {
    global.navigator = { userAgent: req.headers['user-agent'] };
    const client = new react_apollo_1.ApolloClient({
        ssrMode: true,
        networkInterface: apollo_local_query_1.createLocalInterface(graphql, schema_1.default),
    });
    const context = {};
    const app = (React.createElement(react_apollo_1.ApolloProvider, { client: client },
        React.createElement(react_router_dom_1.StaticRouter, { location: req.url, context: context },
            React.createElement(app_1.default, null))));
    react_apollo_1.renderToStringWithData(app).then(content => {
        const initialState = { apollo: client.getInitialState() };
        const page = swig.renderFile(staticRoot + 'bundles/index.html', {
            html: content,
            apolloState: `<script>window.__APOLLO_STATE__=${JSON.stringify(initialState).replace(/</g, '\\u003c')};</script>`
        });
        res.status(200).send(page);
    });
});
const port = process.env.PORT || 3003;
db_1.db.openDbConnection()
    .then(cacheManager_1.default.init)
    .then(() => app.listen(port, function () {
    console.log('app running on port', port);
}))
    .then(scheduler_1.initScheduler);
//# sourceMappingURL=server.js.map