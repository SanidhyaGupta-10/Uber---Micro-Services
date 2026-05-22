import http from 'http';
import app from './app.js';

const server = http.createServer(app);

server.listen(3002, () => {
    console.log('Captain Service is running on port 3002');
});