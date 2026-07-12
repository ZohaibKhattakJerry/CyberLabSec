/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({ url: "./prisma/cyberlabsec.db" });

const prisma = new PrismaClient({ adapter, log: ["error"] });
prisma.jobPosting.findFirst().then(console.log).catch(console.error);
