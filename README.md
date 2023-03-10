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

## drachen

schlangeにいくつか戦略を追加したヒューリスティックプレイヤです。
戦略は以下の通りです。

### チャレンジ

常にしない。

### 色の選択

手札中の一番多い色を選ぶ。

### 引いたカードの提出

- ワイルドドロー4の反則はしない。
- 合法なら常に提出する。

### カードの提出

- ワイルドドロー4の反則はしない。

- 手札が少ないプレイヤがいる
    - 手札にワイルドドロー4がある OR 自分の手札が多い
        - シャッフルワイルドがある
            - シャッフルワイルドを出す。
    - **妨害手**が出せる
        - **妨害手**を出す。
- 自分の**勝つ見込み**が少ない
    - 減点の大きい手から出す。
- 自分の手札の**色が偏っていて**、その色が場の色と異なる
    - ワイルドを持っている
        - ワイルドを出す。
- **通常手**を出す。

### 諸定義

#### 妨害手

- 次プレイヤの手札が少なく、その次のプレイヤの手札が少なくない
    - ワイルドドロー4 > 白いワイルド(バインド2) > ドロー2 > スキップ。
- 次プレイヤの手札が少なく、前プレイヤの手札が少なくない
    - リバース。

#### 勝つ見込み

自分の手札が多く、相手の内2人の手札が少ないなら、勝つ見込みが少ない。

#### 色が偏っている

手札が5枚以上で、手札中の一番多い色の枚数が、手札の50%以上。

#### 通常手

次の優先順位でカードを出す。

1. 手札中に同じ色のカードがどれだけ多く存在するか。
2. 手札中に同じ模様のカードがどれだけ多く存在するか。
3. 記号カード: 順番はテキトー。
4. 数字カード: 数字が大きい順。
5. ワイルド系: 順番はテキトー。

# 使い方

## dockerの場合

1. ビルドする。

```
docker bulid schlange .
```

2. 実行する。

`"http://localhost:8080/", "Dealer 1", "Player 1"`
の部分は、それぞれ接続先アドレス、ディーラ名、プレイヤ名をご自身の環境等に合わせて書き換えてください。

```
docker run -p 8080:8080 schlange "http://localhost:8080/", "Dealer 1", "Player 1"
```
