-- CreateTable
CREATE TABLE "Moderator" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleActive" TEXT,
    "roleDefault" TEXT
);

-- CreateTable
CREATE TABLE "ModeratorGuild" (
    "moderatorId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,

    PRIMARY KEY ("moderatorId", "guildId"),
    CONSTRAINT "ModeratorGuild_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Moderator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModeratorGuild_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
