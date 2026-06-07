const express = require('express');
const genre = require('./routes/genre.js'); // Use require for CommonJS modules
const info = require('./routes/info.js');
const app = require('./routes/app.js');
const search = require('./routes/search.js');
const random = require('./routes/random.js');
const mix = require('./routes/mix.js');
const episode = require('./routes/episode.js');
const shedule = require('./routes/shedule.js');
const server = require('./routes/server.js');
const src = require('./routes/src1.js');

const inde = express();
const port = process.env.PORT || 3005;

inde.disable('x-powered-by');
inde.use(express.json());

inde.use('/api', genre);
inde.use('/api', info);
inde.use('/api', app);
inde.use('/api', search);
inde.use('/api', random);
inde.use('/api', mix);
inde.use('/api', episode);
inde.use('/api', shedule);
inde.use('/api', server);
inde.use('/api', src);

inde.get('/', (req, res) =>{
    res.json({ status: "ok", message: "Api is on service" });
});

inde.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

inde.use((error, req, res, _next) => {
    console.error('Unhandled API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
    inde.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = inde;
