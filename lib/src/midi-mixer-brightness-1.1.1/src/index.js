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
const midi_mixer_plugin_1 = require("midi-mixer-plugin");
const util_1 = require("./util");
let monitors = new Map();
let refreshButton = new midi_mixer_plugin_1.ButtonType("Refresh Monitors", {
    name: "Refresh Monitor List",
    active: true,
});
refreshButton.on("pressed", () => {
    (0, util_1.refreshMonitors)(monitors);
});
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.refreshMonitors)(monitors);
    });
}
init();
