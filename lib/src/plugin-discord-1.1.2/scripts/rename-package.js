"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const package_json_1 = require("../package.json");
const baseName = [package_json_1.name, package_json_1.version].join("-");
const expectedName = `${baseName}.tgz`;
const targetName = `${baseName}.midiMixerPlugin`;
(0, fs_1.renameSync)(expectedName, targetName);
