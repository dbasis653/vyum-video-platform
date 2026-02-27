/*
  Warnings:

  - Added the required column `userId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Video` table without a default value. This is not possible if the table is not empty.

  Fix: Existing dev rows are orphaned (no owner). Deleting them so the NOT NULL
  userId column can be added cleanly. Production would use a proper data migration.
*/

-- Clear orphaned dev data before adding the NOT-NULL userId column
DELETE FROM "Image";
DELETE FROM "Video";

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT NOT NULL DEFAULT '/images/default-avatar.png',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
