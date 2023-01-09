import { UnoConsts } from "./consts";

export namespace UnoPlayerInterface {
  export interface PlayerInterface {
    /* 何かのメッセージを受信したときの処理。 */
    onReceivedJoinRoom(msg: UnoConsts.Event.Message.Receive.JoinRoom): void;
    onRespondJoinRoom(msg: UnoConsts.Event.Message.Response.JoinRoom): void;
    onReceivedPlayCard(msg: UnoConsts.Event.Message.Receive.PlayCard): void;
    onReceivedDrawCard(msg: UnoConsts.Event.Message.Receive.DrawCard): void;
    onReceivedPlayDrawCard(msg: UnoConsts.Event.Message.Receive.PlayDrawCard): void;
    onReceivedChallenge(msg: UnoConsts.Event.Message.Receive.Challenge): void;
    onReceivedSayUnoAndPlayCard(msg: UnoConsts.Event.Message.Receive.SayUnoAndPlayCard): void;
    onReceivedSayUnoAndPlayDrawCard(msg: UnoConsts.Event.Message.Receive.SayUnoAndPlayDrawCard): void;
    onReceivedPointedNotSayUno(msg: UnoConsts.Event.Message.Receive.PointedNotSayUno): void;
    onReceivedReceiverCard(msg: UnoConsts.Event.Message.Receive.ReceiverCard): void;
    onReceivedFirstPlayer(msg: UnoConsts.Event.Message.Receive.FirstPlayer): void;
    onReceivedColorOfWild(msg: UnoConsts.Event.Message.Receive.ColorOfWild): void;
    onReceivedShuffleWild(msg: UnoConsts.Event.Message.Receive.ShuffleWild): void;
    onReceivedNextPlayer(msg: UnoConsts.Event.Message.Receive.NextPlayer): void;
    onReceivedPublicCard(msg: UnoConsts.Event.Message.Receive.PublicCard): void;
    onReceivedFinishTurn(msg: UnoConsts.Event.Message.Receive.FinishTurn): void;
    onReceivedFinishGame(msg: UnoConsts.Event.Message.Receive.FinishGame): void;

    /* ワイルド系を出した後の色を決めて返す。 */
    changeColor(): UnoConsts.Color;

    /* 引いたカードを出す？ */
    willSubmitDrawnCard(): boolean;

    /* チャレンジする？ */
    willChallenge(): boolean;

    /* カードを引く？ */
    willDraw(): boolean;

    /* UNO宣言する？ */
    shouldYellUNO(): boolean;

    /* 提出するカードを決めて返す。 */
    submitCard(): UnoConsts.Card;
  }
}
