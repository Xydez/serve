#!/usr/bin/env node

import express from "express";
import { Logger, LogLevel } from "./Logger";
import fs from "fs";
import path from "path";
import { inspect } from "util";
import http from "http";

const logger = new Logger({ level: LogLevel.Debug });

async function main(): Promise<number>
{
	const PORT = 80;
	const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

	logger.debug(`Serving static files from '${PUBLIC_DIR}'`);

	const arg = process.argv[2];
	
	if (arg === undefined) {
		logger.fatal("No video file was specified. Args: " + inspect(process.argv));
		return -1;
	}

	const app = express();

	const file = path.resolve(arg);
	logger.info("Serving video file " + file);
	if (fs.existsSync(file) === false) {
		logger.warn(`Video file '${file}' doesn't exist`);
	}

	app.use((req, res, next) => {
		logger.trace(`${req.ip}: ${req.method} ${req.url}`);
		next();
	});

	app.use(express.static(PUBLIC_DIR));

	app.get("/stream", (req, res) => {
		try {
			const info = fs.statSync(file);
		
			if (req.headers.range) {
				const parts = req.headers.range.replace(/bytes=/, "").split("-");
				const start = Number.parseInt(parts[0]);
				const end = parts[1] ? Number.parseInt(parts[1]) : info.size - 1;
				const chunkSize = (end - start) + 1;

				const stream = fs.createReadStream(file, { start, end });
				const headers = {
					"Content-Range": `bytes ${start}-${end}/${info.size}`,
					"Accept-Ranges": "bytes",
					"Content-Length": chunkSize.toString(),
					"Content-Type": "video/mp4"
				};

				res.writeHead(206, headers);
				stream.pipe(res);
			} else {
				const headers = {
					"Content-Length": info.size.toString(),
					"Content-Type": "video/mp4"
				};

				res.writeHead(200, headers);
				fs.createReadStream(file).pipe(res);
			}
		} catch (error) {
			logger.error(error);
			res.sendStatus(500);
		}
	});

	let server: http.Server | null = null;

	await new Promise<void>((resolve, reject) => {
		server = app.listen(PORT, () => {
			logger.info(`Listening at http://localhost:${PORT}/`);
		}).on("close", () => {
			resolve();
		});
	});

	const termfn = () => {
		logger.info("Interrupt signal recieved");
		server.close();
	};

	process.on("SIGINT", termfn);
}

try {
	main().then(code => process.exit(code));
} catch (error) {
	logger.printStackTrace(error);
	process.exit(-1);
}
