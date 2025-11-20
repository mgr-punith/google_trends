/*
  Warnings:

  - A unique constraint covering the columns `[keywordId,timestamp]` on the table `TrendData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TrendData_keywordId_timestamp_key" ON "TrendData"("keywordId", "timestamp");
