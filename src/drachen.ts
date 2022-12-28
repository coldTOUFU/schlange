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

    this.bestSubmission(msg);    
  }

  public onReceivedPublicCard(msg: UnoConsts.Event.Message.Receive.PublicCard): void {;}

  /* ラウンドが終わったので、手札を空にする。 */
  public onReceivedFinishTurn(msg: UnoConsts.Event.Message.Receive.FinishTurn): void {
    this.myCards = [];
  }

  public onReceivedFinishGame(msg: UnoConsts.Event.Message.Receive.FinishGame): void {;}

  public changeColor(): UnoConsts.Color {
    /* 手札中の一番多い色を選ぶ。 */
    let numOfBlue = 0, numOfGreen = 0, numOfRed = 0, numOfYellow = 0;

    this.legalSubmissions.forEach((card) => {
      switch (card.color) {
        case UnoConsts.Color.Blue:
          numOfBlue++;
          break;
        case UnoConsts.Color.Green:
          numOfGreen++;
          break;
        case UnoConsts.Color.Red:
          numOfRed++;
          break;
        case UnoConsts.Color.Yellow:
          numOfYellow++;
          break;
        default:
          break;
      }
    });

    if (numOfBlue >= numOfGreen && numOfBlue >= numOfRed && numOfBlue >= numOfYellow) {
      return UnoConsts.Color.Blue;
    } else if (numOfGreen >= numOfRed && numOfGreen >= numOfYellow) {
      return UnoConsts.Color.Green;
    } else if (numOfRed >= numOfYellow) {
      return UnoConsts.Color.Red;
    } else {
      return UnoConsts.Color.Yellow;
    }
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
  private countMostCommonColor(): { color: UnoConsts.Color, quantity: number } {
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
    let mostCommonColor = UnoConsts.Color.Red;
    let maxColorQuantity = 0;
    for (const color in numOfColors) {
      assert(color === UnoConsts.Color.Red ||
             color === UnoConsts.Color.Yellow ||
             color === UnoConsts.Color.Green ||
             color === UnoConsts.Color.Blue);
      if (numOfColors[color] > maxColorQuantity) {
        mostCommonColor = color;
        maxColorQuantity = numOfColors[color];
      }
    }
    return {
      color: mostCommonColor,
      quantity: maxColorQuantity
    };
  }

  /* 手札中の一番多い数字とその数を返す。 */
  private countMostCommonNumber(): { number: UnoConsts.Number, quantity: number } {
    let numOfNumbers = {
      [UnoConsts.Number.Zero]:  0,
      [UnoConsts.Number.One]:   0,
      [UnoConsts.Number.Two]:   0,
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
    let mostCommonNumber = UnoConsts.Number.Zero;
    let maxNumberQuantity = 0;
    for (const key in numOfNumbers) {
      const num = Number(key);
      assert(num === 0 || num === 1 || num === 2 ||
             num === 3 || num === 4 || num === 5 ||
             num === 6 || num === 7 || num === 8 || num === 9);
      if (numOfNumbers[num] > maxNumberQuantity) {
        mostCommonNumber = num;
        maxNumberQuantity = numOfNumbers[num];
      }
    }
    return {
      number: mostCommonNumber,
      quantity: maxNumberQuantity
    };
  }

  /* 手札中の一番多い記号とその数を返す。 */
  private countMostCommonAction(): { action: UnoConsts.Action, quantity: number } {
    let numOfActions = {
      [UnoConsts.Action.Skip]:             0,
      [UnoConsts.Action.Reverse]:          0,
      [UnoConsts.Action.DrawTwo]:          0,
      [UnoConsts.Action.Wild]:             0,
      [UnoConsts.Action.WildDraw4]:        0,
      [UnoConsts.Action.WildShuffleHands]: 0,
      [UnoConsts.Action.WildCustomizable]: 0
    };
    this.myCards.forEach((card) => {
      if (card.special !== undefined) {
        numOfActions[card.special]++;
      }
    });
    let mostCommonAction = UnoConsts.Action.DrawTwo;
    let maxActionQuantity = 0;
    for (const action in numOfActions) {
      assert(action === UnoConsts.Action.DrawTwo ||
             action === UnoConsts.Action.Reverse ||
             action === UnoConsts.Action.Skip ||
             action === UnoConsts.Action.Wild ||
             action === UnoConsts.Action.WildCustomizable ||
             action === UnoConsts.Action.WildDraw4 ||
             action === UnoConsts.Action.WildShuffleHands);
      if (numOfActions[action] > maxActionQuantity) {
        mostCommonAction = action;
        maxActionQuantity = numOfActions[action];
      }
    }
    return {
      action: mostCommonAction,
      quantity: maxActionQuantity
    };
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
        this.hasCard(UnoConsts.Cards.WildDraw4)) {
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
      const countMostCommonColor = this.countMostCommonColor();
      if (countMostCommonColor.quantity > this.myCards.length * 2) {
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
    let bestScore = Drachen.evalMin;
    const isWildDraw4Valid = this.isWildDraw4Valid();

    /* 減点の大きい手を出す。 */
    for (let i = 0; i < this.legalSubmissions.length; i++) {
      const card = this.legalSubmissions[i];
      /* ワイルドドロー4の反則はしない。 */
      if (!isWildDraw4Valid && UnoUtils.isSameCard(card, UnoConsts.Cards.WildDraw4)) {
        continue;
      }
      const score = UnoUtils.cardScore(card);
      if (score > bestScore) {
        bestIdx = i;
        bestScore = score;
      }
    }
    return this.legalSubmissions[bestIdx];
  }

  /* 通常の場合の最善手。 */
  private bestSubmissionOnNormal(): UnoConsts.Card {
    const evalWeightNumber = 2; // 数字カードの評価値は[2, 20]の範囲。
    const evalWeightAction = 21;
    const evalWeightWild = 1;

    /* 提出候補。これを次々絞っていく。 */
    let candidates = this.legalSubmissions;

    /* 手札で一番の多い色のカードに絞る。 */
    const mostCommonColor = this.countMostCommonColor().color;
    candidates = candidates.filter(card => card.color === mostCommonColor);
    if (candidates.length === 1) { return candidates[0]; }

    /* 手札で一番多い模様のカードに絞る。 */
    const mostCommonNumberAndQuantity = this.countMostCommonNumber();
    const mostCommonActionAndQuantity = this.countMostCommonAction();
    if (mostCommonNumberAndQuantity.quantity > mostCommonActionAndQuantity.quantity) {
      candidates = candidates.filter(card =>
          (card.number !== undefined) &&
          (card.number === mostCommonNumberAndQuantity.number));
    } else {
      candidates = candidates.filter(card =>
          (card.special !== undefined) &&
          (card.special === mostCommonActionAndQuantity.action));
    }
    if (candidates.length === 1) { return candidates[0]; }

    let bestIdx = 0;
    let bestEvalue = Drachen.evalMin;
    for (let i = 0; i < candidates.length; i++) {
      let evalue: number;
      const card = candidates[i];
      if (card.number !== undefined) {
        evalue = (card.number + 1) * evalWeightNumber;
      } else if (card.color !== UnoConsts.Color.Black && card.color !== UnoConsts.Color.White) {
        evalue = evalWeightAction;
      } else {
        evalue = evalWeightWild;
      }
      if (evalue > bestEvalue) {
        bestIdx = i;
        bestEvalue = evalue;
      }
    }

    return candidates[bestIdx];
  }
}
