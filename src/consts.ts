/* UNOとALGORIで信に必要な定数・型を定義している。 */

export namespace UnoConsts {
  export namespace Event {
    export namespace Name {
      export enum Send {
        JoinRoom =              "join-room",
        PlayCard =              "play-card",
        DrawCard =              "draw-card",
        PlayDrawCard =          "play-draw-card",
        Challenge =             "challenge",
        SayUnoAndPlayCard =     "say-uno-and-play-card",
        SayUnoAndPlayDrawCard = "say-uno-and-play-draw-card",
        PointedNotSayUno =      "pointed-not-say-uno",
        SpecialLogic =          "special-logic",
        ColorOfWild =           "color-of-wild"
      }

      export enum Response {
        JoinRoom =          "join-room",
      }

      export enum Receive {
        JoinRoom =              "join-room",
        PlayCard =              "play-card",
        DrawCard =              "draw-card",
        PlayDrawCard =          "play-draw-card",
        Challenge =             "challenge",
        SayUnoAndPlayCard =     "say-uno-and-play-card",
        SayUnoAndPlayDrawCard = "say-uno-and-play-draw-card",
        PointedNotSayUno =      "pointed-not-say-uno",
        ReceiverCard =          "receiver-card",
        FirstPlayer =           "first-player",
        ColorOfWild =           "color-of-wild",
        ShuffleWild =           "shuffle-wild",
        NextPlayer =            "next-player",
        PublicCard =            "public-card",
        FinishTurn =            "finish-turn",
        FinishGame =            "finish-game"
      }
    }

    export namespace Message {
      /* プレイヤから送信するメッセージ。 */
      export namespace Send {
        export type JoinRoom = {
          room_name: string,
          player:    string
        };

        export type PlayCard = {
          card_play: Card
        };

        export type DrawCard = {};

        export type PlayDrawCard = {
          is_play_card: boolean
        };

        export type Challenge = {
          is_challenge: boolean
        };

        export type SayUnoAndPlayCard = {
          card_play: Card
        };

        export type SayUnoAndPlayDrawCard = {};

        export type PointedNotSayUno = {
          target: string
        };

        export type SpecialLogic = {
          title: string
        };

        export type ColorOfWild = {
          color_of_wild: Color
        };
      }

      /* プレイヤから送信したメッセージに対するディーラからの返信。 */
      export namespace Response {
        export type JoinRoom = {
          room_name:  string,
          player:     string,
          your_id:    string,
          total_turn: number,
          white_wild: WhiteWildEffect
        };
      }

      /* ディーラから受信するメッセージ。 */
      export namespace Receive {
        export type JoinRoom = {
          room_name: string,
          player:    string
        };

        export type PlayCard = {
          player:    string,
          card_play: Card
        };

        export type DrawCard = {
          player:             string,
          is_draw:            boolean,
          can_play_draw_card: boolean
        };

        export type PlayDrawCard = {
          player:       string,
          is_play_card: boolean,
          card_play:    Card
        };

        export type Challenge = {
          challenger:           string,
          target:               string,
          is_challenge:         boolean,
          is_challenge_success: boolean | null
        };

        export type SayUnoAndPlayCard = {
          player:    string,
          card_play: Card,
          yell_uno:  true
        };

        export type SayUnoAndPlayDrawCard = {
          player:    string,
          card_play: Card,
          yell_uno:  true
        };

        export type PointedNotSayUno = {
          pointer:      string,
          target:       string,
          have_say_uno: boolean
        };

        export type ReceiverCard = {
          cards_receive: Card[],
          is_penalty:    boolean
        };

        export type FirstPlayer = {
          first_player: string,
          first_card:   Card,
          play_order:   string[]
        };

        export type ColorOfWild = {};

        export type ShuffleWild = {
          cards_receive: Card[]
        };

        export type NextPlayer = {
          next_player:           string,
          before_player:         string,
          card_before:           Card,
          card_of_player:        Card[],
          must_call_draw_card:   boolean,
          draw_reason:           DrawReason,
          turn_right:            boolean,
          number_card_play:      number,
          number_turn_play:      number,
          number_card_of_player: number[]
        };

        export type PublicCard = {
          card_of_player: string,
          cards:          Card[]
        };

        export type FinishTurn = {
          turn_no: number,
          winner:  string,
          score: {
            [player_name: string]: number
          }[]
        };

        export type FinishGame = {
          winner: string,
          turn_win: number,
          order: {
            [player_name: string]: number
          }[],
          total_score: {
            [player_name: string]: number
          }[]
        };
      }
    }
  }

  export enum Color {
    Red =    "red",
    Yellow = "yellow",
    Green =  "green",
    Blue =   "blue",
    Black =  "black",
    White =  "white"
  }

  export enum Number {
    Zero =  0,
    One =   1,
    Two =   2,
    Three = 3,
    Four =  4,
    Five =  5,
    Six =   6,
    Seven = 7,
    Eight = 8,
    Nine =  9
  }

  export enum Action {
    Skip =             "skip",
    Reverse =          "reverse",
    DrawTwo =          "draw_2",
    Wild =             "wild",
    WildDraw4 =        "wild_draw_4",
    WildShuffleHands = "wild_shuffle",
    WildCustomizable = "white_wild"
  }

  export enum WhiteWildEffect {
    Bind2 = "bind_2"
  }

  export type Card = {
    number?:  Number,
    color:    Color,
    special?: Action
  };

  export enum DrawReason {
    DrawTwo =   "draw_2",
    WildDraw4 = "wild_draw_4",
    Bind2 =     "bind_2",
    Nothing =   "nothing"
  }
}
