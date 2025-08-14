-- CreateTable
CREATE TABLE "public"."recent" (
    "package" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "downloads" BIGINT NOT NULL,

    CONSTRAINT "recent_pkey" PRIMARY KEY ("package","category")
);

-- CreateTable
CREATE TABLE "public"."overall" (
    "date" DATE NOT NULL,
    "package" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL,

    CONSTRAINT "overall_pkey" PRIMARY KEY ("date","package","category")
);

-- CreateTable
CREATE TABLE "public"."python_major" (
    "date" DATE NOT NULL,
    "package" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL,

    CONSTRAINT "python_major_pkey" PRIMARY KEY ("date","package","category")
);

-- CreateTable
CREATE TABLE "public"."python_minor" (
    "date" DATE NOT NULL,
    "package" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL,

    CONSTRAINT "python_minor_pkey" PRIMARY KEY ("date","package","category")
);

-- CreateTable
CREATE TABLE "public"."system" (
    "date" DATE NOT NULL,
    "package" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL,

    CONSTRAINT "system_pkey" PRIMARY KEY ("date","package","category")
);

-- CreateTable
CREATE TABLE "public"."installer" (
    "date" DATE NOT NULL,
    "package" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL,

    CONSTRAINT "installer_pkey" PRIMARY KEY ("date","package","category")
);
