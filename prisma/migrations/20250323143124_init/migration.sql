-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL,
    "own_user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "remark" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "attachments_path" JSONB,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "creation_time" TIMESTAMPTZ(6) NOT NULL,
    "update_time" TIMESTAMPTZ(6) NOT NULL,
    "tag" VARCHAR[],
    "scheduled_task_time" TIMESTAMPTZ(6),
    "rrule" TEXT,

    CONSTRAINT "id" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "salt" CHAR(32) NOT NULL,
    "password" CHAR(64) NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "creation_time" TIMESTAMPTZ(6) NOT NULL,
    "certification_information_modification_time" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_pk" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_pk_2" ON "user"("email");
