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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordApi = void 0;
const midi_mixer_plugin_1 = require("midi-mixer-plugin");
const config_1 = require("./config");
var DiscordButton;
(function (DiscordButton) {
    DiscordButton["ToggleAutomaticGainControl"] = "toggleAutomaticGainControl";
    DiscordButton["ToggleEchoCancellation"] = "toggleEchoCancellation";
    DiscordButton["ToggleNoiseSuppression"] = "toggleNoiseSuppression";
    DiscordButton["ToggleQos"] = "toggleQos";
    DiscordButton["ToggleSilenceWarning"] = "toggleSilenceWarning";
    DiscordButton["ToggleDeafen"] = "toggleDeafen";
    DiscordButton["ToggleMute"] = "toggleMute";
    // TogglePushToTalk = "togglePushToTalk",
    // ToggleAutoThreshold = "toggleAutoThreshold",
})(DiscordButton || (DiscordButton = {}));
var DiscordFader;
(function (DiscordFader) {
    DiscordFader["InputVolume"] = "inputVolume";
    DiscordFader["OutputVolume"] = "outputVolume";
    // VoiceActivityThreshold = "voiceActivityThreshold",
})(DiscordFader || (DiscordFader = {}));
class DiscordApi {
    constructor(rpc, clientId, clientSecret) {
        this.buttons = null;
        this.faders = null;
        this.syncInterval = null;
        this.rpc = rpc;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            yield this.rpc.destroy();
            if (this.syncInterval)
                clearInterval(this.syncInterval);
            Object.values((_a = this.buttons) !== null && _a !== void 0 ? _a : {}).forEach((button) => void button.remove());
            Object.values((_b = this.faders) !== null && _b !== void 0 ? _b : {}).forEach((fader) => void fader.remove());
        });
    }
    bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            $MM.setSettingsStatus("status", "Connecting to Discord...");
            let authToken = "";
            try {
                [authToken] = yield Promise.all([
                    new Promise((resolve, reject) => {
                        try {
                            resolve(config_1.config.get(config_1.Keys.AuthToken));
                        }
                        catch (err) {
                            reject(err);
                        }
                    }),
                    this.rpc.connect(this.clientId),
                ]);
            }
            catch (err) {
                console.error(err);
                $MM.setSettingsStatus("status", "Disconnected; couldn't find Discord running");
                throw err;
            }
            if (authToken && typeof authToken === "string") {
                $MM.setSettingsStatus("status", "Logging in with existing credentials...");
                try {
                    yield this.rpc.login({
                        clientId: this.clientId,
                        accessToken: authToken,
                        scopes: DiscordApi.scopes,
                    });
                }
                catch (err) {
                    console.warn("Failed to authorise using existing token; stripping from config");
                    config_1.config.delete(config_1.Keys.AuthToken);
                }
            }
            const isAuthed = Boolean(this.rpc.application);
            if (!isAuthed) {
                try {
                    yield this.authorize();
                }
                catch (err) {
                    console.error(err);
                    return $MM.setSettingsStatus("status", "User declined authorisation; cannot continue.");
                }
            }
            this.rpc.subscribe("VOICE_SETTINGS_UPDATE", (data) => {
                this.sync(data);
            });
            $MM.setSettingsStatus("status", "Syncing voice settings...");
            this.settings = yield this.rpc.getVoiceSettings();
            $MM.setSettingsStatus("status", "Connected");
            this.buttons = {
                // [DiscordButton.ToggleAutoThreshold]: new ButtonType(
                //   DiscordButton.ToggleAutoThreshold,
                //   {
                //     name: "Toggle auto threshold",
                //     active: this.settings.mode.auto_threshold,
                //   }
                // ).on("pressed", async () => {
                //   if (!this.settings) return;
                //   await this.rpc.setVoiceSettings({
                //     mode: {
                //       ...this.settings.mode,
                //       auto_threshold: !this.settings?.mode?.auto_threshold,
                //     },
                //   });
                // }),
                [DiscordButton.ToggleMute]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleMute, {
                    name: "Toggle mute",
                    active: Boolean(this.settings.mute),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const currentState = Boolean(((_a = this.settings) === null || _a === void 0 ? void 0 : _a.mute) || ((_b = this.settings) === null || _b === void 0 ? void 0 : _b.deaf));
                    const muted = !currentState;
                    /**
                     * If we're unmuting our mic, make sure to undeafen too.
                     */
                    const args = {
                        mute: muted,
                    };
                    if (!muted)
                        args.deaf = muted;
                    yield this.rpc.setVoiceSettings(args);
                })),
                [DiscordButton.ToggleDeafen]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleDeafen, {
                    name: "Toggle deafen",
                    active: Boolean(this.settings.deaf),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    yield this.rpc.setVoiceSettings({
                        deaf: !((_a = this.settings) === null || _a === void 0 ? void 0 : _a.deaf),
                    });
                })),
                [DiscordButton.ToggleSilenceWarning]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleSilenceWarning, {
                    name: "Toggle muted mic warning",
                    active: Boolean((_a = this.settings.silenceWarning) !== null && _a !== void 0 ? _a : this.settings.silence_warning),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    yield this.rpc.setVoiceSettings({
                        silenceWarning: !((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.silenceWarning) !== null && _b !== void 0 ? _b : this.settings.silence_warning),
                    });
                })),
                [DiscordButton.ToggleQos]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleQos, {
                    name: "Toggle QoS",
                    active: Boolean(this.settings.qos),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    yield this.rpc.setVoiceSettings({
                        qos: !((_a = this.settings) === null || _a === void 0 ? void 0 : _a.qos),
                    });
                })),
                [DiscordButton.ToggleNoiseSuppression]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleNoiseSuppression, {
                    name: "Toggle noise reduction",
                    active: Boolean((_b = this.settings.noiseSuppression) !== null && _b !== void 0 ? _b : this.settings.noise_suppression),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    yield this.rpc.setVoiceSettings({
                        noiseSuppression: !((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.noiseSuppression) !== null && _b !== void 0 ? _b : this.settings.noise_suppression),
                    });
                })),
                [DiscordButton.ToggleEchoCancellation]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleEchoCancellation, {
                    name: "Toggle echo cancellation",
                    active: Boolean((_c = this.settings.echoCancellation) !== null && _c !== void 0 ? _c : this.settings.echo_cancellation),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    yield this.rpc.setVoiceSettings({
                        echoCancellation: !((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.echoCancellation) !== null && _b !== void 0 ? _b : this.settings.echo_cancellation),
                    });
                })),
                [DiscordButton.ToggleAutomaticGainControl]: new midi_mixer_plugin_1.ButtonType(DiscordButton.ToggleAutomaticGainControl, {
                    name: "Toggle automatic gain control",
                    active: Boolean((_d = this.settings.automaticGainControl) !== null && _d !== void 0 ? _d : this.settings.automatic_gain_control),
                }).on("pressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    yield this.rpc.setVoiceSettings({
                        automaticGainControl: !((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.automaticGainControl) !== null && _b !== void 0 ? _b : this.settings.automatic_gain_control),
                    });
                })),
            };
            this.faders = {
                [DiscordFader.InputVolume]: new midi_mixer_plugin_1.Assignment(DiscordFader.InputVolume, {
                    name: "Input device",
                    muted: this.settings.mute,
                    throttle: 150,
                })
                    .on("mutePressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const currentState = Boolean(((_a = this.settings) === null || _a === void 0 ? void 0 : _a.mute) || ((_b = this.settings) === null || _b === void 0 ? void 0 : _b.deaf));
                    const muted = !currentState;
                    /**
                     * If we're unmuting our mic, make sure to undeafen too.
                     */
                    const args = {
                        mute: muted,
                    };
                    if (!muted)
                        args.deaf = muted;
                    yield this.rpc.setVoiceSettings(args);
                }))
                    .on("volumeChanged", (level) => __awaiter(this, void 0, void 0, function* () {
                    if (!this.faders)
                        return;
                    this.faders[DiscordFader.InputVolume].volume = level;
                    yield this.rpc.setVoiceSettings({
                        input: {
                            volume: level * 100,
                        },
                    });
                })),
                [DiscordFader.OutputVolume]: new midi_mixer_plugin_1.Assignment(DiscordFader.OutputVolume, {
                    name: "Output device",
                    muted: this.settings.deaf,
                    throttle: 150,
                })
                    .on("mutePressed", () => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    yield this.rpc.setVoiceSettings({
                        deaf: !((_a = this.settings) === null || _a === void 0 ? void 0 : _a.deaf),
                    });
                }))
                    .on("volumeChanged", (level) => __awaiter(this, void 0, void 0, function* () {
                    if (!this.faders)
                        return;
                    this.faders[DiscordFader.OutputVolume].volume = level;
                    yield this.rpc.setVoiceSettings({
                        output: {
                            volume: level * 200,
                        },
                    });
                })),
            };
            this.syncInterval = setInterval(() => void this.sync(), DiscordApi.syncGap);
            this.sync();
        });
    }
    /**
     * Authorize with Discord, providing scopes and requesting an access token for
     * future use.
     */
    authorize() {
        return __awaiter(this, void 0, void 0, function* () {
            $MM.setSettingsStatus("status", "Waiting for user authorisation...");
            yield this.rpc.login({
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                scopes: DiscordApi.scopes,
                redirectUri: "http://localhost/",
            });
            const accessToken = this.rpc.accessToken;
            if (!accessToken)
                throw new Error("Logged in, but not access token available");
            config_1.config.set(config_1.Keys.AuthToken, accessToken);
        });
    }
    sync(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = settings !== null && settings !== void 0 ? settings : (yield this.rpc.getVoiceSettings());
            const boolSettings = this.normaliseSettings(this.settings);
            console.log("Syncing settings from:", this.settings);
            if (this.buttons) {
                this.buttons[DiscordButton.ToggleAutomaticGainControl].active =
                    boolSettings.automaticGainControl;
                this.buttons[DiscordButton.ToggleEchoCancellation].active =
                    boolSettings.echoCancellation;
                this.buttons[DiscordButton.ToggleNoiseSuppression].active =
                    boolSettings.noiseSuppression;
                this.buttons[DiscordButton.ToggleQos].active = boolSettings.qos;
                this.buttons[DiscordButton.ToggleSilenceWarning].active =
                    boolSettings.silenceWarning;
                this.buttons[DiscordButton.ToggleDeafen].active = boolSettings.deaf;
                this.buttons[DiscordButton.ToggleMute].active =
                    boolSettings.mute || boolSettings.deaf;
            }
            if (this.faders) {
                this.faders[DiscordFader.InputVolume].muted =
                    boolSettings.mute || boolSettings.deaf;
                if (this.settings.input) {
                    this.faders[DiscordFader.InputVolume].volume =
                        this.settings.input.volume / 100;
                }
                this.faders[DiscordFader.OutputVolume].muted = boolSettings.deaf;
                if (this.settings.output) {
                    this.faders[DiscordFader.OutputVolume].volume =
                        this.settings.output.volume / 200;
                }
            }
        });
    }
    normaliseSettings(rawSettings) {
        var _a, _b, _c, _d;
        return Object.assign(Object.assign({}, rawSettings), { automaticGainControl: Boolean((_a = rawSettings.automaticGainControl) !== null && _a !== void 0 ? _a : rawSettings.automatic_gain_control), deaf: Boolean(rawSettings.deaf), echoCancellation: Boolean((_b = rawSettings.echoCancellation) !== null && _b !== void 0 ? _b : rawSettings.echo_cancellation), mute: Boolean(rawSettings.mute), noiseSuppression: Boolean((_c = rawSettings.noiseSuppression) !== null && _c !== void 0 ? _c : rawSettings.noise_suppression), qos: Boolean(rawSettings.qos), silenceWarning: Boolean((_d = rawSettings.silenceWarning) !== null && _d !== void 0 ? _d : rawSettings.silence_warning) });
    }
}
exports.DiscordApi = DiscordApi;
DiscordApi.scopes = [
    "rpc",
    "rpc.activities.write",
    "rpc.voice.read",
    "rpc.voice.write",
];
DiscordApi.syncGap = 1000 * 30;
