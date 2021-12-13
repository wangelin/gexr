#!/usr/bin/env node --no-warnings

const fs = require("fs");
const readline = require("readline");

const { argumentParser, printUsage } = require("./argumentParser.js");
const { panic, color, colors } = require("./helpers.js");

const { args, ...options } = argumentParser(process.argv.slice(2));

if (options.help) {
	printUsage();
	process.exit();
}

const cases = args;

let fileName =
	process.argv.length > 2 && cases.length > 0 && cases[cases.length - 1];
if (!fileName || !fs.existsSync(fileName)) {
	fileName = undefined;
}

const rePair = /^\s*([!x]{0,2})\s*\/(.*)\/([ig]*)\s*(.*?)\s*([\-]?)$/;
const runs = [];
if (options.skip) {
} else {
	for (const c of cases) {
		const result = rePair.exec(c);
		if (!result) {
			panic(`Invalid case: ${c}`);
		}
		let [, saction, sre, smod, sout] = result;
		for (const [vr, val] of options.vars || []) {
			sout = sout.replace(vr, val);
		}
		const del = /x/.test(saction);
		const dont_match = /!/.test(saction);
		let re;
		try {
			re = new RegExp(sre.trim().replace(/^\/(.*)\/$/, "$1"), smod);
		} catch (e) {
			panic(`Invalid regular expression: /${sre.trim()}/${smod}`);
		}
		let fun;
		try {
			if (sout.trim() === "." || sout.trim() === "") sout = "p=>p";
			fun = new Function(`return ${sout}`)();
		} catch (err) {
			fun = new Function(`return "${sout}"`)();
		}
		runs.push({ re, fun, del, dont_match });
	}
}

if (fileName && options.vars) {
	for (const [vr, val] of options.vars) {
		fileName = fileName.replace(vr, val);
	}
}

const maxLines = options.lines ? parseInt(options.lines, 10) : Infinity;
let count = 0;
const input = fileName ? fs.createReadStream(fileName) : process.stdin;
const rl = readline.createInterface({
	input,
	crlfDelay: Infinity,
});

const DEFAULT_INPUT_TIMEOUT = 5_000;

let timeout = DEFAULT_INPUT_TIMEOUT;
if (options.timeout !== undefined) {
	timeout = options.timeout;
}
let gottenInput = false;
let timeout_;
if (timeout > 0) {
	timeout_ = setTimeout(() => {
		if (!gottenInput) {
			if (options.debug) {
				colors.log(
					`GOT NO INPUT, TIMEOUT SET TO ${
						timeout === DEFAULT_INPUT_TIMEOUT ? "DEFAULT TIMEOUT OF " : ""
					}${timeout}ms`,
					"blue"
				);
			}
			panic("");
		}
	}, timeout);
}

if (options.debug) {
	colors.log("RUNNING IN DEBUG MODE", "blue");
}

rl.on("line", (line) => {
	if (timeout_) clearTimeout(timeout_);
	if (!gottenInput) gottenInput = true;
	if (options.skip) {
		console.log(line);
		return;
	}
	if (++count > maxLines) {
		rl.close();
		return;
	}
	let updated = false;
	let deleted = false;
	if (runs.length > 0) {
		for (const { re, fun, del, dont_match } of runs) {
			const match = re.test(line);
			if (!dont_match && match) {
				if (del) {
					deleted = true;
					if (options.debug) {
						colors.log(line, "error");
					}
					break;
				} else {
					updated = true;
					if (options.debug) {
						colors.log(line, "grey");
					}
					line = line.replace(re, fun);
				}
			} else if (dont_match && !match) {
				deleted = true;
				if (options.debug) {
					colors.log(line, "error");
				}
				break;
			}
		}
	}

	if (options.deleteEmpty && line.trim() === "") {
		if (options.debug) {
			colors.log("[EMPTY ROW]", "red");
		}
	} else if (!deleted) {
		if (options.deleteEmpty && line.trim() === "") {
			// remove empty lines
		} else {
			colors.log(line, updated && options.debug && "yellow");
		}
	}
});
rl.on("close", function handleClose() {
	if (options.debug) {
		colors.log(`FINISHED READING ${count} LINES`, "blue");
	}
});
