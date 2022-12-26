import { Schlange } from "./schlange"
import { UnoClient } from "./client";

const process = require("process");
const isConnectionTestMode = (process.argv.length === 3 && process.argv[2] === "test");
if (isConnectionTestMode) {
  process.env.HOST = "http://localhost:3000";
  process.env.DEALER = "TestDealer";
  process.env.PLAYER = "TestPlayer1";
} else if (process.argv.length === 5) {
  process.env.HOST = process.argv[2];
  process.env.DEALER = process.argv[3];
  process.env.PLAYER = process.argv[4];
} else {
  console.error("引数(対戦): HOSTNAME DEALER_NAME PLAYER_NAME");
  console.error("  e.g.: node out/index.js http://localhost:8080 Dealer Player01");
  console.error("引数(テスト): test");
  console.error("  e.g.: node out/index.js test");
  process.exit(1);
}

const player = new Schlange();
const client = new UnoClient.Client(process.env.HOST,
                                    process.env.DEALER,
                                    process.env.PLAYER,
                                    player,
                                    isConnectionTestMode);
client.connect();
client.resisterHandlers();
if (isConnectionTestMode) {
  client.testSendAll();
} else {
  client.joinRoom();
}
