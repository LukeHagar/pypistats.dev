FROM node:latest

# Install deps needed by Prisma and shell
RUN apt-get update && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Provide DATABASE_URL during build via build-arg
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Copy package manifests first for better cache
COPY package.json pnpm-lock.yaml* ./

# Enable and use pnpm via corepack
RUN corepack enable && corepack prepare pnpm@@10.14.0 --activate

# Install dependencies (include devDependencies needed for build)
RUN pnpm install --frozen-lockfile --prod=false

# Copy the rest of the source
COPY . .

# Generate Prisma client and build SvelteKit (Node adapter)
RUN pnpm prisma generate

# Make sure SvelteKit has synced types/config now that config files are present
RUN pnpm run prepare

RUN pnpm build

ENV NODE_ENV=production

EXPOSE 3000

# Default command can be overridden by compose
CMD ["node", "build/index.js"]


