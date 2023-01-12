# 概要
このリポジトリは、NTT東日本のプログラミング大会「ALGORI」のUNO用対戦プログラム「Schlange」を管理するものです。

# ブランチ

## schlange

一番単純なヒューリスティックプレイヤです。
戦略は以下の通りです。

### チャレンジ

常にしない。

### 色の選択

手札中の一番多い色を選ぶ。

### 引いたカードの提出

合法なら常に提出する。

### カードの提出

- 優先順: 記号カード > 数字カード > シャッフルワイルド = 白いワイルド > ワイルド > ワイルドドロー4 > カードを引く。
- 数字カードは、書いてある数字の大きいものを優先する。
- 優先順位が最高のものが複数あれば、手札に先に追加されたものを出す。

# 使い方

## dockerの場合

1. ビルドする。

```bash
$ docker bulid -t uno-player .
```

2. 実行する。

`"http://localhost:8080/", "Dealer 1", "Player 1"`
の部分は、それぞれ接続先アドレス、ディーラ名、プレイヤ名をご自身の環境等に合わせて書き換えてください。


```bash
# Windows/Mac環境での実行
$ docker run uno-player "http://host.docker.internal:8080" "Dealer 1" "Player 1"

# Linux環境での実行
$ docker run --add-host=host.docker.internal:host-gateway uno-player "http://host.docker.internal:8080" "Dealer 1" "Player 1"
```
