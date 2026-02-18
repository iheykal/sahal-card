var https = require('https');

async function fetchCompanies(url) {
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
    console.log('Fetching from sahalcard.com...');
    const sahal = await fetchCompanies('https://www.sahalcard.com/api/companies/public/all?limit=10');

    console.log('Fetching from maandhise252.onrender.com...');
    const render = await fetchCompanies('https://maandhise252.onrender.com/api/companies/public/all?limit=10');

    console.log('\n--- SAHALCARD.COM ---');
    if (sahal.data && sahal.data.companies) {
        console.log(`Count: ${sahal.data.companies.length}`);
        console.log('Top 3:', sahal.data.companies.slice(0, 3).map(c => c.businessName));
    } else {
        console.log('Error/Invalid:', sahal);
    }

    console.log('\n--- MAANDHISE252 ---');
    if (render.data && render.data.companies) {
        console.log(`Count: ${render.data.companies.length}`);
        console.log('Top 3:', render.data.companies.slice(0, 3).map(c => c.businessName));
    } else {
        console.log('Error/Invalid:', render);
    }
}

compare();
