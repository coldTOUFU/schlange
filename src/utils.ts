import { UnoConsts } from "./consts";

/* consts.tsで定義されたデータの扱いに関する基本的な処理を定義している。 */

export namespace UnoUtils {
  export function isSameCard(card1: UnoConsts.Card, card2: UnoConsts.Card): boolean {
    if (card1.color !== card2.color) { return false; }

    /* 数字を見る場合、0はfalsyなので先に確認する。 */
    if (card1.number === 0 && card2.number === 0) { return true; }
    if (card1.number && card2.number && (card1.number === card2.number)) {
        return true;
    }
    if (card1.special && card2.special && (card1.special === card2.special)) {
        return true;
    }

    return false;
  }

  export function isLegal(card: UnoConsts.Card, tableCard: UnoConsts.Card) {
    if (card.color === UnoConsts.Color.Black || card.color === UnoConsts.Color.White) { return true; }
    if (card.color === tableCard.color) { return true; }
    if ((card.number !== undefined) && (tableCard.number !== undefined) && (card.number === tableCard.number)) { return true; }
    if (card.special && tableCard.special && (card.special === tableCard.special)) { return true; }
    return false;
  }

  export function countCardIn(card: UnoConsts.Card, cards: UnoConsts.Card[]) {
    return cards.filter(c => UnoUtils.isSameCard(c, card)).length
  }

  export function cardScore(card: UnoConsts.Card): number {
    if (card.number !== undefined) {
      /* UnoConsts.Card.number の実体が対応する数値であることを前提している。 */
      return card.number;
    }
    if (card.color !== UnoConsts.Color.Black && card.color !== UnoConsts.Color.White) {
      return 20;
    }
    if (card.special === UnoConsts.Action.WildShuffleHands || card.special === UnoConsts.Action.WildCustomizable) {
      return 40;
    }
    return 50;
  }
}
