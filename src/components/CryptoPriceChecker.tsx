import { useState } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils"; // 共通ユーティリティをインポート

interface PriceData {
  symbol: string;
  name: string;
  usdPrice: number;
  jpyPrice: number;
  change24h: number;
  change1w: number;
  change1m: number;
}

const PriceChange = ({ percentage, label }: { percentage: number; label: string }) => {
  const isPositive = percentage >= 0;
  const colorClass = isPositive ? "text-positive" : "text-destructive";
  const bgClass = isPositive ? "bg-positive/10" : "bg-destructive/10";

  return (
    <div className={cn("flex flex-col items-center p-1 rounded-md transition-all hover:scale-105", bgClass)}>
      <div className="flex items-center gap-1 mb-0">
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className={cn("text-sm font-bold", colorClass)}>
          {isPositive ? "+" : ""}{percentage.toFixed(2)}%
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
};

export const CryptoPriceChecker = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [dialogSymbol, setDialogSymbol] = useState("");

  const fetchPriceData = async (query: string, openDialog: boolean = true) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    if (openDialog) setOpen(true);

    try {
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${query}`;
      const searchResponse = await axios.get(searchUrl);

      const coins = searchResponse.data.coins;
      if (!coins || coins.length === 0) {
        throw new Error("通貨が見つかりませんでした。シンボルを確認してください。");
      }

      const exactMatch = coins.find((c: any) => c.symbol.toLowerCase() === query.toLowerCase());
      // 厳密一致を優先し、見つからなければ最初の結果を使用するようにロジックを統合
      const targetCoin = exactMatch || coins[0];
      const coinId = targetCoin.id;
      const coinNameText = targetCoin.name;
      const coinSymbolText = targetCoin.symbol;

      const detailsUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
      const detailsResponse = await axios.get(detailsUrl);

      const marketData = detailsResponse.data.market_data;
      if (!marketData) {
        throw new Error("価格データの取得に失敗しました。");
      }

      const priceData: PriceData = {
        symbol: coinSymbolText.toUpperCase(),
        name: coinNameText,
        usdPrice: marketData.current_price.usd || 0,
        jpyPrice: marketData.current_price.jpy || 0,
        change24h: marketData.price_change_percentage_24h || 0,
        change1w: marketData.price_change_percentage_7d || 0,
        change1m: marketData.price_change_percentage_30d || 0,
      };

      setData(priceData);
      // ダイアログが開かれたときの再検索フォームを空にする
      setDialogSymbol("");
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="シンボルを入力 (例: BTC)"
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground"
          onKeyPress={(e) => e.key === "Enter" && symbol.trim() && fetchPriceData(symbol)}
          autoFocus={true} // ポップアップ起動時に自動フォーカス
          lang="en" // IME/言語ヒント
          style={{ imeMode: 'disabled' }} // 非推奨だがIME無効化を試みる
        />
        <Button onClick={() => fetchPriceData(symbol)} disabled={loading || !symbol.trim()}>
          {loading ? "..." : "検索"}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/40" />

        <DialogContent
          className="
            sm:max-w-[600px] max-w-[90vw]
            fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            bg-gradient-card border-border/50 rounded-lg
            p-3
            h-[92vh]
            flex flex-col
            overflow-hidden
          "
        >
          {/* 内容をスクロールせず縦に収める */}
          <div className="flex flex-col gap-2 flex-1">

            {/* ローディング / エラー */}
            {loading && !data && (
              <div className="text-center py-6 text-muted-foreground">読み込み中...</div>
            )}

            {error && !data && (
              <div className="text-center py-6 text-destructive">{error}</div>
            )}

            {/* データ有り */}
            {data && (
              <div className="flex flex-col gap-2 items-center">

                <div className="text-2xl font-bold text-primary flex items-baseline gap-1">
                  <span>{data.symbol}</span>
                  <span className="text-sm text-muted-foreground font-normal">({data.name})</span>
                </div>

                {/* 価格 */}
                <div className="w-full border-y py-2 space-y-1">
                  <div className="flex justify-center gap-2 text-base">
                    <span className="text-xs text-muted-foreground">USD</span>
                    ${data.usdPrice.toLocaleString()}
                  </div>
                  <div className="flex justify-center gap-2 text-base">
                    <span className="text-xs text-muted-foreground">JPY</span>
                    ¥{data.jpyPrice.toLocaleString()}
                  </div>
                </div>

                {/* 変動率 */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <PriceChange percentage={data.change24h} label="24H" />
                  <PriceChange percentage={data.change1w} label="1W" />
                  <PriceChange percentage={data.change1m} label="1M" />
                </div>

                {/* 再検索 */}
                <div className="w-full border-t pt-1 mt-0">
                  <p className="text-xs text-center mb-1 font-semibold">別の通貨を検索</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dialogSymbol}
                      onChange={(e) => setDialogSymbol(e.target.value.toUpperCase())}
                      className="flex-1 px-2 py-1 border-2 border-primary rounded-md text-sm text-blue-700"
                    />
                    <Button size="sm" className="h-[32px]" onClick={() => fetchPriceData(dialogSymbol)}>
                      検索
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
