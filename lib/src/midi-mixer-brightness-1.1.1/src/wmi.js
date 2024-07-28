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
exports.refreshWmiMonitorInfo = refreshWmiMonitorInfo;
const node_powershell_1 = require("node-powershell");
const util_1 = require("./util");
const ps = new node_powershell_1.PowerShell({
    debug: false,
    executableOptions: {
        '-ExecutionPolicy': 'Bypass',
        '-NoProfile': true,
    },
});
function refreshWmiMonitorInfo(monitors, monitorName) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        let refreshed = false;
        let cmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness -Property InstanceName,Active,CurrentBrightness) | ConvertTo-Json`;
        try {
            let r = yield ps.invoke(cmd);
            let s = (_b = (_a = r.stdout) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "{}";
            // May be one or many PsMonitor objects
            let mons = JSON.parse(s);
            if (!Array.isArray(mons)) {
                console.log("Converting single WMI monitor to array");
                mons = [mons];
            }
            for (let mon of mons) {
                if (mon.Active) {
                    let info = mon.InstanceName.match(/\\(.+?)\\.+\&(.+?)_0/);
                    if (info === null) {
                        log.info(`${mon} was not in the expected format`);
                        console.log(`${mon} was not in the expected format`);
                        continue;
                    }
                    let name = `${info[1]} ${info[2]} WMI`;
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
                    (0, util_1.createMonitorAssignment)(monitors, mon.InstanceName, name, mon.CurrentBrightness, "WMI", (level) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield setWMIBrightness(mon.InstanceName, level);
                        }
                        catch (err) {
                            console.log(err);
                            log.error(err);
                            yield (0, util_1.refreshOneMonitor)(monitors, name, "WMI");
                        }
                    }));
                }
            }
        }
        catch (err) {
            // Err here likely caused by unsupported WMI platform. Fine to ignore
            console.log(err);
        }
        return refreshed;
    });
}
function setWMIBrightness(id, level) {
    return __awaiter(this, void 0, void 0, function* () {
        let lev = Math.round(level * 100);
        let escapedId = id.replace(/\\/g, '\\\\');
        const cmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -Filter "InstanceName='${escapedId}'").WmiSetBrightness(0, ${lev})`;
        yield ps.invoke(cmd);
        // On success no important return value
    });
}
