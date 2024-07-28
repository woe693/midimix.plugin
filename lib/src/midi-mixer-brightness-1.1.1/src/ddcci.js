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
exports.getDDCCI = getDDCCI;
exports.refreshDdcciMonitorInfo = refreshDdcciMonitorInfo;
const util_1 = require("./util");
const ddcci = require("@hensm/ddcci");
function getDDCCI() {
    return ddcci;
}
function refreshDdcciMonitorInfo(monitors, monitorName) {
    return __awaiter(this, void 0, void 0, function* () {
        // If we are trying to refresh one monitor we need to return a value for it
        let refreshed = false;
        ddcci._refresh();
        let monitorList = ddcci.getMonitorList();
        console.log("DDC/CI monitors:", monitorList);
        for (const rawmon of monitorList) {
            try {
                let mon = rawmon;
                let info = mon.match("\#(.+?)\#.+\&(.+?)\#");
                if (info === null) {
                    log.info(`${mon} was not in the expected format`);
                    console.log(`${mon} was not in the expected format`);
                    continue;
                }
                let name = `${info[1]} ${info[2]}`;
                // If we are refreshing one monitor
                if (monitorName) {
                    if (monitorName !== name) {
                        continue;
                    }
                    // m.Assignment.remove();
                    monitors.delete(name);
                    console.log("Refreshing one monitor");
                }
                refreshed = true;
                let brightness = ddcci.getBrightness(mon);
                (0, util_1.createMonitorAssignment)(monitors, mon, name, brightness, "DDCCI", (level) => __awaiter(this, void 0, void 0, function* () {
                    let lev = Math.round(level * 100);
                    try {
                        ddcci.setBrightness(mon, lev);
                    }
                    catch (err) {
                        console.log(err);
                        log.error(err);
                        yield (0, util_1.refreshOneMonitor)(monitors, name, "DDCCI");
                    }
                }));
            }
            catch (e) {
                log.error(`Error in DDC/CI refresh with monitor ${rawmon}`, e);
                console.log(`Error in DDC/CI refresh with monitor ${rawmon}`, e);
            }
        }
        return refreshed;
    });
}
