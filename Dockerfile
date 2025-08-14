FROM node:latest

# Install deps needed by Prisma and shell
RUN apt-get update && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for better cache
COPY package.json pnpm-lock.yaml* ./

# Enable and use pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Generate Prisma client and build SvelteKit (Node adapter)
RUN pnpm prisma generate && pnpm prisma migrate deploy

RUN pnpm build

ENV NODE_ENV=production

EXPOSE 3000

# Default command can be overridden by compose
CMD ["node", "build/index.js"]


