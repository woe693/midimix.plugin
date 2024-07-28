"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const package_json_1 = require("../package.json");
const plugin_json_1 = __importDefault(require("../plugin.json"));
(0, fs_1.writeFileSync)("plugin.json", JSON.stringify(Object.assign(Object.assign({}, plugin_json_1.default), { version: package_json_1.version }), null, 2));
