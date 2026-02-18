var https = require('https');

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Parse Error', raw: data.substring(0, 100) });
                }
            });
        }).on('error', (err) => {
            resolve({ error: err.message });
        });
    });
}

async function compare() {
    console.log('Checking Health & Config...');

    console.log('\n--- SAHALCARD.COM ---');
    const sahal = await fetchJson('https://www.sahalcard.com/api/health-check');
    console.log(JSON.stringify(sahal, null, 2));

    console.log('\n--- MAANDHISE252 ---');
    const render = await fetchJson('https://maandhise252.onrender.com/api/health-check');
    console.log(JSON.stringify(render, null, 2));

    if (sahal.debug && render.debug) {
        if (sahal.debug.serverInstance !== render.debug.serverInstance) {
            console.log('\n[!] DIFFERENT SERVER INSTANCES');
        } else {
            console.log('\n[=] SAME SERVER INSTANCE (Unlikely if different domains)');
        }

        if (sahal.debug.dbHost !== render.debug.dbHost || sahal.debug.dbName !== render.debug.dbName) {
            console.log('\n[!!!] CRITICAL: DIFFERENT DATABASES DETECTED');
            console.log(`Sahal DB: ${sahal.debug.dbName} on ${sahal.debug.dbHost}`);
            console.log(`Render DB: ${render.debug.dbName} on ${render.debug.dbHost}`);
        } else {
            console.log('\n[=] SAME DATABASE CONNECTION');
        }
    }
}

compare();
