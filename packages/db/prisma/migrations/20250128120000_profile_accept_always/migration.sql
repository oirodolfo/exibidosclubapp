-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "acceptFollowRequestsAlways" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "acceptMessageRequestsAlways" BOOLEAN NOT NULL DEFAULT true;
