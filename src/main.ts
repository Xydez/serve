import express from "express";
import { Logger } from "./Logger";

const PORT = 80;

const logger = new Logger({ file: "latest.log" });
const app = express();
app.use((req, res, next) => {
	logger.trace(`${req.ip}: ${req.method} ${req.url}`);
	next();
});

app.listen(PORT, () => {
	logger.info(`Listening at http://localhost:${PORT}/`);
});
