FROM oven/bun:latest

# Install deps needed by Prisma and shell
RUN apt-get update && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Provide DATABASE_URL during build via build-arg
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Copy package manifests first for better cache
COPY package.json bun.lockb* ./

# Install dependencies (include devDependencies needed for build)
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Generate Prisma client and build SvelteKit (Node adapter)
RUN bun run prisma generate

# Make sure SvelteKit has synced types/config now that config files are present
RUN bun run prepare

RUN bun run build

ENV NODE_ENV=production

# Default command can be overridden by compose
CMD ["bun", "run", "build/index.js"]


