-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_keywordId_fkey";

-- DropForeignKey
ALTER TABLE "TrendData" DROP CONSTRAINT "TrendData_keywordId_fkey";

-- DropIndex
DROP INDEX "Keyword_term_idx";

-- DropIndex
DROP INDEX "Keyword_userId_idx";

-- AddForeignKey
ALTER TABLE "TrendData" ADD CONSTRAINT "TrendData_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
