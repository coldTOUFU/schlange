import assert from 'assert'
import { UnoConsts } from "./consts";
import { UnoPlayerInterface } from "./player_interface";
import { UnoUtils } from "./utils";

export class Drachen implements UnoPlayerInterface.PlayerInterface {
  /* on**系のメソッドは、何かのメッセージを受信したときに呼ばれる処理。 */

  public onReceivedJoinRoom(msg: UnoConsts.Event.Message.Receive.JoinRoom): void {;}

  /* プレイヤIDを記憶。 */
  public onRespondJoinRoom(msg: UnoConsts.Event.Message.Response.JoinRoom): void {
    this.myPlayerId = msg.your_id;
  }

  /* カードを出したのが自分なら、着手が受理されたということで自分の手札から該当カードを除去。 */
  public onReceivedPlayCard(msg: UnoConsts.Event.Message.Receive.PlayCard): void {
    if (msg.player !== this.myPlayerId) { return; }

    this.removeCard(msg.card_play);
  }

  /* カードを引いたのが自分なら、カードを出せるかどうかを記憶する。 */
  public onReceivedDrawCard(msg: UnoConsts.Event.Message.Receive.DrawCard): void {
    if (msg.player === this.myPlayerId) {
      this.canSubmitDrawnCard = msg.can_play_draw_card;
    }
  }

  /* 引いたカードを出したのが自分なら、着手が受理されたということで自分の手札から該当カードを除去。 */
  public onReceivedPlayDrawCard(msg: UnoConsts.Event.Message.Receive.PlayDrawCard): void {
    if (msg.player === this.myPlayerId && msg.is_play_card) {
      this.removeCard(msg.card_play);
    }
  }

  public onReceivedChallenge(msg: UnoConsts.Event.Message.Receive.Challenge): void {;}

  /* カードを出したのが自分なら、着手が受理されたということで自分の手札から該当カードを除去。 */
  public onReceivedSayUnoAndPlayCard(msg: UnoConsts.Event.Message.Receive.SayUnoAndPlayCard): void {
    if (msg.player !== this.myPlayerId) { return; }

    this.removeCard(msg.card_play);
  }

  public onReceivedSayUnoAndPlayDrawCard(msg: UnoConsts.Event.Message.Receive.SayUnoAndPlayDrawCard): void {
    if (msg.player !== this.myPlayerId) { return; }

    this.removeCard(msg.card_play);
  }

  public onReceivedPointedNotSayUno(msg: UnoConsts.Event.Message.Receive.PointedNotSayUno): void {;}

  /* カードを受け取ったら、自分の手札に追加する。 */
  public onReceivedReceiverCard(msg: UnoConsts.Event.Message.Receive.ReceiverCard): void {
    this.myCards = this.myCards.concat(msg.cards_receive);
  }

  public onReceivedFirstPlayer(msg: UnoConsts.Event.Message.Receive.FirstPlayer): void {
    this.playOrder = msg.play_order;
    this.myIdxOnOrder = this.playOrder.indexOf(this.myPlayerId);
  }

  public onReceivedColorOfWild(msg: UnoConsts.Event.Message.Receive.ColorOfWild): void {;}

  /* シャッフルワイルド発動後、配りなおされたカードを自分の手札にする。 */
  public onReceivedShuffleWild(msg: UnoConsts.Event.Message.Receive.ShuffleWild): void {
    this.myCards = msg.cards_receive;
  }

  /* カードを引かなければならない場合はなにもしなくてよい。それ以外の場合、場のカードから合法手を作る。 */
  /* その後、出すべきカードを決める。 */
  public onReceivedNextPlayer(msg: UnoConsts.Event.Message.Receive.NextPlayer): void {
    if (msg.must_call_draw_card) { return; }

    this.setLegalSubmissions(msg.card_before);

    if (this.legalSubmissions.length === 0) {
      this.bestHand = null;
      return;
    }

    if (this.legalSubmissions.length === 1) {
      this.bestHand = this.legalSubmissions[0];
      return;
    }

    this.bestHand = this.bestSubmission(msg);    
  }

  public onReceivedPublicCard(msg: UnoConsts.Event.Message.Receive.PublicCard): void {;}

  /* ラウンドが終わったので、手札を空にする。 */
  public onReceivedFinishTurn(msg: UnoConsts.Event.Message.Receive.FinishTurn): void {
    this.myCards = [];
  }

  public onReceivedFinishGame(msg: UnoConsts.Event.Message.Receive.FinishGame): void {;}

  public changeColor(): UnoConsts.Color {
    /* 手札中の一番多い色を選ぶ。 */
    const countColors = this.countColors();
    let maxQuantity = countColors[UnoConsts.Color.Red];
    let bestColor = UnoConsts.Color.Red;
    if (countColors[UnoConsts.Color.Yellow] > maxQuantity) {
      maxQuantity = countColors[UnoConsts.Color.Yellow];
      bestColor = UnoConsts.Color.Yellow;
    }
    if (countColors[UnoConsts.Color.Green] > maxQuantity) {
      maxQuantity = countColors[UnoConsts.Color.Green];
      bestColor = UnoConsts.Color.Green;
    }
    if (countColors[UnoConsts.Color.Blue] > maxQuantity) {
      maxQuantity = countColors[UnoConsts.Color.Blue];
      bestColor = UnoConsts.Color.Blue;
    }
    return bestColor;
  }

  /* 出せる場合は引いたカードを出す。 */
  public willSubmitDrawnCard(): boolean {
    if (!this.canSubmitDrawnCard) { return false; }
    
    /* ワイルドドロー4の反則になるなら、出さない。ならないなら出す。 */
    if (UnoUtils.isSameCard(this.myCards[this.myCards.length - 1], UnoConsts.Cards.WildDraw4)) {
      return this.isWildDraw4Valid();
    }
    return true;
  }

  public willChallenge(): boolean {
    return false;
  }

  public willDraw(): boolean {
    return this.bestHand === null;
  }

  public shouldYellUNO(): boolean {
    return this.myCards.length == 2;
  }

  public submitCard(): UnoConsts.Card {
    assert(this.bestHand !== null);

    return this.bestHand;
  }

  /* ラウンドないしゲームを通じて使うフィールド。 */
  private myPlayerId: string = '';
  private playOrder: string[] = [];
  private myIdxOnOrder: number = -1;

  /* 処理をまたぐときの情報保存用。 */
  private myCards: UnoConsts.Card[] = [];
  private legalSubmissions: UnoConsts.Card[] = [];
  private canSubmitDrawnCard: boolean = false;
  private bestHand: UnoConsts.Card | null = null;

  private removeCard(card: UnoConsts.Card) {
    for (let i = 0; i < this.myCards.length; i++) {
      if (UnoUtils.isSameCard(this.myCards[i], card)) {
        this.myCards.splice(i, 1);
        return;
      }
    }
  }

  private setLegalSubmissions(tableCard: UnoConsts.Card) {
    this.legalSubmissions =
        this.myCards.filter(card =>
            UnoUtils.isLegal(card, tableCard));
  }

  private isWildDraw4Valid() {
    return this.legalSubmissions.length <=
        UnoUtils.countCardIn(UnoConsts.Cards.WildDraw4, this.myCards);
  }

  private hasCard(card: UnoConsts.Card) {
    return UnoUtils.countCardIn(card, this.myCards) > 0;
  }

  /* 手札中の一番多い色とその数を返す。 */
  private countColors():
      { [UnoConsts.Color.Red]:    number,
        [UnoConsts.Color.Yellow]: number,
        [UnoConsts.Color.Green]:  number,
        [UnoConsts.Color.Blue]:   number } {
    let numOfColors = {
      [UnoConsts.Color.Red]:    0,
      [UnoConsts.Color.Yellow]: 0,
      [UnoConsts.Color.Green]:  0,
      [UnoConsts.Color.Blue]:   0
    };
    this.myCards.forEach((card) => {
      if (card.color !== UnoConsts.Color.Black && card.color !== UnoConsts.Color.White) {
        numOfColors[card.color]++;
      }
    });
    return numOfColors;
  }

  /* 手札中の一番多い数字とその数を返す。 */
  private countNumbers():
      { [UnoConsts.Number.Zero]:  number,
        [UnoConsts.Number.One]:   number,
        [UnoConsts.Number.Two]:   number,
        [UnoConsts.Number.Three]: number,
        [UnoConsts.Number.Four]:  number,
        [UnoConsts.Number.Five]:  number,
        [UnoConsts.Number.Six]:   number,
        [UnoConsts.Number.Seven]: number,
        [UnoConsts.Number.Eight]: number,
        [UnoConsts.Number.Nine]:  number } {
    let numOfNumbers = {
      [UnoConsts.Number.Zero]:  0,
      [UnoConsts.Number.Two]:   0,
      [UnoConsts.Number.One]:   0,
      [UnoConsts.Number.Three]: 0,
      [UnoConsts.Number.Four]:  0,
      [UnoConsts.Number.Five]:  0,
      [UnoConsts.Number.Six]:   0,
      [UnoConsts.Number.Seven]: 0,
      [UnoConsts.Number.Eight]: 0,
      [UnoConsts.Number.Nine]:  0
    };
    this.myCards.forEach((card) => {
      if (card.number !== undefined) {
        numOfNumbers[card.number]++;
      }
    });
    return numOfNumbers;
  }

  /* 手札中の一番多い記号とその数を返す。 */
  private countActions():
      { [UnoConsts.Action.Skip]:    number,
        [UnoConsts.Action.Reverse]: number,
        [UnoConsts.Action.DrawTwo]: number } {
    let numOfActions = {
      [UnoConsts.Action.Skip]:    0,
      [UnoConsts.Action.Reverse]: 0,
      [UnoConsts.Action.DrawTwo]: 0
    };
    this.myCards.forEach((card) => {
      if(card.special === UnoConsts.Action.Skip ||
         card.special === UnoConsts.Action.Reverse ||
         card.special === UnoConsts.Action.DrawTwo) {
        numOfActions[card.special]++;
      }
    });
    return numOfActions;
  }

  static readonly evalMin = 0;
  static readonly evalMax = 1000;

  static readonly FEW_HAND_THRESHOLD = 2; // 2枚以下なら手札が少ないとする。
  static readonly MANY_HAND_THRESHOLD = 7; // 7枚以上なら手札が多いとする。

  private bestSubmission(msg: UnoConsts.Event.Message.Receive.NextPlayer) {
    /* ワイルドドロー4があるので先に出さなければならないか、自分の手札が多い場合、シャッフルワイルドを出す。 */
    // TODO: ワイルドドロー4がある場合、さっさとシャッフルワイルドを出す方が良いのか、待ってからがいいのか問題。
    if ((this.hasCard(UnoConsts.Cards.WildDraw4) ||
        this.myCards.length >= Drachen.MANY_HAND_THRESHOLD) &&
        this.hasCard(UnoConsts.Cards.WildShuffleHands)) {
      return UnoConsts.Cards.WildShuffleHands;
    }

    /* 次プレイヤを妨害できる手があれば出す。 */
    const interferingCard = this.searchInterferingCard(msg);
    if (interferingCard) {
      return interferingCard;
    }

    /* 自分の勝つ見込みが少ないなら、減点の大きい手から出す。 */
    if (this.isLikelyToLoseRound(msg)) {
      return this.bestSubmissionOnLosing();
    }

    /* 色が偏っていたら、ワイルドを出して調整を図る。 */
    /* 手札5枚以上で、半分以上が同じ色なら偏っているとする。 */
    if (this.myCards.length >= 5 && this.hasCard(UnoConsts.Cards.Wild)) {
      const countColors = this.countColors();
      if (Object.values(countColors).find(quantity => quantity > this.myCards.length * 2)) {
        return UnoConsts.Cards.Wild;
      }
    }

    /* 特別な場合以外。 */
    return this.bestSubmissionOnNormal();
  }

  /* 次プレイヤを妨害する手を選ぶ。 */
  private searchInterferingCard(msg: UnoConsts.Event.Message.Receive.NextPlayer): UnoConsts.Card | null {
    const nextPlayerID = msg.turn_right ?
        this.playOrder[(this.myIdxOnOrder + 1) % 4] :
        this.playOrder[(this.myIdxOnOrder - 1 + 4) % 4];
    
    /* 次プレイヤの手札が別に少なくないなら、妨害しても意味ない。 */
    if (msg.number_card_of_player[nextPlayerID] > Drachen.FEW_HAND_THRESHOLD) { return null; }

    /* 次の次のプレイヤの手札が少なくないなら、次のプレイヤを飛ばす系のカードを出す。 */
    const nextOfNextPlayerID = msg.turn_right ?
        this.playOrder[(this.myIdxOnOrder + 2) % 4] :
        this.playOrder[(this.myIdxOnOrder - 2 + 4) % 4];
    if (msg.number_card_of_player[nextOfNextPlayerID] > Drachen.FEW_HAND_THRESHOLD) {
      if (this.hasCard(UnoConsts.Cards.WildDraw4) &&
          this.isWildDraw4Valid()) {
        return UnoConsts.Cards.WildDraw4;
      }
      if (this.hasCard(UnoConsts.Cards.WildCustomizable)) {
        return UnoConsts.Cards.WildCustomizable;
      }
      if (this.hasCard(UnoConsts.Cards.RedDrawTwo)) {
        return UnoConsts.Cards.RedDrawTwo;
      }
      if (this.hasCard(UnoConsts.Cards.YellowDrawTwo)) {
        return UnoConsts.Cards.YellowDrawTwo;
      }
      if (this.hasCard(UnoConsts.Cards.GreenDrawTwo)) {
        return UnoConsts.Cards.GreenDrawTwo;
      }
      if (this.hasCard(UnoConsts.Cards.BlueDrawTwo)) {
        return UnoConsts.Cards.BlueDrawTwo;
      }
      if (this.hasCard(UnoConsts.Cards.RedSkip)) {
        return UnoConsts.Cards.RedSkip;
      }
      if (this.hasCard(UnoConsts.Cards.YellowSkip)) {
        return UnoConsts.Cards.YellowSkip;
      }
      if (this.hasCard(UnoConsts.Cards.GreenSkip)) {
        return UnoConsts.Cards.GreenSkip;
      }
      if (this.hasCard(UnoConsts.Cards.BlueSkip)) {
        return UnoConsts.Cards.BlueSkip;
      }
    }

    /* 前のプレイヤの手札が少なくないなら、リバースを出す。 */
    const prevPlayerID = msg.turn_right ?
        this.playOrder[(this.myIdxOnOrder - 1 + 4) % 4] :
        this.playOrder[(this.myIdxOnOrder + 1) % 4];
    if (msg.number_card_of_player[prevPlayerID] > Drachen.FEW_HAND_THRESHOLD) {
      if (this.hasCard(UnoConsts.Cards.RedReverse)) {
        return UnoConsts.Cards.RedReverse;
      }
      if (this.hasCard(UnoConsts.Cards.YellowReverse)) {
        return UnoConsts.Cards.YellowReverse;
      }
      if (this.hasCard(UnoConsts.Cards.GreenReverse)) {
        return UnoConsts.Cards.GreenReverse;
      }
      if (this.hasCard(UnoConsts.Cards.BlueReverse)) {
        return UnoConsts.Cards.BlueReverse;
      }
    }

    /* 出せる妨害手がなかった。 */
    return null;
  }

  /* 自分の勝つ見込みが少ない？ */
  private isLikelyToLoseRound(msg: UnoConsts.Event.Message.Receive.NextPlayer): boolean {
    /* 自分の手札が多く、手札が少ないプレイヤが2人以上いたら勝てなさそうだと判断する。 */
    return this.myCards.length >= Drachen.MANY_HAND_THRESHOLD &&
        (Object.values(msg.number_card_of_player)
        .filter(n => n <= Drachen.FEW_HAND_THRESHOLD).length >= 2);
  }

  /* 勝てなさそうなときの最善手。 */
  private bestSubmissionOnLosing(): UnoConsts.Card {
    let bestIdx = 0;
    let bestEvalue = Drachen.evalMin;
    const isWildDraw4Valid = this.isWildDraw4Valid();

    /* 減点の大きい手を出す。 */
    for (let i = 0; i < this.legalSubmissions.length; i++) {
      const card = this.legalSubmissions[i];
      /* ワイルドドロー4の反則はしない。 */
      if (!isWildDraw4Valid && UnoUtils.isSameCard(card, UnoConsts.Cards.WildDraw4)) {
        continue;
      }
      const evalue = UnoUtils.cardScore(card);
      if (evalue > bestEvalue) {
        bestIdx = i;
        bestEvalue = evalue;
      }
    }
    return this.legalSubmissions[bestIdx];
  }

  /* 通常の場合の最善手。 */
  private bestSubmissionOnNormal(): UnoConsts.Card {
    /* 評価値の重み。 */
    /* 評価値の係数は、特徴量を正規化して1足した値なので、ある評価値は[重み, 重み*2]になる。
       そのため、より重要な評価値の重みは、他の重みの2倍に1足した値以上とする。*/
    const weightQuantityOfColor = 31;
    const weightQuantityOfNumber = 15;
    const weightQuantityOfAction = 15;
    const weightAction = 7;
    const weightNumber = 3;
    const weightWild = 1;

    const countColors = this.countColors();
    const countNumbers = this.countNumbers();
    const countActions = this.countActions();

    let bestEvalue = Drachen.evalMin;
    let bestIdx = 0;

    for (let i = 0; i < this.legalSubmissions.length; i++) {
      const card = this.legalSubmissions[i];
      let evalue = 0;

      /* 手札に多くある色ほど高い評価値を付ける。 */
      if (card.color === UnoConsts.Color.Red ||
          card.color === UnoConsts.Color.Yellow ||
          card.color === UnoConsts.Color.Green ||
          card.color === UnoConsts.Color.Blue) {
        evalue += (countColors[card.color] / UnoConsts.numOfAllCards + 1) * weightQuantityOfColor;
      }

      /* 手札に多くある数字ほど高い評価値を付ける。 */
      if (card.number !== undefined) {
        evalue += (countNumbers[card.number] / UnoConsts.numOfAllCards + 1) * weightQuantityOfNumber;
      }

      /* 手札に多くある記号ほど高い評価値を付ける。ワイルド系はたくさんあっても出せなくなることはないので、ここでは見ない。 */
      if(card.special === UnoConsts.Action.Skip ||
         card.special === UnoConsts.Action.Reverse ||
         card.special === UnoConsts.Action.DrawTwo) {
        evalue += (countActions[card.special] / UnoConsts.numOfAllCards + 1) * weightQuantityOfAction;
      }

      /* カードの種類に応じて評価値を付ける。 */
      if (card.number !== undefined) {
        evalue += ((card.number + 1) / 10 + 1) * weightNumber; // 数字が大きいほど評価値高い。
      } else if (card.color !== UnoConsts.Color.Black && card.color !== UnoConsts.Color.White) {
        evalue += weightAction;
      } else {
        evalue += weightWild;
      }

      if (evalue > bestEvalue) {
        bestEvalue = evalue;
        bestIdx = i;
      }

    }
    return this.legalSubmissions[bestIdx];
  }
}
