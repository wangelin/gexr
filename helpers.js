function panic(message) {
	if (message) {
		console.error(message);
	}
	process.exit(1);
}

function color(str, r, g, b) {
	return `\x1b[38;2;${r};${g};${b}m${str}\x1b[0m`;
}

const colors = {
	red: [255, 0, 0],
	green: [0, 255, 0],
	blue: [0, 0, 255],
	yellow: [255, 255, 0],
	grey: [128, 128, 128],
	get error() {
		return this.red;
	},
	string(str, color) {
		let r, g, b;
		if (typeof color === "string") {
			[r, g, b] = this[color];
		}
		if (Array.isArray(color)) {
			[r, g, b] = color;
		}
		if (r === undefined || g === undefined || g === undefined) return str;
		// https://simplernerd.com/js-console-colors/
		return `\x1b[38;2;${r};${g};${b}m${str}\x1b[0m`;
	},
	log(...args) {
		console.log(this.string(...args));
	},
};

module.exports = {
	panic,
	color,
	colors,
};
