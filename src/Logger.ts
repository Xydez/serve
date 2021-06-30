import chalk from "chalk";
import fs from "fs/promises";

export enum LogLevel {
	Trace, Debug, Info, Warn, Error, Fatal
}

type FormatFunction = (level: LogLevel, message: string, color: boolean) => string;

interface LoggerOptions {
	level?: LogLevel;
	format?: FormatFunction;
	file?: string | null;
}

export class Logger {
	private static defaultLoggerOptions = {
		level: LogLevel.Trace,
		format: Logger.defaultMessageFormat,
		file: null
	};

	private level: LogLevel;
	private format: FormatFunction;
	private file: string | null;

	constructor(options: LoggerOptions = {}) {
		this.level = options.level === undefined ? Logger.defaultLoggerOptions.level : options.level;
		this.format = options.format === undefined ? Logger.defaultLoggerOptions.format : options.format;
		this.file = options.file === undefined ? Logger.defaultLoggerOptions.file : options.file;
	}

	public log(level: LogLevel, message: string): void {
		if (level >= this.level) {
			const output = this.format(level, message, true);

			if (level >= LogLevel.Warn) {
				process.stderr.write(output);
			} else {
				process.stdout.write(output);
			}
		}

		if (this.file !== null) {
			const output = this.format(level, message, false);

			fs.open(this.file, "a").then(
				file => file.write(output).catch(
					error => this.printStackTrace(error)
				).finally(() => file.close()),
				error => this.printStackTrace(error)
			);
		}
	}

	public trace(message: string): void {
		this.log(LogLevel.Trace, message);
	}

	public debug(message: string): void {
		this.log(LogLevel.Debug, message);
	}

	public info(message: string): void {
		this.log(LogLevel.Info, message);
	}

	public warn(message: string): void {
		this.log(LogLevel.Warn, message);
	}

	public error(message: string): void {
		this.log(LogLevel.Error, message);
	}

	public fatal(message: string): void {
		this.log(LogLevel.Fatal, message);
	}

	public printStackTrace(error: Error | any) {
		if (error.hasOwnProperty("stack")) {
			this.fatal(error.stack);
		} else {
			this.fatal(error.toString());
		}
	}

	private static defaultMessageFormat(level: LogLevel, message: string, color: boolean): string {
		const now = new Date();
		// const time = ;

		const color_level = chalk.level;

		if (color === false) {
			chalk.level = 0;
		}

		let output;

		switch (level) {
		case LogLevel.Trace:	output = `${Logger.timestamp(now)} TRACE ${message}\n`; break;
		case LogLevel.Debug:	output = `${Logger.timestamp(now)} ${chalk.blue("DEBUG")} ${message}\n`; break;
		case LogLevel.Info:		output = `${Logger.timestamp(now)} ${chalk.green("INFO")}  ${message}\n`; break;
		case LogLevel.Warn:		output = `${Logger.timestamp(now)} ${chalk.yellow("WARN")}  ${message}\n`; break;
		case LogLevel.Error:	output = `${Logger.timestamp(now)} ${chalk.red("ERROR")} ${message}\n`; break;
		case LogLevel.Fatal:	output = Logger.timestamp(now) + chalk.red(` FATAL ${message}\n`); break;
		}

		chalk.level = color_level;

		return output;
	}

	private static timestamp(date: Date, format: "time" | "date" | "both" = "both"): string {
		const timeString = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
		
		const dateString = `${date.getFullYear().toString().padStart(4, "0")}-${date.getMonth().toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

		switch (format) {
		case "time":	return timeString;
		case "date":	return dateString;
		case "both":	return `${dateString} ${timeString}`;
		}
	}
}

export default new Logger();
