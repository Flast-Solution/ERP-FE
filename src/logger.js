
function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

const serializeArgs = (args) => args.map((arg) => {
  if (typeof arg === "string") return arg;
  if (arg === null || arg === undefined) return String(arg);
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}).join(" ");

function log(level, ...args) {
  const timestamp = formatDate(new Date());
  const message = serializeArgs(args);
  console.log(`[${level}] ${timestamp} - ${message}`);
}

export const logger = {
  info: (...args) => log("INFO", ...args),
  warn: (...args) => log("WARN", ...args),
  error: (...args) => log("ERROR", ...args)
};

export default logger;
