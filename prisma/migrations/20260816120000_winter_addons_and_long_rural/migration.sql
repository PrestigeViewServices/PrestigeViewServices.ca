-- AlterEnum
-- Long rural lane-ways are priced separately from car-count sizes.
ALTER TYPE "DrivewaySize" ADD VALUE 'LONG_RURAL';

-- AlterTable
-- Multi-select add-ons captured by the /winter-packages package selector.
ALTER TABLE "WinterReservation" ADD COLUMN     "saltingAddOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ridgePriority" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "veteranDiscount" BOOLEAN NOT NULL DEFAULT false;
