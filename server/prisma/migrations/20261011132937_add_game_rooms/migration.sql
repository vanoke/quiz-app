-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "quizId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT -1,
    CONSTRAINT "Room_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "RoomPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerIds" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomAnswer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "RoomPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlayer_roomId_userId_key" ON "RoomPlayer"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAnswer_playerId_questionId_key" ON "RoomAnswer"("playerId", "questionId");
