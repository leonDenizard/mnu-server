-- `shortId` is the persistent MVP link. Keep the legacy hash column only for
-- historical rows, but make it optional so new links do not need a hash.
ALTER TABLE "CustomerAccessLink"
ALTER COLUMN "shortIdHash" DROP NOT NULL;
