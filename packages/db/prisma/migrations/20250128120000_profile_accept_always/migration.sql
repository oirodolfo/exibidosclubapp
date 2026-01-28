-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "acceptFollowRequestsAlways" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acceptMessageRequestsAlways" BOOLEAN NOT NULL DEFAULT false;
