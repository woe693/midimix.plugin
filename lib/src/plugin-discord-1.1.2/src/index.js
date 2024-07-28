"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_rpc_1 = __importDefault(require("discord-rpc"));
require("midi-mixer-plugin");
const api_1 = require("./api");
let midiMixerRpc = null;
let api = null;
const cleanUpConnections = () => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        new Promise((resolve) => {
            if (!midiMixerRpc)
                return resolve();
            midiMixerRpc.destroy().finally(() => {
                midiMixerRpc = null;
                resolve();
            });
        }),
        new Promise((resolve) => {
            if (!api)
                return resolve();
            api.disconnect().finally(() => {
                api = null;
                resolve();
            });
        }),
    ]);
    $MM.setSettingsStatus("status", "Disconnected");
});
$MM.onClose(() => __awaiter(void 0, void 0, void 0, function* () {
    yield cleanUpConnections();
}));
const connectPresence = () => __awaiter(void 0, void 0, void 0, function* () {
    const midiMixerClientId = "802892683936268328";
    midiMixerRpc = new discord_rpc_1.default.Client({
        transport: "ipc",
    });
    yield midiMixerRpc.connect(midiMixerClientId);
    yield midiMixerRpc.setActivity({
        details: "Controlling volumes",
        state: "Using MIDI",
        largeImageKey: "logo",
        largeImageText: "MIDI Mixer",
        buttons: [
            {
                label: "Get MIDI Mixer",
                url: "https://www.midi-mixer.com",
            },
        ],
    });
});
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Disconnect any running instances.
     */
    yield cleanUpConnections();
    $MM.setSettingsStatus("status", "Getting plugin settings...");
    const settings = yield $MM.getSettings();
    const clientId = settings.clientId;
    const clientSecret = settings.clientSecret;
    const presence = settings.presence;
    /**
     * A blank presence field means presence SHOULD HAPPEN.
     */
    const showPresence = !presence;
    if (showPresence)
        connectPresence();
    const clientIdValid = Boolean(clientId) && typeof clientId === "string";
    const clientSecretValid = Boolean(clientSecret) && typeof clientSecret === "string";
    if (!clientIdValid || !clientSecretValid) {
        return void $MM.setSettingsStatus("status", "Error: No or incorrect Client ID or Client Secret.");
    }
    const rpc = new discord_rpc_1.default.Client({
        transport: "ipc",
    });
    api = new api_1.DiscordApi(rpc, clientId, clientSecret);
    try {
        yield api.bootstrap();
    }
    catch (err) {
        console.error(err);
        cleanUpConnections();
    }
});
$MM.onSettingsButtonPress("reconnect", connect);
connect();
