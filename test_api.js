const axios = require('axios');

async function testApi(symbol) {
    console.log(`Testing for symbol: ${symbol}`);
    try {
        // Step 1: Search
        const searchUrl = `https://api.coingecko.com/api/v3/search?query=${symbol}`;
        console.log(`Fetching ${searchUrl}...`);
        const searchResponse = await axios.get(searchUrl);

        const coins = searchResponse.data.coins;
        if (!coins || coins.length === 0) {
            console.error('No coins found.');
            return;
        }

        const exactMatch = coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
        const coinId = exactMatch ? exactMatch.id : coins[0].id;
        console.log(`Found coin ID: ${coinId}`);

        // Step 2: Details
        const detailsUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        console.log(`Fetching ${detailsUrl}...`);
        const detailsResponse = await axios.get(detailsUrl);
        const marketData = detailsResponse.data.market_data;

        if (!marketData) {
            console.error('No market data found.');
            return;
        }

        console.log('--- Results ---');
        console.log(`Name: ${detailsResponse.data.name}`);
        console.log(`Price JPY: ¥${marketData.current_price.jpy}`);
        console.log(`Price USD: $${marketData.current_price.usd}`);
        console.log(`24h Change: ${marketData.price_change_percentage_24h}%`);
        console.log(`7d Change: ${marketData.price_change_percentage_7d}%`);
        console.log(`30d Change: ${marketData.price_change_percentage_30d}%`);
        console.log('--- Success ---');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testApi('BTC');
