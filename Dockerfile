FROM oven/bun:1.3.0

# Install deps needed by Prisma and shell
RUN apt-get update && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Prisma requires DATABASE_URL to be present for `prisma generate`, but it does not need
# to be a real/secret DSN during image build. The runtime value is provided via env.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"

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

EXPOSE 3000

# Ensure the server binds externally in container environments
ENV HOST=0.0.0.0
ENV PORT=3000

# Basic container healthcheck (no extra OS deps required)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Default command can be overridden by compose
CMD ["bun", "run", "build/index.js"]


