FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test", "--project=chromium"]
