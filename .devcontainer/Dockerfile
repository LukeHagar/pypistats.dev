FROM node:22

# Install pnpm via corepack; keep git available for typical workflows
# Also install native build deps required by node-canvas used for server-side chart rendering
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate \
  && apt-get update \
  && apt-get install -y \
    git \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpng-dev \
    libpixman-1-dev \
    pkg-config \
    python3 \
  && rm -rf /var/lib/apt/lists/*

USER node

WORKDIR /workspace


