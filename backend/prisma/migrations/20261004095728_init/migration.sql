-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "courseId" INTEGER;

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tuitionFee" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
