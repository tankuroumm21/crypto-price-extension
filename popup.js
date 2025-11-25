document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  const symbolInput = document.getElementById('symbol-input');
  const resultArea = document.getElementById('result-area');
  const errorMessage = document.getElementById('error-message');
  const loading = document.getElementById('loading');

  // Elements to update
  const coinName = document.getElementById('coin-name');
  const coinSymbol = document.getElementById('coin-symbol');
  const coinImage = document.getElementById('coin-image');
  const priceJpy = document.getElementById('price-jpy');
  const priceUsd = document.getElementById('price-usd');
  const change24h = document.getElementById('change-24h');
  const change7d = document.getElementById('change-7d');
  const change30d = document.getElementById('change-30d');

  searchBtn.addEventListener('click', handleSearch);
  symbolInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  async function handleSearch() {
    const query = symbolInput.value.trim();
    if (!query) return;

    showLoading();
    hideError();
    resultArea.classList.add('hidden');

    try {
      // Step 1: Search for the coin ID by symbol
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${query}`;
      const searchResponse = await axios.get(searchUrl);
      
      const coins = searchResponse.data.coins;
      if (!coins || coins.length === 0) {
        throw new Error('通貨が見つかりませんでした。シンボルを確認してください。');
      }

      // Find exact match or take the first one
      // CoinGecko search returns many items. We try to match symbol exactly first.
      const exactMatch = coins.find(c => c.symbol.toLowerCase() === query.toLowerCase());
      const coinId = exactMatch ? exactMatch.id : coins[0].id;
      const coinThumb = exactMatch ? exactMatch.thumb : coins[0].thumb;
      const coinNameText = exactMatch ? exactMatch.name : coins[0].name;
      const coinSymbolText = exactMatch ? exactMatch.symbol : coins[0].symbol;

      // Step 2: Get price data
      // Use /coins/{id} for detailed data including 7d and 30d changes
      const detailsUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
      const detailsResponse = await axios.get(detailsUrl);
      const marketData = detailsResponse.data.market_data;

      if (!marketData) {
        throw new Error('価格データの取得に失敗しました。');
      }

      // Update UI
      coinName.textContent = coinNameText;
      coinSymbol.textContent = coinSymbolText;
      coinImage.src = coinThumb;
      coinImage.classList.remove('hidden');

      priceJpy.textContent = `¥${formatPrice(marketData.current_price.jpy)}`;
      priceUsd.textContent = `$${formatPrice(marketData.current_price.usd)}`;

      updateChange(change24h, marketData.price_change_percentage_24h);
      updateChange(change7d, marketData.price_change_percentage_7d);
      updateChange(change30d, marketData.price_change_percentage_30d);

      resultArea.classList.remove('hidden');
    } catch (error) {
      console.error(error);
      showError(error.message || 'エラーが発生しました。');
    } finally {
      hideLoading();
    }
  }

  function formatPrice(price) {
    if (price === undefined || price === null) return '---';
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function updateChange(element, value) {
    if (value === undefined || value === null) {
      element.textContent = '---';
      element.className = 'value';
      return;
    }
    const formatted = value.toFixed(2) + '%';
    element.textContent = (value > 0 ? '+' : '') + formatted;
    element.className = 'value ' + (value >= 0 ? 'positive' : 'negative');
  }

  function showLoading() {
    loading.classList.remove('hidden');
  }

  function hideLoading() {
    loading.classList.add('hidden');
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    errorMessage.classList.add('hidden');
  }
});
