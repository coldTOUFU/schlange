import * as assert from "assert";
import { getEffectiveTypeParameterDeclarations } from "typescript";
import { UnoConsts } from "./consts";
import { UnoPlayerInterface } from "./player_interface";
import { UnoUtils } from "./utils";

export class Schlange implements UnoPlayerInterface.PlayerInterface {
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
    this.canSubmitDrawnCard = msg.can_play_draw_card;
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

  public onReceivedFirstPlayer(msg: UnoConsts.Event.Message.Receive.FirstPlayer): void {;}

  public onReceivedColorOfWild(msg: UnoConsts.Event.Message.Receive.ColorOfWild): void {;}

  /* シャッフルワイルド発動後、配りなおされたカードを自分の手札にする。 */
  public onReceivedShuffleWild(msg: UnoConsts.Event.Message.Receive.ShuffleWild): void {
    this.myCards = msg.cards_receive;
  }

  /* カードを引かなければならない場合はなにもしなくてよい。それ以外の場合、場のカードから合法手を作る。 */
  public onReceivedNextPlayer(msg: UnoConsts.Event.Message.Receive.NextPlayer): void {
    if (msg.must_call_draw_card) { return; }

    const tableCard = msg.card_before;
    this.legalSubmissions = this.myCards.filter(card => UnoUtils.isLegal(card, tableCard));
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
    return this.canSubmitDrawnCard;
  }

  public willChallenge(): boolean {
    return false;
  }

  public willDraw(): boolean {
    return this.legalSubmissions.length === 0;
  }

  public shouldYellUNO(): boolean {
    return this.myCards.length == 2;
  }

  static readonly evalMin = 0;
  static readonly evalWildDraw4 = 1;
  static readonly evalWild = 2;
  static readonly evalOtherWild = 3;
  static readonly evalAction = 4;
  static readonly evalNumber = 5;

  public submitCard(): UnoConsts.Card {
    assert(this.legalSubmissions.length > 0);

    if (this.legalSubmissions.length === 1) {
      return this.legalSubmissions[0];
    }

    let bestIdx = -1;
    let bestScore = Schlange.evalMin;

    /* 各着手の評価値を計算して、最良の着手を取る。 */
    this.legalSubmissions.forEach((card, idx) => {
      let score: number;
      if (card.number) {
        /* 数字カード。 */
        score = (card.number + 1) * Schlange.evalNumber;
      } else if (card.color !== UnoConsts.Color.Black && card.color !== UnoConsts.Color.White) {
        /* ワイルド以外の記号カード。 */
        score = Schlange.evalAction;
      } else {
        /* ワイルド系。 */
        assert(card.special);
        switch (card.special) {
          case UnoConsts.Action.Wild:
            score = Schlange.evalWild;
            break;
          case UnoConsts.Action.WildDraw4:
            score = Schlange.evalWildDraw4;
            break;
          default:
            score = Schlange.evalOtherWild;
            break;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    return this.legalSubmissions[bestIdx];
  }

  private myCards: UnoConsts.Card[] = [];
  private legalSubmissions: UnoConsts.Card[] = [];
  private myPlayerId: string = '';
  private canSubmitDrawnCard: boolean = false;

  private removeCard(card: UnoConsts.Card) {
    for (let i = 0; i < this.myCards.length; i++) {
      if (UnoUtils.isSameCard(this.myCards[i], card)) {
        this.myCards.splice(i, 1);
        return;
      }
    }
  }
}
