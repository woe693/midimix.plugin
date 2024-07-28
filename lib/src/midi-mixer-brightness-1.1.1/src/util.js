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
exports.refreshMonitors = refreshMonitors;
exports.createMonitorAssignment = createMonitorAssignment;
exports.refreshOneMonitor = refreshOneMonitor;
const midi_mixer_plugin_1 = require("midi-mixer-plugin");
const ddcci_1 = require("./ddcci");
const wmi_1 = require("./wmi");
;
function refreshMonitors(monitors) {
    return __awaiter(this, void 0, void 0, function* () {
        monitors.clear();
        yield (0, ddcci_1.refreshDdcciMonitorInfo)(monitors);
        yield (0, wmi_1.refreshWmiMonitorInfo)(monitors);
        $MM.setSettingsStatus("brightnessStatus", `${monitors.size} monitor(s) detected`);
        $MM.showNotification("Refreshed Brightness plugin monitor list");
    });
}
function createMonitorAssignment(monitors, id, name, initial, protocol, volumeCallback, throttle = 50) {
    let m = {
        Id: id,
        Name: name,
        Assignment: new midi_mixer_plugin_1.Assignment(`Brightness ${name}`, {
            name: name,
            muted: true, // light up the mute button
            volume: initial / 100,
            throttle: throttle,
            assigned: true,
        }),
        InitialBrightness: initial,
        protocol
    };
    m.Assignment.on("volumeChanged", (level) => {
        volumeCallback(level);
        m.Assignment.volume = level;
    });
    m.Assignment.on("mutePressed", () => {
        // Reset back to initial/default brightness
        m.Assignment.emit("volumeChanged", (m.InitialBrightness / 100));
    });
    monitors.set(m.Name, m);
}
function refreshOneMonitor(monitors, name, protocol) {
    return __awaiter(this, void 0, void 0, function* () {
        let found = false;
        if (protocol === "DDCCI") {
            found = yield (0, ddcci_1.refreshDdcciMonitorInfo)(monitors, name);
        }
        else if (protocol === "WMI") {
            found = yield (0, wmi_1.refreshWmiMonitorInfo)(monitors, name);
        }
        if (!found) {
            console.log("Could not refresh monitor");
        }
    });
}
// Until any of thee below features are implemented this is not useful.
/*
async function createMainControl() {
  // average monitors to get default brightness
  // could keep these offsets?
  // with the addition of multi-assignments, this is not very useful without keeping offsets
  // being able to update settings fields from the plugin would make this more useful
  // e.g.
  // - detect 3 monitors
  // - add a field to settings for default (and offset) for each monitor
  // - user can set their preferences for each monitor there
  let sum = 0;
  for (const m of monitors) {
    sum += m[1].Assignment.volume;
  }
  let avg = sum / monitors.size;

  mainControl = {
    Id: "Main control",
    Name: "Main Control",
    Assignment: new Assignment("Main Control", {
      name: "Main Control",
      muted: true,
      volume: avg,
    }),
    InitialBrightness: avg * 100,
  };

  mainControl.Assignment.on("volumeChanged", (level: number) => {
    mainControl.Assignment.volume = level;
    monitors.forEach((v, k) => {
      v.Assignment.emit("volumeChanged", level);
    });
  });

  mainControl.Assignment.on("mutePressed", () => {
    mainControl.Assignment.volume = mainControl.InitialBrightness / 100;
    monitors.forEach((v, k) => {
      v.Assignment.emit("mutePressed");
    })
  });
}
*/
