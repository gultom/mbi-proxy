const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');

const app = express();

// Middleware to check if the request fails and redirect to alternate URL
app.use('/', async (req, res, next) => {
    const farm = req.query.farm;
    if (!farm) {
        return res.status(400).send('No farm defined');
    }
    const targetUrl     = 'https://' + farm + '-blue.vynamic-uat-1.apps.ocp-uat.maybank.co.id';
    const alternateUrl  = 'https://' + farm + '-green.vynamic-uat-1.apps.ocp-uat.maybank.co.id';
    try {
        // Create an HTTP request to check if the target URL is accessible
        const request = await http.get(targetUrl, (response) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                // If the target URL is accessible, proceed with the proxy
                createProxyMiddleware({
                    target: targetUrl,
                    changeOrigin: true,
                    secure: false,
                })(req, res, next);
            } else {
                // If the target URL is not accessible, redirect to the alternate URL
                console.log(`Target URL returned status ${response.statusCode}, redirecting to ${alternateUrl}`);
                res.redirect(alternateUrl);
            }
        });

        request.on('error', () => {
            // If there is an error (e.g., target URL is unreachable), redirect to the alternate URL
            console.log(`Error accessing target URL, redirecting to ${alternateUrl}`);
            res.redirect(alternateUrl);
        });
    } catch (err) {
        // If an exception occurs, redirect to the alternate URL
        console.error('An unexpected error occurred:', err);
        res.redirect(alternateUrl);
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
