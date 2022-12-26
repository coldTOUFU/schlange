import * as assert from "assert";
import { UnoConsts } from "./consts";
import { UnoPlayerInterface } from "./player_interface";

const isDebugMode = true;

export namespace UnoClient {
  export class Client {
    private socketIoClient = require("socket.io-client");
    private client: any;

    private hostName: string;
    private dealerName: string;
    private playerName: string;
    private player: UnoPlayerInterface.PlayerInterface;
    private isConnectionTestMode: boolean;
    private myPlayerID: string = "";

    /* 通信用の変数を設定。 */
    constructor(host: string, dealerName: string, playerName: string, player: UnoPlayerInterface.PlayerInterface, isConnectionTestMode: boolean) {
      this.hostName = host;
      this.dealerName = dealerName;
      this.playerName = playerName;
      this.player = player;
      this.isConnectionTestMode = isConnectionTestMode;
    }

    /* サーバと接続する。 */
    public connect(): void {
      if (isDebugMode) {
        console.log("[Send] connect");
        console.log(this.hostName);
      }
      this.client = this.socketIoClient.connect(
        this.hostName,
        {
          transports: ['websocket'],
          query:      {player: this.playerName}
        }
      );
      this.client.on("connect", () => {
        if (isDebugMode) {
          console.log("[Receive] connect");
        }
      });

    }

    /* 接続テスト用。送信イベントをすべて発生させる。 */
    public testSendAll() {
      assert(this.isConnectionTestMode);
      this.joinRoom();
      this.sendPlayDrawCard();
      this.sendColorOfWild();
      this.sendChallenge(true);
      this.sendDrawCard();
      this.sendSayUnoAndPlayCard();
      this.sendSayUnoAndPlayDrawCard();
      this.sendPlayCard();
    }

    /* 対戦用。対戦部屋に入る。 */
    public joinRoom() {
      const sending_msg: UnoConsts.Event.Message.Send.JoinRoom = {
        room_name: this.dealerName,
        player:    this.playerName
      };
      if (isDebugMode) {
        console.log("[Send] join-room");
        console.log(sending_msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.JoinRoom, sending_msg,
                       (_: any, respond_msg: UnoConsts.Event.Message.Response.JoinRoom) => {
        if (isDebugMode) {
          console.log("[Respond] join-room");
          console.log(respond_msg);
        }
        this.myPlayerID = respond_msg.your_id;
        this.player.onRespondJoinRoom(respond_msg);
      });
    }


    /* 受け取ったPlayerのメソッドをイベントハンドラとして登録する。 */
    public resisterHandlers(): void {
      this.client.on("disconnect", () => {
        if (isDebugMode) {
          console.log("[Receive] disconnect");
        }
        const process = require("process");
        process.exit(0);
      });

      this.client.on(UnoConsts.Event.Name.Receive.JoinRoom,
                    (msg: UnoConsts.Event.Message.Receive.JoinRoom) => {
        if (isDebugMode) {
          console.log("[Receive] join-room");
          console.log(msg);
        }
        this.player.onReceivedJoinRoom(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.PlayCard,
                    (msg: UnoConsts.Event.Message.Receive.PlayCard) => {
        if (isDebugMode) {
          console.log("[Receive] play-card");
          console.log(msg);
        }
        this.player.onReceivedPlayCard(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.DrawCard,
                    (msg: UnoConsts.Event.Message.Receive.DrawCard) => {
        if (isDebugMode) {
          console.log("[Receive] draw-card");
          console.log(msg);
        }
        this.player.onReceivedDrawCard(msg);
        /* 引いたカードを出せる場合、カードを出すか決定して行動する。 */
        if (msg.player === this.myPlayerID && msg.can_play_draw_card && this.player.willSubmitDrawnCard()) {
          /* UNO宣言が必要なら、宣言する。 */
          if (this.player.shouldYellUNO()) {
            this.sendSayUnoAndPlayDrawCard();
          } else {
            this.sendPlayDrawCard();
          }
        }
      });

      this.client.on(UnoConsts.Event.Name.Receive.PlayDrawCard,
                    (msg: UnoConsts.Event.Message.Receive.PlayDrawCard) => {
        if (isDebugMode) {
          console.log("[Receive] play-draw-card");
          console.log(msg);
        }
        this.player.onReceivedPlayDrawCard(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.Challenge,
                    (msg: UnoConsts.Event.Message.Receive.Challenge) => {
        if (isDebugMode) {
          console.log("[Receive] challenge");
          console.log(msg);
        }
        this.player.onReceivedChallenge(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.SayUnoAndPlayCard,
                    (msg: UnoConsts.Event.Message.Receive.SayUnoAndPlayCard) => {
        if (isDebugMode) {
          console.log("[Receive] say-uno-and-play-card");
          console.log(msg);
        }
        this.player.onReceivedSayUnoAndPlayCard(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.SayUnoAndPlayDrawCard,
                    (msg: UnoConsts.Event.Message.Receive.SayUnoAndPlayDrawCard) => {
        if (isDebugMode) {
          console.log("[Receive] say-uno-and-play-draw-card");
          console.log(msg);
        }
        this.player.onReceivedSayUnoAndPlayDrawCard(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.PointedNotSayUno,
                    (msg: UnoConsts.Event.Message.Receive.PointedNotSayUno) => {
        if (isDebugMode) {
          console.log("[Receive] pointed-not-say-uno");
          console.log(msg);
        }
        this.player.onReceivedPointedNotSayUno(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.ReceiverCard,
                    (msg: UnoConsts.Event.Message.Receive.ReceiverCard) => {
        if (isDebugMode) {
          console.log("[Receive] receiver-card");
          console.log(msg);
        }
        if (msg.is_penalty) {
          console.log("ペナルティを受けました。");
        }
        this.player.onReceivedReceiverCard(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.FirstPlayer,
                    (msg: UnoConsts.Event.Message.Receive.FirstPlayer) => {
        if (isDebugMode) {
          console.log("[Receive] first-player");
          console.log(msg);
        }
        this.player.onReceivedFirstPlayer(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.ColorOfWild,
                    (msg: UnoConsts.Event.Message.Receive.ColorOfWild) => {
        if (isDebugMode) {
          console.log("[Receive] color-of-wild");
          console.log(msg);
        }
        this.player.onReceivedColorOfWild(msg);
        this.sendColorOfWild();
      });

      this.client.on(UnoConsts.Event.Name.Receive.ShuffleWild,
                    (msg: UnoConsts.Event.Message.Receive.ShuffleWild) => {
        if (isDebugMode) {
          console.log("[Receive] shuffle-wild");
          console.log(msg);
        }
        this.player.onReceivedShuffleWild(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.NextPlayer,
                    (msg: UnoConsts.Event.Message.Receive.NextPlayer) => {
        if (isDebugMode) {
          console.log("[Receive] next-player");
          console.log(msg);
        }
        this.player.onReceivedNextPlayer(msg);

        /* ワイルドドロー4でカードを引かされる場合 → チャレンジ。 */
        if (msg.draw_reason === UnoConsts.DrawReason.WildDraw4) {
          const willChallenge = this.player.willChallenge();
          this.sendChallenge(willChallenge);
          /* チャレンジする場合は、以降の処理(というかDrawCard)不要。 */
          if (willChallenge) { return; }
        }

        if (msg.must_call_draw_card || this.player.willDraw()) {
          /* カードを引かなければならない場合か、引きたい場合 → カードを引く。 */
          this.sendDrawCard();
        } else if (this.player.shouldYellUNO()) {
          /* UNO宣言が必要な場合 → UNOと宣言してカードを出す。 */
          this.sendSayUnoAndPlayCard();
        } else {
          /* それ以外の場合 → カードを出す。 */
          this.sendPlayCard();
        }
      });

      this.client.on(UnoConsts.Event.Name.Receive.PublicCard,
                    (msg: UnoConsts.Event.Message.Receive.PublicCard) => {
          if (isDebugMode) {
            console.log("[Receive] public-card");
            console.log(msg);
          }
        this.player.onReceivedPublicCard(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.FinishTurn,
                    (msg: UnoConsts.Event.Message.Receive.FinishTurn) => {
          if (isDebugMode) {
            console.log("[Receive] finish-turn");
            console.log(msg);
          }
        this.player.onReceivedFinishTurn(msg);
      });

      this.client.on(UnoConsts.Event.Name.Receive.FinishGame,
                    (msg: UnoConsts.Event.Message.Receive.FinishGame) => {
          if (isDebugMode) {
            console.log("[Receive] finish-game");
            console.log(msg);
          }
        this.player.onReceivedFinishGame(msg);
      });
    }

    private sendPlayDrawCard() {
      const msg: UnoConsts.Event.Message.Send.PlayDrawCard =
          this.isConnectionTestMode ? 
          { is_play_card: true } :
          { is_play_card: this.player.willSubmitDrawnCard() };
      if (isDebugMode) {
        console.log("[Send] draw-card");
        console.log(msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.PlayDrawCard,
                       msg);
    }

    private sendColorOfWild() {
        const msg: UnoConsts.Event.Message.Send.ColorOfWild =
            this.isConnectionTestMode ?
            { color_of_wild: UnoConsts.Color.Blue } :
            { color_of_wild: this.player.changeColor() };
        if (isDebugMode) {
          console.log("[Send] color-of-wild");
          console.log(msg);
        }
        this.client.emit(UnoConsts.Event.Name.Send.ColorOfWild,
                         msg);
    }

    /* チャレンジの場合はチャレンジするかどうかで後のイベント送信をすべきかが決まるので、
       外側の処理でもチャレンジするかどうかが保持できるように仕方なくフラグを受け取る。 */
    private sendChallenge(willChallenge: boolean) {
      const msg: UnoConsts.Event.Message.Send.Challenge =
          this.isConnectionTestMode ?
          { is_challenge: true } :
          { is_challenge: willChallenge };
      if (isDebugMode) {
        console.log("[Send] challenge");
        console.log(msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.Challenge,
                       msg);
    }

    private sendDrawCard() {
      const msg: UnoConsts.Event.Message.Send.DrawCard = {};
      if (isDebugMode) {
        console.log("[Send] draw-card");
        console.log(msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.DrawCard,
                       msg);
    }

    private sendSayUnoAndPlayCard() {
      const msg: UnoConsts.Event.Message.Send.SayUnoAndPlayCard =
          this.isConnectionTestMode ?
          { card_play: { color: UnoConsts.Color.Yellow, number: UnoConsts.Number.One } } :
          { card_play: this.player.submitCard() };
      if (isDebugMode) {
        console.log("[Send] say-uno-and-play-card");
        console.log(msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.SayUnoAndPlayCard,
                       msg);
    }

    private sendSayUnoAndPlayDrawCard() {
      const msg: UnoConsts.Event.Message.Send.SayUnoAndPlayDrawCard = {};
      if (isDebugMode) {
        console.log("[Send] say-uno-and-play-draw-card");
        console.log(msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.SayUnoAndPlayDrawCard,
                       msg);
    }

    private sendPlayCard() {
      const msg: UnoConsts.Event.Message.Send.PlayCard =
          this.isConnectionTestMode ?
          { card_play: { color: UnoConsts.Color.Green, number: UnoConsts.Number.Nine } } :
          { card_play: this.player.submitCard() };
      if (isDebugMode) {
        console.log("[Send] play-card");
        console.log(msg);
      }
      this.client.emit(UnoConsts.Event.Name.Send.PlayCard,
                       msg);
    }
  }
}
