const { panic } = require("./helpers.js");

const BOOLEAN = Symbol("BOOL");
const NUMBER = Symbol("NUMBER");
const STRING = Symbol("STRING");

const typeError = {
	[NUMBER]: (input) => `Invalid number: ${input}`,
};

const validArgs = [
	{ name: "help", flags: ["h", "help"], type: BOOLEAN },
	{ name: "debug", flags: ["d", "debug"], type: BOOLEAN },
	{
		name: "vars",
		flags: ["v", "vars"],
		type: STRING,
		error: {
			format: "Vars must be in format param=value[;paramN=valueN]",
			bool: "Vars cannot be a boolean value, must be last in flag string.",
		},
	},
	{ name: "skip", flags: ["s", "skip"], type: BOOLEAN },
	{ name: "lines", flags: ["l", "lines"], type: NUMBER },
	{ name: "timeout", flags: ["t", "timeout"], type: NUMBER },
	{ name: "deleteEmpty", flags: ["e", "delete-empty"], type: BOOLEAN },
];

function printUsage(fn = console.log) {
	fn("Usage:");
	fn("> gexr [[flags] | [flag and value]  [runs]] filename");
}

function argumentParser(args) {
	const parsed = { args: [] };

	function setNumber(arg, next) {
		let number = parseFloat(next);
		if (isNaN(number)) {
			panic(typeError[NUMBER](next));
		}
		parsed[arg.name] = number;
	}

	function setVars(arg, next) {
		if (next.startsWith("-")) {
			console.error(arg.error.format);
			process.exit(1);
		}
		const vars = next
			.replace(/^["']?(.+)["']$/, "$1")
			.split(";")
			.map((x) => x.split("="))
			.filter((x) => x.length === 2 && x[0].length > 0 && x[1].length > 0);
		if (vars.length === 0) console.error(arg.error.format);
		parsed[arg.name] = vars;
	}

	function setLength(arg, next) {}

	for (let i = 0; i < args.length; i++) {
		const item = args[i];
		const next = args[i + 1];
		if (item.startsWith("--")) {
			const sArg = item.slice(2);
			if (!sArg) panic("Missing flag");
			const arg = validArgs.find((x) =>
				x.flags.filter((y) => y.length > 1).includes(sArg)
			);
			if (!arg) {
				panic(`Invalid flag: ${sArg}`);
			} else if (arg.type === BOOLEAN) {
				parsed[arg.name] = true;
			} else if (arg.type === NUMBER) {
				setNumber(arg, next);
				i++;
			} else if (arg.name === "vars") {
				setVars(arg, next);
				i++;
			} else {
				panic(`No rule for ${sArg} flag`);
			}
		} else if (item.startsWith("-")) {
			const sArg = item.slice(1);
			if (!sArg) panic("Missing flag");
			for (const flag of sArg) {
				const arg = validArgs.find((x) =>
					x.flags.filter((y) => y.length === 1).includes(flag)
				);
				if (!arg) {
					panic(`Invalid flag: '${flag}'`);
				} else if (arg.type === BOOLEAN) {
					parsed[arg.name] = true;
				} else if (arg.type === NUMBER) {
					setNumber(arg, next);
					i++;
				} else if (arg.name === "vars") {
					if (!sArg.endsWith(flag)) {
						console.error(arg.error.bool);
						process.exit(1);
					}
					setVars(arg, next);
					i++;
				} else {
					panic(`No rule for ${flag} flag`);
				}
			}
		} else {
			parsed.args.push(item);
		}
	}
	return parsed;
}

module.exports = {
	validArgs,
	printUsage,
	argumentParser,
};
